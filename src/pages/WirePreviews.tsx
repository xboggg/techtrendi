import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

// Sample headlines (from the live "World Tech in Brief" section) so every option
// renders with realistic content. The chosen design will use the real feed.
const ITEMS = [
  { id: 1, cat: "Startups", title: "Flying Cars Are Coming — But First, These Air Taxi Giants Have to Stop Crashing", time: "14h ago", img: "/images/news/cybersecurity-a24c02fab4.jpg" },
  { id: 2, cat: "Gadgets", title: "OnePlus 15s Cancelled for India: Is the OnePlus 16 Launch at Risk?", time: "22h ago", img: "/images/news/cyber-identity-protection-2026.jpg" },
  { id: 3, cat: "Gadgets", title: "Galaxy Watch 9 and Watch Ultra 2 Leaks: Boxier Design, No Classic", time: "22h ago", img: "/images/news/cyber-travel-security-2026.jpg" },
  { id: 4, cat: "Startups", title: "From VLC to Robots: Jean-Baptiste Kempf's New Startup Kyber", time: "1d ago", img: "/images/news/cyber-scam-teardowns-2026.jpg" },
  { id: 5, cat: "Gadgets", title: "Why Car Makers Are Abandoning Android Auto by 2026", time: "1d ago", img: "/images/news/security-825fa75813.jpg" },
  { id: 6, cat: "Health", title: "Apple Health Now Detects Perimenopause Patterns", time: "1d ago", img: "/images/news/cyber-password-mistakes-2026.jpg" },
];

const CAT: Record<string, string> = {
  Startups: "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  Gadgets: "bg-cyan-500/20 text-cyan-300 ring-cyan-500/30",
  Health: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
};
const cat = (c: string) => CAT[c] || "bg-white/10 text-white/60 ring-white/15";

// shared dark band shell + header row (kept SHORT — this is a horizontal strip)
const Band = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <div className={`rounded-2xl border p-4 overflow-hidden ${light ? "bg-card border-border" : "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-white/10"}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-emerald-400">Live</span>
        <span className={`text-sm font-bold ${light ? "text-foreground" : "text-white"}`}>World Tech <span className={light ? "text-muted-foreground font-normal" : "text-white/40 font-normal"}>in Brief</span></span>
      </div>
      <span className={`font-mono text-[10px] ${light ? "text-primary" : "text-white/50"}`}>THE WIRE →</span>
    </div>
    {children}
  </div>
);

const railClass = "flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory";

// ── 10 HORIZONTAL-BAND variants ───────────────────────────────────────────────

// 1 · Side-scroll cards (mobile = swipe one rail, desktop = same rail full width)
const V1 = () => (
  <Band>
    <div className={railClass}>
      {ITEMS.map((it) => (
        <div key={it.id} className="snap-start shrink-0 w-[230px] rounded-xl bg-white/5 border border-white/10 p-3">
          <span className={`px-2 py-0.5 rounded text-[9px] uppercase ring-1 ${cat(it.cat)}`}>{it.cat}</span>
          <p className="text-[13px] text-white/90 mt-2 leading-snug line-clamp-3">{it.title}</p>
          <p className="font-mono text-[10px] text-white/40 mt-2">{it.time}</p>
        </div>
      ))}
    </div>
    <p className="text-center text-[10px] text-white/30 mt-2">← swipe →</p>
  </Band>
);

// 2 · Single ticker line scrolling sideways (most compact band)
const V2 = () => (
  <Band>
    <div className="overflow-hidden">
      <div className="flex w-max animate-ticker-scroll whitespace-nowrap text-sm text-white/80">
        {[0, 1].map((d) => (
          <span key={d} className="flex items-center">
            {ITEMS.map((it) => (
              <span key={it.id} className="flex items-center">
                <span className={`mx-3 px-1.5 py-0.5 rounded text-[9px] uppercase ring-1 ${cat(it.cat)}`}>{it.cat}</span>
                <span>{it.title}</span>
                <span className="text-primary/60 ml-3">•</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  </Band>
);

// 3 · Big lead card on the left + a couple stacked on the right (wide, short)
const V3 = () => (
  <Band>
    <div className="grid grid-cols-[1.4fr_1fr] gap-3">
      <a className="rounded-xl overflow-hidden border border-white/10 relative min-h-[120px] bg-cover bg-center flex items-end" style={{ backgroundImage: `url(${ITEMS[0].img})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
        <div className="relative p-3"><span className={`px-2 py-0.5 rounded text-[9px] uppercase ring-1 ${cat(ITEMS[0].cat)}`}>{ITEMS[0].cat}</span><p className="text-sm text-white font-semibold mt-1 leading-snug line-clamp-2">{ITEMS[0].title}</p></div>
      </a>
      <div className="flex flex-col gap-2">
        {ITEMS.slice(1, 4).map((it) => (
          <div key={it.id} className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
            <p className="text-[12px] text-white/85 leading-snug line-clamp-2">{it.title}</p>
            <p className="font-mono text-[9px] text-white/40 mt-1">{it.time}</p>
          </div>
        ))}
      </div>
    </div>
  </Band>
);

// 4 · Horizontal swipe of thumbnail tiles (image-led, wide rail)
const V4 = () => (
  <Band>
    <div className={railClass}>
      {ITEMS.map((it) => (
        <a key={it.id} className="snap-start shrink-0 w-[180px] rounded-xl overflow-hidden border border-white/10 bg-white/5">
          <div className="h-20 bg-cover bg-center" style={{ backgroundImage: `url(${it.img})` }} />
          <div className="p-2.5"><p className="text-[12px] text-white/90 leading-snug line-clamp-2">{it.title}</p><p className="font-mono text-[9px] text-white/40 mt-1">{it.time}</p></div>
        </a>
      ))}
    </div>
  </Band>
);

// 5 · Three columns side-by-side (mobile: horizontal scroll snaps to 1, desktop: 3 fit)
const V5 = () => (
  <Band>
    <div className="grid grid-flow-col auto-cols-[80%] sm:grid-flow-row sm:grid-cols-3 gap-3 overflow-x-auto sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
      {ITEMS.slice(0, 3).map((it, i) => (
        <div key={it.id} className="snap-start rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="flex items-center gap-2 mb-1"><span className="font-mono text-base font-bold text-white/15">{String(i + 1).padStart(2, "0")}</span><span className={`px-1.5 py-0.5 rounded text-[9px] uppercase ring-1 ${cat(it.cat)}`}>{it.cat}</span></div>
          <p className="text-[13px] text-white/90 leading-snug line-clamp-3">{it.title}</p>
          <p className="font-mono text-[9px] text-white/40 mt-2">{it.time}</p>
        </div>
      ))}
    </div>
  </Band>
);

// 6 · Embla auto-advancing cards (smooth, app-like) — wide band
const V6 = () => (
  <Band>
    <Carousel opts={{ loop: true, align: "start" }}>
      <CarouselContent className="-ml-3">
        {ITEMS.map((it) => (
          <CarouselItem key={it.id} className="pl-3 basis-[78%] sm:basis-1/2 lg:basis-1/3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 h-full flex flex-col">
              <span className={`self-start px-2 py-0.5 rounded text-[9px] uppercase ring-1 ${cat(it.cat)}`}>{it.cat}</span>
              <p className="text-[13px] text-white/90 mt-2 leading-snug line-clamp-3 flex-1">{it.title}</p>
              <div className="flex items-center justify-between mt-2 text-[10px] font-mono"><span className="text-white/40">{it.time}</span><span className="text-primary">Read →</span></div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
    <p className="text-center text-[10px] text-white/30 mt-2">swipe / auto-slides →</p>
  </Band>
);

// 7 · Two stacked ticker lines flowing opposite directions (dense band)
const V7 = () => (
  <Band>
    <div className="space-y-2">
      {[ITEMS.slice(0, 3), ITEMS.slice(3)].map((row, r) => (
        <div key={r} className="overflow-hidden">
          <div className={`flex w-max whitespace-nowrap text-[13px] ${r === 0 ? "animate-ticker-scroll" : "animate-ticker-scroll [animation-direction:reverse]"} text-white/75`}>
            {[0, 1].map((d) => (
              <span key={d} className="flex">
                {row.map((it) => (<span key={it.id} className="mx-3 flex items-center"><span className="text-primary/60 mr-2">›</span>{it.title}</span>))}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Band>
);

// 8 · Light / editorial wide band — horizontal divider row of headlines
const V8 = () => (
  <Band light>
    <div className={railClass.replace("pb-1", "pb-1")}>
      {ITEMS.map((it, i) => (
        <div key={it.id} className="snap-start shrink-0 w-[210px] border-l-2 border-primary/40 pl-3">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">{it.cat} · {it.time}</span>
          <p className="text-[13px] text-foreground font-medium mt-1 leading-snug line-clamp-3">{it.title}</p>
        </div>
      ))}
    </div>
  </Band>
);

// 9 · Numbered horizontal rail, big type, minimal chrome
const V9 = () => (
  <Band>
    <div className={railClass}>
      {ITEMS.map((it, i) => (
        <div key={it.id} className="snap-start shrink-0 w-[220px] flex gap-2">
          <span className="font-mono text-2xl font-bold text-primary/30 leading-none">{String(i + 1).padStart(2, "0")}</span>
          <div><p className="text-[13px] font-semibold text-white/90 leading-snug line-clamp-3">{it.title}</p><p className="font-mono text-[9px] text-white/40 mt-1">{it.time}</p></div>
        </div>
      ))}
    </div>
  </Band>
);

// 10 · Hero-strip: one rotating full-width headline with a thumbnail (very short band)
const V10 = () => (
  <Band>
    <a className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
      <div className="w-20 h-16 rounded-lg bg-cover bg-center shrink-0 border border-white/10" style={{ backgroundImage: `url(${ITEMS[0].img})` }} />
      <div className="min-w-0"><span className={`px-2 py-0.5 rounded text-[9px] uppercase ring-1 ${cat(ITEMS[0].cat)}`}>{ITEMS[0].cat}</span><p className="text-sm text-white font-semibold mt-1 leading-snug line-clamp-2">{ITEMS[0].title}</p></div>
    </a>
    <div className="flex items-center justify-center gap-1.5 mt-2">
      {ITEMS.slice(0, 5).map((it, i) => (<span key={it.id} className={`h-1 rounded-full ${i === 0 ? "w-5 bg-primary" : "w-1.5 bg-white/20"}`} />))}
    </div>
  </Band>
);

const VARIANTS: [string, JSX.Element][] = [
  ["1 · Side-scroll cards", <V1 key="1" />],
  ["2 · Single ticker line", <V2 key="2" />],
  ["3 · Big lead + side list", <V3 key="3" />],
  ["4 · Thumbnail tiles (swipe)", <V4 key="4" />],
  ["5 · Three columns side-by-side", <V5 key="5" />],
  ["6 · Auto-sliding cards", <V6 key="6" />],
  ["7 · Two scrolling lines", <V7 key="7" />],
  ["8 · Light / editorial strip", <V8 key="8" />],
  ["9 · Numbered big-type rail", <V9 key="9" />],
  ["10 · Hero strip (one + dots)", <V10 key="10" />],
];

export default function WirePreviews() {
  return (
    <Layout>
      <SEOHead title="World Tech — Design Options" description="Internal preview of World Tech in Brief layouts." noindex canonical="/wire-preview" />
      <div className="container py-10 max-w-3xl">
        <h1 className="text-2xl font-bold mb-1">"World Tech in Brief" — 10 horizontal-band options</h1>
        <p className="text-muted-foreground mb-8 text-sm">All redesigned as <strong>short, wide strips</strong> (the shape of the section on the homepage). On mobile they become swipe-rails or compact tickers — never a long scroll. Each is shown full-width below; <strong>narrow your browser / open on your phone</strong> to see the mobile behaviour. Pick a number and tell me.</p>
        <div className="space-y-8">
          {VARIANTS.map(([label, node]) => (
            <div key={label}>
              <div className="text-sm font-semibold text-foreground mb-2">{label}</div>
              {node}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
