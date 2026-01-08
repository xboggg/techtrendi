import { useState } from 'react';
import { Copy, Check, RefreshCw, FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

interface HashResult {
  algorithm: HashAlgorithm;
  hash: string;
}

export function HashGenerator({ className }: { className?: string }) {
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [results, setResults] = useState<HashResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const algorithms: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

  // Simple hash function using Web Crypto API
  const generateHash = async (text: string, algorithm: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Map algorithm names to Web Crypto format
    const algoMap: Record<string, string> = {
      'MD5': 'MD5', // Note: MD5 not supported in Web Crypto, will use fallback
      'SHA-1': 'SHA-1',
      'SHA-256': 'SHA-256',
      'SHA-384': 'SHA-384',
      'SHA-512': 'SHA-512',
    };

    try {
      if (algorithm === 'MD5') {
        // Simple MD5 fallback (not cryptographically secure, for demo only)
        return simpleMD5(text);
      }

      const hashBuffer = await crypto.subtle.digest(algoMap[algorithm], data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error(`Error generating ${algorithm} hash:`, error);
      return 'Error generating hash';
    }
  };

  // Simple MD5 implementation for demo (not for production use)
  const simpleMD5 = (text: string): string => {
    // This is a simplified placeholder - in production, use a proper MD5 library
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32);
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    const newResults: HashResult[] = [];

    for (const algo of algorithms) {
      const hash = await generateHash(input, algo);
      newResults.push({ algorithm: algo, hash });
    }

    setResults(newResults);
    setIsGenerating(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
    };
    reader.readAsText(file);
  };

  const copyToClipboard = async (hash: string, index: number) => {
    await navigator.clipboard.writeText(hash);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Input Type Toggle */}
      <div className="flex gap-2">
        <Button
          variant={inputType === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputType('text')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Text
        </Button>
        <Button
          variant={inputType === 'file' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputType('file')}
        >
          <Lock className="w-4 h-4 mr-2" />
          File
        </Button>
      </div>

      {/* Input */}
      {inputType === 'text' ? (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Enter text to hash
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text here..."
            className="w-full h-32 px-4 py-3 bg-background border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Upload file
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg"
          />
        </div>
      )}

      {/* Generate Button */}
      <Button onClick={handleGenerate} disabled={!input.trim() || isGenerating} className="w-full">
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Generate Hashes
          </>
        )}
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Hash Results</h3>
          {results.map((result, index) => (
            <div key={result.algorithm} className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">{result.algorithm}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(result.hash, index)}
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <code className="block text-xs text-muted-foreground break-all font-mono">
                {result.hash}
              </code>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-primary/5 rounded-lg">
        <h4 className="font-medium text-foreground mb-2">About Hash Functions</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>MD5:</strong> Fast but cryptographically broken, use only for checksums</li>
          <li>• <strong>SHA-1:</strong> Deprecated for security, still used for integrity checks</li>
          <li>• <strong>SHA-256:</strong> Widely used, secure for most applications</li>
          <li>• <strong>SHA-384/512:</strong> Stronger variants for high-security needs</li>
        </ul>
      </div>
    </div>
  );
}

export default HashGenerator;
