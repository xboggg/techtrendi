// Build-time sitemap generator (postbuild).
//
// Walks the prerendered `dist/` output and emits dist/sitemap.xml listing every
// real static (crawlable) page — homepage, static pages, all tools, all blog
// articles, and the prerendered (Africa Tech) news. Because it reads the actual
// build output, the sitemap can never list a page that wasn't prerendered
// (no blank-to-crawler URLs) and auto-updates as articles are added/removed.
//
// Wired via package.json: "build": "vite-react-ssg build && node scripts/generate-sitemap.mjs"

import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SITE = "https://techtrendi.com";
const DIST = "dist";

// Pages that exist as .html but should NOT be advertised to crawlers.
const EXCLUDE_EXACT = new Set(["404", "200", "offline", "design-demo", "reading-list", "tools-preview"]);
const EXCLUDE_PREFIX = ["admin", "auth", "profile", "dashboard", "arcade"];

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
  if (seen.has(path)) continue;
  seen.add(path);
  const lastmod = statSync(file).mtime.toISOString().slice(0, 10);
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
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n` +
      `    <changefreq>${u.freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync(join(DIST, "sitemap.xml"), xml, "utf-8");

const counts = urls.reduce((a, u) => {
  const p = u.loc.replace(SITE, "").replace(/^\//, "");
  const k = p === "" ? "home" : p.startsWith("blog/") ? "blog" : p.startsWith("news/") ? "news" : p.startsWith("tools/") ? "tools" : "static";
  a[k] = (a[k] || 0) + 1;
  return a;
}, {});
console.log(`[sitemap] wrote dist/sitemap.xml with ${urls.length} URLs`, counts);
