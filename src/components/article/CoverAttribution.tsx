import { imageCreditLine, imageSourceLabel, type ImageAttribution } from "@/lib/imageAttribution";

// Small label in the bottom-right corner of a feature image ("AI Illustration", "Stock Photo"...).
// Drawn with CSS over the picture; the picture file is never changed. Place it inside the
// picture's `relative` box. Renders nothing when the cover has no label.
export function ImageSourceBadge({ attribution }: { attribution: ImageAttribution }) {
  const label = imageSourceLabel(attribution.image_source_type);
  if (!label) return null;
  return (
    <span
      className="pointer-events-none absolute bottom-2 right-2 sm:bottom-3 sm:right-3 rounded-md bg-black/55 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-white/90 backdrop-blur-[2px]"
    >
      {label}
    </span>
  );
}

// Caption and credit under a feature image, as the <figcaption> of the surrounding <figure>.
// Renders nothing when neither is set.
export function ImageCreditLine({ attribution, className = "" }: { attribution: ImageAttribution; className?: string }) {
  const line = imageCreditLine(attribution);
  if (!line) return null;
  return (
    <figcaption className={`mt-2 px-1 text-xs sm:text-sm leading-snug text-muted-foreground ${className}`}>
      {line.caption && <span>{line.caption}</span>}
      {line.caption && line.credit && " "}
      {line.credit && <span className="text-muted-foreground/80">Image: {line.credit}</span>}
    </figcaption>
  );
}
