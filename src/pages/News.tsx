import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useLoaderData } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/layout/PageHero";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Clock, Calendar, ArrowRight, Search, ChevronLeft, ChevronRight, Zap,
  LayoutGrid, Brain, Shield, Wifi, Globe, Bitcoin, Rocket, Landmark,
  Banknote, GraduationCap, TrendingUp, CalendarDays, Newspaper, MapPin
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import staticNews from "@/data/news.json";
import { SortSelect, TopicPicker, type TopicOption } from "@/components/blog/TopicPicker";

const SORT_OPTIONS = [["latest", "Latest"], ["oldest", "Oldest"]] as const;
// Month filter (owner, 27 Nov 2026) lives in the same box as Latest/Oldest so the phone layout
// stays two rows. Values: "latest", "oldest" or a month "2026-10" (newest first in that month).
function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

const NEWS_PER_PAGE = 12;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db2.techtrendi.com";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  created_at: string;
  content: string | null;
  author: string | null;
  /** News topic + country (27 Nov 2026), filled for every story by the database and topic_sweeper.py. */
  topic?: string | null;
  country?: string | null;
}

// News topics (owner, 27 Nov 2026). The site now publishes African tech news plus The Rundown
// (the daily world-tech digest), so the old 17 world topics (Gadgets, Gaming, Space ...) were
// mostly empty. These are the topics the live stories really fall into. A topic only shows in
// the picker when it has stories, so an empty one never appears.
const newsTopics: TopicOption[] = [
  { name: "All", icon: LayoutGrid, gradient: "from-blue-500 to-indigo-600", iconColor: "text-blue-500" },
  { name: "Money & Fintech", icon: Banknote, gradient: "from-green-500 to-emerald-600", iconColor: "text-green-500" },
  { name: "Government & Policy", icon: Landmark, gradient: "from-slate-500 to-zinc-700", iconColor: "text-slate-500" },
  { name: "AI", icon: Brain, gradient: "from-violet-500 to-purple-600", iconColor: "text-violet-500" },
  { name: "Telecoms & Internet", icon: Wifi, gradient: "from-sky-500 to-blue-600", iconColor: "text-sky-500" },
  { name: "Startups & Funding", icon: Rocket, gradient: "from-teal-500 to-cyan-600", iconColor: "text-teal-500" },
  { name: "Crypto", icon: Bitcoin, gradient: "from-amber-500 to-yellow-600", iconColor: "text-amber-500" },
  { name: "Energy & Mobility", icon: Zap, gradient: "from-lime-500 to-green-600", iconColor: "text-lime-600" },
  { name: "Cybersecurity & Scams", icon: Shield, gradient: "from-red-500 to-rose-600", iconColor: "text-red-500" },
  { name: "Skills & Education", icon: GraduationCap, gradient: "from-orange-500 to-amber-600", iconColor: "text-orange-500" },
  { name: "Economy & Business", icon: TrendingUp, gradient: "from-indigo-500 to-blue-600", iconColor: "text-indigo-500" },
  { name: "Africa Tech Weekly", icon: CalendarDays, gradient: "from-yellow-500 to-orange-600", iconColor: "text-yellow-600" },
  { name: "The Rundown", icon: Newspaper, gradient: "from-pink-500 to-fuchsia-600", iconColor: "text-pink-500" },
];

// Where the story is from. Two-letter codes are stored in news.country; AF = Africa-wide,
// WORLD = not about Africa (The Rundown). Smaller countries share "Other African countries".
const flag = (cc: string) => "/flags/" + cc + ".svg";
const newsCountries: (TopicOption & { codes?: string[] })[] = [
  { name: "All", icon: Globe, gradient: "from-blue-500 to-indigo-600", iconColor: "text-blue-500" },
  { name: "Ghana", image: flag("gh"), codes: ["GH"], gradient: "from-red-500 to-green-600", iconColor: "" },
  { name: "Nigeria", image: flag("ng"), codes: ["NG"], gradient: "from-green-600 to-emerald-700", iconColor: "" },
  { name: "Kenya", image: flag("ke"), codes: ["KE"], gradient: "from-red-600 to-green-700", iconColor: "" },
  { name: "South Africa", image: flag("za"), codes: ["ZA"], gradient: "from-green-600 to-yellow-500", iconColor: "" },
  { name: "Across Africa", icon: MapPin, codes: ["AF"], gradient: "from-yellow-500 to-orange-600", iconColor: "text-yellow-600" },
  { name: "Other African countries", icon: MapPin, gradient: "from-teal-500 to-cyan-600", iconColor: "text-teal-500" },
  { name: "World", icon: Globe, codes: ["WORLD"], gradient: "from-pink-500 to-fuchsia-600", iconColor: "text-pink-500" },
];

// Old links keep working: /news?category=Big Tech (old shares, Google) opens The Rundown, etc.
const OLD_CATEGORY_TO_TOPIC: Record<string, string> = {
  "Big Tech": "The Rundown", "AI Tech": "AI", "Cybersecurity": "Cybersecurity & Scams",
  "Security": "Cybersecurity & Scams", "Startups": "Startups & Funding", "Crypto": "Crypto",
};
// Stories without a topic (only the old backup list, news.json) get one from their old category.
function topicOf(item: NewsItem): string {
  return item.topic || OLD_CATEGORY_TO_TOPIC[item.category] || "";
}
function countryOf(item: NewsItem): string {
  const cc = (item.country || (item.category === "Big Tech" ? "WORLD" : "")).toUpperCase();
  if (!cc) return "";
  return newsCountries.find((c) => c.codes?.includes(cc))?.name ?? "Other African countries";
}

function startTopic(param: string | null): string {
  if (!param) return "All";
  if (newsTopics.some((t) => t.name === param)) return param;
  return OLD_CATEGORY_TO_TOPIC[param] ?? "All";
}

// Fallback images by category
const categoryImages: Record<string, string> = {
  "AI Tech": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
  "Big Tech": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop",
  "Cybersecurity": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
  "Gadgets": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop",
  "Phones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=400&fit=crop",
  "Productivity": "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop",
  "Security": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
  "Gaming": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=400&fit=crop",
  "Smart Income": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
  "Remote Work": "https://images.unsplash.com/photo-1587825140708-dfaf18c4c5ad?w=800&h=400&fit=crop",
  "Green Tech": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=400&fit=crop",
  "Africa Tech": "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&h=400&fit=crop",
  "Crypto": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=400&fit=crop",
  "Space": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=400&fit=crop",
  "Health Tech": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop",
  "Startups": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop",
  "default": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop",
};

function getNewsImage(news: NewsItem): string {
  if (news.cover_image && (news.cover_image.startsWith("http") || news.cover_image.startsWith("/"))) {
    return news.cover_image;
  }
  return categoryImages[news.category] || categoryImages["default"];
}

export default function News() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(() => startTopic(searchParams.get("topic") || searchParams.get("category")));
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const c = searchParams.get("country");
    return c && newsCountries.some((o) => o.name === c) ? c : "All";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("latest");
  // "Xh ago"-style labels below depend on the current time, which differs
  // between SSG build time and client hydration time — rendering them
  // immediately causes a hydration mismatch (React errors #418/#423/#425)
  // on every load. Render the stable absolute date until after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // Build-time data (vite-react-ssg loader) seeds the list into static HTML so
  // crawlers see real article cards without running JS (2026-07-26 fix — this
  // page was previously 100% client-fetched, same issue as Blog.tsx). Note:
  // the loader only covers "Africa Tech" + "Big Tech" (The Rundown) category
  // articles by design (see news-data.ts) — other international/commodity
  // news still arrives via the client fetch below.
  const loaderNews = (useLoaderData() as NewsItem[] | null) ?? undefined;
  const [news, setNews] = useState<NewsItem[]>(loaderNews ?? []);
  const [loading, setLoading] = useState(news.length === 0);

  // Fetch fresh data from API, fall back to static JSON on failure
  useEffect(() => {
    const controller = new AbortController();

    fetch(`${SUPABASE_URL}/rest/v1/news?select=id,title,slug,excerpt,category,topic,country,cover_image,read_time_minutes,created_at,author&order=created_at.desc`, {
      headers: { "apikey": SUPABASE_KEY },
      signal: controller.signal,
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNews(data);
        } else {
          // Keep the build-time stories (they have topics) if we have them; the old JSON is a last resort.
          setNews((prev) => (prev.length ? prev : (staticNews as NewsItem[])));
        }
      })
      .catch(() => { setNews((prev) => (prev.length ? prev : (staticNews as NewsItem[]))); })
      .finally(() => { setLoading(false); });

    return () => controller.abort();
  }, []);

  const filteredNews = news
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || topicOf(item) === selectedCategory;
      const matchesCountry = selectedCountry === "All" || countryOf(item) === selectedCountry;
      const matchesMonth = sortBy === "latest" || sortBy === "oldest" || item.created_at.slice(0, 7) === sortBy;
      return matchesSearch && matchesCategory && matchesCountry && matchesMonth;
    })
    .sort((a, b) =>
      sortBy === "oldest"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const totalPages = Math.ceil(filteredNews.length / NEWS_PER_PAGE);
  const startIndex = (currentPage - 1) * NEWS_PER_PAGE;
  const paginatedNews = filteredNews.slice(startIndex, startIndex + NEWS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedCountry, sortBy]);

  // Every month that has stories, newest first (dates are stored in UTC).
  const monthOptions = useMemo(
    () => [...new Set(news.map((n) => n.created_at.slice(0, 7)))].sort().reverse().map((ym) => [ym, monthLabel(ym)] as const),
    [news]
  );

  // Only offer topics (and places) that have stories, given the other choice. The chosen one
  // always stays in the list, so the button never shows a choice that is not there.
  const topicOptions = useMemo(() => {
    const have = new Set(news.filter((n) => selectedCountry === "All" || countryOf(n) === selectedCountry).map(topicOf));
    return newsTopics.filter((t) => t.name === "All" || t.name === selectedCategory || have.has(t.name));
  }, [news, selectedCountry, selectedCategory]);
  const countryOptions = useMemo(() => {
    const have = new Set(news.filter((n) => selectedCategory === "All" || topicOf(n) === selectedCategory).map(countryOf));
    return newsCountries.filter((c) => c.name === "All" || c.name === selectedCountry || have.has(c.name));
  }, [news, selectedCategory, selectedCountry]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // Before mount, always render a stable absolute date (same on server and
    // client) — avoids a hydration mismatch, then upgrades to "Xh ago" once
    // it's safe to compute client-side (see `mounted` above). A fixed
    // timeZone is required here too: without it, toLocaleDateString uses the
    // runtime's local timezone, which differs between the SSG build machine
    // and a visitor's browser, so a date near midnight UTC could still
    // render as a different calendar day and mismatch anyway.
    if (!mounted) {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    }

    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Tech News - Breaking Tech Stories"
        description="Daily tech news from Ghana and across Africa: mobile money and fintech, AI, telecoms, startups, crypto and online safety, plus The Rundown, our daily world-tech digest."
        canonical="/news"
        image="/og-news-v2.jpg"
        imageAlt="Africa Tech News on TechTrendi, updated daily: AI, fintech, government and policy, cybersecurity and scams, from Ghana and across Africa."
        keywords={["Africa tech news", "Ghana tech news", "fintech news", "mobile money news", "AI news Africa", "Nigeria tech news", "Kenya tech news"]}
      />
      <PageHero
        variant="dark"
        accent="blue"
        eyebrow="Updated daily"
        title="Africa Tech"
        accentText="News"
        subtitle="The latest from Ghana and across Africa: money and fintech, AI, telecoms, startups and online safety."
      />
      <div className="container py-12 md:py-20">
        {/* Search, topic, country and sort (owner, 30 Oct 2026: one Topic button instead of 17 pills;
            27 Nov 2026: real news topics + a country button with flags). Phone: search, then topic,
            then country + sort. Computer: one row. */}
        <div className="max-w-5xl mx-auto mb-10 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px_220px_auto]">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <div className="min-w-0">
            <TopicPicker options={topicOptions} value={selectedCategory} onChange={setSelectedCategory} hint="Show only the news you want." />
          </div>
          <div className="flex gap-3 min-w-0 md:contents">
            <div className="min-w-0 flex-1">
              <TopicPicker
                options={countryOptions}
                value={selectedCountry}
                onChange={setSelectedCountry}
                allLabel="All countries"
                title="Pick a country"
                label="Country"
                hint="Show news from one place."
              />
            </div>
            <SortSelect
              value={sortBy}
              onChange={(v) => setSortBy(v)}
              options={SORT_OPTIONS}
              groups={monthOptions.length > 1 ? [{ label: "Pick a month", options: monthOptions }] : undefined}
              className="w-[150px] md:w-auto"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-6 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              {news.length === 0
                ? "No news articles yet. Check back soon!"
                : "No news matches your search."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedNews.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.slug}`}
                className="group bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  <img
                    src={getNewsImage(item)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = categoryImages["default"];
                    }}
                  />
                  {/* No badge on The Rundown: its cover already says "THE RUNDOWN · WORLD TECH" in that
                      corner and the badge covered it (owner, 27 Nov 2026). */}
                  {topicOf(item) !== "The Rundown" && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary/90 text-primary-foreground">
                        {topicOf(item) || item.category}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  {item.excerpt && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.read_time_minutes || 3} min
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground sm:hidden">
              {currentPage} / {totalPages}
            </span>
            <div className="hidden sm:flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <span key={page} className="flex items-center gap-2">
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-muted-foreground">...</span>}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10 h-10 rounded-full"
                    >
                      {page}
                    </Button>
                  </span>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-full"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {filteredNews.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Showing {startIndex + 1}-{Math.min(startIndex + NEWS_PER_PAGE, filteredNews.length)} of {filteredNews.length} news articles
          </p>
        )}
        {/* Plain link to the full list (16 Nov 2026): Google never presses the page buttons above. */}
        <p className="text-center mt-4">
          <Link to="/news/archive/1" className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">
            See every news story, newest first →
          </Link>
        </p>
      </div>
    </Layout>
  );
}
