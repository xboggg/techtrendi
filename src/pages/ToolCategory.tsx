import { Link, useParams, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Shield, QrCode, Image, ArrowRight, Smartphone, FileText, Lock, Braces, Binary,
  Palette, Scale, Type, Gauge, Eye, Globe, Hash, Link2, AlignJustify, DollarSign,
  Calculator, Mail, Clock, CreditCard, CheckSquare, Briefcase, LinkIcon, Crown,
  Receipt, FileSignature, Users, Calendar, Zap, Building, PenTool, Share2,
  BarChart3, Megaphone, GraduationCap, Code, Timer, KeyRound, FileCode, Paintbrush,
  Keyboard, TrendingUp, Lightbulb, Disc3, Wallet, ImageIcon, Tags, ScrollText,
  Send, Hourglass, AtSign, Monitor, CircleDollarSign, PieChart, MessageSquare,
  Droplets, Target, BookOpen, Rocket, User, Leaf, Compass, SquareAsterisk,
  ShoppingBag, List, Instagram, ClipboardList, ChevronLeft, Sparkles, Star,
  ArrowUpRight, Play, Wifi, Database, Globe2, Heart, Home, Timer as TimerIcon,
  Volume2, Pipette, FileImage, Receipt as ReceiptIcon, Youtube, Wand2, ArrowRightLeft,
  Cake, Coins, HashIcon, Flame, History, ParkingCircle, PiggyBank, Percent, Banknote,
  ImagePlus, Activity, CreditCard as CreditCardIcon, Brain, Armchair, HeartHandshake, Swords,
  LayoutGrid, GanttChart, Map, Percent as PercentIcon,
  Flame as FlameIcon, MapPin, FileSearch, ShieldAlert, Layers, TrendingDown,
  Search, Sprout, Bell, Utensils, ClipboardCheck, CalendarRange, HandCoins
} from "lucide-react";
import { cn } from "@/lib/utils";
import { allTools } from "@/data/tools";

type ToolTier = "free" | "free-account" | "premium";

interface Tool {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  tier: ToolTier;
  isNew?: boolean;
  gradient: string;
}

interface CategoryData {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgGradient: string;
  illustration: string;
}

const categoriesData: Record<string, CategoryData> = {
  business: {
    id: "business",
    title: "Business & Freelancer",
    description: "Tools to run your business and manage clients",
    longDescription: "Everything you need to run a successful business - from invoicing and proposals to CRM and client management. Built for freelancers, agencies, and entrepreneurs.",
    icon: Briefcase,
    gradient: "from-blue-500 via-blue-600 to-indigo-700",
    bgGradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
    illustration: "💼",
  },
  productivity: {
    id: "productivity",
    title: "Productivity",
    description: "Boost your efficiency and stay organized",
    longDescription: "Supercharge your daily workflow with timers, trackers, and tools designed to help you focus, track habits, and accomplish more every day.",
    icon: Zap,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    bgGradient: "from-orange-500/10 via-amber-500/5 to-transparent",
    illustration: "⚡",
  },
  career: {
    id: "career",
    title: "Career",
    description: "Land your dream job and grow your network",
    longDescription: "Tools to help you build a standout resume, track job applications, compare salaries, and find your perfect career path.",
    icon: GraduationCap,
    gradient: "from-emerald-500 via-green-500 to-teal-600",
    bgGradient: "from-emerald-500/10 via-green-500/5 to-transparent",
    illustration: "🎓",
  },
  creator: {
    id: "creator",
    title: "Creator & Marketing",
    description: "Grow your audience and monetize your content",
    longDescription: "Everything creators need to grow their audience - from social media tools and content generators to analytics and link management.",
    icon: Megaphone,
    gradient: "from-purple-500 via-violet-500 to-fuchsia-600",
    bgGradient: "from-purple-500/10 via-violet-500/5 to-transparent",
    illustration: "📣",
  },
  developer: {
    id: "developer",
    title: "Developer Tools",
    description: "Tools for developers and technical users",
    longDescription: "Essential utilities for developers - JSON formatters, regex testers, encoders, and more tools to speed up your development workflow.",
    icon: Braces,
    gradient: "from-slate-600 via-slate-700 to-zinc-800",
    bgGradient: "from-slate-600/10 via-zinc-700/5 to-transparent",
    illustration: "👨‍💻",
  },
  security: {
    id: "security",
    title: "Security & Privacy",
    description: "Protect yourself online",
    longDescription: "Keep your digital life secure with password generators, privacy checkers, and security tools that help protect your online presence.",
    icon: Shield,
    gradient: "from-red-500 via-rose-500 to-pink-600",
    bgGradient: "from-red-500/10 via-rose-500/5 to-transparent",
    illustration: "🛡️",
  },
  design: {
    id: "design",
    title: "Design & Writing",
    description: "Create beautiful content",
    longDescription: "Tools for designers and content creators - from color pickers and gradient generators to image compressors and text utilities.",
    icon: PenTool,
    gradient: "from-pink-500 via-rose-400 to-red-400",
    bgGradient: "from-pink-500/10 via-rose-400/5 to-transparent",
    illustration: "🎨",
  },
  other: {
    id: "other",
    title: "Lifestyle & Fun",
    description: "More useful utilities",
    longDescription: "Fun and useful tools for everyday life - track your screen time, calculate your carbon footprint, or see your life in perspective.",
    icon: Smartphone,
    gradient: "from-teal-500 via-cyan-500 to-sky-500",
    bgGradient: "from-teal-500/10 via-cyan-500/5 to-transparent",
    illustration: "🌟",
  },
};

// Tools for a category come from the ONE main list in src/data/tools.ts (audit 28 Nov 2026:
// this page used to keep its own copy, which linked a removed tool and missed new ones).
function toolsFor(categoryId: string): Tool[] {
  return allTools
    .filter((t) => t.categoryId === categoryId)
    .map((t) => ({ icon: t.icon, title: t.title, description: t.description, href: t.href, tier: t.tier, isNew: t.isNew, gradient: t.gradient }));
}

const TierBadge = ({ tier }: { tier: ToolTier }) => {
  if (tier === "free") {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
        Free
      </span>
    );
  }
  if (tier === "free-account") {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        Free + Account
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
      <Crown className="w-3 h-3" />
      Premium
    </span>
  );
};

export default function ToolCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  const category = categoryId ? categoriesData[categoryId] : null;

  if (!category) {
    return <Navigate to="/tools" replace />;
  }
  const tools = toolsFor(category.id);

  return (
    <Layout>
      <SEOHead
        title={`${category.title} Tools - Free Online Utilities | TechTrendi`}
        description={category.longDescription}
        canonicalUrl={`https://techtrendi.com/tools/${category.id}`}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className={cn("absolute inset-0 bg-gradient-to-br", category.bgGradient)} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Animated Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={cn(
            "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30 animate-pulse",
            `bg-gradient-to-br ${category.gradient}`
          )} />
          <div className={cn(
            "absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse delay-1000",
            `bg-gradient-to-br ${category.gradient}`
          )} />
        </div>

        <div className="container relative py-16 md:py-24">
          {/* Back Link */}
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>All Tools</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* Icon */}
            <div
              className={cn(
                "w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center shadow-2xl",
                "bg-gradient-to-br",
                category.gradient
              )}
            >
              <category.icon className="w-12 h-12 md:w-16 md:h-16 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl md:text-5xl font-black text-foreground">
                  {category.title}
                </h1>
                <span className="text-5xl">{category.illustration}</span>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl">
                {category.longDescription}
              </p>
              <div className="flex items-center gap-4 mt-6">
                <span className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold text-white",
                  `bg-gradient-to-r ${category.gradient}`
                )}>
                  {tools.length} Tools Available
                </span>
                <span className="text-sm text-muted-foreground">
                  {tools.filter(t => t.tier === "free").length} completely free
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <Link
                key={tool.title}
                to={tool.href}
                className="group relative"
                onMouseEnter={() => setHoveredTool(tool.title)}
                onMouseLeave={() => setHoveredTool(null)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  "relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card p-6",
                  "transition-all duration-500 ease-out",
                  "hover:shadow-2xl hover:-translate-y-2 hover:border-transparent",
                  hoveredTool === tool.title && "shadow-2xl -translate-y-2"
                )}>
                  {/* Gradient Border on Hover */}
                  <div className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500",
                    "bg-gradient-to-r p-[1px]",
                    tool.gradient,
                    hoveredTool === tool.title && "opacity-100"
                  )}>
                    <div className="absolute inset-[1px] rounded-2xl bg-card" />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      {/* Icon with Gradient */}
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center",
                        "bg-gradient-to-br shadow-lg",
                        tool.gradient,
                        "transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                      )}>
                        <tool.icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2">
                        {tool.isNew && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500 text-white uppercase tracking-wider animate-pulse">
                            New
                          </span>
                        )}
                        <TierBadge tier={tool.tier} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {tool.description}
                    </p>

                    {/* Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <span className="text-primary font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                        <Play className="w-4 h-4" />
                        Use Tool
                      </span>
                      <ArrowUpRight className={cn(
                        "w-5 h-5 text-muted-foreground transition-all duration-300",
                        "group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1"
                      )} />
                    </div>
                  </div>

                  {/* Shine Effect */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none",
                    "bg-gradient-to-r from-transparent via-white/5 to-transparent",
                    "-translate-x-full group-hover:translate-x-full group-hover:opacity-100",
                    "transition-transform duration-1000"
                  )} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Other Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Explore Other Categories
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.values(categoriesData)
              .filter(cat => cat.id !== category.id)
              .map(cat => (
                <Link
                  key={cat.id}
                  to={`/tools/${cat.id}`}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-card",
                    "hover:border-primary/50 hover:shadow-lg transition-all duration-300",
                    "hover:-translate-y-1"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    "bg-gradient-to-br",
                    cat.gradient
                  )}>
                    <cat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{cat.title}</div>
                    <div className="text-xs text-muted-foreground">{toolsFor(cat.id).length} tools</div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
