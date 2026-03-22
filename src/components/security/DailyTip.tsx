import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, RefreshCw, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Tip {
  id: string;
  tip_text: string;
  category: string;
  emoji: string;
  source: string | null;
}

export function DailyTip() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("security_daily_tips")
        .select("id, tip_text, category, emoji, source")
        .eq("is_published", true)
        .limit(30);
      if (data && data.length > 0) {
        // Shuffle and pick today's rotation based on day of year
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const shuffled = [...data].sort((a, b) => {
          const ha = hashString(a.id + dayOfYear);
          const hb = hashString(b.id + dayOfYear);
          return ha - hb;
        });
        setTips(shuffled);
      }
    })();
  }, []);

  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  };

  const currentTip = tips[currentIndex];

  const navigate = (dir: number) => {
    setDirection(dir);
    setCurrentIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return tips.length - 1;
      if (next >= tips.length) return 0;
      return next;
    });
  };

  const shareTip = async () => {
    if (!currentTip) return;
    const text = `${currentTip.emoji} Security Tip: ${currentTip.tip_text}\n\nMore tips at techtrendi.com/security`;
    if (navigator.share) {
      try { await navigator.share({ title: "Security Tip", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  if (!currentTip) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-5 md:p-6 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px]" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Lightbulb className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Did You Know?</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={shareTip}
              className="w-7 h-7 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors ml-1"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tip content with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip.id}
            initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-foreground font-medium leading-relaxed">
              <span className="text-lg mr-1">{currentTip.emoji}</span>
              {currentTip.tip_text}
            </p>
            {currentTip.source && (
              <p className="text-xs text-amber-600/60 dark:text-amber-400/50 mt-2 italic">
                — {currentTip.source}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Tip counter */}
        <div className="flex items-center justify-center gap-1 mt-4">
          {tips.slice(0, Math.min(tips.length, 8)).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-200",
                i === currentIndex % Math.min(tips.length, 8)
                  ? "w-4 bg-amber-500"
                  : "bg-amber-300 dark:bg-amber-700"
              )}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
