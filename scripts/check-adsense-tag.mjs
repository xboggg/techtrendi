// Deploy guard for AdSense. vite.config.ts drops the AdSense tag from every build that
// is not the live deploy (TECHTRENDI_LIVE=1), so Lovable previews stop sending page
// views to AdSense. If the deploy build ever lost the tag (the variable renamed or
// missing), the live site would quietly stop earning. This fails the deploy instead:
// the server keeps the last good build. Run in deploy.yml right after Build.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const TAG = /<script\b[^>]*\bsrc="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-3437377907350211"[^>]*><\/script>/;
// Pages that never carry the tag: Google's site-ownership file, the offline page,
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

const missing = pages.filter((p) => !NO_TAG(p) && !TAG.test(readFileSync(join(DIST, p), "utf8")));
const withTag = pages.filter((p) => !NO_TAG(p)).length - missing.length;

if (!pages.includes("index.html") || missing.length) {
  console.error(`[adsense] REFUSING to deploy: ${missing.length} page(s) lost the AdSense tag, e.g.`, missing.slice(0, 5));
  console.error("[adsense] Is TECHTRENDI_LIVE=1 set on the Build step in deploy.yml? See vite.config.ts.");
  process.exit(1);
}
console.log(`[adsense] OK: ${withTag} pages carry the AdSense tag.`);
