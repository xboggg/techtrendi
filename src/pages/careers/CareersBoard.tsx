// TechTrendi Careers jobs board: <CAREERS_BASE> (preview: /tools-preview/careers).
// Preview: noindex, not prerendered, not in the sitemap, not linked (src/lib/careers.ts).
// Every job comes from an approved source and links back to it; "Apply" opens the source's own
// page. Jobs load in the browser from the Careers API, so none of them is part of the page's HTML.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, ExternalLink, Loader2, MapPin, Search, ShieldAlert, Wallet } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CAREERS_BASE, CAREERS_NOINDEX, COUNTRY_NAME, jobsUrl, openToText, postedAgo, safeLink, workModeLabel,
  type Country, type Job, type JobKind, type JobPage,
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

function Chip({ active, onClick, children, testId }: { active: boolean; onClick: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={testId}
      className={cn(
        "min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-colors",
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

function JobCard({ job }: { job: Job }) {
  const apply = safeLink(job.apply_url);
  const home = safeLink(job.source_home);
  const mode = workModeLabel(job.work_mode);
  const when = postedAgo(job.posted_at);
  const openTo = openToText(job.open_to);
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm" data-testid="job-card">
      <div className="flex items-start gap-3">
        <Logo job={job} />
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground">{job.title}</h2>
          <p className="truncate text-sm text-muted-foreground">{job.company}</p>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {job.location && (
          <li className="flex min-w-0 items-center gap-1"><MapPin className="h-4 w-4 shrink-0" /><span className="line-clamp-1">{job.location}</span></li>
        )}
        {mode && <li className="flex items-center gap-1"><Briefcase className="h-4 w-4 shrink-0" />{mode}{job.employment_type ? ` · ${job.employment_type}` : ""}</li>}
        {job.salary && <li className="flex items-center gap-1"><Wallet className="h-4 w-4 shrink-0" />{job.salary}</li>}
      </ul>

      {job.summary && <p className="mt-3 line-clamp-3 text-sm text-foreground/80">{job.summary}</p>}

      {openTo && (
        <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">✓ Open to people in {openTo}</p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

export default function CareersBoard() {
  const [country, setCountry] = useState<Country>("GH");
  const [kind, setKind] = useState<JobKind>("all");
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const request = useRef<AbortController | null>(null);

  // Remembered country (browser only; the preview is never prerendered).
  useEffect(() => { setCountry(readCountry()); }, []);

  // Search waits until the reader stops typing.
  useEffect(() => {
    const t = window.setTimeout(() => setQ(typed), 400);
    return () => window.clearTimeout(t);
  }, [typed]);

  const load = useCallback(async (more: boolean, after: string | null) => {
    request.current?.abort();
    const ctrl = new AbortController();
    request.current = ctrl;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(jobsUrl({ country, kind, q, cursor: more ? after : null }), {
        signal: ctrl.signal, headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      const page = (await res.json()) as JobPage;
      setJobs((prev) => (more ? [...prev, ...page.items] : page.items));
      setTotal(page.total);
      setCursor(page.next_cursor);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setFailed(true);
    } finally {
      if (request.current === ctrl) setLoading(false);
    }
  }, [country, kind, q]);

  useEffect(() => { load(false, null); return () => request.current?.abort(); }, [load]);

  const name = COUNTRY_NAME[country];
  const pickCountry = (c: Country) => { setCountry(c); saveCountry(c); };

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
            Jobs you can get from {name}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            From trusted job sites and company career pages. Checked several times a day.
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
            <Chip active={kind === "all"} onClick={() => setKind("all")} testId="kind-all">All jobs</Chip>
            <Chip active={kind === "remote"} onClick={() => setKind("remote")} testId="kind-remote">Work from home</Chip>
            <Chip active={kind === "local"} onClick={() => setKind("local")} testId="kind-local">In {name}</Chip>
          </div>
          <label className="relative block">
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
        </section>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
          <ShieldAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Never pay money to get a job. Real employers do not charge fees. <Link to="/report-scam" className="font-semibold underline underline-offset-2">Report a fake job</Link></p>
        </div>

        <p className="mt-5 text-sm font-semibold text-foreground" aria-live="polite" data-testid="count">
          {total === null ? "Loading jobs…" : total === 0 ? "No jobs match yet. Try another word or tab." : `${total.toLocaleString("en-GB")} ${total === 1 ? "job" : "jobs"}`}
        </p>

        {failed && (
          <div className="mt-3 rounded-xl border border-border bg-card p-4 text-sm" role="alert" data-testid="load-error">
            <p className="text-foreground">Jobs could not load. Check your internet, then try again.</p>
            <Button variant="outline" className="mt-3 min-h-[44px]" onClick={() => load(jobs.length > 0, cursor)}>Try again</Button>
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="job-list">
          {jobs.map((j) => <JobCard key={j.id} job={j} />)}
          {loading && jobs.length === 0 && Array.from({ length: 4 }, (_, i) => (
            <div key={i} aria-hidden className="h-48 animate-pulse rounded-2xl border border-border bg-muted/50" />
          ))}
        </div>

        {cursor && !failed && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" className="min-h-[48px] w-full sm:w-auto sm:px-10" disabled={loading} onClick={() => load(true, cursor)} data-testid="more">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</> : "Show more jobs"}
            </Button>
          </div>
        )}

        <p className="mt-10 text-xs text-muted-foreground">
          TechTrendi lists jobs from other websites and links to them. We do not hire for these jobs and we never ask for money.
          Check every job on the employer's own page before you share personal details.
        </p>
      </div>
    </Layout>
  );
}
