import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

// Rebuilt 28 Nov 2026. The old page claimed to connect to YouTube, Instagram and
// Twitter, but showed made-up demo numbers behind a "premium" wall that could not be
// paid. This version is honest: you type in the numbers your apps already show you,
// it saves them on your own device, and it works out the rates and growth for you.

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Facebook", "X (Twitter)", "Snapchat", "LinkedIn"] as const;
type Platform = (typeof PLATFORMS)[number];

interface Snapshot {
  id: string;
  date: string; // YYYY-MM-DD
  platform: Platform;
  followers: number;
  posts: number; // posts in this period
  views: number; // views in this period
  likes: number;
  comments: number;
  shares: number;
}

const STORE_KEY = "techtrendi_creator_stats_v2";

const today = () => new Date().toISOString().slice(0, 10);
const num = (v: string) => {
  const n = Number(v.replace(/[, ]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const fmt = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 0 });
const pct = (n: number) => `${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}%`;

/** Engagement per follower: (likes + comments + shares) / followers. */
const engagementByFollowers = (s: Snapshot) =>
  s.followers > 0 ? ((s.likes + s.comments + s.shares) / s.followers) * 100 : 0;
/** Engagement per view: (likes + comments + shares) / views. Fairer for TikTok and Reels. */
const engagementByViews = (s: Snapshot) => (s.views > 0 ? ((s.likes + s.comments + s.shares) / s.views) * 100 : 0);

export default function CreatorAnalytics() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    date: today(),
    platform: "TikTok" as Platform,
    followers: "",
    posts: "",
    views: "",
    likes: "",
    comments: "",
    shares: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setSnapshots(JSON.parse(raw));
    } catch {
      // ignore broken saved data
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(snapshots));
    } catch {
      // storage full or blocked: the page still works for this visit
    }
  }, [snapshots, loaded]);

  const addSnapshot = () => {
    if (!form.followers.trim()) {
      toast.error("Enter at least your follower count");
      return;
    }
    const snap: Snapshot = {
      id: `${Date.now()}`,
      date: form.date || today(),
      platform: form.platform,
      followers: num(form.followers),
      posts: num(form.posts),
      views: num(form.views),
      likes: num(form.likes),
      comments: num(form.comments),
      shares: num(form.shares),
    };
    setSnapshots((prev) => [...prev, snap].sort((a, b) => a.date.localeCompare(b.date)));
    setForm((f) => ({ ...f, followers: "", posts: "", views: "", likes: "", comments: "", shares: "" }));
    toast.success(`${snap.platform} numbers saved`);
  };

  const remove = (id: string) => setSnapshots((prev) => prev.filter((s) => s.id !== id));

  // Latest and previous entry for each platform
  const perPlatform = useMemo(() => {
    const out: { platform: Platform; latest: Snapshot; previous?: Snapshot; entries: number }[] = [];
    for (const p of PLATFORMS) {
      const list = snapshots.filter((s) => s.platform === p);
      if (!list.length) continue;
      out.push({ platform: p, latest: list[list.length - 1], previous: list[list.length - 2], entries: list.length });
    }
    return out;
  }, [snapshots]);

  const totals = useMemo(() => {
    const followers = perPlatform.reduce((sum, p) => sum + p.latest.followers, 0);
    const views = perPlatform.reduce((sum, p) => sum + p.latest.views, 0);
    const best = [...perPlatform]
      .filter((p) => p.latest.views > 0 || p.latest.followers > 0)
      .sort((a, b) => engagementByViews(b.latest) - engagementByViews(a.latest))[0];
    return { followers, views, best };
  }, [perPlatform]);

  const exportCsv = () => {
    const head = "date,platform,followers,posts,views,likes,comments,shares,engagement_per_follower_pct,engagement_per_view_pct";
    const rows = snapshots.map((s) =>
      [s.date, `"${s.platform}"`, s.followers, s.posts, s.views, s.likes, s.comments, s.shares,
        engagementByFollowers(s).toFixed(2), engagementByViews(s).toFixed(2)].join(","),
    );
    const blob = new Blob([[head, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `creator-stats-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Growth = ({ now, before }: { now: number; before?: number }) => {
    if (before === undefined) return <span className="text-xs text-muted-foreground">first entry</span>;
    const diff = now - before;
    const rate = before > 0 ? (diff / before) * 100 : 0;
    const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
    const colour = diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-muted-foreground";
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${colour}`}>
        <Icon className="h-3 w-3" />
        {diff > 0 ? "+" : ""}
        {fmt(diff)} ({before > 0 ? pct(rate) : "new"})
      </span>
    );
  };

  const field = (key: keyof typeof form, label: string, hint?: string) => (
    <div className="space-y-1">
      <Label htmlFor={`ca-${key}`} className="text-sm">{label}</Label>
      <Input
        id={`ca-${key}`}
        inputMode="numeric"
        placeholder={hint ?? "0"}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <Layout>
      <SEOHead
        title="Creator Analytics - Track Your Social Media Growth"
        description="Track followers, views and engagement for TikTok, Instagram, YouTube and Facebook in one place. Free, no sign-in, and your numbers stay on your phone."
        canonical="/tools/creator-analytics"
        keywords={["creator analytics", "engagement rate calculator", "tiktok engagement rate", "instagram growth tracker", "social media analytics"]}
      />

      <div className="container max-w-5xl py-12 md:py-20">
        <div className="mb-10 text-center">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Free · No sign-in
          </Badge>
          <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Creator <span className="text-primary">Analytics</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Type in the numbers from your TikTok, Instagram, YouTube or Facebook app once a week. See your engagement rate, your growth, and which platform is really working.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5" /> Add this week's numbers
              </CardTitle>
              <CardDescription>
                Find them in your app's insights or analytics page. Use the same period each time (for example, the last 7 days).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ca-platform" className="text-sm">Platform</Label>
                  <select
                    id="ca-platform"
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value as Platform })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ca-date" className="text-sm">Date</Label>
                  <Input id="ca-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                {field("followers", "Followers now", "e.g. 12,000")}
                {field("posts", "Posts this period")}
                {field("views", "Views this period")}
                {field("likes", "Likes")}
                {field("comments", "Comments")}
                {field("shares", "Shares / reposts")}
              </div>
              <Button className="w-full" onClick={addSnapshot}>
                <Plus className="mr-2 h-4 w-4" /> Save numbers
              </Button>
              <p className="text-xs text-muted-foreground">
                Saved on this phone or computer only. Nothing is sent to us, and we never ask for your passwords.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {perPlatform.length === 0 ? (
              <Card className="flex min-h-[320px] items-center justify-center">
                <div className="p-8 text-center">
                  <BarChart3 className="mx-auto mb-4 h-14 w-14 text-muted-foreground/30" />
                  <h3 className="mb-2 font-medium">Your dashboard will appear here</h3>
                  <p className="text-sm text-muted-foreground">Add numbers for one platform to start. Add them again next week to see your growth.</p>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Card><CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">Total followers</p>
                    <p className="text-2xl font-bold">{fmt(totals.followers)}</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">Views (latest period)</p>
                    <p className="text-2xl font-bold">{fmt(totals.views)}</p>
                  </CardContent></Card>
                  <Card className="col-span-2 sm:col-span-1"><CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">Most engaging platform</p>
                    <p className="text-lg font-bold">{totals.best ? totals.best.platform : "—"}</p>
                  </CardContent></Card>
                </div>

                {perPlatform.map(({ platform, latest, previous, entries }) => (
                  <Card key={platform}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{platform}</span>
                        <span className="text-xs font-normal text-muted-foreground">{entries} {entries === 1 ? "entry" : "entries"} · latest {latest.date}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Followers</p>
                        <p className="font-semibold">{fmt(latest.followers)}</p>
                        <Growth now={latest.followers} before={previous?.followers} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Views</p>
                        <p className="font-semibold">{fmt(latest.views)}</p>
                        <Growth now={latest.views} before={previous?.views} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Engagement per view</p>
                        <p className="font-semibold">{latest.views > 0 ? pct(engagementByViews(latest)) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Engagement per follower</p>
                        <p className="font-semibold">{latest.followers > 0 ? pct(engagementByFollowers(latest)) : "—"}</p>
                      </div>
                      {latest.posts > 0 && (
                        <div className="col-span-2 sm:col-span-4 text-xs text-muted-foreground">
                          About {fmt(latest.views / latest.posts)} views per post from {fmt(latest.posts)} {latest.posts === 1 ? "post" : "posts"}.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">All entries</CardTitle>
                    <Button variant="outline" size="sm" onClick={exportCsv}>
                      <Download className="mr-2 h-4 w-4" /> CSV
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[...snapshots].reverse().map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
                        <span className="min-w-0 truncate">
                          {s.date} · {s.platform} · {fmt(s.followers)} followers · {fmt(s.views)} views
                        </span>
                        <Button variant="ghost" size="icon" aria-label="Delete entry" onClick={() => remove(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="bg-muted/40">
              <CardContent className="space-y-2 pt-5 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Engagement per view</strong> = (likes + comments + shares) ÷ views. Best for TikTok, Reels and YouTube Shorts, where most viewers do not follow you.</p>
                <p><strong className="text-foreground">Engagement per follower</strong> = (likes + comments + shares) ÷ followers. This is what many brands ask for in a pitch.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
