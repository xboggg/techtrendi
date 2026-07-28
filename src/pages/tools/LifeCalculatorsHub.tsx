import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { toast } from "sonner";
import {
  Hourglass, Cake, Sparkles, Users, CalendarDays, Grid3x3,
  PiggyBank, Bed, Play, Clock, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LifeTool {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string | null; // null = not built yet
  gradient: string;
}

// Life Progress Bar is the only one that's actually live; every other tile
// is a real, planned spinoff — clicking it surfaces an honest "coming soon"
// instead of a dead link or a silent no-op.
const LIFE_TOOLS: LifeTool[] = [
  { icon: Hourglass, title: "Life Progress Bar", description: "See your life in perspective — days lived, days left, and a shareable Life Card", href: "/tools/life-progress-bar", gradient: "from-purple-500 to-pink-600" },
  { icon: Cake, title: "Birthday Countdown", description: "Count down to your next birthday, down to the second", href: null, gradient: "from-pink-500 to-rose-600" },
  { icon: Sparkles, title: "Half Birthday Calculator", description: "Find your exact half-birthday and celebrate the halfway point", href: null, gradient: "from-amber-500 to-orange-600" },
  { icon: Users, title: "Age Difference Calculator", description: "Compare two birth dates — who's older, and by how much", href: null, gradient: "from-blue-500 to-indigo-600" },
  { icon: CalendarDays, title: "Days Between Dates", description: "Calculate the exact number of days, weeks, or months between any two dates", href: null, gradient: "from-emerald-500 to-teal-600" },
  { icon: Grid3x3, title: "Life in Weeks", description: "Your entire life visualized as a grid — one box per week", href: null, gradient: "from-violet-500 to-purple-600" },
  { icon: PiggyBank, title: "Retirement Countdown", description: "See exactly how many working days stand between you and retirement", href: null, gradient: "from-green-600 to-emerald-700" },
  { icon: Bed, title: "Sleep Debt Calculator", description: "Track accumulated sleep debt and what it's costing you", href: null, gradient: "from-cyan-500 to-blue-600" },
];

export default function LifeCalculatorsHub() {
  const [hovered, setHovered] = useState<string | null>(null);

  const handleComingSoonClick = (e: React.MouseEvent, title: string) => {
    e.preventDefault();
    toast(`${title} is coming soon`, {
      description: "We're building this one next — check back soon, or explore Life Progress Bar in the meantime.",
      icon: <Clock className="w-4 h-4" />,
    });
  };

  return (
    <Layout>
      <SEOHead
        title="Life & Time Calculators - Free Tools | TechTrendi"
        description="A growing collection of free life and time calculators — Life Progress Bar, Birthday Countdown, Life in Weeks, Retirement Countdown, and more."
        canonicalUrl="https://techtrendi.com/tools/life-calculators"
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30 animate-pulse bg-gradient-to-br from-purple-500 to-pink-600" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse delay-1000 bg-gradient-to-br from-amber-500 to-orange-600" />
        </div>

        <div className="container relative py-16 md:py-24 text-center">
          <div className="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-3xl flex items-center justify-center shadow-2xl bg-gradient-to-br from-purple-500 to-pink-600 mb-6">
            <Hourglass className="w-12 h-12 md:w-14 md:h-14 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
            Life &amp; Time <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500">Calculators</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A growing family of tools to help you see your time in perspective — one is live today, and we're building the rest.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600">
              {LIFE_TOOLS.length} calculators planned
            </span>
            <span className="text-sm text-muted-foreground">
              {LIFE_TOOLS.filter(t => t.href).length} live today
            </span>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LIFE_TOOLS.map((tool) => {
              const isLive = !!tool.href;
              const CardInner = (
                <div
                  className={cn(
                    "relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card p-6",
                    "transition-all duration-500 ease-out",
                    isLive ? "hover:shadow-2xl hover:-translate-y-2 hover:border-transparent" : "opacity-90",
                    hovered === tool.title && isLive && "shadow-2xl -translate-y-2"
                  )}
                >
                  {isLive && (
                    <div className={cn(
                      "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 bg-gradient-to-r p-[1px]",
                      tool.gradient,
                      hovered === tool.title && "opacity-100"
                    )}>
                      <div className="absolute inset-[1px] rounded-2xl bg-card" />
                    </div>
                  )}

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg",
                        tool.gradient,
                        isLive && "transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                      )}>
                        <tool.icon className="w-7 h-7 text-white" />
                      </div>
                      {isLive ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                          Live
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Coming Soon
                        </span>
                      )}
                    </div>

                    <h3 className={cn("text-xl font-bold mb-2 transition-colors", isLive ? "text-foreground group-hover:text-primary" : "text-foreground/80")}>
                      {tool.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {tool.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      {isLive ? (
                        <>
                          <span className="text-primary font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                            <Play className="w-4 h-4" /> Use Tool
                          </span>
                          <ArrowUpRight className="w-5 h-5 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </>
                      ) : (
                        <span className="text-muted-foreground font-semibold text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4" /> Notify me when it's ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );

              return isLive ? (
                <Link
                  key={tool.title}
                  to={tool.href!}
                  className="group relative"
                  onMouseEnter={() => setHovered(tool.title)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {CardInner}
                </Link>
              ) : (
                <button
                  key={tool.title}
                  onClick={(e) => handleComingSoonClick(e, tool.title)}
                  className="group relative text-left cursor-pointer"
                >
                  {CardInner}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA back to Life Progress Bar */}
      <section className="py-16 bg-muted/30">
        <div className="container text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Start with what's live today</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Life Progress Bar is ready right now — see your life in days, weeks, and Saturdays, and get a shareable card to prove it.
          </p>
          <Link
            to="/tools/life-progress-bar"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/25 hover:scale-[1.02] transition-transform"
          >
            <Hourglass className="w-5 h-5" /> Try Life Progress Bar
          </Link>
        </div>
      </section>
    </Layout>
  );
}
