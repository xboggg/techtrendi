// Price history in a bundle's "More info" (owner, 23 Oct 2026): "Price since 18 Oct: unchanged",
// or, when the price, data or validity changed, the change and a tiny step chart (inline SVG, no
// chart library) with the dates. The history file is fetched only when this "More info" opens
// (loadHistory: one request per page view, shared). Nothing is rendered on the server or before
// the file arrives, so the server HTML and the first paint never differ.
import { useEffect, useRef, useState } from "react";
import type { Bundle, BundleModel } from "@/lib/dataBundles";
import { dayLabel, historyView, type HistoryDoc, type HistoryPoint } from "@/lib/bundleChanges";
import { loadHistory } from "@/hooks/useBundleChanges";

/** The country of the page this runs on (/data-bundles/<country>...); Ghana by default. */
export const pageCountry = (path: string) => (path.match(/\/data-bundles\/([a-z-]+)/)?.[1] ?? "ghana");

export function PriceHistory({ model, b }: { model: BundleModel; b: Bundle }) {
  const ref = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<HistoryDoc | null>(null);
  useEffect(() => {
    if (b.computed) return;
    const el = ref.current?.closest("details");
    if (!el) return;
    let live = true;
    const load = () => { if (el.open) loadHistory(pageCountry(location.pathname)).then((d) => { if (live) setDoc(d); }); };
    load();
    el.addEventListener("toggle", load);
    return () => { live = false; el.removeEventListener("toggle", load); };
  }, [b.computed]);
  const v = doc ? historyView(model, doc, b) : null;
  return (
    <div ref={ref} data-testid="price-history-slot">
      {v && (
        <div data-testid="price-history" data-unchanged={v.unchanged ? "1" : "0"} className="text-[15px] text-foreground/85 lg:text-base">
          <p className="font-semibold">{v.text}</p>
          {!v.unchanged && <StepChart model={model} b={b} points={v.points} start={doc!.start} />}
        </div>
      )}
    </div>
  );
}

/** Two small step lines over the same dates: price (top) and data (bottom). The dates and
 *  figures are listed under it as text (the chart itself is decoration for screen readers). */
function StepChart({ model, b, points, start }: { model: BundleModel; b: Bundle; points: HistoryPoint[]; start: string }) {
  const W = 300, H = 64, PAD = 4, ROW = (H - PAD * 3) / 2;
  const t0 = Date.parse(`${start}T00:00:00Z`);
  const t1 = Math.max(Date.now(), Date.parse(`${points[points.length - 1][0]}T00:00:00Z`) + 86_400_000);
  const x = (d: string) => PAD + ((Date.parse(`${d}T00:00:00Z`) - t0) / Math.max(1, t1 - t0)) * (W - PAD * 2);
  const line = (idx: 1 | 2, top: number) => {
    const vals = points.map((p) => p[idx]).filter((n): n is number => n !== null);
    if (vals.length < 1) return "";
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const y = (n: number) => top + ROW - (hi === lo ? ROW / 2 : ((n - lo) / (hi - lo)) * ROW);
    let d = "";
    points.forEach((p, i) => {
      const n = p[idx];
      if (n === null) return;
      const px = x(p[0]);
      d += i === 0 ? `M${px.toFixed(1)},${y(n).toFixed(1)}` : `H${px.toFixed(1)}V${y(n).toFixed(1)}`;
    });
    const last = points[points.length - 1][idx];
    if (last !== null) d += `H${(W - PAD).toFixed(1)}`;
    return d;
  };
  const color = model.networkInfo(b.network)?.color ?? "currentColor";
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 h-16 w-full max-w-sm" aria-hidden data-testid="price-history-chart" preserveAspectRatio="none">
        <path d={line(1, PAD)} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <path d={line(2, PAD * 2 + ROW)} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {points.slice(1).map((p) => <line key={p[0]} x1={x(p[0])} x2={x(p[0])} y1={0} y2={H} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />)}
      </svg>
      <ul className="mt-1 space-y-0.5" data-testid="price-history-points">
        {points.map((p) => (
          <li key={p[0]}>
            {dayLabel(p[0])}: {p[1] !== null ? model.money(p[1]) : "–"}{p[2] !== null ? `, ${model.fmtData(p[2], b.network)}` : ""}{p[3] !== null ? `, ${p[3] === 1 ? "1 day" : `${p[3]} days`}` : ""}
          </li>
        ))}
      </ul>
    </>
  );
}
