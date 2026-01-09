import { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ParsedURL {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string>;
}

export function URLParser({ className }: { className?: string }) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedURL | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const parseURL = () => {
    setError('');
    try {
      const url = new URL(input);
      const params: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      setParsed({
        protocol: url.protocol.replace(':', ''),
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        params
      });
    } catch {
      setError('Invalid URL format');
      setParsed(null);
    }
  };

  const copyToClipboard = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadSample = () => {
    setInput('https://techtrendi.com/reviews?category=phones&sort=date&page=2#comments');
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Link2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">URL Parser</h2>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted-foreground">Enter URL</label>
            <Button variant="ghost" size="sm" onClick={loadSample}>
              Load Sample
            </Button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://example.com/path?query=value"
              className="flex-1 px-4 py-2 bg-muted rounded-lg font-mono text-sm"
            />
            <Button onClick={parseURL} disabled={!input.trim()}>
              Parse
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {parsed && (
          <div className="space-y-3">
            {[
              { key: 'protocol', label: 'Protocol', value: parsed.protocol },
              { key: 'hostname', label: 'Hostname', value: parsed.hostname },
              { key: 'port', label: 'Port', value: parsed.port || '(default)' },
              { key: 'pathname', label: 'Path', value: parsed.pathname },
              { key: 'search', label: 'Query String', value: parsed.search || '(none)' },
              { key: 'hash', label: 'Hash', value: parsed.hash || '(none)' },
            ].map(({ key, label, value }) => (
              <div key={key} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground w-28">{label}</span>
                <code className="flex-1 text-sm font-mono truncate">{value}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(value, key)}
                >
                  {copied === key ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            ))}

            {Object.keys(parsed.params).length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Query Parameters</p>
                <div className="space-y-1">
                  {Object.entries(parsed.params).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <code className="text-primary">{key}</code>
                      <span className="text-muted-foreground">=</span>
                      <code>{value}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default URLParser;
