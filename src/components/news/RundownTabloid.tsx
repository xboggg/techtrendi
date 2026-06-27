import DOMPurify from "isomorphic-dompurify"; // SSG-safe: works in Node build + browser

/**
 * Tabloid-style front-page layout for "The Rundown" daily briefing articles.
 * Loud red masthead, huge black uppercase headlines, 2-up story blocks.
 * Used by NewsArticle when the slug starts with "the-rundown-".
 */

interface RundownTabloidProps {
  title: string;
  excerpt?: string | null;
  content: string;
  createdAt: string;
}

// Split the article HTML into an intro + array of {heading, html} stories (h3 = story).
function parseStories(html: string) {
  const clean = DOMPurify.sanitize(html, { ADD_ATTR: ["target", "rel", "class"] });
  const parts = clean.split(/<h3[^>]*>/i);
  const intro = parts[0];
  const stories = parts.slice(1).map((chunk) => {
    const end = chunk.indexOf("</h3>");
    const heading = (end >= 0 ? chunk.slice(0, end) : "").replace(/<[^>]+>/g, "").trim();
    const body = end >= 0 ? chunk.slice(end + 5) : chunk;
    return { heading, html: body };
  });
  return { intro, stories };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function RundownTabloid({ title, excerpt, content, createdAt }: RundownTabloidProps) {
  const { intro, stories } = parseStories(content);
  const headline = title.replace(/^The Rundown\s*[-–—:]\s*/i, "");

  return (
    <div className="bg-white text-black rounded-2xl overflow-hidden shadow-xl border-4 border-black">
      {/* Masthead */}
      <div className="bg-red-600 text-white px-5 md:px-8 py-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-4xl font-black italic tracking-tight leading-none" style={{ fontFamily: "'Arial Black', system-ui, sans-serif" }}>
          THE RUNDOWN
        </h1>
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-right shrink-0">{fmtDate(createdAt)}</span>
      </div>

      <div className="p-5 md:p-10">
        {/* Lead headline */}
        <h2 className="text-3xl md:text-6xl font-black uppercase leading-[0.95] tracking-tight mb-4" style={{ fontFamily: "'Arial Black', system-ui, sans-serif" }}>
          {headline}
        </h2>
        {excerpt && (
          <p className="text-base md:text-lg font-bold text-red-600 mb-6 border-y-2 border-black py-2.5">{excerpt}</p>
        )}

        {/* Intro */}
        <div
          className="text-base leading-relaxed mb-8 [&_p]:mb-3 [&_strong]:font-black [&_a]:underline [&_a]:text-red-600"
          dangerouslySetInnerHTML={{ __html: intro }}
        />

        {/* Stories — 2-up blocks */}
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-7">
          {stories.map((s, i) => (
            <div key={i} className="border-t-4 border-black pt-3 break-inside-avoid">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-red-600 font-black text-lg shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-xl md:text-2xl font-black uppercase leading-[1.05] tracking-tight" style={{ fontFamily: "'Arial Black', system-ui, sans-serif" }}>
                  {s.heading}
                </h3>
              </div>
              <div
                className="text-[15px] leading-relaxed [&_p]:mb-2.5 [&_strong]:font-black [&_a]:underline [&_a]:text-red-600"
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
            </div>
          ))}
        </div>

        {/* Footer rule */}
        <div className="mt-9 pt-4 border-t-4 border-black flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-black/60">
          <span>TechTrendi · The Rundown</span>
          <span>World Tech, Briefed</span>
        </div>
      </div>
    </div>
  );
}

export default RundownTabloid;
