import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Upload,
  Download,
  Trash2,
  Type,
  Image as ImageIcon,
  Smile,
  Clock,
  X,
  GripVertical,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemeTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  color: string;
  textAreas: { label: string; x: number; y: number; maxWidth: number }[];
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  strokeEnabled: boolean;
  strokeColor: string;
  isDragging: boolean;
}

interface HistoryEntry {
  id: string;
  thumbnail: string;
  templateName: string;
  timestamp: number;
}

// ─── Meme Templates ─────────────────────────────────────────────────────────

const MEME_TEMPLATES: MemeTemplate[] = [
  {
    id: "drake",
    name: "Drake Hotline Bling",
    width: 600,
    height: 600,
    color: "#f0d0a0",
    textAreas: [
      { label: "Top (No)", x: 400, y: 150, maxWidth: 260 },
      { label: "Bottom (Yes)", x: 400, y: 450, maxWidth: 260 },
    ],
  },
  {
    id: "distracted",
    name: "Distracted Boyfriend",
    width: 700,
    height: 450,
    color: "#8ecae6",
    textAreas: [
      { label: "Distraction", x: 175, y: 80, maxWidth: 200 },
      { label: "Boyfriend", x: 400, y: 80, maxWidth: 200 },
      { label: "Girlfriend", x: 580, y: 80, maxWidth: 200 },
    ],
  },
  {
    id: "changemymind",
    name: "Change My Mind",
    width: 600,
    height: 400,
    color: "#b5e48c",
    textAreas: [
      { label: "Statement", x: 300, y: 300, maxWidth: 400 },
    ],
  },
  {
    id: "twobuttons",
    name: "Two Buttons",
    width: 600,
    height: 600,
    color: "#ffd166",
    textAreas: [
      { label: "Button 1", x: 200, y: 120, maxWidth: 200 },
      { label: "Button 2", x: 420, y: 120, maxWidth: 200 },
      { label: "Sweating guy", x: 300, y: 480, maxWidth: 300 },
    ],
  },
  {
    id: "expandingbrain",
    name: "Expanding Brain",
    width: 600,
    height: 800,
    color: "#e0aaff",
    textAreas: [
      { label: "Small brain", x: 150, y: 100, maxWidth: 260 },
      { label: "Medium brain", x: 150, y: 300, maxWidth: 260 },
      { label: "Big brain", x: 150, y: 500, maxWidth: 260 },
      { label: "Galaxy brain", x: 150, y: 700, maxWidth: 260 },
    ],
  },
  {
    id: "pigeon",
    name: "Is This a Pigeon?",
    width: 600,
    height: 450,
    color: "#a0c4ff",
    textAreas: [
      { label: "Person", x: 200, y: 400, maxWidth: 200 },
      { label: "Butterfly", x: 430, y: 100, maxWidth: 200 },
      { label: "Is this...?", x: 300, y: 420, maxWidth: 400 },
    ],
  },
  {
    id: "onedoesnot",
    name: "One Does Not Simply",
    width: 600,
    height: 400,
    color: "#c9ada7",
    textAreas: [
      { label: "Top text", x: 300, y: 50, maxWidth: 500 },
      { label: "Bottom text", x: 300, y: 360, maxWidth: 500 },
    ],
  },
  {
    id: "successkid",
    name: "Success Kid",
    width: 500,
    height: 500,
    color: "#90be6d",
    textAreas: [
      { label: "Top text", x: 250, y: 50, maxWidth: 420 },
      { label: "Bottom text", x: 250, y: 460, maxWidth: 420 },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function drawTemplatePlaceholder(
  ctx: CanvasRenderingContext2D,
  template: MemeTemplate
) {
  const { width, height, color, name, id } = template;

  // Fill background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  // Draw panel divisions based on template type
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 2;

  if (id === "drake") {
    // Two horizontal panels with left icon area
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width * 0.45, 0);
    ctx.lineTo(width * 0.45, height);
    ctx.stroke();

    // Drake pose indicators
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("X", width * 0.22, height * 0.3);
    ctx.fillText("~", width * 0.22, height * 0.75);
  } else if (id === "expandingbrain") {
    const panels = 4;
    for (let i = 1; i < panels; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (height / panels) * i);
      ctx.lineTo(width, (height / panels) * i);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(width * 0.5, 0);
    ctx.lineTo(width * 0.5, height);
    ctx.stroke();

    // Brain size indicators
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    const sizes = [20, 30, 45, 60];
    sizes.forEach((s, i) => {
      const cy = (height / panels) * i + height / panels / 2;
      ctx.beginPath();
      ctx.arc(width * 0.75, cy, s, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (id === "distracted") {
    // Three vertical sections
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 0, width / 3, height);
    ctx.fillRect((width * 2) / 3, 0, width / 3, height);

    // Person silhouettes
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    [width * 0.17, width * 0.5, width * 0.83].forEach((cx) => {
      ctx.beginPath();
      ctx.arc(cx, height * 0.35, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 20, height * 0.45, 40, 60);
    });
  } else if (id === "twobuttons") {
    ctx.beginPath();
    ctx.moveTo(0, height * 0.4);
    ctx.lineTo(width, height * 0.4);
    ctx.stroke();

    // Button shapes
    ctx.fillStyle = "rgba(255,0,0,0.15)";
    ctx.beginPath();
    ctx.arc(width * 0.33, height * 0.2, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,255,0.15)";
    ctx.beginPath();
    ctx.arc(width * 0.67, height * 0.2, 50, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Generic top/bottom layout
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  // Template name watermark
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, width / 2, height / 2);
}

function drawTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlay,
  canvasWidth: number
) {
  const { text, x, y, fontSize, color, strokeEnabled, strokeColor } = overlay;
  if (!text.trim()) return;

  ctx.font = `bold ${fontSize}px Impact, 'Arial Black', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "1px";

  // Word wrap
  const maxWidth = canvasWidth * 0.9;
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = fontSize * 1.2;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, i) => {
    const ly = startY + i * lineHeight;

    if (strokeEnabled) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = fontSize / 8;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(line.toUpperCase(), x, ly);
    }

    ctx.fillStyle = color;
    ctx.fillText(line.toUpperCase(), x, ly);
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MemeGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [customImage, setCustomImage] = useState<HTMLImageElement | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [globalFontSize, setGlobalFontSize] = useState(36);
  const [globalTextColor, setGlobalTextColor] = useState("#FFFFFF");
  const [globalStrokeEnabled, setGlobalStrokeEnabled] = useState(true);
  const [globalStrokeColor, setGlobalStrokeColor] = useState("#000000");
  const [isDragOver, setIsDragOver] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("meme_generator_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  // ── Canvas dimensions ──────────────────────────────────────────────────────

  const getCanvasDimensions = useCallback(() => {
    if (customImage) {
      return { width: customImage.naturalWidth, height: customImage.naturalHeight };
    }
    if (selectedTemplate) {
      return { width: selectedTemplate.width, height: selectedTemplate.height };
    }
    return { width: 600, height: 500 };
  }, [customImage, selectedTemplate]);

  // ── Redraw canvas ──────────────────────────────────────────────────────────

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = getCanvasDimensions();
    canvas.width = width;
    canvas.height = height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw base image or template
    if (customImage) {
      ctx.drawImage(customImage, 0, 0, width, height);
    } else if (selectedTemplate) {
      drawTemplatePlaceholder(ctx, selectedTemplate);
    } else {
      // Empty state placeholder
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Select a template or upload an image", width / 2, height / 2);
    }

    // Draw text overlays
    for (const overlay of textOverlays) {
      drawTextOnCanvas(ctx, overlay, width);
    }

    // Draw drag handles when dragging
    if (dragTarget) {
      const overlay = textOverlays.find((o) => o.id === dragTarget);
      if (overlay) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        const metrics = ctx.measureText(overlay.text.toUpperCase() || "TEXT");
        const boxW = Math.min(metrics.width + 20, width * 0.9);
        const boxH = overlay.fontSize * 1.4;
        ctx.strokeRect(overlay.x - boxW / 2, overlay.y - boxH / 2, boxW, boxH);
        ctx.setLineDash([]);
      }
    }
  }, [customImage, selectedTemplate, textOverlays, getCanvasDimensions, dragTarget]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // ── Template selection ─────────────────────────────────────────────────────

  const selectTemplate = (template: MemeTemplate) => {
    setSelectedTemplate(template);
    setCustomImage(null);
    setCustomImageUrl(null);

    // Create text overlays from template text areas
    const overlays: TextOverlay[] = template.textAreas.map((area, i) => ({
      id: uid(),
      text: "",
      x: area.x,
      y: area.y,
      fontSize: globalFontSize,
      color: globalTextColor,
      strokeEnabled: globalStrokeEnabled,
      strokeColor: globalStrokeColor,
      isDragging: false,
    }));
    setTextOverlays(overlays);
  };

  // ── Custom image upload ────────────────────────────────────────────────────

  const handleImageUpload = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          // Limit dimensions for performance
          const maxDim = 800;
          if (img.naturalWidth > maxDim || img.naturalHeight > maxDim) {
            const scale = maxDim / Math.max(img.naturalWidth, img.naturalHeight);
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.naturalWidth * scale);
            canvas.height = Math.round(img.naturalHeight * scale);
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const resizedImg = new window.Image();
              resizedImg.onload = () => {
                setCustomImage(resizedImg);
                setCustomImageUrl(canvas.toDataURL());
                setSelectedTemplate(null);
              };
              resizedImg.src = canvas.toDataURL();
            }
          } else {
            setCustomImage(img);
            setCustomImageUrl(e.target?.result as string);
            setSelectedTemplate(null);
          }

          // Set default top/bottom text overlays
          const w = Math.min(img.naturalWidth, 800);
          const h = Math.min(img.naturalHeight, 800);
          setTextOverlays([
            {
              id: uid(),
              text: "",
              x: w / 2,
              y: 50,
              fontSize: globalFontSize,
              color: globalTextColor,
              strokeEnabled: globalStrokeEnabled,
              strokeColor: globalStrokeColor,
              isDragging: false,
            },
            {
              id: uid(),
              text: "",
              x: w / 2,
              y: h - 50,
              fontSize: globalFontSize,
              color: globalTextColor,
              strokeEnabled: globalStrokeEnabled,
              strokeColor: globalStrokeColor,
              isDragging: false,
            },
          ]);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [globalFontSize, globalTextColor, globalStrokeEnabled, globalStrokeColor]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleImageUpload(file);
    },
    [handleImageUpload]
  );

  // ── Text overlay management ────────────────────────────────────────────────

  const updateOverlay = (id: string, patch: Partial<TextOverlay>) => {
    setTextOverlays((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
    );
  };

  const removeOverlay = (id: string) => {
    setTextOverlays((prev) => prev.filter((o) => o.id !== id));
  };

  const addTextOverlay = () => {
    const { width, height } = getCanvasDimensions();
    setTextOverlays((prev) => [
      ...prev,
      {
        id: uid(),
        text: "",
        x: width / 2,
        y: height / 2,
        fontSize: globalFontSize,
        color: globalTextColor,
        strokeEnabled: globalStrokeEnabled,
        strokeColor: globalStrokeColor,
        isDragging: false,
      },
    ]);
  };

  // Apply global settings to all overlays
  const applyGlobalSettings = () => {
    setTextOverlays((prev) =>
      prev.map((o) => ({
        ...o,
        fontSize: globalFontSize,
        color: globalTextColor,
        strokeEnabled: globalStrokeEnabled,
        strokeColor: globalStrokeColor,
      }))
    );
    toast.success("Applied settings to all text layers.");
  };

  // ── Canvas drag for text positioning ───────────────────────────────────────

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { cx: 0, cy: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      cx: (clientX - rect.left) * scaleX,
      cy: (clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasPointerDown = (e: React.MouseEvent) => {
    const { cx, cy } = getCanvasCoords(e);

    // Find which overlay was clicked (reverse order for topmost)
    for (let i = textOverlays.length - 1; i >= 0; i--) {
      const o = textOverlays[i];
      const hitRadius = o.fontSize * 1.5;
      if (
        Math.abs(cx - o.x) < hitRadius &&
        Math.abs(cy - o.y) < hitRadius
      ) {
        setDragTarget(o.id);
        setDragOffset({ x: cx - o.x, y: cy - o.y });
        return;
      }
    }
  };

  const handleCanvasPointerMove = (e: React.MouseEvent) => {
    if (!dragTarget) return;
    const { cx, cy } = getCanvasCoords(e);
    const { width, height } = getCanvasDimensions();
    updateOverlay(dragTarget, {
      x: Math.max(0, Math.min(width, cx - dragOffset.x)),
      y: Math.max(0, Math.min(height, cy - dragOffset.y)),
    });
  };

  const handleCanvasPointerUp = () => {
    setDragTarget(null);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const { cx, cy } = getCanvasCoords(e);
    for (let i = textOverlays.length - 1; i >= 0; i--) {
      const o = textOverlays[i];
      const hitRadius = o.fontSize * 1.5;
      if (Math.abs(cx - o.x) < hitRadius && Math.abs(cy - o.y) < hitRadius) {
        e.preventDefault();
        setDragTarget(o.id);
        setDragOffset({ x: cx - o.x, y: cy - o.y });
        return;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragTarget) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const cx = (touch.clientX - rect.left) * scaleX;
    const cy = (touch.clientY - rect.top) * scaleY;
    const { width, height } = getCanvasDimensions();
    updateOverlay(dragTarget, {
      x: Math.max(0, Math.min(width, cx - dragOffset.x)),
      y: Math.max(0, Math.min(height, cy - dragOffset.y)),
    });
  };

  // ── Download ───────────────────────────────────────────────────────────────

  const downloadMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Redraw without drag handles
    const savedDragTarget = dragTarget;
    setDragTarget(null);

    // Use setTimeout to let state update before capturing
    setTimeout(() => {
      const dataUrl = canvas.toDataURL("image/png");

      // Save to history
      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = 120;
      thumbCanvas.height = 120;
      const thumbCtx = thumbCanvas.getContext("2d");
      if (thumbCtx) {
        thumbCtx.drawImage(canvas, 0, 0, 120, 120);
      }

      const entry: HistoryEntry = {
        id: uid(),
        thumbnail: thumbCanvas.toDataURL("image/jpeg", 0.6),
        templateName: selectedTemplate?.name || "Custom Image",
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        const updated = [entry, ...prev].slice(0, 20);
        localStorage.setItem("meme_generator_history", JSON.stringify(updated));
        return updated;
      });

      // Trigger download
      const link = document.createElement("a");
      link.download = `meme-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Meme downloaded!");
    }, 50);
  };

  // ── Reset ──────────────────────────────────────────────────────────────────

  const resetAll = () => {
    setSelectedTemplate(null);
    setCustomImage(null);
    setCustomImageUrl(null);
    setTextOverlays([]);
    setDragTarget(null);
  };

  const removeHistoryEntry = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem("meme_generator_history", JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("meme_generator_history");
  };

  const hasContent = selectedTemplate || customImage;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-6"
            >
              <Smile className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            >
              Meme Generator
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg max-w-xl mx-auto"
            >
              Create memes with classic Impact font styling. Pick a template or
              upload your own image. 100% client-side, nothing is uploaded.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* ── Left Column: Canvas + Templates ── */}
            <div className="lg:col-span-3 space-y-6">
              {/* Canvas Preview */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
              >
                <div
                  ref={containerRef}
                  className="relative bg-muted/30 flex items-center justify-center p-4"
                >
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto rounded-lg shadow-md cursor-crosshair"
                    style={{ maxHeight: "500px" }}
                    onMouseDown={handleCanvasPointerDown}
                    onMouseMove={handleCanvasPointerMove}
                    onMouseUp={handleCanvasPointerUp}
                    onMouseLeave={handleCanvasPointerUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleCanvasPointerUp}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 p-4 border-t border-border">
                  <Button
                    variant="hero"
                    onClick={downloadMeme}
                    disabled={!hasContent}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button variant="outline" onClick={addTextOverlay} disabled={!hasContent}>
                    <Type className="w-4 h-4 mr-2" />
                    Add Text
                  </Button>
                  <Button variant="ghost" onClick={resetAll}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </motion.div>

              {/* Template Selection */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-2xl border border-border shadow-card p-6"
              >
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Meme Templates
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {MEME_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className={`relative rounded-xl p-3 border-2 transition-all text-left hover:shadow-md ${
                        selectedTemplate?.id === template.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div
                        className="w-full aspect-square rounded-lg mb-2"
                        style={{ backgroundColor: template.color }}
                      />
                      <p className="text-xs font-medium text-foreground leading-tight truncate">
                        {template.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {template.textAreas.length} text area
                        {template.textAreas.length > 1 ? "s" : ""}
                      </p>
                      {selectedTemplate?.id === template.id && (
                        <Badge className="absolute top-1.5 right-1.5 text-[10px]">
                          Active
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Upload */}
                <div className="mt-6">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      Upload your own image
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Drag & drop or click to browse
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Right Column: Controls ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Global Text Settings */}
              <Card className="p-5">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Type className="w-4 h-4 text-primary" />
                  Text Settings
                </h2>

                <div className="space-y-4">
                  {/* Font Size */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Font Size</Label>
                      <span className="text-sm font-bold text-primary">
                        {globalFontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="80"
                      value={globalFontSize}
                      onChange={(e) => setGlobalFontSize(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Text Color
                    </Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={globalTextColor}
                        onChange={(e) => setGlobalTextColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <Input
                        value={globalTextColor}
                        onChange={(e) => setGlobalTextColor(e.target.value)}
                        className="font-mono text-sm flex-1"
                        placeholder="#FFFFFF"
                      />
                      {/* Quick color presets */}
                      <div className="flex gap-1">
                        {["#FFFFFF", "#000000", "#FF0000", "#FFFF00"].map(
                          (c) => (
                            <button
                              key={c}
                              onClick={() => setGlobalTextColor(c)}
                              className="w-6 h-6 rounded-full border border-border"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stroke Toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Text Outline / Stroke
                    </Label>
                    <Switch
                      checked={globalStrokeEnabled}
                      onCheckedChange={setGlobalStrokeEnabled}
                    />
                  </div>

                  {/* Stroke Color */}
                  {globalStrokeEnabled && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Stroke Color
                      </Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={globalStrokeColor}
                          onChange={(e) => setGlobalStrokeColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                        />
                        <Input
                          value={globalStrokeColor}
                          onChange={(e) => setGlobalStrokeColor(e.target.value)}
                          className="font-mono text-sm flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  )}

                  {/* Apply to all button */}
                  {textOverlays.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={applyGlobalSettings}
                      className="w-full"
                    >
                      Apply to All Text Layers
                    </Button>
                  )}
                </div>
              </Card>

              {/* Individual Text Overlays */}
              <AnimatePresence>
                {textOverlays.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="p-5">
                      <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-primary" />
                        Text Layers
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {textOverlays.length}
                        </Badge>
                      </h2>

                      <div className="space-y-4">
                        {textOverlays.map((overlay, index) => {
                          const templateArea =
                            selectedTemplate?.textAreas[index];
                          return (
                            <motion.div
                              key={overlay.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="relative p-3 rounded-lg border border-border bg-muted/30"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs font-medium text-muted-foreground">
                                  {templateArea?.label ||
                                    `Text Layer ${index + 1}`}
                                </Label>
                                <button
                                  onClick={() => removeOverlay(overlay.id)}
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              <Input
                                value={overlay.text}
                                onChange={(e) =>
                                  updateOverlay(overlay.id, {
                                    text: e.target.value,
                                  })
                                }
                                placeholder={
                                  templateArea?.label || "Enter meme text..."
                                }
                                className="mb-2 text-sm"
                              />

                              {/* Per-overlay font size */}
                              <div className="flex items-center gap-2 mb-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                  Size: {overlay.fontSize}px
                                </Label>
                                <input
                                  type="range"
                                  min="16"
                                  max="80"
                                  value={overlay.fontSize}
                                  onChange={(e) =>
                                    updateOverlay(overlay.id, {
                                      fontSize: Number(e.target.value),
                                    })
                                  }
                                  className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                                />
                              </div>

                              {/* Per-overlay color */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={overlay.color}
                                  onChange={(e) =>
                                    updateOverlay(overlay.id, {
                                      color: e.target.value,
                                    })
                                  }
                                  className="w-7 h-7 rounded border border-border cursor-pointer"
                                />
                                <span className="text-xs text-muted-foreground font-mono">
                                  {overlay.color}
                                </span>
                                <div className="flex items-center gap-1 ml-auto">
                                  <Label className="text-xs text-muted-foreground">
                                    Stroke
                                  </Label>
                                  <Switch
                                    checked={overlay.strokeEnabled}
                                    onCheckedChange={(v) =>
                                      updateOverlay(overlay.id, {
                                        strokeEnabled: v,
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              <p className="text-[10px] text-muted-foreground mt-2">
                                Drag text on canvas to reposition
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        onClick={addTextOverlay}
                        className="w-full mt-4"
                        disabled={!hasContent}
                      >
                        <Type className="w-4 h-4 mr-2" />
                        Add Another Text Layer
                      </Button>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Meme History */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold">Recent Memes</h2>
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
                    No memes created yet. Download a meme to save it here.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {history.map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted/30">
                          <img
                            src={entry.thumbnail}
                            alt={entry.templateName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-1">
                          {entry.templateName}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => removeHistoryEntry(entry.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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

          {/* Tips Section */}
          <div className="mt-10 p-6 rounded-2xl bg-muted/50">
            <h3 className="font-semibold text-foreground mb-4">
              Meme Generator Tips
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                <strong>Drag text</strong> directly on the canvas to reposition
                it anywhere you want.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                <strong>Classic meme style</strong> uses white Impact font with
                a black stroke outline.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                <strong>Upload your own image</strong> to use as a base instead
                of the built-in templates.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                <strong>Add multiple text layers</strong> for complex memes with
                labels on different parts of the image.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                <strong>Everything runs in your browser</strong> — your images
                are never uploaded to any server.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">*</span>
                <strong>Recent memes</strong> are saved to your browser's
                localStorage so you can see your creation history.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
