import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dices, Plus, Trash2, RotateCcw, Share2, Volume2, VolumeX, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const colors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
  "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8B500", "#00CED1",
];

const presets = [
  { name: "Where to Eat?", options: ["Pizza", "Sushi", "Tacos", "Burger", "Chinese", "Indian"] },
  { name: "What to Watch?", options: ["Action", "Comedy", "Drama", "Horror", "Documentary", "Anime"] },
  { name: "Yes or No", options: ["Yes", "No"] },
  { name: "Coin Flip", options: ["Heads", "Tails"] },
  { name: "Random Number 1-6", options: ["1", "2", "3", "4", "5", "6"] },
];

export default function DecisionWheel() {
  const [options, setOptions] = useState<string[]>(["Option 1", "Option 2", "Option 3"]);
  const [newOption, setNewOption] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const wheelRef = useRef<HTMLDivElement>(null);

  const addOption = () => {
    if (!newOption.trim()) return;
    if (options.length >= 12) {
      toast.error("Maximum 12 options allowed");
      return;
    }
    setOptions([...options, newOption.trim()]);
    setNewOption("");
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("Minimum 2 options required");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const loadPreset = (preset: typeof presets[0]) => {
    setOptions(preset.options);
    setResult(null);
    toast.success(`Loaded "${preset.name}" preset`);
  };

  const spinWheel = () => {
    if (isSpinning || options.length < 2) return;

    setIsSpinning(true);
    setResult(null);

    // Random spin between 5-10 full rotations plus random position
    const spins = 5 + Math.random() * 5;
    const randomAngle = Math.random() * 360;
    const totalRotation = rotation + spins * 360 + randomAngle;

    setRotation(totalRotation);

    // Calculate result after spin
    setTimeout(() => {
      const normalizedAngle = totalRotation % 360;
      const segmentAngle = 360 / options.length;
      // Adjust for the pointer being at the top
      const adjustedAngle = (360 - normalizedAngle + 90) % 360;
      const winningIndex = Math.floor(adjustedAngle / segmentAngle) % options.length;

      setResult(options[winningIndex]);
      setIsSpinning(false);

      if (soundEnabled) {
        // Play a simple beep using Web Audio API
        try {
          const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.3;
          oscillator.start();
          setTimeout(() => oscillator.stop(), 150);
        } catch {
          // Audio not available
        }
      }
    }, 4000);
  };

  const reset = () => {
    setOptions(["Option 1", "Option 2", "Option 3"]);
    setResult(null);
    setRotation(0);
  };

  const shareResult = () => {
    if (!result) return;
    const text = `The wheel has spoken: ${result}! 🎯 Try your luck at techtrendi.com/tools/decision-wheel`;
    navigator.clipboard.writeText(text);
    toast.success("Result copied!");
  };

  const segmentAngle = 360 / options.length;

  return (
    <Layout>
      <SEOHead
        title="Decision Wheel - Random Choice Picker | TechTrendi"
        description="Can't decide? Spin the wheel! Make random decisions easily with our fun decision wheel spinner. Perfect for choosing where to eat, what to watch, and more."
        canonicalUrl="https://techtrendi.com/tools/decision-wheel"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Decision <span className="text-primary">Wheel</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Can't decide? Let the wheel decide for you!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Wheel */}
          <div className="flex flex-col items-center">
            {/* Pointer */}
            <div className="relative mb-4">
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-primary" />
            </div>

            {/* Wheel Container */}
            <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
              <div
                ref={wheelRef}
                className="w-full h-full rounded-full border-4 border-gray-300 shadow-xl overflow-hidden transition-transform"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: isSpinning ? "4s" : "0s",
                  transitionTimingFunction: "cubic-bezier(0.17, 0.67, 0.12, 0.99)",
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {options.map((option, index) => {
                    const startAngle = index * segmentAngle - 90;
                    const endAngle = startAngle + segmentAngle;
                    const largeArc = segmentAngle > 180 ? 1 : 0;

                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = (endAngle * Math.PI) / 180;

                    const x1 = 50 + 50 * Math.cos(startRad);
                    const y1 = 50 + 50 * Math.sin(startRad);
                    const x2 = 50 + 50 * Math.cos(endRad);
                    const y2 = 50 + 50 * Math.sin(endRad);

                    const textAngle = startAngle + segmentAngle / 2;
                    const textRad = (textAngle * Math.PI) / 180;
                    const textX = 50 + 35 * Math.cos(textRad);
                    const textY = 50 + 35 * Math.sin(textRad);

                    return (
                      <g key={index}>
                        <path
                          d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={colors[index % colors.length]}
                          stroke="white"
                          strokeWidth="0.5"
                        />
                        <text
                          x={textX}
                          y={textY}
                          fill="white"
                          fontSize="4"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                          style={{ textShadow: "0 0 2px rgba(0,0,0,0.5)" }}
                        >
                          {option.length > 10 ? option.substring(0, 10) + "..." : option}
                        </text>
                      </g>
                    );
                  })}
                  {/* Center circle */}
                  <circle cx="50" cy="50" r="8" fill="white" stroke="#333" strokeWidth="1" />
                </svg>
              </div>
            </div>

            {/* Spin Button */}
            <Button
              size="lg"
              onClick={spinWheel}
              disabled={isSpinning || options.length < 2}
              className="mt-8 text-xl px-12 py-6"
            >
              {isSpinning ? (
                <span className="animate-pulse">Spinning...</span>
              ) : (
                <>
                  <Dices className="w-6 h-6 mr-2" />
                  SPIN!
                </>
              )}
            </Button>

            {/* Result */}
            {result && (
              <Card className="mt-6 border-2 border-primary bg-primary/5 w-full max-w-sm">
                <CardContent className="pt-6 text-center">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">The wheel has chosen:</p>
                  <p className="text-3xl font-bold text-primary mt-2">{result}</p>
                  <Button variant="outline" size="sm" onClick={shareResult} className="mt-4">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Options */}
          <div className="space-y-6">
            {/* Add Option */}
            <Card>
              <CardHeader>
                <CardTitle>Options</CardTitle>
                <CardDescription>Add up to 12 options to the wheel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add an option..."
                    onKeyDown={(e) => e.key === "Enter" && addOption()}
                  />
                  <Button onClick={addOption}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded bg-muted"
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="flex-1 truncate">{option}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={reset} className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Presets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => loadPreset(preset)}
                      className="justify-start"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Use Cases */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Perfect For</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li>• Deciding where to eat</li>
                  <li>• Picking a movie to watch</li>
                  <li>• Team building activities</li>
                  <li>• Random giveaway winners</li>
                  <li>• Choosing who goes first</li>
                  <li>• Making tough decisions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
