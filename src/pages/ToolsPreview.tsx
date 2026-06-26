import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Calculator, Shield, Zap, TrendingUp, Send, Lock, QrCode,
  Image as ImageIcon, Terminal, ChevronLeft, ChevronRight, Sparkles,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { cn } from "@/lib/utils";

/* ============================================================================
   TOOLS SECTION — 10 design previews.
   This is a throwaway showcase page (/tools-preview, noindex). Browse all ten,
   pick the winner, and it gets ported into the homepage. Uses the real flagship
   tools + categories so each concept shows true content.
   ========================================================================== */

const FLAGSHIP = [
  { title: "Ghana Tax Calculator", cmd: "ghana-tax-calculator", short: "PAYE, SSNIT & take-home pay (2026 GRA bands)", icon: Calculator, gradient: "from-green-600 to-emerald-700", href: "/tools/ghana-tax-calculator" },
  { title: "Ghana Scam Checker", cmd: "scam-checker", short: "Check a suspicious message before you reply", icon: Shield, gradient: "from-cyan-500 to-blue-600", href: "/tools/ghana-scam-checker" },
  { title: "MoMo Fee Calculator", cmd: "momo-fee-calc", short: "Exact MTN & AT Money fees — E-Levy removed", icon: Calculator, gradient: "from-yellow-400 to-orange-500", href: "/tools/momo-fee-calculator" },
  { title: "ECG Bill Estimator", cmd: "ecg-bill-estimator", short: "Estimate your electricity bill (PURC 2026)", icon: Zap, gradient: "from-amber-500 to-yellow-600", href: "/tools/ecg-bill-estimator" },
];

const EXTRA = [
  { title: "Password Generator", icon: Lock, gradient: "from-rose-500 to-pink-600", href: "/tools/password-generator" },
  { title: "QR Code Generator", icon: QrCode, gradient: "from-violet-500 to-purple-600", href: "/tools/qr-generator" },
  { title: "Image Compressor", icon: ImageIcon, gradient: "from-sky-500 to-indigo-600", href: "/tools/image-compressor" },
];

const CATEGORIES = [
  { id: "business", title: "Business & Freelancer", description: "Invoicing, calculators, and money tools for hustlers and small businesses", icon: TrendingUp, gradient: "from-green-500 to-emerald-600", count: 28 },
  { id: "security", title: "Security & Privacy", description: "Scam checkers, password tools, and privacy utilities to keep you safe", icon: Shield, gradient: "from-cyan-500 to-blue-600", count: 7 },
  { id: "productivity", title: "Productivity", description: "Timers, trackers, journals and tools to supercharge your daily workflow", icon: Zap, gradient: "from-yellow-400 to-orange-500", count: 22 },
  { id: "creator", title: "Creator & Marketing", description: "Content tools, caption generators, and analytics for creators", icon: Send, gradient: "from-purple-400 to-pink-500", count: 23 },
];

const ALL = [...FLAGSHIP, ...EXTRA];

function Wrap({ n, title, blurb, children }: { n: number; title: string; blurb: string; children: React.ReactNode }) {
  return (
    <section className="py-14 border-b border-dashed border-border/60">
      <div className="container">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="text-5xl font-black text-muted-foreground/20 leading-none">{String(n).padStart(2, "0")}</span>
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{blurb}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

/* ---------- 1. Terminal / Command Palette ---------- */
function Design1() {
  const [typed, setTyped] = useState("");
  const full = "ghana-tax-calculator";
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setTyped(full.slice(0, i));
      i = i >= full.length ? 0 : i + 1;
    }, 160);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700 bg-[#0d1117] shadow-2xl font-mono text-sm max-w-3xl mx-auto">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border-b border-slate-700">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-500" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 text-slate-400 text-xs">techtrendi://tools — 130+ free</span>
        <Terminal className="w-3.5 h-3.5 text-slate-500 ml-auto" />
      </div>
      <div className="p-5 space-y-2.5">
        {FLAGSHIP.map((t) => (
          <Link key={t.href} to={t.href} className="block group">
            <div className="text-emerald-400">$ run <span className="text-white group-hover:underline">{t.cmd}</span></div>
            <div className="text-slate-500 pl-3">&gt; {t.short}</div>
          </Link>
        ))}
        <div className="text-slate-300 pt-1">
          $ <span className="text-cyan-400">{typed}</span><span className="inline-block w-2 h-4 bg-cyan-400 ml-0.5 animate-pulse align-middle" />
          <span className="float-right text-xs text-slate-600 border border-slate-700 rounded px-1.5">⌘K</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- 2. Bento Grid ---------- */
function Design2() {
  const hero = FLAGSHIP[1];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[120px] gap-4 max-w-4xl mx-auto">
      <Link to={hero.href} className={cn("col-span-2 row-span-2 rounded-3xl p-6 text-white flex flex-col justify-between bg-gradient-to-br hover:scale-[1.02] transition-transform", hero.gradient)}>
        <hero.icon className="w-10 h-10" />
        <div>
          <h3 className="text-2xl font-black">{hero.title}</h3>
          <p className="text-white/80 text-sm">{hero.short}</p>
        </div>
      </Link>
      {[FLAGSHIP[0], FLAGSHIP[2]].map((t) => (
        <Link key={t.href} to={t.href} className="col-span-2 md:col-span-1 row-span-1 rounded-3xl p-4 bg-card border border-border flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <t.icon className="w-6 h-6 text-primary" />
          <span className="font-bold text-sm text-foreground leading-tight">{t.title}</span>
        </Link>
      ))}
      <Link to={FLAGSHIP[3].href} className="rounded-3xl p-4 bg-card border border-border flex flex-col justify-between hover:-translate-y-1 transition-transform">
        {(() => { const I = FLAGSHIP[3].icon; return <I className="w-6 h-6 text-primary" />; })()}
        <span className="font-bold text-sm text-foreground leading-tight">{FLAGSHIP[3].title}</span>
      </Link>
      <div className="rounded-3xl p-4 bg-gradient-to-br from-primary to-purple-600 text-white flex flex-col justify-center items-center">
        <span className="text-3xl font-black">130+</span>
        <span className="text-xs text-white/80">free tools</span>
      </div>
      <Link to="/tools" className="col-span-2 md:col-span-1 rounded-3xl p-4 bg-foreground text-background flex items-center justify-center gap-2 font-bold hover:opacity-90 transition-opacity">
        All tools <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ---------- 3. Phone / App Drawer ---------- */
function Design3() {
  return (
    <div className="mx-auto w-[300px] rounded-[2.5rem] border-[10px] border-slate-900 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-2 text-[10px] text-white/80">
        <span>9:41</span>
        <span className="flex items-center gap-1">●●● 🔋</span>
      </div>
      <div className="px-5 pt-3 pb-6">
        <div className="grid grid-cols-4 gap-y-5 gap-x-2">
          {ALL.map((t) => (
            <Link key={t.href} to={t.href} className="flex flex-col items-center gap-1 group">
              <span className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-active:scale-90 transition-transform", t.gradient)}>
                <t.icon className="w-6 h-6 text-white" />
              </span>
              <span className="text-[9px] text-white/90 text-center leading-tight line-clamp-2">{t.title.replace("Ghana ", "").replace(" Calculator", "").replace(" Generator", "")}</span>
            </Link>
          ))}
        </div>
        <div className="flex justify-center gap-1.5 mt-6">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>
        <div className="mx-auto mt-3 w-28 h-1 rounded-full bg-white/40" />
      </div>
    </div>
  );
}

/* ---------- 4. Interactive Map / Constellation ---------- */
function Design4() {
  const [hover, setHover] = useState<number | null>(null);
  const nodes = [
    { x: 50, y: 15 }, { x: 82, y: 40 }, { x: 70, y: 80 }, { x: 30, y: 80 }, { x: 18, y: 40 },
  ];
  return (
    <div className="relative max-w-2xl mx-auto h-80 rounded-3xl bg-[#0a0e1a] border border-slate-800 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.map((n, i) => {
          const next = nodes[(i + 1) % nodes.length];
          return <line key={i} x1={n.x} y1={n.y} x2={next.x} y2={next.y} stroke={hover === i || hover === (i + 1) % nodes.length ? "#22d3ee" : "#1e293b"} strokeWidth="0.4" />;
        })}
        <circle cx="50" cy="50" r="1" fill="#22d3ee" />
        {nodes.map((n, i) => <line key={`c${i}`} x1="50" y1="50" x2={n.x} y2={n.y} stroke="#1e293b" strokeWidth="0.2" strokeDasharray="1 1" />)}
      </svg>
      {ALL.slice(0, 5).map((t, i) => (
        <Link
          key={t.href}
          to={t.href}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
          style={{ left: `${nodes[i].x}%`, top: `${nodes[i].y}%` }}
        >
          <span className={cn("w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg ring-2 ring-transparent group-hover:ring-cyan-400 group-hover:scale-110 transition-all", t.gradient)}>
            <t.icon className="w-5 h-5 text-white" />
          </span>
          <span className="text-[10px] text-white/80 whitespace-nowrap">{t.title.split(" ")[0]}</span>
        </Link>
      ))}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono text-cyan-400/70 mt-8">130+ connected</span>
    </div>
  );
}

/* ---------- 5. Slot / Coverflow Reel ---------- */
function Design5() {
  const [idx, setIdx] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % FLAGSHIP.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-64 flex items-center justify-center overflow-hidden">
      {FLAGSHIP.map((t, i) => {
        const off = i - idx;
        return (
          <Link
            key={t.href}
            to={t.href}
            className={cn("absolute w-56 rounded-3xl p-6 text-white bg-gradient-to-br transition-all duration-500 ease-out", t.gradient)}
            style={{
              transform: `translateX(${off * 170}px) scale(${off === 0 ? 1 : 0.8}) rotateY(${off * -18}deg)`,
              opacity: Math.abs(off) > 1 ? 0 : off === 0 ? 1 : 0.45,
              zIndex: 10 - Math.abs(off),
            }}
          >
            <t.icon className="w-9 h-9 mb-4" />
            <h3 className="text-lg font-black leading-tight">{t.title}</h3>
            <p className="text-white/80 text-xs mt-1">{t.short}</p>
          </Link>
        );
      })}
      <div className="absolute bottom-0 flex gap-1.5">
        {FLAGSHIP.map((_, i) => <span key={i} className={cn("w-2 h-2 rounded-full transition-colors", i === idx ? "bg-primary" : "bg-border")} />)}
      </div>
    </div>
  );
}

/* ---------- 6. Toolbox / Drawers ---------- */
function Design6() {
  const [open, setOpen] = useState<number | null>(0);
  const drawers = [
    { label: "🇬🇭 Ghana-only tools", items: FLAGSHIP },
    { label: "Security & Privacy", items: [EXTRA[0], FLAGSHIP[1]] },
    { label: "Everyday utilities", items: EXTRA },
  ];
  return (
    <div className="max-w-xl mx-auto rounded-2xl border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 p-3 shadow-2xl">
      <div className="text-center text-xs font-bold tracking-[0.3em] text-slate-400 uppercase mb-3">The Toolbox</div>
      {drawers.map((d, i) => (
        <div key={i} className="mb-2 rounded-lg bg-slate-700/50 border border-slate-600 overflow-hidden">
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 text-left text-white text-sm font-semibold hover:bg-slate-700">
            <span className="flex items-center gap-2"><span className="w-8 h-1.5 rounded-full bg-slate-500" /> {d.label}</span>
            <ChevronRight className={cn("w-4 h-4 transition-transform", open === i && "rotate-90")} />
          </button>
          <div className={cn("grid transition-all duration-300", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden">
              <div className="flex flex-wrap gap-2 p-3 bg-slate-900/40">
                {d.items.map((t) => (
                  <Link key={t.href} to={t.href} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br text-white text-xs font-medium hover:scale-105 transition-transform", t.gradient)}>
                    <t.icon className="w-4 h-4" /> {t.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 7. Live Dashboard ---------- */
function Design7() {
  const stats = [
    { t: FLAGSHIP[0], uses: "892", trend: "+12%" },
    { t: FLAGSHIP[1], uses: "1.2k", trend: "+34%" },
    { t: FLAGSHIP[2], uses: "640", trend: "+8%" },
    { t: FLAGSHIP[3], uses: "415", trend: "+19%" },
  ];
  return (
    <div className="max-w-3xl mx-auto rounded-3xl bg-[#0d1117] border border-slate-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>
        <span className="font-mono text-xs text-emerald-400">LIVE · 4,203 tools used today</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ t, uses, trend }) => (
          <Link key={t.href} to={t.href} className="rounded-xl bg-slate-800/60 border border-slate-700 p-3 hover:border-cyan-500 transition-colors">
            <t.icon className="w-5 h-5 text-cyan-400 mb-2" />
            <div className="text-white text-sm font-bold leading-tight">{t.title.split(" ").slice(0, 2).join(" ")}</div>
            <div className="flex items-center justify-between mt-2 font-mono text-[11px]">
              <span className="text-slate-400">{uses} uses</span>
              <span className="text-emerald-400">{trend}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4 overflow-hidden whitespace-nowrap border-t border-slate-800 pt-3">
        <div className="inline-block font-mono text-[11px] text-slate-500 animate-[marquee_12s_linear_infinite]">
          ⋯ MoMo Fee Calc · ECG Bill · QR Generator · Password Gen · Image Compressor · Scam Checker · Tax Calculator ⋯ &nbsp;&nbsp; ⋯ MoMo Fee Calc · ECG Bill · QR Generator ⋯
        </div>
      </div>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

/* ---------- 8. Receipt ---------- */
function Design8() {
  return (
    <div className="max-w-xs mx-auto bg-white text-slate-900 font-mono text-sm shadow-2xl p-6" style={{ clipPath: "polygon(0 0,100% 0,100% 97%,96% 100%,92% 97%,88% 100%,84% 97%,80% 100%,76% 97%,72% 100%,68% 97%,64% 100%,60% 97%,56% 100%,52% 97%,48% 100%,44% 97%,40% 100%,36% 97%,32% 100%,28% 97%,24% 100%,20% 97%,16% 100%,12% 97%,8% 100%,4% 97%,0 100%)" }}>
      <div className="text-center font-bold tracking-widest">*** TECHTRENDI ***</div>
      <div className="text-center text-xs text-slate-500 mb-3">FREE TOOLS RECEIPT</div>
      <div className="border-t border-dashed border-slate-400 my-2" />
      {ALL.map((t) => (
        <Link key={t.href} to={t.href} className="flex justify-between py-1 hover:bg-slate-100">
          <span className="truncate">{t.title}</span>
          <span className="text-green-600 font-bold shrink-0 ml-2">FREE</span>
        </Link>
      ))}
      <div className="border-t border-dashed border-slate-400 my-2" />
      <div className="flex justify-between font-bold"><span>TOTAL</span><span>GH₵0.00</span></div>
      <div className="text-center text-[10px] text-slate-500 mt-3">~ no signup, no catch ~<br />130+ items available</div>
      <div className="text-center text-[8px] tracking-widest mt-2">▌▌▍▌▍▍▌▌▍▌▍▌▌▍▌▌▍▌▍▌▌</div>
    </div>
  );
}

/* ---------- 9. Stacked Swipe Deck ---------- */
function Design9() {
  const [order, setOrder] = useState([0, 1, 2, 3]);
  const send = () => setOrder((o) => [...o.slice(1), o[0]]);
  return (
    <div className="relative h-72 max-w-xs mx-auto">
      {order.map((fi, pos) => {
        const t = FLAGSHIP[fi];
        return (
          <div
            key={fi}
            className={cn("absolute inset-x-0 mx-auto w-64 h-60 rounded-3xl p-6 text-white bg-gradient-to-br shadow-xl transition-all duration-300", t.gradient)}
            style={{ transform: `translateY(${pos * 14}px) scale(${1 - pos * 0.05})`, zIndex: 10 - pos, opacity: pos > 2 ? 0 : 1 }}
          >
            <t.icon className="w-10 h-10 mb-4" />
            <h3 className="text-xl font-black leading-tight">{t.title}</h3>
            <p className="text-white/80 text-sm mt-1">{t.short}</p>
            {pos === 0 && (
              <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between">
                <Link to={t.href} className="text-sm font-bold underline">Open</Link>
                <button onClick={send} className="text-xs bg-white/20 rounded-full px-3 py-1.5 hover:bg-white/30">Next →</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 10. Magazine / Editorial ---------- */
function Design10() {
  const feat = FLAGSHIP[1];
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-baseline justify-between border-b-2 border-foreground pb-2 mb-6">
        <span className="text-xs font-black tracking-[0.3em] uppercase">Tools</span>
        <span className="text-xs font-mono text-muted-foreground">ISSUE '26 · 130+ FREE</span>
      </div>
      <div className="grid md:grid-cols-5 gap-8">
        <Link to={feat.href} className="md:col-span-3 group">
          <div className={cn("rounded-2xl aspect-[4/3] bg-gradient-to-br flex items-center justify-center mb-3", feat.gradient)}>
            <feat.icon className="w-20 h-20 text-white" />
          </div>
          <div className="flex gap-3">
            <span className="text-5xl font-black leading-none">01</span>
            <div>
              <h3 className="text-2xl font-black leading-tight group-hover:underline">{feat.title}</h3>
              <p className="text-muted-foreground text-sm">{feat.short}</p>
            </div>
          </div>
        </Link>
        <div className="md:col-span-2 space-y-5">
          {[FLAGSHIP[0], FLAGSHIP[2], FLAGSHIP[3]].map((t, i) => (
            <Link key={t.href} to={t.href} className="flex gap-3 group border-b border-border pb-4">
              <span className="text-2xl font-black text-muted-foreground/40">{String(i + 2).padStart(2, "0")}</span>
              <div>
                <h4 className="font-bold leading-tight group-hover:underline">{t.title}</h4>
                <p className="text-xs text-muted-foreground">{t.short}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ToolsPreview() {
  return (
    <Layout>
      <SEOHead title="Tools Section — Design Previews" description="Internal design previews." canonical="/tools-preview" noindex />
      <div className="bg-gradient-to-b from-primary/5 to-background py-12 text-center">
        <div className="container">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-3">
            <Sparkles className="w-4 h-4" /> 10 concepts · pick your favourite
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-foreground">"Free Tools" Section — Design Lab</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Ten totally different ways to show the tools. Tell me the number(s) you like and I'll put it on the homepage.</p>
        </div>
      </div>

      <Wrap n={1} title="Terminal / Command Palette" blurb="Runs like a dev console. Typed commands, blinking cursor, ⌘K.">{<Design1 />}</Wrap>
      <Wrap n={2} title="Bento Grid (Apple-style)" blurb="Asymmetric interlocking tiles — one hero, smaller around it.">{<Design2 />}</Wrap>
      <Wrap n={3} title="Phone / App Drawer" blurb="Looks like a phone home screen. App icons + labels.">{<Design3 />}</Wrap>
      <Wrap n={4} title="Interactive Constellation Map" blurb="Tools as connected glowing nodes. Hover lights the path.">{<Design4 />}</Wrap>
      <Wrap n={5} title="Coverflow Reel" blurb="Auto-rotating 3D carousel with a centre spotlight.">{<Design5 />}</Wrap>
      <Wrap n={6} title="Toolbox Drawers" blurb="Drawers that slide open to reveal the tools inside.">{<Design6 />}</Wrap>
      <Wrap n={7} title="Live Mission-Control Dashboard" blurb="Widgets with live stats + a scrolling ticker.">{<Design7 />}</Wrap>
      <Wrap n={8} title="MoMo Receipt" blurb="Styled like a printed receipt — every tool priced FREE.">{<Design8 />}</Wrap>
      <Wrap n={9} title="Stacked Swipe Deck" blurb="A deck of cards; send the top one back to see the next.">{<Design9 />}</Wrap>
      <Wrap n={10} title="Magazine / Editorial" blurb="Bold print-spread with big numbers + editorial type.">{<Design10 />}</Wrap>

      <div className="py-16 text-center text-muted-foreground text-sm">
        That's all 10. Reply with the number(s) you want and I'll build it into the homepage for real.
      </div>
    </Layout>
  );
}
