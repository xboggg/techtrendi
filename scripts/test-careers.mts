// Careers jobs board: request building, display helpers, and the preview's SEO isolation.
// Imports the real modules, so it cannot pass while the shipped code is broken.
//
// Run: npx tsx scripts/test-careers.mts
import { readdirSync, readFileSync } from "node:fs";
import {
  CAREERS_BASE, CAREERS_INDEXED, CAREERS_LAUNCHED, CAREERS_NOINDEX, CAREERS_ROUTE, EMPTY_STATE, SKILLS, evidenceText, filterCount, isNew,
  jobTypeLabel, jobsUrl, openToText, pageItems, postedAgo, rankedSkills, readState, safeLink, shortDate, skillLabel, workModeLabel, writeState,
  type BoardState,
} from "../src/lib/careers";
import { ASSISTANT_SELECTOR } from "../src/components/careers/useAssistantOutOfWay";

let failed = 0;
const ok = (cond: unknown, what: string) => {
  if (cond) console.log(`ok   ${what}`);
  else { failed++; console.log(`FAIL ${what}`); }
};
const params = (url: string) => Object.fromEntries(new URL(url, "https://techtrendi.com").searchParams);

// --- requests: what each tab and filter asks the API for
const S = (p: Partial<BoardState>): BoardState => ({ ...EMPTY_STATE, ...p });
ok(JSON.stringify(params(jobsUrl("GH", S({})))) === JSON.stringify({ country: "GH", limit: "20" }), "All jobs = open to the reader's country");
const remote = params(jobsUrl("NG", S({ kind: "remote" })));
ok(remote.work_mode === "remote" && remote.country === "NG", "Work from home = remote + open to the country");
const local = params(jobsUrl("GH", S({ kind: "local" })));
ok(local.located === "GH" && !("country" in local), "In Ghana = located in Ghana");
ok(params(jobsUrl("GH", S({ q: "  data & AI  " }))).q === "data & AI", "search words trimmed and encoded");
ok(!("q" in params(jobsUrl("GH", S({ q: "   " })))), "blank search sends no q");
ok(params(jobsUrl("GH", S({ q: "x".repeat(300) }))).q.length === 200, "search capped at 200 characters (API limit)");
const filtered = params(jobsUrl("GH", S({ fields: ["tech", "data"], types: ["contract"], levels: ["entry"], pay: true, posted: "week", page: 3 })));
ok(filtered.field === "tech,data" && filtered.job_type === "contract" && filtered.level === "entry" && filtered.pay === "true"
  && filtered.posted === "week" && filtered.page === "3", "filters and page number go to the API");
ok(!("page" in params(jobsUrl("GH", S({ page: 1 })))), "page 1 sends no page");
ok(params(jobsUrl("GH", S({ skills: ["python", "french"] }))).skill === "python,french", "skills go to the API");
ok(params(jobsUrl("GH", S({}), 20, true)).facets === "true" && !("facets" in params(jobsUrl("GH", S({})))), "skill counts only when asked");
ok(jobsUrl("GH", S({})).startsWith("/api/careers/v1/jobs?"), "same-site API address");

// --- the page address keeps the reader's choices (Back button, shared links)
const round = S({ kind: "remote", q: "nurse", fields: ["support"], skills: ["health", "french"], types: ["part_time"], levels: ["senior"], pay: true, posted: "day", page: 4 });
ok(JSON.stringify(readState(writeState(round))) === JSON.stringify(round), "address round-trips every choice");
ok(JSON.stringify(readState(new URLSearchParams("skill=python,plumbing,python")).skills) === '["python"]', "unknown skills dropped from the address");
ok(writeState(EMPTY_STATE).toString() === "", "no choices = plain address");
const junk = readState(new URLSearchParams("kind=evil&field=tech,plumbing,tech&type=gig&level=senior&posted=year&page=-2&pay=yes"));
ok(junk.kind === "all" && JSON.stringify(junk.fields) === '["tech"]' && junk.types.length === 0 && junk.levels[0] === "senior"
  && junk.posted === null && junk.page === 1 && junk.pay === false, "unknown address values are dropped");
ok(readState(new URLSearchParams("page=999")).page === 1, "page beyond the API limit falls back to 1");
ok(filterCount(round) === 7 && filterCount(EMPTY_STATE) === 0, "filter count for the Filters button (skills included)");

// --- skills: same list as the API, busiest first, chosen ones never vanish
const apiSkills = [...readFileSync("careers-service/app/main.py", "utf8").matchAll(/^    "([a-z_]+)": r"/gm)].map((m) => m[1]);
ok(JSON.stringify(apiSkills) === JSON.stringify(Object.keys(SKILLS)), "skills match careers-service SKILLS, same order");
const ranked = rankedSkills({ python: 3, sales: 40, french: 0, ai_training: 40 }, ["french"]);
ok(ranked.join(" ") === "ai_training sales python french", "ranked by jobs; ties keep list order; empty skills hidden unless chosen");
ok(rankedSkills(null).length === Object.keys(SKILLS).length, "no counts yet: every skill");
ok(skillLabel("ai_training") === "AI training" && skillLabel("nope") === null, "skill labels");

// --- page buttons fit a phone (at most 7)
const items = (c: number, n: number) => pageItems(c, n).join(" ");
ok(items(1, 5) === "1 2 3 4 5", "few pages: all shown");
ok(items(1, 45) === "1 2 3 4 … 45", "first page");
ok(items(10, 45) === "1 … 9 10 11 … 45", "middle page");
ok(items(45, 45) === "1 … 42 43 44 45", "last page");
ok(items(4, 45) === "1 … 3 4 5 … 45" && items(3, 45) === "1 2 3 4 … 45", "near the start");
ok([1, 2, 3, 10, 43, 44, 45].every((c) => pageItems(c, 45).length <= 7), "never more than 7 buttons");

// --- display helpers
const now = new Date("2026-11-07T12:00:00Z");
ok(postedAgo("2026-11-07T08:00:00Z", now) === "today", "posted today");
ok(postedAgo("2026-11-06T08:00:00Z", now) === "yesterday", "posted yesterday");
ok(postedAgo("2026-11-02T12:00:00Z", now) === "5 days ago", "posted 5 days ago");
ok(postedAgo("2026-10-17T12:00:00Z", now) === "3 weeks ago", "posted 3 weeks ago");
ok(postedAgo("2026-09-01T12:00:00Z", now) === "2 months ago", "posted 2 months ago");
ok(postedAgo(null, now) === "" && postedAgo("nonsense", now) === "", "unknown date shows nothing");
ok(isNew("2026-11-06T13:00:00Z", now) && !isNew("2026-11-05T11:00:00Z", now) && !isNew(null, now), "New badge for the last 2 days");
ok(openToText(["GH", "NG"]) === "Ghana and Nigeria" && openToText(["NG"]) === "Nigeria" && openToText(["KE"]) === "", "open-to text");
ok(workModeLabel("remote") === "Work from home" && workModeLabel("onsite") === "At the office" && workModeLabel("unknown") === null, "work mode words");
ok(jobTypeLabel({ job_type: "full_time", employment_type: "FullTime" }) === "Full-time", "job type in plain words");
ok(jobTypeLabel({ job_type: null, employment_type: "Seasonal" }) === "Seasonal" && jobTypeLabel({ job_type: null, employment_type: "Remote" }) === null, "unknown job type: source's words, never 'Remote'");
ok(evidenceText("listed: Ghana") === "The job says: “Ghana”." && evidenceText("source: open worldwide") === "The job site marks it as open worldwide."
  && evidenceText(undefined) === null, "why it is open, in plain words");
ok(shortDate("2027-01-07T00:00:00Z") === "7 Jan 2027" && shortDate(null) === "", "short date");
ok(safeLink("https://jobs.example/1") === "https://jobs.example/1", "https link kept");
ok(safeLink("http://jobs.example/1") === null && safeLink("javascript:alert(1)") === null && safeLink(null) === null, "non-https links refused");

// --- the assistant button rule points at the real button
ok(readFileSync("src/components/ai/AIChatInterface.tsx", "utf8").includes(`aria-label="Open AI Chat"`)
  && ASSISTANT_SELECTOR === 'button[aria-label="Open AI Chat"]', "assistant button selector matches AIChatInterface");

// --- SEO isolation of the launched board (D-023, D-025): /careers, noindex, not in the sitemap
if (CAREERS_LAUNCHED) {
  ok(CAREERS_BASE === "/careers" && CAREERS_ROUTE === "careers", "board lives at /careers");
  ok(CAREERS_NOINDEX === (CAREERS_INDEXED ? false : true), "noindex until the owner decides to index it");
  const sitemap = readFileSync("scripts/generate-sitemap.mjs", "utf8");
  if (!CAREERS_INDEXED) ok(/EXCLUDE_PREFIX = \[[^\]]*"careers"/.test(sitemap), "sitemap skips careers while it is noindex");
  ok(/EXCLUDE_PREFIX = \[[^\]]*"tools-preview"\]/.test(sitemap), "tools-preview stays last in EXCLUDE_PREFIX");
  const vite = readFileSync("vite.config.ts", "utf8");
  ok(!/const skip = \[[^\]]*"careers"/.test(vite), "careers is prerendered (no #418 shell)");
  const board = readFileSync("src/pages/careers/CareersBoard.tsx", "utf8");
  ok(/mounted \? readState\(params\) : EMPTY_STATE/.test(board), "first render ignores the address (matches the prerendered shell)");
  ok(/noindexFollow/.test(board), "links stay followed (Remote OK terms): noindex, follow");
}

// --- SEO isolation of the preview (D-023, D-025)
if (!CAREERS_LAUNCHED) {
  ok(CAREERS_BASE === "/tools-preview/careers" && CAREERS_ROUTE === "tools-preview/careers", "preview lives under /tools-preview/");
  ok(CAREERS_NOINDEX === true, "preview is noindex");
  const vite = readFileSync("vite.config.ts", "utf8");
  ok(/const skip = \[[^\]]*"tools-preview"/.test(vite), "vite.config skips tools-preview (not prerendered)");
  const sitemap = readFileSync("scripts/generate-sitemap.mjs", "utf8");
  ok(/EXCLUDE_PREFIX = \[[^\]]*"tools-preview"/.test(sitemap), "sitemap skips tools-preview");
  // Nothing on the site links to the preview: no href/to/url to it, and no use of CAREERS_BASE
  // in a link outside the board itself (comments that name the address are fine).
  const LINK = /(href|to|url|link)\s*[:=]\s*\{?\s*["'`][^"'`]*tools-preview\/careers|(href|to)=\{\s*CAREERS_BASE/;
  const mentions = (readdirSync("src", { recursive: true }) as string[])
    .map((f) => f.replace(/\\/g, "/"))
    .filter((f) => /\.(tsx?|json)$/.test(f) && f !== "lib/careers.ts" && f !== "pages/careers/CareersBoard.tsx")
    .filter((f) => LINK.test(readFileSync(`src/${f}`, "utf8")));
  ok(mentions.length === 0, `no page links the preview${mentions.length ? ` (found in ${mentions.join(", ")})` : ""}`);
}

console.log(failed ? `\n${failed} FAILED` : "\nall careers checks passed");
process.exit(failed ? 1 : 0);
