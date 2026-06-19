import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardModalPost {
  id: string;
  number: number;
  title: string;
  emoji: string;
  category: string;
  content: string;
}

interface CardModalProps {
  post: CardModalPost | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  categoryBadgeClass?: string;
  categoryEmoji?: string;
  accentColor?: string;
  shareUrl?: string;
}

export function CardModal({
  post,
  onClose,
  onPrev,
  onNext,
  categoryBadgeClass = "bg-zinc-700/50 text-zinc-300",
  categoryEmoji,
  accentColor = "text-blue-400",
  shareUrl,
}: CardModalProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    if (post) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [post, handleKey]);

  const handleShare = async () => {
    if (!post) return;
    const text = `${post.emoji} ${post.title}\n\n${post.content?.slice(0, 200)}...\n\n${shareUrl || ""}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  // SSG-safe: portals render into document.body, which only exists in the
  // browser. Hooks above run unconditionally; we just skip the portal on the
  // server (the modal is closed on first paint anyway). Browser unchanged.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {post && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Prev arrow */}
          <button
            onClick={onPrev}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Next arrow */}
          <button
            onClick={onNext}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Modal card */}
          <motion.div
            className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 shadow-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-zinc-900/90 backdrop-blur-sm border-b border-white/[0.06] rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", categoryBadgeClass)}>
                  {categoryEmoji} {post.category}
                </span>
                <span className="text-zinc-600 text-xs font-mono">#{post.number}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <h2 className="text-white font-bold text-xl leading-snug mb-4">
                {post.emoji} {post.title}
              </h2>
              <div className="text-zinc-300 text-[15px] leading-relaxed whitespace-pre-line">
                {post.content}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-zinc-600">Use arrow keys to navigate</span>
              <button
                onClick={handleShare}
                className={cn("flex items-center gap-1.5 text-sm font-medium transition-colors", accentColor)}
              >
                <Share2 className="w-3.5 h-3.5" />
                Share this card
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
