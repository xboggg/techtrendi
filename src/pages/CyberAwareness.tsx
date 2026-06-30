import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { HoverGlowCard, CardGrid } from "@/components/ui/hover-glow-card";
import { Loader2, ChevronLeft, ChevronRight, Eye, Share2, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardModal } from "@/components/ui/card-modal";

interface CyberPost {
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
  "Real-Life Scam Teardowns": { glow: "rgba(239, 68, 68, 0.15)", badge: "bg-red-500/20 text-red-400 border-red-500/30", text: "text-red-400" },
  "Password & Account Fallacies": { glow: "rgba(234, 179, 8, 0.15)", badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", text: "text-yellow-400" },
  "Smart Home & Physical Security": { glow: "rgba(34, 197, 94, 0.15)", badge: "bg-green-500/20 text-green-400 border-green-500/30", text: "text-green-400" },
  "Travel & Public Space Safety": { glow: "rgba(59, 130, 246, 0.15)", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", text: "text-blue-400" },
  "Identity & Data": { glow: "rgba(168, 85, 247, 0.15)", badge: "bg-purple-500/20 text-purple-400 border-purple-500/30", text: "text-purple-400" },
  "Money & Banking Scams": { glow: "rgba(16, 185, 129, 0.15)", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", text: "text-emerald-400" },
  "Social Media & Romance Scams": { glow: "rgba(244, 114, 182, 0.15)", badge: "bg-pink-500/20 text-pink-400 border-pink-500/30", text: "text-pink-400" },
  "Online Shopping & Marketplace Scams": { glow: "rgba(249, 115, 22, 0.15)", badge: "bg-orange-500/20 text-orange-400 border-orange-500/30", text: "text-orange-400" },
  "Job & Investment Scams": { glow: "rgba(245, 158, 11, 0.15)", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", text: "text-amber-400" },
  "Phishing & Fake Messages": { glow: "rgba(6, 182, 212, 0.15)", badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", text: "text-cyan-400" },
  "Tech Support & Device Scams": { glow: "rgba(244, 63, 94, 0.15)", badge: "bg-rose-500/20 text-rose-400 border-rose-500/30", text: "text-rose-400" },
  "AI-Powered Scams": { glow: "rgba(139, 92, 246, 0.15)", badge: "bg-violet-500/20 text-violet-400 border-violet-500/30", text: "text-violet-400" },
  "Everyday Safety Habits": { glow: "rgba(20, 184, 166, 0.15)", badge: "bg-teal-500/20 text-teal-400 border-teal-500/30", text: "text-teal-400" },
};

const categoryEmojis: Record<string, string> = {
  "Real-Life Scam Teardowns": "🛑",
  "Password & Account Fallacies": "🔐",
  "Smart Home & Physical Security": "🏠",
  "Travel & Public Space Safety": "🧳",
  "Identity & Data": "🧬",
  "Money & Banking Scams": "💸",
  "Social Media & Romance Scams": "💔",
  "Online Shopping & Marketplace Scams": "🛒",
  "Job & Investment Scams": "💼",
  "Phishing & Fake Messages": "🎣",
  "Tech Support & Device Scams": "🖥️",
  "AI-Powered Scams": "🤖",
  "Everyday Safety Habits": "🛡️",
};

export default function CyberAwareness() {
  const [posts, setPosts] = useState<CyberPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [modalPost, setModalPost] = useState<CyberPost | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  // Only show category chips that actually have published posts.
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cyber_awareness_posts")
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
        .from("cyber_awareness_posts")
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
      console.error("Error fetching cyber awareness posts:", err);
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

  const handleShare = async (post: CyberPost) => {
    const text = `${post.emoji} ${post.title}\n\n${post.content?.slice(0, 200)}...\n\nMore at techtrendi.com/cyber-awareness`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Cyber Awareness - Stay Safe Online"
        description="Practical cybersecurity tips for everyday people. Protect yourself from scams, phishing, and online threats with simple actionable advice."
        canonical="/cyber-awareness"
        image="https://techtrendi.com/images/og-cyber-awareness.jpg"
      />
      {/* Hero */}
      <section className="relative bg-background overflow-hidden border-b border-border">
        <div className="container relative z-10 py-12 md:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4" />
              {totalCount > 0 ? `${totalCount} Things` : "Things"} Everyone Should Know
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4 tracking-tight">
              Cyber <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-500">Awareness</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              No jargon. No lectures. Just the stuff that keeps your family safe online. Screenshot these cards and send them to someone you love.
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

          {/* Search */}
          <motion.div
            className="mt-6 max-w-md mx-auto relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cyber awareness posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </motion.div>
        </div>
      </section>

      {/* Cards grid */}
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
                  const catStyle = categoryColors[post.category] || categoryColors["Real-Life Scam Teardowns"];
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
        accentColor="text-green-400"
        shareUrl="techtrendi.com/cyber-awareness"
      />
    </Layout>
  );
}
