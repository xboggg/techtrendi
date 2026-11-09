// TechTrendi Careers jobs board: <CAREERS_BASE> (/careers since 8 Nov 2026).
// Prerendered as a shell; noindex and out of the sitemap until CAREERS_INDEXED (src/lib/careers.ts).
// Every job comes from an approved source and links back to it; "Apply" opens the source's own
// page. Jobs load in the browser from the Careers API, so none of them is part of the page's HTML.
// The reader's choices (tab, search, filters, skills, page number) live in the page address, so the
// phone's Back button returns to the same list; only the country is remembered in the browser.
// Top panel redesigned 9 Nov 2026 (owner: "more advanced UI… filter must stand out… animate"):
// motion lives in src/index.css, "cr-" classes (transform/opacity only, off for reduced motion).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Briefcase, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Globe2, Home, MapPin, Search, ShieldAlert,
  SlidersHorizontal, Sparkles, TrendingUp, Wallet, X,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAssistantOutOfWay } from "@/components/careers/useAssistantOutOfWay";
import { cn } from "@/lib/utils";
import {
  CAREERS_BASE, CAREERS_NOINDEX, COUNTRY_NAME, EMPTY_STATE, FIELDS, JOB_TYPES, LEVELS, POSTED, SKILLS,
  evidenceText, fieldLabel, filterCount, isNew, jobTypeLabel, jobsUrl, levelLabel, pageItems, postedAgo, rankedSkills,
  readState, safeLink, shortDate, skillLabel, workModeLabel, writeState,
  type BoardState, type Country, type Field, type Job, type JobKind, type JobPage, type JobType, type Level, type Posted,
  type Skill,
} from "@/lib/careers";

const COUNTRY_KEY = "tt_careers_country";
/** Skills shown on the top panel before "More skills" (fewer on phones), and in the Filters panel before "Show all". */
const TOP_SKILLS = 6;
const TOP_SKILLS_PHONE = 4;
const PANEL_SKILLS = 10;

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
const fmt = (n: number) => n.toLocaleString("en-GB");

/** Counts up to a new number (the top panel's live figures); jumps straight there for reduced motion. */
function useCountUp(target: number | null, ms = 900): number | null {
  const [value, setValue] = useState<number | null>(null);
  const from = useRef(0);
  useEffect(() => {
    if (target === null) return;
    const still = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) { from.current = target; setValue(target); return; }
    const start = performance.now();
    const base = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const v = Math.round(base + (target - base) * (1 - Math.pow(1 - p, 3)));
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

function Flag({ country }: { country: Country }) {
  return country === "GH" ? (
    <svg viewBox="0 0 30 20" aria-hidden className="h-4 w-6 shrink-0 rounded-[3px] shadow-sm">
      <rect width="30" height="6.67" fill="#CE1126" />
      <rect y="6.67" width="30" height="6.67" fill="#FCD116" />
      <rect y="13.33" width="30" height="6.67" fill="#006B3F" />
      <polygon points="15,6.6 15.9,9.2 18.6,9.2 16.4,10.8 17.2,13.4 15,11.8 12.8,13.4 13.6,10.8 11.4,9.2 14.1,9.2" fill="#000" />
    </svg>
  ) : (
    <svg viewBox="0 0 30 20" aria-hidden className="h-4 w-6 shrink-0 rounded-[3px] shadow-sm">
      <rect width="10" height="20" fill="#008751" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#008751" />
    </svg>
  );
}

/** Two or three equal buttons with a white pill that slides to the chosen one. */
function Segmented<T extends string>({ label, value, options, onChange, testPrefix, compact }: {
  label: string; value: T; onChange: (v: T) => void; testPrefix: string; compact?: boolean;
  options: { value: T; label: string; icon: React.ReactNode }[];
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div role="group" aria-label={label}
      className="relative grid rounded-2xl bg-white/10 p-1 ring-1 ring-white/15 backdrop-blur-sm"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      <span aria-hidden
        className="absolute bottom-1 left-1 top-1 rounded-xl bg-white shadow-lg shadow-black/20 transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }} />
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={on}
            data-testid={`${testPrefix}-${o.value}`}
            className={cn(
              "relative z-10 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-1.5 text-center text-sm font-semibold leading-tight transition-colors",
              // Phones: words only, so three choices fit on one line.
              compact && "text-[13px] sm:text-sm [&>svg]:hidden sm:[&>svg]:block",
              on ? "text-slate-900" : "text-white/85 hover:text-white",
            )}>
            {o.icon}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Chip({ active, onClick, children, testId, small, count }: {
  active: boolean; onClick: () => void; children: React.ReactNode; testId?: string; small?: boolean; count?: number;
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
        active ? "cr-pop border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {children}
      {count !== undefined && <span className={cn("ml-1.5 text-xs font-medium", active ? "opacity-80" : "text-muted-foreground")}>{fmt(count)}</span>}
    </button>
  );
}

/** A skill on the dark top panel. */
function SkillPill({ active, onClick, children, count, testId, className }: {
  active: boolean; onClick: () => void; children: React.ReactNode; count?: number; testId?: string; className?: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} data-testid={testId}
      className={cn(
        "inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-all duration-200 sm:text-sm",
        className,
        active
          ? "cr-pop bg-amber-400 text-slate-900 shadow-md shadow-amber-500/30"
          : "bg-white/10 text-white ring-1 ring-white/20 hover:-translate-y-0.5 hover:bg-white/20",
      )}>
      {children}
      {count !== undefined && <span className={cn("text-xs font-medium", active ? "text-slate-800" : "text-white/60")}>{fmt(count)}</span>}
    </button>
  );
}

function Stat({ value, label, accent }: { value: number | null; label: string; accent?: boolean }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/[0.07] px-3 py-2 ring-1 ring-white/10 sm:py-2.5">
      <p className={cn("text-lg font-black tabular-nums leading-none sm:text-2xl", accent ? "text-amber-300" : "text-white")}>
        {value === null ? <span aria-hidden className="inline-block h-5 w-12 animate-pulse rounded bg-white/15 align-middle" /> : fmt(value)}
      </p>
      <p className="mt-1 truncate text-xs font-medium text-white/70 sm:text-[13px]">{label}</p>
    </div>
  );
}

// Company letter badge colours (when the source has no logo), picked from the name.
const BADGES = ["from-sky-500 to-blue-600", "from-violet-500 to-fuchsia-600", "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600", "from-rose-500 to-pink-600", "from-indigo-500 to-blue-700"];

function Logo({ job }: { job: Job }) {
  const [broken, setBroken] = useState(false);
  const src = safeLink(job.company_logo_url);
  if (!src || broken) {
    const tone = BADGES[[...job.company].reduce((n, ch) => n + ch.charCodeAt(0), 0) % BADGES.length];
    return (
      <div aria-hidden className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-base font-bold text-white shadow-sm", tone)}>
        {job.company.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" width={44} height={44}
      onError={() => setBroken(true)} className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-1 ring-1 ring-border" />
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

function JobCard({ job, country, onToggle, index }: { job: Job; country: Country; onToggle: () => void; index: number }) {
  const [open, setOpen] = useState(false);
  const apply = safeLink(job.apply_url);
  const home = safeLink(job.source_home);
  const remote = job.work_mode === "remote";
  const where = remote ? workModeLabel("remote") : job.location || workModeLabel(job.work_mode);
  const type = jobTypeLabel(job);
  const level = levelLabel(job.level);
  const when = postedAgo(job.posted_at);
  const fresh = isNew(job.posted_at);
  const skills = (job.skills ?? []).map(skillLabel).filter((s): s is string => !!s).slice(0, 3);
  const name = COUNTRY_NAME[country];
  const proof = evidenceText(job.open_evidence[country]) ?? (job.location ? `The job is based in ${job.location}.` : null);
  const source = job.source_name ?? "the job site";
  const detailsId = `job-${job.id}-details`;
  const flip = () => { setOpen((o) => !o); onToggle(); };

  return (
    <article
      className="cr-card group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg motion-reduce:hover:translate-y-0"
      style={{ "--cr-i": Math.min(index, 10) } as React.CSSProperties}
      data-testid="job-card"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-sky-400 to-amber-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="flex items-start gap-3">
        <Logo job={job} />
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground">{job.title}</h2>
          <p className="truncate text-sm text-muted-foreground">{job.company}</p>
        </div>
        {fresh && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300" data-testid="job-new">
            <span className="relative flex h-2 w-2">
              <span aria-hidden className="cr-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            New
          </span>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Key facts" data-testid="job-facts">
        {job.salary && <Fact icon={Wallet} strong>{job.salary}</Fact>}
        {type && <Fact icon={Briefcase}>{type}</Fact>}
        {where && <Fact icon={MapPin}>{where}</Fact>}
        {level && <Fact icon={TrendingUp}>{level}</Fact>}
      </ul>

      {skills.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-1.5" data-testid="job-skills">
          <span className="sr-only">Skills: </span>
          {skills.map((s) => (
            <span key={s} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{s}</span>
          ))}
        </p>
      )}

      {job.summary && (
        <p className={cn("mt-3 text-sm text-foreground/80", !open && "line-clamp-2")} data-testid="job-summary">{job.summary}</p>
      )}

      {open && (
        <div id={detailsId} className="cr-rise mt-3 rounded-xl bg-muted/50 px-3 py-2" data-testid="job-details">
          <dl className="divide-y divide-border/60">
            <Detail label="Area of work">{fieldLabel(job.field)}{job.categories.length > 0 && <span className="text-muted-foreground"> ({job.categories.join(", ")})</span>}</Detail>
            {skills.length > 0 && <Detail label="Skills">{skills.join(", ")}</Detail>}
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

      <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
        {apply && (
          <Button asChild className="min-h-[44px] w-full sm:w-auto">
            <a href={apply} target="_blank" rel="noopener" data-testid="apply-link">
              Apply{job.source_name ? ` on ${job.source_name}` : ""} <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
      <p className="text-sm text-muted-foreground">Page {page} of {fmt(pages)}</p>
    </nav>
  );
}

function FilterGroup({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  const id = `filter-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div role="group" aria-labelledby={id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 id={id} className="text-sm font-bold text-foreground">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

interface Stats { total: number; today: number; remote: number }

export default function CareersBoard() {
  const [params, setParams] = useSearchParams();
  // The prerendered shell is built with no address choices, so the first render in the browser
  // must match it (else React #418 and a full re-render, which wipes any ad already placed);
  // the address is read once mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const state = useMemo(() => (mounted ? readState(params) : EMPTY_STATE), [mounted, params]);
  const [country, setCountry] = useState<Country>("GH");
  const [typed, setTyped] = useState("");
  const [data, setData] = useState<JobPage | null>(null);
  const [shownUrl, setShownUrl] = useState("");
  const [skillCounts, setSkillCounts] = useState<Record<string, number> | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [allSkillsOpen, setAllSkillsOpen] = useState(false);
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

  // The list request also asks for jobs per skill (same filters, skills left out).
  const url = jobsUrl(country, state, undefined, true);
  const load = useCallback(async () => {
    request.current?.abort();
    const ctrl = new AbortController();
    request.current = ctrl;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      const page = (await res.json()) as JobPage;
      setData(page);
      setShownUrl(url);
      if (page.skill_counts) setSkillCounts(page.skill_counts);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setFailed(true);
    } finally {
      if (request.current === ctrl) setLoading(false);
    }
  }, [url]);

  // First request once the address and remembered country are known (no wasted first fetch).
  useEffect(() => {
    if (!mounted) return;
    load();
    return () => request.current?.abort();
  }, [load, mounted]);

  // The top panel's figures for the country: all open jobs, new today, work from home.
  // Three one-job requests; the API lets browsers keep each for 5 minutes.
  useEffect(() => {
    if (!mounted) return;
    const ctrl = new AbortController();
    const count = (s: Partial<BoardState>) =>
      fetch(jobsUrl(country, { ...EMPTY_STATE, ...s }, 1), { signal: ctrl.signal, headers: { Accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((p: JobPage) => p.total);
    Promise.all([count({}), count({ posted: "day" }), count({ kind: "remote" })])
      .then(([total, today, remote]) => setStats({ total, today, remote }))
      .catch(() => { /* figures are a nice-to-have; the list has its own error message */ });
    return () => ctrl.abort();
  }, [country, mounted]);

  // A new page of jobs has arrived: back to the top of the list (only when the reader is below
  // it, e.g. at the page buttons; never pulled down from the filters at the top). Done after the new jobs are on
  // screen, so the browser's scroll anchoring cannot move the reader again as the list changes.
  const shownPage = data?.page;
  useEffect(() => {
    if (shownPage === undefined || lastPage.current === shownPage) return;
    lastPage.current = shownPage;
    const top = listTop.current?.getBoundingClientRect().top;
    // "instant": the site's CSS sets smooth scrolling, which would glide through ~6,000px of jobs.
    if (top !== undefined && top < 96) window.scrollTo({ top: Math.max(0, window.scrollY + top - 96), behavior: "instant" as ScrollBehavior });
  }, [shownPage]);

  const name = COUNTRY_NAME[country];
  const pickCountry = (c: Country) => { setCountry(c); saveCountry(c); update({}); };
  const nFilters = filterCount(state);
  const total = data?.total ?? null;
  const jobs = data?.items ?? [];
  const busy = loading && !failed;
  const shownTotal = useCountUp(stats?.total ?? null);
  const shownToday = useCountUp(stats?.today ?? null);
  const shownRemote = useCountUp(stats?.remote ?? null);

  const skillsRanked = rankedSkills(skillCounts, state.skills);
  // Top panel: the chosen skills first, then the busiest ones, up to TOP_SKILLS.
  const topSkills = [...state.skills, ...skillsRanked.filter((s) => !state.skills.includes(s))].slice(0, Math.max(TOP_SKILLS, state.skills.length));
  const moreSkills = Math.max(0, skillsRanked.length - topSkills.length);
  // Filters panel: the busiest skills plus any chosen ones, until "Show all skills".
  const panelSkills = allSkillsOpen ? skillsRanked : skillsRanked.filter((s, i) => i < PANEL_SKILLS || state.skills.includes(s));
  const toggleSkill = (s: Skill) => update({ skills: toggle(state.skills, s) });

  const activeChips: { key: string; label: string; clear: () => void }[] = [
    ...state.skills.map((s) => ({ key: `s-${s}`, label: SKILLS[s], clear: () => toggleSkill(s) })),
    ...state.fields.map((f) => ({ key: `f-${f}`, label: FIELDS[f], clear: () => update({ fields: toggle(state.fields, f) }) })),
    ...state.types.map((t) => ({ key: `t-${t}`, label: JOB_TYPES[t], clear: () => update({ types: toggle(state.types, t) }) })),
    ...state.levels.map((l) => ({ key: `l-${l}`, label: LEVELS[l], clear: () => update({ levels: toggle(state.levels, l) }) })),
    ...(state.pay ? [{ key: "pay", label: "Shows pay", clear: () => update({ pay: false }) }] : []),
    ...(state.posted ? [{ key: "posted", label: `Posted: ${POSTED[state.posted].toLowerCase()}`, clear: () => update({ posted: null }) }] : []),
  ];
  const clearFilters = () => update({ fields: [], skills: [], types: [], levels: [], pay: false, posted: null });

  return (
    <Layout>
      <SEOHead
        title="Jobs Open to People in Ghana and Nigeria"
        description="Remote and local jobs you can apply for from Ghana or Nigeria, from trusted job sites and company career pages. Every job links to where you apply."
        canonical={CAREERS_BASE}
        image="/og-careers.jpg"
        imageAlt="TechTrendi Careers: jobs open to people in Ghana and Nigeria"
        noindex={CAREERS_NOINDEX}
        noindexFollow
      />
      <div className="container mx-auto max-w-5xl px-4 pb-16 pt-4 md:pt-8">
        <section aria-label="Choose jobs"
          className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#081536] via-[#0c2366] to-[#1446c4] px-4 pb-4 pt-5 text-white shadow-xl shadow-blue-900/20 sm:px-8 sm:pb-8 sm:pt-9"
          data-testid="careers-hero">
          {/* Moving light and texture behind the panel. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="cr-dots absolute inset-0 opacity-60" />
            <div className="cr-drift absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-400/30 blur-3xl" />
            <div className="cr-drift absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl [animation-delay:-7s]" />
          </div>
          {/* Floating job icons (wider screens, where the right side is free). */}
          <div aria-hidden className="pointer-events-none absolute right-8 top-8 hidden md:block">
            {[
              { Icon: Briefcase, cls: "right-28 top-0", tilt: "-6deg", delay: "0s" },
              { Icon: Home, cls: "right-0 top-6", tilt: "5deg", delay: "-2s" },
              { Icon: Wallet, cls: "right-16 top-24", tilt: "-3deg", delay: "-4s" },
            ].map(({ Icon, cls, tilt, delay }) => (
              <span key={cls} className={cn("cr-float absolute flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 text-blue-700 shadow-xl shadow-black/20", cls)}
                style={{ "--cr-tilt": tilt, animationDelay: delay } as React.CSSProperties}>
                <Icon className="h-7 w-7" />
              </span>
            ))}
          </div>

          <p className="cr-rise inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
            <span className="relative flex h-2 w-2">
              <span aria-hidden className="cr-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live · new jobs added through the day
          </p>
          <h1 className="mt-3 max-w-xl text-[1.75rem] font-black leading-[1.1] tracking-tight sm:text-5xl" data-testid="page-title">
            Jobs open to people in{" "}
            <span key={country} className="cr-rise inline-block bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">{name}</span>
          </h1>
          <p className="cr-rise mt-2 max-w-xl text-sm text-white/80 [animation-delay:80ms] sm:text-base" data-testid="page-intro">
            Work from home or work in {name}. We only list jobs that say people in {name} can apply.
          </p>

          <div className="cr-rise mt-4 grid max-w-xl grid-cols-3 gap-2 [animation-delay:140ms] sm:mt-5" data-testid="careers-stats">
            <Stat value={shownTotal} label="open jobs" />
            <Stat value={shownToday} label="new today" accent />
            <Stat value={shownRemote} label="from home" />
          </div>

          <div className="cr-rise mt-4 grid gap-2 [animation-delay:200ms] sm:mt-5 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-2.5">
            <Segmented label="I live in" value={country} onChange={pickCountry} testPrefix="country"
              options={(["GH", "NG"] as Country[]).map((c) => ({ value: c, label: COUNTRY_NAME[c], icon: <Flag country={c} /> }))} />
            <Segmented label="Kind of job" value={state.kind} onChange={(k: JobKind) => update({ kind: k })} testPrefix="kind" compact
              options={[
                { value: "all", label: "All jobs", icon: <Globe2 aria-hidden className="h-4 w-4" /> },
                { value: "remote", label: "Work from home", icon: <Home aria-hidden className="h-4 w-4" /> },
                { value: "local", label: `In ${name}`, icon: <MapPin aria-hidden className="h-4 w-4" /> },
              ] as { value: JobKind; label: string; icon: React.ReactNode }[]} />
          </div>

          <div className="cr-rise mt-2 flex gap-2 [animation-delay:260ms] sm:mt-2.5">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Search jobs</span>
              <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                maxLength={200}
                placeholder="Job, company or city"
                data-testid="search"
                className="min-h-[52px] w-full rounded-2xl border-0 bg-white pl-11 pr-3 text-base text-slate-900 shadow-lg shadow-black/10 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-300/60"
              />
            </label>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              data-testid="filters-open"
              className={cn(
                "cr-shine inline-flex min-h-[52px] shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 px-4 text-[15px] font-extrabold text-slate-900 transition-transform hover:scale-[1.03] active:scale-95 motion-reduce:transform-none",
                nFilters === 0 && "cr-glow",
              )}
            >
              <SlidersHorizontal aria-hidden className="h-5 w-5" />
              Filters
              {nFilters > 0 && <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-slate-900 px-1.5 text-xs font-bold text-amber-300" data-testid="filters-count">{nFilters}</span>}
            </button>
          </div>

          <div className="cr-rise mt-3.5 [animation-delay:320ms] sm:mt-4" data-testid="skills-top">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/90">
              <Sparkles aria-hidden className="h-4 w-4 text-amber-300" /> Find jobs by skill
            </p>
            <div className="flex flex-wrap gap-2">
              {skillCounts === null
                ? Array.from({ length: TOP_SKILLS }, (_, i) => (
                    <span key={i} aria-hidden className={cn("h-10 w-28 animate-pulse rounded-full bg-white/10", i >= TOP_SKILLS_PHONE && "hidden sm:inline-block")} />
                  ))
                : (
                  <>
                    {topSkills.map((s, i) => (
                      <SkillPill key={s} active={state.skills.includes(s)} onClick={() => toggleSkill(s)} count={skillCounts[s]} testId={`skill-top-${s}`}
                        className={cn(i >= TOP_SKILLS_PHONE && !state.skills.includes(s) && "hidden sm:inline-flex")}>
                        {SKILLS[s]}
                      </SkillPill>
                    ))}
                    {(moreSkills > 0 || topSkills.length > TOP_SKILLS_PHONE) && (
                      <button type="button" onClick={() => { setAllSkillsOpen(true); setFiltersOpen(true); }} data-testid="skills-more"
                        className="inline-flex min-h-[40px] items-center gap-1 rounded-full px-2 text-[13px] font-bold text-amber-300 underline-offset-4 hover:underline sm:text-sm">
                        More skills <ChevronRight aria-hidden className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
            </div>
          </div>
        </section>

        {activeChips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="active-filters">
            {activeChips.map((c) => (
              <button key={c.key} type="button" onClick={c.clear} aria-label={`Remove filter: ${c.label}`}
                className="cr-pop inline-flex min-h-[36px] items-center gap-1 rounded-full bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                {c.label} <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            ))}
            <button type="button" onClick={clearFilters} className="min-h-[36px] px-2 text-sm font-semibold text-muted-foreground underline underline-offset-2">
              Clear all
            </button>
          </div>
        )}

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
          <ShieldAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Never pay money to get a job. Real employers do not charge fees. <Link to="/report-scam" className="font-semibold underline underline-offset-2">Report a fake job</Link></p>
        </div>

        <div ref={listTop} />
        <p className="mt-5 text-sm font-semibold text-foreground" aria-live="polite" data-testid="count">
          {total === null ? "Loading jobs…"
            : total === 0 ? (nFilters ? "No jobs match these filters. Try removing one." : "No jobs match yet. Try another word or tab.")
            : <>{fmt(total)} {total === 1 ? "job" : "jobs"}{data && data.pages > 1 && <span className="font-normal text-muted-foreground"> · page {data.page} of {fmt(data.pages)}</span>}</>}
        </p>

        {failed && (
          <div className="mt-3 rounded-xl border border-border bg-card p-4 text-sm" role="alert" data-testid="load-error">
            <p className="text-foreground">Jobs could not load. Check your internet, then try again.</p>
            <Button variant="outline" className="mt-3 min-h-[44px]" onClick={() => load()}>Try again</Button>
          </div>
        )}

        {/* Keyed by the request shown, so each new list rises in, card by card. */}
        <div key={shownUrl} className={cn("mt-3 grid grid-cols-1 gap-3 transition-opacity [overflow-anchor:none] md:grid-cols-2", busy && jobs.length > 0 && "opacity-50")} data-testid="job-list" aria-busy={busy}>
          {jobs.map((j, i) => <JobCard key={j.id} job={j} index={i} country={country} onToggle={() => setOpened((n) => n + 1)} />)}
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
        {/* Phone: a panel from the bottom, full width. Wider screens (owner, 8 Nov 2026: full width
            "looks terrible" on a computer): a centred box, 640px wide, lifted off the bottom edge. */}
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-4 pb-0 pt-5 sm:bottom-6 sm:mx-auto sm:max-h-[80vh] sm:max-w-2xl sm:rounded-2xl sm:border sm:px-6" data-testid="filters-panel">
          <SheetHeader className="text-left">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Pick as many as you like. The list updates as you tap.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4 pb-4">
            <FilterGroup title="Skills" hint="The number is how many jobs ask for it.">
              {panelSkills.map((s) => (
                <Chip key={s} small active={state.skills.includes(s)} onClick={() => toggleSkill(s)} testId={`skill-${s}`}
                  count={skillCounts ? skillCounts[s] ?? 0 : undefined}>{SKILLS[s]}</Chip>
              ))}
              {panelSkills.length < skillsRanked.length && (
                <button type="button" onClick={() => setAllSkillsOpen(true)} data-testid="skills-all"
                  className="inline-flex min-h-[44px] items-center gap-1 px-2 text-sm font-bold text-primary">
                  Show all {skillsRanked.length} skills <ChevronDown aria-hidden className="h-4 w-4" />
                </button>
              )}
            </FilterGroup>
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
          <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-border bg-background px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:-mx-6 sm:px-6 sm:pb-4">
            <Button variant="outline" className="min-h-[48px]" onClick={clearFilters} disabled={!nFilters}>Clear all</Button>
            <Button className="min-h-[48px] flex-1" onClick={() => setFiltersOpen(false)} data-testid="filters-done">
              {busy ? "Updating…" : total === null ? "Show jobs" : `Show ${fmt(total)} ${total === 1 ? "job" : "jobs"}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
