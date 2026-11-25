// Build-time sitemap generator (postbuild).
//
// Walks the prerendered `dist/` output and emits dist/sitemap.xml listing every
// real static (crawlable) page — homepage, static pages, all tools, all blog
// articles, and the prerendered (Africa Tech) news. Because it reads the actual
// build output, the sitemap can never list a page that wasn't prerendered
// (no blank-to-crawler URLs) and auto-updates as articles are added/removed.
//
// Wired via package.json: "build": "vite-react-ssg build && node scripts/generate-sitemap.mjs"

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SITE = "https://techtrendi.com";
const DIST = "dist";

// True "last changed" dates (16 Nov 2026). Every URL used to say it changed on the build day
// (the file's build time), so Search Console saw 1,082 pages "modified today", every day, and
// the dates told Google nothing. Articles and news now use their own updated_at from the
// database. Other pages get NO lastmod rather than a made-up one. If the database can't be
// reached, article dates are simply left out; the sitemap is still written.
function envValue(name) {
  if (process.env[name]) return process.env[name];
  if (existsSync(".env")) {
    const m = readFileSync(".env", "utf8").match(new RegExp(`^${name}=["']?([^"'\\r\\n]+)`, "m"));
    if (m) return m[1];
  }
  return "";
}

async function articleDates() {
  const url = envValue("VITE_SUPABASE_URL") || "https://db2.techtrendi.com";
  const key = envValue("VITE_SUPABASE_PUBLISHABLE_KEY");
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "User-Agent": "Mozilla/5.0 (compatible; TechTrendiSSG/1.0; +https://techtrendi.com) AppleWebKit/537.36",
  };
  const dates = new Map();
  for (const [table, prefix] of [["articles", "blog"], ["news", "news"]]) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=slug,updated_at,created_at&is_published=eq.true&limit=5000`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      for (const r of await res.json()) {
        const d = String(r.updated_at || r.created_at || "").slice(0, 10);
        if (r.slug && /^\d{4}-\d{2}-\d{2}$/.test(d)) dates.set(`${prefix}/${r.slug}`, d);
      }
    } catch (e) {
      console.warn(`[sitemap] could not read ${table} dates (${e.message}); leaving their lastmod out`);
    }
  }
  return dates;
}
const DATES = await articleDates();

// Pages that exist as .html but should NOT be advertised to crawlers.
// "data-bundles": the bare address is a 301 to /data-bundles/ghana, never a page of its own.
const EXCLUDE_EXACT = new Set(["404", "200", "offline", "design-demo", "reading-list", "tools-preview", "rundown-preview", "data-bundles"]);
// "sponsored": paid ad pages (src/data/sponsors.ts) are noindex, so never listed.
// "careers": the jobs board is noindex until CAREERS_INDEXED (src/lib/careers.ts; D-025).
// Keep "tools-preview" last (checked by the data bundles launch test L4).
const EXCLUDE_PREFIX = ["admin", "auth", "profile", "dashboard", "arcade", "sponsored", "careers", "tools-preview"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

// dist/about.html -> "about" ; dist/blog/foo.html -> "blog/foo" ; dist/index.html -> ""
function toPath(file) {
  let rel = relative(DIST, file).split(sep).join("/");
  rel = rel.replace(/\.html$/, "");
  rel = rel.replace(/\/index$/, "");
  if (rel === "index") rel = "";
  return rel;
}

function meta(path) {
  if (path === "") return { priority: "1.0", freq: "daily" };
  const seg = path.split("/")[0];
  if (path.startsWith("news/")) return { priority: "0.7", freq: "weekly" };
  if (path.startsWith("blog/")) return { priority: "0.7", freq: "monthly" };
  if (path.startsWith("tools/")) return { priority: "0.6", freq: "monthly" };
  // Ghana data bundles: prices re-checked every 3 hours (launch L4).
  if (path === "data-bundles" || path.startsWith("data-bundles/")) return { priority: "0.8", freq: "daily" };
  if (path.startsWith("broadband/")) return { priority: "0.8", freq: "weekly" };
  // section landing pages
  if (["blog", "news", "tools", "security", "store", "guides"].includes(path))
    return { priority: "0.8", freq: "weekly" };
  return { priority: "0.5", freq: "monthly" };
}

const files = walk(DIST);
const seen = new Set();
const urls = [];

for (const file of files) {
  const path = toPath(file);
  const seg = path.split("/")[0];
  if (EXCLUDE_EXACT.has(path)) continue;
  if (EXCLUDE_PREFIX.includes(seg)) continue;
  // Ei Tech! single-meme pages are noindex (EiTechMemePage.tsx); only the /ei-tech list is listed.
  if (path.startsWith("ei-tech/")) continue;
  if (seen.has(path)) continue;
  seen.add(path);
  const lastmod = DATES.get(path) || "";
  const { priority, freq } = meta(path);
  const loc = path === "" ? `${SITE}/` : `${SITE}/${path}`;
  urls.push({ loc, lastmod, priority, freq });
}

// Stable, readable order: homepage, static, sections, tools, blog, news.
const rank = (u) => {
  const p = u.loc.replace(SITE, "").replace(/^\//, "");
  if (p === "") return 0;
  if (p.startsWith("tools/")) return 3;
  if (p.startsWith("blog/")) return 4;
  if (p.startsWith("news/")) return 5;
  return p.includes("/") ? 2 : 1;
};
urls.sort((a, b) => rank(a) - rank(b) || a.loc.localeCompare(b.loc));

const body = urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n` + (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : "") +
      `    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

const counts = urls.reduce((a, u) => {
  const p = u.loc.replace(SITE, "").replace(/^\//, "");
  const k = p === "" ? "home" : p.startsWith("blog/") ? "blog" : p.startsWith("news/") ? "news" : p.startsWith("tools/") ? "tools" : "static";
  a[k] = (a[k] || 0) + 1;
  return a;
}, {});

// Last line of defence before deploy. If the prerender produced far fewer
// article pages than normal, this build is incomplete: deploying it would
// delete the missing pages from the live site (the server mirrors dist with
// rsync --delete). Exit non-zero so the Deploy workflow stops here. Floors are
// well below today's counts (blog 343, news 594 on 17 Oct 2026) so ordinary
// deletions never trip them. src/ssg/news-data.ts applies the same floors.
const FLOORS = { blog: 100, news: 200 };
const short = Object.entries(FLOORS).filter(([k, min]) => (counts[k] || 0) < min);
if (short.length) {
  console.error(
    `[sitemap] REFUSING: only ${short.map(([k]) => `${counts[k] || 0} ${k}`).join(", ")} pages were built ` +
      `(minimums ${short.map(([k, m]) => `${k} ${m}`).join(", ")}). The build is incomplete; not writing ` +
      `sitemap.xml and failing so it is never deployed.`,
    counts
  );
  process.exit(1);
}

writeFileSync(join(DIST, "sitemap.xml"), xml, "utf-8");
console.log(`[sitemap] wrote dist/sitemap.xml with ${urls.length} URLs`, counts);
