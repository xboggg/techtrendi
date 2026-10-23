// "What changed" (owner, 23 Oct 2026): a small strip under the source line, shown ONLY when the
// networks really changed something in the last STRIP_DAYS days (ghana-changes.json: price,
// data, validity, new, ended; never curation or wording). At most 2 lines (1 on phones) plus
// "See all changes", which opens the last ALL_DAYS days in place. A network page shows its own
// network's changes only.
//
// No layout shift: the build saves the latest changes file (scripts/fetch-bundle-changes.mjs ->
// src/data/<country>DataBundleChanges.json) and the prerendered page shows the strip from it,
// judged at the file's own time (generatedAt). After mount the page reads the live file and the
// real date; the strip only moves when something really changed since the build. A missing,
// malformed or future-dated file shows nothing.
import { useId, useState } from "react";
import type { BundleModel } from "@/lib/dataBundles";
import { ALL_DAYS, STRIP_DAYS, dayLabel, groupChanges, parseChanges, recentChanges, changeLine, type ChangesDoc } from "@/lib/bundleChanges";
import { useBundleChanges } from "@/hooks/useBundleChanges";
import { cn } from "@/lib/utils";
import { useNow } from "./shared";
import ghanaChanges from "@/data/ghanaDataBundleChanges.json";

/** The build's copy of each country's changes file, and the time it was made. */
const BUNDLED: Record<string, { doc: ChangesDoc | null; at: Date | null }> = (() => {
  const at = new Date((ghanaChanges as { generatedAt?: string }).generatedAt ?? "");
  const ok = Number.isFinite(at.getTime());
  return { ghana: { doc: ok ? parseChanges(ghanaChanges, at) : null, at: ok ? at : null } };
})();

function Dot({ color }: { color: string }) {
  return <span aria-hidden className="mr-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full align-[0.05em] ring-1 ring-black/10 dark:ring-white/20" style={{ background: color }} />;
}

/** `placement`: "top" (under the source line; not on short phones) or "below-finder" (short
 *  phones only, so the finder's answer stays on the first screen there). */
export function WhatChanged({ model, country, network, placement = "top", className }: { model: BundleModel; country: string; network?: string; placement?: "top" | "below-finder"; className?: string }) {
  const live = useBundleChanges(country);
  const mounted = useNow();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const bundled = BUNDLED[country] ?? { doc: null, at: null };
  // Before mount (and on the server): the build's copy at its own time. After: the live file at the
  // real time; until it answers, or when it cannot be reached, the build's copy; when it answers
  // with a bad file (malformed, dated in the future), nothing.
  const doc = !mounted ? bundled.doc : live?.status === "ok" ? live.doc : live?.status === "bad" ? null : bundled.doc;
  const now = mounted ?? bundled.at;
  if (!doc || !now) return null;
  const week = groupChanges(model, recentChanges(doc, now, STRIP_DAYS, network)).slice(0, 2);
  if (!week.length) return null;
  const all = recentChanges(doc, now, ALL_DAYS, network);
  const color = (n: string) => model.networkInfo(n)?.color ?? "currentColor";
  const toggle = (cls: string) => (
    <button type="button" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)} data-testid="what-changed-all"
      className={cn("-my-3 ml-1 inline-flex min-h-11 items-center whitespace-nowrap align-middle font-semibold underline underline-offset-4 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", cls)}>
      {open ? "Hide changes" : "See all changes"}
    </button>
  );
  return (
    <section aria-label="What changed this week" data-testid="what-changed" data-placement={placement}
      className={cn("text-[15px] leading-snug lg:text-base sm:rounded-xl sm:border sm:border-border sm:bg-background/60 sm:px-3 sm:py-1.5",
        // Full class names (Tailwind only sees literal strings).
        placement === "top" ? "[@media(max-height:820px)_and_(max-width:639px)]:hidden" : "hidden [@media(max-height:820px)_and_(max-width:639px)]:block", className)}>
      <ul className="space-y-0.5">
        {week.map((g, i) => (
          <li key={`${g.date}-${g.network}-${g.kind}-${g.family}`} data-testid="what-changed-line" className={cn(i > 0 && "max-sm:hidden")}>
            <Dot color={color(g.network)} />
            {i === 0 && <b className="font-semibold">This week: </b>}{g.text} <span className="whitespace-nowrap text-foreground/80">({dayLabel(g.date)})</span>
            {/* "See all changes" ends the last line shown (phones show one line). */}
            {i === week.length - 1 ? toggle("") : i === 0 ? toggle("sm:hidden") : null}
          </li>
        ))}
      </ul>
      {open && (
        <ul id={listId} className="mt-1 space-y-1 pb-1" data-testid="what-changed-list">
          {all.map((c) => (
            <li key={`${c.date}-${c.network}-${c.kind}-${c.name}`}>
              <Dot color={color(c.network)} />
              {changeLine(model, c)} <span className="whitespace-nowrap text-foreground/80">({dayLabel(c.date)})</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
