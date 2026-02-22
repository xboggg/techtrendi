import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Image, Download, Upload, Type, Palette, Square, Circle, Hexagon,
  Copy, Check, RefreshCw, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ShapeType = "square" | "rounded" | "circle";

interface FaviconConfig {
  text: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  shape: ShapeType;
  borderRadius: number;
}

const defaultConfig: FaviconConfig = {
  text: "T",
  backgroundColor: "#6366f1",
  textColor: "#ffffff",
  fontSize: 48,
  shape: "rounded",
  borderRadius: 12,
};

const presetColors = [
  { bg: "#6366f1", text: "#ffffff", name: "Indigo" },
  { bg: "#10b981", text: "#ffffff", name: "Emerald" },
  { bg: "#f59e0b", text: "#000000", name: "Amber" },
  { bg: "#ef4444", text: "#ffffff", name: "Red" },
  { bg: "#8b5cf6", text: "#ffffff", name: "Violet" },
  { bg: "#06b6d4", text: "#ffffff", name: "Cyan" },
  { bg: "#ec4899", text: "#ffffff", name: "Pink" },
  { bg: "#000000", text: "#ffffff", name: "Black" },
  { bg: "#ffffff", text: "#000000", name: "White" },
  { bg: "#1e40af", text: "#ffffff", name: "Blue" },
  { bg: "#059669", text: "#ffffff", name: "Green" },
  { bg: "#dc2626", text: "#ffffff", name: "Dark Red" },
];

const sizes = [16, 32, 48, 64, 128, 180, 192, 512];

export default function FaviconGenerator() {
  const [config, setConfig] = useState<FaviconConfig>(defaultConfig);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateConfig = (updates: Partial<FaviconConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setActiveTab("image");
      };
      reader.readAsDataURL(file);
    }
  };

  const drawFavicon = useCallback(
    (canvas: HTMLCanvasElement, size: number, forDownload = false) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = size;
      canvas.height = size;
      ctx.clearRect(0, 0, size, size);

      if (activeTab === "image" && uploadedImage) {
        const img = new window.Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
        };
        img.src = uploadedImage;
      } else {
        // Draw background with shape
        ctx.fillStyle = config.backgroundColor;

        if (config.shape === "circle") {
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (config.shape === "rounded") {
          const radius = (config.borderRadius / 100) * (size / 2);
          ctx.beginPath();
          ctx.roundRect(0, 0, size, size, radius);
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, size, size);
        }

        // Draw text
        ctx.fillStyle = config.textColor;
        const scaledFontSize = (config.fontSize / 64) * size;
        ctx.font = `bold ${scaledFontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.text.slice(0, 2), size / 2, size / 2 + 2);
      }
    },
    [config, activeTab, uploadedImage]
  );

  const downloadFavicon = (size: number) => {
    const canvas = document.createElement("canvas");
    drawFavicon(canvas, size, true);

    // For image mode, need to wait for image load
    if (activeTab === "image" && uploadedImage) {
      const img = new window.Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);
          triggerDownload(canvas, size);
        }
      };
      img.src = uploadedImage;
    } else {
      setTimeout(() => triggerDownload(canvas, size), 100);
    }
  };

  const triggerDownload = (canvas: HTMLCanvasElement, size: number) => {
    const link = document.createElement("a");
    link.download = `favicon-${size}x${size}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success(`Downloaded ${size}x${size} favicon`);
  };

  const downloadAllSizes = () => {
    sizes.forEach((size, index) => {
      setTimeout(() => downloadFavicon(size), index * 200);
    });
    toast.success("Downloading all favicon sizes...");
  };

  const copyHtmlCode = () => {
    const code = `<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("HTML code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const randomize = () => {
    const preset = presetColors[Math.floor(Math.random() * presetColors.length)];
    const shapes: ShapeType[] = ["square", "rounded", "circle"];
    updateConfig({
      backgroundColor: preset.bg,
      textColor: preset.text,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      borderRadius: Math.floor(Math.random() * 50) + 10,
    });
  };

  return (
    <Layout>
      <SEOHead
        title="Favicon Generator - Create Favicons Online Free | TechTrendi"
        description="Generate favicons for your website instantly. Create from text or upload an image. Download in all required sizes."
        canonicalUrl="https://techtrendi.com/tools/favicon-generator"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Favicon <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create beautiful favicons from text or images. Download in all sizes for your website.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Controls */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "text" | "image")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">
                  <Type className="w-4 h-4 mr-2" />
                  From Text
                </TabsTrigger>
                <TabsTrigger value="image">
                  <Image className="w-4 h-4 mr-2" />
                  From Image
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-6 mt-6">
                {/* Text Input */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Text & Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Text (1-2 characters)</Label>
                      <Input
                        value={config.text}
                        onChange={(e) => updateConfig({ text: e.target.value.slice(0, 2) })}
                        placeholder="T"
                        maxLength={2}
                        className="text-center text-2xl font-bold"
                      />
                    </div>

                    <div>
                      <Label>Font Size: {config.fontSize}px</Label>
                      <Slider
                        value={[config.fontSize]}
                        onValueChange={([v]) => updateConfig({ fontSize: v })}
                        min={20}
                        max={64}
                        step={1}
                        className="mt-2"
                      />
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Background</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={config.backgroundColor}
                            onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                            className="w-10 h-10 rounded cursor-pointer border"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Text Color</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={config.textColor}
                            onChange={(e) => updateConfig({ textColor: e.target.value })}
                            className="w-10 h-10 rounded cursor-pointer border"
                          />
                          <Input
                            value={config.textColor}
                            onChange={(e) => updateConfig({ textColor: e.target.value })}
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Presets</Label>
                      <div className="flex flex-wrap gap-2">
                        {presetColors.map((preset, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              updateConfig({
                                backgroundColor: preset.bg,
                                textColor: preset.text,
                              })
                            }
                            className={cn(
                              "w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110",
                              config.backgroundColor === preset.bg
                                ? "border-primary"
                                : "border-transparent"
                            )}
                            style={{ backgroundColor: preset.bg }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shape */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Shape</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant={config.shape === "square" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateConfig({ shape: "square" })}
                      >
                        <Square className="w-4 h-4 mr-1" />
                        Square
                      </Button>
                      <Button
                        variant={config.shape === "rounded" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateConfig({ shape: "rounded" })}
                      >
                        <Hexagon className="w-4 h-4 mr-1" />
                        Rounded
                      </Button>
                      <Button
                        variant={config.shape === "circle" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateConfig({ shape: "circle" })}
                      >
                        <Circle className="w-4 h-4 mr-1" />
                        Circle
                      </Button>
                    </div>

                    {config.shape === "rounded" && (
                      <div>
                        <Label>Border Radius: {config.borderRadius}%</Label>
                        <Slider
                          value={[config.borderRadius]}
                          onValueChange={([v]) => updateConfig({ borderRadius: v })}
                          min={0}
                          max={50}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button variant="outline" onClick={randomize} className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Randomize
                </Button>
              </TabsContent>

              <TabsContent value="image" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadedImage ? (
                        <div className="space-y-4">
                          <img
                            src={uploadedImage}
                            alt="Uploaded"
                            className="w-32 h-32 mx-auto object-cover rounded-lg"
                          />
                          <p className="text-sm text-muted-foreground">
                            Click to upload a different image
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                          <div>
                            <p className="font-medium">Upload an image</p>
                            <p className="text-sm text-muted-foreground">
                              PNG, JPG, or SVG recommended
                            </p>
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Preview & Download */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>See how your favicon looks at different sizes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 flex-wrap justify-center p-6 bg-muted/50 rounded-lg">
                  {[16, 32, 48, 64, 128].map((size) => (
                    <div key={size} className="text-center">
                      <div
                        className="inline-flex items-center justify-center bg-white dark:bg-gray-800 rounded shadow-sm mb-2"
                        style={{ width: size + 8, height: size + 8 }}
                      >
                        {activeTab === "image" && uploadedImage ? (
                          <img
                            src={uploadedImage}
                            alt="Preview"
                            style={{ width: size, height: size }}
                            className="object-cover"
                          />
                        ) : (
                          <div
                            className="flex items-center justify-center"
                            style={{
                              width: size,
                              height: size,
                              backgroundColor: config.backgroundColor,
                              color: config.textColor,
                              borderRadius:
                                config.shape === "circle"
                                  ? "50%"
                                  : config.shape === "rounded"
                                  ? `${(config.borderRadius / 100) * (size / 2)}px`
                                  : 0,
                              fontSize: (config.fontSize / 64) * size,
                              fontWeight: "bold",
                            }}
                          >
                            {config.text.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{size}px</p>
                    </div>
                  ))}
                </div>

                {/* Browser Preview */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Browser Tab Preview</p>
                  <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border">
                    {activeTab === "image" && uploadedImage ? (
                      <img src={uploadedImage} alt="Tab" className="w-4 h-4 object-cover" />
                    ) : (
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 16,
                          height: 16,
                          backgroundColor: config.backgroundColor,
                          color: config.textColor,
                          borderRadius:
                            config.shape === "circle"
                              ? "50%"
                              : config.shape === "rounded"
                              ? `${(config.borderRadius / 100) * 8}px`
                              : 0,
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      >
                        {config.text.slice(0, 1)}
                      </div>
                    )}
                    <span className="text-sm">Your Website</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Download Sizes */}
            <Card>
              <CardHeader>
                <CardTitle>Download</CardTitle>
                <CardDescription>Download individual sizes or all at once</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {sizes.map((size) => (
                    <Button
                      key={size}
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFavicon(size)}
                      className="text-xs"
                    >
                      {size}x{size}
                    </Button>
                  ))}
                </div>

                <Button onClick={downloadAllSizes} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download All Sizes
                </Button>
              </CardContent>
            </Card>

            {/* HTML Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">HTML Code</CardTitle>
                <CardDescription>Add this to your website's head tag</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                  {`<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`}
                </pre>
                <Button variant="outline" size="sm" onClick={copyHtmlCode} className="mt-3">
                  {copied ? (
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  Copy Code
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Size Guide */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Favicon Size Guide</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium">16x16 & 32x32</p>
                <p className="text-muted-foreground">Standard browser tab favicons</p>
              </div>
              <div>
                <p className="font-medium">180x180</p>
                <p className="text-muted-foreground">Apple Touch Icon (iOS)</p>
              </div>
              <div>
                <p className="font-medium">192x192</p>
                <p className="text-muted-foreground">Android Chrome icon</p>
              </div>
              <div>
                <p className="font-medium">512x512</p>
                <p className="text-muted-foreground">PWA splash screen icon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </Layout>
  );
}
