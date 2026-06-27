import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

/* Preview page (/rundown-preview, noindex): renders the latest Rundown article
   in TWO newspaper-style layouts so the owner can pick. Throwaway. */

interface Rundown {
  title: string;
  excerpt: string | null;
  content: string;
  created_at: string;
}

// Split the article HTML into the intro paragraph + an array of {heading, html} stories.
function parseStories(html: string) {
  const parts = html.split(/<h3[^>]*>/i);
  const intro = parts[0]; // everything before first h3
  const stories = parts.slice(1).map((chunk) => {
    const endIdx = chunk.indexOf("</h3>");
    const heading = endIdx >= 0 ? chunk.slice(0, endIdx) : "";
    const body = endIdx >= 0 ? chunk.slice(endIdx + 5) : chunk;
    return { heading: heading.replace(/<[^>]+>/g, "").trim(), html: body };
  });
  return { intro, stories };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* ---------- Style A: Classic Broadsheet ---------- */
function Broadsheet({ r }: { r: Rundown }) {
  const { intro, stories } = parseStories(r.content);
  const title = r.title.replace(/^The Rundown\s*[-–—:]\s*/i, "");
  return (
    <div className="bg-[#f7f3e9] text-[#1a1a1a] p-6 md:p-10 rounded-lg shadow-xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Masthead */}
      <div className="text-center border-b-4 border-black pb-3 mb-1">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest mb-2">
          <span>Tech Edition</span>
          <span>techtrendi.com</span>
          <span>Free</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          The Rundown
        </h1>
      </div>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] border-b border-black py-1.5 mb-6">
        <span>{fmtDate(r.created_at)}</span>
        <span>World Tech, Briefed</span>
        <span>No. 001</span>
      </div>

      {/* Lead headline */}
      <h2 className="text-3xl md:text-5xl font-black text-center leading-tight mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        {title}
      </h2>
      {r.excerpt && (
        <p className="text-center italic text-base md:text-lg mb-6 max-w-2xl mx-auto border-b border-black/30 pb-4">{r.excerpt}</p>
      )}

      {/* Multi-column body */}
      <div className="md:columns-2 lg:columns-3 gap-7 [column-rule:1px_solid_rgba(0,0,0,0.2)] text-[15px] leading-relaxed text-justify">
        {/* intro with drop cap */}
        <div className="mb-4 [&_p:first-of-type::first-letter]:text-6xl [&_p:first-of-type::first-letter]:font-black [&_p:first-of-type::first-letter]:float-left [&_p:first-of-type::first-letter]:mr-2 [&_p:first-of-type::first-letter]:leading-[0.8]"
             dangerouslySetInnerHTML={{ __html: intro }} />
        {stories.map((s, i) => (
          <div key={i} className="mb-5 break-inside-avoid">
            <h3 className="text-lg font-black mb-1 leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {s.heading}
            </h3>
            <div className="[&_p]:mb-2 [&_strong]:font-bold [&_a]:underline" dangerouslySetInnerHTML={{ __html: s.html }} />
            <div className="text-center text-black/30 my-2">— ◆ —</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Style B: Modern Editorial Magazine ---------- */
function Editorial({ r }: { r: Rundown }) {
  const { intro, stories } = parseStories(r.content);
  const title = r.title.replace(/^The Rundown\s*[-–—:]\s*/i, "");
  return (
    <div className="bg-background text-foreground p-6 md:p-10 rounded-2xl border border-border shadow-xl">
      <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.25em] text-primary mb-6">
        <span className="h-px w-8 bg-primary" /> The Rundown · {fmtDate(r.created_at)}
      </div>
      <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-5">{title}</h2>
      {r.excerpt && <p className="text-xl md:text-2xl text-muted-foreground leading-snug mb-8 max-w-3xl">{r.excerpt}</p>}
      <div className="text-lg leading-relaxed text-muted-foreground mb-10 max-w-3xl [&_p]:mb-4 [&_strong]:text-foreground [&_a]:text-primary"
           dangerouslySetInnerHTML={{ __html: intro }} />

      <div className="space-y-10">
        {stories.map((s, i) => (
          <div key={i} className="grid md:grid-cols-[auto_1fr] gap-5 md:gap-8 border-t border-border pt-7">
            <span className="text-5xl md:text-6xl font-black text-primary/20 leading-none">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-3">{s.heading}</h3>
              <div className="text-base md:text-lg leading-relaxed text-muted-foreground [&_p]:mb-3 [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline"
                   dangerouslySetInnerHTML={{ __html: s.html }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Style C: Financial Times / "Pink Paper" ---------- */
function FinancialTimes({ r }: { r: Rundown }) {
  const { intro, stories } = parseStories(r.content);
  const title = r.title.replace(/^The Rundown\s*[-–—:]\s*/i, "");
  return (
    <div className="bg-[#fff1e5] text-[#33302e] p-6 md:p-10 rounded-lg shadow-xl" style={{ fontFamily: "Georgia, serif" }}>
      <div className="flex items-center justify-between border-b-2 border-[#33302e] pb-2 mb-1">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>The Rundown</h1>
        <span className="text-[10px] uppercase tracking-widest text-[#990f3d]">Tech · Markets · Africa</span>
      </div>
      <div className="text-[11px] uppercase tracking-[0.15em] text-[#66605c] border-b border-[#33302e]/30 py-1.5 mb-6">{fmtDate(r.created_at)}</div>
      <span className="inline-block bg-[#990f3d] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mb-3">Lead Story</span>
      <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</h2>
      {r.excerpt && <p className="text-lg text-[#66605c] mb-6 max-w-3xl">{r.excerpt}</p>}
      <div className="md:columns-2 gap-8 [column-rule:1px_solid_rgba(51,48,46,0.2)] text-[15px] leading-relaxed">
        <div className="mb-4" dangerouslySetInnerHTML={{ __html: intro }} />
        {stories.map((s, i) => (
          <div key={i} className="mb-5 break-inside-avoid">
            <h3 className="text-lg font-bold mb-1 text-[#990f3d]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{s.heading}</h3>
            <div className="[&_p]:mb-2 [&_strong]:font-bold [&_a]:text-[#990f3d] [&_a]:underline" dangerouslySetInnerHTML={{ __html: s.html }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Style D: Dark "Terminal Wire" (Bloomberg/Reuters feed) ---------- */
function TerminalWire({ r }: { r: Rundown }) {
  const { intro, stories } = parseStories(r.content);
  const title = r.title.replace(/^The Rundown\s*[-–—:]\s*/i, "");
  return (
    <div className="bg-[#0a0e17] text-slate-200 p-6 md:p-10 rounded-2xl border border-amber-500/20 shadow-2xl" style={{ fontFamily: "'Courier New', monospace" }}>
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-400 font-bold tracking-[0.3em] text-sm">THE RUNDOWN ⟩⟩ WIRE</span>
        </div>
        <span className="text-[10px] text-slate-500 uppercase">{fmtDate(r.created_at)}</span>
      </div>
      <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3" style={{ fontFamily: "system-ui, sans-serif" }}>{title}</h2>
      {r.excerpt && <p className="text-amber-200/70 text-sm md:text-base mb-6">{r.excerpt}</p>}
      <div className="text-sm leading-relaxed text-slate-300 mb-6 [&_p]:mb-3 [&_strong]:text-white [&_a]:text-amber-400" dangerouslySetInnerHTML={{ __html: intro }} />
      <div className="space-y-5">
        {stories.map((s, i) => (
          <div key={i} className="border-l-2 border-amber-500/40 pl-4">
            <div className="text-amber-400 text-xs mb-1">{String(i + 1).padStart(2, "0")} ⟩ <span className="font-bold tracking-wide" style={{ fontFamily: "system-ui, sans-serif" }}>{s.heading.toUpperCase()}</span></div>
            <div className="text-sm leading-relaxed text-slate-300 [&_p]:mb-2 [&_strong]:text-white [&_a]:text-amber-400 [&_a]:underline" style={{ fontFamily: "system-ui, sans-serif" }} dangerouslySetInnerHTML={{ __html: s.html }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Style E: Tabloid / Bold Cover ---------- */
function Tabloid({ r }: { r: Rundown }) {
  const { intro, stories } = parseStories(r.content);
  const title = r.title.replace(/^The Rundown\s*[-–—:]\s*/i, "");
  return (
    <div className="bg-white text-black rounded-2xl overflow-hidden shadow-xl border-4 border-black">
      <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-black italic tracking-tight" style={{ fontFamily: "'Arial Black', system-ui, sans-serif" }}>THE RUNDOWN</h1>
        <span className="text-xs font-bold uppercase">{fmtDate(r.created_at)}</span>
      </div>
      <div className="p-6 md:p-10">
        <h2 className="text-4xl md:text-6xl font-black uppercase leading-[0.95] tracking-tight mb-3" style={{ fontFamily: "'Arial Black', system-ui, sans-serif" }}>{title}</h2>
        {r.excerpt && <p className="text-lg font-bold text-red-600 mb-6 border-y-2 border-black py-2">{r.excerpt}</p>}
        <div className="text-base leading-relaxed mb-6 [&_p]:mb-3 [&_strong]:font-black" dangerouslySetInnerHTML={{ __html: intro }} />
        <div className="grid md:grid-cols-2 gap-6">
          {stories.map((s, i) => (
            <div key={i} className="border-t-4 border-black pt-3">
              <h3 className="text-xl font-black uppercase leading-tight mb-2" style={{ fontFamily: "'Arial Black', system-ui, sans-serif" }}>{s.heading}</h3>
              <div className="text-[15px] leading-relaxed [&_p]:mb-2 [&_strong]:font-black [&_a]:underline" dangerouslySetInnerHTML={{ __html: s.html }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Style F: Minimal Swiss / Typographic ---------- */
function Swiss({ r }: { r: Rundown }) {
  const { intro, stories } = parseStories(r.content);
  const title = r.title.replace(/^The Rundown\s*[-–—:]\s*/i, "");
  return (
    <div className="bg-white text-neutral-900 p-6 md:p-12 rounded-2xl border border-neutral-200 shadow-xl" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-10 border-b-2 border-black pb-6 mb-8">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest">The Rundown</div>
          <div className="text-[11px] text-neutral-500 mt-1">{fmtDate(r.created_at)}</div>
          <div className="text-[11px] text-neutral-500">Edition 001</div>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.05]">{title}</h2>
      </div>
      {r.excerpt && <p className="text-lg text-neutral-600 mb-8 md:pl-[170px]">{r.excerpt}</p>}
      <div className="text-base leading-relaxed text-neutral-700 mb-10 md:pl-[170px] max-w-2xl [&_p]:mb-4 [&_strong]:text-black [&_a]:underline" dangerouslySetInnerHTML={{ __html: intro }} />
      <div className="space-y-8">
        {stories.map((s, i) => (
          <div key={i} className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-10 border-t border-neutral-200 pt-6">
            <div className="text-sm font-mono text-neutral-400">{String(i + 1).padStart(2, "0")} / {String(stories.length).padStart(2, "0")}</div>
            <div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-2">{s.heading}</h3>
              <div className="text-[15px] leading-relaxed text-neutral-700 max-w-2xl [&_p]:mb-2 [&_strong]:text-black [&_a]:underline" dangerouslySetInnerHTML={{ __html: s.html }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RundownPreview() {
  const [r, setR] = useState<Rundown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("news")
        .select("title, excerpt, content, created_at")
        .like("slug", "the-rundown-%")
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data[0]) setR(data[0] as Rundown);
      setLoading(false);
    })();
  }, []);

  return (
    <Layout>
      <SEOHead title="Rundown — Newspaper Design Preview" description="Internal preview." canonical="/rundown-preview" noindex />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />

      <div className="bg-gradient-to-b from-primary/5 to-background py-10 text-center">
        <div className="container">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-3">
            <Sparkles className="w-4 h-4" /> 6 newspaper styles — pick one
          </span>
          <h1 className="text-2xl md:text-3xl font-black">The Rundown — Newspaper Design Lab</h1>
          <p className="text-muted-foreground mt-2">Both render today's real Rundown. Tell me A or B.</p>
        </div>
      </div>

      {loading && <div className="container py-20 text-center text-muted-foreground">Loading today's Rundown…</div>}
      {!loading && !r && <div className="container py-20 text-center text-muted-foreground">No Rundown found yet.</div>}

      {r && (
        <div className="container py-10 space-y-16 max-w-5xl">
          <div>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-4xl font-black text-muted-foreground/30">A</span>
              <div>
                <h2 className="text-xl font-bold">Classic Broadsheet</h2>
                <p className="text-sm text-muted-foreground">Masthead, serif, multi-column, drop cap — a real printed paper.</p>
              </div>
            </div>
            <Broadsheet r={r} />
          </div>

          <div>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-4xl font-black text-muted-foreground/30">B</span>
              <div>
                <h2 className="text-xl font-bold">Modern Editorial Magazine</h2>
                <p className="text-sm text-muted-foreground">Big bold sans, numbered stories, generous whitespace.</p>
              </div>
            </div>
            <Editorial r={r} />
          </div>

          <div>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-4xl font-black text-muted-foreground/30">C</span>
              <div>
                <h2 className="text-xl font-bold">Financial Times — "Pink Paper"</h2>
                <p className="text-sm text-muted-foreground">Salmon background, serif, crimson accents, lead-story badge. Business-press feel.</p>
              </div>
            </div>
            <FinancialTimes r={r} />
          </div>

          <div>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-4xl font-black text-muted-foreground/30">D</span>
              <div>
                <h2 className="text-xl font-bold">Terminal Wire (Bloomberg/Reuters)</h2>
                <p className="text-sm text-muted-foreground">Dark trading-terminal look, amber accents, monospace masthead, numbered wire items.</p>
              </div>
            </div>
            <TerminalWire r={r} />
          </div>

          <div>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-4xl font-black text-muted-foreground/30">E</span>
              <div>
                <h2 className="text-xl font-bold">Tabloid / Bold Cover</h2>
                <p className="text-sm text-muted-foreground">Loud red masthead, huge black headlines, 2-up story blocks. High-impact, punchy.</p>
              </div>
            </div>
            <Tabloid r={r} />
          </div>

          <div>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-4xl font-black text-muted-foreground/30">F</span>
              <div>
                <h2 className="text-xl font-bold">Minimal Swiss / Typographic</h2>
                <p className="text-sm text-muted-foreground">Clean grid, Helvetica, lots of whitespace, story index numbers. Understated &amp; premium.</p>
              </div>
            </div>
            <Swiss r={r} />
          </div>

          <div className="text-center text-sm text-muted-foreground pb-10">Reply with A, B, C, D, E or F and I'll apply it to the live Rundown article page.</div>
        </div>
      )}
    </Layout>
  );
}
