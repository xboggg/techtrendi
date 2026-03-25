import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, ShieldCheck, ShieldAlert, Lock, EyeOff, Wifi, Smartphone,
  Mail, CreditCard, AlertTriangle, Search, Clock, Calendar, ArrowRight,
  Crown, ChevronRight, ChevronLeft, Fingerprint, KeyRound, Globe, MessageSquareWarning,
  BadgeCheck, BookOpen, Sparkles, TrendingUp, Siren, BookMarked,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { cn } from "@/lib/utils";
import { ThreatLevelBanner } from "@/components/security/ThreatLevelBanner";
import { DailyTip } from "@/components/security/DailyTip";
import { DailyQuizWidget } from "@/components/security/DailyQuizWidget";
import { ShareWithFamily } from "@/components/security/ShareWithFamily";

// ─── Animated section wrapper ──────────────────────────────────────
function RevealSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────
interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  created_at: string;
  is_premium: boolean;
  tags: string[] | null;
  author: string | null;
  views: number | null;
  is_featured: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────
const SECURITY_TAGS = ["security", "privacy", "password", "vpn", "encryption", "hack", "scam", "phishing", "2fa", "malware", "ransomware", "firewall", "cyber"];

const subCategories = [
  { id: "all", label: "All Topics", icon: Shield, color: "from-red-500 to-rose-600" },
  { id: "scams", label: "Scam Alerts", icon: AlertTriangle, color: "from-amber-500 to-orange-600", tags: ["scam", "phishing", "fraud"] },
  { id: "passwords", label: "Passwords", icon: KeyRound, color: "from-blue-500 to-indigo-600", tags: ["password", "2fa", "authentication"] },
  { id: "privacy", label: "Privacy", icon: EyeOff, color: "from-purple-500 to-violet-600", tags: ["privacy", "vpn", "tracking", "data"] },
  { id: "mobile", label: "Phone Safety", icon: Smartphone, color: "from-emerald-500 to-teal-600", tags: ["mobile", "phone", "app", "sms"] },
  { id: "online", label: "Safe Browsing", icon: Globe, color: "from-cyan-500 to-blue-600", tags: ["browser", "web", "online", "internet", "wifi"] },
  { id: "money", label: "Money Safety", icon: CreditCard, color: "from-green-500 to-emerald-600", tags: ["money", "bank", "payment", "mobile money", "credit"] },
];

const quickTips = [
  { icon: Lock, title: "Use Different Passwords", tip: "Don't use the same password everywhere. If one gets leaked, hackers try it on all your accounts.", color: "from-blue-500 to-indigo-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  { icon: MessageSquareWarning, title: "Don't Click Suspicious Links", tip: "If a text or email asks you to click urgently, stop and think. Scammers create panic to trick you.", color: "from-amber-500 to-orange-600", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
  { icon: Wifi, title: "Avoid Free Public Wi-Fi", tip: "Public Wi-Fi at cafes and airports can let strangers see what you're doing online. Use mobile data for banking.", color: "from-red-500 to-rose-600", bgColor: "bg-red-50 dark:bg-red-950/30" },
  { icon: Fingerprint, title: "Turn On 2-Step Verification", tip: "Add an extra lock to your accounts. Even if someone knows your password, they can't get in without your phone.", color: "from-purple-500 to-violet-600", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  { icon: Smartphone, title: "Keep Your Phone Updated", tip: "Those annoying update notifications? They fix security holes. Tap 'Update' — it could save your accounts.", color: "from-emerald-500 to-teal-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/30" },
  { icon: CreditCard, title: "Never Share Your PIN", tip: "No bank, no mobile money agent, no one legitimate will ever ask for your PIN or OTP. Ever.", color: "from-green-500 to-emerald-600", bgColor: "bg-green-50 dark:bg-green-950/30" },
];

const securityTools = [
  { name: "Password Strength Checker", href: "/tools/password-checker", icon: KeyRound, description: "See how strong your password really is" },
  { name: "Password Generator", href: "/tools/password-generator", icon: Lock, description: "Create strong passwords instantly" },
  { name: "Phishing Quiz", href: "/tools/phishing-quiz", icon: ShieldAlert, description: "Can you spot a fake email?" },
  { name: "Privacy Checker", href: "/tools/privacy-checker", icon: EyeOff, description: "Check how private your browsing is" },
  { name: "Cyber Risk Scorecard", href: "/tools/cyber-risk-scorecard", icon: ShieldCheck, description: "Rate your online safety habits" },
  { name: "IP Lookup", href: "/tools/ip-lookup", icon: Globe, description: "See what your IP reveals about you" },
];

// ─── Stagger container ─────────────────────────────────────────────
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

// ─── Component ─────────────────────────────────────────────────────
export default function Security() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubCategory, setActiveSubCategory] = useState("all");
  const [articleCount, setArticleCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesRef = useRef<HTMLDivElement>(null);
  const ARTICLES_PER_PAGE = 9;

  // Refs for scroll-triggered animations
  const tipsRef = useRef(null);
  const toolsRef = useRef(null);
  const ctaRef = useRef(null);
  const newsletterRef = useRef(null);
  const tipsInView = useInView(tipsRef, { once: true, margin: "-80px" });
  const toolsInView = useInView(toolsRef, { once: true, margin: "-80px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" });
  const newsletterInView = useInView(newsletterRef, { once: true, margin: "-80px" });

  useEffect(() => { fetchArticles(); }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const filteredData = (data || []).filter((article) => {
        const articleTags = article.tags || [];
        const articleCategory = article.category?.toLowerCase() || "";
        return SECURITY_TAGS.some(tag =>
          articleTags.some((t: string) => t.toLowerCase().includes(tag.toLowerCase())) ||
          articleCategory.includes(tag.toLowerCase())
        );
      });

      setArticles(filteredData);
      setArticleCount(filteredData.length);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeSubCategory === "all") return matchesSearch;

    const subCat = subCategories.find(c => c.id === activeSubCategory);
    if (!subCat || !subCat.tags) return matchesSearch;

    const articleTags = (article.tags || []).map(t => t.toLowerCase());
    const articleTitle = article.title.toLowerCase();
    const articleExcerpt = (article.excerpt || "").toLowerCase();

    const matchesSubCategory = subCat.tags.some(tag =>
      articleTags.some(t => t.includes(tag)) ||
      articleTitle.includes(tag) ||
      articleExcerpt.includes(tag)
    );

    return matchesSearch && matchesSubCategory;
  });

  useEffect(() => { setCurrentPage(1); }, [activeSubCategory, searchQuery]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const featuredArticle = articles.find(a => a.is_featured) || articles[0];

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const scrollToArticles = () =>
    articlesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <Layout>
      <Helmet>
        <title>Cyber Safety Hub - Stay Safe Online | TechTrendi</title>
        <meta name="description" content="Simple, practical cybersecurity tips for everyone. Learn how to protect yourself from scams, secure your passwords, and stay safe online. No jargon, just what you need to know." />
        <meta name="keywords" content="cybersecurity, online safety, scam protection, password security, phishing, privacy, Ghana, cyber awareness" />
      </Helmet>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* HERO — Full animation suite                                */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a0f1e] via-[#0d1a2d] to-[#0a1628]">
        {/* Animated background orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.16, 0.08] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px]"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        {/* Floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white/20 rounded-full"
            style={{ top: `${20 + i * 15}%`, left: `${10 + i * 18}%` }}
            animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 5 + i * 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
          />
        ))}

        <div className="container relative z-10 py-16 md:py-24 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust badge */}
            <motion.span
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-sm font-medium mb-8"
            >
              <ShieldCheck className="w-4 h-4 text-green-400" />
              Your Online Safety Guide
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-green-400"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.span>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1]"
            >
              Stay Safe in a{" "}
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-300"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 200%" }}
              >
                Digital World
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Simple, practical tips to protect yourself and your family online.
              No tech jargon — just what you need to know.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl px-8 shadow-lg shadow-cyan-500/25"
                  onClick={scrollToArticles}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Read Safety Guides
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 rounded-xl px-8"
                  asChild
                >
                  <Link to="/cyber-awareness">
                    <Sparkles className="w-5 h-5 mr-2" />
                    50 Things to Know
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats bar — animated counters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-12 pt-8 border-t border-white/10"
            >
              {[
                { value: articleCount || 0, label: "Safety Guides" },
                { value: securityTools.length, label: "Free Tools" },
                { value: subCategories.length - 1, label: "Safety Topics" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                >
                  <p className="text-2xl md:text-3xl font-bold text-white">{stat.value || "..."}</p>
                  <p className="text-xs text-white/50 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <motion.path
              d="M0 80V40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0Z"
              className="fill-background"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* THREAT LEVEL BANNER                                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="py-4 bg-background">
        <div className="container">
          <ThreatLevelBanner />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* QUICK SAFETY TIPS — Staggered entrance                     */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container">
          <RevealSection className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-red-500/10 text-sm font-medium text-red-600 dark:text-red-400 mb-4">
              Quick Tips
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              6 Things to Do <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Right Now</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              You don't need to be a tech expert. These simple steps protect you from most online threats.
            </p>
          </RevealSection>

          <motion.div
            ref={tipsRef}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={staggerContainer}
            initial="hidden"
            animate={tipsInView ? "visible" : "hidden"}
          >
            {quickTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <motion.div key={index} variants={staggerItem}>
                  <motion.div
                    className={cn(
                      "group relative p-6 rounded-2xl border border-border/50 transition-all duration-300 h-full cursor-default",
                      tip.bgColor
                    )}
                    whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)", borderColor: "rgba(var(--primary), 0.2)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
                        tip.color
                      )}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tip.tip}</p>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* FEATURED ARTICLE — Slide in                                */}
      {/* ════════════════════════════════════════════════════════════ */}
      {!loading && featuredArticle && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container">
            <RevealSection>
              <div className="flex items-center gap-3 mb-8">
                <motion.div
                  className="w-1 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                />
                <h2 className="text-2xl font-bold text-foreground">Featured</h2>
              </div>
            </RevealSection>

            <RevealSection delay={0.15}>
              <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
                <Link
                  to={`/blog/${featuredArticle.slug}`}
                  className="group grid md:grid-cols-2 gap-6 bg-card rounded-3xl border border-border overflow-hidden hover:shadow-elevated hover:border-primary/20 transition-all duration-300"
                >
                  <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden bg-muted">
                    {featuredArticle.cover_image ? (
                      <motion.img
                        src={featuredArticle.cover_image}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.6 }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                        <Shield className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 rounded-full px-3 py-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <Badge variant="secondary" className="w-fit mb-4 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Security & Privacy
                    </Badge>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-3">
                      {featuredArticle.title}
                    </h3>
                    {featuredArticle.excerpt && (
                      <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                        {featuredArticle.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDate(featuredArticle.created_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {featuredArticle.read_time_minutes || 5} min read
                      </span>
                    </div>
                    <motion.div
                      className="mt-6 flex items-center gap-2 text-primary font-medium"
                      whileHover={{ x: 8 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      Read Article
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            </RevealSection>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* FREE SECURITY TOOLS — Staggered cards                      */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <RevealSection className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">
              Free Tools
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Check Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Safety Level</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Try these free tools to test your online security habits. No sign-up needed.
            </p>
          </RevealSection>

          <motion.div
            ref={toolsRef}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate={toolsInView ? "visible" : "hidden"}
          >
            {securityTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div key={index} variants={staggerItem}>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: "0 16px 32px -8px rgba(0,0,0,0.12)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Link
                      to={tool.href}
                      className="group flex items-start gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors duration-300"
                    >
                      <motion.div
                        className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0"
                        whileHover={{ scale: 1.15, rotate: -5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-0.5">
                          {tool.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        whileHover={{ opacity: 1, x: 0 }}
                        className="mt-1"
                      >
                        <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    </Link>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* DAILY ENGAGEMENT — Tip, Quiz, Share                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container">
          <RevealSection className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 text-sm font-medium text-purple-600 dark:text-purple-400 mb-4">
              Daily Safety Check
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Your Daily <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">Safety Boost</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A new tip, a quick quiz, and easy ways to share safety with the people you care about.
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RevealSection delay={0}>
              <DailyTip />
            </RevealSection>
            <RevealSection delay={0.15}>
              <DailyQuizWidget />
            </RevealSection>
            <RevealSection delay={0.3}>
              <ShareWithFamily />
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* ALL ARTICLES — Filterable + Paginated                      */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section ref={articlesRef} className="py-16 md:py-20 bg-background scroll-mt-20">
        <div className="container">
          <RevealSection className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4">
              Safety Guides
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Learn to Protect Yourself
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Browse our guides by topic. Written in plain language for everyone.
            </p>
          </RevealSection>

          {/* Sub-category pills — animated */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 mb-8"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {subCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeSubCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setActiveSubCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-colors duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  layout
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search security articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 rounded-xl h-12"
              />
            </div>
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted" />
                  <div className="p-6">
                    <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full mb-4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Shield className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                {articles.length === 0
                  ? "No security articles yet. Check back soon!"
                  : "No articles match your search."}
              </p>
              {(searchQuery || activeSubCategory !== "all") && (
                <button
                  onClick={() => { setSearchQuery(""); setActiveSubCategory("all"); }}
                  className="text-primary hover:underline text-sm mt-2"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeSubCategory}-${currentPage}-${searchQuery}`}
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                >
                  {paginatedArticles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
                    >
                      <motion.div
                        whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="h-full"
                      >
                        <Link
                          to={`/blog/${article.slug}`}
                          className="group flex flex-col bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:border-primary/20 transition-colors duration-300 h-full"
                        >
                          <div className="relative h-48 bg-muted overflow-hidden">
                            {article.cover_image ? (
                              <motion.img
                                src={article.cover_image}
                                alt={article.title}
                                className="w-full h-full object-cover"
                                whileHover={{ scale: 1.08 }}
                                transition={{ duration: 0.5 }}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center">
                                <Shield className="w-12 h-12 text-muted-foreground/20" />
                              </div>
                            )}
                            {article.is_premium && (
                              <div className="absolute top-3 right-3">
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Premium
                                </Badge>
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                          </div>

                          <div className="p-5 flex flex-col flex-1">
                            <h3 className="text-base font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>
                            {article.excerpt && (
                              <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                                {article.excerpt}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(article.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {article.read_time_minutes || 5} min
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  className="flex items-center justify-center gap-2 mt-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(currentPage - 1); articlesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                    className="rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Prev
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <motion.button
                        key={p}
                        onClick={() => { setCurrentPage(p); articlesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                        className={cn(
                          "w-9 h-9 rounded-lg text-sm font-medium transition-colors duration-200",
                          p === currentPage
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {p}
                      </motion.button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage(currentPage + 1); articlesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                    className="rounded-xl"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}

              <p className="text-center text-sm text-muted-foreground mt-4">
                Showing {(currentPage - 1) * ARTICLES_PER_PAGE + 1}–{Math.min(currentPage * ARTICLES_PER_PAGE, filteredArticles.length)} of {filteredArticles.length} articles
              </p>
            </>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* CYBER AWARENESS CTA — Bold & colourful                     */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 relative overflow-hidden bg-slate-950">
        {/* Vivid gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.2)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.18)_0%,transparent_50%),radial-gradient(ellipse_at_center,rgba(20,184,166,0.1)_0%,transparent_60%)]" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }} />
        {/* Animated glowing orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.4, 1], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-600/15 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.3, 1], x: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="container relative z-10" ref={ctaRef}>
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 40 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.div
              className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 backdrop-blur-sm mb-6"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShieldCheck className="w-10 h-10 text-green-400" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-400">
                50 Things Everyone Should Know
              </span>
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
              Quick, shareable safety cards you can screenshot and send to friends and family.
              No jargon, no lectures — just the stuff that keeps people safe.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl px-8 font-semibold shadow-lg shadow-green-500/25"
                  asChild
                >
                  <Link to="/cyber-awareness" className="flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5" />
                    View All 50 Cards
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl px-8 font-semibold shadow-lg shadow-amber-500/25"
                  asChild
                >
                  <Link to="/scam-alerts" className="flex items-center gap-2">
                    <Siren className="w-5 h-5" />
                    Scam Alerts
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl px-8 font-semibold shadow-lg shadow-purple-500/25"
                  asChild
                >
                  <Link to="/think-before-you-click" className="flex items-center gap-2">
                    <BookMarked className="w-5 h-5" />
                    The Book
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl px-8 font-semibold shadow-lg shadow-red-500/25"
                  asChild
                >
                  <Link to="/report-scam" className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Report a Scam
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* NEWSLETTER CTA                                             */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="py-14 bg-gradient-to-r from-slate-50 via-cyan-50/50 to-blue-50 dark:from-slate-950/40 dark:via-cyan-950/20 dark:to-blue-950/20 border-t border-slate-200 dark:border-slate-800">
        <div className="container" ref={newsletterRef}>
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={newsletterInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-4"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Mail className="w-7 h-7 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Stay Safe, Stay Informed
            </h3>
            <p className="text-muted-foreground mb-6">
              Get weekly security tips and scam alerts delivered to your inbox. Plain language, no spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="rounded-xl h-12 flex-1 border-slate-200 dark:border-slate-700 focus:border-cyan-400"
              />
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl h-12 px-6 whitespace-nowrap w-full sm:w-auto shadow-lg shadow-cyan-500/20">
                  <Shield className="w-4 h-4 mr-2" />
                  Subscribe
                </Button>
              </motion.div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              No spam, ever. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
