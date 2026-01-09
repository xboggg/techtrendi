import { useState } from 'react';
import { Braces, Copy, Check, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function JSONFormatter({ className }: { className?: string }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [indentSize, setIndentSize] = useState(2);

  const format = () => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indentSize));
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`);
      setOutput('');
    }
  };

  const minify = () => {
    setError('');
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`);
      setOutput('');
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSample = () => {
    setInput(JSON.stringify({
      name: "TechTrendi",
      version: "2.0.0",
      features: ["reviews", "comparisons", "tools"],
      settings: { darkMode: true, notifications: false }
    }));
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Braces className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">JSON Formatter</h2>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-muted-foreground">Input JSON</label>
            <Button variant="ghost" size="sm" onClick={loadSample}>
              Load Sample
            </Button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
            className="w-full px-4 py-3 bg-muted rounded-lg resize-none h-32 font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Indent:</label>
            <select
              value={indentSize}
              onChange={(e) => setIndentSize(parseInt(e.target.value))}
              className="px-2 py-1 bg-muted rounded text-sm"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={1}>Tab</option>
            </select>
          </div>
          <div className="flex-1" />
          <Button onClick={format} disabled={!input.trim()}>
            <Maximize2 className="w-4 h-4 mr-2" />
            Format
          </Button>
          <Button variant="outline" onClick={minify} disabled={!input.trim()}>
            <Minimize2 className="w-4 h-4 mr-2" />
            Minify
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-mono">
            {error}
          </div>
        )}

        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground">Output</label>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
            <pre className="w-full px-4 py-3 bg-primary/10 rounded-lg font-mono text-sm overflow-x-auto max-h-64">
              {output}
            </pre>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-center text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {input ? JSON.stringify(input).length : 0}
            </p>
            <p className="text-muted-foreground">Input chars</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {output ? output.length : 0}
            </p>
            <p className="text-muted-foreground">Output chars</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JSONFormatter;
