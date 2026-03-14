import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Palette, Copy, Check, Plus, Trash2, RefreshCw, Shuffle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

const presetGradients = [
  { name: "Sunset", colors: ["#ff6b6b", "#feca57", "#ff9ff3"] },
  { name: "Ocean", colors: ["#0093E9", "#80D0C7"] },
  { name: "Purple Haze", colors: ["#667eea", "#764ba2"] },
  { name: "Emerald", colors: ["#11998e", "#38ef7d"] },
  { name: "Fire", colors: ["#f12711", "#f5af19"] },
  { name: "Cool Blues", colors: ["#2193b0", "#6dd5ed"] },
  { name: "Peach", colors: ["#ed6ea0", "#ec8c69"] },
  { name: "Midnight", colors: ["#232526", "#414345"] },
  { name: "Candy", colors: ["#d53369", "#daae51"] },
  { name: "Forest", colors: ["#134E5E", "#71B280"] },
  { name: "Royal", colors: ["#141E30", "#243B55"] },
  { name: "Warm", colors: ["#f093fb", "#f5576c"] },
];

export default function GradientGenerator() {
  const [gradientType, setGradientType] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState(90);
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { id: "1", color: "#667eea", position: 0 },
    { id: "2", color: "#764ba2", position: 100 },
  ]);
  const [copied, setCopied] = useState<string | null>(null);

  const generateGradient = () => {
    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
    const stopsStr = sortedStops.map((s) => `${s.color} ${s.position}%`).join(", ");

    if (gradientType === "linear") {
      return `linear-gradient(${angle}deg, ${stopsStr})`;
    } else {
      return `radial-gradient(circle, ${stopsStr})`;
    }
  };

  const gradient = generateGradient();

  const cssCode = `background: ${gradient};`;
  const firstColor = colorStops[0]?.color || '#667eea';
  const lastColor = colorStops[colorStops.length - 1]?.color || '#764ba2';
  const tailwindCode = "bg-gradient-to-r from-[" + firstColor + "] to-[" + lastColor + "]";

  const addColorStop = () => {
    const newStop: ColorStop = {
      id: Date.now().toString(),
      color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
      position: 50,
    };
    setColorStops([...colorStops, newStop]);
  };

  const removeColorStop = (id: string) => {
    if (colorStops.length <= 2) {
      toast.error("Minimum 2 colors required");
      return;
    }
    setColorStops(colorStops.filter((s) => s.id !== id));
  };

  const updateColorStop = (id: string, field: "color" | "position", value: string | number) => {
    setColorStops(
      colorStops.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const loadPreset = (colors: string[]) => {
    const stops: ColorStop[] = colors.map((color, i) => ({
      id: Date.now().toString() + i,
      color,
      position: Math.round((i / (colors.length - 1)) * 100),
    }));
    setColorStops(stops);
    toast.success("Preset loaded!");
  };

  const randomize = () => {
    const numColors = Math.floor(Math.random() * 2) + 2; // 2-3 colors
    const stops: ColorStop[] = [];
    for (let i = 0; i < numColors; i++) {
      stops.push({
        id: Date.now().toString() + i,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
        position: Math.round((i / (numColors - 1)) * 100),
      });
    }
    setColorStops(stops);
    setAngle(Math.floor(Math.random() * 360));
    toast.success("Random gradient generated!");
  };

  return (
    <Layout>
      <SEOHead
        title="CSS Gradient Generator - Create Beautiful Gradients | TechTrendi"
        description="Create beautiful CSS gradients visually. Generate linear and radial gradients with multiple color stops. Copy CSS or Tailwind code."
        canonicalUrl="https://techtrendi.com/tools/gradient-generator"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            CSS Gradient <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create beautiful gradients and copy the CSS code
          </p>
        </div>

        {/* Preview */}
        <Card className="mb-8 overflow-hidden">
          <div
            className="h-[200px] md:h-[300px] w-full transition-all duration-300"
            style={{ background: gradient }}
          />
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Type and Angle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Gradient Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={gradientType} onValueChange={(v) => setGradientType(v as "linear" | "radial")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="radial">Radial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {gradientType === "linear" && (
                    <div>
                      <Label>Angle: {angle}°</Label>
                      <Slider
                        value={[angle]}
                        onValueChange={([v]) => setAngle(v)}
                        min={0}
                        max={360}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>

                {/* Quick Angles */}
                {gradientType === "linear" && (
                  <div className="flex flex-wrap gap-2">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                      <Button
                        key={a}
                        variant={angle === a ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAngle(a)}
                      >
                        {a}°
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Color Stops */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Color Stops</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={randomize}>
                      <Shuffle className="w-4 h-4 mr-1" />
                      Random
                    </Button>
                    <Button variant="outline" size="sm" onClick={addColorStop}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Color
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {colorStops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={stop.color}
                        onChange={(e) => updateColorStop(stop.id, "color", e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={stop.color}
                        onChange={(e) => updateColorStop(stop.id, "color", e.target.value)}
                        className="w-24 font-mono text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Slider
                        value={[stop.position]}
                        onValueChange={([v]) => updateColorStop(stop.id, "position", v)}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12">{stop.position}%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColorStop(stop.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Code Output */}
            <Card>
              <CardHeader>
                <CardTitle>Generated Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>CSS</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(cssCode, "css")}
                    >
                      {copied === "css" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="p-3 bg-muted rounded-lg text-sm font-mono overflow-x-auto">
                    {cssCode}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Tailwind (approximate)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(tailwindCode, "tailwind")}
                    >
                      {copied === "tailwind" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="p-3 bg-muted rounded-lg text-sm font-mono overflow-x-auto">
                    {tailwindCode}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Full Gradient Value</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(gradient, "gradient")}
                    >
                      {copied === "gradient" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="p-3 bg-muted rounded-lg text-sm font-mono overflow-x-auto break-all">
                    {gradient}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Presets */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Presets</CardTitle>
                <CardDescription>Click to apply</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {presetGradients.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => loadPreset(preset.colors)}
                    className="group relative h-20 rounded-lg overflow-hidden border hover:border-primary transition-colors"
                    style={{
                      background: `linear-gradient(135deg, ${preset.colors.join(", ")})`,
                    }}
                  >
                    <span className="absolute bottom-1 left-1 text-xs font-medium text-white bg-black/50 px-1.5 py-0.5 rounded">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
