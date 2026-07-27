import { useState, useEffect, useRef } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { DailyTip } from "@/components/security/DailyTip";
import { DailyQuizWidget } from "@/components/security/DailyQuizWidget";
import { ShareWithFamily } from "@/components/security/ShareWithFamily";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { checkMessage } from "@/lib/scamPatterns";
import { getRiskScore, type StoredRiskScore } from "@/lib/riskScoreStorage";
import { cn } from "@/lib/utils";
import {
  Shield, ShieldAlert, ShieldCheck, KeyRound, Lock, EyeOff, Globe, AlertTriangle,
  Smartphone, CreditCard, Phone, ArrowRight, Sparkles,
  Flame, Clock, ExternalLink, Siren, ChevronRight, X, Search,
} from "lucide-react";

// ── data shapes ──────────────────────────────────────────────────────────────
interface ScamAlert { id: string; title: string; description: string; scam_type: string; severity: string; emoji?: string | null; what_to_do?: string | null; affected_platforms?: string[] | null; created_at?: string; }
interface ThreatLevel { level: string; title: string; description: string; active_threats: string[]; updated_at: string; }
interface Article { id: string; title: string; slug: string; excerpt: string | null; category: string; cover_image: string | null; created_at: string; tags: string[] | null; author?: string | null; }

const TOOLS = [
  { name: "Cyber Risk Scorecard", href: "/tools/cyber-risk-scorecard", icon: ShieldCheck, desc: "Rate your online safety habits" },
  { name: "Password Strength Checker", href: "/tools/password-checker", icon: KeyRound, desc: "See how strong your password really is" },
  { name: "Password Generator", href: "/tools/password-generator", icon: Lock, desc: "Create strong passwords instantly" },
  { name: "Phishing Quiz", href: "/tools/phishing-quiz", icon: ShieldAlert, desc: "Can you spot a fake email?" },
  { name: "Privacy Checker", href: "/tools/privacy-checker", icon: EyeOff, desc: "Check how private your browsing is" },
  { name: "Ghana Scam Checker", href: "/tools/ghana-scam-checker", icon: Shield, desc: "Check a suspicious message before you reply" },
];


const NAV = [
  { id: "help", label: "Quick Help" },
  { id: "now", label: "What's Happening" },
  { id: "score", label: "Your Score" },
  { id: "tools", label: "Tools" },
  { id: "daily", label: "Daily Check" },
  { id: "guides", label: "Guides" },
];

const SEVERITY: Record<string, string> = {
  critical: "bg-red-500", high: "bg-red-500", medium: "bg-amber-500", low: "bg-emerald-500",
};
const timeAgo = (d?: string) => {
  if (!d) return "recently";
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} week${days >= 14 ? "s" : ""} ago`;
};

// Scroll-reveal wrapper — fades + rises into view once. Honors reduced-motion
// via framer-motion's global setting; cheap (transform/opacity only).
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// One-card-at-a-time swipe carousel for mobile (md:+ callers should render
// their own grid instead — this component IS the mobile view, not a decorator
// on top of a grid). Shows dot indicators + arrow buttons so the swipe gesture
// is discoverable, not just guessable.
function MobileCarousel<T>({ items, renderItem, keyFn, accent = "bg-primary" }: {
  items: T[];
  renderItem: (item: T, i: number) => React.ReactNode;
  keyFn: (item: T, i: number) => string;
  accent?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / items.length;
    setActive(Math.round(el.scrollLeft / cardWidth));
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / items.length;
    el.scrollTo({ left: i * cardWidth, behavior: "smooth" });
  };

  return (
    <div className="md:hidden">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4"
      >
        {items.map((item, i) => (
          <div key={keyFn(item, i)} className="shrink-0 w-full snap-center px-0.5">
            {renderItem(item, i)}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            aria-label="Previous"
            onClick={() => goTo(Math.max(0, active - 1))}
            disabled={active === 0}
            className="p-2 rounded-full border border-border bg-card text-foreground disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-transform"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div className="flex items-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={keyFn(item, i)}
                aria-label={`Go to card ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? `w-5 ${accent}` : "w-1.5 bg-border"}`}
              />
            ))}
          </div>
          <button
            aria-label="Next"
            onClick={() => goTo(Math.min(items.length - 1, active + 1))}
            disabled={active === items.length - 1}
            className="p-2 rounded-full border border-border bg-card text-foreground disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-transform"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

const VERDICT_CONFIG = {
  high: { icon: ShieldAlert, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40", label: "High Scam Risk", msg: "Multiple serious red flags. Don't send money, click links, or share codes — report it instead." },
  medium: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40", label: "Some Red Flags", msg: "Suspicious patterns found. Verify the sender through a separate, trusted channel before acting." },
  low: { icon: AlertTriangle, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/40", label: "Minor Indicators", msg: "A couple of things worth noting. Use your judgment and verify if unsure." },
  clear: { icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40", label: "No Obvious Red Flags", msg: "No known scam patterns detected — but that's never a full guarantee. Still verify anything unsolicited." },
} as const;

// The inline diagnostic that replaced the "Choose your path" tile picker.
// Reasoning: the #1 reason anyone lands on a scam-alert page is "I have a
// message and I'm not sure" — so give them a real answer using the SAME
// detection logic as the full /tools/ghana-scam-checker, right on this page,
// then hand off into the rest of the page (score, tools) instead of a
// generic self-sort that just scrolls people around.
function InlineScamCheck() {
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);

  const result = checked && input.trim() ? checkMessage(input) : null;
  const cfg = result ? VERDICT_CONFIG[result.verdict] : null;

  return (
    <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-xl p-5 md:p-6">
      <textarea
        value={input}
        onChange={(e) => { setInput(e.target.value); setChecked(false); }}
        placeholder="Paste the message here — e.g. 'Congratulations! You've won GHS 2,500 cashback, dial *170# to claim...'"
        rows={4}
        className="w-full bg-muted rounded-xl p-4 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button
          onClick={() => setChecked(true)}
          disabled={!input.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Shield className="w-4 h-4" /> Check it
        </button>
        <Link to="/tools/ghana-scam-checker" className="text-sm text-muted-foreground hover:text-primary transition-colors">Have a screenshot instead? Use the full checker →</Link>
      </div>

      {result && cfg && (
        <div className={cn("rounded-2xl border p-4 mt-5", cfg.bg)}>
          <div className="flex items-center gap-2.5 mb-2">
            <cfg.icon className={cn("w-5 h-5", cfg.color)} />
            <h3 className={cn("font-bold", cfg.color)}>{cfg.label}</h3>
          </div>
          <p className="text-sm text-foreground/80">{cfg.msg}</p>
          {result.indicators.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {result.indicators.slice(0, 3).map((ind, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="mt-1 w-1 h-1 rounded-full bg-current shrink-0" /> {ind.label}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => document.getElementById("score")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-sm font-medium text-foreground transition-colors">
              See your safety score <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {result.verdict === "high" && (
              <a href="tel:292" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors">Report to CSA (292)</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface TeaserStory {
  id: string;
  story_text: string;
  name_or_alias: string;
  region: string;
  country: string;
  scam_category: string;
}

const TEASER_ROTATIONS = [-2.5, 2, -1.5];

// Real approved stories, folded into the AWARENESS section (below the
// official alerts) as a sub-block — same beat, second voice — rather than
// a separate section competing with it. Client-side fetch only (no SSR
// loader) since this is supplementary; the full board handles crawlability
// on its own page. Renders nothing until real stories exist.
function StoryTeaser() {
  const [stories, setStories] = useState<TeaserStory[]>([]);

  useEffect(() => {
    supabase.from("security_scam_stories")
      .select("id,story_text,name_or_alias,region,country,scam_category")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setStories(data as TeaserStory[]); });
  }, []);

  if (stories.length === 0) return null;

  return (
    <div className="mt-16 pt-12 border-t border-border">
      <Reveal className="text-center mb-10">
        <span className="text-xs font-semibold tracking-[0.25em] uppercase text-rose-500/80">From people it's happened to</span>
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mt-3 tracking-tight">Real stories, from real Ghanaians</h3>
      </Reveal>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8 max-w-3xl mx-auto mb-10">
        {stories.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.08}>
            <div style={{ transform: `rotate(${TEASER_ROTATIONS[i % TEASER_ROTATIONS.length]}deg)` }}>
              <div className="w-3 h-3 rounded-full bg-rose-500 mx-auto -mb-1.5 relative top-1.5 shadow-md" />
              <div className="bg-white dark:bg-neutral-900 p-3 pb-4 rounded-sm shadow-[0_8px_20px_rgba(0,0,0,0.14)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                <p className="text-[13px] leading-snug text-neutral-800 dark:text-neutral-200 line-clamp-4" style={{ fontFamily: "Georgia, serif" }}>{s.story_text}</p>
                <div className="text-[11px] text-neutral-500 mt-2.5 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-700">
                  <div className="font-medium text-neutral-700 dark:text-neutral-300">— {s.name_or_alias}</div>
                  <div>{s.region}{s.country !== "Ghana" ? `, ${s.country}` : ""}</div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.2} className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/scam-stories" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500 text-white font-semibold shadow-lg shadow-rose-500/25 hover:bg-rose-600 transition-colors">Share your story <ArrowRight className="w-4 h-4" /></Link>
        <Link to="/scam-stories" className="inline-flex items-center gap-1.5 px-6 py-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 text-foreground font-medium transition-colors">See all stories</Link>
      </Reveal>
    </div>
  );
}

interface SecurityLoaderData {
  alerts: ScamAlert[];
  threat: ThreatLevel | null;
  articles: Article[];
  articleCount: number;
}

export default function Security() {
  // Build-time data (vite-react-ssg loader) seeds the scam alerts, threat
  // banner, and related articles into static HTML (2026-07-27 fix — this page
  // was previously 100% client-fetched across 3 separate useEffect calls, so
  // newly-added scam alerts didn't show up for crawlers). Client fetch below
  // still runs after hydration for freshness.
  const loaderData = useLoaderData() as SecurityLoaderData | null;

  const [alerts, setAlerts] = useState<ScamAlert[]>(loaderData?.alerts ?? []);
  const [threat, setThreat] = useState<ThreatLevel | null>(loaderData?.threat ?? null);
  const [articles, setArticles] = useState<Article[]>(loaderData?.articles ?? []);
  const [articleCount, setArticleCount] = useState(loaderData?.articleCount ?? 0);
  const [showNav, setShowNav] = useState(false);
  const [threatIdx, setThreatIdx] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState<ScamAlert | null>(null);
  // Read-only mirror of the real Cyber Risk Scorecard result, if this visitor
  // has taken it before — never a fake/hardcoded number. null until we know
  // there ISN'T one (SSR has no localStorage, so this starts undefined).
  const [riskScore, setRiskScore] = useState<StoredRiskScore | null | undefined>(undefined);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.15]);

  useEffect(() => {
    setRiskScore(getRiskScore());
  }, []);

  useEffect(() => {
    supabase.from("security_scam_alerts").select("id,title,description,scam_type,severity,emoji,what_to_do,affected_platforms,created_at")
      .eq("is_published", true).eq("is_active", true).order("created_at", { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setAlerts(data as ScamAlert[]); });

    supabase.from("security_threat_level").select("level,title,description,active_threats,updated_at")
      .order("updated_at", { ascending: false }).limit(1).single()
      .then(({ data }) => { if (data) setThreat(data as ThreatLevel); });

    supabase.from("articles").select("id,title,slug,excerpt,category,cover_image,created_at,tags,author")
      .eq("is_published", true).order("created_at", { ascending: false })
      .then(({ data }) => {
        const secTags = ["scam", "security", "phishing", "password", "privacy", "fraud", "cyber", "online safety"];
        const filtered = (data || []).filter((a: Article) =>
          (a.tags || []).some(t => secTags.some(s => t.toLowerCase().includes(s))) ||
          secTags.some(s => (a.category || "").toLowerCase().includes(s))
        );
        setArticles(filtered.slice(0, 6)); setArticleCount(filtered.length);
      });
  }, []);

  useEffect(() => {
    const onScroll = () => setShowNav(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cycle through the live active-threat headlines in the pill
  const activeThreats = threat?.active_threats?.filter(Boolean) || [];
  useEffect(() => {
    if (activeThreats.length < 2) return;
    const id = setInterval(() => setThreatIdx(i => (i + 1) % activeThreats.length), 3500);
    return () => clearInterval(id);
  }, [activeThreats.length]);

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const threatColor = threat?.level?.toLowerCase().includes("high") || threat?.level?.toLowerCase().includes("critical")
    ? "text-red-400" : threat?.level?.toLowerCase().includes("low") ? "text-emerald-400" : "text-amber-400";

  // Real freshness signal — the actual most-recent timestamp across alerts
  // and guides, never an invented "updated weekly" claim.
  const lastUpdated = [alerts[0]?.created_at, articles[0]?.created_at]
    .filter(Boolean)
    .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

  // Search across content already loaded on this page (alerts + security
  // guides) — no separate fetch, just a client-side filter.
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = searchQuery.trim().length >= 2 ? {
    alerts: alerts.filter(a => `${a.title} ${a.description}`.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4),
    articles: articles.filter(a => `${a.title} ${a.excerpt || ""}`.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4),
  } : null;
  const hasSearchResults = !!searchResults && (searchResults.alerts.length > 0 || searchResults.articles.length > 0);

  return (
    <Layout>
      <SEOHead title="Cyber Safety Hub — Stay Safe Online in Ghana" description="Plain-language online safety for Ghana — scams, MoMo fraud, passwords and privacy. Sourced from Ghana's CSA and SEC." canonical="/security" keywords={["cybersecurity", "online safety", "scam protection", "MoMo fraud", "phishing", "Ghana", "cyber awareness"]} />

      {/* Sticky in-page nav */}
      <div className={`fixed top-16 inset-x-0 z-30 transition-all duration-300 ${showNav ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}>
        <div className="container">
          <div className="mx-auto max-w-2xl mt-3 flex items-center gap-1 rounded-full bg-slate-900/90 backdrop-blur-xl border border-white/10 p-1.5 shadow-2xl">
            <span className="shrink-0 pl-2 pr-1 text-emerald-400"><Shield className="w-4 h-4" /></span>
            <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV.map(n => (
                <button key={n.id} onClick={() => jump(n.id)} className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap">{n.label}</button>
              ))}
            </div>
            <Link to="/report-scam" className="shrink-0 ml-auto px-3.5 py-1.5 rounded-full text-xs font-semibold bg-red-500/90 text-white hover:bg-red-500 transition-colors whitespace-nowrap">Report</Link>
          </div>
        </div>
      </div>

      {/* ───────── HERO — calm, premium, trust-forward ───────── */}
      <section ref={heroRef} className="relative overflow-hidden bg-[#070b14] flex items-center">
        {/* living gradient-mesh ambience: slow-drifting colour blobs + fine grid */}
        <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0">
          <motion.div className="absolute -top-32 -left-24 w-[40rem] h-[40rem] rounded-full bg-cyan-500/15 blur-[140px]"
            animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="absolute top-10 right-[-10rem] w-[44rem] h-[44rem] rounded-full bg-emerald-500/10 blur-[150px]"
            animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }} />
          <motion.div className="absolute bottom-[-12rem] left-1/3 w-[38rem] h-[38rem] rounded-full bg-blue-600/10 blur-[150px]"
            animate={{ x: [0, 40, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 6 }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "44px 44px", maskImage: "radial-gradient(ellipse at center, black, transparent 75%)" }} />
        </motion.div>

        <div className="container relative z-10 py-20 md:py-24">
          <div className="max-w-3xl">
            {/* live threat pill with timestamp */}
            <motion.button onClick={() => jump("now")} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="group inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md mb-7 hover:bg-white/10 transition-colors">
              <span className="relative flex h-2 w-2"><span className={`absolute inline-flex h-full w-full rounded-full ${threatColor.replace("text-", "bg-")} opacity-60 animate-ping`} /><span className={`relative inline-flex rounded-full h-2 w-2 ${threatColor.replace("text-", "bg-")}`} /></span>
              <span className="text-xs font-medium text-white/80">Threat level: <span className={`font-bold uppercase ${threatColor}`}>{threat?.level || "Moderate"}</span></span>
              {activeThreats.length > 0 ? (
                <span className="hidden sm:flex items-center gap-2 text-xs text-white/50 max-w-[20rem]">
                  <span className="w-px h-3 bg-white/15" />
                  <span className="relative inline-block min-w-0 truncate">
                    <motion.span key={threatIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4 }} className="inline-block truncate">{activeThreats[threatIdx]}</motion.span>
                  </span>
                </span>
              ) : (
                <span className="text-xs text-white/40">· updated {timeAgo(threat?.updated_at)}</span>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>

            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-black tracking-tight text-white leading-[1.1] mb-4">
              Ghana's record of online scams — <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300">kept current, kept honest</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-lg text-white/65 max-w-xl mb-7 leading-relaxed">
              Verified alerts, plain-language guides, and free tools — sourced from Ghana's Cyber Security Authority and SEC, reviewed before publication.
            </motion.p>

            {/* Search — the single most authority-signaling element: a
                reference should be searchable, not just scrollable. */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="relative max-w-xl mb-7">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search a scam, a number, or a topic — e.g. 'MTN cashback' or 'rental scam'"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/[0.07] border border-white/15 text-white placeholder:text-white/35 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:bg-white/10 transition-colors"
                />
              </div>
              {searchQuery.trim().length >= 2 && (
                <div className="absolute top-full mt-2 w-full rounded-2xl bg-slate-900/95 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden z-20 max-h-80 overflow-y-auto">
                  {hasSearchResults ? (
                    <>
                      {searchResults!.alerts.map(a => (
                        <button key={a.id} onClick={() => { setSelectedAlert(a); setSearchQuery(""); }} className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 flex items-start gap-3">
                          <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wide text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Alert</span>
                          <span className="text-sm text-white/85 leading-snug">{a.emoji ? `${a.emoji} ` : ""}{a.title}</span>
                        </button>
                      ))}
                      {searchResults!.articles.map(a => (
                        <Link key={a.id} to={`/blog/${a.slug}`} onClick={() => setSearchQuery("")} className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 flex items-start gap-3 block">
                          <span className="shrink-0 mt-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Guide</span>
                          <span className="text-sm text-white/85 leading-snug">{a.title}</span>
                        </Link>
                      ))}
                    </>
                  ) : (
                    <p className="px-4 py-4 text-sm text-white/45">No matches yet — try the full <Link to="/tools/ghana-scam-checker" onClick={() => setSearchQuery("")} className="text-emerald-300 hover:underline">Scam Checker</Link> to analyze a specific message.</p>
                  )}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="flex flex-wrap gap-3">
              <button onClick={() => jump("help")} className="cta-sheen group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.03] transition-all">
                <Siren className="w-5 h-5" /> Been scammed? Do this now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => jump("guides")} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/[0.06] border border-white/15 text-white font-medium backdrop-blur-md hover:bg-white/10 transition-colors">
                Read the safety guides
              </button>
            </motion.div>

            {/* stats — every number here is real and derived from live data,
                never invented for effect (e.g. no fake "trusted by X people"). */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-12 pt-7 border-t border-white/10">
              <div className="flex items-baseline gap-1.5">
                {articleCount > 0
                  ? <AnimatedCounter end={articleCount} duration={2} className="text-2xl font-bold text-white" />
                  : <span className="inline-block w-8 h-6 rounded bg-white/10 animate-pulse" />}
                <span className="text-sm text-white/45">safety guides</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <AnimatedCounter end={TOOLS.length} duration={1.5} className="text-2xl font-bold text-white" />
                <span className="text-sm text-white/45">free tools</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-semibold text-emerald-400">Updated</span>
                <span className="text-sm text-white/45">{lastUpdated ? timeAgo(lastUpdated) : "regularly"}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────── QUICK HELP / PANIC ───────── */}
      <section id="help" className="relative bg-[#070b14] pb-16 -mt-2 scroll-mt-24">
        <div className="container">
          <div className="rounded-3xl border border-red-500/25 bg-gradient-to-br from-red-950/40 to-rose-950/20 p-6 md:p-9 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center"><Siren className="w-6 h-6 text-red-400" /></div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">Been scammed, or think you have?</h2>
                <p className="text-white/55 mt-1">Don't panic. Move fast — these few steps limit the damage.</p>
                <div className="grid sm:grid-cols-2 gap-3 mt-6">
                  {[
                    { n: "1", t: "Stop now", d: "Send no more money, codes or PINs. Whatever the story, pause." },
                    { n: "2", t: "Freeze it", d: "Call your bank / mobile-money network to flag or block the account." },
                    { n: "3", t: "Report to CSA", d: "Cyber Security Authority — call or text 292 (free, 24/7)." },
                    { n: "4", t: "Investment scam?", d: "Report to the SEC on 0800 100 065 or info@sec.gov.gh." },
                  ].map((s, si) => (
                    <motion.div key={s.n} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: si * 0.1, duration: 0.45 }}
                      className="flex gap-3 rounded-2xl bg-white/[0.04] border border-white/10 p-4 hover:border-red-500/30 hover:bg-white/[0.07] transition-colors">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-red-500 text-white text-sm font-bold flex items-center justify-center">{s.n}</span>
                      <div><p className="font-semibold text-white">{s.t}</p><p className="text-sm text-white/55 mt-0.5">{s.d}</p></div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  <a href="tel:292" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"><Phone className="w-4 h-4" /> Call 292 now</a>
                  <Link to="/blog/how-to-stay-safe-online-in-ghana" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-medium hover:bg-white/15 transition-colors">Full step-by-step guide <ArrowRight className="w-4 h-4" /></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── INLINE SCAM CHECK — the actual reason most people land on
          this page: they have a message and aren't sure. Real verdict, not
          a mood-board tile picker; naturally hands off into Score/Tools. ───────── */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <Reveal className="text-center mb-8">
              <span className="text-xs font-semibold tracking-[0.25em] uppercase text-primary/70">Got something suspicious?</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 tracking-tight">Paste it. We'll check it now.</h2>
              <p className="text-muted-foreground mt-3">No signup, nothing saved — just a straight answer on the message you're holding.</p>
            </Reveal>
            <Reveal delay={0.1}>
              <InlineScamCheck />
            </Reveal>
            <Reveal delay={0.15} className="text-center mt-5">
              <p className="text-sm text-muted-foreground">
                Got kids online? Teach them to spot this stuff themselves —{" "}
                <a href="https://cyberabofra.com" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">CyberAbɔfra <ArrowRight className="inline w-3.5 h-3.5" /></a>{" "}
                makes online safety fun for kids.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── AWARENESS — official alerts + real stories merged into
          ONE beat: "this is real, current, and happening to people like you."
          Two sources (CSA + community) reinforcing the same proof point,
          instead of competing as separate sections. ───────── */}
      <section id="now" className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30 scroll-mt-24">
        <div className="container">
          <Reveal className="flex items-end justify-between gap-4 mb-8 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60 animate-ping" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" /></span><span className="text-xs font-bold tracking-[0.2em] uppercase text-red-500">Circulating now</span></div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">What's happening in Ghana right now</h2>
              <p className="text-muted-foreground mt-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Updated {timeAgo(alerts[0]?.created_at)} · verified by CSA, reported by the community</p>
            </div>
            <Link to="/scam-alerts" className="inline-flex items-center gap-1.5 text-primary font-medium hover:gap-2.5 transition-all">See all alerts <ArrowRight className="w-4 h-4" /></Link>
          </Reveal>
          {alerts.length > 0 ? (
            <>
              <MobileCarousel
                items={alerts}
                keyFn={(a) => a.id}
                accent="bg-red-500"
                renderItem={(a) => (
                  <button onClick={() => setSelectedAlert(a)} className="group h-full w-full text-left rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-5 active:scale-[0.98] transition-transform duration-150">
                    <div className="flex items-center gap-2 mb-3"><span className="relative flex h-2 w-2"><span className={`absolute inline-flex h-full w-full rounded-full ${SEVERITY[a.severity] || "bg-amber-500"} opacity-60 animate-ping`} /><span className={`relative inline-flex h-2 w-2 rounded-full ${SEVERITY[a.severity] || "bg-amber-500"}`} /></span><span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{a.scam_type}</span></div>
                    <h3 className="font-bold text-foreground leading-snug">{a.emoji ? `${a.emoji} ` : ""}{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 mt-3">Read full alert <ArrowRight className="w-3.5 h-3.5" /></span>
                  </button>
                )}
              />
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alerts.map((a, i) => (
                  <Reveal key={a.id} delay={(i % 3) * 0.08}>
                    <button onClick={() => setSelectedAlert(a)} className="group h-full w-full text-left rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-5 hover:border-red-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-3"><span className="relative flex h-2 w-2"><span className={`absolute inline-flex h-full w-full rounded-full ${SEVERITY[a.severity] || "bg-amber-500"} opacity-60 animate-ping`} /><span className={`relative inline-flex h-2 w-2 rounded-full ${SEVERITY[a.severity] || "bg-amber-500"}`} /></span><span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{a.scam_type}</span></div>
                      <h3 className="font-bold text-foreground leading-snug">{a.emoji ? `${a.emoji} ` : ""}{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.description}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 mt-3 group-hover:gap-1.5 transition-all">Read full alert <ArrowRight className="w-3.5 h-3.5" /></span>
                    </button>
                  </Reveal>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">No active alerts right now — check back, or <Link to="/report-scam" className="text-primary">report one you've seen</Link>.</div>
          )}

          <StoryTeaser />
        </div>
      </section>

      {/* ───────── SCORECARD CENTERPIECE ───────── */}
      <section id="score" className="py-16 md:py-24 bg-background scroll-mt-24">
        <div className="container">
          <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/10 p-8 md:p-12">
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />
            {/* floating constellation particles */}
            {[
              { l: "12%", t: "20%", d: 7, x: 14 }, { l: "28%", t: "70%", d: 9, x: -10 },
              { l: "70%", t: "18%", d: 8, x: 12 }, { l: "85%", t: "62%", d: 10, x: -14 },
              { l: "55%", t: "85%", d: 6, x: 8 }, { l: "40%", t: "30%", d: 11, x: -8 },
            ].map((p, i) => (
              <motion.span key={i} className="absolute w-1.5 h-1.5 rounded-full bg-emerald-300/40"
                style={{ left: p.l, top: p.t }}
                animate={{ y: [0, -16, 0], x: [0, p.x, 0], opacity: [0.25, 0.7, 0.25] }}
                transition={{ duration: p.d, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }} />
            ))}
            <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-4"><ShieldCheck className="w-3.5 h-3.5" /> 2-minute check</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">How safe are you online, really?</h2>
                <p className="text-white/60 mt-3 max-w-lg">
                  {riskScore
                    ? "Your last real result, from your own answers. Retake it any time to see if it's improved."
                    : "Answer a few quick questions and get your personal cyber-safety score — with exactly what to fix."}
                </p>
                <Link to="/tools/cyber-risk-scorecard" className="inline-flex items-center gap-2.5 mt-7 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 font-bold shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition-transform">
                  {riskScore ? "Retake the check" : "Check my score"} <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              {/* score ring — shows the visitor's OWN stored result if they've
                  taken the real assessment before, otherwise an honest empty
                  ring (never a fake pre-filled number). */}
              <div className="flex justify-center">
                <div className="relative w-48 h-48">
                  <motion.div className="absolute inset-2 rounded-full bg-emerald-400/20 blur-2xl"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
                  <svg viewBox="0 0 120 120" className="relative w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    {riskScore && (
                      <motion.circle cx="60" cy="60" r="52" fill="none" stroke="url(#g)" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray="327"
                        initial={{ strokeDashoffset: 327 }}
                        whileInView={{ strokeDashoffset: 327 - (riskScore.score / 100) * 327 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} />
                    )}
                    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#22d3ee" /></linearGradient></defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {riskScore ? (
                      <>
                        <AnimatedCounter end={riskScore.score} duration={1.5} className="text-5xl font-black text-white" />
                        <span className="text-xs text-white/50 mt-0.5">{timeAgo(riskScore.takenAt)}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-5xl font-black text-white/25">?</span>
                        <span className="text-xs text-white/50 mt-0.5">not checked yet</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── TOOLS ───────── */}
      <section id="tools" className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30 scroll-mt-24">
        <div className="container">
          <Reveal className="text-center mb-12"><span className="text-xs font-semibold tracking-[0.25em] uppercase text-primary/70">Hands-on</span><h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 tracking-tight">Free safety tools</h2><p className="text-muted-foreground mt-3">Quick checks you can run right now — no signup.</p></Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 0.07}><Link to={t.href} className="group flex items-start gap-4 h-full rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-5 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"><t.icon className="w-5 h-5 text-primary" /></div>
                <div><h3 className="font-semibold text-foreground">{t.name}</h3><p className="text-sm text-muted-foreground mt-0.5">{t.desc}</p></div>
              </Link></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── DAILY CHECK ───────── */}
      <section id="daily" className="py-16 md:py-20 bg-background scroll-mt-24">
        <div className="container">
          <Reveal className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-3"><Flame className="w-3.5 h-3.5" /> Come back daily</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Your daily safety boost</h2>
            <p className="text-muted-foreground mt-2">A fresh tip and a quick quiz every day — build your streak.</p>
          </Reveal>
          <div className="grid lg:grid-cols-3 gap-5 items-start">
            <DailyTip />
            <DailyQuizWidget />
            <ShareWithFamily />
          </div>
        </div>
      </section>

      {/* ───────── GUIDES ───────── */}
      <section id="guides" className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30 scroll-mt-24">
        <div className="container">
          <Reveal className="flex items-end justify-between gap-4 mb-8 flex-wrap">
            <div><h2 className="text-3xl md:text-4xl font-bold text-foreground">Safety guides</h2><p className="text-muted-foreground mt-2">Plain-English, made for real, everyday life.</p></div>
            <Link to="/blog?category=Security" className="inline-flex items-center gap-1.5 text-primary font-medium hover:gap-2.5 transition-all">All {articleCount || ""} guides <ArrowRight className="w-4 h-4" /></Link>
          </Reveal>
          <MobileCarousel
            items={articles}
            keyFn={(a) => a.id}
            accent="bg-primary"
            renderItem={(a) => (
              <Link to={`/blog/${a.slug}`} className="group block h-full rounded-2xl border border-border bg-card overflow-hidden active:scale-[0.98] transition-transform duration-150">
                {a.cover_image && <div className="aspect-[16/9] overflow-hidden bg-muted"><img src={a.cover_image} alt={a.title} className="w-full h-full object-cover" loading="lazy" /></div>}
                <div className="p-5">
                  <h3 className="font-bold text-foreground leading-snug line-clamp-2">{a.title}</h3>
                  {a.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.excerpt}</p>}
                  <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" /> Updated {new Date(a.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    <span className="text-border">·</span> {a.author || "Edmund A."}
                  </div>
                </div>
              </Link>
            )}
          />
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map(a => (
              <Link key={a.id} to={`/blog/${a.slug}`} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                {a.cover_image && <div className="aspect-[16/9] overflow-hidden bg-muted"><img src={a.cover_image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /></div>}
                <div className="p-5">
                  <h3 className="font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">{a.title}</h3>
                  {a.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.excerpt}</p>}
                  <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" /> Updated {new Date(a.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    <span className="text-border">·</span> {a.author || "Edmund A."}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8">Written by <span className="font-medium text-foreground">Edmund A.</span> · reviewed by the TechTrendi team · sources: Ghana CSA, SEC</p>
        </div>
      </section>

      {/* ───────── CONSOLIDATED CTA ───────── */}
      <section className="py-16 bg-gradient-to-br from-emerald-600 via-cyan-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <Reveal className="container relative text-center">
          <Flame className="w-10 h-10 text-white/90 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-white">Get the weekly safety alert</h2>
          <p className="text-white/80 mt-2 max-w-xl mx-auto">One short message a week — the scams going round and how to dodge them. Free, and you can stop any time.</p>
          <Link to="/newsletter" className="cta-sheen inline-flex items-center gap-2 mt-7 px-7 py-3.5 rounded-2xl bg-white text-slate-900 font-bold hover:scale-[1.03] transition-transform">Subscribe free <ArrowRight className="w-5 h-5" /></Link>
        </Reveal>
      </section>

      {/* ───────── SCAM ALERT MODAL ───────── */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAlert(null)} />
            <motion.div className="relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl"
              initial={{ y: 40, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.97 }} transition={{ type: "spring", damping: 26, stiffness: 280 }}>
              {/* header */}
              <div className="sticky top-0 flex items-start justify-between gap-3 p-5 bg-card/95 backdrop-blur border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5"><span className={`absolute inline-flex h-full w-full rounded-full ${SEVERITY[selectedAlert.severity] || "bg-amber-500"} opacity-60 animate-ping`} /><span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${SEVERITY[selectedAlert.severity] || "bg-amber-500"}`} /></span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{selectedAlert.scam_type} · {selectedAlert.severity} risk</span>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="shrink-0 p-1.5 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
              </div>
              {/* body */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground leading-snug">{selectedAlert.emoji ? `${selectedAlert.emoji} ` : ""}{selectedAlert.title}</h3>
                {selectedAlert.affected_platforms && selectedAlert.affected_platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedAlert.affected_platforms.map(p => (
                      <span key={p} className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">{p}</span>
                    ))}
                  </div>
                )}
                <p className="text-[15px] text-muted-foreground leading-relaxed mt-4 whitespace-pre-line">{selectedAlert.description}</p>
                {selectedAlert.what_to_do && (
                  <div className="mt-5 rounded-2xl border-l-4 border-emerald-500 bg-emerald-500/10 p-4">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> What to do</p>
                    <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed whitespace-pre-line">{selectedAlert.what_to_do}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-6">
                  <a href="tel:292" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"><Phone className="w-4 h-4" /> Report to CSA (292)</a>
                  <Link to="/scam-alerts" onClick={() => setSelectedAlert(null)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-muted/70 transition-colors">See all alerts <ArrowRight className="w-4 h-4" /></Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
