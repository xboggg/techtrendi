import { useState } from 'react';
import { Globe, MapPin, Building, Wifi, Shield, Copy, Check, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface IPInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
  org?: string;
  timezone?: string;
  lat?: number;
  lon?: number;
  isVPN?: boolean;
  isProxy?: boolean;
}

export function IPLookup({ className }: { className?: string }) {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IPInfo | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const lookupIP = async () => {
    setLoading(true);
    setError('');
    try {
      const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) {
        setError(data.reason || 'Failed to lookup IP');
      } else {
        setResult({
          ip: data.ip,
          city: data.city,
          region: data.region,
          country: data.country_name,
          isp: data.org,
          org: data.org,
          timezone: data.timezone,
          lat: data.latitude,
          lon: data.longitude,
        });
      }
    } catch {
      setError('Failed to lookup IP address');
    }
    setLoading(false);
  };

  const copyIP = async () => {
    if (result?.ip) {
      await navigator.clipboard.writeText(result.ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">IP Address Lookup</h2>
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="Enter IP or leave empty for yours"
            className="flex-1 px-4 py-2 bg-muted rounded-lg"
          />
          <Button onClick={lookupIP} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup'}
          </Button>
        </div>
        {error && <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">{error}</div>}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
              <div>
                <span className="text-sm text-muted-foreground">IP Address</span>
                <p className="text-xl font-mono font-bold">{result.ip}</p>
              </div>
              <Button variant="outline" size="icon" onClick={copyIP}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Location</span>
                <p className="font-medium text-sm">{[result.city, result.region, result.country].filter(Boolean).join(', ')}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">ISP</span>
                <p className="font-medium text-sm">{result.isp || 'Unknown'}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Timezone</span>
                <p className="font-medium text-sm">{result.timezone || 'Unknown'}</p>
              </div>
              {result.lat && result.lon && (
                <a href={`https://maps.google.com/?q=${result.lat},${result.lon}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-muted/50 rounded-lg hover:bg-muted">
                  <span className="text-xs text-muted-foreground">Coordinates</span>
                  <p className="font-medium text-sm text-primary">{result.lat}, {result.lon}</p>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IPLookup;
