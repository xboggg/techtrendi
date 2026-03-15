import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Eye,
  Users,
  Clock,
  FileText,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  TrendingUp,
  BarChart3,
  Newspaper,
  Loader2,
  Download,
  MapPin,
  Activity,
  Timer,
  UserPlus,
  UserCheck,
  Zap,
  Link2,
  Search,
  MousePointerClick,
  AlertTriangle,
  Image,
  Calendar,
  PenSquare,
  BookOpen,
  Mail,
  Target,
  AlertCircle,
} from "lucide-react";

interface PageView {
  id: string;
  page_path: string;
  page_title: string | null;
  referrer: string | null;
  session_id: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  created_at: string;
  country: string | null;
  city: string | null;
  is_bounce: boolean | null;
  session_duration: number | null;
  exit_page: string | null;
  entry_page: string | null;
  is_new_visitor: boolean | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  time_on_page: number | null;
}

type TimeRange = "today" | "7d" | "30d" | "90d" | "all";
type Tab = "overview" | "conversions" | "content" | "audience" | "acquisition" | "performance" | "engagement" | "growth";

interface ArticleRecord {
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

interface NewsRecord {
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

interface ReviewCommentRecord {
  id: string;
  review_id: string;
  created_at: string;
}

interface CommentRecord {
  id: string;
  article_id: string;
  created_at: string;
}

interface ProfileRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  created_at: string;
}

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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
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
              <rect x={x} y={height - barH} width={barWidth} height={Math.max(barH, 1)} rx={3} fill={color} opacity={0.85} />
              {d.value > 0 && (
                <text x={x + barWidth / 2} y={height - barH - 4} textAnchor="middle" className="fill-foreground" fontSize={9}>{d.value}</text>
              )}
              <text x={x + barWidth / 2} y={height + 14} textAnchor="middle" className="fill-muted-foreground" fontSize={8}>{d.label}</text>
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
            <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={seg.color} strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} strokeLinecap="round" />
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

// SVG Line/Area Chart component
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
        {data.map((d, i) => {
          const step = Math.max(1, Math.floor(data.length / 8));
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={points[i].x} y={height - 2} textAnchor="middle" className="fill-muted-foreground" fontSize={8}>{d.label}</text>
          );
        })}
      </svg>
    </div>
  );
}

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const dateFilter = getDateFilter(timeRange);

  const { data: pageViews = [], isLoading: pvLoading } = useQuery({
    queryKey: ["analytics-pageviews", timeRange],
    queryFn: async () => {
      let query = supabase
        .from("page_views")
        .select("*")
        .order("created_at", { ascending: false });
      if (dateFilter) query = query.gte("created_at", dateFilter);
      const { data, error } = await query.limit(10000);
      if (error) throw error;
      return data as PageView[];
    },
    refetchInterval: 30000,
  });

  const { data: prevPageViews = [] } = useQuery({
    queryKey: ["analytics-pageviews-prev", timeRange],
    queryFn: async () => {
      if (timeRange === "all") return [];
      const daysMap = { today: 1, "7d": 7, "30d": 30, "90d": 90 };
      const days = daysMap[timeRange];
      const start = daysAgo(days * 2);
      const end = daysAgo(days);
      const { data, error } = await supabase
        .from("page_views")
        .select("id")
        .gte("created_at", start)
        .lt("created_at", end);
      if (error) return [];
      return data;
    },
  });

  // Real-time visitors (last 5 minutes)
  const { data: realtimeCount = 0 } = useQuery({
    queryKey: ["analytics-realtime"],
    queryFn: async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("page_views")
        .select("session_id")
        .gte("created_at", fiveMinAgo);
      if (error) return 0;
      return new Set(data.map((d: { session_id: string }) => d.session_id).filter(Boolean)).size;
    },
    refetchInterval: 30000,
  });

  const { data: contentCounts } = useQuery({
    queryKey: ["analytics-content-counts"],
    queryFn: async () => {
      const [news, articles, reviews, comments] = await Promise.all([
        supabase.from("news").select("id", { count: "exact" }),
        supabase.from("articles").select("id", { count: "exact" }),
        supabase.from("reviews").select("id", { count: "exact" }),
        supabase.from("review_comments").select("id", { count: "exact" }),
      ]);
      return {
        news: news.count || 0,
        articles: articles.count || 0,
        reviews: reviews.count || 0,
        comments: comments.count || 0,
      };
    },
  });

  // Fetch news with categories for category performance
  const { data: newsArticles = [] } = useQuery({
    queryKey: ["analytics-news-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, category, slug, views, created_at");
      if (error) return [];
      return data;
    },
  });

  const { data: userCount = 0 } = useQuery({
    queryKey: ["analytics-user-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact" });
      if (error) return 0;
      return count || 0;
    },
  });

  // --- Content & Growth data queries ---
  const { data: allArticles = [] } = useQuery({
    queryKey: ["analytics-all-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, content, category, cover_image, is_published, read_time_minutes, views, created_at, updated_at, content_type");
      if (error) return [];
      return (data || []) as ArticleRecord[];
    },
  });

  const { data: allNews = [] } = useQuery({
    queryKey: ["analytics-all-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, category, slug, views, created_at, cover_image, excerpt, content, is_published");
      if (error) return [];
      return (data || []) as NewsRecord[];
    },
  });

  const { data: reviewComments = [] } = useQuery({
    queryKey: ["analytics-review-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_comments")
        .select("id, review_id, created_at");
      if (error) return [];
      return (data || []) as ReviewCommentRecord[];
    },
  });

  const { data: articleComments = [] } = useQuery({
    queryKey: ["analytics-article-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, article_id, created_at");
      if (error) return [];
      return (data || []) as CommentRecord[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["analytics-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data || []) as ProfileRecord[];
    },
  });

  // Contact form submissions (conversions)
  const { data: contactSubmissions = [] } = useQuery({
    queryKey: ["analytics-contact-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("id, name, email, subject, category, created_at")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data || []) as ContactSubmission[];
    },
  });

  const { data: pageViewDates = [] } = useQuery({
    queryKey: ["analytics-pageview-dates", timeRange],
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

  // Computed stats
  const stats = useMemo(() => {
    const totalViews = pageViews.length;
    const uniqueSessions = new Set(pageViews.map((pv) => pv.session_id).filter(Boolean)).size;
    const prevViews = prevPageViews.length;
    const viewsChange = prevViews > 0 ? ((totalViews - prevViews) / prevViews) * 100 : 0;

    // Bounce rate
    const sessionsWithBounce = pageViews.filter((pv) => pv.is_bounce === true);
    const bounceRate = uniqueSessions > 0 ? Math.round((sessionsWithBounce.length / totalViews) * 100) : 0;

    // Avg session duration
    const durations = pageViews
      .filter((pv) => pv.session_duration && pv.session_duration > 0)
      .map((pv) => pv.session_duration!);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    // Avg time on page
    const times = pageViews
      .filter((pv) => pv.time_on_page && pv.time_on_page > 0)
      .map((pv) => pv.time_on_page!);
    const avgTimeOnPage = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;

    // New vs returning
    const newVisitors = new Set(
      pageViews.filter((pv) => pv.is_new_visitor === true).map((pv) => pv.session_id)
    ).size;
    const returningVisitors = uniqueSessions - newVisitors;

    // Pages per session
    const pagesPerSession = uniqueSessions > 0 ? (totalViews / uniqueSessions).toFixed(1) : "0";

    return {
      totalViews, uniqueSessions, viewsChange, bounceRate,
      avgDuration, avgTimeOnPage, newVisitors, returningVisitors, pagesPerSession,
    };
  }, [pageViews, prevPageViews]);

  // Top pages
  const topPages = useMemo(() => {
    const counts: Record<string, { path: string; title: string; views: number; avgTime: number; timeCount: number }> = {};
    pageViews.forEach((pv) => {
      if (!counts[pv.page_path]) counts[pv.page_path] = { path: pv.page_path, title: pv.page_title || pv.page_path, views: 0, avgTime: 0, timeCount: 0 };
      counts[pv.page_path].views++;
      if (pv.time_on_page && pv.time_on_page > 0) {
        counts[pv.page_path].avgTime += pv.time_on_page;
        counts[pv.page_path].timeCount++;
      }
    });
    return Object.values(counts)
      .map((p) => ({ ...p, avgTime: p.timeCount > 0 ? Math.round(p.avgTime / p.timeCount) : 0 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);
  }, [pageViews]);

  // Device breakdown
  const devices = useMemo(() => {
    const counts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    pageViews.forEach((pv) => {
      const d = (pv.device_type || "desktop").toLowerCase();
      counts[d] = (counts[d] || 0) + 1;
    });
    const total = Math.max(pageViews.length, 1);
    return {
      desktop: { count: counts.desktop, pct: Math.round((counts.desktop / total) * 100) },
      mobile: { count: counts.mobile, pct: Math.round((counts.mobile / total) * 100) },
      tablet: { count: counts.tablet, pct: Math.round((counts.tablet / total) * 100) },
    };
  }, [pageViews]);

  // Browser breakdown
  const browsers = useMemo(() => {
    const counts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      const b = pv.browser || "Unknown";
      counts[b] = (counts[b] || 0) + 1;
    });
    const total = Math.max(pageViews.length, 1);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [pageViews]);

  // OS breakdown
  const osList = useMemo(() => {
    const counts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      const o = pv.os || "Unknown";
      counts[o] = (counts[o] || 0) + 1;
    });
    const total = Math.max(pageViews.length, 1);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [pageViews]);

  // Referrer breakdown
  const referrers = useMemo(() => {
    const counts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      let ref = "Direct";
      if (pv.referrer) {
        try {
          ref = new URL(pv.referrer).hostname || "Direct";
        } catch {
          ref = pv.referrer.slice(0, 30) || "Direct";
        }
      }
      counts[ref] = (counts[ref] || 0) + 1;
    });
    const total = Math.max(pageViews.length, 1);
    return Object.entries(counts)
      .map(([source, count]) => ({ source, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [pageViews]);

  // Geographic breakdown
  const geoData = useMemo(() => {
    const countries: Record<string, number> = {};
    const cities: Record<string, number> = {};
    pageViews.forEach((pv) => {
      if (pv.country) countries[pv.country] = (countries[pv.country] || 0) + 1;
      if (pv.city) cities[pv.city] = (cities[pv.city] || 0) + 1;
    });
    const total = Math.max(pageViews.length, 1);
    return {
      countries: Object.entries(countries)
        .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      cities: Object.entries(cities)
        .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }, [pageViews]);

  // Daily views chart
  const dailyViews = useMemo(() => {
    const days = timeRange === "today" ? 1 : timeRange === "7d" ? 7 : timeRange === "30d" ? 14 : 30;
    const result: { label: string; value: number; date: string }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const count = pageViews.filter((pv) => pv.created_at.slice(0, 10) === key).length;
      result.push({ label, value: count, date: key });
    }
    return result;
  }, [pageViews, timeRange]);

  // Peak hours heatmap (24h x 7 days)
  const peakHours = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    pageViews.forEach((pv) => {
      const d = new Date(pv.created_at);
      const day = d.getDay(); // 0=Sun
      const hour = d.getHours();
      grid[day][hour]++;
    });
    const max = Math.max(...grid.flat(), 1);
    return { grid, max };
  }, [pageViews]);

  // Category performance
  const categoryPerformance = useMemo(() => {
    const catCounts: Record<string, { articles: number; views: number }> = {};
    newsArticles.forEach((article: { category: string; views: number; slug: string }) => {
      const cat = article.category || "Uncategorized";
      if (!catCounts[cat]) catCounts[cat] = { articles: 0, views: 0 };
      catCounts[cat].articles++;
      // Count page views for this article
      const articleViews = pageViews.filter(
        (pv) => pv.page_path === `/news/${article.slug}`
      ).length;
      catCounts[cat].views += articleViews + (article.views || 0);
    });
    return Object.entries(catCounts)
      .map(([name, data]) => ({ name, ...data, avgViews: data.articles > 0 ? Math.round(data.views / data.articles) : 0 }))
      .sort((a, b) => b.views - a.views);
  }, [newsArticles, pageViews]);

  // Trending articles (most views in last 7 days from page_views)
  const trendingArticles = useMemo(() => {
    const sevenDaysAgo = daysAgo(7);
    const recentViews = pageViews.filter(
      (pv) => pv.created_at >= sevenDaysAgo && pv.page_path.startsWith("/news/")
    );
    const counts: Record<string, { path: string; title: string; views: number }> = {};
    recentViews.forEach((pv) => {
      if (!counts[pv.page_path]) {
        counts[pv.page_path] = { path: pv.page_path, title: pv.page_title || pv.page_path, views: 0 };
      }
      counts[pv.page_path].views++;
    });
    return Object.values(counts).sort((a, b) => b.views - a.views).slice(0, 10);
  }, [pageViews]);

  // UTM campaigns
  const utmCampaigns = useMemo(() => {
    const counts: Record<string, { source: string; medium: string; campaign: string; views: number }> = {};
    pageViews.forEach((pv) => {
      if (pv.utm_source || pv.utm_campaign) {
        const key = `${pv.utm_source || "none"}|${pv.utm_medium || "none"}|${pv.utm_campaign || "none"}`;
        if (!counts[key]) {
          counts[key] = {
            source: pv.utm_source || "-",
            medium: pv.utm_medium || "-",
            campaign: pv.utm_campaign || "-",
            views: 0,
          };
        }
        counts[key].views++;
      }
    });
    return Object.values(counts).sort((a, b) => b.views - a.views).slice(0, 10);
  }, [pageViews]);

  // Entry pages
  const entryPages = useMemo(() => {
    const counts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      if (pv.entry_page) {
        counts[pv.entry_page] = (counts[pv.entry_page] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [pageViews]);

  // Exit pages
  const exitPages = useMemo(() => {
    const counts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      if (pv.exit_page) {
        counts[pv.exit_page] = (counts[pv.exit_page] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [pageViews]);

  const maxDailyView = Math.max(...dailyViews.map((d) => d.value), 1);

  // Export CSV
  const exportCSV = useCallback(() => {
    const headers = ["Date", "Page", "Title", "Session", "Device", "Browser", "OS", "Country", "City", "Referrer", "UTM Source", "UTM Medium", "UTM Campaign", "Bounce", "Time on Page"];
    const rows = pageViews.map((pv) => [
      pv.created_at,
      pv.page_path,
      pv.page_title || "",
      pv.session_id || "",
      pv.device_type || "",
      pv.browser || "",
      pv.os || "",
      pv.country || "",
      pv.city || "",
      pv.referrer || "",
      pv.utm_source || "",
      pv.utm_medium || "",
      pv.utm_campaign || "",
      pv.is_bounce ? "Yes" : "No",
      pv.time_on_page?.toString() || "0",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `techtrendi-analytics-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [pageViews, timeRange]);

  // --- Content & Growth computations ---
  const allContent = useMemo(() => {
    return [
      ...allArticles.map(a => ({
        id: a.id, title: a.title, type: (a.content_type || "article") as string,
        category: a.category, views: a.views || 0, created_at: a.created_at,
        updated_at: a.updated_at, is_published: a.is_published, cover_image: a.cover_image,
        excerpt: a.excerpt, content: a.content, read_time_minutes: a.read_time_minutes,
      })),
      ...allNews.map(n => ({
        id: n.id, title: n.title, type: "news" as string,
        category: n.category, views: n.views || 0, created_at: n.created_at,
        updated_at: n.created_at, is_published: n.is_published !== false, cover_image: n.cover_image,
        excerpt: n.excerpt, content: n.content || "", read_time_minutes: null as number | null,
      })),
    ];
  }, [allArticles, allNews]);

  const publishFrequency = useMemo(() => {
    const weeks: Record<string, number> = {};
    allContent.filter(c => c.is_published).forEach(c => {
      const d = new Date(c.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    });
    return Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([k, v]) => ({ label: k.slice(5), value: v }));
  }, [allContent]);

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
      if (bucket) { bucket.views += c.views; bucket.count++; }
    });
    return buckets;
  }, [allContent]);

  const typePerformance = useMemo(() => {
    const types: Record<string, { views: number; count: number }> = {};
    allContent.filter(c => c.is_published).forEach(c => {
      if (!types[c.type]) types[c.type] = { views: 0, count: 0 };
      types[c.type].views += c.views;
      types[c.type].count++;
    });
    return Object.entries(types).map(([type, data]) => ({
      type, totalViews: data.views, count: data.count,
      avgViews: data.count > 0 ? Math.round(data.views / data.count) : 0,
    })).sort((a, b) => b.totalViews - a.totalViews);
  }, [allContent]);

  const readTimeByCategory = useMemo(() => {
    const cats: Record<string, { total: number; count: number }> = {};
    allArticles.filter(a => a.is_published && a.read_time_minutes).forEach(a => {
      if (!cats[a.category]) cats[a.category] = { total: 0, count: 0 };
      cats[a.category].total += a.read_time_minutes!;
      cats[a.category].count++;
    });
    return Object.entries(cats).map(([cat, data]) => ({ label: cat, value: Math.round(data.total / data.count) })).sort((a, b) => b.value - a.value);
  }, [allArticles]);

  const topArticlesByViews = useMemo(() => {
    return [...allContent].filter(c => c.is_published).sort((a, b) => b.views - a.views).slice(0, 15);
  }, [allContent]);

  const draftCount = useMemo(() => allContent.filter(c => !c.is_published).length, [allContent]);
  const recentlyUpdated = useMemo(() => {
    const sevenDaysAgo = daysAgo(7);
    return allArticles.filter(a => a.updated_at > sevenDaysAgo && a.updated_at !== a.created_at).length;
  }, [allArticles]);

  // Engagement computations
  const mostCommented = useMemo(() => {
    const counts: Record<string, { id: string; count: number }> = {};
    articleComments.forEach(c => {
      if (!counts[c.article_id]) counts[c.article_id] = { id: c.article_id, count: 0 };
      counts[c.article_id].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10).map(item => {
      const article = allContent.find(a => a.id === item.id);
      return { title: article?.title || "Unknown", comments: item.count, views: article?.views || 0 };
    });
  }, [articleComments, allContent]);

  const commentsOverTime = useMemo(() => {
    const allCommentDates = [...articleComments.map(c => c.created_at), ...reviewComments.map(c => c.created_at)].sort();
    const months: Record<string, number> = {};
    allCommentDates.forEach(d => { const key = d.slice(0, 7); months[key] = (months[key] || 0) + 1; });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([k, v]) => ({ label: k.slice(2), value: v }));
  }, [articleComments, reviewComments]);

  const engagementScore = useMemo(() => {
    const totalViews = allContent.reduce((s, c) => s + c.views, 0);
    const userCt = profiles.length || 1;
    return (totalViews / userCt).toFixed(1);
  }, [allContent, profiles]);

  // Growth computations
  const cumulativeContent = useMemo(() => {
    const sorted = [...allContent].filter(c => c.is_published).sort((a, b) => a.created_at.localeCompare(b.created_at));
    const months: Record<string, number> = {};
    let cumulative = 0;
    sorted.forEach(c => { const key = c.created_at.slice(0, 7); cumulative++; months[key] = cumulative; });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ label: k.slice(2), value: v }));
  }, [allContent]);

  const viewsGrowth = useMemo(() => {
    const weeks: Record<string, number> = {};
    pageViewDates.forEach(pv => {
      const d = new Date(pv.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    });
    return Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ label: k.slice(5), value: v }));
  }, [pageViewDates]);

  const userGrowth = useMemo(() => {
    const months: Record<string, number> = {};
    profiles.forEach(p => { const key = p.created_at.slice(0, 7); months[key] = (months[key] || 0) + 1; });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => ({ label: k.slice(2), value: v }));
  }, [profiles]);

  const categoryDistribution = useMemo(() => {
    const cats: Record<string, number> = {};
    allContent.filter(c => c.is_published).forEach(c => { cats[c.category] = (cats[c.category] || 0) + 1; });
    const colors = ["hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(346, 87%, 50%)", "hsl(45, 93%, 47%)", "hsl(280, 67%, 55%)", "hsl(200, 95%, 50%)", "hsl(24, 95%, 53%)", "hsl(162, 73%, 46%)", "hsl(330, 80%, 60%)", "hsl(60, 80%, 50%)", "hsl(240, 60%, 60%)", "hsl(120, 50%, 40%)"];
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([cat, count], i) => ({ label: cat, value: count, color: colors[i % colors.length] }));
  }, [allContent]);

  const seoMetrics = useMemo(() => {
    const published = allContent.filter(c => c.is_published);
    return {
      noCover: published.filter(c => !c.cover_image),
      shortContent: published.filter(c => (c.content?.length || 0) < 500),
      noExcerpt: published.filter(c => !c.excerpt || c.excerpt.trim().length === 0),
      unpublished: allContent.filter(c => !c.is_published),
    };
  }, [allContent]);

  // 404 Error tracking (pages starting with /404 or not found paths)
  const errorPages = useMemo(() => {
    const counts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      // Track pages that might be 404s (common patterns)
      if (pv.page_path.includes("404") || pv.page_title?.toLowerCase().includes("not found")) {
        counts[pv.page_path] = (counts[pv.page_path] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [pageViews]);

  // Conversion stats
  const conversionStats = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const signupsThisMonth = profiles.filter(p => new Date(p.created_at).getTime() > thirtyDaysAgo).length;
    const signupsThisWeek = profiles.filter(p => new Date(p.created_at).getTime() > sevenDaysAgo).length;
    const contactsThisMonth = contactSubmissions.filter(c => new Date(c.created_at).getTime() > thirtyDaysAgo).length;
    const contactsThisWeek = contactSubmissions.filter(c => new Date(c.created_at).getTime() > sevenDaysAgo).length;

    // Conversion rate = signups / unique sessions
    const conversionRate = stats.uniqueSessions > 0 ? ((signupsThisMonth / stats.uniqueSessions) * 100).toFixed(2) : "0";

    // Contact submissions by category
    const byCategory: Record<string, number> = {};
    contactSubmissions.forEach(c => {
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });

    return {
      totalSignups: profiles.length,
      signupsThisMonth,
      signupsThisWeek,
      totalContacts: contactSubmissions.length,
      contactsThisMonth,
      contactsThisWeek,
      conversionRate,
      contactsByCategory: Object.entries(byCategory)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
    };
  }, [profiles, contactSubmissions, stats.uniqueSessions]);

  // Signup trend over time
  const signupTrend = useMemo(() => {
    const months: Record<string, number> = {};
    profiles.forEach(p => {
      const key = p.created_at.slice(0, 7);
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([k, v]) => ({ label: k.slice(2), value: v }));
  }, [profiles]);

  // Contact submissions trend
  const contactTrend = useMemo(() => {
    const months: Record<string, number> = {};
    contactSubmissions.forEach(c => {
      const key = c.created_at.slice(0, 7);
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([k, v]) => ({ label: k.slice(2), value: v }));
  }, [contactSubmissions]);

  if (pvLoading) {
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
              <BarChart3 className="w-7 h-7" />
              Analytics
            </h1>
            <p className="text-muted-foreground">Advanced site performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Real-time indicator */}
            <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-lg text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              {realtimeCount} live
            </div>
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
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "conversions", label: "Conversions", icon: UserPlus },
            { id: "content", label: "Content", icon: Newspaper },
            { id: "performance", label: "Performance", icon: TrendingUp },
            { id: "engagement", label: "Engagement", icon: MessageSquare },
            { id: "growth", label: "Growth", icon: Activity },
            { id: "audience", label: "Audience", icon: Users },
            { id: "acquisition", label: "Acquisition", icon: Link2 },
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

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard icon={Eye} label="Page Views" value={stats.totalViews.toLocaleString()} change={stats.viewsChange} />
          <StatCard icon={Users} label="Sessions" value={stats.uniqueSessions.toLocaleString()} change={null} />
          <StatCard icon={Activity} label="Bounce Rate" value={`${stats.bounceRate}%`} change={null} bad />
          <StatCard icon={Timer} label="Avg Duration" value={formatDuration(stats.avgDuration)} change={null} />
          <StatCard icon={Clock} label="Avg Time/Page" value={formatDuration(stats.avgTimeOnPage)} change={null} />
          <StatCard icon={FileText} label="Pages/Session" value={stats.pagesPerSession} change={null} />
          <StatCard icon={UserPlus} label="New Visitors" value={stats.newVisitors.toLocaleString()} change={null} />
          <StatCard icon={UserCheck} label="Returning" value={stats.returningVisitors.toLocaleString()} change={null} />
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Views Chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Page Views Over Time
                  </h3>
                  <Badge variant="secondary">{timeRange === "today" ? "Today" : timeRange === "all" ? "All time" : `Last ${timeRange}`}</Badge>
                </div>
                {dailyViews.length > 0 ? (
                  <div className="flex items-end justify-between h-44 gap-1">
                    {dailyViews.map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <div className="text-[10px] text-muted-foreground mb-1">
                          {item.value > 0 ? item.value : ""}
                        </div>
                        <div
                          className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors min-h-[2px]"
                          style={{ height: `${Math.max((item.value / maxDailyView) * 100, 2)}%` }}
                          title={`${item.label}: ${item.value}`}
                        />
                        <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                          {dailyViews.length <= 14 ? item.label : i % 3 === 0 ? item.label : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-44 flex items-center justify-center text-muted-foreground">No data for this period</div>
                )}
              </div>

              {/* Traffic Sources */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Traffic Sources
                </h3>
                <div className="space-y-3">
                  {referrers.length > 0 ? referrers.map((ref, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground truncate mr-2">{ref.source}</span>
                        <span className="text-muted-foreground whitespace-nowrap">{ref.count} ({ref.pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500" style={{ width: `${ref.pct}%` }} />
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No referrer data yet</p>}
                </div>
              </div>
            </div>

            {/* Peak Hours Heatmap */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Peak Hours Heatmap
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left py-1 px-1 text-muted-foreground font-medium w-16">Day</th>
                      {Array.from({ length: 24 }, (_, h) => (
                        <th key={h} className="text-center py-1 px-0.5 text-muted-foreground font-medium">
                          {h.toString().padStart(2, "0")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, dayIdx) => (
                      <tr key={day}>
                        <td className="py-1 px-1 text-muted-foreground font-medium">{day}</td>
                        {peakHours.grid[dayIdx].map((count, hour) => {
                          const intensity = count / peakHours.max;
                          return (
                            <td key={hour} className="py-1 px-0.5">
                              <div
                                className="w-full aspect-square rounded-sm transition-colors"
                                style={{
                                  backgroundColor: count === 0
                                    ? "hsl(var(--muted))"
                                    : `hsl(217, 91%, ${70 - intensity * 45}%)`,
                                  minWidth: "12px",
                                  minHeight: "12px",
                                }}
                                title={`${day} ${hour}:00 — ${count} views`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                  <div
                    key={v}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: v === 0 ? "hsl(var(--muted))" : `hsl(217, 91%, ${70 - v * 45}%)` }}
                  />
                ))}
                <span>More</span>
              </div>
            </div>

            {/* Second Row: Devices, Browsers, OS */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Device Breakdown</h3>
                <div className="space-y-4">
                  <DeviceBar icon={Monitor} label="Desktop" count={devices.desktop.count} pct={devices.desktop.pct} color="bg-blue-500" />
                  <DeviceBar icon={Smartphone} label="Mobile" count={devices.mobile.count} pct={devices.mobile.pct} color="bg-green-500" />
                  <DeviceBar icon={Tablet} label="Tablet" count={devices.tablet.count} pct={devices.tablet.pct} color="bg-yellow-500" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Browsers</h3>
                <div className="space-y-3">
                  {browsers.map((b, i) => (
                    <BarRow key={i} label={b.name} count={b.count} pct={b.pct} color="bg-purple-500" />
                  ))}
                  {browsers.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Operating Systems</h3>
                <div className="space-y-3">
                  {osList.map((o, i) => (
                    <BarRow key={i} label={o.name} count={o.count} pct={o.pct} color="bg-orange-500" />
                  ))}
                  {osList.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                </div>
              </div>
            </div>

            {/* Top Pages */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">Top Pages</h3>
              {topPages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">#</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Page</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Views</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Time</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPages.map((page, i) => (
                        <tr key={page.path} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <span className="w-6 h-6 rounded-full bg-muted inline-flex items-center justify-center text-xs font-medium">{i + 1}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium text-foreground">{page.path}</div>
                            {page.title !== page.path && (
                              <div className="text-xs text-muted-foreground truncate max-w-xs">{page.title}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-foreground">{page.views.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-sm text-muted-foreground">{page.avgTime > 0 ? formatDuration(page.avgTime) : "-"}</td>
                          <td className="py-3 px-4 text-right text-sm text-muted-foreground">{Math.round((page.views / Math.max(stats.totalViews, 1)) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No page view data yet.</p>
              )}
            </div>

            {/* Content Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Newspaper} label="News Articles" value={(contentCounts?.news || 0).toLocaleString()} change={null} />
              <StatCard icon={FileText} label="Reviews" value={(contentCounts?.reviews || 0).toLocaleString()} change={null} />
              <StatCard icon={Users} label="Total Users" value={userCount.toLocaleString()} change={null} />
              <StatCard icon={MessageSquare} label="Comments" value={(contentCounts?.comments || 0).toLocaleString()} change={null} />
            </div>
          </>
        )}

        {/* Conversions Tab */}
        {activeTab === "conversions" && (
          <>
            {/* Conversion Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <StatCard icon={UserPlus} label="Total Signups" value={conversionStats.totalSignups.toLocaleString()} change={null} />
              <StatCard icon={UserPlus} label="Signups (30d)" value={conversionStats.signupsThisMonth.toLocaleString()} change={null} />
              <StatCard icon={UserPlus} label="Signups (7d)" value={conversionStats.signupsThisWeek.toLocaleString()} change={null} />
              <StatCard icon={Mail} label="Total Contacts" value={conversionStats.totalContacts.toLocaleString()} change={null} />
              <StatCard icon={Mail} label="Contacts (30d)" value={conversionStats.contactsThisMonth.toLocaleString()} change={null} />
              <StatCard icon={Target} label="Conversion Rate" value={`${conversionStats.conversionRate}%`} change={null} />
            </div>

            {/* Signup Trend */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  User Signups Over Time
                </h3>
                {signupTrend.length > 0 ? (
                  <BarChartSVG data={signupTrend} maxVal={Math.max(...signupTrend.map(d => d.value), 1)} color="hsl(142, 76%, 36%)" />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No signup data yet</p>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Form Submissions Over Time
                </h3>
                {contactTrend.length > 0 ? (
                  <BarChartSVG data={contactTrend} maxVal={Math.max(...contactTrend.map(d => d.value), 1)} color="hsl(280, 67%, 55%)" />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No contact submissions yet</p>
                )}
              </div>
            </div>

            {/* Contact Submissions by Category */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Submissions by Category
              </h3>
              {conversionStats.contactsByCategory.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {conversionStats.contactsByCategory.map((item, i) => (
                      <BarRow key={i} label={item.category} count={item.count} pct={Math.round((item.count / Math.max(conversionStats.totalContacts, 1)) * 100)} color="bg-purple-500" />
                    ))}
                  </div>
                  <div>
                    <DonutChartSVG segments={conversionStats.contactsByCategory.map((item, i) => ({
                      label: item.category,
                      value: item.count,
                      color: ["hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(280, 67%, 55%)", "hsl(45, 93%, 47%)", "hsl(346, 87%, 50%)"][i % 5],
                    }))} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No contact submissions yet</p>
              )}
            </div>

            {/* Recent Signups */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Recent Signups (Last 10)
              </h3>
              {profiles.length > 0 ? (
                <div className="space-y-2">
                  {profiles.slice(0, 10).map((profile, i) => (
                    <div key={profile.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground font-medium">
                            {profile.full_name || "Anonymous User"}
                          </span>
                          {profile.email && (
                            <span className="text-xs text-muted-foreground">{profile.email}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No users yet</p>
              )}
            </div>

            {/* 404 Errors */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                404 Error Pages
              </h3>
              {errorPages.length > 0 ? (
                <div className="space-y-2">
                  {errorPages.map((ep, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-foreground truncate mr-4">{ep.page}</span>
                      <span className="text-sm font-medium text-red-500">{ep.count} hits</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No 404 errors detected. Great!</p>
              )}
            </div>
          </>
        )}

        {/* Content Tab */}
        {activeTab === "content" && (
          <>
            {/* Category Performance */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Category Performance
              </h3>
              {categoryPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Articles</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total Views</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryPerformance.map((cat) => (
                        <tr key={cat.name} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <Badge variant="secondary">{cat.name}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right text-sm">{cat.articles}</td>
                          <td className="py-3 px-4 text-right text-sm font-medium">{cat.views.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-sm text-muted-foreground">{cat.avgViews.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No category data yet</p>
              )}
            </div>

            {/* Trending Articles */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending Articles (Last 7 Days)
              </h3>
              {trendingArticles.length > 0 ? (
                <div className="space-y-3">
                  {trendingArticles.map((article, i) => (
                    <div key={article.path} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{article.title}</div>
                        <div className="text-xs text-muted-foreground">{article.path}</div>
                      </div>
                      <div className="text-sm font-semibold text-foreground">{article.views} views</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No trending data yet</p>
              )}
            </div>

            {/* Entry & Exit Pages */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Top Entry Pages
                </h3>
                <div className="space-y-2">
                  {entryPages.length > 0 ? entryPages.map((ep, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5">
                      <span className="text-foreground truncate mr-2">{ep.page}</span>
                      <span className="text-muted-foreground whitespace-nowrap">{ep.count}</span>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No entry page data yet</p>}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4" />
                  Top Exit Pages
                </h3>
                <div className="space-y-2">
                  {exitPages.length > 0 ? exitPages.map((ep, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5">
                      <span className="text-foreground truncate mr-2">{ep.page}</span>
                      <span className="text-muted-foreground whitespace-nowrap">{ep.count}</span>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No exit page data yet</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Audience Tab */}
        {activeTab === "audience" && (
          <>
            {/* New vs Returning */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  New vs Returning Visitors
                </h3>
                <div className="flex items-center gap-8">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                      <circle
                        cx="50" cy="50" r="40" fill="none" stroke="hsl(217, 91%, 60%)" strokeWidth="12"
                        strokeDasharray={`${(stats.newVisitors / Math.max(stats.uniqueSessions, 1)) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{stats.uniqueSessions}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm">New: {stats.newVisitors} ({stats.uniqueSessions > 0 ? Math.round((stats.newVisitors / stats.uniqueSessions) * 100) : 0}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                      <span className="text-sm">Returning: {stats.returningVisitors} ({stats.uniqueSessions > 0 ? Math.round((stats.returningVisitors / stats.uniqueSessions) * 100) : 0}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Breakdown */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Device Breakdown</h3>
                <div className="space-y-4">
                  <DeviceBar icon={Monitor} label="Desktop" count={devices.desktop.count} pct={devices.desktop.pct} color="bg-blue-500" />
                  <DeviceBar icon={Smartphone} label="Mobile" count={devices.mobile.count} pct={devices.mobile.pct} color="bg-green-500" />
                  <DeviceBar icon={Tablet} label="Tablet" count={devices.tablet.count} pct={devices.tablet.pct} color="bg-yellow-500" />
                </div>
              </div>
            </div>

            {/* Geo: Countries & Cities */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Top Countries
                </h3>
                <div className="space-y-3">
                  {geoData.countries.length > 0 ? geoData.countries.map((c, i) => (
                    <BarRow key={i} label={c.name} count={c.count} pct={c.pct} color="bg-blue-500" />
                  )) : <p className="text-sm text-muted-foreground">No geo data yet. Data will appear as visitors browse.</p>}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Top Cities
                </h3>
                <div className="space-y-3">
                  {geoData.cities.length > 0 ? geoData.cities.map((c, i) => (
                    <BarRow key={i} label={c.name} count={c.count} pct={c.pct} color="bg-emerald-500" />
                  )) : <p className="text-sm text-muted-foreground">No geo data yet.</p>}
                </div>
              </div>
            </div>

            {/* Browsers & OS */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Browsers</h3>
                <div className="space-y-3">
                  {browsers.map((b, i) => (
                    <BarRow key={i} label={b.name} count={b.count} pct={b.pct} color="bg-purple-500" />
                  ))}
                  {browsers.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Operating Systems</h3>
                <div className="space-y-3">
                  {osList.map((o, i) => (
                    <BarRow key={i} label={o.name} count={o.count} pct={o.pct} color="bg-orange-500" />
                  ))}
                  {osList.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Acquisition Tab */}
        {activeTab === "acquisition" && (
          <>
            {/* Traffic Sources (detailed) */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Traffic Sources
              </h3>
              <div className="space-y-3">
                {referrers.map((ref, i) => (
                  <BarRow key={i} label={ref.source} count={ref.count} pct={ref.pct} color="bg-primary" />
                ))}
                {referrers.length === 0 && <p className="text-sm text-muted-foreground">No referrer data yet</p>}
              </div>
            </div>

            {/* UTM Campaigns */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" />
                Campaign Tracking (UTM)
              </h3>
              {utmCampaigns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Source</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Medium</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Campaign</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utmCampaigns.map((c, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm">{c.source}</td>
                          <td className="py-3 px-4 text-sm">{c.medium}</td>
                          <td className="py-3 px-4 text-sm">{c.campaign}</td>
                          <td className="py-3 px-4 text-right text-sm font-medium">{c.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-2">No UTM campaign data yet.</p>
                  <p className="text-xs text-muted-foreground">
                    Add <code className="bg-muted px-1.5 py-0.5 rounded">?utm_source=X&utm_medium=Y&utm_campaign=Z</code> to your URLs to track campaigns.
                  </p>
                </div>
              )}
            </div>

            {/* Entry Pages */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Landing Pages
                </h3>
                <div className="space-y-2">
                  {entryPages.length > 0 ? entryPages.map((ep, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                      <span className="text-foreground truncate mr-2">{ep.page}</span>
                      <span className="text-muted-foreground whitespace-nowrap font-medium">{ep.count} entries</span>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No entry page data yet</p>}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4" />
                  Exit Pages
                </h3>
                <div className="space-y-2">
                  {exitPages.length > 0 ? exitPages.map((ep, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                      <span className="text-foreground truncate mr-2">{ep.page}</span>
                      <span className="text-muted-foreground whitespace-nowrap font-medium">{ep.count} exits</span>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">No exit page data yet</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== PERFORMANCE TAB ===== */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Articles", value: allArticles.filter(a => a.content_type !== "guide").length, icon: FileText, color: "text-blue-500" },
                { label: "Total Guides", value: allArticles.filter(a => a.content_type === "guide").length, icon: BookOpen, color: "text-emerald-500" },
                { label: "Total News", value: allNews.length, icon: Newspaper, color: "text-orange-500" },
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

            {/* Quality Indicators */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Content Quality Indicators
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Image className="w-3 h-3" />Missing Cover Image</div>
                  <div className="text-xl font-bold text-foreground">{seoMetrics.noCover.length}</div>
                  {seoMetrics.noCover.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                      {seoMetrics.noCover.slice(0, 3).map((c, i) => <div key={i} className="text-xs text-muted-foreground truncate">{c.title}</div>)}
                      {seoMetrics.noCover.length > 3 && <div className="text-xs text-muted-foreground">+{seoMetrics.noCover.length - 3} more</div>}
                    </div>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><FileText className="w-3 h-3" />Short Content (&lt;500 chars)</div>
                  <div className="text-xl font-bold text-foreground">{seoMetrics.shortContent.length}</div>
                  {seoMetrics.shortContent.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                      {seoMetrics.shortContent.slice(0, 3).map((c, i) => <div key={i} className="text-xs text-muted-foreground truncate">{c.title}</div>)}
                      {seoMetrics.shortContent.length > 3 && <div className="text-xs text-muted-foreground">+{seoMetrics.shortContent.length - 3} more</div>}
                    </div>
                  )}
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><PenSquare className="w-3 h-3" />Unpublished / Drafts</div>
                  <div className="text-xl font-bold text-foreground">{seoMetrics.unpublished.length}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><FileText className="w-3 h-3" />Missing Excerpt</div>
                  <div className="text-xl font-bold text-foreground">{seoMetrics.noExcerpt.length}</div>
                </div>
              </div>
            </div>

            {/* Publish Frequency */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4" />
                Publish Frequency (Last 12 Weeks)
              </h3>
              <BarChartSVG data={publishFrequency} maxVal={Math.max(...publishFrequency.map(d => d.value), 1)} color="hsl(217, 91%, 60%)" />
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
                        <td className="py-2 px-3 text-right text-muted-foreground">{bucket.count > 0 ? Math.round(bucket.views / bucket.count).toLocaleString() : 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Content Type Performance + Read Time */}
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
                          <div className="h-full rounded-full transition-all" style={{ width: `${(tp.totalViews / maxViews) * 100}%`, backgroundColor: i === 0 ? "hsl(217, 91%, 60%)" : i === 1 ? "hsl(142, 76%, 36%)" : "hsl(45, 93%, 47%)" }} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">Avg: {tp.avgViews.toLocaleString()} views/item</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4" />
                  Avg Read Time by Category
                </h3>
                <BarChartSVG data={readTimeByCategory} maxVal={Math.max(...readTimeByCategory.map(d => d.value), 1)} color="hsl(142, 76%, 36%)" />
              </div>
            </div>

            {/* Top Content by Views */}
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
                        <td className="py-2 px-3"><Badge variant="outline" className="text-xs capitalize">{article.type}</Badge></td>
                        <td className="py-2 px-3 text-muted-foreground">{article.category}</td>
                        <td className="py-2 px-3 text-right font-medium text-foreground">{article.views.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Total Content Views</div>
                <div className="text-2xl font-bold text-foreground">{allContent.reduce((s, c) => s + c.views, 0).toLocaleString()}</div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MessageSquare className="w-3 h-3" />Total Comments</div>
                <div className="text-2xl font-bold text-foreground">{articleComments.length + reviewComments.length}</div>
                <div className="text-xs text-muted-foreground mt-1">{articleComments.length} article · {reviewComments.length} review</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Eye className="w-3 h-3" />Views per User</div>
                <div className="text-2xl font-bold text-foreground">{engagementScore}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Users className="w-3 h-3" />Registered Users</div>
                <div className="text-2xl font-bold text-foreground">{profiles.length}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><FileText className="w-3 h-3" />Avg Comments/Article</div>
                <div className="text-2xl font-bold text-foreground">
                  {allContent.filter(c => c.is_published).length > 0
                    ? (articleComments.length / allContent.filter(c => c.is_published).length).toFixed(1) : "0"}
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4" />
                Comments Over Time (Monthly)
              </h3>
              <BarChartSVG data={commentsOverTime} maxVal={Math.max(...commentsOverTime.map(d => d.value), 1)} color="hsl(280, 67%, 55%)" />
            </div>

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
                          <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${(item.comments / maxComments) * 100}%` }} />
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
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4" />
                Cumulative Content Growth
              </h3>
              <LineChartSVG data={cumulativeContent} color="hsl(217, 91%, 60%)" />
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4" />
                Weekly Views Trend
              </h3>
              <BarChartSVG data={viewsGrowth} maxVal={Math.max(...viewsGrowth.map(d => d.value), 1)} color="hsl(142, 76%, 36%)" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4" />
                  New Users (Monthly)
                </h3>
                <BarChartSVG data={userGrowth} maxVal={Math.max(...userGrowth.map(d => d.value), 1)} color="hsl(45, 93%, 47%)" />
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4" />
                  Category Distribution
                </h3>
                <DonutChartSVG segments={categoryDistribution} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">Published Content</div>
                <div className="text-2xl font-bold text-foreground">{allContent.filter(c => c.is_published).length}</div>
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

// --- Sub-components ---

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  bad,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change: number | null;
  bad?: boolean;
}) {
  const isPositive = change !== null && change >= 0;
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {change !== null && (
          <div className={cn("flex items-center gap-0.5 text-xs font-medium", isPositive ? "text-green-500" : "text-red-500")}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(Math.round(change))}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-foreground mb-0.5">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function DeviceBar({
  icon: Icon,
  label,
  count,
  pct,
  color,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">{label}</span>
        </div>
        <span className="text-muted-foreground">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BarRow({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground truncate mr-2">{label}</span>
        <span className="text-muted-foreground whitespace-nowrap">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
