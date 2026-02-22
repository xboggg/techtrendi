import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Share2, Sparkles, Copy, Check, RefreshCw, Wand2, Instagram,
  Twitter, Linkedin, Hash, AtSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const platforms = [
  { id: "instagram", label: "Instagram", icon: Instagram, maxLength: 2200, hashtagLimit: 30 },
  { id: "twitter", label: "Twitter/X", icon: Twitter, maxLength: 280, hashtagLimit: 5 },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, maxLength: 3000, hashtagLimit: 5 },
];

const tones = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual & Friendly" },
  { id: "humorous", label: "Humorous" },
  { id: "inspirational", label: "Inspirational" },
  { id: "educational", label: "Educational" },
  { id: "promotional", label: "Promotional" },
];

const captionTemplates: Record<string, Record<string, (topic: string, details: string) => string>> = {
  instagram: {
    professional: (topic, details) => `${topic} 📌\n\n${details || "Here's what you need to know..."}\n\nDouble tap if you agree! 👇\n\n#${topic.toLowerCase().replace(/\s+/g, "")} #business #growth #success #entrepreneur`,
    casual: (topic, details) => `okay but can we talk about ${topic}? 🤭\n\n${details || "Because honestly..."}\n\nDrop a 🙌 if you relate!\n\n#relatable #lifestyle #mood`,
    humorous: (topic, details) => `Me trying to explain ${topic} to people: 🤡\n\n${details || "It's giving chaos energy"}\n\nTag someone who needs to see this 😂\n\n#funny #memes #humor`,
    inspirational: (topic, details) => `✨ ${topic} ✨\n\n${details || "Remember: every step forward is progress."}\n\nSave this for when you need motivation 💪\n\n#motivation #mindset #growth #inspiration`,
    educational: (topic, details) => `📚 Let's talk about ${topic}\n\n${details || "Here's what most people get wrong..."}\n\n💡 Save this for later!\n\n#tips #learning #education #howto`,
    promotional: (topic, details) => `🚀 Introducing: ${topic}\n\n${details || "This is what you've been waiting for..."}\n\n🔗 Link in bio to learn more!\n\n#newlaunch #announcement #exciting`,
  },
  twitter: {
    professional: (topic, details) => `${topic} matters more than ever.\n\n${details || "Here's why →"}\n\n🧵`,
    casual: (topic, details) => `hot take: ${topic} is underrated\n\n${details || "and I'll die on this hill"}`,
    humorous: (topic, details) => `nobody:\n\nabsolutely nobody:\n\nme: let me tell you about ${topic}\n\n${details || ""}`,
    inspirational: (topic, details) => `Reminder: ${topic}\n\n${details || "You've got this. 💪"}`,
    educational: (topic, details) => `${topic} explained simply:\n\n${details || "Thread 🧵"}`,
    promotional: (topic, details) => `Big news: ${topic} is here!\n\n${details || ""}\n\nCheck it out 👇`,
  },
  linkedin: {
    professional: (topic, details) => `I've been thinking a lot about ${topic} lately.\n\n${details || "Here's what I've learned after years in this industry..."}\n\nThe biggest takeaway?\n\n✅ Be consistent\n✅ Keep learning\n✅ Add value first\n\nWhat's your experience with ${topic}? I'd love to hear your thoughts in the comments.\n\n#${topic.toLowerCase().replace(/\s+/g, "")} #leadership #professionaldevelopment`,
    casual: (topic, details) => `Can we normalize talking about ${topic}?\n\n${details || "Because here's the thing..."}\n\nAgree? Disagree? Let's discuss 👇\n\n#authenticity #realtalk`,
    humorous: (topic, details) => `When someone asks me about ${topic}:\n\n${details || "*opens PowerPoint with 47 slides*"}\n\n😅 Who else?\n\n#corporatehumor #relatable`,
    inspirational: (topic, details) => `${topic} changed everything for me.\n\n${details || "3 years ago, I never would have imagined where I am today."}\n\nTo anyone starting their journey:\n\nYour path is unique. Trust it.\n\n#growthmindset #careeradvice #motivation`,
    educational: (topic, details) => `${topic}: A Quick Guide\n\n${details || "After 10 years in the industry, here's what actually works:"}\n\n1️⃣ Start small\n2️⃣ Be consistent\n3️⃣ Measure results\n4️⃣ Iterate\n5️⃣ Scale what works\n\nSave this post for later! ♻️\n\n#tips #howto #professionalgrowth`,
    promotional: (topic, details) => `Excited to announce: ${topic}! 🎉\n\n${details || "This has been months in the making..."}\n\nWe built this because we believe everyone deserves access to better tools.\n\nCheck it out and let me know what you think!\n\n🔗 Link in comments\n\n#launch #startup #innovation`,
  },
};

export default function SocialCaptionGenerator() {
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("professional");
  const [customHashtags, setCustomHashtags] = useState("");
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateCaptions = () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setGenerating(true);

    setTimeout(() => {
      const generated: Record<string, string> = {};

      platforms.forEach((p) => {
        let caption = captionTemplates[p.id][tone](topic, details);

        // Add custom hashtags
        if (customHashtags.trim()) {
          const tags = customHashtags
            .split(/[\s,]+/)
            .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
            .slice(0, p.hashtagLimit);
          caption += `\n\n${tags.join(" ")}`;
        }

        generated[p.id] = caption;
      });

      setCaptions(generated);
      setGenerating(false);
      toast.success("Captions generated!");
    }, 800);
  };

  const copyCaption = (platformId: string) => {
    navigator.clipboard.writeText(captions[platformId]);
    setCopiedId(platformId);
    toast.success("Caption copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const regenerateSingle = (platformId: string) => {
    const template = captionTemplates[platformId][tone];
    let caption = template(topic, details);

    if (customHashtags.trim()) {
      const p = platforms.find((pl) => pl.id === platformId);
      const tags = customHashtags
        .split(/[\s,]+/)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
        .slice(0, p?.hashtagLimit || 5);
      caption += `\n\n${tags.join(" ")}`;
    }

    setCaptions((prev) => ({ ...prev, [platformId]: caption }));
    toast.success("Caption regenerated!");
  };

  const selectedPlatform = platforms.find((p) => p.id === platform);

  return (
    <Layout>
      <SEOHead
        title="Social Media Caption Generator - AI Captions | TechTrendi"
        description="Generate engaging social media captions for Instagram, Twitter, and LinkedIn. Choose your tone and get platform-optimized captions."
        canonicalUrl="https://techtrendi.com/tools/social-caption-generator"
      />

      <div className="container py-12 md:py-20 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Free Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Social Caption <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create engaging captions for all your social platforms
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Inputs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Post Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Topic / Main Idea *</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Morning routines for productivity"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Additional Details</Label>
                  <Textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Any specific points you want to include..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Custom Hashtags
                  </Label>
                  <Input
                    value={customHashtags}
                    onChange={(e) => setCustomHashtags(e.target.value)}
                    placeholder="marketing, socialmedia, tips"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate with commas or spaces
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button onClick={generateCaptions} size="lg" className="w-full" disabled={generating}>
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Captions
                </>
              )}
            </Button>
          </div>

          {/* Right: Output */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generated Captions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(captions).length > 0 ? (
                  <Tabs defaultValue="instagram" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      {platforms.map((p) => (
                        <TabsTrigger key={p.id} value={p.id} className="flex items-center gap-1">
                          <p.icon className="w-4 h-4" />
                          <span className="hidden sm:inline">{p.label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {platforms.map((p) => (
                      <TabsContent key={p.id} value={p.id} className="mt-4">
                        <div className="space-y-4">
                          <div className="relative">
                            <Textarea
                              value={captions[p.id] || ""}
                              onChange={(e) =>
                                setCaptions((prev) => ({ ...prev, [p.id]: e.target.value }))
                              }
                              rows={10}
                              className="resize-none"
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                              {(captions[p.id] || "").length}/{p.maxLength}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => regenerateSingle(p.id)}
                              className="flex-1"
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Regenerate
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => copyCaption(p.id)}
                              className="flex-1"
                            >
                              {copiedId === p.id ? (
                                <Check className="w-4 h-4 mr-1 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 mr-1" />
                              )}
                              Copy
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <AtSign className="w-12 h-12 mb-4 opacity-50" />
                    <p>Your captions will appear here</p>
                    <p className="text-sm">Enter a topic and generate</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Caption Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Instagram className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                    <span>Instagram: Put hashtags in the first comment for cleaner look</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Twitter className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Twitter: Keep it punchy, use threads for longer content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Linkedin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>LinkedIn: Start with a hook, use line breaks for readability</span>
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
