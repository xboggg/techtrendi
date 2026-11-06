// Paid sponsor pages (/sponsored/*) must not carry Google ads: another business's
// ad page is not ours to monetise, and it keeps AdSense away from its pictures/claims.
// After the build, remove the AdSense backup loader (index.html <script data-adsense-loader>)
// from dist/sponsored/*.html only. Every other page keeps it untouched. In the browser,
// src/components/ads/AdsenseRestore.tsx adds the AdSense script on normal pages only
// (once the page has started), and reloads a sponsor page reached while it was loaded.
// Wired via package.json "build" (last step). Never fails the build: it logs instead.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join("dist", "sponsored");
// The build may print `data-adsense-loader` or `data-adsense-loader=""`; match either way.
// Also matches an old-style <script src=".../adsbygoogle.js"> tag, should one come back.
const TAG = /<script\b[^>]*\bdata-adsense-loader\b[^>]*>[\s\S]*?<\/script>|<script\b[^>]*\bsrc="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^"]*"[^>]*><\/script>/g;

try {
  if (!existsSync(DIR)) {
    console.log("[strip-ads-sponsored] no dist/sponsored folder, nothing to do.");
  } else {
    for (const name of readdirSync(DIR).filter((f) => f.endsWith(".html"))) {
      const file = join(DIR, name);
      const html = readFileSync(file, "utf8");
      const found = html.match(TAG)?.length ?? 0;
      if (found === 0) {
        console.log(`[strip-ads-sponsored] WARNING ${file}: no AdSense tag found (left as is).`);
        continue;
      }
      writeFileSync(file, html.replace(TAG, ""));
      console.log(`[strip-ads-sponsored] ${file}: removed ${found} AdSense tag(s).`);
    }
  }
} catch (e) {
  console.log(`[strip-ads-sponsored] WARNING: ${e instanceof Error ? e.message : e}`);
}
