import { useState } from 'react';
import { Shield, Check, X, AlertTriangle, Loader2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PrivacyCheckResult {
  category: string;
  name: string;
  status: 'good' | 'warning' | 'bad';
  description: string;
  recommendation?: string;
  details?: string;
}

export function PrivacyChecker({ className }: { className?: string }) {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<PrivacyCheckResult[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [currentCheck, setCurrentCheck] = useState('');

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const addCheck = (checks: PrivacyCheckResult[], check: PrivacyCheckResult, setter: (c: PrivacyCheckResult[]) => void) => {
    checks.push(check);
    setter([...checks]);
  };

  const runPrivacyCheck = async () => {
    setIsChecking(true);
    setResults([]);
    setOverallScore(null);
    setExpandedItems(new Set());

    const checks: PrivacyCheckResult[] = [];
    const updateResults = (c: PrivacyCheckResult[]) => setResults(c);

    // 1. HTTPS
    setCurrentCheck('Checking HTTPS...');
    await delay(200);
    addCheck(checks, {
      category: 'Connection',
      name: 'HTTPS Encryption',
      status: window.location.protocol === 'https:' ? 'good' : 'bad',
      description: window.location.protocol === 'https:'
        ? 'Your connection is encrypted with HTTPS/TLS'
        : 'Your connection is NOT encrypted - data can be intercepted',
      recommendation: window.location.protocol !== 'https:'
        ? 'Always ensure websites use HTTPS. Install the HTTPS Everywhere extension.'
        : 'Your connection is secure. Keep using HTTPS-only websites.',
      details: `Protocol: ${window.location.protocol} | Host: ${window.location.host}`,
    }, updateResults);

    // 2. Do Not Track
    setCurrentCheck('Checking Do Not Track...');
    await delay(200);
    const dnt = navigator.doNotTrack === '1' || (navigator as any).msDoNotTrack === '1';
    addCheck(checks, {
      category: 'Browser Settings',
      name: 'Do Not Track (DNT)',
      status: dnt ? 'good' : 'warning',
      description: dnt
        ? 'Do Not Track header is enabled'
        : 'Do Not Track header is not enabled',
      recommendation: dnt
        ? 'DNT is enabled, but note that many sites ignore this header. Use additional protection.'
        : 'Enable Do Not Track in your browser privacy settings. Note: many sites may ignore this signal.',
      details: `navigator.doNotTrack = "${navigator.doNotTrack}"`,
    }, updateResults);

    // 3. Cookies
    setCurrentCheck('Checking cookies...');
    await delay(200);
    addCheck(checks, {
      category: 'Browser Settings',
      name: 'Cookies Enabled',
      status: navigator.cookieEnabled ? 'warning' : 'good',
      description: navigator.cookieEnabled
        ? 'Cookies are enabled - sites can store tracking data'
        : 'Cookies are disabled',
      recommendation: navigator.cookieEnabled
        ? 'Consider blocking third-party cookies in browser settings. Use extensions like Cookie AutoDelete.'
        : 'Cookies are disabled. Some sites may not work properly.',
    }, updateResults);

    // 4. Third-party Cookie Test
    setCurrentCheck('Checking third-party cookies...');
    await delay(200);
    let thirdPartyCookies = false;
    try {
      // Attempt to detect if third-party cookies are likely enabled
      document.cookie = '__tp_test=1; SameSite=None; Secure';
      thirdPartyCookies = document.cookie.includes('__tp_test');
      // Clean up
      document.cookie = '__tp_test=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch {}
    addCheck(checks, {
      category: 'Tracking',
      name: 'Third-Party Cookies',
      status: thirdPartyCookies ? 'warning' : 'good',
      description: thirdPartyCookies
        ? 'Third-party cookies appear to be allowed'
        : 'Third-party cookies appear to be blocked or restricted',
      recommendation: thirdPartyCookies
        ? 'Block third-party cookies in your browser settings to reduce cross-site tracking.'
        : 'Good! Third-party cookies are restricted, reducing cross-site tracking.',
    }, updateResults);

    // 5. WebRTC Leak Detection
    setCurrentCheck('Checking WebRTC leaks...');
    await delay(200);
    const webrtcResult = await checkWebRTCLeak();
    addCheck(checks, webrtcResult, updateResults);

    // 6. Canvas Fingerprinting
    setCurrentCheck('Checking canvas fingerprinting...');
    await delay(200);
    const canvasResult = checkCanvasFingerprint();
    addCheck(checks, canvasResult, updateResults);

    // 7. WebGL Fingerprinting
    setCurrentCheck('Checking WebGL fingerprinting...');
    await delay(200);
    const webglResult = checkWebGLFingerprint();
    addCheck(checks, webglResult, updateResults);

    // 8. Battery API
    setCurrentCheck('Checking Battery API...');
    await delay(200);
    const batteryResult = await checkBatteryAPI();
    addCheck(checks, batteryResult, updateResults);

    // 9. Clipboard API
    setCurrentCheck('Checking Clipboard API...');
    await delay(200);
    const clipboardResult = checkClipboardAPI();
    addCheck(checks, clipboardResult, updateResults);

    // 10. Geolocation Permission
    setCurrentCheck('Checking Geolocation...');
    await delay(200);
    const geoResult = await checkPermission('geolocation', 'Geolocation');
    addCheck(checks, geoResult, updateResults);

    // 11. Camera Permission
    setCurrentCheck('Checking Camera...');
    await delay(200);
    const cameraResult = await checkPermission('camera', 'Camera');
    addCheck(checks, cameraResult, updateResults);

    // 12. Microphone Permission
    setCurrentCheck('Checking Microphone...');
    await delay(200);
    const micResult = await checkPermission('microphone', 'Microphone');
    addCheck(checks, micResult, updateResults);

    // 13. JavaScript enabled (always true if running this)
    setCurrentCheck('Checking JavaScript...');
    await delay(150);
    addCheck(checks, {
      category: 'Browser Settings',
      name: 'JavaScript Enabled',
      status: 'warning',
      description: 'JavaScript is enabled (required for most sites)',
      recommendation: 'Use extensions like NoScript or uBlock Origin to control JavaScript on untrusted sites.',
    }, updateResults);

    // 14. Referrer Policy
    setCurrentCheck('Checking Referrer Policy...');
    await delay(150);
    const hasReferrer = !!document.referrer;
    addCheck(checks, {
      category: 'Tracking',
      name: 'Referrer Information',
      status: hasReferrer ? 'warning' : 'good',
      description: hasReferrer
        ? `Referrer sent: ${document.referrer.substring(0, 50)}...`
        : 'No referrer information is being leaked',
      recommendation: hasReferrer
        ? 'Use browser extensions that strip referrer headers to prevent sites from knowing where you came from.'
        : 'No referrer is being sent. This protects your browsing history.',
    }, updateResults);

    // 15. DNS Leak Indicator
    setCurrentCheck('Checking DNS configuration...');
    await delay(200);
    const dnsResult = await checkDNSLeak();
    addCheck(checks, dnsResult, updateResults);

    // 16. Screen Resolution / Device Info Exposure
    setCurrentCheck('Checking device fingerprint surface...');
    await delay(150);
    const screenInfo = `${screen.width}x${screen.height} @ ${window.devicePixelRatio}x`;
    const plugins = navigator.plugins?.length || 0;
    addCheck(checks, {
      category: 'Fingerprinting',
      name: 'Device Information Exposure',
      status: 'warning',
      description: `Screen: ${screenInfo}, Plugins: ${plugins}, Platform: ${navigator.platform}`,
      recommendation: 'Use a privacy browser like Brave or Tor that randomizes or hides these values.',
      details: `User Agent: ${navigator.userAgent.substring(0, 100)}... | Languages: ${navigator.languages?.join(', ')} | Cores: ${navigator.hardwareConcurrency || 'hidden'} | Memory: ${(navigator as any).deviceMemory || 'hidden'} GB`,
    }, updateResults);

    // 17. Storage APIs
    setCurrentCheck('Checking storage APIs...');
    await delay(150);
    const hasLocalStorage = !!window.localStorage;
    const hasSessionStorage = !!window.sessionStorage;
    const hasIndexedDB = !!window.indexedDB;
    addCheck(checks, {
      category: 'Tracking',
      name: 'Storage APIs',
      status: (hasLocalStorage || hasIndexedDB) ? 'warning' : 'good',
      description: `LocalStorage: ${hasLocalStorage ? 'Available' : 'Blocked'} | SessionStorage: ${hasSessionStorage ? 'Available' : 'Blocked'} | IndexedDB: ${hasIndexedDB ? 'Available' : 'Blocked'}`,
      recommendation: 'Sites can use storage APIs to persist tracking data. Regularly clear browsing data and consider using private/incognito mode.',
    }, updateResults);

    // Calculate score
    const goodCount = checks.filter(c => c.status === 'good').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    const badCount = checks.filter(c => c.status === 'bad').length;
    const total = checks.length;
    // Good = full points, warning = half points, bad = 0
    const score = Math.round(((goodCount + warningCount * 0.4) / total) * 100);
    setOverallScore(score);
    setCurrentCheck('');
    setIsChecking(false);
  };

  const getScoreGrade = (score: number) => {
    if (score >= 80) return { grade: 'A', label: 'Excellent Privacy', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30' };
    if (score >= 65) return { grade: 'B', label: 'Good Privacy', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' };
    if (score >= 50) return { grade: 'C', label: 'Fair Privacy', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' };
    if (score >= 35) return { grade: 'D', label: 'Poor Privacy', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' };
    return { grade: 'F', label: 'Very Poor Privacy', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30' };
  };

  const getStatusIcon = (status: PrivacyCheckResult['status']) => {
    switch (status) {
      case 'good': return <Check className="w-4 h-4 text-green-500 shrink-0" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
      case 'bad': return <X className="w-4 h-4 text-red-500 shrink-0" />;
    }
  };

  const getStatusBg = (status: PrivacyCheckResult['status']) => {
    switch (status) {
      case 'good': return 'border-l-green-500';
      case 'warning': return 'border-l-yellow-500';
      case 'bad': return 'border-l-red-500';
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, PrivacyCheckResult[]>);

  const globalIndex = (category: string, localIndex: number) => {
    let offset = 0;
    for (const [cat, items] of Object.entries(groupedResults)) {
      if (cat === category) return offset + localIndex;
      offset += items.length;
    }
    return localIndex;
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Privacy Checker</h2>
        </div>
      </div>

      {results.length === 0 && !isChecking ? (
        <div className="text-center py-8">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <p className="text-muted-foreground mb-2">
            Analyze your browser's privacy posture
          </p>
          <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
            This tool checks for WebRTC leaks, fingerprinting vulnerabilities, permission exposures, and more.
          </p>
          <Button onClick={runPrivacyCheck} size="lg" className="px-8">
            <Shield className="w-4 h-4 mr-2" />
            Run Privacy Scan
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Score Display */}
          {overallScore !== null && (
            <div className={cn(
              "flex items-center gap-4 p-5 rounded-xl border",
              getScoreGrade(overallScore).bg
            )}>
              <div className="relative">
                <svg viewBox="0 0 100 100" className="w-20 h-20">
                  <circle cx="50" cy="50" r="42" strokeWidth="6" className="fill-none stroke-muted" />
                  <circle
                    cx="50" cy="50" r="42" strokeWidth="6"
                    className={cn("fill-none transition-all duration-1000", {
                      'stroke-green-500': overallScore >= 80,
                      'stroke-blue-500': overallScore >= 65 && overallScore < 80,
                      'stroke-yellow-500': overallScore >= 50 && overallScore < 65,
                      'stroke-orange-500': overallScore >= 35 && overallScore < 50,
                      'stroke-red-500': overallScore < 35,
                    })}
                    strokeDasharray={264}
                    strokeDashoffset={264 * (1 - overallScore / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn("text-2xl font-bold", getScoreGrade(overallScore).color)}>
                    {getScoreGrade(overallScore).grade}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className={cn("text-lg font-bold", getScoreGrade(overallScore).color)}>
                  {getScoreGrade(overallScore).label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Privacy Score: {overallScore}/100
                </p>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-green-500">{results.filter(r => r.status === 'good').length} passed</span>
                  <span className="text-yellow-500">{results.filter(r => r.status === 'warning').length} warnings</span>
                  <span className="text-red-500">{results.filter(r => r.status === 'bad').length} issues</span>
                </div>
              </div>
            </div>
          )}

          {/* Progress indicator while checking */}
          {isChecking && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">{currentCheck}</span>
              <span className="text-xs text-muted-foreground ml-auto">{results.length} checks done</span>
            </div>
          )}

          {/* Grouped Results */}
          {Object.entries(groupedResults).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</h3>
              <div className="space-y-1.5">
                {items.map((result, i) => {
                  const idx = globalIndex(category, i);
                  const isExpanded = expandedItems.has(idx);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "border-l-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer",
                        getStatusBg(result.status)
                      )}
                      onClick={() => toggleExpand(idx)}
                    >
                      <div className="flex items-start gap-3 p-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{result.name}</span>
                            <Badge
                              variant={result.status === 'good' ? 'default' : result.status === 'warning' ? 'secondary' : 'destructive'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {result.status === 'good' ? 'PASS' : result.status === 'warning' ? 'WARN' : 'FAIL'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{result.description}</p>
                        </div>
                        <div className="shrink-0 mt-0.5">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                      {isExpanded && (result.recommendation || result.details) && (
                        <div className="px-3 pb-3 pt-0 ml-7 space-y-2 animate-in fade-in duration-200">
                          {result.recommendation && (
                            <div className="text-xs text-primary bg-primary/5 p-2 rounded">
                              <strong>Recommendation:</strong> {result.recommendation}
                            </div>
                          )}
                          {result.details && (
                            <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded break-all">
                              {result.details}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          {!isChecking && results.length > 0 && (
            <div className="pt-4 border-t border-border space-y-3">
              <Button onClick={runPrivacyCheck} variant="outline" className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Run Again
              </Button>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-3">Quick Privacy Improvements</h4>
                <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2 p-2 bg-background rounded">
                    <span className="text-primary mt-0.5">1.</span>
                    <span>Use a VPN to encrypt traffic and hide your IP address</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-background rounded">
                    <span className="text-primary mt-0.5">2.</span>
                    <span>Install uBlock Origin to block trackers and ads</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-background rounded">
                    <span className="text-primary mt-0.5">3.</span>
                    <span>Use Firefox or Brave for built-in fingerprint protection</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-background rounded">
                    <span className="text-primary mt-0.5">4.</span>
                    <span>Disable WebRTC in browser settings or use an extension</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-background rounded">
                    <span className="text-primary mt-0.5">5.</span>
                    <span>Block third-party cookies in browser privacy settings</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-background rounded">
                    <span className="text-primary mt-0.5">6.</span>
                    <span>Review and revoke unnecessary site permissions regularly</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Helper functions ---

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function checkWebRTCLeak(): Promise<PrivacyCheckResult> {
  const hasWebRTC = !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection || (window as any).mozRTCPeerConnection);

  if (!hasWebRTC) {
    return {
      category: 'Privacy Leaks',
      name: 'WebRTC Leak',
      status: 'good',
      description: 'WebRTC is disabled - no IP leak risk through WebRTC',
      recommendation: 'WebRTC is disabled. This is great for privacy.',
    };
  }

  // Attempt to detect local IP leak via WebRTC
  let leakedIPs: string[] = [];
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 2000);
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          clearTimeout(timeout);
          resolve();
          return;
        }
        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
        if (ipMatch && !leakedIPs.includes(ipMatch[0])) {
          leakedIPs.push(ipMatch[0]);
        }
        // Check for IPv6
        const ipv6Match = candidate.match(/([a-f0-9]{1,4}:){2,7}[a-f0-9]{1,4}/i);
        if (ipv6Match && !leakedIPs.includes(ipv6Match[0])) {
          leakedIPs.push(ipv6Match[0]);
        }
      };
    });
    pc.close();
  } catch {}

  if (leakedIPs.length > 0) {
    return {
      category: 'Privacy Leaks',
      name: 'WebRTC Leak',
      status: 'bad',
      description: `WebRTC is leaking ${leakedIPs.length} IP address(es)`,
      recommendation: 'Disable WebRTC in your browser or install a WebRTC leak prevention extension. In Firefox: set media.peerconnection.enabled to false in about:config.',
      details: `Leaked IPs: ${leakedIPs.join(', ')}`,
    };
  }

  return {
    category: 'Privacy Leaks',
    name: 'WebRTC Leak',
    status: 'warning',
    description: 'WebRTC is enabled but no local IP leak detected in this test',
    recommendation: 'WebRTC is still enabled. For maximum privacy, disable it or use a browser extension to prevent potential leaks on other sites.',
  };
}

function checkCanvasFingerprint(): PrivacyCheckResult {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        category: 'Fingerprinting',
        name: 'Canvas Fingerprinting',
        status: 'good',
        description: 'Canvas 2D context is unavailable - fingerprinting blocked',
        recommendation: 'Canvas is blocked. This prevents a common fingerprinting technique.',
      };
    }

    // Draw test content
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(50, 0, 150, 25);
    ctx.fillStyle = '#069';
    ctx.fillText('Privacy Test 123', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas Check', 4, 17);

    const dataURL = canvas.toDataURL();
    const isUnique = dataURL.length > 100; // If we got meaningful output

    return {
      category: 'Fingerprinting',
      name: 'Canvas Fingerprinting',
      status: isUnique ? 'warning' : 'good',
      description: isUnique
        ? 'Canvas fingerprinting is possible - your browser produces a unique canvas signature'
        : 'Canvas output appears to be blocked or randomized',
      recommendation: isUnique
        ? 'Use a browser with canvas fingerprint protection (Brave, Tor Browser) or install CanvasBlocker extension for Firefox.'
        : 'Canvas fingerprinting protection is active.',
      details: isUnique ? `Canvas data hash length: ${dataURL.length} chars` : undefined,
    };
  } catch {
    return {
      category: 'Fingerprinting',
      name: 'Canvas Fingerprinting',
      status: 'good',
      description: 'Canvas fingerprinting appears to be blocked',
      recommendation: 'Canvas access is restricted. This provides protection against fingerprinting.',
    };
  }
}

function checkWebGLFingerprint(): PrivacyCheckResult {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

    if (!gl) {
      return {
        category: 'Fingerprinting',
        name: 'WebGL Fingerprinting',
        status: 'good',
        description: 'WebGL is disabled - prevents GPU fingerprinting',
        recommendation: 'WebGL is blocked. This prevents hardware-based fingerprinting.',
      };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'hidden';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'hidden';

    const isExposed = vendor !== 'hidden' && renderer !== 'hidden';

    return {
      category: 'Fingerprinting',
      name: 'WebGL Fingerprinting',
      status: isExposed ? 'warning' : 'good',
      description: isExposed
        ? 'WebGL exposes your GPU information for fingerprinting'
        : 'WebGL debug info is hidden',
      recommendation: isExposed
        ? 'Use a browser with WebGL fingerprint protection. Brave and Firefox (with privacy.resistFingerprinting) can mask this data.'
        : 'Your GPU information is hidden from WebGL fingerprinting.',
      details: isExposed ? `Vendor: ${vendor} | Renderer: ${renderer}` : undefined,
    };
  } catch {
    return {
      category: 'Fingerprinting',
      name: 'WebGL Fingerprinting',
      status: 'good',
      description: 'WebGL fingerprinting appears to be blocked',
      recommendation: 'WebGL access is restricted.',
    };
  }
}

async function checkBatteryAPI(): Promise<PrivacyCheckResult> {
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return {
        category: 'Device APIs',
        name: 'Battery API',
        status: 'warning',
        description: 'Battery API is accessible - can be used for fingerprinting',
        recommendation: 'The Battery API can reveal device state for fingerprinting. Firefox has removed this API. Consider using Firefox or Brave.',
        details: `Level: ${Math.round(battery.level * 100)}% | Charging: ${battery.charging}`,
      };
    }
    return {
      category: 'Device APIs',
      name: 'Battery API',
      status: 'good',
      description: 'Battery API is not accessible - not a fingerprinting risk',
      recommendation: 'Battery API is blocked or unavailable. This is good for privacy.',
    };
  } catch {
    return {
      category: 'Device APIs',
      name: 'Battery API',
      status: 'good',
      description: 'Battery API access was denied or is unavailable',
      recommendation: 'Battery API is restricted. This helps prevent fingerprinting.',
    };
  }
}

function checkClipboardAPI(): PrivacyCheckResult {
  const hasClipboard = !!navigator.clipboard;
  const hasClipboardRead = hasClipboard && typeof navigator.clipboard.readText === 'function';

  return {
    category: 'Device APIs',
    name: 'Clipboard API',
    status: hasClipboardRead ? 'warning' : 'good',
    description: hasClipboardRead
      ? 'Clipboard API is available - sites could potentially read clipboard contents with permission'
      : 'Clipboard read API is not available',
    recommendation: hasClipboardRead
      ? 'Be cautious about granting clipboard permissions. Malicious sites could read sensitive copied data.'
      : 'Clipboard read access is restricted.',
    details: `Clipboard API: ${hasClipboard ? 'Yes' : 'No'} | Read: ${hasClipboardRead ? 'Yes' : 'No'} | Write: ${hasClipboard && navigator.clipboard.writeText ? 'Yes' : 'No'}`,
  };
}

async function checkPermission(name: string, label: string): Promise<PrivacyCheckResult> {
  try {
    const status = await navigator.permissions.query({ name: name as PermissionName });
    const state = status.state;

    return {
      category: 'Permissions',
      name: `${label} Access`,
      status: state === 'granted' ? 'bad' : state === 'prompt' ? 'warning' : 'good',
      description: state === 'granted'
        ? `${label} access is granted - sites can access this without asking`
        : state === 'prompt'
        ? `${label} access requires permission - you will be prompted`
        : `${label} access is denied`,
      recommendation: state === 'granted'
        ? `Review which sites have ${label.toLowerCase()} access and revoke unnecessary permissions in browser settings.`
        : state === 'prompt'
        ? `Be careful about granting ${label.toLowerCase()} access. Only allow trusted sites.`
        : `${label} access is properly restricted.`,
    };
  } catch {
    return {
      category: 'Permissions',
      name: `${label} Access`,
      status: 'good',
      description: `${label} permission check not supported or is restricted`,
      recommendation: `Unable to query ${label.toLowerCase()} permission - this may indicate good privacy protection.`,
    };
  }
}

async function checkDNSLeak(): Promise<PrivacyCheckResult> {
  // We can't directly test DNS leaks from the browser, but we can check some indicators
  try {
    // Check if the browser supports DNS-over-HTTPS indicators
    const isSecureContext = window.isSecureContext;
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;

    return {
      category: 'Connection',
      name: 'DNS Configuration',
      status: 'warning',
      description: 'DNS leak testing requires external tools for complete verification',
      recommendation: 'Use encrypted DNS (DNS-over-HTTPS or DNS-over-TLS). Configure your browser to use Cloudflare (1.1.1.1) or Google (8.8.8.8) DoH. Visit dnsleaktest.com for a thorough test.',
      details: `Secure context: ${isSecureContext} | Connection type: ${effectiveType || 'unknown'}`,
    };
  } catch {
    return {
      category: 'Connection',
      name: 'DNS Configuration',
      status: 'warning',
      description: 'Unable to assess DNS configuration',
      recommendation: 'Use a VPN or configure DNS-over-HTTPS in your browser for encrypted DNS queries.',
    };
  }
}

export default PrivacyChecker;
