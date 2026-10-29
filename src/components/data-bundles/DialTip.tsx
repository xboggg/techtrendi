// A dial-code tip card (owner, 25 Oct 2026): MTN's *203# (Xtra4U). Never ranked or used in any
// figure; always "! Check first", with the day it was seen and where it comes from.
import { Gift, Percent } from "lucide-react";
import type { BundleModel } from "@/lib/dataBundles";
import { xtra4uTip } from "@/lib/bundleTips";
import { CodeActions, dialCodes, fmtDate, fullStamp } from "./shared";

/** MTN Just4U (owner, 29 Oct 2026: "why don't I see the Just4U bundle"): personal offers in the myMTN
 *  app or on *141#, from the data's own text (familyInfo.mtn.Just4U). Never ranked; "! Check first". */
export function just4uText(model: BundleModel): string | null {
  const t = (model.doc.familyInfo as Record<string, Record<string, string>> | undefined)?.mtn?.Just4U;
  return typeof t === "string" && t.trim() ? t : null;
}

export function Just4UCard({ model }: { model: BundleModel }) {
  const text = just4uText(model);
  if (!text) return null;
  const code = dialCodes(text)[0] ?? null;
  return (
    <section role="note" aria-labelledby="tip-just4u" className="rounded-2xl border border-border bg-background/60 p-4" data-testid="just4u-tip">
      <h3 id="tip-just4u" className="flex items-center gap-2 font-bold"><Gift className="h-5 w-5 shrink-0" aria-hidden /> MTN: check your Just4U offers first</h3>
      <p className="mt-1 text-[15px] lg:text-base">MTN may offer you your own cheaper bundles. Open the myMTN app (Just4U){code ? <> or dial {code}</> : null} to see yours before you buy.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {code && <CodeActions code={code} />}
        <span className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-0.5 text-[15px] font-bold text-amber-900 dark:text-amber-100 lg:text-base" data-testid="trust" data-level="check">! Check first</span>
      </div>
      <p className="mt-2 text-[15px] text-foreground/85 lg:text-base" data-testid="just4u-text">{text} Not ranked or compared.</p>
    </section>
  );
}

export function DialTipCard({ model }: { model: BundleModel }) {
  const t = xtra4uTip(model.doc);
  if (!t) return null;
  const name = model.networkInfo(t.network)?.name ?? "MTN";
  return (
    <section role="note" aria-labelledby="tip-xtra4u" className="rounded-2xl border border-border bg-background/60 p-4" data-testid="dial-tip" data-code={t.ussd}>
      <h3 id="tip-xtra4u" className="flex items-center gap-2 font-bold"><Percent className="h-5 w-5 shrink-0" aria-hidden /> {name}: try {t.ussd} for a possible discount</h3>
      <p className="mt-1 text-[15px] lg:text-base" data-testid="dial-tip-text">{t.text}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <CodeActions code={t.ussd} />
        <span className="inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-0.5 text-[15px] font-bold text-amber-900 dark:text-amber-100 lg:text-base" data-testid="trust" data-level="check">! Check first</span>
      </div>
      <p className="mt-2 text-[15px] text-foreground/85 lg:text-base" data-testid="dial-tip-source">
        Seen <time dateTime={t.date} title={fullStamp(t.date)}>{fmtDate(t.date)}</time> · Source: {t.source}. Not ranked or compared.
      </p>
    </section>
  );
}
