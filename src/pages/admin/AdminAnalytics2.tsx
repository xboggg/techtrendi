import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileText,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Newspaper,
  Loader2,
  Download,
  Clock,
  Eye,
  Users,
  AlertTriangle,
  Image,
  Calendar,
  PenSquare,
  BookOpen,
} from "lucide-react";

type TimeRange = "today" | "7d" | "30d" | "90d" | "all";
type Tab = "content" | "engagement" | "growth";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function getDateFilter(range: TimeRange): string | null {
  switch (range) {
    case "today": return new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    case "7d": return daysAgo(7);
    case "30d": return daysAgo(30);
    case "90d": return daysAgo(90);
    default: return null;
  }
}

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  cover_image: string | null;
  is_published: boolean;
  read_time_minutes: number | null;
  views: number | null;
  created_at: string;
  updated_at: string;
  content_type?: "article" | "guide";
}

interface NewsItem {
  id: string;
  title: string;
  category: string;
  slug: string;
  views: number | null;
  created_at: string;
  cover_image: string | null;
  excerpt: string | null;
  content: string | null;
  is_published?: boolean;
}

interface ReviewComment {
  id: string;
  review_id: string;
  created_at: string;
  reviews?: { title: string } | null;
}

interface Comment {
  id: string;
  article_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  created_at: string;
}

// SVG Bar Chart component
function BarChartSVG({ data, maxVal, color = "hsl(217, 91%, 60%)", height = 160 }: {
  data: { label: string; value: number }[];
  maxVal: number;
  color?: string;
  height?: number;
}) {
  if (data.length === 0) return <div className="text-muted-foreground text-sm py-8 text-center">No data</div>;
  const barWidth = Math.max(12, Math.min(40, Math.floor(600 / data.length) - 4));
  const svgWidth = Math.max(data.length * (barWidth + 4), 300);
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${svgWidth} ${height + 30}`} className="w-full" style={{ minWidth: Math.min(svgWidth, 300) }}>
        {data.map((d, i) => {
          const barH = maxVal > 0 ? (d.value / maxVal) * height : 0;
          const x = i * (barWidth + 4) + 2;
          return (
            <g key={i}>
              <rect
                x={x}
                y={height - barH}
                width={barWidth}
                height={Math.max(barH, 1)}
                rx={3}
                fill={color}
                opacity={0.85}
              />
              {d.value > 0 && (
                <text x={x + barWidth / 2} y={height - barH - 4} textAnchor="middle" className="fill-foreground" fontSize={9}>
                  {d.value}
                </text>
              )}
              <text x={x + barWidth / 2} y={height + 14} textAnchor="middle" className="fill-muted-foreground" fontSize={8}>
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// SVG Donut Chart component
function DonutChartSVG({ segments, size = 140 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="text-muted-foreground text-sm py-8 text-center">No data</div>;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const el = (
            <circle
              key={i}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium text-foreground">{seg.value} ({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Area/Line chart via SVG
function LineChartSVG({ data, color = "hsl(217, 91%, 60%)", height = 140 }: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return <div className="text-muted-foreground text-sm py-8 text-center">Not enough data</div>;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const w = 600;
  const pad = 10;
  const usableW = w - pad * 2;
  const usableH = height - 20;
  const points = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * usableW,
    y: usableH - (d.value / maxVal) * (usableH - 10) + 5,
  }));
  const polyline = points.map(p => `${p.x},${p.y}`).join(" ");
  const areaPath = `M${points[0].x},${usableH} ${points.map(p => `L${p.x},${p.y}`).join(" ")} L${points[points.length - 1].x},${usableH} Z`;
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ minWidth: 300 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Show every Nth label */}
        {data.map((d, i) => {
          const step = Math.max(1, Math.floor(data.length / 8));
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={points[i].x} y={height - 2} textAnchor="middle" className="fill-muted-foreground" fontSize={8}>
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function AdminAnalytics2() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [activeTab, setActiveTab] = useState<Tab>("content");

  const dateFilter = getDateFilter(timeRange);

  // Fetch all articles (articles table includes both articles & guides)
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ["analytics2-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, content, category, cover_image, is_published, read_time_minutes, views, created_at, updated_at, content_type");
      if (error) throw error;
      return (data || []) as Article[];
    },
  });

  // Fetch news
  const { data: newsItems = [], isLoading: newsLoading } = useQuery({
    queryKey: ["analytics2-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, category, slug, views, created_at, cover_image, excerpt, content, is_published");
      if (error) return [];
      return (data || []) as NewsItem[];
    },
  });

  // Fetch review comments
  const { data: reviewComments = [] } = useQuery({
    queryKey: ["analytics2-review-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_comments")
        .select("id, review_id, created_at, reviews(title)");
      if (error) return [];
      return (data || []) as ReviewComment[];
    },
  });

  // Fetch article comments
  const { data: articleComments = [] } = useQuery({
    queryKey: ["analytics2-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, article_id, created_at");
      if (error) return [];
      return (data || []) as Comment[];
    },
  });

  // Fetch profiles for user growth
  const { data: profiles = [] } = useQuery({
    queryKey: ["analytics2-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, created_at")
        .order("created_at", { ascending: true });
      if (error) return [];
      return (data || []) as Profile[];
    },
  });

  // Fetch page views for views growth
  const { data: pageViewDates = [] } = useQuery({
    queryKey: ["analytics2-pageview-dates", timeRange],
    queryFn: async () => {
      let query = supabase
        .from("page_views")
        .select("created_at")
        .order("created_at", { ascending: true });
      if (dateFilter) query = query.gte("created_at", dateFilter);
      const { data, error } = await query.limit(10000);
      if (error) return [];
      return (data || []) as { created_at: string }[];
    },
  });

  // All content (articles + news) for combined analysis
  const allContent = useMemo(() => {
    const mapped = [
      ...articles.map(a => ({
        id: a.id,
        title: a.title,
        type: (a.content_type || "article") as string,
        category: a.category,
        views: a.views || 0,
        created_at: a.created_at,
        updated_at: a.updated_at,
        is_published: a.is_published,
        cover_image: a.cover_image,
        excerpt: a.excerpt,
        content: a.content,
        read_time_minutes: a.read_time_minutes,
      })),
      ...newsItems.map(n => ({
        id: n.id,
        title: n.title,
        type: "news" as string,
        category: n.category,
        views: n.views || 0,
        created_at: n.created_at,
        updated_at: n.created_at,
        is_published: n.is_published !== false,
        cover_image: n.cover_image,
        excerpt: n.excerpt,
        content: n.content || "",
        read_time_minutes: null as number | null,
      })),
    ];
    return mapped;
  }, [articles, newsItems]);

  // Filter content by time range
  const filteredContent = useMemo(() => {
    if (!dateFilter) return allContent;
    return allContent.filter(c => c.created_at >= dateFilter);
  }, [allContent, dateFilter]);

  // ---- CONTENT PERFORMANCE COMPUTATIONS ----

  // Publish frequency by week
  const publishFrequency = useMemo(() => {
    const weeks: Record<string, number> = {};
    allContent.filter(c => c.is_published).forEach(c => {
      const d = new Date(c.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    });
    const sorted = Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b));
    // Last 12 weeks
    const recent = sorted.slice(-12);
    return recent.map(([k, v]) => ({ label: k.slice(5), value: v }));
  }, [allContent]);

  // Content age analysis - articles older than 30 days that still get views
  const contentAge = useMemo(() => {
    const now = Date.now();
    const buckets = [
      { label: "< 7d", min: 0, max: 7, views: 0, count: 0 },
      { label: "7-30d", min: 7, max: 30, views: 0, count: 0 },
      { label: "30-90d", min: 30, max: 90, views: 0, count: 0 },
      { label: "90d-6mo", min: 90, max: 180, views: 0, count: 0 },
      { label: "6mo-1yr", min: 180, max: 365, views: 0, count: 0 },
      { label: "> 1yr", min: 365, max: 9999, views: 0, count: 0 },
    ];
    allContent.filter(c => c.is_published).forEach(c => {
      const ageDays = Math.floor((now - new Date(c.created_at).getTime()) / 86400000);
      const bucket = buckets.find(b => ageDays >= b.min && ageDays < b.max);
      if (bucket) {
        bucket.views += c.views;
        bucket.count++;
      }
    });
    return buckets;
  }, [allContent]);

  // Guide vs Article performance
  const typePerformance = useMemo(() => {
    const types: Record<string, { views: number; count: number }> = {};
    allContent.filter(c => c.is_published).forEach(c => {
      const t = c.type;
      if (!types[t]) types[t] = { views: 0, count: 0 };
      types[t].views += c.views;
      types[t].count++;
    });
    return Object.entries(types).map(([type, data]) => ({
      type,
      totalViews: data.views,
      count: data.count,
      avgViews: data.count > 0 ? Math.round(data.views / data.count) : 0,
    })).sort((a, b) => b.totalViews - a.totalViews);
  }, [allContent]);

  // Average read time by category
  const readTimeByCategory = useMemo(() => {
    const cats: Record<string, { total: number; count: number }> = {};
    articles.filter(a => a.is_published && a.read_time_minutes).forEach(a => {
      if (!cats[a.category]) cats[a.category] = { total: 0, count: 0 };
      cats[a.category].total += a.read_time_minutes!;
      cats[a.category].count++;
    });
    return Object.entries(cats)
      .map(([cat, data]) => ({ label: cat, value: Math.round(data.total / data.count) }))
      .sort((a, b) => b.value - a.value);
  }, [articles]);

  // Top articles by views
  const topArticlesByViews = useMemo(() => {
    return [...allContent]
      .filter(c => c.is_published)
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);
  }, [allContent]);

  // Draft count & recently updated
  const draftCount = useMemo(() => allContent.filter(c => !c.is_published).length, [allContent]);
  const recentlyUpdated = useMemo(() => {
    const sevenDaysAgo = daysAgo(7);
    return articles.filter(a => a.updated_at > sevenDaysAgo && a.updated_at !== a.created_at).length;
  }, [articles]);

  // ---- ENGAGEMENT COMPUTATIONS ----

  // Comments per article (article comments)
  const commentsPerArticle = useMemo(() => {
    const counts: Record<string, number> = {};
    articleComments.forEach(c => {
      counts[c.article_id] = (counts[c.article_id] || 0) + 1;
    });
    return counts;
  }, [articleComments]);

  // Most commented articles
  const mostCommented = useMemo(() => {
    const counts: Record<string, { id: string; count: number }> = {};
    articleComments.forEach(c => {
      if (!counts[c.article_id]) counts[c.article_id] = { id: c.article_id, count: 0 };
      counts[c.article_id].count++;
    });
    const sorted = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
    return sorted.map(item => {
      const article = allContent.find(a => a.id === item.id);
      return { title: article?.title || "Unknown", comments: item.count, views: article?.views || 0 };
    });
  }, [articleComments, allContent]);

  // Total comments over time
  const commentsOverTime = useMemo(() => {
    const allComments = [
      ...articleComments.map(c => c.created_at),
      ...reviewComments.map(c => c.created_at),
    ].sort();
    const months: Record<string, number> = {};
    allComments.forEach(d => {
      const key = d.slice(0, 7);
      months[key] = (months[key] || 0) + 1;
    });
    const sorted = Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
    return sorted.map(([k, v]) => ({ label: k.slice(2), value: v }));
  }, [articleComments, reviewComments]);

  // Engagement score: views per unique user
  const engagementScore = useMemo(() => {
    const totalViews = allContent.reduce((s, c) => s + c.views, 0);
    const userCount = profiles.length || 1;
    return (totalViews / userCount).toFixed(1);
  }, [allContent, profiles]);

  // ---- GROWTH COMPUTATIONS ----

  // Cumulative articles over time
  const cumulativeContent = useMemo(() => {
    const sorted = [...allContent].filter(c => c.is_published).sort((a, b) => a.created_at.localeCompare(b.created_at));
    const months: Record<string, number> = {};
    let cumulative = 0;
    sorted.forEach(c => {
      const key = c.created_at.slice(0, 7);
      cumulative++;
      months[key] = cumulative;
    });
    const entries = Object.entries(months).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([k, v]) => ({ label: k.slice(2), value: v }));
  }, [allContent]);

  // Views growth (weekly from page_views)
  const viewsGrowth = useMemo(() => {
    const weeks: Record<string, number> = {};
    pageViewDates.forEach(pv => {
      const d = new Date(pv.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    });
    const sorted = Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([k, v]) => ({ label: k.slice(5), value: v }));
  }, [pageViewDates]);

  // New users over time
  const userGrowth = useMemo(() => {
    const months: Record<string, number> = {};
    profiles.forEach(p => {
      const key = p.created_at.slice(0, 7);
      months[key] = (months[key] || 0) + 1;
    });
    const sorted = Object.entries(months).sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([k, v]) => ({ label: k.slice(2), value: v }));
  }, [profiles]);

  // Category distribution for donut
  const categoryDistribution = useMemo(() => {
    const cats: Record<string, number> = {};
    allContent.filter(c => c.is_published).forEach(c => {
      cats[c.category] = (cats[c.category] || 0) + 1;
    });
    const colors = [
      "hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(346, 87%, 50%)",
      "hsl(45, 93%, 47%)", "hsl(280, 67%, 55%)", "hsl(200, 95%, 50%)",
      "hsl(24, 95%, 53%)", "hsl(162, 73%, 46%)", "hsl(330, 80%, 60%)",
      "hsl(60, 80%, 50%)", "hsl(240, 60%, 60%)", "hsl(120, 50%, 40%)",
    ];
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count], i) => ({ label: cat, value: count, color: colors[i % colors.length] }));
  }, [allContent]);

  // ---- SEO / QUALITY INDICATORS ----
  const seoMetrics = useMemo(() => {
    const published = allContent.filter(c => c.is_published);
    const noCover = published.filter(c => !c.cover_image);
    const shortContent = published.filter(c => (c.content?.length || 0) < 500);
    const noExcerpt = published.filter(c => !c.excerpt || c.excerpt.trim().length === 0);
    const unpublished = allContent.filter(c => !c.is_published);
    return { noCover, shortContent, noExcerpt, unpublished };
  }, [allContent]);

  // Export CSV
  const exportCSV = useCallback(() => {
    const headers = ["Title", "Type", "Category", "Views", "Published", "Cover Image", "Read Time", "Created", "Updated"];
    const rows = allContent.map(c => [
      c.title,
      c.type,
      c.category,
      c.views.toString(),
      c.is_published ? "Yes" : "No",
      c.cover_image ? "Yes" : "No",
      c.read_time_minutes?.toString() || "",
      c.created_at.slice(0, 10),
      c.updated_at.slice(0, 10),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `techtrendi-content-analytics-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [allContent, timeRange]);

  const isLoading = articlesLoading || newsLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-7 h-7" />
              Analytics — Content & Growth
            </h1>
            <p className="text-muted-foreground">Deep dive into content performance, engagement, and growth trends</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {(["today", "7d", "30d", "90d", "all"] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    timeRange === range
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {range === "today" ? "Today" : range === "all" ? "All" : range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
          {([
            { id: "content", label: "Content Performance", icon: Newspaper },
            { id: "engagement", label: "Engagement", icon: MessageSquare },
            { id: "growth", label: "Growth", icon: TrendingUp },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors",
                activeTab === id
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Summary cards (always visible) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Articles", value: articles.filter(a => a.content_type !== "guide").length, icon: FileText, color: "text-blue-500" },
            { label: "Total Guides", value: articles.filter(a => a.content_type === "guide").length, icon: BookOpen, color: "text-emerald-500" },
            { label: "Total News", value: newsItems.length, icon: Newspaper, color: "text-orange-500" },
            { label: "Drafts", value: draftCount, icon: PenSquare, color: "text-amber-500" },
          ].map((card, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <card.icon className={cn("w-4 h-4", card.color)} />
                {card.label}
              </div>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
            </div>
          ))}
        </div>

        {/* SEO & Quality Indicators (always visible) */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Content Quality Indicators
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Image className="w-3 h-3" />
                Missing Cover Image
              </div>
              <div className="text-xl font-bold text-foreground">{seoMetrics.noCover.length}</div>
              {seoMetrics.noCover.length > 0 && (
                <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                  {seoMetrics.noCover.slice(0, 3).map((c, i) => (
                    <div key={i} className="text-xs text-muted-foreground truncate">{c.title}</div>
                  ))}
                  {seoMetrics.noCover.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{seoMetrics.noCover.length - 3} more</div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <FileText className="w-3 h-3" />
                Short Content (&lt;500 chars)
              </div>
              <div className="text-xl font-bold text-foreground">{seoMetrics.shortContent.length}</div>
              {seoMetrics.shortContent.length > 0 && (
                <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                  {seoMetrics.shortContent.slice(0, 3).map((c, i) => (
                    <div key={i} className="text-xs text-muted-foreground truncate">{c.title}</div>
                  ))}
                  {seoMetrics.shortContent.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{seoMetrics.shortContent.length - 3} more</div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <PenSquare className="w-3 h-3" />
                Unpublished / Drafts
              </div>
              <div className="text-xl font-bold text-foreground">{seoMetrics.unpublished.length}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <FileText className="w-3 h-3" />
                Missing Excerpt
              </div>
              <div className="text-xl font-bold text-foreground">{seoMetrics.noExcerpt.length}</div>
            </div>
          </div>
        </div>

        {/* ===== CONTENT PERFORMANCE TAB ===== */}
        {activeTab === "content" && (
          <div className="space-y-6">
            {/* Publish Frequency */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4" />
                Publish Frequency (Last 12 Weeks)
              </h3>
              <BarChartSVG
                data={publishFrequency}
                maxVal={Math.max(...publishFrequency.map(d => d.value), 1)}
                color="hsl(217, 91%, 60%)"
              />
            </div>

            {/* Content Age Analysis */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" />
                Content Age vs Views
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Age</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Articles</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Total Views</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Avg Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentAge.map((bucket, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 font-medium text-foreground">{bucket.label}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">{bucket.count}</td>
                        <td className="py-2 px-3 text-right text-foreground">{bucket.views.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">
                          {bucket.count > 0 ? Math.round(bucket.views / bucket.count).toLocaleString() : 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Content Type Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4" />
                  Content Type Performance
                </h3>
                <div className="space-y-3">
                  {typePerformance.map((tp, i) => {
                    const maxViews = Math.max(...typePerformance.map(t => t.totalViews), 1);
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground font-medium capitalize">{tp.type}</span>
                          <span className="text-muted-foreground">{tp.count} items · {tp.totalViews.toLocaleString()} views</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(tp.totalViews / maxViews) * 100}%`,
                              backgroundColor: i === 0 ? "hsl(217, 91%, 60%)" : i === 1 ? "hsl(142, 76%, 36%)" : "hsl(45, 93%, 47%)",
                            }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">Avg: {tp.avgViews.toLocaleString()} views/item</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Avg Read Time by Category */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4" />
                  Avg Read Time by Category
                </h3>
                <BarChartSVG
                  data={readTimeByCategory}
                  maxVal={Math.max(...readTimeByCategory.map(d => d.value), 1)}
                  color="hsl(142, 76%, 36%)"
                />
              </div>
            </div>

            {/* Top Articles by Views */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4" />
                Top Content by Views
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">#</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Title</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Type</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Category</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topArticlesByViews.map((article, i) => (
                      <tr key={article.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                        <td className="py-2 px-3 text-foreground font-medium max-w-[300px] truncate">{article.title}</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="text-xs capitalize">{article.type}</Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{article.category}</td>
                        <td className="py-2 px-3 text-right font-medium text-foreground">{article.views.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Total Content Views</div>
                <div className="text-2xl font-bold text-foreground">
                  {allContent.reduce((s, c) => s + c.views, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Recently Updated (7d)</div>
                <div className="text-2xl font-bold text-foreground">{recentlyUpdated}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Avg Views/Article</div>
                <div className="text-2xl font-bold text-foreground">
                  {allContent.filter(c => c.is_published).length > 0
                    ? Math.round(allContent.filter(c => c.is_published).reduce((s, c) => s + c.views, 0) / allContent.filter(c => c.is_published).length).toLocaleString()
                    : 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== ENGAGEMENT TAB ===== */}
        {activeTab === "engagement" && (
          <div className="space-y-6">
            {/* Engagement summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <MessageSquare className="w-3 h-3" />
                  Total Comments
                </div>
                <div className="text-2xl font-bold text-foreground">{articleComments.length + reviewComments.length}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {articleComments.length} article · {reviewComments.length} review
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Eye className="w-3 h-3" />
                  Views per User
                </div>
                <div className="text-2xl font-bold text-foreground">{engagementScore}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Users className="w-3 h-3" />
                  Registered Users
                </div>
                <div className="text-2xl font-bold text-foreground">{profiles.length}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <FileText className="w-3 h-3" />
                  Avg Comments/Article
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {allContent.filter(c => c.is_published).length > 0
                    ? (articleComments.length / allContent.filter(c => c.is_published).length).toFixed(1)
                    : "0"}
                </div>
              </div>
            </div>

            {/* Comments Over Time */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4" />
                Comments Over Time (Monthly)
              </h3>
              <BarChartSVG
                data={commentsOverTime}
                maxVal={Math.max(...commentsOverTime.map(d => d.value), 1)}
                color="hsl(280, 67%, 55%)"
              />
            </div>

            {/* Most Commented Articles */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4" />
                Most Commented Articles
              </h3>
              {mostCommented.length === 0 ? (
                <div className="text-muted-foreground text-sm py-4 text-center">No comments yet</div>
              ) : (
                <div className="space-y-3">
                  {mostCommented.map((item, i) => {
                    const maxComments = Math.max(...mostCommented.map(m => m.comments), 1);
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground font-medium truncate max-w-[70%]">{item.title}</span>
                          <span className="text-muted-foreground">{item.comments} comments · {item.views.toLocaleString()} views</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-500 transition-all"
                            style={{ width: `${(item.comments / maxComments) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== GROWTH TAB ===== */}
        {activeTab === "growth" && (
          <div className="space-y-6">
            {/* Content Growth (cumulative) */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4" />
                Cumulative Content Growth
              </h3>
              <LineChartSVG
                data={cumulativeContent}
                color="hsl(217, 91%, 60%)"
              />
            </div>

            {/* Views Growth (weekly) */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4" />
                Weekly Views Trend
              </h3>
              <BarChartSVG
                data={viewsGrowth}
                maxVal={Math.max(...viewsGrowth.map(d => d.value), 1)}
                color="hsl(142, 76%, 36%)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New Users Over Time */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4" />
                  New Users (Monthly)
                </h3>
                <BarChartSVG
                  data={userGrowth}
                  maxVal={Math.max(...userGrowth.map(d => d.value), 1)}
                  color="hsl(45, 93%, 47%)"
                />
              </div>

              {/* Category Distribution Donut */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4" />
                  Category Distribution
                </h3>
                <DonutChartSVG segments={categoryDistribution} />
              </div>
            </div>

            {/* Growth summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Published Content</div>
                <div className="text-2xl font-bold text-foreground">
                  {allContent.filter(c => c.is_published).length}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Categories Used</div>
                <div className="text-2xl font-bold text-foreground">{categoryDistribution.length}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Total Page Views</div>
                <div className="text-2xl font-bold text-foreground">{pageViewDates.length.toLocaleString()}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Total Users</div>
                <div className="text-2xl font-bold text-foreground">{profiles.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
