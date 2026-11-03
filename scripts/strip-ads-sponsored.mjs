// Paid sponsor pages (/sponsored/*) must not carry Google ads: another business's
// ad page is not ours to monetise, and it keeps AdSense away from its pictures/claims.
// After the build, remove the AdSense <script> tag from dist/sponsored/*.html only.
// Every other page keeps the tag from index.html untouched. In the browser,
// src/components/ads/AdsenseRestore.tsx adds the tag back when a visitor moves on
// to a normal page, and reloads a sponsor page reached while the tag was loaded.
// Wired via package.json "build" (last step). Never fails the build: it logs instead.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join("dist", "sponsored");
// The build may print `async` or `async=""`; match the AdSense loader tag either way.
const TAG = /<script\b[^>]*\bsrc="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^"]*"[^>]*><\/script>/g;

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
