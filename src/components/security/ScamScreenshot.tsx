import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Expand, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScamScreenshotProps {
  src: string;
  title: string;
  className?: string;
}

// Evidence panel for a scam alert: a cropped preview of the real scam message
// (top of the screenshot, on a blurred copy of itself so wide cards don't show
// empty space) plus an in-page viewer for the full picture.
export function ScamScreenshot({ src, title, className }: ScamScreenshotProps) {
  const [open, setOpen] = useState(false);
  const alt = `Screenshot of the scam message: ${title}`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [open]);

  return (
    <>
      <figure className={cn("overflow-hidden rounded-xl border border-border bg-muted/40", className)}>
        <figcaption className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ImageIcon className="w-3.5 h-3.5" /> What the fake message looks like
        </figcaption>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="View the full scam message"
          className="group relative block w-full h-72 sm:h-96 overflow-hidden bg-neutral-900"
        >
          <img src={src} alt="" aria-hidden="true" loading="lazy"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50" />
          <img src={src} alt={alt} loading="lazy"
            className="relative mx-auto w-full max-w-md shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]" />
          <span className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-neutral-950/90 via-neutral-950/50 to-transparent" />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-lg group-hover:bg-neutral-100">
            <Expand className="w-4 h-4" /> View full message
          </span>
        </button>
      </figure>

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/85 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label={alt}>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close"
            className="fixed top-4 right-4 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <img src={src} alt={alt} onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-md rounded-xl shadow-2xl" />
        </div>,
        document.body
      )}
    </>
  );
}
