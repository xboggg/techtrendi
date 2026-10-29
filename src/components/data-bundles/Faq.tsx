// Questions people ask, answered ONLY from the operators' own pages (model.faqItems: each
// line carries the page it came from). A network with no official source is left out of
// that answer. The same text feeds the page's FAQPage structured data (model.faqAnswer).
import { ExternalLink, HelpCircle } from "lucide-react";
import type { BundleModel } from "@/lib/dataBundles";
import { CodesIn, NetPill, SectionHeading, glass } from "./shared";
import { cn } from "@/lib/utils";

const host = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

/** `only`: a network's own page: that network's answers only (a question it has no answer to is left out). */
/** `bare`: no heading (the simple network page shows it inside its own "Common questions" fold). */
export function Faq({ model, only, bare }: { model: BundleModel; only?: string; bare?: boolean }) {
  const items = model.faqItems().map((f) => (only ? { ...f, lines: f.lines.filter((l) => l.network === only) } : f)).filter((f) => f.lines.length > 0);
  if (!items.length) return null;
  return (
    <section aria-labelledby={bare ? undefined : "faq-h"} aria-label={bare ? "Common questions" : undefined} id="faq" className="scroll-mt-24">
      {!bare && <SectionHeading id="faq-h" eyebrow="Questions" title="Common questions" icon={<HelpCircle className="h-4 w-4" aria-hidden />}>
        {only ? `Answers from ${model.networkInfo(only).name}'s own pages.` : "Answers from the networks' own pages."}
      </SectionHeading>}
      <div className={cn(glass, "divide-y divide-border p-0")}>
        {items.map((f) => (
          <details key={f.question} className="group px-4 sm:px-6" data-testid="faq-item">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <span>{f.question}</span>
              <span aria-hidden className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <ul className="space-y-3 pb-4">
              {f.lines.map((l) => (
                <li key={l.network} className="text-sm" data-testid="faq-line" data-net={l.network}>
                  <NetPill info={model.networkInfo(l.network)} className="mr-2 align-middle" />
                  <span>{l.text}</span>
                  {l.source && (/^https:\/\//.test(l.source) ? (
                    <a href={l.source} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex min-h-11 items-center gap-1 align-middle text-xs font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground">
                      Source: {host(l.source)} <ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
                    </a>
                  ) : (
                    <span className="ml-1 text-xs text-muted-foreground">Source: {l.source}</span>
                  ))}
                  <CodesIn texts={[l.text]} />
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
