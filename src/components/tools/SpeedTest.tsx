import { useState, useCallback, useEffect } from 'react';
import { Gauge, Download, Upload, Clock, Play, RotateCcw, History, Trash2, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SpeedResult {
  download: number;
  upload: number;
  ping: number;
  jitter: number;
  timestamp: number;
}

interface HistoryEntry extends SpeedResult {
  id: string;
}

// Measured against Cloudflare's public speed test service (speed.cloudflare.com),
// which allows any website to use it (CORS *). Before 28 Nov 2026 this tool used
// small CDN files that our Content-Security-Policy blocked, so everyone got 0 Mbps,
// and the upload figure was a random guess. Nothing is guessed now.
const CF = "https://speed.cloudflare.com";
// Sizes grow until one request takes long enough to measure well. We stop early on
// slow lines so a test never eats much mobile data.
const DOWN_SIZES = [100_000, 1_000_000, 5_000_000, 15_000_000]; // at most ~21 MB
const UP_SIZES = [100_000, 1_000_000, 4_000_000]; // at most ~5 MB
const ENOUGH_SECONDS = 2.5; // a request this long is a good measurement: stop growing
const MAX_TOTAL_SECONDS = 12; // never run a phase longer than this

const mbps = (bytes: number, seconds: number) => (seconds > 0 ? (bytes * 8) / seconds / 1_000_000 : 0);

export function SpeedTest({ className }: { className?: string }) {
  const [testing, setTesting] = useState(false);
  const [currentTest, setCurrentTest] = useState<'ping' | 'download' | 'upload' | null>(null);
  const [result, setResult] = useState<SpeedResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dataUsedMB, setDataUsedMB] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('speed_test_history');
      if (stored) setHistory(JSON.parse(stored));
    } catch { /* storage blocked */ }
  }, []);

  const saveHistory = (entry: SpeedResult) => {
    const newEntry: HistoryEntry = { ...entry, id: Date.now().toString() };
    const updated = [newEntry, ...history].slice(0, 20);
    setHistory(updated);
    try { localStorage.setItem('speed_test_history', JSON.stringify(updated)); } catch { /* storage blocked */ }
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem('speed_test_history'); } catch { /* storage blocked */ }
  };

  const measurePing = async (): Promise<{ ping: number; jitter: number }> => {
    const pings: number[] = [];
    for (let i = 0; i < 8; i++) {
      try {
        const start = performance.now();
        const r = await fetch(`${CF}/__down?bytes=0&_=${Date.now()}_${i}`, { cache: "no-store" });
        await r.arrayBuffer();
        pings.push(performance.now() - start);
      } catch {
        // skip this sample
      }
    }
    if (pings.length === 0) return { ping: 0, jitter: 0 };
    // The first request also opens the connection, so drop it when we can.
    const samples = pings.length > 3 ? pings.slice(1) : pings;
    const sorted = [...samples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    let jitterSum = 0;
    for (let i = 1; i < samples.length; i++) jitterSum += Math.abs(samples[i] - samples[i - 1]);
    const jitter = samples.length > 1 ? jitterSum / (samples.length - 1) : 0;
    return { ping: Math.round(median), jitter: Math.round(jitter) };
  };

  const measureDownload = async (onProgress: (speed: number, pct: number) => void): Promise<{ speed: number; bytes: number }> => {
    let last = 0;
    let usedBytes = 0;
    const phaseStart = performance.now();
    for (let i = 0; i < DOWN_SIZES.length; i++) {
      try {
        const res = await fetch(`${CF}/__down?bytes=${DOWN_SIZES[i]}&_=${Date.now()}`, { cache: "no-store" });
        if (!res.ok || !res.body) break;
        const reader = res.body.getReader();
        const t0 = performance.now(); // headers are in: time only the data transfer
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          got += value.length;
          const sec = (performance.now() - t0) / 1000;
          if (sec > 0.05) onProgress(mbps(got, sec), ((i + got / DOWN_SIZES[i]) / DOWN_SIZES.length) * 100);
        }
        const sec = (performance.now() - t0) / 1000;
        usedBytes += got;
        // Keep the LAST (largest) sample: sizes grow until one is long enough to
        // measure well, and a tiny first request can be served from a buffer.
        last = mbps(got, sec);
        if (sec >= ENOUGH_SECONDS || (performance.now() - phaseStart) / 1000 >= MAX_TOTAL_SECONDS) break;
      } catch {
        break;
      }
    }
    return { speed: last, bytes: usedBytes };
  };

  const measureUpload = async (
    pingMs: number,
    onProgress: (speed: number, pct: number) => void,
  ): Promise<{ speed: number; bytes: number }> => {
    let last = 0;
    let usedBytes = 0;
    const phaseStart = performance.now();
    for (let i = 0; i < UP_SIZES.length; i++) {
      try {
        // Random bytes so nothing on the way can compress them.
        const data = new Uint8Array(UP_SIZES[i]);
        for (let off = 0; off < data.length; off += 65536) {
          crypto.getRandomValues(data.subarray(off, Math.min(off + 65536, data.length)));
        }
        const t0 = performance.now();
        const res = await fetch(`${CF}/__up`, { method: "POST", body: data, cache: "no-store" });
        await res.arrayBuffer();
        if (!res.ok) break;
        // Take away one round trip (the reply), but never more than half the time.
        const raw = (performance.now() - t0) / 1000;
        const sec = Math.max(raw - pingMs / 1000, raw / 2);
        usedBytes += UP_SIZES[i];
        last = mbps(UP_SIZES[i], sec);
        onProgress(last, ((i + 1) / UP_SIZES.length) * 100);
        if (raw >= ENOUGH_SECONDS || (performance.now() - phaseStart) / 1000 >= MAX_TOTAL_SECONDS) break;
      } catch {
        break;
      }
    }
    return { speed: last, bytes: usedBytes };
  };

  const runSpeedTest = useCallback(async () => {
    setTesting(true);
    setResult(null);
    setProgress(0);
    setLiveSpeed(0);

    const results: SpeedResult = { download: 0, upload: 0, ping: 0, jitter: 0, timestamp: Date.now() };

    // Phase 1: Ping test
    setCurrentTest('ping');
    setProgress(5);
    const pingResult = await measurePing();
    results.ping = pingResult.ping;
    results.jitter = pingResult.jitter;
    setProgress(15);

    // Phase 2: Download test
    setCurrentTest('download');
    const down = await measureDownload((speed, pct) => {
      setLiveSpeed(Math.round(speed * 10) / 10);
      setProgress(15 + (pct / 100) * 50);
    });
    results.download = Math.round(down.speed * 10) / 10;
    setProgress(65);

    // Phase 3: Upload test
    setCurrentTest('upload');
    const up = await measureUpload(results.ping, (speed, pct) => {
      setLiveSpeed(Math.round(speed * 10) / 10);
      setProgress(65 + (pct / 100) * 30);
    });
    // A failed upload shows 0 with a note. We never make a number up.
    results.upload = Math.round(up.speed * 10) / 10;
    setDataUsedMB(Math.round(((down.bytes + up.bytes) / 1_000_000) * 10) / 10);
    setFailed(results.download === 0);
    setProgress(100);

    setResult(results);
    saveHistory(results);
    setCurrentTest(null);
    setTesting(false);
    setLiveSpeed(0);
  }, [history]);

  const getSpeedLabel = (speed: number) => {
    if (speed >= 100) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500' };
    if (speed >= 50) return { label: 'Good', color: 'text-blue-500', bg: 'bg-blue-500' };
    if (speed >= 20) return { label: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    if (speed >= 5) return { label: 'Slow', color: 'text-orange-500', bg: 'bg-orange-500' };
    return { label: 'Very Slow', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const getPingLabel = (ping: number) => {
    if (ping <= 20) return { label: 'Excellent', color: 'text-green-500' };
    if (ping <= 50) return { label: 'Good', color: 'text-blue-500' };
    if (ping <= 100) return { label: 'Fair', color: 'text-yellow-500' };
    return { label: 'Poor', color: 'text-red-500' };
  };

  // Gauge component
  const SpeedGauge = ({ value, maxValue, label, unit, color }: {
    value: number; maxValue: number; label: string; unit: string; color: string;
  }) => {
    const percentage = Math.min(value / maxValue, 1);
    const angle = percentage * 180;
    const circumference = Math.PI * 70; // half circle
    const dashOffset = circumference * (1 - percentage);

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-36 h-20 overflow-hidden">
          <svg viewBox="0 0 160 85" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 10 80 A 70 70 0 0 1 150 80"
              fill="none"
              strokeWidth="10"
              className="stroke-muted"
              strokeLinecap="round"
            />
            {/* Value arc */}
            <path
              d="M 10 80 A 70 70 0 0 1 150 80"
              fill="none"
              strokeWidth="10"
              className={cn("transition-all duration-700", color)}
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
        </div>
        <span className="text-sm font-medium mt-1">{label}</span>
      </div>
    );
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Internet Speed Test</h2>
        </div>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-muted-foreground"
          >
            <History className="w-4 h-4 mr-1" />
            History ({history.length})
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center">
        {/* Idle State */}
        {!testing && !result && !showHistory && (
          <div className="text-center py-8">
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg viewBox="0 0 160 160" className="w-full h-full">
                <circle cx="80" cy="80" r="70" strokeWidth="6" className="fill-none stroke-muted" />
                <circle cx="80" cy="80" r="70" strokeWidth="6" className="fill-none stroke-primary/30" strokeDasharray="8 8" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Gauge className="w-12 h-12 text-primary mb-1" />
                <span className="text-xs text-muted-foreground">Ready</span>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              Measure your download speed, upload speed, and latency
            </p>
            <p className="text-xs text-muted-foreground mb-6 -mt-4">
              Uses up to about 26 MB of data on a fast line, much less on a slow one. On mobile data, that comes from your bundle.
            </p>
            <Button onClick={runSpeedTest} size="lg" className="px-8">
              <Play className="w-5 h-5 mr-2" /> Start Speed Test
            </Button>
          </div>
        )}

        {/* Testing State */}
        {testing && (
          <div className="text-center py-8 w-full">
            <div className="relative w-44 h-44 mx-auto mb-6">
              <svg viewBox="0 0 180 180" className="w-full h-full">
                {/* Outer track */}
                <circle cx="90" cy="90" r="80" strokeWidth="3" className="fill-none stroke-muted" />
                {/* Progress ring */}
                <circle
                  cx="90" cy="90" r="80" strokeWidth="6"
                  className="fill-none stroke-primary transition-all duration-300"
                  strokeDasharray={502.65}
                  strokeDashoffset={502.65 * (1 - progress / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 90 90)"
                />
                {/* Inner circle background */}
                <circle cx="90" cy="90" r="65" className="fill-primary/5" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {liveSpeed > 0 ? (
                  <>
                    <span className="text-3xl font-bold">{liveSpeed}</span>
                    <span className="text-xs text-muted-foreground">Mbps</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold">{progress}%</span>
                    <span className="text-xs text-muted-foreground">Progress</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p>
                {currentTest === 'ping' && 'Measuring latency...'}
                {currentTest === 'download' && 'Testing download speed...'}
                {currentTest === 'upload' && 'Testing upload speed...'}
              </p>
            </div>
            {/* Step indicators */}
            <div className="flex items-center justify-center gap-4 mt-4">
              {(['ping', 'download', 'upload'] as const).map((step) => (
                <div key={step} className={cn(
                  "flex items-center gap-1.5 text-xs",
                  currentTest === step ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    currentTest === step ? "bg-primary" :
                    (step === 'ping' && currentTest !== 'ping') ||
                    (step === 'download' && currentTest === 'upload') ? "bg-green-500" : "bg-muted"
                  )} />
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && !showHistory && (
          <div className="w-full space-y-6 animate-in fade-in duration-500">
            {failed && (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
                The test could not reach the speed test server. Check that you are online, turn off any ad blocker for this page, and try again.
              </p>
            )}
            {/* Gauges */}
            <div className="flex items-end justify-around py-4">
              <SpeedGauge
                value={result.download}
                maxValue={200}
                label="Download"
                unit="Mbps"
                color="stroke-green-500"
              />
              <SpeedGauge
                value={result.upload}
                maxValue={200}
                label="Upload"
                unit="Mbps"
                color="stroke-blue-500"
              />
            </div>

            {/* Detailed Results Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-4 bg-muted/50 rounded-xl border border-border">
                <Download className="w-5 h-5 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{result.download}</p>
                <p className="text-xs text-muted-foreground">Mbps Down</p>
                <p className={cn('text-xs mt-1 font-medium', getSpeedLabel(result.download).color)}>
                  {getSpeedLabel(result.download).label}
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl border border-border">
                <Upload className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{result.upload}</p>
                <p className="text-xs text-muted-foreground">Mbps Up</p>
                <p className={cn('text-xs mt-1 font-medium', getSpeedLabel(result.upload).color)}>
                  {getSpeedLabel(result.upload).label}
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl border border-border">
                <Clock className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{result.ping}</p>
                <p className="text-xs text-muted-foreground">ms Ping</p>
                <p className={cn('text-xs mt-1 font-medium', getPingLabel(result.ping).color)}>
                  {getPingLabel(result.ping).label}
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl border border-border">
                <Wifi className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{result.jitter}</p>
                <p className="text-xs text-muted-foreground">ms Jitter</p>
                <p className={cn('text-xs mt-1 font-medium',
                  result.jitter <= 10 ? 'text-green-500' :
                  result.jitter <= 30 ? 'text-yellow-500' : 'text-red-500'
                )}>
                  {result.jitter <= 10 ? 'Stable' : result.jitter <= 30 ? 'Moderate' : 'Unstable'}
                </p>
              </div>
            </div>

            {/* Speed Bar */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Download</span>
                  <span className="font-medium">{result.download} Mbps</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", getSpeedLabel(result.download).bg)}
                    style={{ width: `${Math.min((result.download / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Upload</span>
                  <span className="font-medium">{result.upload} Mbps</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", getSpeedLabel(result.upload).bg)}
                    style={{ width: `${Math.min((result.upload / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Tested with Cloudflare's speed test server{dataUsedMB !== null ? ` · this test used about ${dataUsedMB} MB of data` : ""}.
            </p>

            {/* What you can do */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <h4 className="font-medium text-sm mb-3">What can you do with this speed?</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <SpeedCapability label="4K Streaming" met={result.download >= 25} req="25+ Mbps" />
                <SpeedCapability label="HD Video Calls" met={result.download >= 10} req="10+ Mbps" />
                <SpeedCapability label="HD Streaming" met={result.download >= 5} req="5+ Mbps" />
                <SpeedCapability label="Online Gaming" met={result.ping <= 50} req="<50ms ping" />
                <SpeedCapability label="Cloud Gaming" met={result.download >= 35 && result.ping <= 40} req="35+ Mbps, <40ms" />
                <SpeedCapability label="Large Downloads" met={result.download >= 50} req="50+ Mbps" />
                <SpeedCapability label="Video Uploading" met={result.upload >= 10} req="10+ Mbps up" />
                <SpeedCapability label="Web Browsing" met={result.download >= 1} req="1+ Mbps" />
              </div>
            </div>

            <Button onClick={runSpeedTest} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" /> Test Again
            </Button>
          </div>
        )}

        {/* History View */}
        {showHistory && (
          <div className="w-full space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Test History</h3>
              {history.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory} className="text-red-500 hover:text-red-600">
                  <Trash2 className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No test history yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="text-xs text-muted-foreground min-w-[100px]">
                      {formatDate(entry.timestamp)}
                    </div>
                    <div className="flex items-center gap-1 text-green-500">
                      <Download className="w-3 h-3" />
                      <span className="font-medium">{entry.download}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-500">
                      <Upload className="w-3 h-3" />
                      <span className="font-medium">{entry.upload}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{entry.ping}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setShowHistory(false)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={() => { setShowHistory(false); runSpeedTest(); }} className="flex-1">
                <Play className="w-4 h-4 mr-2" /> New Test
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SpeedCapability({ label, met, req }: { label: string; met: boolean; req: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-md",
      met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
    )}>
      <span className="text-base">{met ? '\u2713' : '\u2717'}</span>
      <div>
        <p className="font-medium text-xs">{label}</p>
        <p className="text-[10px] opacity-70">{req}</p>
      </div>
    </div>
  );
}

export default SpeedTest;
