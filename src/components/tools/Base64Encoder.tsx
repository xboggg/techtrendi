import { useState } from 'react';
import { FileCode, Copy, Check, ArrowDownUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Mode = 'encode' | 'decode';

export function Base64Encoder({ className }: { className?: string }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const process = () => {
    setError('');
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))));
      } else {
        setOutput(decodeURIComponent(escape(atob(input))));
      }
    } catch {
      setError(mode === 'decode' ? 'Invalid Base64 string' : 'Encoding failed');
      setOutput('');
    }
  };

  const swap = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output);
    setOutput('');
    setError('');
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center gap-2 mb-6">
        <FileCode className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Base64 Encoder/Decoder</h2>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === 'encode' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('encode'); setOutput(''); setError(''); }}
        >
          Encode
        </Button>
        <Button
          variant={mode === 'decode' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('decode'); setOutput(''); setError(''); }}
        >
          Decode
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            {mode === 'encode' ? 'Plain Text' : 'Base64 String'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
            className="w-full px-4 py-3 bg-muted rounded-lg resize-none h-24 font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={process} disabled={!input.trim()} className="flex-1">
            {mode === 'encode' ? 'Encode' : 'Decode'}
          </Button>
          <Button variant="outline" size="icon" onClick={swap} disabled={!output}>
            <ArrowDownUp className="w-4 h-4" />
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-muted-foreground">
                {mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
              </label>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
            <div className="w-full px-4 py-3 bg-primary/10 rounded-lg font-mono text-sm break-all">
              {output}
            </div>
          </div>
        )}

        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium text-sm mb-2">What is Base64?</h4>
          <p className="text-xs text-muted-foreground">
            Base64 is a binary-to-text encoding scheme that represents binary data in ASCII format.
            It's commonly used for encoding data in URLs, emails, and storing complex data in text-based formats.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Base64Encoder;
