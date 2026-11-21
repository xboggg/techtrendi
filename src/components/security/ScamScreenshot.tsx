import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Expand, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScamScreenshotProps {
  srcs: string[];
  title: string;
  className?: string;
}

/** Ordered screenshots for an alert: image_urls when set (slides), else the single image_url. */
export function alertImages(a: { image_url?: string | null; image_urls?: string[] | null }): string[] {
  const list = (a.image_urls || []).filter(Boolean);
  if (list.length) return list;
  return a.image_url ? [a.image_url] : [];
}

// Evidence panel for a scam alert: a cropped preview of the real scam screenshot
// (top of the picture, on a blurred copy of itself so wide cards don't show empty
// space) plus an in-page viewer for the full picture. Several screenshots (21 Nov
// 2026) become swipeable slides in the given order, with dots and arrows.
export function ScamScreenshot({ srcs, title, className }: ScamScreenshotProps) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const many = srcs.length > 1;
  const alt = (i: number) => `Screenshot ${many ? `${i + 1} of ${srcs.length} ` : ""}of the scam: ${title}`;

  const goTo = (i: number) => {
    const n = Math.max(0, Math.min(srcs.length - 1, i));
    setIdx(n);
    const el = track.current;
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setIdx((i) => Math.min(srcs.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [open, srcs.length]);

  // After the big view closes, show the same screenshot in the small slider.
  useEffect(() => {
    if (open) return;
    const el = track.current;
    if (el && Math.round(el.scrollLeft / Math.max(1, el.clientWidth)) !== idx) el.scrollTo({ left: idx * el.clientWidth });
  }, [open, idx]);

  if (!srcs.length) return null;

  return (
    <>
      <figure className={cn("overflow-hidden rounded-xl border border-border bg-muted/40", className)}>
        <figcaption className="flex items-center justify-between gap-1.5 px-4 py-2.5 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> What the scam looks like</span>
          {many && <span className="tabular-nums normal-case tracking-normal">{idx + 1} / {srcs.length}</span>}
        </figcaption>
        <div className="relative">
          <div
            ref={track}
            onScroll={(e) => {
              const el = e.currentTarget;
              const n = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
              if (n !== idx) setIdx(n);
            }}
            className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {srcs.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => { setIdx(i); setOpen(true); }}
                aria-label={`View screenshot ${i + 1} in full`}
                className="group relative block w-full shrink-0 snap-center h-72 sm:h-96 overflow-hidden bg-neutral-900"
              >
                <img src={src} alt="" aria-hidden="true" loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50" />
                <img src={src} alt={alt(i)} loading="lazy"
                  className="relative mx-auto w-full max-w-md shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]" />
                <span className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-neutral-950/90 via-neutral-950/50 to-transparent" />
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-lg group-hover:bg-neutral-100">
                  <Expand className="w-4 h-4" /> View full picture
                </span>
              </button>
            ))}
          </div>
          {many && (
            <>
              <button type="button" onClick={() => goTo(idx - 1)} disabled={idx === 0} aria-label="Previous screenshot"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white hover:bg-black/75 disabled:opacity-0 transition-opacity">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => goTo(idx + 1)} disabled={idx === srcs.length - 1} aria-label="Next screenshot"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white hover:bg-black/75 disabled:opacity-0 transition-opacity">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        {many && (
          <div className="flex justify-center gap-1.5 py-2.5">
            {srcs.map((src, i) => (
              <button key={src} type="button" onClick={() => goTo(i)} aria-label={`Go to screenshot ${i + 1}`}
                className={cn("h-2 rounded-full transition-all", i === idx ? "w-5 bg-primary" : "w-2 bg-muted-foreground/40")} />
            ))}
          </div>
        )}
      </figure>

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/85 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label={alt(idx)}
          // Phones: swipe left/right in the big view to go to the next/previous screenshot (owner, 21 Nov 2026).
          onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
          onTouchEnd={(e) => {
            const start = touch.current;
            touch.current = null;
            if (!start || !many) return;
            const dx = e.changedTouches[0].clientX - start.x;
            const dy = e.changedTouches[0].clientY - start.y;
            if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return; // a tap or an up/down scroll
            setIdx((i) => (dx < 0 ? Math.min(srcs.length - 1, i + 1) : Math.max(0, i - 1)));
          }}>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close"
            className="fixed top-4 right-4 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 transition-colors">
            <X className="w-6 h-6" />
          </button>
          {many && (
            <>
              <span className="fixed top-5 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white tabular-nums">
                {idx + 1} / {srcs.length}
              </span>
              <button type="button" onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.max(0, i - 1)); }} disabled={idx === 0}
                aria-label="Previous screenshot"
                className="fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 disabled:opacity-0">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.min(srcs.length - 1, i + 1)); }} disabled={idx === srcs.length - 1}
                aria-label="Next screenshot"
                className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 disabled:opacity-0">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img src={srcs[idx]} alt={alt(idx)} onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-md rounded-xl shadow-2xl" />
        </div>,
        document.body
      )}
    </>
  );
}
