import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ChevronLeft, ChevronRight, Eye, ShieldCheck } from "lucide-react";
import staticCreepyTech from "@/data/creepy-tech.json";
import staticCyberAwareness from "@/data/cyber-awareness.json";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CardModal } from "@/components/ui/card-modal";

interface Post {
  id: string;
  number: number;
  title: string;
  emoji: string;
  category: string;
  content: string;
}

const creepyCatColors: Record<string, string> = {
  "Smartphone Paranoia": "from-red-500/20 to-red-900/10 border-red-500/20",
  "Everyday Surveillance": "from-yellow-500/20 to-yellow-900/10 border-yellow-500/20",
  "Cybersecurity & Scams": "from-green-500/20 to-green-900/10 border-green-500/20",
  "AI & The Creepy Future": "from-purple-500/20 to-purple-900/10 border-purple-500/20",
  "The Invisible Web": "from-blue-500/20 to-blue-900/10 border-blue-500/20",
};

const cyberCatColors: Record<string, string> = {
  "Real-Life Scam Teardowns": "from-red-500/20 to-red-900/10 border-red-500/20",
  "Password & Account Fallacies": "from-yellow-500/20 to-yellow-900/10 border-yellow-500/20",
  "Smart Home & Physical Security": "from-green-500/20 to-green-900/10 border-green-500/20",
  "Travel & Public Space Safety": "from-blue-500/20 to-blue-900/10 border-blue-500/20",
  "Identity & Data": "from-purple-500/20 to-purple-900/10 border-purple-500/20",
};

function CardItem({ post, colorMap, onClick }: { post: Post; colorMap: Record<string, string>; onClick: () => void }) {
  const colorClass = colorMap[post.category] || "from-zinc-700/20 to-zinc-900/10 border-zinc-700/20";
  return (
    <div
      className="shrink-0 w-[300px] md:w-[320px] cursor-pointer"
      onClick={onClick}
    >
      <div
        className={cn(
          "h-full rounded-xl border bg-gradient-to-b p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20",
          colorClass
        )}
      >
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {post.category}
        </span>
        <h4 className="text-white font-bold text-base mt-2 mb-2 line-clamp-2">
          {post.emoji} {post.title}
        </h4>
        <p className="text-zinc-400 text-sm leading-relaxed line-clamp-4">
          {post.content}
        </p>
      </div>
    </div>
  );
}

function CarouselRow({
  posts,
  colorMap,
  onCardClick,
  hintScroll = false,
  scrollDirection = "left",
}: {
  posts: Post[];
  colorMap: Record<string, string>;
  onCardClick: (post: Post) => void;
  hintScroll?: boolean;
  scrollDirection?: "left" | "right";
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const halfWidthRef = useRef(0);

  const dragStartRef = useRef<{ x: number; offset: number } | null>(null);

  const manualScroll = (dir: "left" | "right") => {
    const amount = 340;
    const hw = halfWidthRef.current;
    if (hw === 0) return;
    offsetRef.current += dir === "right" ? amount : -amount;
    if (offsetRef.current >= hw) offsetRef.current -= hw;
    if (offsetRef.current < 0) offsetRef.current += hw;
    if (trackRef.current) {
      trackRef.current.style.transition = "transform 0.4s ease";
      trackRef.current.style.transform = `translateX(-${offsetRef.current}px)`;
      setTimeout(() => {
        if (trackRef.current) trackRef.current.style.transition = "";
      }, 400);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pausedRef.current = true;
    dragStartRef.current = { x: e.clientX, offset: offsetRef.current };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current || !trackRef.current) return;
    const hw = halfWidthRef.current;
    const delta = dragStartRef.current.x - e.clientX;
    let newOffset = dragStartRef.current.offset + delta;
    if (hw > 0) {
      if (newOffset >= hw) newOffset -= hw;
      if (newOffset < 0) newOffset += hw;
    }
    offsetRef.current = newOffset;
    trackRef.current.style.transform = `translateX(-${newOffset}px)`;
  };

  const onPointerUp = () => {
    dragStartRef.current = null;
    pausedRef.current = false;
  };

  useEffect(() => {
    if (!hintScroll || !trackRef.current) return;

    const track = trackRef.current;
    const halfWidth = track.scrollWidth / 2;
    halfWidthRef.current = halfWidth;

    // Start right-scrolling from the halfway point so it scrolls into view
    if (scrollDirection === "right") {
      offsetRef.current = halfWidth;
    }

    const animate = () => {
      if (!pausedRef.current) {
        if (scrollDirection === "right") {
          offsetRef.current -= 0.5;
          if (offsetRef.current <= 0) {
            offsetRef.current += halfWidth;
          }
        } else {
          offsetRef.current += 0.5;
          if (offsetRef.current >= halfWidth) {
            offsetRef.current -= halfWidth;
          }
        }
        track.style.transform = `translateX(-${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          rafRef.current = requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(containerRef.current || track);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [hintScroll, scrollDirection, posts]);

  if (posts.length === 0) return null;

  // For non-scrolling rows, render normally
  if (!hintScroll) {
    return (
      <div className="relative group/carousel">
        <div
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {posts.map((post) => (
            <CardItem key={post.id} post={post} colorMap={colorMap} onClick={() => onCardClick(post)} />
          ))}
        </div>
      </div>
    );
  }

  // For infinite auto-scroll: render cards twice in a track, use translateX
  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden touch-pan-y"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Arrow buttons — always visible */}
      <button
        onClick={(e) => { e.stopPropagation(); manualScroll("left"); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); manualScroll("right"); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div
        ref={trackRef}
        className="flex gap-4 pb-2 will-change-transform"
        style={{ width: "max-content" }}
      >
        {posts.map((post) => (
          <CardItem key={post.id} post={post} colorMap={colorMap} onClick={() => onCardClick(post)} />
        ))}
      </div>
    </div>
  );
}

export function CreepyTechHomeSection() {
  // Initialize with static data — sections always show, API updates silently
  const [creepyPosts, setCreepyPosts] = useState<Post[]>(staticCreepyTech as Post[]);
  const [cyberPosts, setCyberPosts] = useState<Post[]>(staticCyberAwareness as Post[]);
  const [modalPost, setModalPost] = useState<Post | null>(null);
  const [modalSource, setModalSource] = useState<"creepy" | "cyber">("creepy");

  useEffect(() => {
    supabase
      .from("creepy_tech_posts")
      .select("id, number, title, emoji, category, content")
      .eq("is_published", true)
      .order("number")
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) setCreepyPosts(data);
      });

    supabase
      .from("cyber_awareness_posts")
      .select("id, number, title, emoji, category, content")
      .eq("is_published", true)
      .order("number")
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) setCyberPosts(data);
      });
  }, []);

  return (
    <section className="py-12 md:py-16 bg-zinc-950 relative overflow-hidden">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container relative z-10">
        {/* Creepy Tech Row */}
        {creepyPosts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20">
                  <Eye className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-white">Creepy Tech</span>
                </div>
                <span className="hidden md:block text-sm text-zinc-500">The surprising things your devices do behind the scenes</span>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-red-400 hover:text-red-300">
                <Link to="/creepy-tech" className="flex items-center gap-1">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            <CarouselRow posts={creepyPosts} colorMap={creepyCatColors} onCardClick={(post) => { setModalPost(post); setModalSource("creepy"); }} hintScroll />
          </div>
        )}

        {/* Cyber Awareness Row */}
        {cyberPosts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-white">Cyber Awareness</span>
                </div>
                <span className="hidden md:block text-sm text-zinc-500">Protecting your family online, no jargon needed</span>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-green-400 hover:text-green-300">
                <Link to="/cyber-awareness" className="flex items-center gap-1">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            <CarouselRow posts={cyberPosts} colorMap={cyberCatColors} onCardClick={(post) => { setModalPost(post); setModalSource("cyber"); }} hintScroll scrollDirection="right" />
          </div>
        )}
      </div>

      {(() => {
        const allPosts = modalSource === "creepy" ? creepyPosts : cyberPosts;
        return (
          <CardModal
            post={modalPost}
            onClose={() => setModalPost(null)}
            onPrev={() => {
              if (!modalPost) return;
              const idx = allPosts.findIndex((p) => p.id === modalPost.id);
              setModalPost(idx > 0 ? allPosts[idx - 1] : allPosts[allPosts.length - 1]);
            }}
            onNext={() => {
              if (!modalPost) return;
              const idx = allPosts.findIndex((p) => p.id === modalPost.id);
              setModalPost(idx < allPosts.length - 1 ? allPosts[idx + 1] : allPosts[0]);
            }}
            accentColor={modalSource === "creepy" ? "text-red-400" : "text-green-400"}
            shareUrl={modalSource === "creepy" ? "techtrendi.com/creepy-tech" : "techtrendi.com/cyber-awareness"}
          />
        );
      })()}
    </section>
  );
}
