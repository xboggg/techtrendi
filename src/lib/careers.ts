// TechTrendi Careers: the jobs list's address, request shape and small display helpers.
// Data comes from the Careers API (careers-service, GET /api/careers/v1/jobs): only published
// jobs, each with its source's credit line. Apply links always go to the source's own page.
//
// PREVIEW (CAREERS_LAUNCHED = false): /tools-preview/careers, noindex, not prerendered, not in
// the sitemap (the "tools-preview" segment is skipped by vite.config.ts and generate-sitemap.mjs),
// no link from anywhere on the site. Launch is a separate step with the owner's go-ahead and an
// AdSense/SEO before-and-after check (docs/careers/DECISIONS.md D-023, D-025).
export const CAREERS_LAUNCHED = false;
export const CAREERS_PREVIEW_BASE = "/tools-preview/careers";
export const CAREERS_BASE = CAREERS_PREVIEW_BASE;
export const CAREERS_ROUTE = CAREERS_BASE.replace(/^\//, "");
export const CAREERS_NOINDEX = !CAREERS_LAUNCHED;
export const CAREERS_API = "/api/careers/v1";

export type Country = "GH" | "NG";
export type JobKind = "all" | "remote" | "local";

export const COUNTRY_NAME: Record<Country, string> = { GH: "Ghana", NG: "Nigeria" };

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
  closes_at: string | null;
  open_to: string[];
}

export interface JobPage {
  items: Job[];
  next_cursor: string | null;
  total: number;
  freshness_note: string;
}

export interface JobQuery {
  country: Country;
  kind: JobKind;
  q?: string;
  cursor?: string | null;
  limit?: number;
}

/** The request for one page. "All" = open to the reader's country; "Remote" = also remote;
 *  "In Ghana/Nigeria" = the job's own location is there (and it is not remote). */
export function jobsUrl({ country, kind, q, cursor, limit = 20 }: JobQuery): string {
  const p = new URLSearchParams();
  if (kind === "local") p.set("located", country);
  else p.set("country", country);
  if (kind === "remote") p.set("work_mode", "remote");
  const words = (q ?? "").trim().slice(0, 200);
  if (words) p.set("q", words);
  if (cursor) p.set("cursor", cursor);
  p.set("limit", String(limit));
  return `${CAREERS_API}/jobs?${p.toString()}`;
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

/** Plain words for the work mode chip; null when the source did not say. */
export function workModeLabel(mode: Job["work_mode"]): string | null {
  return { remote: "Remote", hybrid: "Hybrid", onsite: "On-site", unknown: null }[mode] ?? null;
}

/** "Ghana and Nigeria" / "Nigeria". */
export function openToText(codes: string[]): string {
  const names = codes.filter((c): c is Country => c === "GH" || c === "NG").map((c) => COUNTRY_NAME[c]);
  return names.join(" and ");
}

/** Only https links leave the page (the API already refuses others; belt and braces). */
export function safeLink(url: string | null | undefined): string | null {
  return typeof url === "string" && /^https:\/\//.test(url) ? url : null;
}
