import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Shared hero pattern across pages (News, Tools, Blog, DigiStore...).
 * Same skeleton everywhere — eyebrow → headline (with one accent phrase) →
 * subtext → optional children (search bars, stats, CTAs) — so the site feels
 * cohesive. The only thing that changes per page is `variant` (dark/light) and
 * `accent` (the gradient for the highlighted phrase + the eyebrow + glows).
 */
type Accent = "emerald" | "blue" | "purple" | "amber" | "primary";

const ACCENTS: Record<Accent, { grad: string; text: string; glow1: string; glow2: string }> = {
  emerald: { grad: "from-emerald-300 via-cyan-300 to-blue-300", text: "text-emerald-500 dark:text-emerald-400", glow1: "bg-emerald-500/15", glow2: "bg-cyan-500/10" },
  blue:    { grad: "from-blue-400 via-cyan-400 to-sky-300",     text: "text-blue-500 dark:text-blue-400",       glow1: "bg-blue-500/15",    glow2: "bg-cyan-500/10" },
  purple:  { grad: "from-purple-400 via-fuchsia-400 to-pink-300", text: "text-purple-500 dark:text-purple-400", glow1: "bg-purple-500/15",  glow2: "bg-fuchsia-500/10" },
  amber:   { grad: "from-amber-300 via-orange-300 to-rose-300", text: "text-amber-500 dark:text-amber-400",     glow1: "bg-amber-500/15",   glow2: "bg-orange-500/10" },
  primary: { grad: "from-blue-500 via-indigo-500 to-purple-500", text: "text-primary",                          glow1: "bg-primary/15",     glow2: "bg-purple-500/10" },
};

interface PageHeroProps {
  eyebrow?: string;
  /** headline text BEFORE the accent phrase */
  title: string;
  /** the accent-coloured phrase (gradient) */
  accentText?: string;
  /** headline text AFTER the accent phrase */
  titleAfter?: string;
  subtitle?: ReactNode;
  variant?: "dark" | "light";
  accent?: Accent;
  /** optional centered content under the subtitle (search bar, stats, CTAs) */
  children?: ReactNode;
  align?: "center" | "left";
  className?: string;
}

export function PageHero({
  eyebrow, title, accentText, titleAfter, subtitle,
  variant = "light", accent = "primary", children, align = "center", className,
}: PageHeroProps) {
  const a = ACCENTS[accent];
  const dark = variant === "dark";

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b",
        dark ? "bg-[#0a0f1e] border-white/10" : "bg-gradient-to-br from-background via-background to-muted/40 border-border",
        className
      )}
    >
      {/* ambient gradient-mesh — same family on every page, just different accent */}
      <motion.div className={cn("absolute -top-28 -left-24 w-[34rem] h-[34rem] rounded-full blur-[130px]", a.glow1)}
        animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.12, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className={cn("absolute -bottom-28 right-0 w-[38rem] h-[38rem] rounded-full blur-[140px]", a.glow2)}
        animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.18, 1] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }} />
      {dark && (
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "44px 44px", maskImage: "radial-gradient(ellipse at center, black, transparent 75%)" }} />
      )}

      <div className={cn("container relative z-10 py-14 md:py-20", align === "center" && "text-center")}>
        <div className={cn(align === "center" ? "max-w-2xl mx-auto" : "max-w-3xl")}>
          {eyebrow && (
            <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={cn("inline-block text-xs font-semibold tracking-[0.25em] uppercase mb-4", a.text)}>
              {eyebrow}
            </motion.span>
          )}
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className={cn("text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]", dark ? "text-white" : "text-foreground")}>
            {title}{accentText && " "}
            {accentText && <span className={cn("text-transparent bg-clip-text bg-gradient-to-r", a.grad)}>{accentText}</span>}
            {titleAfter && ` ${titleAfter}`}
          </motion.h1>
          {subtitle && (
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className={cn("text-lg mt-5 leading-relaxed", align === "center" && "mx-auto", dark ? "text-white/60 max-w-xl" : "text-muted-foreground max-w-xl")}>
              {subtitle}
            </motion.p>
          )}
          {children && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
