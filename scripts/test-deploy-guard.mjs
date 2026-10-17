// Proves the deploy guard is still in place. Runs in CI BEFORE the build, so
// anyone who removes or weakens the guard gets a failed deploy, not a live
// site with its article pages deleted.
//
// Background (DOCS/DEPLOY_SAFETY.md): the server installs each build with
// `rsync -a --delete`, so whatever is missing from dist is deleted from the
// live site. Until 2026-10-17 an unreachable database made the build succeed
// with zero articles. Two guards now stop that; this test checks both.
//
// Run: node scripts/test-deploy-guard.mjs
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${!ok && detail ? `\n      ${detail}` : ""}`);
  if (!ok) failures++;
};

// ---------------------------------------------------------------------------
// 1. Behaviour of the real sitemap step, run against fake builds.
// ---------------------------------------------------------------------------
// Paths can be overridden so the test itself can be tested against broken copies.
const SITEMAP = process.env.GUARD_SITEMAP_PATH || join(ROOT, "scripts", "generate-sitemap.mjs");

function runSitemapOn({ blog, news }) {
  const dir = mkdtempSync(join(tmpdir(), "deploy-guard-"));
  try {
    mkdirSync(join(dir, "scripts"));
    cpSync(SITEMAP, join(dir, "scripts", "generate-sitemap.mjs"));
    mkdirSync(join(dir, "dist", "blog"), { recursive: true });
    mkdirSync(join(dir, "dist", "news"), { recursive: true });
    writeFileSync(join(dir, "dist", "index.html"), "<html></html>");
    for (let i = 0; i < blog; i++) writeFileSync(join(dir, "dist", "blog", `b${i}.html`), "<html></html>");
    for (let i = 0; i < news; i++) writeFileSync(join(dir, "dist", "news", `n${i}.html`), "<html></html>");
    let code = 0;
    let output = "";
    try {
      output = execFileSync(process.execPath, ["scripts/generate-sitemap.mjs"], { cwd: dir, encoding: "utf8", stdio: "pipe" });
    } catch (e) {
      code = e.status ?? 1;
      output = `${e.stdout ?? ""}${e.stderr ?? ""}`;
    }
    return { code, output, wroteSitemap: existsSync(join(dir, "dist", "sitemap.xml")) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const empty = runSitemapOn({ blog: 0, news: 0 });
check(empty.code !== 0, "sitemap step FAILS a build with no blog or news pages", `exit ${empty.code}: ${empty.output.trim()}`);
check(!empty.wroteSitemap, "sitemap step does not write sitemap.xml for an empty build");
check(/REFUSING/.test(empty.output), "sitemap step explains why it refused", empty.output.trim());

const thin = runSitemapOn({ blog: 99, news: 199 });
check(thin.code !== 0, "sitemap step FAILS a build just under the floors (99 blog, 199 news)", `exit ${thin.code}`);

const normal = runSitemapOn({ blog: 100, news: 200 });
check(normal.code === 0, "sitemap step PASSES a build at the floors (100 blog, 200 news)", `exit ${normal.code}: ${normal.output.trim()}`);
check(normal.wroteSitemap, "sitemap step writes sitemap.xml for a normal build");

// ---------------------------------------------------------------------------
// 2. The article fetch must fail loudly, never return an empty list.
//    (It needs the Vite build environment to execute, so it is checked by
//    source here; the real failure path was proven by an actual build with
//    an unreachable database on 2026-10-17, see DOCS/DEPLOY_SAFETY.md.)
// ---------------------------------------------------------------------------
// Normalise line endings: a Windows checkout has CRLF, CI has LF. Without this
// the function was not found on Windows and the checks below passed vacuously.
const src = readFileSync(process.env.GUARD_NEWS_DATA_PATH || join(ROOT, "src", "ssg", "news-data.ts"), "utf8").replace(/\r\n/g, "\n");
const fn = src.match(/async function sbFetch[\s\S]*?\n}\n/);
check(Boolean(fn), "news-data.ts still defines sbFetch");
if (!fn) {
  console.log("\nCannot inspect sbFetch, so the remaining checks would be meaningless. Failing.");
  process.exit(1);
}
const body = fn[0];
check(/throw new Error\(/.test(body), "sbFetch throws when the database cannot be reached");
check(!/return \[\]/.test(body), "sbFetch never returns an empty list on failure", "found `return []` inside sbFetch");
check(!/catch\s*\{\s*return/.test(body), "sbFetch does not swallow errors in a catch block");

const min = (name) => Number((src.match(new RegExp(`const ${name} = (\\d+)`)) || [])[1]);
check(min("MIN_NEWS") >= 200, `MIN_NEWS is at least 200 (is ${min("MIN_NEWS")})`);
check(min("MIN_BLOG") >= 100, `MIN_BLOG is at least 100 (is ${min("MIN_BLOG")})`);
check(/newsCache = requireAtLeast\(/.test(src), "news articles must meet MIN_NEWS");
check(/blogCache = requireAtLeast\(/.test(src), "blog articles must meet MIN_BLOG");

const sm = readFileSync(SITEMAP, "utf8").replace(/\r\n/g, "\n");
const floors = sm.match(/const FLOORS = \{ blog: (\d+), news: (\d+) \}/);
check(Boolean(floors) && Number(floors[1]) >= 100 && Number(floors[2]) >= 200,
  "generate-sitemap.mjs floors are at least blog 100, news 200", floors ? floors[0] : "FLOORS not found");

console.log(`\nfailures: ${failures}`);
if (failures) {
  console.log("The deploy guard has been removed or weakened. Read DOCS/DEPLOY_SAFETY.md before changing it.");
}
process.exit(failures ? 1 : 0);
