// Freshness, sources/disclaimer and WhatsApp sharing for the data bundle pages.
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Check, ChevronDown, ExternalLink, Clock, Link2, ShieldCheck, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BundleData } from "@/hooks/useBundleData";
import { NetPill, checkedClock, copyText, savedStamp, fmtDate, glass, hoursSince, timeAgo, useNow, unitsMethod } from "./shared";

const STALE_HOURS = 24;

/** "Prices checked X ago" plus an amber notice once the last check is over a day old. */
export function Freshness({ data, compact = false }: { data: BundleData; compact?: boolean }) {
  const now = useNow();
  const { checkedAt } = data.freshness;
  const stale = now ? hoursSince(checkedAt, now) > STALE_HOURS : false;
  const when = now ? timeAgo(checkedAt, now) : null;
  return (
    <div className="space-y-2" aria-live="polite">
      <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm", compact && "text-xs")}>
        <Clock className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        <span>
          Prices checked{" "}
          <time dateTime={checkedAt} className="font-semibold">{when ?? `on ${fmtDate(checkedAt)}`}</time>
          {when && <span className="text-muted-foreground"> ({fmtDate(checkedAt)})</span>}
        </span>
      </p>
      {stale && <StaleNotice />}
    </div>
  );
}

function StaleNotice() {
  return (
    <div role="status" data-testid="stale-notice" className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-100/80 px-3 py-2 text-sm text-amber-950 dark:bg-amber-500/15 dark:text-amber-100">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        These prices are more than a day old. They may have changed. Check with your network before you buy.
      </span>
    </div>
  );
}

/** Whether the strip may say "re-checked every N hours": only while the prices shown are
 *  at most two check intervals old (one missed run is tolerated). Older than that (the
 *  live snapshot could not be loaded, or the checker has stopped) the schedule would
 *  contradict the age beside it, so the strip says "showing our last saved prices
 *  check" instead. Unknown time (prerender) = the schedule, with the date. */
export function scheduleShown(ageHours: number | null, every: number | undefined): boolean {
  if (!(typeof every === "number" && every > 0)) return false;
  return ageHours === null || ageHours <= 2 * every;
}

/** The comparison page's live status strip: a pulsing dot, "Prices checked 2 hours ago",
 *  and how often the checker runs (the country's `checkEveryHours`, while scheduleShown).
 *  Once the prices are older than two intervals the dot stops pulsing and turns amber and
 *  the strip says they come from the last saved check; over a day old the stale notice
 *  shows too. Before mount (prerender) it reads "Prices checked on 18 Oct 2026". */
export function LiveStatus({ data }: { data: BundleData }) {
  const now = useNow();
  if (data.checking) {
    return (
      <div className="space-y-2" aria-live="polite" data-testid="live-status" data-source="checking">
        <p className="flex min-w-0 items-start gap-2 whitespace-nowrap text-xs font-medium text-muted-foreground sm:text-sm">
          <span className="relative mt-[3px] flex h-2.5 w-2.5 shrink-0 sm:mt-1" aria-hidden><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-muted-foreground/50" /></span>
          <span data-testid="checking">Checking prices…</span>
        </p>
      </div>
    );
  }
  const { checkedAt } = data.freshness;
  const age = now ? hoursSince(checkedAt, now) : null;
  const stale = age !== null && age > STALE_HOURS;
  const when = now ? timeAgo(checkedAt, now) : null;
  const every = data.country.checkEveryHours;
  const onSchedule = scheduleShown(age, every) && data.freshness.source !== "saved";
  if (data.freshness.source === "saved") {
    return (
      <div className="space-y-2" aria-live="polite" data-testid="live-status" data-source="saved">
        <p className="flex min-w-0 items-start gap-2 whitespace-nowrap text-xs font-medium sm:text-sm">
          <span className="relative mt-[3px] flex h-2.5 w-2.5 shrink-0 sm:mt-1" aria-hidden><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" /></span>
          <span className="min-w-0 truncate font-semibold text-amber-800 dark:text-amber-300" data-testid="saved-prices">
            Saved prices from <time dateTime={checkedAt}>{savedStamp(checkedAt)}</time>
          </span>
        </p>
        {/* A saved copy over a day old gets the same warning as a stale live check. */}
        {stale && <StaleNotice />}
      </div>
    );
  }
  return (
    <div className="space-y-2" aria-live="polite" data-testid="live-status">
      <p className="flex min-w-0 items-start gap-2 whitespace-nowrap text-xs font-medium sm:text-sm">
        <span className="relative mt-[3px] flex h-2.5 w-2.5 shrink-0 sm:mt-1" aria-hidden>
          {onSchedule && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />}
          <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", onSchedule ? "bg-emerald-400" : "bg-amber-400")} />
        </span>
        {now && onSchedule ? (
          // Fresh: the clock time of the last check, Ghana time (= UTC), e.g. "Checked today, 4:17 PM".
          <span data-testid="checked-clock">
            Checked <time dateTime={checkedAt} className="font-bold">{checkedClock(checkedAt, now)}</time>
          </span>
        ) : (
          <span className="min-w-0 truncate">
            Prices checked{" "}
            <time dateTime={checkedAt} className="font-bold">{when ?? `on ${fmtDate(checkedAt)}`}</time>
            {now && typeof every === "number" && every > 0 && !onSchedule && (
              <span className="text-muted-foreground" data-testid="saved-check"> · last saved prices</span>
            )}
          </span>
        )}
      </p>
      {stale && <StaleNotice />}
    </div>
  );
}

/** The comparison page's top line: "Checked every 3 hours · AT, MTN & Telecel". The cadence
 *  is said only while it is true (scheduleShown, the same rule as the status strip); before
 *  mount, and when prices are older than two checks, the line names the networks only. */
export function CadenceLine({ data }: { data: BundleData }) {
  const now = useNow();
  const age = now ? hoursSince(data.freshness.checkedAt, now) : null;
  const every = data.country.checkEveryHours;
  const names = data.model.networks.map((n) => data.model.networkInfo(n).name);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}` : names[0] ?? "";
  const cadence = age !== null && typeof every === "number" && every > 0 && scheduleShown(age, every);
  return (
    <p className="text-sm font-semibold text-muted-foreground" data-testid="cadence-line">
      {cadence ? `Checked every ${every} hour${every === 1 ? "" : "s"} · ${list}` : list}
    </p>
  );
}

/** Where the figures come from: one link per network, plus freshness.
 *  How they were checked is the dataset's own text, in the Sources section. */
export function VerifiedBadge({ data }: { data: BundleData }) {
  const { model } = data;
  return (
    <div className={cn(glass, "p-4")}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
        Prices from the networks' own pages
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {model.networks.map((id) => {
          const info = model.networkInfo(id);
          return (
            <a key={id} href={info.source} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-11 items-center gap-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <NetPill info={info} className="py-1.5">
                {info.name} source <ExternalLink className="ml-1 h-3 w-3 opacity-80" aria-hidden />
              </NetPill>
              <span className="sr-only">(opens the {info.name} page in a new tab)</span>
            </a>
          );
        })}
        <a href="#sources" onClick={openSources} className="inline-flex min-h-11 items-center rounded-full px-2 text-xs font-semibold underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          How we check
        </a>
      </div>
      <div className="mt-3">
        <Freshness data={data} compact />
      </div>
    </div>
  );
}

const isUrl = (s: string) => /^https:\/\//.test(s);

/** Sources the dataset marks as out of date (mtnRates.outdatedHelpArticle): named, never used. */
function outdatedFor(model: BundleData["model"], id: string): { url: string; note: string }[] {
  const r = model.rates as Record<string, unknown> | null;
  if (id !== "mtn" || !r) return [];
  const o = r.outdatedHelpArticle as { url?: unknown; note?: unknown } | undefined;
  return o && typeof o.url === "string" && typeof o.note === "string" ? [{ url: o.url, note: o.note }] : [];
}

function UnitsNote({ units }: { units: unknown }) {
  if (typeof units === "string") return <p>{units}</p>;
  if (units && typeof units === "object") {
    const rows = Object.entries(units as Record<string, unknown>).filter(([, v]) => typeof v === "string" || typeof v === "number");
    const name = (k: string) => (k.length <= 2 ? k.toUpperCase() : k.charAt(0).toUpperCase() + k.slice(1));
    return <ul className="space-y-1">{rows.map(([k, v]) => <li key={k}><b>{name(k)}:</b> {String(v)}</li>)}</ul>;
  }
  return null;
}

/** The line under the page heading: where the prices come from, and (only while the prices are
 *  fresh, the same rule as the status strip: scheduleShown) how often they are checked. A tap
 *  scrolls to "Where our prices come from" and opens it. */
export function SourceLine({ data, only }: { data: BundleData; only?: string }) {
  const now = useNow();
  const { checkedAt } = data.freshness;
  const every = data.country.checkEveryHours;
  const fresh = scheduleShown(now ? hoursSince(checkedAt, now) : null, every) && data.freshness.source !== "saved";
  const names = (only ? [only] : data.model.networks).map((n) => data.model.networkInfo(n).name);
  const who = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  const hasSchedule = typeof every === "number" && every > 0;
  // The schedule's space is always kept (hidden, and silent for screen readers, while the prices are
  // not fresh), so the line never changes height when a saved copy turns live: no layout shift.
  return (
    <a href="#sources" onClick={openSources} data-testid="source-line"
      className="-my-1 inline-flex min-h-11 max-w-full items-center gap-1.5 text-[13px] font-medium sm:text-[15px] text-foreground/85 underline-offset-4 hover:text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(max-height:820px)_and_(max-width:639px)]:leading-snug lg:text-base">
      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      <span>Prices from {who}&apos;s own website{names.length > 1 ? "s" : ""}{hasSchedule && <span data-testid="source-schedule" data-shown={fresh ? "1" : "0"} className={fresh ? undefined : "invisible"} aria-hidden={fresh ? undefined : true}> · checked automatically every {every} hours</span>}</span>
    </a>
  );
}

/** Opens the folded Sources section (for "How we check" links pointing at #sources). */
export function openSources() {
  if (typeof document === "undefined") return;
  const d = document.querySelector<HTMLDetailsElement>("#sources details");
  if (d) d.open = true;
}

/** Where the figures come from, folded into one line: "Where our prices come from (tap
 *  to see)". Everything stays in the page's HTML (a native <details>): how the figures
 *  were checked, how GB is counted, every source per network with its date, the
 *  out-of-date source, capture and check dates, "confirm before you buy" and the
 *  independence statement. */
/** `only`: a network's own page lists that network's sources only. */
export function SourcesAndDisclaimer({ data, only }: { data: BundleData; only?: string }) {
  const { model, freshness } = data;
  const nets = only ? model.networks.filter((n) => n === only) : model.networks;
  const computedFrom = [...new Set(model.sources.map((s) => model.networkInfo(s.network).name))];
  return (
    <section aria-labelledby="sources-h" className="scroll-mt-24" id="sources">
      <details className={cn(glass, "group overflow-hidden")} data-testid="sources-details">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <h2 id="sources-h" className="text-base font-bold">Where our prices come from</h2>
            <span className="text-sm text-muted-foreground">(tap to see)</span>
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
      <div className="space-y-4 border-t border-border px-5 pb-5 pt-4 text-sm leading-relaxed">
        <div>
          <h3 className="font-bold">How we checked the prices</h3>
          <p className="mt-1">{model.doc.verification}</p>
        </div>
        <div>
          <h3 className="font-bold">How we count GB</h3>
          <div className="mt-1 space-y-1">
            {/* The dataset's units notes are written for developers (field names, null values), so they are not shown; the sentences below say the same in plain words. */}
            {typeof model.doc.units === "string" && <UnitsNote units={model.doc.units} />}
            <p data-testid="units-method">{unitsMethod(model)}</p>
            <p>
              We divide MB by that number to get GB. Where a network prints its own amount (like AT's "1024 MB" or Telecel's "263.38GB"), we show it exactly as printed. Our sums use the same amount.
            </p>
            {computedFrom.length > 0 && (
              <p>
                Some networks let you pay any amount ({computedFrom.join(" and ")}). For those, we work out the data from the network's price per MB for that amount. These are marked “Worked out”. The network may round a little differently.
              </p>
            )}
          </div>
        </div>
        <div>
          <h3 className="font-bold">{only ? `Our ${model.networkInfo(only).name} sources` : "Our sources, by network"}</h3>
          <ul className="mt-2 space-y-3">
            {nets.map((id) => {
              const info = model.networkInfo(id);
              return (
                <li key={id}>
                  <NetPill info={info} />
                  {model.sourcesFor(id).cited.length > 0 && (
                    <>
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">Pages we quote, with their dates</p>
                      <ul className="mt-1 space-y-0.5" data-testid="cited-sources">
                        {model.sourcesFor(id).cited.map((c) => (
                          <li key={c.url}>
                            <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-6">
                              {c.label}<span className="sr-only"> (opens in a new tab)</span>
                            </a>
                            <span className="text-muted-foreground"> · {c.dateLabel} {fmtDate(c.date)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">Other pages we used</p>
                    </>
                  )}
                  <ul className="mt-1 space-y-0.5">
                    {model.sourcesFor(id).urls.map((src) => (
                      <li key={src} className="break-all">
                        {isUrl(src) ? (
                          <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-6">
                            {src}<span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground">{src}</span>
                        )}
                      </li>
                    ))}
                    {outdatedFor(model, id).map((o) => (
                      <li key={o.url} className="break-all text-muted-foreground">
                        Old page, not used: <a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-2 md:min-h-6">{o.url}<span className="sr-only"> (opens in a new tab)</span></a>
                        <span className="block break-normal">{o.note}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Figures last changed</dt><dd className="font-semibold">{fmtDate(freshness.capturedAt)}</dd></div>
          <div><dt className="text-muted-foreground">Last checked</dt><dd className="font-semibold">{fmtDate(freshness.checkedAt)}</dd></div>
        </dl>
        <div className="rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-semibold">Confirm before you buy</p>
          <p className="mt-1">
            Networks can change prices at any time. Check the price and data in the network's app or USSD menu before you pay.
            {model.stats.pendingCount > 0 && " Bundles marked “New, still checking” are not checked yet. We leave them out of every ranking and finder."}
            {model.stats.unconfirmedCount > 0 && " Bundles marked “Not confirmed” are only on an old network page. We show them, but leave them out of every ranking and finder."}
          </p>
        </div>
        <p className="text-muted-foreground">
          TechTrendi is independent. We are not paid or sponsored by {nameList(model)}. We do not sell bundles. We use network names only to say whose bundle it is.
        </p>
      </div>
      </details>
    </section>
  );
}

function nameList(model: BundleData["model"]): string {
  const names = model.networks.map((n) => model.networkInfo(n).name);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : names[0] ?? "any network";
}

/** WhatsApp share link. The URL comes from the current route, so it is SSR-safe. */
/** The link to share: this page on techtrendi.com, with its query (the finder amount and the
 *  planner choices, see dataBundlesUrl) read at the moment of the tap. */
const SITE = "https://techtrendi.com";
const liveUrl = (pathname: string, withQuery: boolean) =>
  `${SITE}${pathname}${withQuery && typeof window !== "undefined" ? window.location.search : ""}`;
export const waHref = (text: string, url: string) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

export function ShareWhatsApp({ text, className, withQuery = false, testId }: { text: string; className?: string; withQuery?: boolean; testId?: string }) {
  const { pathname } = useLocation();
  const href = waHref(text, liveUrl(pathname, false));
  // On tap, the link picks up the page's current query, so the friend sees the same answer.
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => { e.currentTarget.href = waHref(text, liveUrl(pathname, withQuery)); };
  return (
    <a
      href={href}
      onClick={onClick}
      data-testid={testId}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#167540] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#11603a] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <Share2 className="h-4 w-4" aria-hidden />
      Share on WhatsApp
      <span className="sr-only">(opens WhatsApp in a new tab)</span>
    </a>
  );
}

/** "Share" on phones that can (the phone's own share sheet), otherwise "Copy link". */
export function ShareLink({ text, withQuery = false, className }: { text: string; withQuery?: boolean; className?: string }) {
  const { pathname } = useLocation();
  const [native, setNative] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { setNative(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const go = async () => {
    const url = liveUrl(pathname, withQuery);
    if (native) {
      try { await navigator.share({ text, url }); return; } catch (e) { if ((e as Error)?.name === "AbortError") return; }
    }
    if (await copyText(url)) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    }
  };
  return (
    <>
      <button type="button" onClick={go} data-testid="share-link"
        className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-background/60 px-4 text-sm font-bold text-foreground transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
        {copied ? "Link copied" : native ? "Share" : "Copy link"}
      </button>
      <span className="sr-only" aria-live="polite">{copied ? "Link copied" : ""}</span>
    </>
  );
}
