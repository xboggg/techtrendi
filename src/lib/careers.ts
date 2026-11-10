// TechTrendi Careers: the jobs list's address, request shape and small display helpers.
// Data comes from the Careers API (careers-service, GET /api/careers/v1/jobs): only published
// jobs, each with its source's credit line. Apply links always go to the source's own page.
//
// PREVIEW (CAREERS_LAUNCHED = false): /tools-preview/careers, noindex, not prerendered, not in
// the sitemap (the "tools-preview" segment is skipped by vite.config.ts and generate-sitemap.mjs).
// LAUNCHED (owner, 8 Nov 2026: "Put it online"): /careers, prerendered as an empty shell (jobs
// still load in the browser), still noindex and still out of the sitemap: the page's content is
// copied feed jobs, which never become indexable (D-023, D-025). Indexing waits until the board
// has TechTrendi-written jobs (Jobs Desk) and is a separate owner decision: CAREERS_INDEXED.
export const CAREERS_LAUNCHED = true;
export const CAREERS_INDEXED = false;
export const CAREERS_PREVIEW_BASE = "/tools-preview/careers";
export const CAREERS_BASE = CAREERS_LAUNCHED ? "/careers" : CAREERS_PREVIEW_BASE;
export const CAREERS_ROUTE = CAREERS_BASE.replace(/^\//, "");
export const CAREERS_NOINDEX = !(CAREERS_LAUNCHED && CAREERS_INDEXED);
export const CAREERS_API = "/api/careers/v1";
export const PAGE_SIZE = 20;

export type Country = "GH" | "NG";
export type JobKind = "all" | "remote" | "local";

export const COUNTRY_NAME: Record<Country, string> = { GH: "Ghana", NG: "Nigeria" };

// Filter values, as the API computes them (careers-service migration 007). Order = order shown.
export const FIELDS = {
  tech: "Software & IT",
  data: "Data & AI",
  sales: "Sales",
  marketing: "Marketing",
  support: "Customer service",
  design: "Design & media",
  finance: "Finance & banking",
  hr: "HR & recruiting",
  ops: "Operations & logistics",
  writing: "Writing & languages",
  education: "Education & training",
  other: "Other",
} as const;
export type Field = keyof typeof FIELDS;

export const JOB_TYPES = { full_time: "Full-time", part_time: "Part-time", contract: "Contract", internship: "Internship" } as const;
export type JobType = keyof typeof JOB_TYPES;
const JOB_TYPE_WORDS: Record<string, string> = { ...JOB_TYPES, volunteer: "Volunteer" };

export const LEVELS = { entry: "Entry-level", mid: "Mid-level", senior: "Senior" } as const;
export type Level = keyof typeof LEVELS;

export const POSTED = { day: "Today", week: "This week", month: "This month" } as const;
export type Posted = keyof typeof POSTED;

// Skills, as the API matches them on the job's title and categories (careers-service app/skills.py).
export const SKILLS = {
  ai_training: "AI training",
  ai: "AI & machine learning",
  python: "Python",
  web: "Web development",
  mobile: "Mobile apps",
  data_analysis: "Data analysis",
  cloud: "Cloud & DevOps",
  security: "Cybersecurity",
  design: "UI/UX & graphic design",
  video: "Video & photo",
  writing: "Writing & content",
  translation: "Translation & languages",
  french: "French",
  social: "Social media & SEO",
  sales: "Sales",
  support: "Customer support",
  recruiting: "Recruiting & HR",
  accounting: "Accounting",
  project: "Project management",
  assistant: "Virtual assistant & admin",
  teaching: "Teaching & tutoring",
  health: "Nursing & health",
  logistics: "Logistics & driving",
} as const;
export type Skill = keyof typeof SKILLS;
export const skillLabel = (s: string): string | null => (SKILLS as Record<string, string>)[s] ?? null;

/** Skills with jobs, most jobs first (ties keep the SKILLS order); chosen ones always stay in. */
export function rankedSkills(counts: Partial<Record<string, number>> | null | undefined, chosen: Skill[] = []): Skill[] {
  const keys = Object.keys(SKILLS) as Skill[];
  if (!counts) return keys;
  return keys
    .filter((k) => (counts[k] ?? 0) > 0 || chosen.includes(k))
    .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));
}

export interface Job {
  id: string;
  title: string;
  company: string;
  company_logo_url: string | null;
  summary: string | null;
  apply_url: string;
  source_url: string | null;
  source_name: string | null;
  source_home: string | null;
  attribution: string | null;
  work_mode: "remote" | "hybrid" | "onsite" | "unknown";
  employment_type: string | null;
  location: string | null;
  salary: string | null;
  posted_at: string | null;
  closes_at: string | null;          // only a real date from the source, never our estimate
  open_to: string[];
  open_evidence: Record<string, string>;
  field: string;
  job_type: string | null;
  level: string;
  categories: string[];
  skills?: string[];
}

export interface JobPage {
  items: Job[];
  total: number;
  page: number;
  pages: number;
  freshness_note: string;
  skill_counts?: Record<string, number> | null;
}

/** Everything the reader has chosen, apart from the country (remembered in the browser). */
export interface BoardState {
  kind: JobKind;
  q: string;
  fields: Field[];
  skills: Skill[];
  types: JobType[];
  levels: Level[];
  pay: boolean;
  posted: Posted | null;
  page: number;
}

export const EMPTY_STATE: BoardState = { kind: "all", q: "", fields: [], skills: [], types: [], levels: [], pay: false, posted: null, page: 1 };

const pick = <K extends string>(raw: string | null, allowed: Record<K, string>): K[] =>
  [...new Set((raw ?? "").split(",").map((v) => v.trim()).filter((v): v is K => v in allowed))];

/** The reader's choices from the page address (?kind=remote&field=tech,data&page=3), so the
 *  phone's Back button and a shared link land on the same list. Unknown values are dropped. */
export function readState(sp: URLSearchParams): BoardState {
  const kind = sp.get("kind");
  const posted = sp.get("posted");
  const page = Number.parseInt(sp.get("page") ?? "1", 10);
  return {
    kind: kind === "remote" || kind === "local" ? kind : "all",
    q: (sp.get("q") ?? "").slice(0, 200),
    fields: pick(sp.get("field"), FIELDS),
    skills: pick(sp.get("skill"), SKILLS),
    types: pick(sp.get("type"), JOB_TYPES),
    levels: pick(sp.get("level"), LEVELS),
    pay: sp.get("pay") === "1",
    posted: posted && posted in POSTED ? (posted as Posted) : null,
    page: Number.isFinite(page) && page >= 1 && page <= 500 ? page : 1,
  };
}

/** The page address for a state; defaults are left out so the plain address stays plain. */
export function writeState(s: BoardState): URLSearchParams {
  const p = new URLSearchParams();
  if (s.kind !== "all") p.set("kind", s.kind);
  if (s.q.trim()) p.set("q", s.q.trim());
  if (s.fields.length) p.set("field", s.fields.join(","));
  if (s.skills.length) p.set("skill", s.skills.join(","));
  if (s.types.length) p.set("type", s.types.join(","));
  if (s.levels.length) p.set("level", s.levels.join(","));
  if (s.pay) p.set("pay", "1");
  if (s.posted) p.set("posted", s.posted);
  if (s.page > 1) p.set("page", String(s.page));
  return p;
}

/** How many filters (inside the Filters panel) are on. */
export function filterCount(s: BoardState): number {
  return s.fields.length + s.skills.length + s.types.length + s.levels.length + (s.pay ? 1 : 0) + (s.posted ? 1 : 0);
}

/** The API request for one page. "All" = open to the reader's country; "Work from home" = also
 *  remote; "In Ghana/Nigeria" = the job's own location is there (and it is not remote). */
/** Particular jobs by id (a shared link, the saved list); closed ones are simply not returned. */
export const jobsByIdUrl = (ids: string[]) => `${CAREERS_API}/jobs?ids=${ids.filter(isJobId).slice(0, 50).join(",")}&limit=50`;

export function jobsUrl(country: Country, s: BoardState, limit = PAGE_SIZE, facets = false): string {
  const p = new URLSearchParams();
  if (s.kind === "local") p.set("located", country);
  else p.set("country", country);
  if (s.kind === "remote") p.set("work_mode", "remote");
  const words = s.q.trim().slice(0, 200);
  if (words) p.set("q", words);
  if (s.fields.length) p.set("field", s.fields.join(","));
  if (s.skills.length) p.set("skill", s.skills.join(","));
  if (s.types.length) p.set("job_type", s.types.join(","));
  if (s.levels.length) p.set("level", s.levels.join(","));
  if (s.pay) p.set("pay", "true");
  if (s.posted) p.set("posted", s.posted);
  if (s.page > 1) p.set("page", String(s.page));
  p.set("limit", String(limit));
  if (facets) p.set("facets", "true");
  return `${CAREERS_API}/jobs?${p.toString()}`;
}

/** Page buttons: every page when there are up to 7, otherwise the first, the last and the
 *  current one with its neighbours, gaps shown as "…" (fits a phone: at most 7 items). */
export function pageItems(current: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const c = Math.min(Math.max(current, 1), pages);
  const start = c <= 3 ? 2 : c >= pages - 2 ? pages - 3 : c - 1;
  const end = c <= 3 ? 4 : c >= pages - 2 ? pages - 1 : c + 1;
  const out: (number | "…")[] = [1];
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

/** "today", "yesterday", "3 days ago", "2 weeks ago", "1 month ago"; "" when unknown. */
export function postedAgo(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const days = Math.floor((now.getTime() - t) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/** Posted in the last 2 days: the card gets a "New" badge. */
export function isNew(iso: string | null, now: Date = new Date()): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return !Number.isNaN(t) && now.getTime() - t < 2 * 86_400_000;
}

/** "7 Jan 2027"; "" when unknown. */
export function shortDate(iso: string | null): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Plain words for where the work happens; null when the source did not say. */
export function workModeLabel(mode: Job["work_mode"]): string | null {
  return { remote: "Work from home", hybrid: "Hybrid", onsite: "At the office", unknown: null }[mode] ?? null;
}

/** "Full-time" for the computed type; the source's own words when we could not tell. */
export function jobTypeLabel(job: Pick<Job, "job_type" | "employment_type">): string | null {
  if (job.job_type && JOB_TYPE_WORDS[job.job_type]) return JOB_TYPE_WORDS[job.job_type];
  const raw = (job.employment_type ?? "").trim();
  return raw && !/^remote$/i.test(raw) ? raw : null;
}

export const fieldLabel = (f: string): string => (FIELDS as Record<string, string>)[f] ?? FIELDS.other;
export const levelLabel = (l: string): string | null => (LEVELS as Record<string, string>)[l] ?? null;

const EVIDENCE = /^(listed|source|stated):\s*(.+)$/i;

/** Why we say a job is open to the reader, in plain words, from the collector's evidence
 *  ("listed: Ghana", "source: open worldwide"). */
export function evidenceText(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = raw.trim().match(EVIDENCE);
  if (!m) return raw.trim();
  const what = m[2].trim();
  if (m[1].toLowerCase() === "source") return `The job site marks it as ${what}.`;
  return `The job says: “${what}”.`;
}

/** "Ghana and Nigeria" / "Nigeria". */
export function openToText(codes: string[]): string {
  const names = codes.filter((c): c is Country => c === "GH" || c === "NG").map((c) => COUNTRY_NAME[c]);
  return names.join(" and ");
}

// --- Sharing and saving (owner, 10 Nov 2026) ---

const JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isJobId = (v: string | null | undefined): v is string => !!v && JOB_ID.test(v);

/** The link people share: a small page with the job's own title for WhatsApp/Facebook previews,
 *  which sends them on to the board with the job shown (careers-service GET /share/{id}). */
export const shareUrl = (id: string) => `https://techtrendi.com/careers/job/${id}`;
export const shareText = (job: Pick<Job, "title" | "company">) => `${job.title} at ${job.company}`;
export const whatsappUrl = (job: Pick<Job, "id" | "title" | "company">) =>
  `https://wa.me/?text=${encodeURIComponent(`${shareText(job)} – see it on TechTrendi Jobs: ${shareUrl(job.id)}`)}`;
export const telegramUrl = (job: Pick<Job, "id" | "title" | "company">) =>
  `https://t.me/share/url?url=${encodeURIComponent(shareUrl(job.id))}&text=${encodeURIComponent(shareText(job))}`;

/** Saved jobs stay on the reader's own phone (browser storage): no account, nothing sent to us.
 *  A copy of each job is kept so the list still shows if the job later closes. */
export const SAVED_KEY = "tt_careers_saved";
export const SAVED_MAX = 100;

export function readSaved(store: Pick<Storage, "getItem"> | null = safeStorage()): Job[] {
  try {
    const raw = store?.getItem(SAVED_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((j) => j && isJobId(j.id) && typeof j.title === "string").slice(0, SAVED_MAX) : [];
  } catch {
    return [];
  }
}

export function writeSaved(list: Job[], store: Pick<Storage, "setItem"> | null = safeStorage()): void {
  try {
    store?.setItem(SAVED_KEY, JSON.stringify(list.slice(0, SAVED_MAX)));
  } catch {
    /* private mode or full: saving just doesn't last */
  }
}

/** Saved list with this job added (newest first) or removed. */
export function toggleSaved(list: Job[], job: Job): Job[] {
  return list.some((j) => j.id === job.id) ? list.filter((j) => j.id !== job.id) : [job, ...list].slice(0, SAVED_MAX);
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Only https links leave the page (the API already refuses others; belt and braces). */
export function safeLink(url: string | null | undefined): string | null {
  return typeof url === "string" && /^https:\/\//.test(url) ? url : null;
}
