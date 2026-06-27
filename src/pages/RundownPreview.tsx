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
            <Sparkles className="w-4 h-4" /> 2 newspaper styles — pick one
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

          <div className="text-center text-sm text-muted-foreground pb-10">Reply with A or B and I'll apply it to the live Rundown article page.</div>
        </div>
      )}
    </Layout>
  );
}
