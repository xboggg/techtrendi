// Deploy guard for AdSense. vite.config.ts drops the AdSense backup loader from every
// build that is not the live deploy (TECHTRENDI_LIVE=1), so Lovable previews stop sending
// page views to AdSense. If the deploy build ever lost it (the variable renamed or
// missing), or lost Google's site-ownership meta tag, the live site could quietly stop
// earning. This fails the deploy instead: the server keeps the last good build.
// Run in deploy.yml right after Build.
// Since 5 Nov 2026 the AdSense script itself is added after the page starts
// (src/components/ads/AdsenseRestore.tsx); the HTML carries the meta tag + backup loader.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const LOADER = /<script\b[^>]*\bdata-adsense-loader\b[^>]*>[\s\S]*?pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-3437377907350211[\s\S]*?<\/script>/;
const META = /<meta\b[^>]*name="google-adsense-account"[^>]*content="ca-pub-3437377907350211"/;
// Pages that never carry the loader: Google's site-ownership file, the offline page,
// and paid sponsor pages (scripts/strip-ads-sponsored.mjs).
const NO_TAG = (p) => /^google[0-9a-f]+\.html$/.test(p) || p === "offline.html" || p.startsWith("sponsored/");

const pages = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const f = join(dir, name);
    if (statSync(f).isDirectory()) walk(f);
    else if (name.endsWith(".html")) pages.push(relative(DIST, f).split("\\").join("/"));
  }
};
walk(DIST);

const missing = pages.filter((p) => {
  if (NO_TAG(p)) return false;
  const html = readFileSync(join(DIST, p), "utf8");
  return !LOADER.test(html) || !META.test(html);
});
const withTag = pages.filter((p) => !NO_TAG(p)).length - missing.length;

if (!pages.includes("index.html") || missing.length) {
  console.error(`[adsense] REFUSING to deploy: ${missing.length} page(s) lost the AdSense loader or meta tag, e.g.`, missing.slice(0, 5));
  console.error("[adsense] Is TECHTRENDI_LIVE=1 set on the Build step in deploy.yml? See vite.config.ts.");
  process.exit(1);
}
console.log(`[adsense] OK: ${withTag} pages carry the AdSense loader and meta tag.`);
