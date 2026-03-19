import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Image,
  Upload,
  Download,
  RefreshCw,
  Maximize,
  Minimize,
  FileImage,
  ArrowRight,
  Trash2,
  ZoomIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type OutputFormat = "image/png" | "image/jpeg" | "image/webp" | "image/bmp";

interface ResizeOption {
  mode: "none" | "custom" | "percentage" | "preset";
  width: number;
  height: number;
  percentage: number;
  preset: string;
}

interface ConvertedResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  size: number;
}

interface ImageEntry {
  id: string;
  file: File;
  preview: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  outputFormat: OutputFormat;
  quality: number;
  resize: ResizeOption;
  maintainAspectRatio: boolean;
  outputName: string;
  converted?: ConvertedResult;
  isConverting: boolean;
}

interface HistoryItem {
  id: string;
  originalName: string;
  originalSize: number;
  convertedSize: number;
  fromFormat: string;
  toFormat: string;
  dimensions: string;
  timestamp: number;
}

// ─── Preset Sizes ────────────────────────────────────────────────────────────

const PRESET_SIZES: Record<string, { width: number; height: number; label: string }> = {
  thumbnail: { width: 150, height: 150, label: "Thumbnail (150x150)" },
  social: { width: 1200, height: 630, label: "Social Media (1200x630)" },
  wallpaper: { width: 1920, height: 1080, label: "Wallpaper (1920x1080)" },
  avatar: { width: 400, height: 400, label: "Avatar (400x400)" },
  banner: { width: 1500, height: 500, label: "Banner (1500x500)" },
  instagram: { width: 1080, height: 1080, label: "Instagram Post (1080x1080)" },
};

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/jpeg", label: "JPG", ext: "jpg" },
  { value: "image/webp", label: "WebP", ext: "webp" },
  { value: "image/bmp", label: "BMP", ext: "bmp" },
];

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/bmp", "image/gif", "image/svg+xml"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatLabel(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "PNG",
    "image/jpeg": "JPG",
    "image/webp": "WebP",
    "image/bmp": "BMP",
    "image/gif": "GIF",
    "image/svg+xml": "SVG",
  };
  return map[mime] || mime;
}

function stripExt(name: string): string {
  return name.replace(/\.[^/.]+$/, "");
}

function extForFormat(fmt: OutputFormat): string {
  return FORMAT_OPTIONS.find((f) => f.value === fmt)?.ext || "png";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImageConverter() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [globalFormat, setGlobalFormat] = useState<OutputFormat>("image/png");
  const [globalQuality, setGlobalQuality] = useState(85);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File intake ──────────────────────────────────────────────────────────

  const addFiles = useCallback(
    (files: File[]) => {
      const valid = files.filter((f) => ACCEPTED_TYPES.includes(f.type));
      if (valid.length !== files.length) {
        toast.error("Some files were skipped — only PNG, JPG, WebP, BMP, GIF, and SVG are supported.");
      }
      if (valid.length === 0) return;

      valid.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new window.Image();
          img.onload = () => {
            const entry: ImageEntry = {
              id: uid(),
              file,
              preview: e.target?.result as string,
              originalWidth: img.width,
              originalHeight: img.height,
              originalSize: file.size,
              outputFormat: globalFormat,
              quality: globalQuality,
              resize: { mode: "none", width: img.width, height: img.height, percentage: 100, preset: "thumbnail" },
              maintainAspectRatio: true,
              outputName: stripExt(file.name),
              isConverting: false,
            };
            setImages((prev) => [...prev, entry]);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    },
    [globalFormat, globalQuality]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  // ── Per-image updaters ───────────────────────────────────────────────────

  const updateImage = (id: string, patch: Partial<ImageEntry>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (previewId === id) setPreviewId(null);
  };

  const clearAll = () => {
    setImages([]);
    setPreviewId(null);
  };

  // ── Resize dimension helpers ─────────────────────────────────────────────

  const computeOutputDimensions = (entry: ImageEntry): { w: number; h: number } => {
    const { resize, originalWidth, originalHeight } = entry;
    switch (resize.mode) {
      case "custom":
        return { w: resize.width || originalWidth, h: resize.height || originalHeight };
      case "percentage": {
        const s = (resize.percentage || 100) / 100;
        return { w: Math.round(originalWidth * s), h: Math.round(originalHeight * s) };
      }
      case "preset": {
        const p = PRESET_SIZES[resize.preset];
        return p ? { w: p.width, h: p.height } : { w: originalWidth, h: originalHeight };
      }
      default:
        return { w: originalWidth, h: originalHeight };
    }
  };

  const handleResizeWidthChange = (id: string, entry: ImageEntry, newWidth: number) => {
    const resize = { ...entry.resize, width: newWidth };
    if (entry.maintainAspectRatio && entry.originalWidth > 0) {
      resize.height = Math.round((newWidth / entry.originalWidth) * entry.originalHeight);
    }
    updateImage(id, { resize });
  };

  const handleResizeHeightChange = (id: string, entry: ImageEntry, newHeight: number) => {
    const resize = { ...entry.resize, height: newHeight };
    if (entry.maintainAspectRatio && entry.originalHeight > 0) {
      resize.width = Math.round((newHeight / entry.originalHeight) * entry.originalWidth);
    }
    updateImage(id, { resize });
  };

  // ── Conversion engine ────────────────────────────────────────────────────

  const convertOne = (entry: ImageEntry): Promise<ConvertedResult> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        try {
          const { w, h } = computeOutputDimensions(entry);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context unavailable"));
            return;
          }

          // White background for JPG/BMP (no transparency)
          if (entry.outputFormat === "image/jpeg" || entry.outputFormat === "image/bmp") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
          }

          ctx.drawImage(img, 0, 0, w, h);

          const qualityParam =
            entry.outputFormat === "image/jpeg" || entry.outputFormat === "image/webp"
              ? entry.quality / 100
              : undefined;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Conversion failed"));
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  dataUrl: reader.result as string,
                  blob,
                  width: w,
                  height: h,
                  size: blob.size,
                });
              };
              reader.readAsDataURL(blob);
            },
            entry.outputFormat,
            qualityParam
          );
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = entry.preview;
    });
  };

  const handleConvertAll = async () => {
    if (images.length === 0) {
      toast.error("Please add images first.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    let completed = 0;
    const total = images.length;

    for (const entry of images) {
      updateImage(entry.id, { isConverting: true });
      try {
        const result = await convertOne(entry);
        updateImage(entry.id, { converted: result, isConverting: false });

        // Add to history
        setHistory((prev) => [
          {
            id: uid(),
            originalName: entry.file.name,
            originalSize: entry.originalSize,
            convertedSize: result.size,
            fromFormat: formatLabel(entry.file.type),
            toFormat: formatLabel(entry.outputFormat),
            dimensions: `${result.width}x${result.height}`,
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, 20));
      } catch {
        updateImage(entry.id, { isConverting: false });
        toast.error(`Failed to convert ${entry.file.name}`);
      }
      completed++;
      setProgress(Math.round((completed / total) * 100));
    }

    setIsProcessing(false);
    toast.success(`${total} image(s) converted successfully!`);
  };

  // ── Downloads ────────────────────────────────────────────────────────────

  const downloadOne = (entry: ImageEntry) => {
    if (!entry.converted) return;
    const a = document.createElement("a");
    a.href = entry.converted.dataUrl;
    a.download = `${entry.outputName}.${extForFormat(entry.outputFormat)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    const convertedImages = images.filter((img) => img.converted);
    if (convertedImages.length === 0) return;

    if (convertedImages.length === 1) {
      downloadOne(convertedImages[0]);
      return;
    }

    // Multiple files — download each individually
    convertedImages.forEach((img, i) => {
      setTimeout(() => downloadOne(img), i * 300);
    });
    toast.success(`Downloading ${convertedImages.length} files...`);
  };

  // ── Apply global settings ────────────────────────────────────────────────

  const applyGlobalFormat = (fmt: OutputFormat) => {
    setGlobalFormat(fmt);
    setImages((prev) => prev.map((img) => ({ ...img, outputFormat: fmt, converted: undefined })));
  };

  const applyGlobalQuality = (q: number) => {
    setGlobalQuality(q);
    setImages((prev) => prev.map((img) => ({ ...img, quality: q, converted: undefined })));
  };

  // ── Computed ─────────────────────────────────────────────────────────────

  const convertedCount = images.filter((img) => img.converted).length;
  const previewEntry = images.find((img) => img.id === previewId);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout>
      <SEOHead
        title="Image Converter"
        description="Convert images between PNG, JPEG, WebP, and other formats. Resize, adjust quality, and batch convert with ease."
        canonical="/tools/image-converter"
        keywords={["image converter", "convert png to jpg", "webp converter", "image format", "photo converter"]}
      />
      <div className="container py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6"
            >
              <FileImage className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            >
              Image Converter
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg max-w-xl mx-auto"
            >
              Convert images between PNG, JPG, WebP and BMP — resize, adjust quality, and batch convert. 100% client-side, your files never leave your device.
            </motion.p>
          </div>

          {/* Upload Area */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8 mb-6"
          >
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium mb-1">
                Drag & drop images here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PNG, JPG, WebP, BMP, GIF, SVG — up to 20 MB each
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.bmp,.gif,.svg"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Global Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              {/* Output Format */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Output Format (all)</Label>
                <Select
                  value={globalFormat}
                  onValueChange={(v) => applyGlobalFormat(v as OutputFormat)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quality Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Quality (JPG / WebP)</Label>
                  <span className="text-sm font-bold text-primary">{globalQuality}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={globalQuality}
                  onChange={(e) => applyGlobalQuality(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Smaller file</span>
                  <span>Higher quality</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  variant="hero"
                  size="xl"
                  onClick={handleConvertAll}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Converting... {progress}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Convert {images.length} Image{images.length > 1 ? "s" : ""}
                    </span>
                  )}
                </Button>

                {convertedCount > 0 && (
                  <Button variant="outline" size="xl" onClick={downloadAll}>
                    <Download className="w-4 h-4 mr-2" />
                    Download {convertedCount > 1 ? `All (${convertedCount})` : ""}
                  </Button>
                )}

                <Button variant="ghost" size="xl" onClick={clearAll}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            )}

            {/* Progress bar */}
            {isProcessing && (
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </motion.div>

          {/* Image List */}
          <AnimatePresence>
            {images.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className="bg-card rounded-2xl border border-border shadow-card p-5 mb-4"
              >
                {/* Top row: thumbnail + metadata + actions */}
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div
                    className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer group"
                    onClick={() => setPreviewId(previewId === entry.id ? null : entry.id)}
                  >
                    <img
                      src={entry.converted?.dataUrl || entry.preview}
                      alt={entry.file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                    {entry.isConverting && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Filename (editable) */}
                    <div className="flex items-center gap-2 mb-1">
                      <Input
                        value={entry.outputName}
                        onChange={(e) => updateImage(entry.id, { outputName: e.target.value })}
                        className="h-7 text-sm font-medium px-2 max-w-[220px]"
                      />
                      <span className="text-xs text-muted-foreground">.{extForFormat(entry.outputFormat)}</span>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {formatLabel(entry.file.type)}
                      </Badge>
                      <ArrowRight className="w-3 h-3" />
                      <Badge variant="default" className="text-xs">
                        {formatLabel(entry.outputFormat)}
                      </Badge>
                      <span>
                        {entry.originalWidth}x{entry.originalHeight}
                      </span>
                      <span>{formatSize(entry.originalSize)}</span>
                      {entry.converted && (
                        <>
                          <ArrowRight className="w-3 h-3 text-primary" />
                          <span className="text-primary font-medium">
                            {formatSize(entry.converted.size)}
                          </span>
                          <span className="text-primary font-medium">
                            ({entry.converted.width}x{entry.converted.height})
                          </span>
                          {entry.converted.size < entry.originalSize ? (
                            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                              <Minimize className="w-3 h-3 mr-1" />
                              {Math.round(((entry.originalSize - entry.converted.size) / entry.originalSize) * 100)}% smaller
                            </Badge>
                          ) : entry.converted.size > entry.originalSize ? (
                            <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600">
                              <Maximize className="w-3 h-3 mr-1" />
                              {Math.round(((entry.converted.size - entry.originalSize) / entry.originalSize) * 100)}% larger
                            </Badge>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {entry.converted && (
                      <Button variant="outline" size="icon" onClick={() => downloadOne(entry)} title="Download">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => removeImage(entry.id)} title="Remove">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Per-image settings (collapsible via preview toggle) */}
                <AnimatePresence>
                  {previewId === entry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left: settings */}
                          <div className="space-y-4">
                            {/* Format */}
                            <div>
                              <Label className="text-xs font-medium mb-1 block">Output Format</Label>
                              <Select
                                value={entry.outputFormat}
                                onValueChange={(v) =>
                                  updateImage(entry.id, { outputFormat: v as OutputFormat, converted: undefined })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FORMAT_OPTIONS.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>
                                      {f.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Quality */}
                            {(entry.outputFormat === "image/jpeg" || entry.outputFormat === "image/webp") && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-medium">Quality</Label>
                                  <span className="text-xs font-bold text-primary">{entry.quality}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="100"
                                  value={entry.quality}
                                  onChange={(e) =>
                                    updateImage(entry.id, { quality: Number(e.target.value), converted: undefined })
                                  }
                                  className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                                />
                              </div>
                            )}

                            {/* Resize mode */}
                            <div>
                              <Label className="text-xs font-medium mb-1 block">Resize</Label>
                              <Select
                                value={entry.resize.mode}
                                onValueChange={(v) =>
                                  updateImage(entry.id, {
                                    resize: {
                                      ...entry.resize,
                                      mode: v as ResizeOption["mode"],
                                      width: entry.originalWidth,
                                      height: entry.originalHeight,
                                    },
                                    converted: undefined,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No Resize</SelectItem>
                                  <SelectItem value="custom">Custom Dimensions</SelectItem>
                                  <SelectItem value="percentage">Percentage Scale</SelectItem>
                                  <SelectItem value="preset">Preset Size</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Custom dimensions */}
                            {entry.resize.mode === "custom" && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <Label className="text-xs mb-1 block">Width (px)</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={entry.resize.width}
                                      onChange={(e) =>
                                        handleResizeWidthChange(entry.id, entry, Number(e.target.value))
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <span className="text-muted-foreground mt-5">x</span>
                                  <div className="flex-1">
                                    <Label className="text-xs mb-1 block">Height (px)</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={entry.resize.height}
                                      onChange={(e) =>
                                        handleResizeHeightChange(entry.id, entry, Number(e.target.value))
                                      }
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={entry.maintainAspectRatio}
                                    onCheckedChange={(v) =>
                                      updateImage(entry.id, { maintainAspectRatio: v })
                                    }
                                  />
                                  <Label className="text-xs">Maintain aspect ratio</Label>
                                </div>
                              </div>
                            )}

                            {/* Percentage */}
                            {entry.resize.mode === "percentage" && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs">Scale</Label>
                                  <span className="text-xs font-bold text-primary">{entry.resize.percentage}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="10"
                                  max="200"
                                  value={entry.resize.percentage}
                                  onChange={(e) =>
                                    updateImage(entry.id, {
                                      resize: { ...entry.resize, percentage: Number(e.target.value) },
                                      converted: undefined,
                                    })
                                  }
                                  className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Output: {Math.round(entry.originalWidth * (entry.resize.percentage / 100))}x
                                  {Math.round(entry.originalHeight * (entry.resize.percentage / 100))}
                                </p>
                              </div>
                            )}

                            {/* Preset */}
                            {entry.resize.mode === "preset" && (
                              <div>
                                <Select
                                  value={entry.resize.preset}
                                  onValueChange={(v) =>
                                    updateImage(entry.id, {
                                      resize: { ...entry.resize, preset: v },
                                      converted: undefined,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(PRESET_SIZES).map(([key, p]) => (
                                      <SelectItem key={key} value={key}>
                                        {p.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          {/* Right: preview */}
                          <div>
                            <Label className="text-xs font-medium mb-2 block">Preview</Label>
                            <div className="rounded-lg border border-border bg-muted/30 p-2 flex items-center justify-center min-h-[200px]">
                              <img
                                src={entry.converted?.dataUrl || entry.preview}
                                alt="Preview"
                                className="max-w-full max-h-[280px] rounded object-contain"
                              />
                            </div>
                            {entry.converted && (
                              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-muted/50 rounded-lg p-2 text-center">
                                  <p className="text-muted-foreground">Original</p>
                                  <p className="font-semibold text-foreground">{formatSize(entry.originalSize)}</p>
                                  <p className="text-muted-foreground">
                                    {entry.originalWidth}x{entry.originalHeight}
                                  </p>
                                </div>
                                <div className="bg-primary/5 rounded-lg p-2 text-center">
                                  <p className="text-muted-foreground">Converted</p>
                                  <p className="font-semibold text-primary">{formatSize(entry.converted.size)}</p>
                                  <p className="text-muted-foreground">
                                    {entry.converted.width}x{entry.converted.height}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Conversion History */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl border border-border shadow-card p-6 mt-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Recent Conversions
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                  Clear History
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileImage className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-foreground">{item.originalName}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                      <span>
                        <Badge variant="secondary" className="text-[10px]">{item.fromFormat}</Badge>
                        <ArrowRight className="w-3 h-3 inline mx-1" />
                        <Badge variant="default" className="text-[10px]">{item.toFormat}</Badge>
                      </span>
                      <span>{item.dimensions}</span>
                      <span>
                        {formatSize(item.originalSize)} → {formatSize(item.convertedSize)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tips */}
          <div className="mt-10 p-6 rounded-2xl bg-muted/50">
            <h3 className="font-semibold text-foreground mb-4">Conversion Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                <strong>PNG</strong> is best for graphics, screenshots, and images with transparency.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                <strong>JPG</strong> is ideal for photographs — use 80-90% quality for a good balance.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                <strong>WebP</strong> offers the best compression for web use (30% smaller than JPG at similar quality).
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                <strong>BMP</strong> is uncompressed — use only when lossless raw data is required.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                Click any image thumbnail to expand per-image settings (format, quality, resize).
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                All processing happens in your browser — files never leave your device.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
