import { useState, useCallback } from 'react';
import { Copy, Check, RefreshCw, Shield, Eye, EyeOff, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export function PasswordGenerator({ className }: { className?: string }) {
  const [password, setPassword] = useState('');
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const generatePassword = useCallback(() => {
    let chars = '';
    if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) chars += '0123456789';
    if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (chars.length === 0) chars = 'abcdefghijklmnopqrstuvwxyz';

    let result = '';
    const array = new Uint32Array(options.length);
    crypto.getRandomValues(array);

    for (let i = 0; i < options.length; i++) {
      result += chars[array[i] % chars.length];
    }

    setPassword(result);
    setCopied(false);
  }, [options]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrength = () => {
    let score = 0;
    if (options.length >= 12) score += 2;
    else if (options.length >= 8) score += 1;
    if (options.uppercase) score += 1;
    if (options.lowercase) score += 1;
    if (options.numbers) score += 1;
    if (options.symbols) score += 2;

    if (score <= 3) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (score <= 5) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
    if (score <= 6) return { label: 'Strong', color: 'bg-blue-500', width: '75%' };
    return { label: 'Very Strong', color: 'bg-green-500', width: '100%' };
  };

  const strength = getStrength();

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Password Generator</h2>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              readOnly
              placeholder="Click generate..."
              className="w-full px-4 py-3 bg-muted rounded-lg font-mono text-lg pr-10"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button onClick={copyToClipboard} variant="outline" size="icon" disabled={!password}>
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button onClick={generatePassword} size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {password && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Strength</span>
              <span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
            </div>
            <div className="h-2 bg-muted rounded-full">
              <div className={cn('h-full rounded-full transition-all', strength.color)} style={{ width: strength.width }} />
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm">Length: {options.length}</label>
          </div>
          <input
            type="range"
            min="8"
            max="32"
            value={options.length}
            onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'uppercase', label: 'Uppercase (A-Z)' },
            { key: 'lowercase', label: 'Lowercase (a-z)' },
            { key: 'numbers', label: 'Numbers (0-9)' },
            { key: 'symbols', label: 'Symbols (!@#)' },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 p-2 bg-muted rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={options[opt.key as keyof PasswordOptions] as boolean}
                onChange={(e) => setOptions({ ...options, [opt.key]: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setOptions({ ...options, length: 8, symbols: false }); }}>
            Simple
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setOptions({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true }); }}>
            <Zap className="w-3 h-3 mr-1" /> Strong
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setOptions({ length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true }); }}>
            <Shield className="w-3 h-3 mr-1" /> Maximum
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PasswordGenerator;
