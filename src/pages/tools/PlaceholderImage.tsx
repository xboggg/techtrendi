import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Image, Download, Copy, RefreshCw, Palette, Type, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const presets = [
  { name: "Social Media - Instagram Post", width: 1080, height: 1080 },
  { name: "Social Media - Facebook Cover", width: 820, height: 312 },
  { name: "Social Media - Twitter Header", width: 1500, height: 500 },
  { name: "Social Media - YouTube Thumbnail", width: 1280, height: 720 },
  { name: "Web - Hero Banner", width: 1920, height: 600 },
  { name: "Web - Blog Post", width: 1200, height: 630 },
  { name: "Web - Card Image", width: 400, height: 300 },
  { name: "Mobile - App Icon", width: 512, height: 512 },
  { name: "Print - Business Card", width: 1050, height: 600 },
  { name: "Custom", width: 800, height: 600 },
];

const colorPresets = [
  { name: "Gray", bg: "#9CA3AF", text: "#FFFFFF" },
  { name: "Blue", bg: "#3B82F6", text: "#FFFFFF" },
  { name: "Green", bg: "#10B981", text: "#FFFFFF" },
  { name: "Purple", bg: "#8B5CF6", text: "#FFFFFF" },
  { name: "Pink", bg: "#EC4899", text: "#FFFFFF" },
  { name: "Orange", bg: "#F97316", text: "#FFFFFF" },
  { name: "Dark", bg: "#1F2937", text: "#FFFFFF" },
  { name: "Light", bg: "#F3F4F6", text: "#374151" },
];

export default function PlaceholderImage() {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [bgColor, setBgColor] = useState("#9CA3AF");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [customText, setCustomText] = useState("");
  const [showDimensions, setShowDimensions] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState("Custom");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw text
    ctx.fillStyle = textColor;
    const text = customText || (showDimensions ? `${width} × ${height}` : "");

    if (text) {
      // Calculate font size based on image dimensions
      const fontSize = Math.min(width, height) / 8;
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, width / 2, height / 2);
    }

    // Draw grid pattern
    ctx.strokeStyle = textColor;
    ctx.globalAlpha = 0.1;
    ctx.lineWidth = 1;

    // Diagonal lines
    const spacing = Math.min(width, height) / 10;
    for (let i = -Math.max(width, height); i < Math.max(width, height) * 2; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  useEffect(() => {
    drawImage();
  }, [width, height, bgColor, textColor, customText, showDimensions]);

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    const preset = presets.find((p) => p.name === value);
    if (preset) {
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };

  const handleColorPreset = (preset: typeof colorPresets[0]) => {
    setBgColor(preset.bg);
    setTextColor(preset.text);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `placeholder-${width}x${height}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Image downloaded!");
  };

  const copyDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    navigator.clipboard.writeText(dataUrl);
    setCopied(true);
    toast.success("Data URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPlaceholderUrl = () => {
    const url = `https://via.placeholder.com/${width}x${height}/${bgColor.slice(1)}/${textColor.slice(1)}`;
    navigator.clipboard.writeText(url);
    toast.success("Placeholder URL copied!");
  };

  const randomize = () => {
    const randomColor = () => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    setBgColor(randomColor());
    setTextColor(randomColor());
  };

  return (
    <Layout>
      <SEOHead
        title="Placeholder Image Generator - Create Dummy Images | TechTrendi"
        description="Generate placeholder images for your designs and mockups. Customizable sizes, colors, and text."
        canonicalUrl="https://techtrendi.com/tools/placeholder-image"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Placeholder <span className="text-primary">Image</span> Generator
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create custom placeholder images for your designs and mockups
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Controls */}
          <div className="space-y-6">
            {/* Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Size Preset
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedPreset} onValueChange={handlePresetChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>
                        {preset.name} ({preset.width}×{preset.height})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Width (px)</Label>
                    <Input
                      type="number"
                      value={width}
                      onChange={(e) => {
                        setWidth(Number(e.target.value));
                        setSelectedPreset("Custom");
                      }}
                      min={1}
                      max={4000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (px)</Label>
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => {
                        setHeight(Number(e.target.value));
                        setSelectedPreset("Custom");
                      }}
                      min={1}
                      max={4000}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleColorPreset(preset)}
                      className={cn(
                        "w-10 h-10 rounded-lg border-2 transition-all",
                        bgColor === preset.bg ? "border-primary scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: preset.bg }}
                      title={preset.name}
                    />
                  ))}
                  <button
                    onClick={randomize}
                    className="w-10 h-10 rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-primary"
                    title="Random"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Text */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Custom Text (optional)</Label>
                  <Input
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Leave empty for dimensions"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showDimensions"
                    checked={showDimensions}
                    onChange={(e) => setShowDimensions(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="showDimensions" className="cursor-pointer">
                    Show dimensions when no custom text
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview & Actions */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg min-h-[300px]">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[400px] rounded shadow-lg"
                    style={{
                      width: width > height ? "100%" : "auto",
                      height: height > width ? "300px" : "auto",
                    }}
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Actual size: {width} × {height} pixels
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={downloadImage} size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
              <Button onClick={copyDataUrl} variant="outline" size="lg">
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy Data URL
              </Button>
            </div>

            {/* URL Reference */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">External placeholder URL:</p>
                <code className="block p-3 bg-background rounded border text-sm break-all">
                  https://via.placeholder.com/{width}x{height}/{bgColor.slice(1)}/{textColor.slice(1)}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPlaceholderUrl}
                  className="mt-3"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Common Uses</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Web design mockups and wireframes</li>
                  <li>• UI/UX prototypes</li>
                  <li>• Email templates</li>
                  <li>• Social media content planning</li>
                  <li>• Development placeholders</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
