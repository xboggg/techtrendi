import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, animate, useReducedMotion } from "framer-motion";
import {
  Wallet, ShoppingCart, Target, Plus, Trash2, Search, Info, Sparkles, Building2, PiggyBank,
  Receipt, CheckCircle2, CircleSlash, Ship, ExternalLink, TrendingDown, TrendingUp, Gift,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { GhanaFlag } from "@/components/ui/ghana-flag";
import {
  salary, basicForTakeHome, vatBreakdown, bonusTax, VAT, SSNIT, TIER3_MAX, BANDS_2026_SEP, BANDS_BEFORE_SEP_2026,
  type VatTreatment,
} from "@/lib/ghanaTax";
import { VAT_ITEMS, VAT_SOURCES, TAX_SOURCES, LAST_CHECKED } from "@/data/ghanaTaxFacts";

// ------------------------------------------------------------------ helpers
const ghs = (v: number, dp = 2) =>
  `GH¢${(Number.isFinite(v) ? v : 0).toLocaleString("en-GH", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp).replace(/\.0$/, "")}%`;
const num = (s: string) => {
  const n = parseFloat(String(s).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Number that glides to its new value. First render shows the real value (safe for prerender). */
function Counter({ value, format = ghs, className }: { value: number; format?: (v: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) { el.textContent = format(value); last.current = value; return; }
    const c = animate(last.current, value, {
      duration: 0.6, ease: "easeOut",
      onUpdate: (v) => { el.textContent = format(v); },
    });
    last.current = value;
    return () => c.stop();
  }, [value, format, reduce]);
  return <span ref={ref} className={className}>{format(value)}</span>;
}

const BAND_COLOURS = ["#10b981", "#84cc16", "#eab308", "#f59e0b", "#f97316", "#ef4444", "#be123c"];

type Tab = "salary" | "shop" | "goal";
const TABS: { id: Tab; label: string; short: string; icon: typeof Wallet; grad: string }[] = [
  { id: "salary", label: "My salary", short: "Salary", icon: Wallet, grad: "from-emerald-500 to-green-600" },
  { id: "shop", label: "Shopping VAT", short: "VAT", icon: ShoppingCart, grad: "from-amber-400 to-orange-500" },
  { id: "goal", label: "Pay I need", short: "Goal", icon: Target, grad: "from-rose-500 to-red-600" },
];

// ------------------------------------------------------------------ page
export default function GhanaTaxCalculator() {
  const [tab, setTab] = useState<Tab>("salary");

  return (
    <Layout>
      <SEOHead
        title="Ghana Tax Calculator 2026: PAYE, SSNIT & VAT"
        canonical="/tools/ghana-tax-calculator"
        description="Free Ghana tax calculator with the new PAYE bands from 1 September 2026 (Act 1178), SSNIT 5.5%, and VAT with NHIL and GETFund (20% from 1 January 2026). See take-home pay and shopping tax in seconds."
        keywords="ghana tax calculator, paye ghana 2026, act 1178, ssnit calculator, ghana vat calculator, nhil getfund, gra tax bands, ghana salary calculator, take home pay ghana"
      />

      <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-background to-emerald-50/40 dark:from-slate-950 dark:via-background dark:to-emerald-950/20">
        <div className="container mx-auto max-w-5xl px-4 py-6 md:py-10">
          {/* ---------- hero ---------- */}
          <div className="relative overflow-hidden rounded-3xl p-6 md:p-10 mb-6 text-white shadow-xl bg-gradient-to-br from-red-600 via-amber-500 to-emerald-600">
            <motion.div
              aria-hidden
              className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/15"
              animate={{ scale: [1, 1.15, 1], rotate: [0, 20, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-black/10"
              animate={{ scale: [1.1, 1, 1.1] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 text-sm font-semibold bg-black/20 rounded-full px-3 py-1 w-fit mb-4">
                <Sparkles className="h-4 w-4" /> Checked {LAST_CHECKED}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
                <GhanaFlag className="inline-block w-8 h-6 rounded align-[-0.1em] mr-2" />
                Ghana Tax Calculator
              </h1>
              <p className="mt-3 text-base md:text-lg max-w-2xl text-white/95">
                Your pay after tax and SSNIT, and the VAT inside what you buy. Uses the new tax bands from
                1 September 2026 and the 20% VAT from 1 January 2026.
              </p>
            </div>
          </div>

          {/* ---------- tabs ---------- */}
          <div role="tablist" aria-label="Choose a calculator" className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 shadow-sm border mb-6">
            {TABS.map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`relative rounded-xl px-2 py-3 text-sm md:text-base font-bold transition-colors ${active ? "text-white" : "text-slate-700 dark:text-slate-200 hover:bg-muted"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="tax-tab-pill"
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${t.grad} shadow`}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative flex items-center justify-center gap-1.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden">{t.short}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {tab === "salary" && <SalaryTab />}
              {tab === "shop" && <ShopTab />}
              {tab === "goal" && <GoalTab />}
            </motion.div>
          </AnimatePresence>

          <SourcesCard />
        </div>
      </div>
    </Layout>
  );
}

// ------------------------------------------------------------------ shared bits
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-sm p-5 ${className}`}>{children}</div>;
}

function MoneyInput({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1.5">{label}</label>
      <div className="flex items-center rounded-xl border-2 border-emerald-200 dark:border-emerald-800 focus-within:border-emerald-500 bg-white dark:bg-slate-950 overflow-hidden">
        <span className="px-3 text-lg font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 self-stretch flex items-center">GH¢</span>
        <input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          className="w-full min-w-0 px-3 py-3 text-xl font-bold bg-transparent outline-none"
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Chips({ values, onPick }: { values: number[]; onPick: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {values.map((v) => (
        <motion.button
          key={v}
          whileTap={{ scale: 0.92 }}
          whileHover={{ y: -2 }}
          onClick={() => onPick(v)}
          className="rounded-full px-3 py-1.5 text-sm font-semibold bg-gradient-to-r from-amber-100 to-emerald-100 dark:from-amber-900/40 dark:to-emerald-900/40 text-slate-800 dark:text-slate-100 border"
        >
          {ghs(v, 0)}
        </motion.button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ salary tab
function SalaryTab() {
  const [basic, setBasic] = useState("5000");
  const [allow, setAllow] = useState("0");
  const [tier3, setTier3] = useState(0);
  const [yearly, setYearly] = useState(false);
  const r = useMemo(() => salary({ basicMonthly: num(basic), allowancesMonthly: num(allow), tier3Percent: tier3 }), [basic, allow, tier3]);
  const old = useMemo(
    () => (BANDS_BEFORE_SEP_2026 ? salary({ basicMonthly: num(basic), allowancesMonthly: num(allow), tier3Percent: tier3, bands: BANDS_BEFORE_SEP_2026 }) : null),
    [basic, allow, tier3],
  );
  const k = yearly ? 12 : 1;
  const per = yearly ? "a year" : "a month";

  const parts = [
    { label: "You keep", value: r.takeHome, colour: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
    { label: "Income tax (PAYE)", value: r.paye, colour: "bg-red-500", text: "text-red-600 dark:text-red-400" },
    { label: "SSNIT (5.5%)", value: r.ssnitEmployee, colour: "bg-amber-400", text: "text-amber-700 dark:text-amber-300" },
    { label: "Tier 3 savings", value: r.tier3, colour: "bg-violet-500", text: "text-violet-700 dark:text-violet-300" },
  ].filter((p) => p.value > 0.005);

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="lg:col-span-2 space-y-5">
        <Panel>
          <MoneyInput id="basic" label="Basic salary each month" value={basic} onChange={setBasic} hint="The basic pay on your payslip, before anything is taken off." />
          <input
            type="range" min={0} max={60000} step={100} value={Math.min(num(basic), 60000)}
            onChange={(e) => setBasic(e.target.value)}
            aria-label="Slide to change basic salary"
            className="w-full mt-4 accent-emerald-600"
          />
          <Chips values={[1000, 3000, 5000, 10000, 25000]} onPick={(v) => setBasic(String(v))} />
        </Panel>
        <Panel>
          <MoneyInput id="allow" label="Cash allowances each month (if any)" value={allow} onChange={setAllow} hint="Rent, transport or similar cash allowances. They are taxed, but SSNIT is not taken from them." />
          <div className="mt-5">
            <div className="flex justify-between text-sm font-semibold">
              <label htmlFor="tier3">Voluntary pension (Tier 3)</label>
              <span className="text-violet-700 dark:text-violet-300">{tier3}% of basic</span>
            </div>
            <input id="tier3" type="range" min={0} max={TIER3_MAX * 100} step={0.5} value={tier3} onChange={(e) => setTier3(Number(e.target.value))} className="w-full mt-2 accent-violet-600" />
            <p className="text-xs text-muted-foreground mt-1">Optional. Up to {pct(TIER3_MAX)} of basic (yours and your employer's together) is not taxed. Leave at 0% if you don't have one.</p>
          </div>
        </Panel>
        <BonusCard basic={num(basic)} allow={num(allow)} tier3={tier3} />
      </div>

      <div className="lg:col-span-3 space-y-5">
        {/* take-home hero */}
        <motion.div layout className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="font-semibold text-white/90">You take home</p>
            <div className="flex rounded-full bg-black/20 p-1 text-sm font-bold">
              {["Monthly", "Yearly"].map((l, i) => (
                <button key={l} onClick={() => setYearly(i === 1)} className={`px-3 py-1 rounded-full transition ${yearly === (i === 1) ? "bg-white text-emerald-700" : "text-white"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="text-4xl md:text-5xl font-extrabold mt-2 break-words">
            <Counter value={r.takeHome * k} />
          </div>
          <p className="text-white/90 mt-1 text-sm">{per} · tax is {pct(r.effectiveRate)} of your pay · top band {pct(r.topRate)}</p>

          {old && num(basic) > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 rounded-xl bg-white/15 p-3 flex items-start gap-2 text-sm">
              {old.paye - r.paye > 0.005 ? <TrendingDown className="h-5 w-5 shrink-0" /> : <TrendingUp className="h-5 w-5 shrink-0" />}
              <span>
                {Math.abs(old.paye - r.paye) <= 0.005 ? (
                  <>Old bands vs new bands from 1 Sep 2026: <strong>no change</strong> in your tax.</>
                ) : (
                  <>
                    New bands from 1 Sep 2026: you pay <strong><Counter value={Math.abs(old.paye - r.paye) * k} /></strong>{" "}
                    {old.paye > r.paye ? "less" : "more"} tax {per} than under the old bands.
                  </>
                )}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* where it goes */}
        <Panel>
          <h2 className="font-bold text-lg mb-3">Where each cedi of your pay goes</h2>
          <div className="flex h-8 w-full overflow-hidden rounded-full bg-muted">
            {parts.map((p) => (
              <motion.div
                key={p.label}
                className={`${p.colour} h-full`}
                initial={false}
                animate={{ width: `${r.gross > 0 ? (p.value / r.gross) * 100 : 0}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                title={`${p.label}: ${ghs(p.value * k)}`}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-2">
            {[{ label: "Total pay", value: r.gross, colour: "bg-slate-400", text: "font-bold" }, ...parts].map((p) => (
              <li key={p.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${p.colour}`} />{p.label}</span>
                <span className={`font-semibold ${p.text}`}><Counter value={p.value * k} /></span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* staircase */}
        <Panel>
          <h2 className="font-bold text-lg">The tax staircase</h2>
          <p className="text-sm text-muted-foreground mb-4">Each step of your yearly taxable pay is taxed at its own rate. Only the part inside a step pays that step's rate.</p>
          <div className="space-y-2.5">
            {r.slices.map((s, i) => {
              const width = s.to === Infinity ? s.taxable : s.to - s.from;
              const fill = width > 0 ? Math.min(1, s.taxable / width) : 0;
              const active = s.taxable > 0 && (i === r.slices.length - 1 || r.slices[i + 1].taxable === 0);
              return (
                <div key={i} className={`rounded-xl border p-2.5 transition ${active ? "ring-2 ring-offset-1 ring-amber-400 dark:ring-offset-slate-900" : ""}`}>
                  <div className="flex justify-between text-xs md:text-sm gap-2">
                    <span className="font-semibold">
                      <span className="inline-block min-w-[3.2rem] rounded-md px-1.5 py-0.5 text-white text-center mr-2" style={{ background: BAND_COLOURS[i] }}>{pct(s.rate)}</span>
                      {s.to === Infinity ? `Above ${ghs(s.from, 0)}` : `${ghs(s.from, 0)} – ${ghs(s.to, 0)}`}
                    </span>
                    <span className="font-bold whitespace-nowrap">{ghs(s.tax, 0)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: BAND_COLOURS[i] }} initial={false} animate={{ width: `${(s.to === Infinity ? (s.taxable > 0 ? 1 : 0) : fill) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.04 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Yearly amounts. Your yearly taxable pay: <strong>{ghs(r.chargeableMonthly * 12, 0)}</strong> (pay minus SSNIT{r.tier3 > 0 ? " and Tier 3" : ""}).</p>
        </Panel>

        {/* SSNIT */}
        <Panel className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20">
          <h2 className="font-bold text-lg flex items-center gap-2"><PiggyBank className="h-5 w-5 text-amber-600" /> Your pension (SSNIT)</h2>
          <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
            <Stat label="You pay (5.5%)" value={r.ssnitEmployee * k} tone="text-amber-700 dark:text-amber-300" />
            <Stat label="Employer pays (13%)" value={r.ssnitEmployer * k} tone="text-amber-700 dark:text-amber-300" />
            <Stat label="To SSNIT, Tier 1 (13.5%)" value={r.tier1Total * k} />
            <Stat label="To Tier 2 scheme (5%)" value={r.tier2Total * k} />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Together 18.5% of basic salary. Only the 5.5% comes out of your pay.
            {r.capped && <> SSNIT stops at a basic of {ghs(SSNIT.maxInsurableMonthly, 0)} a month (2026 limit), so it is worked out on that amount.</>}
          </p>
        </Panel>

        <Panel className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold"><Building2 className="h-5 w-5 text-sky-600" /> What you cost your employer</span>
          <span className="font-bold text-sky-700 dark:text-sky-300"><Counter value={r.employerCost * k} /></span>
        </Panel>

        <Note>
          For people who live in Ghana and are paid a salary. If you don't live in Ghana, a flat 25% applies instead. Overtime for junior
          staff has its own lower rates, and reliefs (for example for marriage, children or old age) can lower your tax — but only after
          you get a relief card from GRA. This is an estimate, not tax advice.
        </Note>
      </div>
    </div>
  );
}

function BonusCard({ basic, allow, tier3 }: { basic: number; allow: number; tier3: number }) {
  const [bonus, setBonus] = useState("0");
  const b = useMemo(() => bonusTax(num(bonus), { basicMonthly: basic, allowancesMonthly: allow, tier3Percent: tier3 }), [bonus, basic, allow, tier3]);
  return (
    <Panel className="bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/30 dark:to-pink-950/20">
      <h2 className="font-bold text-lg flex items-center gap-2 mb-3"><Gift className="h-5 w-5 text-fuchsia-600" /> Got a bonus this year?</h2>
      <MoneyInput id="bonus" label="Total bonus for the year" value={bonus} onChange={setBonus} />
      <AnimatePresence initial={false}>
        {b.bonus > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <ul className="mt-4 space-y-1.5 text-sm">
              <li className="flex justify-between gap-2"><span>Taxed at only 5%</span><strong>{ghs(b.atFive)}</strong></li>
              {b.excess > 0 && <li className="flex justify-between gap-2"><span>Above the limit — taxed like normal pay</span><strong>{ghs(b.excess)}</strong></li>}
              <li className="flex justify-between gap-2 text-red-600 dark:text-red-400"><span>Tax on your bonus</span><span>− <Counter value={b.tax} /></span></li>
              <li className="flex justify-between gap-2 border-t pt-1.5 font-bold text-fuchsia-700 dark:text-fuchsia-300"><span>You keep</span><Counter value={b.keep} /></li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-xs text-muted-foreground mt-3">
        A bonus of up to 15% of your yearly basic pay ({ghs(b.cap, 0)} for you) is taxed at just 5%. Anything above that is added to your pay
        and taxed on the normal steps.
      </p>
    </Panel>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl bg-white/70 dark:bg-slate-900/60 border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-bold text-base ${tone}`}><Counter value={value} /></p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/30 p-3 text-xs md:text-sm text-slate-700 dark:text-slate-200">
      <Info className="h-4 w-4 shrink-0 mt-0.5 text-sky-600" />
      <div>{children}</div>
    </div>
  );
}

// ------------------------------------------------------------------ shopping tab
interface Item { id: number; name: string; price: string; treatment: VatTreatment }
const T_STYLE: Record<VatTreatment, { label: string; chip: string; icon: typeof CheckCircle2 }> = {
  standard: { label: "Taxed 20%", chip: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200", icon: Receipt },
  exempt: { label: "No VAT", chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200", icon: CircleSlash },
  zero: { label: "Zero-rated", chip: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200", icon: Ship },
};

function ShopTab() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "Special fried rice", price: "90", treatment: "standard" },
    { id: 2, name: "Chilled sobolo", price: "10", treatment: "standard" },
  ]);
  const [inclusive, setInclusive] = useState(false);
  const [q, setQ] = useState("");
  const nextId = useRef(3);

  const lines = items.map((it) => ({ ...it, b: vatBreakdown(num(it.price), it.treatment, inclusive) }));
  const sum = (f: (x: (typeof lines)[number]["b"]) => number) => lines.reduce((s, l) => s + f(l.b), 0);
  const base = sum((b) => b.base), nhil = sum((b) => b.nhil), getfund = sum((b) => b.getfund), vat = sum((b) => b.vat), total = sum((b) => b.total);

  const add = (name = "", treatment: VatTreatment = "standard") =>
    setItems((xs) => [...xs, { id: nextId.current++, name, price: "", treatment }]);
  const update = (id: number, patch: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const found = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? VAT_ITEMS.filter((v) => (v.name + " " + (v.also || "")).toLowerCase().includes(s)).slice(0, 8) : VAT_ITEMS.slice(0, 8);
  }, [q]);

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-5">
        <Panel>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-orange-500" /> Shopping list</h2>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none">
              <input type="checkbox" checked={inclusive} onChange={(e) => setInclusive(e.target.checked)} className="h-4 w-4 accent-orange-500" />
              Prices already include tax
            </label>
          </div>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <motion.li key={it.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40, height: 0 }} className="rounded-xl border p-3 bg-orange-50/40 dark:bg-slate-950">
                  <div className="flex gap-2">
                    <input aria-label="Item name" placeholder="Item" value={it.name} onChange={(e) => update(it.id, { name: e.target.value })} className="flex-1 min-w-0 rounded-lg border px-2 py-2 bg-white dark:bg-slate-900 text-sm font-semibold" />
                    <div className="flex items-center rounded-lg border bg-white dark:bg-slate-900 w-28 shrink-0">
                      <span className="pl-2 text-xs font-bold text-muted-foreground">GH¢</span>
                      <input aria-label="Price" inputMode="decimal" placeholder="0" value={it.price} onChange={(e) => update(it.id, { price: e.target.value.replace(/[^\d.]/g, "") })} className="w-full min-w-0 px-1.5 py-2 bg-transparent text-sm font-bold outline-none" />
                    </div>
                    <button aria-label="Remove item" onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))} className="rounded-lg px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {(Object.keys(T_STYLE) as VatTreatment[]).map((t) => (
                      <button key={t} onClick={() => update(it.id, { treatment: t })} className={`rounded-full px-2.5 py-1 text-xs font-bold border transition ${it.treatment === t ? T_STYLE[t].chip + " border-transparent shadow-sm" : "text-muted-foreground"}`}>
                        {T_STYLE[t].label}
                      </button>
                    ))}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => add()} className="mt-3 w-full rounded-xl border-2 border-dashed border-orange-300 dark:border-orange-800 py-2.5 font-bold text-orange-700 dark:text-orange-300 flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" /> Add an item
          </motion.button>
        </Panel>

        {/* is it taxed? */}
        <Panel>
          <h2 className="font-bold text-lg">Is it taxed?</h2>
          <p className="text-sm text-muted-foreground">Not everything pays VAT. Search common things, then tap one to add it to your list.</p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. yam, medicine, school fees, Netflix" className="w-full rounded-xl border pl-9 pr-3 py-2.5 bg-white dark:bg-slate-950" />
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {found.map((v) => {
              const S = T_STYLE[v.treatment];
              const Icon = S.icon;
              return (
                <motion.li key={v.name} layout>
                  <button onClick={() => add(v.name, v.treatment)} className="w-full text-left rounded-xl border p-3 hover:shadow-md hover:-translate-y-0.5 transition bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{v.name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold flex items-center gap-1 ${S.chip}`}><Icon className="h-3 w-3" />{S.label}</span>
                    </div>
                    {v.note && <p className="text-xs text-muted-foreground mt-1">{v.note}</p>}
                  </button>
                </motion.li>
              );
            })}
            {found.length === 0 && <li className="text-sm text-muted-foreground">Not on our list. If unsure, ask the seller for a VAT invoice or check with GRA.</li>}
          </ul>
        </Panel>
      </div>

      {/* receipt */}
      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-24">
          <motion.div layout className="rounded-t-2xl bg-white dark:bg-slate-900 border border-b-0 shadow-lg p-5 font-mono text-sm">
            <p className="text-center font-bold tracking-widest text-base">RECEIPT</p>
            <p className="text-center text-xs text-muted-foreground mb-3">{inclusive ? "Taxes taken out of your prices" : "Taxes added to your prices"}</p>
            <div className="border-t border-dashed my-2" />
            {lines.map((l) => (
              <div key={l.id} className="flex justify-between gap-2">
                <span className="truncate">{l.name || "Item"}{l.treatment !== "standard" && <span className="text-emerald-600 dark:text-emerald-400"> ({l.treatment === "zero" ? "0%" : "no VAT"})</span>}</span>
                <span>{ghs(l.b.base)}</span>
              </div>
            ))}
            <div className="border-t border-dashed my-2" />
            <Line label="Price before tax" value={base} bold />
            <Line label={`GETFund levy (${pct(VAT.getfund)})`} value={getfund} />
            <Line label={`NHIL (${pct(VAT.nhil)})`} value={nhil} />
            <Line label={`VAT (${pct(VAT.vat)})`} value={vat} />
            <div className="border-t-2 border-slate-800 dark:border-slate-200 my-2" />
            <div className="flex justify-between items-baseline text-lg font-extrabold">
              <span>You pay</span>
              <Counter value={total} className="text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tax in this shop: <strong><Counter value={nhil + getfund + vat} /></strong></p>
          </motion.div>
          <svg aria-hidden viewBox="0 0 100 4" preserveAspectRatio="none" className="block w-full h-3 text-white dark:text-slate-900 drop-shadow">
            <path d="M0 0 H100 V0 L97.5 4 L95 0 L92.5 4 L90 0 L87.5 4 L85 0 L82.5 4 L80 0 L77.5 4 L75 0 L72.5 4 L70 0 L67.5 4 L65 0 L62.5 4 L60 0 L57.5 4 L55 0 L52.5 4 L50 0 L47.5 4 L45 0 L42.5 4 L40 0 L37.5 4 L35 0 L32.5 4 L30 0 L27.5 4 L25 0 L22.5 4 L20 0 L17.5 4 L15 0 L12.5 4 L10 0 L7.5 4 L5 0 L2.5 4 L0 0 Z" fill="currentColor" />
          </svg>
          <div className="mt-4">
            <Note>
              Taxed items pay three charges, each on the price before tax: GETFund levy 2.5%, NHIL 2.5% and VAT 15% — 20% in total
              since 1 January 2026, when the 1% COVID-19 levy was scrapped. Small sellers who are not VAT-registered do not charge VAT.
              This is for things bought in Ghana; taxes on imports at the port are worked out differently. There has been no E-Levy on
              MoMo or bank transfers since 2 April 2025.
            </Note>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-2 ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <Counter value={value} />
    </div>
  );
}

// ------------------------------------------------------------------ goal tab
function GoalTab() {
  const [want, setWant] = useState("4000");
  const target = num(want);
  const needed = useMemo(() => basicForTakeHome(target), [target]);
  const r = useMemo(() => salary({ basicMonthly: needed }), [needed]);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-rose-500" /> How much must the offer be?</h2>
        <MoneyInput id="want" label="Money you want in hand each month" value={want} onChange={setWant} hint="We work backwards to the basic salary you need to ask for (no allowances)." />
        <Chips values={[2000, 4000, 8000, 15000]} onPick={(v) => setWant(String(v))} />
      </Panel>
      <div className="space-y-5">
        <div className="rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-rose-500 via-red-600 to-amber-500">
          <p className="font-semibold text-white/90">Ask for a basic salary of at least</p>
          <div className="text-4xl md:text-5xl font-extrabold mt-2 break-words"><Counter value={needed} /></div>
          <p className="text-white/90 text-sm mt-1">a month · {ghs(needed * 12, 0)} a year</p>
        </div>
        <Panel>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Basic salary</span><strong><Counter value={r.gross} /></strong></li>
            <li className="flex justify-between text-amber-700 dark:text-amber-300"><span>SSNIT (5.5%)</span><span>− <Counter value={r.ssnitEmployee} /></span></li>
            <li className="flex justify-between text-red-600 dark:text-red-400"><span>Income tax (PAYE)</span><span>− <Counter value={r.paye} /></span></li>
            <li className="flex justify-between border-t pt-2 font-bold text-emerald-700 dark:text-emerald-300"><span>In your hand</span><Counter value={r.takeHome} /></li>
          </ul>
        </Panel>
        <Note>Useful before a job interview: know the basic salary that gives you the money you need. See also our <a className="underline font-semibold" href="/blog/salary-negotiation-scripts-that-work">salary talks guide</a>.</Note>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ sources
function SourcesCard() {
  return (
    <details className="mt-8 rounded-2xl border bg-white dark:bg-slate-900 p-5 group">
      <summary className="cursor-pointer font-bold flex items-center gap-2"><Info className="h-5 w-5 text-emerald-600" /> Where these numbers come from</summary>
      <div className="mt-3 text-sm space-y-3">
        <div>
          <p className="font-semibold">Income tax bands from 1 September 2026 (Income Tax (Amendment) Act 2026, Act 1178)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs mt-2">
              <tbody>
                {BANDS_2026_SEP.map((b, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1">{b.width === Infinity ? "Above GH¢600,000" : `${i === 0 ? "First" : "Next"} ${ghs(b.width, 0)}`}</td>
                    <td className="py-1 text-right font-bold">{pct(b.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Yearly amounts for people who live in Ghana.</p>
        </div>
        <ul className="space-y-1">
          {[...TAX_SOURCES, ...VAT_SOURCES].map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 underline">
                {s.label} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Last checked {LAST_CHECKED}. This is general information, not tax advice. GRA has the final word.</p>
      </div>
    </details>
  );
}
