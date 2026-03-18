import { useState, useEffect } from 'react';
import { Globe, MapPin, Building, Wifi, Shield, Copy, Check, Loader2, Search, Clock, Server, Network, Eye, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface IPInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
  isp?: string;
  org?: string;
  asn?: string;
  timezone?: string;
  utc_offset?: string;
  lat?: number;
  lon?: number;
  postal?: string;
  hostname?: string;
  connection_type?: string;
  is_vpn?: boolean;
  is_proxy?: boolean;
  is_tor?: boolean;
  is_datacenter?: boolean;
  currency?: string;
  languages?: string;
}

export function IPLookup({ className }: { className?: string }) {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IPInfo | null>(null);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [recentLookups, setRecentLookups] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ip_lookup_history');
      if (stored) setRecentLookups(JSON.parse(stored));
    } catch {}
  }, []);

  const lookupIP = async (lookupAddress?: string) => {
    const target = lookupAddress || ip;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const url = target.trim()
        ? `https://ipapi.co/${target.trim()}/json/`
        : 'https://ipapi.co/json/';
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) {
        setError(data.reason || 'Failed to lookup IP');
      } else {
        const info: IPInfo = {
          ip: data.ip,
          city: data.city,
          region: data.region,
          country: data.country_name,
          country_code: data.country_code,
          isp: data.org,
          org: data.org,
          asn: data.asn,
          timezone: data.timezone,
          utc_offset: data.utc_offset,
          lat: data.latitude,
          lon: data.longitude,
          postal: data.postal,
          connection_type: data.network || data.connection_type,
          currency: data.currency,
          languages: data.languages,
        };
        setResult(info);

        // Save to history
        const newHistory = [data.ip, ...recentLookups.filter(h => h !== data.ip)].slice(0, 5);
        setRecentLookups(newHistory);
        try { localStorage.setItem('ip_lookup_history', JSON.stringify(newHistory)); } catch {}
      }
    } catch {
      setError('Failed to lookup IP address. Please try again.');
    }
    setLoading(false);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={(e) => { e.stopPropagation(); copyToClipboard(text, field); }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
      title="Copy to clipboard"
    >
      {copiedField === field
        ? <Check className="w-3 h-3 text-green-500" />
        : <Copy className="w-3 h-3 text-muted-foreground" />}
    </button>
  );

  const InfoCard = ({ icon: Icon, label, value, field, iconColor, href }: {
    icon: any; label: string; value: string; field: string; iconColor?: string; href?: string;
  }) => {
    const content = (
      <div className="group flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors">
        <div className={cn("mt-0.5", iconColor || "text-muted-foreground")}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-muted-foreground">{label}</span>
          <p className="font-medium text-sm truncate">{value}</p>
        </div>
        <CopyButton text={value} field={field} />
      </div>
    );
    if (href) {
      return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
    }
    return content;
  };

  const SecurityBadge = ({ label, isDetected, icon: Icon }: { label: string; isDetected: boolean; icon: any }) => (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
      isDetected
        ? "border-red-500/30 bg-red-500/10 text-red-500"
        : "border-green-500/30 bg-green-500/10 text-green-500"
    )}>
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
      <Badge variant={isDetected ? "destructive" : "default"} className="ml-auto text-xs">
        {isDetected ? "Detected" : "Not Detected"}
      </Badge>
    </div>
  );

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">IP Address Lookup</h2>
      </div>

      <div className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookupIP()}
              placeholder="Enter IP address or leave empty for yours"
              className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-lg text-sm border border-border focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <Button onClick={() => lookupIP()} disabled={loading} className="px-6">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup'}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setIp(''); lookupIP(''); }}
            className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
          >
            My IP
          </button>
          <button
            onClick={() => { setIp('8.8.8.8'); lookupIP('8.8.8.8'); }}
            className="text-xs px-3 py-1.5 bg-muted rounded-full hover:bg-muted/80 transition-colors"
          >
            Google DNS (8.8.8.8)
          </button>
          <button
            onClick={() => { setIp('1.1.1.1'); lookupIP('1.1.1.1'); }}
            className="text-xs px-3 py-1.5 bg-muted rounded-full hover:bg-muted/80 transition-colors"
          >
            Cloudflare (1.1.1.1)
          </button>
        </div>

        {/* Recent Lookups */}
        {recentLookups.length > 0 && !result && (
          <div>
            <span className="text-xs text-muted-foreground">Recent lookups:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {recentLookups.map((h) => (
                <button
                  key={h}
                  onClick={() => { setIp(h); lookupIP(h); }}
                  className="text-xs px-2.5 py-1 bg-muted/60 rounded-md hover:bg-muted transition-colors font-mono"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm border border-red-500/20">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Main IP Display */}
            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">IP Address</span>
                  <p className="text-2xl font-mono font-bold text-foreground mt-1">{result.ip}</p>
                  {result.country && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg">{getFlagEmoji(result.country_code || '')}</span>
                      <span className="text-sm text-muted-foreground">
                        {[result.city, result.region, result.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(result.ip, 'main-ip')}>
                  {copiedField === 'main-ip' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Map Preview */}
            {result.lat != null && result.lon != null && (
              <div className="rounded-xl overflow-hidden border border-border">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}#map=10/${result.lat}/${result.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={`https://staticmap.openstreetmap.de/staticmap.php?center=${result.lat},${result.lon}&zoom=10&size=600x200&markers=${result.lat},${result.lon},red-pushpin`}
                    alt="IP Location Map"
                    className="w-full h-[200px] object-cover"
                    onError={(e) => {
                      // Fallback: hide image and show coordinate card instead
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </a>
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Map className="w-4 h-4" />
                    <span>Lat: {result.lat?.toFixed(4)}, Lng: {result.lon?.toFixed(4)}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${result.lat},${result.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid sm:grid-cols-2 gap-2">
              <InfoCard icon={MapPin} label="City" value={result.city || 'Unknown'} field="city" iconColor="text-blue-500" />
              <InfoCard icon={MapPin} label="Region" value={result.region || 'Unknown'} field="region" iconColor="text-blue-500" />
              <InfoCard icon={Globe} label="Country" value={`${getFlagEmoji(result.country_code || '')} ${result.country || 'Unknown'}`} field="country" iconColor="text-green-500" />
              <InfoCard icon={Building} label="Organization" value={result.org || 'Unknown'} field="org" iconColor="text-purple-500" />
              <InfoCard icon={Network} label="ASN" value={result.asn || 'Unknown'} field="asn" iconColor="text-orange-500" />
              <InfoCard icon={Wifi} label="ISP / Network" value={result.isp || 'Unknown'} field="isp" iconColor="text-cyan-500" />
              <InfoCard icon={Clock} label="Timezone" value={result.timezone ? `${result.timezone} (UTC${result.utc_offset || ''})` : 'Unknown'} field="timezone" iconColor="text-yellow-500" />
              {result.postal && (
                <InfoCard icon={MapPin} label="Postal Code" value={result.postal} field="postal" iconColor="text-pink-500" />
              )}
              {result.currency && (
                <InfoCard icon={Building} label="Currency" value={result.currency} field="currency" iconColor="text-emerald-500" />
              )}
              {result.languages && (
                <InfoCard icon={Globe} label="Languages" value={result.languages} field="languages" iconColor="text-indigo-500" />
              )}
            </div>

            {/* Security Indicators */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Security Indicators</h3>
              <div className="space-y-2">
                <SecurityBadge label="VPN" isDetected={!!result.is_vpn} icon={Shield} />
                <SecurityBadge label="Proxy" isDetected={!!result.is_proxy} icon={Eye} />
                <SecurityBadge label="Tor" isDetected={!!result.is_tor} icon={Shield} />
                <SecurityBadge label="Datacenter / Hosting" isDetected={!!result.is_datacenter} icon={Server} />
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Note: VPN/proxy detection is based on available API data and may not be 100% accurate.
              </p>
            </div>

            {/* Copy All */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const allData = [
                  `IP: ${result.ip}`,
                  `Location: ${[result.city, result.region, result.country].filter(Boolean).join(', ')}`,
                  `ISP: ${result.isp || 'Unknown'}`,
                  `ASN: ${result.asn || 'Unknown'}`,
                  `Timezone: ${result.timezone || 'Unknown'}`,
                  result.lat != null ? `Coordinates: ${result.lat}, ${result.lon}` : null,
                ].filter(Boolean).join('\n');
                copyToClipboard(allData, 'all-data');
              }}
            >
              {copiedField === 'all-data' ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedField === 'all-data' ? 'Copied All Data!' : 'Copy All Information'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default IPLookup;
