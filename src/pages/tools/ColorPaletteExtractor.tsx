import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Palette,
  Upload,
  Copy,
  Download,
  Image as ImageIcon,
  Pipette,
  RefreshCw,
  Code,
  Check,
  Link,
  Trash2,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

// --- Color utility types and functions ---

interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  count: number;
  percentage: number;
}

interface PaletteEntry {
  id: string;
  colors: ExtractedColor[];
  imageName: string;
  timestamp: number;
  thumbnail?: string;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  ).toUpperCase();
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
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
}

function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number }
): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
  );
}

// --- Median Cut Algorithm ---

interface ColorBucket {
  colors: { r: number; g: number; b: number; count: number }[];
}

function getColorRange(bucket: ColorBucket): { channel: "r" | "g" | "b"; range: number } {
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
  for (const c of bucket.colors) {
    if (c.r < minR) minR = c.r;
    if (c.r > maxR) maxR = c.r;
    if (c.g < minG) minG = c.g;
    if (c.g > maxG) maxG = c.g;
    if (c.b < minB) minB = c.b;
    if (c.b > maxB) maxB = c.b;
  }
  const rRange = maxR - minR;
  const gRange = maxG - minG;
  const bRange = maxB - minB;

  if (rRange >= gRange && rRange >= bRange) return { channel: "r", range: rRange };
  if (gRange >= rRange && gRange >= bRange) return { channel: "g", range: gRange };
  return { channel: "b", range: bRange };
}

function medianCut(
  pixels: { r: number; g: number; b: number; count: number }[],
  targetColors: number
): ExtractedColor[] {
  if (pixels.length === 0) return [];

  let buckets: ColorBucket[] = [{ colors: pixels }];

  while (buckets.length < targetColors) {
    // Find the bucket with the largest color range
    let maxRange = -1;
    let maxIdx = 0;
    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i].colors.length < 2) continue;
      const { range } = getColorRange(buckets[i]);
      if (range > maxRange) {
        maxRange = range;
        maxIdx = i;
      }
    }

    if (maxRange <= 0) break;

    const bucket = buckets[maxIdx];
    const { channel } = getColorRange(bucket);

    // Sort by the channel with the largest range
    bucket.colors.sort((a, b) => a[channel] - b[channel]);

    // Split at the median
    const mid = Math.floor(bucket.colors.length / 2);
    const bucket1: ColorBucket = { colors: bucket.colors.slice(0, mid) };
    const bucket2: ColorBucket = { colors: bucket.colors.slice(mid) };

    buckets.splice(maxIdx, 1, bucket1, bucket2);
  }

  // Calculate total pixel count
  const totalPixels = pixels.reduce((sum, p) => sum + p.count, 0);

  // Average each bucket
  return buckets
    .map((bucket) => {
      const total = bucket.colors.reduce((sum, c) => sum + c.count, 0);
      const r = Math.round(
        bucket.colors.reduce((sum, c) => sum + c.r * c.count, 0) / total
      );
      const g = Math.round(
        bucket.colors.reduce((sum, c) => sum + c.g * c.count, 0) / total
      );
      const b = Math.round(
        bucket.colors.reduce((sum, c) => sum + c.b * c.count, 0) / total
      );
      return {
        hex: rgbToHex(r, g, b),
        rgb: { r, g, b },
        hsl: rgbToHsl(r, g, b),
        count: total,
        percentage: Math.round((total / totalPixels) * 100),
      };
    })
    .sort((a, b) => b.count - a.count);
}

function extractColorsFromImageData(
  imageData: ImageData,
  numColors: number = 8
): ExtractedColor[] {
  const data = imageData.data;
  const pixelMap = new Map<string, { r: number; g: number; b: number; count: number }>();

  // Sample every 4th pixel for performance, quantize to reduce noise
  const step = 4;
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = Math.round(data[i] / 8) * 8;
    const g = Math.round(data[i + 1] / 8) * 8;
    const b = Math.round(data[i + 2] / 8) * 8;
    const a = data[i + 3];

    // Skip nearly transparent pixels
    if (a < 128) continue;
    // Skip near-white and near-black (often background)
    if (r > 245 && g > 245 && b > 245) continue;
    if (r < 10 && g < 10 && b < 10) continue;

    const key = `${r},${g},${b}`;
    const existing = pixelMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      pixelMap.set(key, { r, g, b, count: 1 });
    }
  }

  const pixels = Array.from(pixelMap.values());

  // Merge very similar colors
  const merged: typeof pixels = [];
  const used = new Set<number>();
  for (let i = 0; i < pixels.length; i++) {
    if (used.has(i)) continue;
    let current = { ...pixels[i] };
    for (let j = i + 1; j < pixels.length; j++) {
      if (used.has(j)) continue;
      if (colorDistance(current, pixels[j]) < 25) {
        current.count += pixels[j].count;
        used.add(j);
      }
    }
    merged.push(current);
  }

  return medianCut(merged, numColors);
}

// --- Palette generation helpers ---

function generateComplementary(colors: ExtractedColor[]): string[] {
  return colors.slice(0, 4).flatMap((c) => {
    const compH = (c.hsl.h + 180) % 360;
    const comp = hslToRgb(compH, c.hsl.s, c.hsl.l);
    return [c.hex, rgbToHex(comp.r, comp.g, comp.b)];
  });
}

function generateAnalogous(colors: ExtractedColor[]): string[] {
  const base = colors[0];
  if (!base) return [];
  return [-30, -15, 0, 15, 30].map((offset) => {
    const h = (base.hsl.h + offset + 360) % 360;
    const rgb = hslToRgb(h, base.hsl.s, base.hsl.l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  });
}

function generateTriadic(colors: ExtractedColor[]): string[] {
  const base = colors[0];
  if (!base) return [];
  return [0, 120, 240].map((offset) => {
    const h = (base.hsl.h + offset) % 360;
    const rgb = hslToRgb(h, base.hsl.s, base.hsl.l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  });
}

// --- Export helpers ---

function exportAsCSS(colors: ExtractedColor[]): string {
  const vars = colors
    .map(
      (c, i) =>
        `  --color-${i + 1}: ${c.hex}; /* rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b}) */`
    )
    .join("\n");
  return `:root {\n${vars}\n}`;
}

function exportAsTailwind(colors: ExtractedColor[]): string {
  const entries = colors
    .map((c, i) => `        '${i + 1}': '${c.hex}',`)
    .join("\n");
  return `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n${entries}\n        },\n      },\n    },\n  },\n};`;
}

function exportAsSCSS(colors: ExtractedColor[]): string {
  return colors
    .map((c, i) => `$color-${i + 1}: ${c.hex};`)
    .join("\n");
}

function exportAsJSON(colors: ExtractedColor[]): string {
  return JSON.stringify(
    colors.map((c) => ({
      hex: c.hex,
      rgb: `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
      hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
      percentage: `${c.percentage}%`,
    })),
    null,
    2
  );
}

function exportAsPNG(colors: ExtractedColor[]): void {
  const canvas = document.createElement("canvas");
  const swatchWidth = 120;
  const swatchHeight = 120;
  const labelHeight = 30;
  canvas.width = colors.length * swatchWidth;
  canvas.height = swatchHeight + labelHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  colors.forEach((c, i) => {
    const x = i * swatchWidth;
    ctx.fillStyle = c.hex;
    ctx.fillRect(x, 0, swatchWidth, swatchHeight);
    ctx.fillStyle = "#333333";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(c.hex, x + swatchWidth / 2, swatchHeight + 20);
  });

  const link = document.createElement("a");
  link.download = "palette.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// --- Main component ---

export default function ColorPaletteExtractor() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [colors, setColors] = useState<ExtractedColor[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [numColors, setNumColors] = useState(6);
  const [history, setHistory] = useState<PaletteEntry[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [exportTab, setExportTab] = useState("css");
  const [harmonyTab, setHarmonyTab] = useState("complementary");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("palette_extractor_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const saveToHistory = useCallback(
    (extractedColors: ExtractedColor[], name: string, thumbnail?: string) => {
      const entry: PaletteEntry = {
        id: Date.now().toString(),
        colors: extractedColors,
        imageName: name,
        timestamp: Date.now(),
        thumbnail,
      };
      setHistory((prev) => {
        const updated = [entry, ...prev].slice(0, 20);
        localStorage.setItem(
          "palette_extractor_history",
          JSON.stringify(updated)
        );
        return updated;
      });
    },
    []
  );

  const extractColors = useCallback(
    (img: HTMLImageElement, name: string) => {
      setIsExtracting(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Scale down for performance
      const maxDim = 300;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);

      // Use setTimeout to avoid blocking UI
      setTimeout(() => {
        const extracted = extractColorsFromImageData(imageData, numColors);
        setColors(extracted);
        setIsExtracting(false);

        // Create thumbnail
        const thumbCanvas = document.createElement("canvas");
        thumbCanvas.width = 80;
        thumbCanvas.height = 80;
        const thumbCtx = thumbCanvas.getContext("2d");
        if (thumbCtx) {
          thumbCtx.drawImage(img, 0, 0, 80, 80);
          saveToHistory(extracted, name, thumbCanvas.toDataURL("image/jpeg", 0.5));
        } else {
          saveToHistory(extracted, name);
        }
      }, 50);
    },
    [numColors, saveToHistory]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setImageName(file.name);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      const img = new Image();
      img.onload = () => extractColors(img, file.name);
      img.src = url;
    },
    [extractColors]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUrlLoad = useCallback(() => {
    if (!urlInput.trim()) return;
    setUrlError("");
    setIsExtracting(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageUrl(urlInput);
      setImageName(urlInput.split("/").pop() || "url-image");
      extractColors(img, urlInput.split("/").pop() || "url-image");
    };
    img.onerror = () => {
      setUrlError(
        "Failed to load image. The server may not allow cross-origin access."
      );
      setIsExtracting(false);
    };
    img.src = urlInput;
  }, [urlInput, extractColors]);

  const reExtract = useCallback(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => extractColors(img, imageName);
    img.src = imageUrl;
  }, [imageUrl, imageName, extractColors]);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const loadFromHistory = (entry: PaletteEntry) => {
    setColors(entry.colors);
    setImageName(entry.imageName);
    setImageUrl(entry.thumbnail || null);
  };

  const removeFromHistory = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem(
        "palette_extractor_history",
        JSON.stringify(updated)
      );
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("palette_extractor_history");
  };

  const getHarmonyColors = (): string[] => {
    if (colors.length === 0) return [];
    switch (harmonyTab) {
      case "complementary":
        return generateComplementary(colors);
      case "analogous":
        return generateAnalogous(colors);
      case "triadic":
        return generateTriadic(colors);
      default:
        return [];
    }
  };

  const getExportCode = (): string => {
    if (colors.length === 0) return "";
    switch (exportTab) {
      case "css":
        return exportAsCSS(colors);
      case "tailwind":
        return exportAsTailwind(colors);
      case "scss":
        return exportAsSCSS(colors);
      case "json":
        return exportAsJSON(colors);
      default:
        return "";
    }
  };

  const getLuminance = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  return (
    <Layout>
      <SEOHead
        title="Color Palette Extractor"
        description="Upload any image and instantly pull out its dominant colors. Great for designers who need quick color inspiration."
        canonical="/tools/color-palette-extractor"
        keywords={["color palette extractor", "image colors", "color picker from image", "design colors", "palette generator"]}
      />
      <div className="container py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
              <Pipette className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Color Palette Extractor
            </h1>
            <p className="text-muted-foreground">
              Extract dominant colors from any image — 100% client-side
            </p>
          </div>

          {/* Hidden canvas for pixel extraction */}
          <canvas ref={canvasRef} className="hidden" />

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left column: Upload + Image preview */}
            <div className="lg:col-span-3 space-y-6">
              {/* Upload Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
                  isDragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                {/* Animated gradient border effect */}
                <div
                  className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${
                    isDragOver ? "opacity-100" : ""
                  }`}
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(244,63,94,0.15), rgba(139,92,246,0.15))",
                  }}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="p-4">
                    <img
                      src={imageUrl}
                      alt="Uploaded"
                      className="w-full max-h-80 object-contain rounded-xl"
                    />
                    <p className="text-center text-sm text-muted-foreground mt-3">
                      {imageName} — click or drop to replace
                    </p>
                  </div>
                ) : (
                  <div className="py-16 px-8 text-center">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/10 to-violet-500/10 flex items-center justify-center mx-auto mb-4"
                    >
                      <Upload className="w-10 h-10 text-muted-foreground" />
                    </motion.div>
                    <p className="text-lg font-medium mb-1">
                      Drag & drop an image here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse. Supports PNG, JPG, WEBP, GIF, SVG
                    </p>
                  </div>
                )}
              </div>

              {/* URL Input */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Link className="w-4 h-4 text-muted-foreground" />
                  <Label className="font-medium">Generate from URL</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlLoad()}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    onClick={handleUrlLoad}
                    disabled={!urlInput.trim() || isExtracting}
                    variant="outline"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Load
                  </Button>
                </div>
                {urlError && (
                  <p className="text-sm text-red-500 mt-2">{urlError}</p>
                )}
              </Card>

              {/* Number of colors slider */}
              {imageUrl && (
                <div className="flex items-center gap-4">
                  <Label className="whitespace-nowrap font-medium">
                    Colors: {numColors}
                  </Label>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    value={numColors}
                    onChange={(e) => setNumColors(Number(e.target.value))}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-muted"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={reExtract}
                    disabled={isExtracting}
                    className="gap-1"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isExtracting ? "animate-spin" : ""}`}
                    />
                    Re-extract
                  </Button>
                </div>
              )}

              {/* Extracted Colors */}
              <AnimatePresence mode="wait">
                {isExtracting ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Extracting colors...
                    </p>
                  </motion.div>
                ) : colors.length > 0 ? (
                  <motion.div
                    key="colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Color strip preview */}
                    <div className="flex rounded-2xl overflow-hidden h-20 shadow-lg mb-6">
                      {colors.map((c, i) => (
                        <motion.div
                          key={c.hex + i}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="h-full cursor-pointer relative group"
                          style={{
                            backgroundColor: c.hex,
                            flex: c.percentage || 1,
                          }}
                          onClick={() =>
                            copyToClipboard(c.hex, `strip-${i}`)
                          }
                          title={c.hex}
                        >
                          <span
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono font-bold"
                            style={{
                              color:
                                getLuminance(c.hex) > 0.5
                                  ? "#000000"
                                  : "#ffffff",
                            }}
                          >
                            {copied === `strip-${i}` ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              c.hex
                            )}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Individual color cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {colors.map((c, i) => (
                        <motion.div
                          key={c.hex + i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Card className="overflow-hidden group">
                            <div
                              className="h-24 relative cursor-pointer"
                              style={{ backgroundColor: c.hex }}
                              onClick={() =>
                                copyToClipboard(c.hex, `card-hex-${i}`)
                              }
                            >
                              <Badge
                                className="absolute top-2 right-2 text-[10px]"
                                variant="secondary"
                              >
                                {c.percentage}%
                              </Badge>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {copied === `card-hex-${i}` ? (
                                  <Check
                                    className="w-5 h-5"
                                    style={{
                                      color:
                                        getLuminance(c.hex) > 0.5
                                          ? "#000"
                                          : "#fff",
                                    }}
                                  />
                                ) : (
                                  <Copy
                                    className="w-5 h-5"
                                    style={{
                                      color:
                                        getLuminance(c.hex) > 0.5
                                          ? "#000"
                                          : "#fff",
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="p-2.5 space-y-1">
                              <button
                                onClick={() =>
                                  copyToClipboard(c.hex, `hex-${i}`)
                                }
                                className="w-full flex items-center justify-between text-xs hover:bg-muted/50 rounded px-1.5 py-0.5 transition-colors"
                              >
                                <span className="font-mono font-medium">
                                  {c.hex}
                                </span>
                                {copied === `hex-${i}` ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3 text-muted-foreground" />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
                                    `rgb-${i}`
                                  )
                                }
                                className="w-full flex items-center justify-between text-xs hover:bg-muted/50 rounded px-1.5 py-0.5 transition-colors"
                              >
                                <span className="font-mono text-muted-foreground">
                                  {c.rgb.r}, {c.rgb.g}, {c.rgb.b}
                                </span>
                                {copied === `rgb-${i}` ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3 text-muted-foreground" />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
                                    `hsl-${i}`
                                  )
                                }
                                className="w-full flex items-center justify-between text-xs hover:bg-muted/50 rounded px-1.5 py-0.5 transition-colors"
                              >
                                <span className="font-mono text-muted-foreground">
                                  {c.hsl.h}, {c.hsl.s}%, {c.hsl.l}%
                                </span>
                                {copied === `hsl-${i}` ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Right column: Harmonies + Export + History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Color Harmonies */}
              {colors.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold">Color Harmonies</h2>
                  </div>
                  <Tabs
                    value={harmonyTab}
                    onValueChange={setHarmonyTab}
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="complementary" className="flex-1 text-xs">
                        Complementary
                      </TabsTrigger>
                      <TabsTrigger value="analogous" className="flex-1 text-xs">
                        Analogous
                      </TabsTrigger>
                      <TabsTrigger value="triadic" className="flex-1 text-xs">
                        Triadic
                      </TabsTrigger>
                    </TabsList>

                    {["complementary", "analogous", "triadic"].map((tab) => (
                      <TabsContent key={tab} value={tab} className="mt-3">
                        <div className="flex rounded-xl overflow-hidden h-14 shadow-sm">
                          {harmonyTab === tab &&
                            getHarmonyColors().map((hex, i) => (
                              <div
                                key={hex + i}
                                className="flex-1 h-full cursor-pointer relative group"
                                style={{ backgroundColor: hex }}
                                onClick={() =>
                                  copyToClipboard(hex, `harmony-${i}`)
                                }
                                title={hex}
                              >
                                <span
                                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold"
                                  style={{
                                    color:
                                      getLuminance(hex) > 0.5
                                        ? "#000"
                                        : "#fff",
                                  }}
                                >
                                  {copied === `harmony-${i}` ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    hex
                                  )}
                                </span>
                              </div>
                            ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </Card>
              )}

              {/* Export */}
              {colors.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold">Export Palette</h2>
                  </div>

                  <Tabs value={exportTab} onValueChange={setExportTab}>
                    <TabsList className="w-full">
                      <TabsTrigger value="css" className="flex-1 text-xs">
                        CSS
                      </TabsTrigger>
                      <TabsTrigger value="tailwind" className="flex-1 text-xs">
                        Tailwind
                      </TabsTrigger>
                      <TabsTrigger value="scss" className="flex-1 text-xs">
                        SCSS
                      </TabsTrigger>
                      <TabsTrigger value="json" className="flex-1 text-xs">
                        JSON
                      </TabsTrigger>
                    </TabsList>

                    {["css", "tailwind", "scss", "json"].map((tab) => (
                      <TabsContent key={tab} value={tab} className="mt-3">
                        <div className="relative">
                          <pre className="text-xs font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-48 whitespace-pre-wrap">
                            {exportTab === tab && getExportCode()}
                          </pre>
                          <button
                            onClick={() =>
                              copyToClipboard(getExportCode(), `export-${tab}`)
                            }
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-background border border-border transition-colors"
                          >
                            {copied === `export-${tab}` ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                  {/* Download PNG */}
                  <Button
                    onClick={() => exportAsPNG(colors)}
                    variant="outline"
                    className="w-full mt-3 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download as PNG
                  </Button>
                </Card>
              )}

              {/* History */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold">Palette History</h2>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No palettes saved yet. Extract colors from an image to get
                    started.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {history.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group relative"
                      >
                        <button
                          onClick={() => loadFromHistory(entry)}
                          className="w-full text-left p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            {entry.thumbnail && (
                              <img
                                src={entry.thumbnail}
                                alt=""
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {entry.imageName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleDateString()}{" "}
                                {new Date(entry.timestamp).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex rounded overflow-hidden h-5">
                            {entry.colors.map((c, i) => (
                              <div
                                key={i}
                                className="flex-1 h-full"
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromHistory(entry.id);
                          }}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-12 p-6 bg-muted/30 rounded-xl">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              How it works
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="block font-medium text-foreground mb-1">
                  1. Upload
                </span>
                Drop or browse for any image. You can also paste an image URL.
              </div>
              <div>
                <span className="block font-medium text-foreground mb-1">
                  2. Analyze
                </span>
                The Canvas API reads pixel data entirely in your browser — nothing
                is uploaded to any server.
              </div>
              <div>
                <span className="block font-medium text-foreground mb-1">
                  3. Quantize
                </span>
                A median cut algorithm groups similar pixels to find the dominant
                colors in the image.
              </div>
              <div>
                <span className="block font-medium text-foreground mb-1">
                  4. Export
                </span>
                Copy individual colors, generate harmonies, or export the full
                palette as CSS, Tailwind, SCSS, JSON, or PNG.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
