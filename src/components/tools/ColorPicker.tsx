import { useState, useCallback } from 'react';
import { Palette, Copy, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ColorFormats {
  hex: string;
  rgb: string;
  hsl: string;
  rgba: string;
}

export function ColorPicker({ className }: { className?: string }) {
  const [color, setColor] = useState('#6366f1');
  const [copied, setCopied] = useState<string | null>(null);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const getFormats = useCallback((): ColorFormats => {
    const rgb = hexToRgb(color);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      hex: color.toUpperCase(),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`
    };
  }, [color]);

  const formats = getFormats();

  const copyToClipboard = async (value: string, format: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateRandom = () => {
    const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setColor(hex);
  };

  const presetColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'
  ];

  const rgb = hexToRgb(color);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const textColor = luminance > 0.5 ? '#000000' : '#ffffff';

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Palette className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Color Picker</h2>
      </div>

      <div className="space-y-6">
        <div
          className="h-32 rounded-xl flex items-center justify-center text-2xl font-bold transition-colors"
          style={{ backgroundColor: color, color: textColor }}
        >
          {formats.hex}
        </div>

        <div className="flex gap-4 items-center">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-16 rounded-lg cursor-pointer border-0"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setColor(e.target.value)}
            className="flex-1 px-4 py-2 bg-muted rounded-lg font-mono uppercase"
            placeholder="#000000"
            maxLength={7}
          />
          <Button variant="outline" size="icon" onClick={generateRandom}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {presetColors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                'w-8 h-8 rounded-lg transition-transform hover:scale-110',
                color === c && 'ring-2 ring-primary ring-offset-2'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="space-y-2">
          {Object.entries(formats).map(([format, value]) => (
            <div key={format} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground uppercase w-12">{format}</span>
              <code className="flex-1 text-sm font-mono">{value}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyToClipboard(value, format)}
              >
                {copied === format ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: color }}>
            <p style={{ color: '#ffffff' }} className="text-sm font-medium">White Text</p>
            <p style={{ color: '#ffffff' }} className="text-xs opacity-70">Contrast check</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: color }}>
            <p style={{ color: '#000000' }} className="text-sm font-medium">Black Text</p>
            <p style={{ color: '#000000' }} className="text-xs opacity-70">Contrast check</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColorPicker;
