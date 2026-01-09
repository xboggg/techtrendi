import { useState } from 'react';
import { Shield, Check, X, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PrivacyCheckResult {
  category: string;
  name: string;
  status: 'good' | 'warning' | 'bad';
  description: string;
  recommendation?: string;
}

export function PrivacyChecker({ className }: { className?: string }) {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<PrivacyCheckResult[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);

  const runPrivacyCheck = async () => {
    setIsChecking(true);
    setResults([]);

    // Simulate privacy checks
    const checks: PrivacyCheckResult[] = [];

    // Check 1: HTTPS
    await new Promise(r => setTimeout(r, 300));
    checks.push({
      category: 'Connection',
      name: 'HTTPS Enabled',
      status: window.location.protocol === 'https:' ? 'good' : 'bad',
      description: window.location.protocol === 'https:'
        ? 'Your connection is encrypted with HTTPS'
        : 'Your connection is not encrypted',
      recommendation: window.location.protocol !== 'https:' ? 'Always use HTTPS websites' : undefined,
    });
    setResults([...checks]);

    // Check 2: Cookies
    await new Promise(r => setTimeout(r, 300));
    const cookiesEnabled = navigator.cookieEnabled;
    checks.push({
      category: 'Browser',
      name: 'Cookies',
      status: 'warning',
      description: cookiesEnabled ? 'Cookies are enabled' : 'Cookies are disabled',
      recommendation: 'Consider using cookie-blocking extensions for third-party cookies',
    });
    setResults([...checks]);

    // Check 3: Do Not Track
    await new Promise(r => setTimeout(r, 300));
    const dnt = navigator.doNotTrack === '1';
    checks.push({
      category: 'Browser',
      name: 'Do Not Track',
      status: dnt ? 'good' : 'warning',
      description: dnt ? 'Do Not Track is enabled' : 'Do Not Track is not enabled',
      recommendation: !dnt ? 'Enable Do Not Track in your browser settings' : undefined,
    });
    setResults([...checks]);

    // Check 4: JavaScript
    await new Promise(r => setTimeout(r, 300));
    checks.push({
      category: 'Browser',
      name: 'JavaScript',
      status: 'warning',
      description: 'JavaScript is enabled (required for this site)',
      recommendation: 'Consider using NoScript for untrusted sites',
    });
    setResults([...checks]);

    // Check 5: WebRTC
    await new Promise(r => setTimeout(r, 300));
    const hasWebRTC = !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection);
    checks.push({
      category: 'Privacy Leaks',
      name: 'WebRTC',
      status: hasWebRTC ? 'warning' : 'good',
      description: hasWebRTC ? 'WebRTC can leak your real IP address' : 'WebRTC is disabled',
      recommendation: hasWebRTC ? 'Disable WebRTC or use a VPN' : undefined,
    });
    setResults([...checks]);

    // Check 6: Canvas Fingerprinting
    await new Promise(r => setTimeout(r, 300));
    checks.push({
      category: 'Privacy Leaks',
      name: 'Canvas Fingerprinting',
      status: 'warning',
      description: 'Your browser may be vulnerable to canvas fingerprinting',
      recommendation: 'Use a privacy-focused browser or extension',
    });
    setResults([...checks]);

    // Check 7: Third-party Resources
    await new Promise(r => setTimeout(r, 300));
    checks.push({
      category: 'Tracking',
      name: 'Third-party Scripts',
      status: 'warning',
      description: 'This page may load third-party resources',
      recommendation: 'Use uBlock Origin or similar ad blockers',
    });
    setResults([...checks]);

    // Check 8: Referrer Policy
    await new Promise(r => setTimeout(r, 300));
    const referrerPolicy = document.referrer ? 'warning' : 'good';
    checks.push({
      category: 'Browser',
      name: 'Referrer Policy',
      status: referrerPolicy,
      description: document.referrer ? 'Referrer information may be sent' : 'No referrer detected',
      recommendation: document.referrer ? 'Consider browser extensions that control referrers' : undefined,
    });
    setResults([...checks]);

    // Calculate score
    const score = Math.round(
      (checks.filter(c => c.status === 'good').length / checks.length) * 100
    );
    setOverallScore(score);
    setIsChecking(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = (status: PrivacyCheckResult['status']) => {
    switch (status) {
      case 'good': return <Check className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'bad': return <X className="w-4 h-4 text-red-500" />;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, PrivacyCheckResult[]>);

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Privacy Checker</h2>
        </div>
        {overallScore !== null && (
          <div className={cn('text-3xl font-bold', getScoreColor(overallScore))}>
            {overallScore}%
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Check your browser's privacy settings and potential tracking vulnerabilities
          </p>
          <Button onClick={runPrivacyCheck} disabled={isChecking}>
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Run Privacy Check
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
              <div className="space-y-2">
                {items.map((result, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{result.name}</span>
                        <Badge variant={result.status === 'good' ? 'default' : result.status === 'warning' ? 'secondary' : 'destructive'} className="text-xs">
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{result.description}</p>
                      {result.recommendation && (
                        <p className="text-xs text-primary mt-1">💡 {result.recommendation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-border">
            <Button onClick={runPrivacyCheck} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Again
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">Improve Your Privacy</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use a VPN to hide your IP address</li>
              <li>• Install uBlock Origin to block trackers</li>
              <li>• Use Firefox or Brave for better privacy</li>
              <li>• Enable Do Not Track in browser settings</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  );
}

export default PrivacyChecker;
