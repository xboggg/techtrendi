import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Palette, Copy, Check, Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ColorFormat {
  hex: string;
  rgb: string;
  hsl: string;
  rgba: string;
}

export default function ColorPicker() {
  const [color, setColor] = useState("#6366f1");
  const [formats, setFormats] = useState<ColorFormat>({
    hex: "#6366f1",
    rgb: "rgb(99, 102, 241)",
    hsl: "hsl(239, 84%, 67%)",
    rgba: "rgba(99, 102, 241, 1)",
  });
  const [opacity, setOpacity] = useState(100);
  const [copied, setCopied] = useState<string | null>(null);
  const [savedColors, setSavedColors] = useState<string[]>([]);

  // Convert HEX to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  // Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  // Update all formats when color changes
  useEffect(() => {
    const rgb = hexToRgb(color);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const alpha = opacity / 100;

    setFormats({
      hex: color.toUpperCase(),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`,
    });
  }, [color, opacity]);

  // Load saved colors
  useEffect(() => {
    const saved = localStorage.getItem("saved_colors");
    if (saved) {
      setSavedColors(JSON.parse(saved));
    }
  }, []);

  const copyToClipboard = async (text: string, format: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  const saveColor = () => {
    if (!savedColors.includes(color)) {
      const updated = [...savedColors, color].slice(-12);
      setSavedColors(updated);
      localStorage.setItem("saved_colors", JSON.stringify(updated));
    }
  };

  const removeColor = (c: string) => {
    const updated = savedColors.filter((sc) => sc !== c);
    setSavedColors(updated);
    localStorage.setItem("saved_colors", JSON.stringify(updated));
  };

  const generateRandomColor = () => {
    const randomHex = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    setColor(randomHex);
  };

  const presetColors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
    "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
    "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b",
  ];

  return (
    <Layout>
      <SEOHead
        title="Color Picker"
        description="Pick any color and get its HEX, RGB, HSL, and RGBA values. Save your favorites and build palettes on the fly."
        canonical="/tools/color-picker"
        keywords={["color picker", "hex color", "rgb converter", "hsl color", "color formats"]}
      />
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center mx-auto mb-4">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Color Picker</h1>
            <p className="text-muted-foreground">
              Pick colors and convert between formats
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Color Picker */}
            <div>
              {/* Main Color Preview */}
              <div
                className="h-48 rounded-2xl mb-4 shadow-lg transition-colors"
                style={{ backgroundColor: formats.rgba }}
              />

              {/* Color Input */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="h-12 rounded-lg border border-border cursor-pointer"
                    style={{ backgroundColor: color }}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-background font-mono uppercase"
                  />
                </div>
                <Button onClick={generateRandomColor} variant="outline" size="icon" className="h-12 w-12">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Opacity Slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium">Opacity</label>
                  <span className="text-sm text-muted-foreground">{opacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, transparent, ${color})`,
                  }}
                />
              </div>

              {/* Preset Colors */}
              <div>
                <label className="font-medium block mb-2">Presets</label>
                <div className="grid grid-cols-9 gap-2">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-lg border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Color Formats */}
            <div>
              <div className="space-y-4 mb-6">
                {Object.entries(formats).map(([format, value]) => (
                  <div
                    key={format}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <span className="text-sm font-medium uppercase text-muted-foreground w-12">
                      {format}
                    </span>
                    <code className="flex-1 font-mono text-sm">{value}</code>
                    <button
                      onClick={() => copyToClipboard(value, format)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      {copied === format ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Save Color */}
              <Button onClick={saveColor} className="w-full gap-2 mb-6">
                <Plus className="w-4 h-4" />
                Save Color
              </Button>

              {/* Saved Colors */}
              {savedColors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium">Saved Colors</label>
                    <button
                      onClick={() => {
                        setSavedColors([]);
                        localStorage.removeItem("saved_colors");
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {savedColors.map((c) => (
                      <div key={c} className="relative group">
                        <button
                          onClick={() => setColor(c)}
                          className="w-full aspect-square rounded-lg border border-border hover:scale-105 transition-transform"
                          style={{ backgroundColor: c }}
                        />
                        <button
                          onClick={() => removeColor(c)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Color Harmony */}
          <div className="mt-12 p-6 bg-muted/30 rounded-xl">
            <h2 className="font-semibold mb-4">Color Harmonies</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Complementary */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Complementary</p>
                <div className="flex gap-1">
                  <div className="flex-1 h-8 rounded" style={{ backgroundColor: color }} />
                  <div
                    className="flex-1 h-8 rounded"
                    style={{
                      backgroundColor: `hsl(${(parseInt(formats.hsl.match(/\d+/)?.[0] || "0") + 180) % 360}, 70%, 50%)`,
                    }}
                  />
                </div>
              </div>
              {/* Triadic */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Triadic</p>
                <div className="flex gap-1">
                  <div className="flex-1 h-8 rounded" style={{ backgroundColor: color }} />
                  <div
                    className="flex-1 h-8 rounded"
                    style={{
                      backgroundColor: `hsl(${(parseInt(formats.hsl.match(/\d+/)?.[0] || "0") + 120) % 360}, 70%, 50%)`,
                    }}
                  />
                  <div
                    className="flex-1 h-8 rounded"
                    style={{
                      backgroundColor: `hsl(${(parseInt(formats.hsl.match(/\d+/)?.[0] || "0") + 240) % 360}, 70%, 50%)`,
                    }}
                  />
                </div>
              </div>
              {/* Analogous */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Analogous</p>
                <div className="flex gap-1">
                  <div
                    className="flex-1 h-8 rounded"
                    style={{
                      backgroundColor: `hsl(${(parseInt(formats.hsl.match(/\d+/)?.[0] || "0") - 30 + 360) % 360}, 70%, 50%)`,
                    }}
                  />
                  <div className="flex-1 h-8 rounded" style={{ backgroundColor: color }} />
                  <div
                    className="flex-1 h-8 rounded"
                    style={{
                      backgroundColor: `hsl(${(parseInt(formats.hsl.match(/\d+/)?.[0] || "0") + 30) % 360}, 70%, 50%)`,
                    }}
                  />
                </div>
              </div>
              {/* Split Complementary */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Split Comp.</p>
                <div className="flex gap-1">
                  <div className="flex-1 h-8 rounded" style={{ backgroundColor: color }} />
                  <div
                    className="flex-1 h-8 rounded"
                    style={{
                      backgroundColor: `hsl(${(parseInt(formats.hsl.match(/\d+/)?.[0] || "0") + 150) % 360}, 70%, 50%)`,
                    }}
                  />
                  <div
                    className="flex-1 h-8 rounded"
                    style={{
                      backgroundColor: `hsl(${(parseInt(formats.hsl.match(/\d+/)?.[0] || "0") + 210) % 360}, 70%, 50%)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
