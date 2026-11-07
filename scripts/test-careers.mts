// Careers jobs board: request building, display helpers, and the preview's SEO isolation.
// Imports the real modules, so it cannot pass while the shipped code is broken.
//
// Run: npx tsx scripts/test-careers.mts
import { readdirSync, readFileSync } from "node:fs";
import {
  CAREERS_BASE, CAREERS_LAUNCHED, CAREERS_NOINDEX, CAREERS_ROUTE, jobsUrl, openToText, postedAgo, safeLink, workModeLabel,
} from "../src/lib/careers";

let failed = 0;
const ok = (cond: unknown, what: string) => {
  if (cond) console.log(`ok   ${what}`);
  else { failed++; console.log(`FAIL ${what}`); }
};
const params = (url: string) => Object.fromEntries(new URL(url, "https://techtrendi.com").searchParams);

// --- requests: what each tab asks the API for
ok(JSON.stringify(params(jobsUrl({ country: "GH", kind: "all" }))) === JSON.stringify({ country: "GH", limit: "20" }), "All jobs = open to the reader's country");
ok(params(jobsUrl({ country: "NG", kind: "remote" })).work_mode === "remote" && params(jobsUrl({ country: "NG", kind: "remote" })).country === "NG", "Work from home = remote + open to the country");
const local = params(jobsUrl({ country: "GH", kind: "local" }));
ok(local.located === "GH" && !("country" in local), "In Ghana = located in Ghana");
ok(params(jobsUrl({ country: "GH", kind: "all", q: "  data & AI  " })).q === "data & AI", "search words trimmed and encoded");
ok(!("q" in params(jobsUrl({ country: "GH", kind: "all", q: "   " }))), "blank search sends no q");
ok(params(jobsUrl({ country: "GH", kind: "all", q: "x".repeat(300) })).q.length === 200, "search capped at 200 characters (API limit)");
ok(params(jobsUrl({ country: "GH", kind: "all", cursor: "abc" })).cursor === "abc", "next page sends the cursor");
ok(jobsUrl({ country: "GH", kind: "all" }).startsWith("/api/careers/v1/jobs?"), "same-site API address");

// --- display helpers
const now = new Date("2026-11-07T12:00:00Z");
ok(postedAgo("2026-11-07T08:00:00Z", now) === "today", "posted today");
ok(postedAgo("2026-11-06T08:00:00Z", now) === "yesterday", "posted yesterday");
ok(postedAgo("2026-11-02T12:00:00Z", now) === "5 days ago", "posted 5 days ago");
ok(postedAgo("2026-10-17T12:00:00Z", now) === "3 weeks ago", "posted 3 weeks ago");
ok(postedAgo("2026-09-01T12:00:00Z", now) === "2 months ago", "posted 2 months ago");
ok(postedAgo(null, now) === "" && postedAgo("nonsense", now) === "", "unknown date shows nothing");
ok(openToText(["GH", "NG"]) === "Ghana and Nigeria" && openToText(["NG"]) === "Nigeria" && openToText(["KE"]) === "", "open-to text");
ok(workModeLabel("onsite") === "On-site" && workModeLabel("unknown") === null, "work mode words");
ok(safeLink("https://jobs.example/1") === "https://jobs.example/1", "https link kept");
ok(safeLink("http://jobs.example/1") === null && safeLink("javascript:alert(1)") === null && safeLink(null) === null, "non-https links refused");

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
