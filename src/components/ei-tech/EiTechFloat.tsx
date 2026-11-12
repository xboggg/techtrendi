import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { eiTechImage, eiTechSharePath, eiTechWebp, useEiTechMemes, type EiTechMeme } from "@/data/eiTech";
import { EiTechLaughButton, EiTechVote, useEiTechReactions } from "@/components/ei-tech/EiTechReactions";
import { cn } from "@/lib/utils";

// Floating "Ei Tech!" neon button, bottom-left on (almost) every page — owner's pick
// (sample 19, 12 Nov 2026) to replace the big Ei Tech! card on the homepage.
// Tap → a small pop-up with the newest meme, 😂 + vote, and "More jokes".
//
// - Browser-only (mounted in RootLayout inside <ClientOnly>, lazy-loaded), so the
//   prerendered HTML, SEO and AdSense are untouched.
// - The neon FLICKERS only while there is a meme this visitor hasn't opened yet;
//   once they open it, it glows steadily until the next new meme.
// - Never sits on a Google anchor ad: if one is showing at the bottom, the button
//   lifts above it. Hidden on pages where it would get in the way (below).
// - Sits bottom-LEFT so it never covers the AI chat button (bottom-right).

const HIDE_ON = ["/ei-tech", "/admin", "/careers", "/data-bundles", "/tools-preview", "/arcade", "/auth"];
const SEEN_KEY = "eitech_fab_seen";

function readSeen(): string {
  try { return localStorage.getItem(SEEN_KEY) || ""; } catch { return ""; }
}
function saveSeen(slug: string) {
  try { localStorage.setItem(SEEN_KEY, slug); } catch { /* storage blocked: it just keeps flickering */ }
}

/** Height of a Google anchor ad showing at the bottom of the screen (0 if none). */
function bottomAnchorHeight(): number {
  const ad = document.querySelector<HTMLElement>('ins.adsbygoogle[data-anchor-status="displayed"], ins.adsbygoogle[data-anchor-shown="true"]');
  if (!ad) return 0;
  const r = ad.getBoundingClientRect();
  if (r.height < 1 || r.bottom < window.innerHeight - 4) return 0; // not a bottom anchor (or hidden)
  return Math.round(window.innerHeight - r.top);
}

export default function EiTechFloat() {
  const { pathname } = useLocation();
  const meme = useEiTechMemes()[0];
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string | null>(null); // null until read after mount
  const [ready, setReady] = useState(false);
  const [lift, setLift] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const hidden = HIDE_ON.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    setSeen(readSeen());
    const t = setTimeout(() => setReady(true), 1200); // arrive after the page has settled
    return () => clearTimeout(t);
  }, []);

  // Keep clear of a bottom anchor ad (checked lightly; anchors come and go).
  useEffect(() => {
    const check = () => setLift(bottomAnchorHeight());
    check();
    const id = setInterval(check, 1500);
    return () => clearInterval(id);
  }, []);

  // Close on page change, Escape, or a tap outside.
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open]);

  if (!meme || hidden) return null;

  const fresh = seen !== null && seen !== meme.slug;
  const toggle = () => {
    setOpen((o) => !o);
    if (seen !== meme.slug) { saveSeen(meme.slug); setSeen(meme.slug); }
  };

  return (
    <div
      ref={boxRef}
      className={cn("eit-float fixed left-4 md:left-6 z-40 transition-[opacity,transform,bottom] duration-500", ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}
      style={{ bottom: `calc(${lift ? lift + 12 : 16}px + env(safe-area-inset-bottom, 0px))` }}
    >
      {open && <EiTechPopup meme={meme} onClose={() => setOpen(false)} />}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={fresh ? "Ei Tech! New funny tech meme" : "Ei Tech! Funny tech memes"}
        className={cn("eit-neon", fresh && "is-fresh")}
      >
        Ei Tech!
      </button>
    </div>
  );
}

function EiTechPopup({ meme, onClose }: { meme: EiTechMeme; onClose: () => void }) {
  const { counts, mine, react } = useEiTechReactions(meme);
  const link = eiTechSharePath(meme);
  return (
    <div
      role="dialog"
      aria-label="Ei Tech! newest meme"
      className="eit-pop absolute left-0 bottom-[calc(100%+12px)] w-[min(340px,calc(100vw-32px))] max-h-[min(78vh,640px)] overflow-y-auto rounded-2xl border border-border bg-card text-foreground shadow-2xl"
    >
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <span className="text-sm font-black tracking-tight">
          Ei <span className="text-orange-500">Tech!</span> <span className="font-semibold text-muted-foreground">· have a laugh</span>
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <Link to={link} onClick={onClose} className="block">
        <picture className="block">
          <source srcSet={eiTechWebp(meme)} type="image/webp" />
          <img
            src={eiTechImage(meme)}
            alt={meme.alt}
            width={meme.width}
            height={meme.height}
            className="block w-full max-h-[300px] object-cover object-[50%_45%]"
          />
        </picture>
      </Link>
      <div className="px-4 pt-3 pb-4">
        <Link to={link} onClick={onClose} className="block text-lg font-black leading-tight hover:text-orange-600">{meme.title}</Link>
        <p className="mt-1 text-sm text-muted-foreground">{meme.caption}</p>
        <EiTechVote meme={meme} counts={counts} mine={mine} onVote={(side) => react("vote", side)} />
        <div className="mt-3 flex items-center gap-2">
          <EiTechLaughButton count={counts ? counts.laugh : null} laughed={!!mine.laugh} onLaugh={() => react("laugh", "laugh")} />
          <Link
            to="/ei-tech"
            onClick={onClose}
            className="ml-auto inline-flex items-center gap-1.5 h-12 px-4 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
          >
            More jokes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
