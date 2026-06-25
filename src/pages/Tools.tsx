import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { PageHero } from "@/components/layout/PageHero";
import {
  Briefcase, Zap, GraduationCap, Megaphone, Braces, Shield, PenTool, Smartphone,
  ArrowRight, Crown, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCategoryCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgPattern: string;
  toolCount: number;
  featured: string[];
  accentColor: string;
  darkAccent: string;
  shadowColor: string;
}

const categories: ToolCategoryCard[] = [
  {
    id: "business",
    title: "Business & Freelancer",
    description: "Invoice generators, CRM, proposals, contracts, and client management tools.",
    icon: Briefcase,
    gradient: "from-blue-500 via-blue-600 to-indigo-600",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(59,130,246,0.15) 0%, transparent 50%)",
    toolCount: 28,
    featured: ["Invoice Generator", "Contract Generator", "Startup Cost Calculator"],
    accentColor: "text-blue-600",
    darkAccent: "dark:text-blue-400",
    shadowColor: "shadow-blue-500/25",
  },
  {
    id: "productivity",
    title: "Productivity",
    description: "Pomodoro timers, parallel AI chat, bill splitters, and more to work smarter.",
    icon: Zap,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(245,158,11,0.15) 0%, transparent 50%)",
    toolCount: 22,
    featured: ["Pomodoro Timer", "Savings Goal", "Loan EMI Calculator"],
    accentColor: "text-orange-600",
    darkAccent: "dark:text-orange-400",
    shadowColor: "shadow-orange-500/25",
  },
  {
    id: "career",
    title: "Career",
    description: "Resume builders, job trackers, salary comparisons, and career matchers.",
    icon: GraduationCap,
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(16,185,129,0.15) 0%, transparent 50%)",
    toolCount: 6,
    featured: ["Resume Builder", "Salary Comparison", "Career Matcher"],
    accentColor: "text-emerald-600",
    darkAccent: "dark:text-emerald-400",
    shadowColor: "shadow-emerald-500/25",
  },
  {
    id: "creator",
    title: "Creator & Marketing",
    description: "Content tools, caption generators, link-in-bio pages, and audience growth.",
    icon: Megaphone,
    gradient: "from-purple-500 via-violet-500 to-fuchsia-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(139,92,246,0.15) 0%, transparent 50%)",
    toolCount: 24,
    featured: ["AI Hashtag Generator", "Hook Generator", "Thumbnail Tester"],
    accentColor: "text-purple-600",
    darkAccent: "dark:text-purple-400",
    shadowColor: "shadow-purple-500/25",
  },
  {
    id: "developer",
    title: "Developer Tools",
    description: "JSON formatters, regex testers, Base64 encoders, and more dev utilities.",
    icon: Braces,
    gradient: "from-slate-600 via-gray-600 to-zinc-700",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(100,116,139,0.15) 0%, transparent 50%)",
    toolCount: 11,
    featured: ["JSON Formatter", "Regex Tester", "JWT Decoder"],
    accentColor: "text-slate-600",
    darkAccent: "dark:text-slate-400",
    shadowColor: "shadow-slate-500/25",
  },
  {
    id: "security",
    title: "Security & Privacy",
    description: "Password generators, privacy checkers, IP lookup, and speed tests.",
    icon: Shield,
    gradient: "from-red-500 via-rose-500 to-pink-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(239,68,68,0.15) 0%, transparent 50%)",
    toolCount: 7,
    featured: ["Password Generator", "WhatsApp Audit", "Scam Analyzer"],
    accentColor: "text-red-600",
    darkAccent: "dark:text-red-400",
    shadowColor: "shadow-red-500/25",
  },
  {
    id: "design",
    title: "Design & Writing",
    description: "Color pickers, image compressors, QR generators, and typography tools.",
    icon: PenTool,
    gradient: "from-pink-500 via-rose-400 to-fuchsia-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(236,72,153,0.15) 0%, transparent 50%)",
    toolCount: 10,
    featured: ["Gradient Generator", "QR Generator", "WiFi QR Generator"],
    accentColor: "text-pink-600",
    darkAccent: "dark:text-pink-400",
    shadowColor: "shadow-pink-500/25",
  },
  {
    id: "other",
    title: "Lifestyle & Fun",
    description: "Phone comparisons, BMI calculators, meme generators, and more.",
    icon: Smartphone,
    gradient: "from-teal-500 via-cyan-500 to-sky-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(20,184,166,0.15) 0%, transparent 50%)",
    toolCount: 15,
    featured: ["This Day in History", "Life Progress Bar", "Tech Trivia"],
    accentColor: "text-teal-600",
    darkAccent: "dark:text-teal-400",
    shadowColor: "shadow-teal-500/25",
  },
];

// Calculate total tools

export default function Tools() {
  return (
    <Layout>
      <SEOHead
        title="130+ Free Online Tools - No Signup Required"
        description="Free online tools for everyone: password generators, QR codes, resume builders, calculators, and more. No signup needed."
        canonical="/tools"
      />
      {/* Hero Section */}
      <PageHero
        variant="light"
        accent="primary"
        eyebrow="130+ free tools · no signup"
        title="Free Tools That"
        accentText="Actually Help"
        subtitle={<>From MoMo fees to developer utilities — find the perfect tool for any task. <strong className="text-foreground">No signup needed.</strong></>}
      >
        <div className="flex justify-center gap-12 md:gap-16">
          {[{ v: "130+", l: "Free Tools" }, { v: "8", l: "Categories" }, { v: "₵0", l: "Always Free" }].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground">{s.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </PageHero>

      <div className="container pb-20">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Explore by <span className="text-primary">Category</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Click any category to discover powerful tools designed to make your life easier
          </p>
        </div>

        {/* Category Cards Grid - Animated */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/tools/${cat.id}`}
                className={cn(
                  "group relative bg-card rounded-2xl border border-border p-6 overflow-hidden",
                  "transition-all duration-500 ease-out",
                  "hover:shadow-2xl hover:border-transparent hover:-translate-y-2",
                  cat.shadowColor
                )}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Background pattern - appears on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
                  style={{ background: cat.bgPattern }}
                />

                {/* Gradient border effect on hover */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  "bg-gradient-to-br p-[1px]",
                  cat.gradient
                )}>
                  <div className="absolute inset-[1px] rounded-2xl bg-card" />
                </div>

                <div className="relative z-10">
                  {/* Icon - with bounce animation on hover */}
                  <div className={cn(
                    "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
                    "transition-all duration-500 ease-out",
                    "group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-xl",
                    cat.gradient
                  )}>
                    <Icon className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors duration-300">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>

                  {/* Featured tools with animated stars */}
                  <div className="space-y-1.5 mb-4">
                    {cat.featured.map((tool, i) => (
                      <div
                        key={tool}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                        style={{ transitionDelay: `${i * 50}ms` }}
                      >
                        <Star className={cn(
                          "w-3 h-3 fill-current transition-all duration-300",
                          "group-hover:scale-125 group-hover:rotate-12",
                          cat.accentColor,
                          cat.darkAccent
                        )} />
                        <span className="group-hover:text-foreground transition-colors duration-300">{tool}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50 group-hover:border-transparent transition-colors duration-300">
                    <span className={cn(
                      "text-sm font-semibold flex items-center gap-1 transition-all duration-300",
                      cat.accentColor,
                      cat.darkAccent
                    )}>
                      Explore Tools
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-2" />
                    </span>
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full transition-all duration-300",
                      "bg-muted text-muted-foreground",
                      "group-hover:bg-gradient-to-r group-hover:text-white",
                      cat.gradient
                    )}>
                      {cat.toolCount} tools
                    </span>
                  </div>
                </div>

                {/* Shine effect on hover */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none",
                  "bg-gradient-to-r from-transparent via-white/10 to-transparent",
                  "-translate-x-full group-hover:translate-x-full",
                  "transition-all duration-1000 ease-out"
                )} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Gradient Banner */}
      <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/50 via-transparent to-rose-500/50" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative container py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Explore All Free Tools
          </h2>
          <p className="text-white/80 max-w-lg mx-auto text-lg">
            130+ free tools to boost your productivity, creativity, and digital life. No signup required.
          </p>
        </div>
      </div>
    </Layout>
  );
}
