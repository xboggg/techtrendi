import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, animate, useReducedMotion, useInView } from "framer-motion";
import {
  Wifi, Check, Zap, Users, Gamepad2, Download, MapPin, Phone, MessageCircle, Mail, Router, AlertTriangle,
  CalendarClock, BadgePercent, Smartphone, Building2, ExternalLink, ShieldCheck, Share2, Lightbulb, Home, Sparkles, ArrowRight, BarChart3,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FibreJourney } from "@/components/broadband/FibreJourney";
import { cn } from "@/lib/utils";
import {
  LAST_CHECKED, PAGE_PATH, PERIODS, PLANS, PRICE_CUT, RACE_FILES, HOW_TO_BUY, PAY_WITH, HELP, FAQS, SOURCES,
  planSaving, downloadSeconds, humanTime, suggestPlan, type PeriodId, type FibrePlan,
} from "@/data/mtnFibreFacts";

const ghs = (v: number) => `GH¢${Math.round(v).toLocaleString("en-GH")}`;
const SHARE_TEXT = "MTN Fibre in Ghana: prices, speeds and how to get it (checked by TechTrendi)";
const SITE = "https://techtrendi.com";

/** Number that glides to its new value. First render shows the real value (safe for prerender). */
function Counter({ value, format = ghs, className }: { value: number; format?: (v: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) { el.textContent = format(value); last.current = value; return; }
    const c = animate(last.current, value, { duration: 0.6, ease: "easeOut", onUpdate: (v) => { el.textContent = format(v); } });
    last.current = value;
    return () => c.stop();
  }, [value, format, reduce]);
  return <span ref={ref} className={className}>{format(value)}</span>;
}

/** Little speed dial; the needle swings up when the card scrolls into view. */
function SpeedDial({ mbps }: { mbps: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const angle = -90 + (mbps / 500) * 180; // 0 → left, 500 → right
  return (
    <svg ref={ref} viewBox="0 0 120 70" className="w-28 h-16" aria-hidden="true">
      <path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="10" strokeLinecap="round" />
      <path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round"
        strokeDasharray="157" strokeDashoffset={inView || reduce ? 157 - (mbps / 500) * 157 : 157}
        style={{ transition: reduce ? "none" : "stroke-dashoffset 1.2s ease-out" }} />
      <g style={{ transform: `rotate(${inView || reduce ? angle : -90}deg)`, transformOrigin: "60px 62px", transition: reduce ? "none" : "transform 1.2s cubic-bezier(.3,1.4,.5,1)" }}>
        <line x1="60" y1="62" x2="60" y2="22" stroke="white" strokeWidth="4" strokeLinecap="round" />
      </g>
      <circle cx="60" cy="62" r="6" fill="white" />
    </svg>
  );
}

function SectionTitle({ icon: Icon, children, sub }: { icon: typeof Wifi; children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
        <Icon className="h-7 w-7 text-amber-500 shrink-0" /> {children}
      </h2>
      {sub && <p className="text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ------------------------------------------------------------------ plans
function Plans() {
  const [period, setPeriod] = useState<PeriodId>("30");
  return (
    <section id="prices" className="scroll-mt-24">
      <SectionTitle icon={BadgePercent} sub="Home plans. Pay for one month, or pay for longer and save.">The 3 plans and prices</SectionTitle>
      <div role="tablist" aria-label="How long do you want to pay for?" className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-muted mb-5">
        {PERIODS.map((p) => (
          <button key={p.id} role="tab" aria-selected={period === p.id} onClick={() => setPeriod(p.id)}
            className={cn("relative rounded-xl py-2.5 text-sm font-bold transition-colors", period === p.id ? "text-slate-900" : "text-muted-foreground hover:text-foreground")}>
            {period === p.id && <motion.span layoutId="fibre-period" className="absolute inset-0 rounded-xl bg-amber-400 shadow" transition={{ type: "spring", bounce: 0.25, duration: 0.45 }} />}
            <span className="relative"><span className="hidden sm:inline">{p.label}</span><span className="sm:hidden">{p.short}</span></span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan, i) => <PlanCard key={plan.id} plan={plan} period={period} popular={i === 1} />)}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Prices from MTN's shop and help centre, checked {LAST_CHECKED}. Longer plans are paid once, upfront.
        Business customers pay the same prices.
      </p>
    </section>
  );
}

function PlanCard({ plan, period, popular }: { plan: FibrePlan; period: PeriodId; popular: boolean }) {
  const s = planSaving(plan, period);
  const months = PERIODS.find((p) => p.id === period)!;
  return (
    <motion.article initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
      className="rounded-3xl border bg-card overflow-hidden shadow-sm flex flex-col">
      <div className={cn("relative p-5 text-white bg-gradient-to-br", plan.colour)}>
        {popular && <span className="absolute top-3 right-3 text-[11px] font-extrabold uppercase tracking-wide bg-black/25 rounded-full px-2.5 py-1">Middle choice</span>}
        <p className="text-sm font-bold opacity-90">{plan.name}</p>
        <div className="flex items-end justify-between gap-2">
          <p className="text-4xl font-black leading-none mt-1">{plan.mbps}<span className="text-lg font-bold"> Mbps</span></p>
          <SpeedDial mbps={plan.mbps} />
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-3xl font-black tracking-tight">
          <Counter value={s.price} /><span className="text-base font-semibold text-muted-foreground"> / {months.label}</span>
        </p>
        <p className={cn("text-sm font-semibold mt-1 min-h-5", s.saved > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
          {s.saved > 0 ? <>You save <Counter value={s.saved} /> ({s.percent}%) · about {ghs(s.perMonth)} a month</> : "No data limit · free installation now"}
        </p>
        <ul className="mt-4 space-y-2 text-sm flex-1">
          {plan.goodFor.map((g) => (
            <li key={g} className="flex gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />{g}</li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

// ------------------------------------------------------------------ picker
function PlanPicker() {
  const [people, setPeople] = useState(3);
  const [heavy, setHeavy] = useState(false);
  const pick = PLANS.find((p) => p.id === suggestPlan(people, heavy))!;
  return (
    <section id="which-plan" className="scroll-mt-24 rounded-3xl border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-5 md:p-7">
      <SectionTitle icon={Lightbulb} sub="Two quick questions. Based on MTN's own advice for small, medium and big homes.">Which plan is right for me?</SectionTitle>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-5">
          <div>
            <label htmlFor="fibre-people" className="font-bold flex items-center gap-2"><Users className="h-5 w-5 text-amber-600" /> How many people use the internet at home?</label>
            <div className="flex items-center gap-3 mt-3">
              <input id="fibre-people" type="range" min={1} max={10} value={people} onChange={(e) => setPeople(Number(e.target.value))}
                className="flex-1 accent-amber-500 h-2" />
              <span className="w-14 text-center text-2xl font-black">{people}{people === 10 ? "+" : ""}</span>
            </div>
            <div className="flex gap-1 mt-2" aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <motion.span key={i} animate={{ scale: i < people ? 1 : 0.7, opacity: i < people ? 1 : 0.25 }} className="text-lg">🧑🏾</motion.span>
              ))}
            </div>
          </div>
          <div>
            <p className="font-bold flex items-center gap-2"><Gamepad2 className="h-5 w-5 text-amber-600" /> Lots of 4K movies, gaming or big downloads?</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[false, true].map((v) => (
                <button key={String(v)} onClick={() => setHeavy(v)} aria-pressed={heavy === v}
                  className={cn("rounded-xl border-2 py-2.5 font-bold transition-colors", heavy === v ? "border-amber-500 bg-amber-400 text-slate-900" : "border-border bg-card hover:border-amber-300")}>
                  {v ? "Yes, a lot" : "Not really"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <motion.div key={pick.id} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.35 }}
          className={cn("rounded-3xl p-6 text-white bg-gradient-to-br shadow-lg flex flex-col justify-center", pick.colour)}>
          <p className="text-sm font-bold uppercase tracking-wide opacity-90">Our suggestion</p>
          <p className="text-3xl font-black mt-1">{pick.name}</p>
          <p className="text-xl font-bold">{pick.mbps} Mbps · {ghs(pick.prices["30"])} a month</p>
          <p className="text-sm mt-3 opacity-95">Start smaller if money is tight. MTN lets you change speed later (cancel first, then wait 30 days).</p>
        </motion.div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ download race
function DownloadRace() {
  const [fileId, setFileId] = useState<(typeof RACE_FILES)[number]["id"]>("film");
  const file = RACE_FILES.find((f) => f.id === fileId)!;
  const slowest = downloadSeconds(file.gb, PLANS[0].mbps);
  const reduce = useReducedMotion();
  return (
    <section id="speed" className="scroll-mt-24">
      <SectionTitle icon={Download} sub="How long a download takes at each speed, at best.">Download race</SectionTitle>
      <div className="flex flex-wrap gap-2 mb-4">
        {RACE_FILES.map((f) => (
          <button key={f.id} onClick={() => setFileId(f.id)} aria-pressed={fileId === f.id}
            className={cn("rounded-full px-4 py-2 text-sm font-bold border-2 transition-colors", fileId === f.id ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white" : "bg-card border-border hover:border-slate-400")}>
            {f.label} (~{f.gb} GB)
          </button>
        ))}
      </div>
      <div className="space-y-3 rounded-3xl border bg-card p-5">
        {PLANS.map((plan) => {
          const secs = downloadSeconds(file.gb, plan.mbps);
          return (
            <div key={plan.id}>
              <div className="flex justify-between text-sm font-bold mb-1">
                <span>{plan.mbps} Mbps</span>
                <span>{humanTime(secs)}</span>
              </div>
              <div className="h-4 rounded-full bg-muted overflow-hidden">
                <motion.div key={`${fileId}-${plan.id}`} className={cn("h-full rounded-full bg-gradient-to-r", plan.colour)}
                  initial={{ width: reduce ? "100%" : "0%" }} animate={{ width: "100%" }}
                  transition={{ duration: reduce ? 0 : 0.6 + 2.4 * (secs / slowest), ease: "linear" }} />
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground pt-1">
          Sizes are typical, not exact. Times assume the full plan speed; real downloads are often slower, especially over Wi-Fi far from the router.
        </p>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ price cut
function PriceCut() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const pctCut = Math.round((1 - PRICE_CUT.after / PRICE_CUT.before) * 100);
  return (
    <section id="price-cut" className="scroll-mt-24 rounded-3xl bg-slate-950 text-white p-5 md:p-7">
      <SectionTitle icon={Sparkles}>
        <span className="text-white">The big price cut</span>
      </SectionTitle>
      <p className="text-slate-300 -mt-2 mb-5">
        On {PRICE_CUT.date}, after talks with the Ministry of Communication, MTN cut its {PRICE_CUT.mbps} Mbps unlimited plan from {ghs(PRICE_CUT.before)} to {ghs(PRICE_CUT.after)} a month. That is about {pctCut}% cheaper.
      </p>
      <div ref={ref} className="space-y-4">
        {[
          { label: "Before", value: PRICE_CUT.before, cls: "bg-slate-500" },
          { label: "Now", value: PRICE_CUT.after, cls: "bg-gradient-to-r from-amber-400 to-yellow-300" },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-sm font-bold mb-1"><span>{row.label}</span><span>{ghs(row.value)} / month</span></div>
            <div className="h-6 rounded-full bg-white/10 overflow-hidden">
              <div className={cn("h-full rounded-full", row.cls)}
                style={{ width: inView || reduce ? `${(row.value / PRICE_CUT.before) * 100}%` : "0%", transition: reduce ? "none" : "width 1.4s cubic-bezier(.2,.8,.2,1)" }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4">Sources: Graphic Online, Citi Newsroom and MyJoyOnline, 17 June 2026. The 300 and 500 Mbps plans were new at the time, so they have no "before" price.</p>
    </section>
  );
}

// ------------------------------------------------------------------ steps
const STEPS = [
  { icon: MapPin, title: "Check your address", body: "Fibre is only in selected areas. Use 'Check Fibre Availability' on shop.mtn.com.gh, or dial *5057#." },
  { icon: Wifi, title: "Pick a plan", body: "100, 300 or 500 Mbps. Order on shop.mtn.com.gh, in the MyMTN app, or by dialling *5057#." },
  { icon: Router, title: "Installation", body: "An MTN team brings the cable into your home and sets up the router. MTN's shop says this is free right now." },
  { icon: Smartphone, title: "Pay and connect", body: `Pay with ${PAY_WITH.join(", ")}. Monthly plans renew by themselves unless you cancel.` },
];

function Steps() {
  return (
    <section id="how-to-get-it" className="scroll-mt-24">
      <SectionTitle icon={Home} sub="Four simple steps.">How to get MTN Fibre</SectionTitle>
      <ol className="grid gap-3 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <motion.li key={s.title} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="flex gap-4 rounded-2xl border bg-card p-4">
            <span className="h-11 w-11 shrink-0 rounded-2xl bg-amber-400 text-slate-900 font-black text-xl grid place-items-center">{i + 1}</span>
            <div>
              <p className="font-bold flex items-center gap-1.5"><s.icon className="h-4 w-4 text-amber-600" />{s.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{s.body}</p>
            </div>
          </motion.li>
        ))}
      </ol>
      <div className="mt-4 rounded-2xl border bg-card p-4">
        <p className="font-bold mb-2">Already connected? Renew or buy your plan here:</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {HOW_TO_BUY.map((h) => (
            <div key={h.how} className="flex items-start gap-2 text-sm">
              <span className="font-mono font-black bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 rounded-lg px-2 py-0.5 whitespace-nowrap">{h.how}</span>
              <span className="text-muted-foreground">{h.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ fine print
const GOOD_TO_KNOW = [
  { icon: Zap, title: "Speeds are 'up to'", body: "MTN says it is a shared service, so speed can drop at busy times. One plan can connect up to 64 devices." },
  { icon: Router, title: "The router belongs to MTN", body: "You use it free, but give it back when you stop. If it is lost, stolen or damaged, you pay for it." },
  { icon: CalendarClock, title: "Long plans: no refund", body: "3, 6 and 12-month plans are paid upfront and not refunded, except if you move to an area without MTN fibre with more than 3 months left." },
  { icon: Wifi, title: "Changing speed takes time", body: "Cancel your plan first, then wait 30 days before picking a new speed." },
  { icon: CalendarClock, title: "Moving house?", body: "You can freeze your account for up to one month." },
  { icon: Check, title: "Outages are paid back", body: "If MTN confirms a fault you reported, the lost days are added back to your plan." },
  { icon: AlertTriangle, title: "Installation: ask first", body: "The shop says 'Free Installation', but MTN's written terms still mention a one-time fee. Confirm before the team comes." },
  { icon: ShieldCheck, title: "Webguard is switched on", body: "MTN's scam-site blocker comes free for 3 months. After that, nothing is charged unless you choose to keep it." },
];

function GoodToKnow() {
  return (
    <section id="good-to-know" className="scroll-mt-24">
      <SectionTitle icon={AlertTriangle} sub="The small print, in plain words (from MTN's terms).">Good to know before you pay</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {GOOD_TO_KNOW.map((g) => (
          <div key={g.title} className="rounded-2xl border bg-card p-4 flex gap-3">
            <g.icon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div><p className="font-bold">{g.title}</p><p className="text-sm text-muted-foreground mt-0.5">{g.body}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ help
function HelpBox() {
  return (
    <section id="help" className="scroll-mt-24 grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border bg-card p-5">
        <h2 className="text-xl font-extrabold flex items-center gap-2"><Lightbulb className="h-6 w-6 text-amber-500" /> Internet stopped? Check the lights</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" /> <b>Power</b>: should be steady green</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" /> <b>PON</b>: green, steady or blinking</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-slate-400" /> <b>LOS</b>: should be OFF. If it is on, the cable signal is lost: call MTN</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-3">Still no internet? Unplug the box for 30 seconds, plug it back in, and wait a few minutes.</p>
      </div>
      <div className="rounded-3xl border bg-card p-5">
        <h2 className="text-xl font-extrabold flex items-center gap-2"><Phone className="h-6 w-6 text-amber-500" /> Talk to MTN</h2>
        <div className="mt-3 grid gap-2">
          <a href={`tel:${HELP.phone[0]}`} className="flex items-center gap-3 rounded-xl bg-amber-400 text-slate-900 font-bold px-4 py-3 hover:bg-amber-300"><Phone className="h-5 w-5" /> Call {HELP.phone.join(" or ")}</a>
          <a href={HELP.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl bg-emerald-600 text-white font-bold px-4 py-3 hover:bg-emerald-700"><MessageCircle className="h-5 w-5" /> WhatsApp {HELP.whatsapp}</a>
          <a href={`mailto:${HELP.email}`} className="flex items-center gap-3 rounded-xl bg-muted font-semibold px-4 py-3 hover:bg-muted/70 break-all"><Mail className="h-5 w-5 shrink-0" /> {HELP.email}</a>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Have your fibre account number ready. On X: {HELP.x}.</p>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ page
const JUMPS = [
  { href: "#prices", label: "Prices" },
  { href: "#which-plan", label: "Which plan?" },
  { href: "#how-to-get-it", label: "How to get it" },
  { href: "#good-to-know", label: "Small print" },
  { href: "#mobile-data", label: "Mobile data" },
  { href: "#help", label: "Help" },
  { href: "#faq", label: "Questions" },
];

export default function MtnFibreGhana() {
  const url = `${SITE}${PAGE_PATH}`;
  const share = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: SHARE_TEXT, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n\n${url}`)}`, "_blank", "noopener");
    }
  };

  return (
    <Layout>
      <SEOHead
        title="MTN Fibre Ghana 2026: Prices, Speeds & How to Get It"
        description={`MTN Fibre Broadband in Ghana, checked ${LAST_CHECKED}: GH¢299 for 100 Mbps, GH¢444 for 300 Mbps, GH¢999 for 500 Mbps, unlimited. Which plan to pick, how to order, and the small print.`}
        canonical={PAGE_PATH}
        image="/og-mtn-fibre-ghana.jpg"
        imageAlt="MTN Fibre Broadband Ghana prices: 100 Mbps GH¢299, 300 Mbps GH¢444, 500 Mbps GH¢999 a month"
        keywords={["MTN fibre Ghana", "MTN fibre broadband price", "MTN home internet", "fibre internet Ghana", "MTN unlimited fibre", "*5057#"]}
        faqs={FAQS}
        webPage
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "MTN Fibre Ghana", path: PAGE_PATH },
        ]}
      />

      <div className="bg-gradient-to-b from-amber-50/70 via-background to-background dark:from-slate-950 dark:via-background">
        <div className="container mx-auto max-w-5xl px-4 py-6 md:py-10 space-y-10 md:space-y-14">
          {/* hero */}
          <header className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-6 md:p-10 shadow-xl">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wide text-amber-300 bg-amber-400/10 border border-amber-400/40 rounded-full px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> Checked {LAST_CHECKED}
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mt-4 leading-[1.05]">
                MTN <span className="text-amber-400">Fibre</span> in Ghana
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mt-3 max-w-2xl">
                Fast home internet through a cable. Prices, which plan to pick, and how to get it, in simple words.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {["From GH¢299 a month", "No data limit", "Free installation now"].map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-sm font-bold">
                    <Check className="h-4 w-4 text-emerald-400" /> {c}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                <a href="https://shop.mtn.com.gh/" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 text-slate-900 font-extrabold px-4 py-3 hover:bg-amber-300">
                  <MapPin className="h-5 w-5" /> Check my area on MTN's site <ExternalLink className="h-4 w-4" />
                </a>
                <button onClick={share} className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 font-bold px-4 py-3 hover:bg-white/15">
                  <Share2 className="h-5 w-5" /> Share
                </button>
              </div>
            </div>
          </header>

          <nav aria-label="On this page" className="-mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {JUMPS.map((j) => (
              <a key={j.href} href={j.href} className="shrink-0 rounded-full border bg-card px-3.5 py-1.5 text-sm font-semibold hover:border-amber-400">{j.label}</a>
            ))}
          </nav>

          <Plans />
          <PlanPicker />

          <section id="how-it-works" className="scroll-mt-24">
            <SectionTitle icon={Wifi} sub="Fibre uses light in a thin glass cable, not a mobile mast. That is why it is fast and steady.">How fibre reaches your home</SectionTitle>
            <FibreJourney />
          </section>

          <DownloadRace />
          <PriceCut />
          <Steps />
          <GoodToKnow />

          <section id="no-fibre" className="scroll-mt-24 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border bg-card p-5">
              <h2 className="text-xl font-extrabold flex items-center gap-2"><Smartphone className="h-6 w-6 text-amber-500" /> No fibre on your street?</h2>
              <p className="text-sm text-muted-foreground mt-2">
                MTN's <b className="text-foreground">Yello Home</b> is a 4G router that works over the mobile network, for homes fibre has not reached yet.
                The router is <b className="text-foreground">GH¢1,200</b> at MTN service centres (bring your Ghana Card). Buy data with <b className="text-foreground">*5060#</b>.
                It is easier to set up, but fibre is usually faster and steadier.
              </p>
            </div>
            <div className="rounded-3xl border bg-card p-5">
              <h2 className="text-xl font-extrabold flex items-center gap-2"><Building2 className="h-6 w-6 text-amber-500" /> For a business?</h2>
              <p className="text-sm text-muted-foreground mt-2">
                MTN Business Fibre costs the same (GH¢299, GH¢444, GH¢999 a month) and adds a <b className="text-foreground">fixed (static) IP address</b>,
                network security, and Graphic Business news. Order through the Business tab on shop.mtn.com.gh.
              </p>
            </div>
          </section>

          <section id="mobile-data" className="scroll-mt-24">
            <SectionTitle icon={Smartphone} sub="Fibre is for home. On the move, your phone still needs a data bundle.">Need mobile data too?</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/data-bundles/ghana/mtn" className="group rounded-3xl p-5 bg-gradient-to-br from-amber-400 to-yellow-300 text-slate-900 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-lg font-black flex items-center gap-2"><Smartphone className="h-5 w-5" /> MTN data bundle prices</p>
                <p className="text-sm mt-1 font-medium">Every MTN bundle, today's prices, and how much data your money buys.</p>
                <span className="inline-flex items-center gap-1 mt-3 font-bold group-hover:gap-2 transition-all">See MTN bundles <ArrowRight className="h-4 w-4" /></span>
              </Link>
              <Link to="/data-bundles/ghana" className="group rounded-3xl p-5 bg-slate-900 text-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-lg font-black flex items-center gap-2"><BarChart3 className="h-5 w-5 text-amber-400" /> Compare MTN, Telecel and AT</p>
                <p className="text-sm mt-1 text-slate-300">See which network gives the most data for your money.</p>
                <span className="inline-flex items-center gap-1 mt-3 font-bold text-amber-300 group-hover:gap-2 transition-all">Compare networks <ArrowRight className="h-4 w-4" /></span>
              </Link>
            </div>
          </section>

          <HelpBox />

          <section id="faq" className="scroll-mt-24">
            <SectionTitle icon={MessageCircle}>Questions people ask</SectionTitle>
            <Accordion type="single" collapsible className="rounded-3xl border bg-card px-5">
              {FAQS.map((f, i) => (
                <AccordionItem key={f.question} value={`q${i}`} className={i === FAQS.length - 1 ? "border-b-0" : undefined}>
                  <AccordionTrigger className="text-left font-bold">{f.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-[15px] leading-relaxed">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section id="sources" className="scroll-mt-24 rounded-3xl border bg-muted/40 p-5">
            <h2 className="text-lg font-extrabold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Where these facts come from</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Checked {LAST_CHECKED} against MTN's own shop, help centre and terms, and Ghana news reports. TechTrendi is not MTN and is not paid by MTN.
              Prices can change, so confirm with MTN before you pay.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {SOURCES.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{s.label}</a>
                  <span className="text-muted-foreground"> · {s.note}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
}
