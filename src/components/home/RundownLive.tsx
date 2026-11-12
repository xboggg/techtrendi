import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// "The Rundown" box on the homepage, beside "Fresh from Ghana & Africa"
// (owner's pick, 11 Nov 2026: design 11 from the redesign canvas, with every
// topic of today's edition listed and the four earlier days below, "with
// moving parts"). Everything here loads after mount, like the news beside it,
// so nothing depends on the clock or the browser during the prerender.
//
// The topics are the edition's <h3> story headings — the same split
// RundownTabloid uses to lay out the article.
//
// Motion (all off for "reduce motion", see .rl-* in index.css): a rotating
// light border, drifting glows, a scrolling grid, a scan line, topics that
// rise in when the box scrolls into view, and a spotlight that walks down
// the topics (paused while the pointer or keyboard focus is inside).

export interface RundownEdition {
  id: string;
  title: string;
  slug: string;
  created_at: string;
}

const MAX_TOPICS = 10;
const SPOT_MS = 2600;

const cleanTitle = (t: string) => t.replace(/^The Rundown\s*[-–—:]\s*/i, "").replace(/^[A-Z][a-z]+ \d{1,2}:\s*/, "");

function topicsFrom(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.querySelectorAll("h3"))
    .map((h) => (h.textContent || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, MAX_TOPICS);
}

export function RundownLive({ editions }: { editions: RundownEdition[] }) {
  const [today, ...earlier] = editions;
  const [topics, setTopics] = useState<string[]>([]);
  const [spot, setSpot] = useState(0);
  const [paused, setPaused] = useState(false);
  const [shown, setShown] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const todayId = today?.id;
  useEffect(() => {
    if (!todayId) return;
    let alive = true;
    supabase.from("news").select("content").eq("id", todayId).maybeSingle()
      .then(({ data }) => {
        if (alive && data?.content) setTopics(topicsFrom(data.content));
      }, () => { /* topics stay as placeholders; the links still work */ });
    return () => { alive = false; };
  }, [todayId]);

  // Rise-in once the box is on screen (no observer support: show at once).
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setShown(true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shown || paused || topics.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setSpot((s) => (s + 1) % topics.length), SPOT_MS);
    return () => clearInterval(id);
  }, [shown, paused, topics.length]);

  if (!today) return null;
  const when = new Date(today.created_at);
  const dayLabel = when.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div
      ref={boxRef}
      className={cn("rl-frame relative rounded-3xl p-[2px] h-full", shown && "rl-shown")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative h-full overflow-hidden rounded-[22px] bg-[#0b1020] text-white p-6 md:p-7 flex flex-col">
        {/* Background motion: two drifting glows, a moving grid, a scan line */}
        <div aria-hidden="true" className="rl-glow-a pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div aria-hidden="true" className="rl-glow-b pointer-events-none absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-blue-500/25 blur-3xl" />
        <div aria-hidden="true" className="rl-grid pointer-events-none absolute inset-0 opacity-[0.05]" />
        <div aria-hidden="true" className="rl-scan pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-emerald-300/10 to-transparent" />

        <div className="relative flex flex-col h-full">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none">The Rundown</h2>
            <span className="ml-auto text-[11px] text-white/55">World tech, daily</span>
          </div>

          <span className="rl-up mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300" style={{ "--d": "80ms" } as React.CSSProperties}>
            {dayLabel}
          </span>
          <Link
            to={`/news/${today.slug}`}
            className="rl-up rl-title mt-2 text-2xl md:text-[1.7rem] font-black leading-[1.12] tracking-tight"
            style={{ "--d": "160ms" } as React.CSSProperties}
          >
            {cleanTitle(today.title)}
          </Link>

          <ol className="mt-4 flex flex-col gap-0.5" aria-label="Today's topics">
            {topics.length === 0
              ? [0, 1, 2, 3, 4].map((i) => <li key={i} className="h-6 my-0.5 rounded bg-white/5 animate-pulse" />)
              : topics.map((t, i) => (
                <li key={i} className="rl-up" style={{ "--d": `${240 + i * 70}ms` } as React.CSSProperties}>
                  <Link
                    to={`/news/${today.slug}`}
                    className={cn(
                      "rl-topic relative flex gap-2.5 rounded-lg px-2 py-1.5 -mx-2 text-[13.5px] leading-snug transition-colors duration-500",
                      i === spot ? "is-spot bg-white/[0.07] text-white" : "text-white/80 hover:text-white",
                    )}
                  >
                    <span className={cn("w-5 shrink-0 text-right font-black tabular-nums transition-colors duration-500", i === spot ? "text-emerald-300" : "text-emerald-400/70")}>
                      {i + 1}
                    </span>
                    <span>{t}</span>
                  </Link>
                </li>
              ))}
          </ol>

          <Link
            to={`/news/${today.slug}`}
            className="cta-sheen rl-up mt-5 self-start inline-flex items-center gap-2 rounded-full bg-white text-[#0b1020] font-bold text-sm px-5 py-2.5 hover:gap-3 transition-all"
            style={{ "--d": `${300 + topics.length * 70}ms` } as React.CSSProperties}
          >
            Read today&apos;s briefing <ArrowRight className="w-4 h-4" />
          </Link>

          {earlier.length > 0 && (
            <div className="mt-auto pt-5">
              <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
                {earlier.slice(0, 4).map((e, i) => (
                  <Link
                    key={e.id}
                    to={`/news/${e.slug}`}
                    className="rl-up rl-day group flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white"
                    style={{ "--d": `${400 + topics.length * 70 + i * 90}ms` } as React.CSSProperties}
                  >
                    <span className="text-emerald-300 shrink-0">
                      {new Date(e.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                    <span className="text-white/40">·</span>
                    <span className="truncate">{cleanTitle(e.title)}</span>
                    <ArrowRight className="rl-nudge w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
