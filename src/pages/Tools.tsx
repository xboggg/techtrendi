import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
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
}

const categories: ToolCategoryCard[] = [
  {
    id: "business",
    title: "Business & Freelancer",
    description: "Invoice generators, CRM, proposals, contracts, and client management tools.",
    icon: Briefcase,
    gradient: "from-blue-500 via-blue-600 to-indigo-600",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(59,130,246,0.15) 0%, transparent 50%)",
    toolCount: 14,
    featured: ["Invoice Generator", "Proposal Generator", "Simple CRM"],
    accentColor: "text-blue-600",
    darkAccent: "dark:text-blue-400",
  },
  {
    id: "productivity",
    title: "Productivity",
    description: "Pomodoro timers, parallel AI chat, bill splitters, and more to work smarter.",
    icon: Zap,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(245,158,11,0.15) 0%, transparent 50%)",
    toolCount: 7,
    featured: ["Pomodoro Timer", "Bill Splitter", "World Clock"],
    accentColor: "text-orange-600",
    darkAccent: "dark:text-orange-400",
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
  },
  {
    id: "creator",
    title: "Creator & Marketing",
    description: "Content tools, caption generators, link-in-bio pages, and audience growth.",
    icon: Megaphone,
    gradient: "from-purple-500 via-violet-500 to-fuchsia-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(139,92,246,0.15) 0%, transparent 50%)",
    toolCount: 14,
    featured: ["Content Repurposer", "Link in Bio", "AI Content Ideas"],
    accentColor: "text-purple-600",
    darkAccent: "dark:text-purple-400",
  },
  {
    id: "developer",
    title: "Developer Tools",
    description: "JSON formatters, regex testers, Base64 encoders, and more dev utilities.",
    icon: Braces,
    gradient: "from-slate-600 via-gray-600 to-zinc-700",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(100,116,139,0.15) 0%, transparent 50%)",
    toolCount: 10,
    featured: ["JSON Formatter", "Regex Tester", "JWT Decoder"],
    accentColor: "text-slate-600",
    darkAccent: "dark:text-slate-400",
  },
  {
    id: "security",
    title: "Security & Privacy",
    description: "Password generators, privacy checkers, IP lookup, and speed tests.",
    icon: Shield,
    gradient: "from-red-500 via-rose-500 to-pink-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(239,68,68,0.15) 0%, transparent 50%)",
    toolCount: 5,
    featured: ["Password Generator", "Privacy Checker", "Speed Test"],
    accentColor: "text-red-600",
    darkAccent: "dark:text-red-400",
  },
  {
    id: "design",
    title: "Design & Writing",
    description: "Color pickers, image compressors, QR generators, and typography tools.",
    icon: PenTool,
    gradient: "from-pink-500 via-rose-400 to-fuchsia-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(236,72,153,0.15) 0%, transparent 50%)",
    toolCount: 10,
    featured: ["Color Picker", "QR Generator", "Image Compressor"],
    accentColor: "text-pink-600",
    darkAccent: "dark:text-pink-400",
  },
  {
    id: "other",
    title: "Lifestyle & Fun",
    description: "Phone comparisons, BMI calculators, meme generators, and more.",
    icon: Smartphone,
    gradient: "from-teal-500 via-cyan-500 to-sky-500",
    bgPattern: "radial-gradient(circle at 80% 20%, rgba(20,184,166,0.15) 0%, transparent 50%)",
    toolCount: 9,
    featured: ["Phone Comparison", "BMI Calculator", "Meme Generator"],
    accentColor: "text-teal-600",
    darkAccent: "dark:text-teal-400",
  },
];

export default function Tools() {
  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-purple-500/5" />
        <div className="container relative py-16 md:py-24 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-6">
            90+ Free Tools Available
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Your Ultimate{" "}
            <span className="relative">
              <span className="text-primary">Toolbox</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 8C50 2 150 2 198 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/40" />
              </svg>
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            From business essentials to developer utilities, find the perfect tool for any task.{" "}
            <strong>No signup needed.</strong>
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-12 md:gap-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground">90+</div>
              <div className="text-xs text-muted-foreground mt-1">Free Tools</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground">8</div>
              <div className="text-xs text-muted-foreground mt-1">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-foreground">50K+</div>
              <div className="text-xs text-muted-foreground mt-1">Monthly Users</div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg className="w-full h-12 md:h-16 -mb-1" viewBox="0 0 1440 48" fill="none" preserveAspectRatio="none">
          <path d="M0 48L60 42C120 36 240 24 360 18C480 12 600 12 720 16C840 20 960 28 1080 30C1200 32 1320 28 1380 26L1440 24V48H0Z" className="fill-background" />
        </svg>
      </div>

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

        {/* Category Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                to={`/tools/${cat.id}`}
                className="group relative bg-card rounded-2xl border border-border p-6 transition-all duration-300 hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 overflow-hidden"
              >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: cat.bgPattern }}
                />

                <div className="relative">
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110",
                    cat.gradient
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>

                  {/* Featured tools */}
                  <div className="space-y-1.5 mb-4">
                    {cat.featured.map((tool) => (
                      <div key={tool} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Star className={cn("w-3 h-3 fill-current", cat.accentColor, cat.darkAccent)} />
                        <span>{tool}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className={cn("text-sm font-semibold", cat.accentColor, cat.darkAccent)}>
                      Explore Tools
                      <ArrowRight className="inline w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {cat.toolCount} tools
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Premium CTA */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-violet-600 to-purple-600 p-10 text-center">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white/90 text-xs font-medium mb-4">
              <Crown className="w-3.5 h-3.5" />
              Premium Features
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Unlock the Full Power
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Get unlimited access to Invoice Chaser, Client Portal, Content Repurposer, CRM, and all premium tools.
            </p>
            <Link
              to="/premium"
              className="inline-flex items-center px-8 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Premium - $4.99/month
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
