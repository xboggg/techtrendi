import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

// Sample headlines (from the live "World Tech in Brief" section) so every option
// renders with realistic content. The chosen design will use the real feed.
const ITEMS = [
  { id: 1, cat: "Startups", title: "Flying Cars Are Coming — But First, These Air Taxi Giants Have to Stop Crashing", time: "14h ago", img: "/images/news/cybersecurity-a24c02fab4.jpg" },
  { id: 2, cat: "Gadgets", title: "OnePlus 15s Cancelled for India: Is the OnePlus 16 Launch Also at Risk?", time: "22h ago", img: "/images/news/cyber-identity-protection-2026.jpg" },
  { id: 3, cat: "Gadgets", title: "Galaxy Watch 9 and Watch Ultra 2 Leaks: No Classic Model, Boxier Design", time: "22h ago", img: "/images/news/cyber-travel-security-2026.jpg" },
  { id: 4, cat: "Startups", title: "From VLC to Robots: How Jean-Baptiste Kempf's New Startup Kyber Is Rethinking AI", time: "1d ago", img: "/images/news/cyber-scam-teardowns-2026.jpg" },
  { id: 5, cat: "Gadgets", title: "Why Car Manufacturers Are Abandoning Android Auto by 2026", time: "1d ago", img: "/images/news/security-825fa75813.jpg" },
  { id: 6, cat: "Health Tech", title: "Apple Health App Now Detects Perimenopause Patterns Worth Watching", time: "1d ago", img: "/images/news/cyber-password-mistakes-2026.jpg" },
];

const CAT: Record<string, string> = {
  Startups: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  Gadgets: "bg-cyan-500/20 text-cyan-300 ring-cyan-500/30",
  "Health Tech": "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
};
const cat = (c: string) => CAT[c] || "bg-white/10 text-white/60 ring-white/15";

// dark wire panel wrapper
const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/10 p-4 overflow-hidden">
    <div className="h-0.5 -mt-4 -mx-4 mb-4 bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-emerald-400">Live</span>
        <span className="text-sm font-bold text-white">World Tech <span className="text-white/40 font-normal">in Brief</span></span>
      </div>
      <span className="font-mono text-[10px] text-white/50">THE WIRE →</span>
    </div>
    {children}
  </div>
);

// ── the 10 variants ──────────────────────────────────────────────────────────
const V1 = () => (
  <Panel>
    <ul className="space-y-0.5">
      {ITEMS.map((it, i) => (
        <li key={it.id} className="flex items-start gap-2 py-2 border-b border-white/5">
          <span className="font-mono text-[11px] text-white/25 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide ring-1 ${cat(it.cat)}`}>{it.cat}</span>
          <span className="flex-1 text-sm text-white/85 leading-snug">{it.title}</span>
          <span className="font-mono text-[10px] text-white/35 shrink-0 mt-0.5">{it.time}</span>
        </li>
      ))}
    </ul>
  </Panel>
);

const V2 = () => (
  <Panel>
    <ul>
      {ITEMS.map((it) => (
        <li key={it.id} className="py-2.5 border-b border-white/5">
          <span className="text-sm text-white/90 leading-snug">{it.title}</span>
          <span className="font-mono text-[10px] text-white/40"> · {it.time}</span>
        </li>
      ))}
    </ul>
  </Panel>
);

const V3 = () => (
  <Panel>
    <Carousel opts={{ loop: true, align: "start" }}>
      <CarouselContent className="-ml-3">
        {ITEMS.map((it) => (
          <CarouselItem key={it.id} className="pl-3 basis-[88%]">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 h-full">
              <span className={`px-2 py-0.5 rounded text-[9px] uppercase ring-1 ${cat(it.cat)}`}>{it.cat}</span>
              <p className="text-sm text-white/90 mt-2 leading-snug">{it.title}</p>
              <div className="flex items-center justify-between mt-3 text-[10px] text-white/40 font-mono"><span>{it.time}</span><span className="text-primary">Read →</span></div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
    <p className="text-center text-[10px] text-white/30 mt-2">swipe →</p>
  </Panel>
);

const V4 = () => (
  <Panel>
    <div className="overflow-hidden">
      <div className="flex w-max animate-ticker-scroll">
        {[0, 1].map((d) => (
          <div key={d} className="flex items-center shrink-0 text-sm text-white/70">
            {ITEMS.map((it) => (<span key={it.id} className="flex items-center"><span className="px-4">{it.title}</span><span className="text-primary/60">•</span></span>))}
          </div>
        ))}
      </div>
    </div>
  </Panel>
);

const V5 = () => (
  <Panel>
    <ul className="space-y-3">
      {ITEMS.map((it, i) => (
        <li key={it.id} className="flex gap-3">
          <span className="font-mono text-xs text-white/25 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
          <span className="w-0.5 self-stretch bg-primary/40 rounded" />
          <div>
            <div className="text-[10px] font-mono text-white/40 mb-0.5"><span className="uppercase">{it.cat}</span> · {it.time}</div>
            <div className="text-sm text-white/90 leading-snug">{it.title}</div>
          </div>
        </li>
      ))}
    </ul>
  </Panel>
);

const V6 = () => (
  <Panel>
    <a className="block rounded-xl overflow-hidden border border-white/10 mb-3">
      <div className="aspect-[16/8] bg-cover bg-center" style={{ backgroundImage: `url(${ITEMS[0].img})` }} />
      <div className="p-3"><span className={`px-2 py-0.5 rounded text-[9px] uppercase ring-1 ${cat(ITEMS[0].cat)}`}>{ITEMS[0].cat}</span><p className="text-sm text-white/90 mt-1 leading-snug">{ITEMS[0].title}</p></div>
    </a>
    <ul className="space-y-2">
      {ITEMS.slice(1).map((it) => (
        <li key={it.id} className="flex justify-between gap-3 text-sm text-white/80 border-b border-white/5 pb-2"><span className="line-clamp-1">{it.title}</span><span className="font-mono text-[10px] text-white/40 shrink-0">{it.time}</span></li>
      ))}
    </ul>
  </Panel>
);

const V7 = () => (
  <Panel>
    <ul className="space-y-3">
      {ITEMS.map((it) => (
        <li key={it.id} className="flex gap-3">
          <div className="w-16 h-12 rounded-lg bg-cover bg-center shrink-0 border border-white/10" style={{ backgroundImage: `url(${it.img})` }} />
          <div><p className="text-sm text-white/90 leading-snug line-clamp-2">{it.title}</p><p className="text-[10px] font-mono text-white/40 mt-1"><span className="uppercase">{it.cat}</span> · {it.time}</p></div>
        </li>
      ))}
    </ul>
  </Panel>
);

const V8 = () => (
  <div className="rounded-2xl bg-card border border-border p-4">
    <div className="flex items-center gap-3 mb-3"><h3 className="text-sm font-bold tracking-wide uppercase text-foreground">World Tech in Brief</h3><span className="flex-1 h-px bg-border" /><span className="text-xs text-primary">More →</span></div>
    <ul>
      {ITEMS.map((it) => (
        <li key={it.id} className="py-2 border-b border-border"><span className="text-sm text-foreground leading-snug">{it.title}</span> <span className="text-xs text-muted-foreground whitespace-nowrap">{it.cat} · {it.time}</span></li>
      ))}
    </ul>
  </div>
);

const V9 = () => (
  <Panel>
    <div className="flex gap-1.5 mb-3 flex-wrap">
      {["All", "AI", "Gadgets", "Startups", "Health"].map((t, i) => (<span key={t} className={`px-2.5 py-1 rounded-full text-[11px] ${i === 0 ? "bg-primary text-primary-foreground" : "bg-white/5 text-white/60 border border-white/10"}`}>{t}</span>))}
    </div>
    <ul className="space-y-0.5">
      {ITEMS.map((it) => (<li key={it.id} className="flex justify-between gap-3 py-2 border-b border-white/5"><span className="text-sm text-white/85 leading-snug">{it.title}</span><span className="font-mono text-[10px] text-white/35 shrink-0">{it.time}</span></li>))}
    </ul>
  </Panel>
);

const V10 = () => (
  <Panel>
    <ul className="space-y-3">
      {ITEMS.map((it, i) => (
        <li key={it.id} className="flex gap-3 items-baseline">
          <span className="font-mono text-lg font-bold text-white/15">{String(i + 1).padStart(2, "0")}</span>
          <span className="text-primary/40">─</span>
          <span className="flex-1 text-[15px] font-semibold text-white/90 leading-snug">{it.title}</span>
          <span className="font-mono text-[10px] text-white/35 shrink-0">{it.time} →</span>
        </li>
      ))}
    </ul>
  </Panel>
);

const VARIANTS = [
  ["1 · Single-column list", <V1 key="1" />],
  ["2 · Headline-only (max title room)", <V2 key="2" />],
  ["3 · Swipeable cards (try swiping)", <V3 key="3" />],
  ["4 · Marquee ticker (auto-scrolls)", <V4 key="4" />],
  ["5 · Tag-above-title", <V5 key="5" />],
  ["6 · Top story + slim list", <V6 key="6" />],
  ["7 · Thumbnail list", <V7 key="7" />],
  ["8 · Light / editorial", <V8 key="8" />],
  ["9 · Category-tabbed", <V9 key="9" />],
  ["10 · Numbered big-type", <V10 key="10" />],
] as const;

export default function WirePreviews() {
  return (
    <Layout>
      <SEOHead title="World Tech — Design Options" description="Internal preview of World Tech in Brief layouts." noindex canonical="/wire-preview" />
      <div className="container py-10 max-w-5xl">
        <h1 className="text-2xl font-bold mb-1">"World Tech in Brief" — 10 layout options</h1>
        <p className="text-muted-foreground mb-8 text-sm">Each is shown at phone width (≈390px) so you see the mobile layout. Pick a number and tell me — I'll wire it to the live feed. (This page is temporary &amp; not indexed.)</p>
        <div className="grid sm:grid-cols-2 gap-8">
          {VARIANTS.map(([label, node]) => (
            <div key={label}>
              <div className="text-sm font-semibold text-foreground mb-2">{label}</div>
              <div className="w-[390px] max-w-full">{node}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
