import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Copy, Check, Loader2, Sparkles, Lightbulb,
} from "lucide-react";

const platforms = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "Twitter/X" },
  { id: "youtube", label: "YouTube" },
  { id: "blog", label: "Blog" },
];

const frequencies = [
  { id: "1", label: "1 post/week" },
  { id: "2", label: "2 posts/week" },
  { id: "3", label: "3 posts/week" },
  { id: "5", label: "5 posts/week" },
  { id: "7", label: "Daily" },
];

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const postTypeColors: Record<string, string> = {
  Educational: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  Story: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  "How-To": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  List: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  Opinion: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  Engagement: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400",
  Inspiration: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
};

interface CalendarPost {
  day: number;
  type: string;
  title: string;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

export default function ContentCalendar() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [frequency, setFrequency] = useState("3");
  const [startMonth, setStartMonth] = useState(
    String(new Date().getMonth())
  );
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCalendar = async () => {
    if (!niche.trim()) {
      toast.error("Please enter a niche or topic");
      return;
    }

    setGenerating(true);
    setPosts([]);

    const platformLabel = platforms.find((p) => p.id === platform)?.label || platform;
    const freqLabel = frequencies.find((f) => f.id === frequency)?.label || frequency;
    const monthName = months[parseInt(startMonth)];

    const prompt = `You are a content strategist. Create a 30-day content calendar for:

Niche/Topic: ${niche.trim()}
Platform: ${platformLabel}
Posting Frequency: ${freqLabel}
Month: ${monthName}

Rules:
- Generate posts spread evenly across 30 days based on the posting frequency (${frequency} posts per week)
- Each post must have: day (number 1-30), type (one of: Educational, Story, How-To, List, Opinion, Engagement, Inspiration), and title (short, catchy content title)
- Mix up the post types for variety
- Make titles specific and actionable for the given niche
- Only include days that have posts scheduled

Return ONLY valid JSON — an array of objects with keys: day, type, title. No markdown, no code fences, no extra text.`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a content strategist. Always respond with valid JSON arrays only. No markdown, no explanation.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) throw new Error("Empty response from AI");

      const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed: CalendarPost[] = JSON.parse(cleaned);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Invalid response format");
      }

      const normalized = parsed.map((p) => ({
        day: Number(p.day) || 1,
        type: p.type || "Educational",
        title: p.title || "Untitled",
      }));

      setPosts(normalized);
      toast.success(`Generated ${normalized.length} posts for your calendar!`);
    } catch (err: any) {
      console.error("Calendar generation error:", err);
      toast.error(err.message || "Failed to generate calendar. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyCalendar = () => {
    const monthName = months[parseInt(startMonth)];
    const text = `Content Calendar — ${monthName}\nNiche: ${niche}\n\n` +
      posts
        .sort((a, b) => a.day - b.day)
        .map((p) => `Day ${p.day} [${p.type}]: ${p.title}`)
        .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Calendar copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Build calendar grid
  const monthName = months[parseInt(startMonth)];
  const year = new Date().getFullYear();
  const firstDayOfMonth = new Date(year, parseInt(startMonth), 1).getDay();
  // Convert Sunday=0 to Monday-based: Mon=0 ... Sun=6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, parseInt(startMonth) + 1, 0).getDate();
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const getPostForDay = (day: number) => posts.find((p) => p.day === day);

  return (
    <Layout>
      <SEOHead
        title="AI 30-Day Content Calendar | TechTrendi"
        description="Generate a 30-day content calendar with AI. Get post ideas tailored to your niche and platform with content type variety."
        canonical="/tools/content-calendar"
      />

      <div className="container py-12 md:py-20 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            AI-Powered Tool
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI 30-Day Content <span className="text-green-600 dark:text-green-400">Calendar</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Plan a full month of content in seconds. Get a visual calendar with post types and titles tailored to your niche.
          </p>
        </div>

        {/* Inputs */}
        <Card className="mb-8 border-green-200 dark:border-green-900/50">
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label>Niche / Topic *</Label>
                <Input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g., Fitness, AI, Cooking"
                />
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Posts per Week</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Month</Label>
                <Select value={startMonth} onValueChange={setStartMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => (
                      <SelectItem key={m} value={String(i)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                onClick={generateCalendar}
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Calendar...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Calendar
                  </>
                )}
              </Button>
              {posts.length > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={copyCalendar}
                  className="border-green-300 dark:border-green-800"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Post Type Legend */}
        {posts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {Object.entries(postTypeColors).map(([type, color]) => (
              <Badge key={type} variant="secondary" className={cn("text-xs", color)}>
                {type}
              </Badge>
            ))}
          </div>
        )}

        {/* Calendar Grid */}
        {generating && (
          <div className="animate-pulse">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((d) => (
                <div key={d} className="h-8 bg-muted rounded" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded" />
              ))}
            </div>
          </div>
        )}

        {posts.length > 0 && !generating && (
          <Card className="border-green-200 dark:border-green-900/50 overflow-hidden">
            <CardHeader className="bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-900/50">
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <CalendarDays className="w-5 h-5 text-green-600 dark:text-green-400" />
                {monthName} {year}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {dayNames.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-semibold text-muted-foreground py-2"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] md:min-h-[100px]" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const post = getPostForDay(day);
                  return (
                    <div
                      key={day}
                      className={cn(
                        "min-h-[80px] md:min-h-[100px] rounded-md border p-1.5 transition-colors",
                        post
                          ? "border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20"
                          : "border-border/50 bg-muted/20"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-medium",
                        post ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
                      )}>
                        {day}
                      </span>
                      {post && (
                        <div className="mt-1 space-y-1">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] px-1 py-0 leading-tight block w-fit",
                              postTypeColors[post.type] || "bg-gray-100 text-gray-700"
                            )}
                          >
                            {post.type}
                          </Badge>
                          <p className="text-[10px] md:text-xs leading-tight text-foreground line-clamp-3">
                            {post.title}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {posts.length === 0 && !generating && (
          <Card className="border-green-200 dark:border-green-900/50">
            <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mb-4 opacity-50 text-green-400" />
              <p className="font-medium">Your content calendar will appear here</p>
              <p className="text-sm mt-1">Enter your niche and generate a full month of content</p>
            </CardContent>
          </Card>
        )}

        {/* Tips Section */}
        <Card className="mt-12 border-green-200 dark:border-green-900/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">1.</span>
                <span>
                  <strong>Content pillars</strong> are 3-5 core themes you consistently create around. For example, a fitness creator might use: Workouts, Nutrition, Mindset, Myths, and Motivation. This calendar mixes types to keep your feed varied.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">2.</span>
                <span>
                  <strong>Batching content</strong> means creating multiple posts in one session. Use this calendar to batch — pick a day, write all the week's posts at once. It's 3x more efficient than creating one post at a time.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">3.</span>
                <span>
                  <strong>Consistency beats quantity.</strong> Posting 3 high-quality pieces per week outperforms 7 rushed posts. Start with a frequency you can maintain for 3+ months, then scale up.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">4.</span>
                <span>
                  Copy the calendar and paste it into your scheduling tool (Buffer, Later, Notion). Treat it as a starting point — swap titles, adjust days, and add your personal spin.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
