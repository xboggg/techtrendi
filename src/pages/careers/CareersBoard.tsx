// TechTrendi Careers jobs board: <CAREERS_BASE> (preview: /tools-preview/careers).
// Preview: noindex, not prerendered, not in the sitemap, not linked (src/lib/careers.ts).
// Every job comes from an approved source and links back to it; "Apply" opens the source's own
// page. Jobs load in the browser from the Careers API, so none of them is part of the page's HTML.
// The reader's choices (tab, search, filters, page number) live in the page address, so the
// phone's Back button returns to the same list; only the country is remembered in the browser.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Briefcase, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, MapPin, Search, ShieldAlert, SlidersHorizontal,
  TrendingUp, Wallet, X,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAssistantOutOfWay } from "@/components/careers/useAssistantOutOfWay";
import { cn } from "@/lib/utils";
import {
  CAREERS_BASE, CAREERS_NOINDEX, COUNTRY_NAME, FIELDS, JOB_TYPES, LEVELS, POSTED,
  evidenceText, fieldLabel, filterCount, jobTypeLabel, jobsUrl, levelLabel, pageItems, postedAgo, readState, safeLink,
  shortDate, workModeLabel, writeState,
  type BoardState, type Country, type Field, type Job, type JobKind, type JobPage, type JobType, type Level, type Posted,
} from "@/lib/careers";

const COUNTRY_KEY = "tt_careers_country";

function readCountry(): Country {
  try {
    const v = window.localStorage.getItem(COUNTRY_KEY);
    return v === "NG" ? "NG" : "GH";
  } catch {
    return "GH";
  }
}

function saveCountry(c: Country) {
  try {
    window.localStorage.setItem(COUNTRY_KEY, c);
  } catch {
    /* private mode: the choice just isn't remembered */
  }
}

const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Chip({ active, onClick, children, testId, small }: {
  active: boolean; onClick: () => void; children: React.ReactNode; testId?: string; small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={testId}
      className={cn(
        "min-h-[44px] rounded-full border font-semibold transition-colors",
        small ? "px-3.5 text-sm" : "px-4 text-sm",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function Logo({ job }: { job: Job }) {
  const [broken, setBroken] = useState(false);
  const src = safeLink(job.company_logo_url);
  if (!src || broken) {
    return (
      <div aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-base font-bold text-muted-foreground">
        {job.company.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" width={44} height={44}
      onError={() => setBroken(true)} className="h-11 w-11 shrink-0 rounded-lg bg-white object-contain p-1" />
  );
}

function Fact({ icon: Icon, children, strong }: { icon?: typeof Wallet; children: React.ReactNode; strong?: boolean }) {
  return (
    <li className={cn(
      "inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium",
      strong ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-muted text-foreground/80",
    )}>
      {Icon && <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{children}</span>
    </li>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  );
}

function JobCard({ job, country, onToggle }: { job: Job; country: Country; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const apply = safeLink(job.apply_url);
  const home = safeLink(job.source_home);
  const remote = job.work_mode === "remote";
  const where = remote ? workModeLabel("remote") : job.location || workModeLabel(job.work_mode);
  const type = jobTypeLabel(job);
  const level = levelLabel(job.level);
  const when = postedAgo(job.posted_at);
  const name = COUNTRY_NAME[country];
  const proof = evidenceText(job.open_evidence[country]) ?? (job.location ? `The job is based in ${job.location}.` : null);
  const source = job.source_name ?? "the job site";
  const detailsId = `job-${job.id}-details`;
  const flip = () => { setOpen((o) => !o); onToggle(); };

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm" data-testid="job-card">
      <div className="flex items-start gap-3">
        <Logo job={job} />
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground">{job.title}</h2>
          <p className="truncate text-sm text-muted-foreground">{job.company}</p>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Key facts" data-testid="job-facts">
        {job.salary && <Fact icon={Wallet} strong>{job.salary}</Fact>}
        {type && <Fact icon={Briefcase}>{type}</Fact>}
        {where && <Fact icon={MapPin}>{where}</Fact>}
        {level && <Fact icon={TrendingUp}>{level}</Fact>}
      </ul>

      {job.summary && (
        <p className={cn("mt-3 text-sm text-foreground/80", !open && "line-clamp-2")} data-testid="job-summary">{job.summary}</p>
      )}

      {open && (
        <div id={detailsId} className="mt-3 rounded-xl bg-muted/50 px-3 py-2" data-testid="job-details">
          <dl className="divide-y divide-border/60">
            <Detail label="Area of work">{fieldLabel(job.field)}{job.categories.length > 0 && <span className="text-muted-foreground"> ({job.categories.join(", ")})</span>}</Detail>
            {level && <Detail label="Level">{level}</Detail>}
            {type && <Detail label="Job type">{type}</Detail>}
            <Detail label="Where">{remote ? `Work from home${job.location ? ` (the job lists: ${job.location})` : ""}` : where ?? "Not given"}</Detail>
            <Detail label="Pay">{job.salary ?? "Not given in the advert"}</Detail>
            {proof && <Detail label={`Open to ${name}?`}>Yes. {proof}</Detail>}
            {job.posted_at && <Detail label="Posted">{shortDate(job.posted_at)} ({when})</Detail>}
            {job.closes_at && <Detail label="Listed until">{shortDate(job.closes_at)}, on {source}</Detail>}
            <Detail label="Job from">{home ? <a href={home} target="_blank" rel="noopener" className="underline underline-offset-2">{source}</a> : source}</Detail>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">The full job advert is on {source}. Read it there before you apply.</p>
        </div>
      )}

      <button
        type="button"
        onClick={flip}
        aria-expanded={open}
        aria-controls={detailsId}
        data-testid="see-more"
        className="mt-2 inline-flex min-h-[44px] items-center gap-1 self-start text-sm font-semibold text-primary"
      >
        {open ? "See less" : "See more"} <ChevronDown aria-hidden className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {apply && (
          <Button asChild className="min-h-[44px] w-full sm:w-auto">
            <a href={apply} target="_blank" rel="noopener" data-testid="apply-link">
              Apply{job.source_name ? ` on ${job.source_name}` : ""} <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          {when && <>Posted {when} · </>}
          {job.source_name && (home
            ? <>Job from <a href={home} target="_blank" rel="noopener" className="underline underline-offset-2">{job.source_name}</a></>
            : <>Job from {job.source_name}</>)}
        </p>
      </div>
    </article>
  );
}

function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const btn = "inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl border text-sm font-semibold transition-colors";
  return (
    <nav aria-label="Pages" className="mt-8 flex flex-col items-center gap-3" data-testid="pager">
      <div className="flex items-center gap-1.5">
        <button type="button" className={cn(btn, "border-border bg-card px-2 disabled:opacity-40")} disabled={page <= 1}
          onClick={() => onPage(page - 1)} aria-label="Previous page" data-testid="page-prev">
          <ChevronLeft className="h-5 w-5" />
        </button>
        {pageItems(page, pages).map((p, i) => p === "…"
          ? <span key={`gap-${i}`} aria-hidden className="w-6 text-center text-muted-foreground">…</span>
          : (
            <button key={p} type="button" onClick={() => onPage(p)} aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`} data-testid={`page-${p}`}
              className={cn(btn, "px-2", p === page ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted")}>
              {p}
            </button>
          ))}
        <button type="button" className={cn(btn, "border-border bg-card px-2 disabled:opacity-40")} disabled={page >= pages}
          onClick={() => onPage(page + 1)} aria-label="Next page" data-testid="page-next">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <p className="text-sm text-muted-foreground">Page {page} of {pages.toLocaleString("en-GB")}</p>
    </nav>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `filter-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div role="group" aria-labelledby={id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 id={id} className="mb-2 text-sm font-bold text-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function CareersBoard() {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => readState(params), [params]);
  const [country, setCountry] = useState<Country>("GH");
  const [typed, setTyped] = useState(state.q);
  const [data, setData] = useState<JobPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [opened, setOpened] = useState(0);
  const request = useRef<AbortController | null>(null);
  const listTop = useRef<HTMLDivElement | null>(null);
  const lastPage = useRef(state.page);

  useAssistantOutOfWay(`${data?.page}-${data?.total}-${opened}-${filtersOpen}`);

  // Remembered country (browser only; the preview is never prerendered).
  useEffect(() => { setCountry(readCountry()); }, []);

  /** New choices start again at page 1; the address is replaced (not a new Back step). */
  const update = useCallback((patch: Partial<BoardState>, push = false) => {
    setParams(writeState({ ...state, page: 1, ...patch }), { replace: !push });
  }, [state, setParams]);

  // Search waits until the reader stops typing.
  useEffect(() => {
    if (typed.trim() === state.q.trim()) return;
    const t = window.setTimeout(() => update({ q: typed }), 400);
    return () => window.clearTimeout(t);
  }, [typed, state.q, update]);

  // Back/forward to an address with other search words: show them in the box.
  useEffect(() => { setTyped((t) => (t.trim() === state.q.trim() ? t : state.q)); }, [state.q]);

  const url = jobsUrl(country, state);
  const load = useCallback(async () => {
    request.current?.abort();
    const ctrl = new AbortController();
    request.current = ctrl;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as JobPage);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setFailed(true);
    } finally {
      if (request.current === ctrl) setLoading(false);
    }
  }, [url]);

  useEffect(() => { load(); return () => request.current?.abort(); }, [load]);

  // A new page of jobs has arrived: back to the top of the list (only when the reader is below
  // it, e.g. at the page buttons; never pulled down from the filters at the top). Done after the new jobs are on
  // screen, so the browser's scroll anchoring cannot move the reader again as the list changes.
  const shownPage = data?.page;
  useEffect(() => {
    if (shownPage === undefined || lastPage.current === shownPage) return;
    lastPage.current = shownPage;
    const top = listTop.current?.getBoundingClientRect().top;
    if (top !== undefined && top < 96) window.scrollTo({ top: Math.max(0, window.scrollY + top - 96), behavior: "auto" });
  }, [shownPage]);

  const name = COUNTRY_NAME[country];
  const pickCountry = (c: Country) => { setCountry(c); saveCountry(c); update({}); };
  const nFilters = filterCount(state);
  const total = data?.total ?? null;
  const jobs = data?.items ?? [];
  const busy = loading && !failed;

  const activeChips: { key: string; label: string; clear: () => void }[] = [
    ...state.fields.map((f) => ({ key: `f-${f}`, label: FIELDS[f], clear: () => update({ fields: toggle(state.fields, f) }) })),
    ...state.types.map((t) => ({ key: `t-${t}`, label: JOB_TYPES[t], clear: () => update({ types: toggle(state.types, t) }) })),
    ...state.levels.map((l) => ({ key: `l-${l}`, label: LEVELS[l], clear: () => update({ levels: toggle(state.levels, l) }) })),
    ...(state.pay ? [{ key: "pay", label: "Shows pay", clear: () => update({ pay: false }) }] : []),
    ...(state.posted ? [{ key: "posted", label: `Posted: ${POSTED[state.posted].toLowerCase()}`, clear: () => update({ posted: null }) }] : []),
  ];
  const clearFilters = () => update({ fields: [], types: [], levels: [], pay: false, posted: null });

  return (
    <Layout>
      <SEOHead
        title="Jobs Open to People in Ghana and Nigeria"
        description="Remote and local jobs you can apply for from Ghana or Nigeria, from trusted job sites and company career pages. Every job links to where you apply."
        canonical={CAREERS_BASE}
        noindex={CAREERS_NOINDEX}
      />
      <div className="container mx-auto max-w-5xl px-4 pb-16 pt-6 md:pt-10">
        <header>
          <h1 className="text-[1.75rem] font-black leading-tight tracking-tight text-foreground sm:text-4xl" data-testid="page-title">
            Jobs open to people in {name}
          </h1>
          <p className="mt-2 text-base text-muted-foreground" data-testid="page-intro">
            Work from home for companies abroad, or work here in {name}. We only list jobs that say people in {name} can apply.
          </p>
        </header>

        <section aria-label="Choose jobs" className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="I live in">
            <span className="mr-1 text-sm font-semibold text-foreground">I live in</span>
            {(["GH", "NG"] as Country[]).map((c) => (
              <Chip key={c} active={country === c} onClick={() => pickCountry(c)} testId={`country-${c}`}>{COUNTRY_NAME[c]}</Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Kind of job">
            {([["all", "All jobs"], ["remote", "Work from home"], ["local", `In ${name}`]] as [JobKind, string][]).map(([k, label]) => (
              <Chip key={k} active={state.kind === k} onClick={() => update({ kind: k })} testId={`kind-${k}`}>{label}</Chip>
            ))}
          </div>
          <div className="flex gap-2">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Search jobs</span>
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                maxLength={200}
                placeholder="Search: job, company or city"
                data-testid="search"
                className="min-h-[48px] w-full rounded-xl border border-border bg-card pl-10 pr-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              data-testid="filters-open"
              className={cn(
                "inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold",
                nFilters ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground",
              )}
            >
              <SlidersHorizontal aria-hidden className="h-4 w-4" />
              Filters
              {nFilters > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground" data-testid="filters-count">{nFilters}</span>}
            </button>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2" data-testid="active-filters">
              {activeChips.map((c) => (
                <button key={c.key} type="button" onClick={c.clear} aria-label={`Remove filter: ${c.label}`}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-primary/10 px-3 text-sm font-medium text-primary">
                  {c.label} <X aria-hidden className="h-3.5 w-3.5" />
                </button>
              ))}
              <button type="button" onClick={clearFilters} className="min-h-[36px] px-2 text-sm font-semibold text-muted-foreground underline underline-offset-2">
                Clear all
              </button>
            </div>
          )}
        </section>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
          <ShieldAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Never pay money to get a job. Real employers do not charge fees. <Link to="/report-scam" className="font-semibold underline underline-offset-2">Report a fake job</Link></p>
        </div>

        <div ref={listTop} />
        <p className="mt-5 text-sm font-semibold text-foreground" aria-live="polite" data-testid="count">
          {total === null ? "Loading jobs…"
            : total === 0 ? (nFilters ? "No jobs match these filters. Try removing one." : "No jobs match yet. Try another word or tab.")
            : <>{total.toLocaleString("en-GB")} {total === 1 ? "job" : "jobs"}{data && data.pages > 1 && <span className="font-normal text-muted-foreground"> · page {data.page} of {data.pages.toLocaleString("en-GB")}</span>}</>}
        </p>

        {failed && (
          <div className="mt-3 rounded-xl border border-border bg-card p-4 text-sm" role="alert" data-testid="load-error">
            <p className="text-foreground">Jobs could not load. Check your internet, then try again.</p>
            <Button variant="outline" className="mt-3 min-h-[44px]" onClick={() => load()}>Try again</Button>
          </div>
        )}

        <div className={cn("mt-3 grid grid-cols-1 gap-3 transition-opacity [overflow-anchor:none] md:grid-cols-2", busy && jobs.length > 0 && "opacity-50")} data-testid="job-list" aria-busy={busy}>
          {jobs.map((j) => <JobCard key={j.id} job={j} country={country} onToggle={() => setOpened((n) => n + 1)} />)}
          {busy && jobs.length === 0 && Array.from({ length: 4 }, (_, i) => (
            <div key={i} aria-hidden className="h-56 animate-pulse rounded-2xl border border-border bg-muted/50" />
          ))}
        </div>

        {data && !failed && <Pager page={state.page} pages={data.pages} onPage={(p) => update({ page: p }, true)} />}

        <p className="mt-10 text-xs text-muted-foreground">
          TechTrendi lists jobs from other websites and links to them. We do not hire for these jobs and we never ask for money.
          Check every job on the employer's own page before you share personal details.
        </p>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-4 pb-0 pt-5" data-testid="filters-panel">
          <SheetHeader className="text-left">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Pick as many as you like. The list updates as you tap.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4 pb-4">
            <FilterGroup title="Area of work">
              {(Object.keys(FIELDS) as Field[]).map((f) => (
                <Chip key={f} small active={state.fields.includes(f)} onClick={() => update({ fields: toggle(state.fields, f) })} testId={`field-${f}`}>{FIELDS[f]}</Chip>
              ))}
            </FilterGroup>
            <FilterGroup title="Job type">
              {(Object.keys(JOB_TYPES) as JobType[]).map((t) => (
                <Chip key={t} small active={state.types.includes(t)} onClick={() => update({ types: toggle(state.types, t) })} testId={`type-${t}`}>{JOB_TYPES[t]}</Chip>
              ))}
            </FilterGroup>
            <FilterGroup title="Level">
              {(Object.keys(LEVELS) as Level[]).map((l) => (
                <Chip key={l} small active={state.levels.includes(l)} onClick={() => update({ levels: toggle(state.levels, l) })} testId={`level-${l}`}>{LEVELS[l]}</Chip>
              ))}
            </FilterGroup>
            <FilterGroup title="Pay">
              <Chip small active={state.pay} onClick={() => update({ pay: !state.pay })} testId="pay">Only jobs that show pay</Chip>
            </FilterGroup>
            <FilterGroup title="Posted">
              <Chip small active={!state.posted} onClick={() => update({ posted: null })} testId="posted-any">Any time</Chip>
              {(Object.keys(POSTED) as Posted[]).map((p) => (
                <Chip key={p} small active={state.posted === p} onClick={() => update({ posted: p })} testId={`posted-${p}`}>{POSTED[p]}</Chip>
              ))}
            </FilterGroup>
          </div>
          <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-border bg-background px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <Button variant="outline" className="min-h-[48px]" onClick={clearFilters} disabled={!nFilters}>Clear all</Button>
            <Button className="min-h-[48px] flex-1" onClick={() => setFiltersOpen(false)} data-testid="filters-done">
              {busy ? "Updating…" : total === null ? "Show jobs" : `Show ${total.toLocaleString("en-GB")} ${total === 1 ? "job" : "jobs"}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
