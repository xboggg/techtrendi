import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { HoverGlowCard, CardGrid } from "@/components/ui/hover-glow-card";
import { Loader2, ChevronLeft, ChevronRight, Eye, Share2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardModal } from "@/components/ui/card-modal";

interface CreepyTechPost {
  id: string;
  number: number;
  title: string;
  emoji: string;
  category: string;
  content: string;
  views: number;
  created_at: string;
}

const POSTS_PER_PAGE = 12;

const categoryColors: Record<string, { glow: string; badge: string; text: string }> = {
  "Smartphone Paranoia": { glow: "rgba(239, 68, 68, 0.15)", badge: "bg-red-500/20 text-red-400 border-red-500/30", text: "text-red-400" },
  "Everyday Surveillance": { glow: "rgba(234, 179, 8, 0.15)", badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", text: "text-yellow-400" },
  "Cybersecurity & Scams": { glow: "rgba(34, 197, 94, 0.15)", badge: "bg-green-500/20 text-green-400 border-green-500/30", text: "text-green-400" },
  "AI & The Creepy Future": { glow: "rgba(168, 85, 247, 0.15)", badge: "bg-purple-500/20 text-purple-400 border-purple-500/30", text: "text-purple-400" },
  "The Invisible Web": { glow: "rgba(59, 130, 246, 0.15)", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", text: "text-blue-400" },
  "Smart Home Spying": { glow: "rgba(20, 184, 166, 0.15)", badge: "bg-teal-500/20 text-teal-400 border-teal-500/30", text: "text-teal-400" },
  "Money & Banking Creep": { glow: "rgba(16, 185, 129, 0.15)", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", text: "text-emerald-400" },
  "Kids & Tech": { glow: "rgba(244, 114, 182, 0.15)", badge: "bg-pink-500/20 text-pink-400 border-pink-500/30", text: "text-pink-400" },
  "Big Tech Watching Africa": { glow: "rgba(249, 115, 22, 0.15)", badge: "bg-orange-500/20 text-orange-400 border-orange-500/30", text: "text-orange-400" },
  "Social Media Secrets": { glow: "rgba(99, 102, 241, 0.15)", badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", text: "text-indigo-400" },
  "Your Data for Sale": { glow: "rgba(217, 70, 239, 0.15)", badge: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30", text: "text-fuchsia-400" },
  "Phone Permissions Gone Wrong": { glow: "rgba(245, 158, 11, 0.15)", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", text: "text-amber-400" },
  "AI Is Watching": { glow: "rgba(139, 92, 246, 0.15)", badge: "bg-violet-500/20 text-violet-400 border-violet-500/30", text: "text-violet-400" },
};

const categoryEmojis: Record<string, string> = {
  "Smartphone Paranoia": "📱",
  "Everyday Surveillance": "🛒",
  "Cybersecurity & Scams": "🕵️",
  "AI & The Creepy Future": "🤖",
  "The Invisible Web": "🕸️",
  "Smart Home Spying": "🏠",
  "Money & Banking Creep": "💳",
  "Kids & Tech": "👶",
  "Big Tech Watching Africa": "🌍",
  "Social Media Secrets": "📲",
  "Your Data for Sale": "🏷️",
  "Phone Permissions Gone Wrong": "🔓",
  "AI Is Watching": "👁️",
};

export default function CreepyTech() {
  const [posts, setPosts] = useState<CreepyTechPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [modalPost, setModalPost] = useState<CreepyTechPost | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  // Only show category chips that actually have published posts (new categories
  // appear automatically as the drip-poster publishes their posts).
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("creepy_tech_posts")
        .select("category")
        .eq("is_published", true);
      const ordered = Object.keys(categoryColors);
      const present = new Set((data || []).map((r: { category: string }) => r.category));
      setActiveCategories(ordered.filter((c) => present.has(c)));
    })();
  }, []);

  const categories = activeCategories;

  useEffect(() => {
    fetchPosts();
  }, [page, selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("creepy_tech_posts")
        .select("*", { count: "exact" })
        .eq("is_published", true)
        .order("number", { ascending: true });

      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      setPosts(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Error fetching creepy tech posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const filteredPosts = searchQuery
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  const handleShare = async (post: CreepyTechPost) => {
    // Deep-link straight to this post so clicking the shared link opens it.
    const url = `https://techtrendi.com/creepy-tech#post-${post.number}`;
    const teaser = (post.content || "").replace(/\s+/g, " ").trim().slice(0, 160);
    const text = `${post.emoji} ${post.title}\n\n${teaser}…\n\n👉 Read more:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
  };

  // Deep-link landing: if the URL has #post-<number>, fetch that exact post and
  // open it in the modal on load — independent of pagination/filters/draft gaps.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.location.hash.match(/^#post-(\d+)$/);
    if (!m) return;
    const num = parseInt(m[1], 10);
    (async () => {
      const { data } = await supabase
        .from("creepy_tech_posts")
        .select("*")
        .eq("number", num)
        .eq("is_published", true)
        .maybeSingle();
      if (data) setModalPost(data as CreepyTechPost);
    })();
  }, []);

  return (
    <Layout>
      <SEOHead
        title="Creepy Tech - The Surprising Things Your Devices Do Behind the Scenes"
        description="The surprising, lesser-known things your devices and apps do with your data — explained in plain language, so you can make informed choices about your privacy."
        canonical="/creepy-tech"
        image="https://techtrendi.com/images/og-creepy-tech.jpg"
      />
      {/* Hero — uses site theme bg */}
      <section className="relative bg-background overflow-hidden border-b border-border">
        <div className="container relative z-10 py-12 md:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {totalCount > 0 ? `${totalCount} Things` : "Things"} Worth Knowing About Your Tech
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4 tracking-tight">
              Creepy <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-blue-500">Tech</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The surprising things your devices and apps do behind the scenes — explained simply, so you can decide what you're comfortable with. Learn it, share it, stay informed.
            </p>
          </motion.div>

          {/* Category filter pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              onClick={() => { setSelectedCategory(null); setPage(1); }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                !selectedCategory
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
              )}
            >
              All ({totalCount || "..."})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat === selectedCategory ? null : cat); setPage(1); }}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                  selectedCategory === cat
                    ? categoryColors[cat].badge
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                )}
              >
                {categoryEmojis[cat]} {cat}
              </button>
            ))}
          </motion.div>

          {/* Search bar */}
          <motion.div
            className="mt-6 max-w-md mx-auto relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search creepy tech posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </motion.div>
        </div>
      </section>

      {/* Cards grid — site theme bg, dark cards */}
      <section className="bg-background pb-16 pt-8 min-h-[60vh]">
        <div className="container">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No posts found. Check back soon!</p>
            </div>
          ) : (
            <CardGrid>
                {filteredPosts.map((post) => {
                  const catStyle = categoryColors[post.category] || categoryColors["Smartphone Paranoia"];
                  const isExpanded = expandedCards.has(post.id);
                  const toggleExpand = () => {
                    setExpandedCards((prev) => {
                      const next = new Set(prev);
                      if (next.has(post.id)) next.delete(post.id);
                      else next.add(post.id);
                      return next;
                    });
                  };

                  return (
                    <HoverGlowCard
                      key={post.id}
                      glowColor={catStyle.glow}
                      className="flex flex-col cursor-pointer"
                      onClick={() => setModalPost(post)}
                    >
                      <div className="p-5 flex flex-col h-full">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", catStyle.badge)}>
                            {categoryEmojis[post.category]} {post.category}
                          </span>
                          <span className="text-zinc-600 text-xs font-mono">#{post.number}</span>
                        </div>

                        <h3 className="text-white font-bold text-lg leading-snug mb-3">
                          {post.emoji} {post.title}
                        </h3>

                        <div className={cn(
                          "text-zinc-400 text-sm leading-relaxed whitespace-pre-line flex-1 transition-all duration-300",
                          !isExpanded && "line-clamp-[8]"
                        )}>
                          {post.content}
                        </div>

                        {post.content && post.content.length > 300 && (
                          <button
                            className={cn("text-xs mt-2 font-medium transition-colors", catStyle.text)}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand();
                            }}
                          >
                            {isExpanded ? "Show less" : "Read more..."}
                          </button>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                          <div className="flex items-center gap-1 text-zinc-600 text-xs">
                            <Eye className="w-3.5 h-3.5" />
                            {post.views || 0}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(post);
                            }}
                            className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-xs transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Share
                          </button>
                        </div>
                      </div>
                    </HoverGlowCard>
                  );
                })}
            </CardGrid>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200",
                      p === page
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </section>

      <CardModal
        post={modalPost}
        onClose={() => setModalPost(null)}
        onPrev={() => {
          if (!modalPost) return;
          const idx = filteredPosts.findIndex((p) => p.id === modalPost.id);
          if (idx > 0) setModalPost(filteredPosts[idx - 1]);
          else setModalPost(filteredPosts[filteredPosts.length - 1]);
        }}
        onNext={() => {
          if (!modalPost) return;
          const idx = filteredPosts.findIndex((p) => p.id === modalPost.id);
          if (idx < filteredPosts.length - 1) setModalPost(filteredPosts[idx + 1]);
          else setModalPost(filteredPosts[0]);
        }}
        categoryBadgeClass={modalPost ? categoryColors[modalPost.category]?.badge : undefined}
        categoryEmoji={modalPost ? categoryEmojis[modalPost.category] : undefined}
        accentColor="text-red-400"
        shareUrl="techtrendi.com/creepy-tech"
      />
    </Layout>
  );
}
