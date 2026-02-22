import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  User, RefreshCw, Copy, Check, Sparkles, AtSign, Hash, Dice5,
  Star, Zap, Heart, Crown, Ghost, Flame, Gamepad2, Music, Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GeneratorOptions {
  baseName: string;
  style: string;
  includeNumbers: boolean;
  includeSymbols: boolean;
  maxLength: number;
}

const styles = [
  { value: "gaming", label: "Gaming", icon: Gamepad2, examples: ["xXShadowXx", "ProGamer", "NightRaider"] },
  { value: "professional", label: "Professional", icon: User, examples: ["JohnDoe_Dev", "JSmith2024", "TechWriter"] },
  { value: "creative", label: "Creative", icon: Sparkles, examples: ["DreamWeaver", "PixelArtist", "SoundWizard"] },
  { value: "aesthetic", label: "Aesthetic", icon: Star, examples: ["moonchild", "velvetsky", "softpetals"] },
  { value: "edgy", label: "Edgy/Cool", icon: Flame, examples: ["DarkViper", "ChaosKnight", "VoidWalker"] },
  { value: "cute", label: "Cute", icon: Heart, examples: ["BunnyCloud", "StarryEyes", "SugarPuff"] },
  { value: "meme", label: "Meme/Funny", icon: Ghost, examples: ["SneakyPotato", "CoolBeans", "YeetMaster"] },
];

const adjectives = {
  gaming: ["Pro", "Epic", "Mega", "Ultra", "Hyper", "Super", "Elite", "Alpha", "Omega", "Apex", "Shadow", "Dark", "Night", "Storm", "Thunder", "Lightning", "Cyber", "Neo", "Quantum"],
  professional: ["Smart", "Tech", "Digital", "Modern", "Prime", "Core", "Pro", "Expert", "Chief", "Lead", "Senior"],
  creative: ["Dream", "Pixel", "Sound", "Vision", "Art", "Design", "Create", "Imagine", "Craft", "Build", "Make"],
  aesthetic: ["soft", "velvet", "misty", "lunar", "cosmic", "ethereal", "serene", "gentle", "pastel", "dreamy", "moonlit", "starry"],
  edgy: ["Dark", "Shadow", "Void", "Chaos", "Phantom", "Demon", "Viper", "Raven", "Reaper", "Skull", "Death", "Blood", "Grim"],
  cute: ["Sweet", "Sugar", "Honey", "Fluffy", "Tiny", "Little", "Baby", "Sparkle", "Twinkle", "Lovely", "Bubbly", "Peachy"],
  meme: ["Sneaky", "Chonky", "Yeet", "Dank", "Stonks", "Big", "Smol", "Absolute", "Mega", "Ultra", "Based"],
};

const nouns = {
  gaming: ["Warrior", "Knight", "Hunter", "Sniper", "Assassin", "Ninja", "Samurai", "Dragon", "Phoenix", "Wolf", "Tiger", "Hawk", "Viper", "Ghost", "Raider", "Slayer", "Master", "Lord", "King", "Legend"],
  professional: ["Dev", "Coder", "Builder", "Maker", "Writer", "Creator", "Designer", "Engineer", "Analyst", "Manager"],
  creative: ["Artist", "Creator", "Maker", "Designer", "Wizard", "Weaver", "Crafter", "Builder", "Dreamer", "Visionary"],
  aesthetic: ["moon", "star", "cloud", "sky", "rose", "petal", "breeze", "rain", "snow", "bloom", "leaf", "river", "meadow"],
  edgy: ["Knight", "Walker", "Hunter", "Reaper", "Demon", "Lord", "King", "Blade", "Fang", "Claw", "Soul", "Heart"],
  cute: ["Bunny", "Kitty", "Puppy", "Bear", "Cloud", "Star", "Moon", "Puff", "Bean", "Blossom", "Daisy", "Muffin"],
  meme: ["Potato", "Bean", "Boi", "Chad", "Gamer", "Duck", "Goose", "Frog", "Cat", "Doge", "Monke", "Shrimp"],
};

const defaultOptions: GeneratorOptions = {
  baseName: "",
  style: "gaming",
  includeNumbers: true,
  includeSymbols: false,
  maxLength: 16,
};

export default function UsernameGenerator() {
  const [options, setOptions] = useState<GeneratorOptions>(defaultOptions);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateUsernames = () => {
    const results: string[] = [];
    const style = options.style as keyof typeof adjectives;
    const styleAdjectives = adjectives[style] || adjectives.gaming;
    const styleNouns = nouns[style] || nouns.gaming;

    const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    const formatters: Array<(base: string, adj: string, noun: string) => string> = [
      // Base name variations
      (base) => base ? `${base}${getRandomNumber(1, 999)}` : "",
      (base) => base ? `${base}_${getRandomElement(styleNouns)}` : "",
      (base) => base ? `${getRandomElement(styleAdjectives)}${base}` : "",
      (base) => base ? `The${base}${getRandomNumber(1, 99)}` : "",
      (base) => base ? `x${base}x` : "",
      (base) => base ? `_${base}_` : "",
      (base) => base ? `${base}Official` : "",
      (base) => base ? `Real${base}` : "",

      // Adjective + Noun combinations
      (_, adj, noun) => `${adj}${noun}`,
      (_, adj, noun) => `${adj}_${noun}`,
      (_, adj, noun) => `${adj}${noun}${getRandomNumber(1, 99)}`,
      (_, adj, noun) => `The${adj}${noun}`,
      (_, adj, noun) => `${noun}${adj}`,
      (_, adj, noun) => style === "aesthetic" ? `${adj}.${noun}` : `${adj}${noun}`,
      (_, adj, noun) => style === "gaming" ? `xX${adj}${noun}Xx` : `${adj}${noun}`,
      (_, adj, noun) => `${adj}${noun}${getRandomElement(["YT", "TV", "TTV", "Live", ""])}`,

      // Creative patterns
      (_, adj, noun) => `${noun}Of${adj}`,
      (_, adj, noun) => `${adj}${noun}Gaming`,
      (_, adj, noun) => `Not${adj}${noun}`,
      (_, adj, noun) => `Just${adj}${noun}`,
      (_, adj, noun) => `${adj}${noun}HD`,
      (_, adj, noun) => `${adj}${noun}Pro`,
      (_, adj, noun) => `Lord${noun}`,
      (_, adj, noun) => `${noun}Master`,
    ];

    // Generate 12 usernames
    while (results.length < 12) {
      const adj = getRandomElement(styleAdjectives);
      const noun = getRandomElement(styleNouns);
      const formatter = getRandomElement(formatters);

      let username = formatter(options.baseName, adj, noun);

      // Skip empty results (when base name is required but empty)
      if (!username) continue;

      // Add numbers if enabled and not already present
      if (options.includeNumbers && !/\d/.test(username) && Math.random() > 0.5) {
        username += getRandomNumber(1, 999);
      }

      // Add symbols if enabled
      if (options.includeSymbols && Math.random() > 0.7) {
        const symbols = ["_", ".", "-"];
        const symbol = getRandomElement(symbols);
        const pos = Math.floor(Math.random() * username.length);
        username = username.slice(0, pos) + symbol + username.slice(pos);
      }

      // Trim to max length
      if (username.length > options.maxLength) {
        username = username.slice(0, options.maxLength);
      }

      // Remove duplicate characters at edges
      username = username.replace(/^[_.\-]+|[_.\-]+$/g, "");

      // Only add unique usernames
      if (username.length >= 3 && !results.includes(username)) {
        results.push(username);
      }
    }

    setUsernames(results);
  };

  const copyUsername = (username: string, index: number) => {
    navigator.clipboard.writeText(username);
    setCopiedIndex(index);
    toast.success("Username copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleFavorite = (username: string) => {
    if (favorites.includes(username)) {
      setFavorites(favorites.filter((f) => f !== username));
      toast.success("Removed from favorites");
    } else {
      setFavorites([...favorites, username]);
      toast.success("Added to favorites");
    }
  };

  const updateOptions = (updates: Partial<GeneratorOptions>) => {
    setOptions((prev) => ({ ...prev, ...updates }));
  };

  return (
    <Layout>
      <SEOHead
        title="Username Generator - Create Unique Usernames | TechTrendi"
        description="Generate unique usernames for gaming, social media, and more. Multiple styles, customizable options, instant results."
        canonicalUrl="https://techtrendi.com/tools/username-generator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Username <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Generate unique usernames for gaming, social media, and more
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Options */}
          <div className="space-y-6">
            {/* Base Name */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Name (optional)</CardTitle>
                <CardDescription>Include your name in generated usernames</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={options.baseName}
                  onChange={(e) => updateOptions({ baseName: e.target.value })}
                  placeholder="Enter your name"
                />
              </CardContent>
            </Card>

            {/* Style */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Style</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {styles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => updateOptions({ style: style.value })}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                        options.style === style.value
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <style.icon className={cn(
                        "w-5 h-5",
                        options.style === style.value ? "text-primary" : "text-muted-foreground"
                      )} />
                      <div>
                        <p className="font-medium text-sm">{style.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {style.examples.join(", ")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Numbers</Label>
                    <p className="text-xs text-muted-foreground">Add numbers to usernames</p>
                  </div>
                  <Switch
                    checked={options.includeNumbers}
                    onCheckedChange={(v) => updateOptions({ includeNumbers: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Symbols</Label>
                    <p className="text-xs text-muted-foreground">Add _ . - to usernames</p>
                  </div>
                  <Switch
                    checked={options.includeSymbols}
                    onCheckedChange={(v) => updateOptions({ includeSymbols: v })}
                  />
                </div>
                <div>
                  <Label>Max Length: {options.maxLength} characters</Label>
                  <Slider
                    value={[options.maxLength]}
                    onValueChange={([v]) => updateOptions({ maxLength: v })}
                    min={6}
                    max={20}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={generateUsernames} className="w-full" size="lg">
              <Dice5 className="w-4 h-4 mr-2" />
              Generate Usernames
            </Button>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generated Usernames */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Usernames</CardTitle>
                  {usernames.length > 0 && (
                    <Button variant="outline" size="sm" onClick={generateUsernames}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {usernames.length === 0 ? (
                  <div className="text-center py-12">
                    <AtSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Click "Generate Usernames" to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {usernames.map((username, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                      >
                        <span className="font-mono font-medium truncate">{username}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(username)}
                            className={cn(
                              "h-8 w-8 p-0",
                              favorites.includes(username) && "text-yellow-500"
                            )}
                          >
                            <Star className={cn(
                              "w-4 h-4",
                              favorites.includes(username) && "fill-current"
                            )} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyUsername(username, index)}
                            className="h-8 w-8 p-0"
                          >
                            {copiedIndex === index ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Favorites */}
            {favorites.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Favorites
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFavorites([])}
                      className="text-muted-foreground"
                    >
                      Clear All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {favorites.map((username, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 rounded-full border bg-yellow-500/10 border-yellow-500/30"
                      >
                        <span className="font-mono text-sm">{username}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(username);
                            toast.success("Copied!");
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Username Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Keep it memorable - shorter is usually better</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Avoid special characters for cross-platform compatibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Check availability on your target platforms before committing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Consider how it sounds when spoken for streaming/gaming</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
