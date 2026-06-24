import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { DailyTip } from "@/components/security/DailyTip";
import { DailyQuizWidget } from "@/components/security/DailyQuizWidget";
import { ShareWithFamily } from "@/components/security/ShareWithFamily";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import {
  Shield, ShieldAlert, ShieldCheck, KeyRound, Lock, EyeOff, Globe, AlertTriangle,
  Smartphone, CreditCard, Phone, ArrowRight, Sparkles, Users, Brain, Baby,
  CheckCircle2, Flame, Clock, ExternalLink, Siren, ChevronRight,
} from "lucide-react";

// ── data shapes ──────────────────────────────────────────────────────────────
interface ScamAlert { id: string; title: string; description: string; scam_type: string; severity: string; }
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

const LANES = [
  { id: "new", label: "New to this", sub: "Start simple", icon: Baby, color: "from-emerald-400 to-teal-500", href: "/blog/how-to-stay-safe-online-in-ghana" },
  { id: "essentials", label: "The essentials", sub: "The must-dos", icon: CheckCircle2, color: "from-blue-400 to-indigo-500", href: "/blog?category=Security" },
  { id: "techie", label: "Tech-savvy", sub: "Deep dives", icon: Brain, color: "from-purple-400 to-violet-500", href: "/blog/sim-swap-fraud-ghana" },
  { id: "family", label: "Family & Kids", sub: "Teach the young ones", icon: Users, color: "from-amber-400 to-orange-500", href: "https://cyberabofra.com", external: true },
];

const NAV = [
  { id: "help", label: "Quick Help" },
  { id: "now", label: "Scams Now" },
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

export default function Security() {
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [threat, setThreat] = useState<ThreatLevel | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleCount, setArticleCount] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const [threatIdx, setThreatIdx] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.15]);

  useEffect(() => {
    supabase.from("security_scam_alerts").select("id,title,description,scam_type,severity")
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

  return (
    <Layout>
      <SEOHead title="Cyber Safety Hub — Stay Safe Online in Ghana" description="Plain-language online safety for Ghana — scams, MoMo fraud, passwords and privacy. Sourced from Ghana's CSA and SEC." canonical="/security" keywords={["cybersecurity", "online safety", "scam protection", "MoMo fraud", "phishing", "Ghana", "cyber awareness"]} />

      {/* Sticky in-page nav */}
      <div className={`fixed top-16 inset-x-0 z-30 transition-all duration-300 ${showNav ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}>
        <div className="container">
          <div className="mx-auto max-w-2xl mt-3 flex items-center gap-1 rounded-full bg-slate-900/90 backdrop-blur-xl border border-white/10 p-1.5 shadow-2xl overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 pl-2 pr-1 text-emerald-400"><Shield className="w-4 h-4" /></span>
            {NAV.map(n => (
              <button key={n.id} onClick={() => jump(n.id)} className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap">{n.label}</button>
            ))}
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

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.05] mb-5">
              <motion.span className="inline-block" initial="hidden" animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}>
                {"Stay safe online —".split(" ").map((w, i) => (
                  <motion.span key={i} className="inline-block mr-[0.25em]"
                    variants={{ hidden: { opacity: 0, y: 22, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}>{w}</motion.span>
                ))}
                <br />
                {"the simple way,".split(" ").map((w, i) => (
                  <motion.span key={`b${i}`} className="inline-block mr-[0.25em]"
                    variants={{ hidden: { opacity: 0, y: 22, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}>{w}</motion.span>
                ))}
                <motion.span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300"
                  variants={{ hidden: { opacity: 0, y: 22, filter: "blur(6px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}>for Ghana</motion.span>
              </motion.span>
            </h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="text-lg text-white/65 max-w-xl mb-9 leading-relaxed">
              Scams, MoMo fraud, dodgy links — explained in plain language
              you can act on. <span className="text-white/90 font-medium">No jargon, no fear.</span>
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-3">
              <button onClick={() => jump("help")} className="cta-sheen group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.03] transition-all">
                <Siren className="w-5 h-5" /> Been scammed? Do this now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => jump("guides")} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/[0.06] border border-white/15 text-white font-medium backdrop-blur-md hover:bg-white/10 transition-colors">
                Read the safety guides
              </button>
            </motion.div>

            {/* stats — skeleton while loading, never "..." */}
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
                <span className="text-base font-semibold text-emerald-400">Fresh</span>
                <span className="text-sm text-white/45">updated weekly</span>
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

      {/* ───────── AUDIENCE LANES ───────── */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-semibold tracking-[0.25em] uppercase text-primary/70">Choose your path</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 tracking-tight">Where do you want to start?</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">Pick your lane — every level is welcome here.</p>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {LANES.map((lane, i) => {
              const Inner = (
                <div className="group relative h-full rounded-3xl border border-border bg-card/70 backdrop-blur-xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)]">
                  {/* gradient ring on hover */}
                  <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${lane.color}`} style={{ padding: "1px", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
                  <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-br ${lane.color} opacity-[0.08] blur-2xl group-hover:opacity-20 transition-opacity`} />
                  <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${lane.color} flex items-center justify-center shadow-lg mb-4 transition-transform group-hover:scale-110 group-hover:rotate-6`}><lane.icon className="w-6 h-6 text-white transition-transform group-hover:scale-110" /></div>
                  <h3 className="relative font-bold text-foreground text-lg">{lane.label}</h3>
                  <p className="relative text-sm text-muted-foreground mt-1">{lane.sub}</p>
                  <span className="relative inline-flex items-center gap-1 text-sm font-medium text-primary mt-4">{lane.external ? "Visit CyberAbɔfra" : "Start"} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                </div>
              );
              return (
                <Reveal key={lane.id} delay={i * 0.08} className="h-full">
                  {lane.external
                    ? <a href={lane.href} target="_blank" rel="noopener noreferrer" className="block h-full">{Inner}</a>
                    : <Link to={lane.href} className="block h-full">{Inner}</Link>}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── SCAMS NOW ───────── */}
      <section id="now" className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30 scroll-mt-24">
        <div className="container">
          <Reveal className="flex items-end justify-between gap-4 mb-8 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60 animate-ping" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" /></span><span className="text-xs font-bold tracking-[0.2em] uppercase text-red-500">Circulating now</span></div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Scams going round in Ghana</h2>
              <p className="text-muted-foreground mt-2 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Updated {timeAgo(threat?.updated_at)} · from CSA alerts</p>
            </div>
            <Link to="/security#alerts" className="inline-flex items-center gap-1.5 text-primary font-medium hover:gap-2.5 transition-all">See all alerts <ArrowRight className="w-4 h-4" /></Link>
          </Reveal>
          {alerts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((a, i) => (
                <Reveal key={a.id} delay={(i % 3) * 0.08}><div className="group h-full rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-5 hover:border-red-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3"><span className="relative flex h-2 w-2"><span className={`absolute inline-flex h-full w-full rounded-full ${SEVERITY[a.severity] || "bg-amber-500"} opacity-60 animate-ping`} /><span className={`relative inline-flex h-2 w-2 rounded-full ${SEVERITY[a.severity] || "bg-amber-500"}`} /></span><span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{a.scam_type}</span></div>
                  <h3 className="font-bold text-foreground leading-snug">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{a.description}</p>
                </div></Reveal>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">No active alerts right now — check back, or <Link to="/report-scam" className="text-primary">report one you've seen</Link>.</div>
          )}
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
                <p className="text-white/60 mt-3 max-w-lg">Answer a few quick questions and get your personal cyber-safety score — with exactly what to fix. Come back any time to watch it improve.</p>
                <Link to="/tools/cyber-risk-scorecard" className="inline-flex items-center gap-2.5 mt-7 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 font-bold shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition-transform">Check my score <ArrowRight className="w-5 h-5" /></Link>
              </div>
              {/* score ring — draws on + counts up when scrolled into view */}
              <div className="flex justify-center">
                <div className="relative w-48 h-48">
                  {/* soft pulsing halo */}
                  <motion.div className="absolute inset-2 rounded-full bg-emerald-400/20 blur-2xl"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
                  <svg viewBox="0 0 120 120" className="relative w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    <motion.circle cx="60" cy="60" r="52" fill="none" stroke="url(#g)" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray="327"
                      initial={{ strokeDashoffset: 327 }}
                      whileInView={{ strokeDashoffset: 98 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} />
                    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#22d3ee" /></linearGradient></defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatedCounter end={70} duration={2} className="text-5xl font-black text-white" />
                    <span className="text-xs text-white/50 mt-0.5">your score?</span>
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
            <div><h2 className="text-3xl md:text-4xl font-bold text-foreground">Safety guides</h2><p className="text-muted-foreground mt-2">Plain-English, made for real Ghanaian life.</p></div>
            <Link to="/blog?category=Security" className="inline-flex items-center gap-1.5 text-primary font-medium hover:gap-2.5 transition-all">All {articleCount || ""} guides <ArrowRight className="w-4 h-4" /></Link>
          </Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
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
    </Layout>
  );
}
