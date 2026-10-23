// Verify the SSG route filter excludes internal pages WITHOUT dropping real
// articles whose slugs happen to contain one of those words.
//
// A substring filter silently excluded 5 published articles from the build:
// "auth" matched inside "authentication", "dashboard" matched inside Paystack
// story slugs. They were never written to dist/, so Google could not index
// them. This test fails if that regression returns.
//
// Run: node scripts/test-included-routes.mjs
import { readFileSync } from "node:fs";

// Pull the real filter out of vite.config.ts so the test cannot drift from
// the shipped implementation.
const cfg = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
const skipLine = cfg.match(/const skip = \[([^\]]+)\]/);
if (!skipLine) {
  console.error("FAIL: could not find the skip list in vite.config.ts");
  process.exit(1);
}
const skip = skipLine[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));

const usesFirstSegment = /\.split\("\/"\)\[0\]/.test(cfg) && /skip\.includes\(/.test(cfg);
if (!usesFirstSegment) {
  console.error("FAIL: includedRoutes is not matching on the first path segment.");
  console.error("      A substring match here silently drops real articles.");
  process.exit(1);
}

// Mirror of the shipped filter.
const included = (paths) =>
  paths.filter((p) => {
    if (p.includes(":")) return false;
    const firstSegment = p.replace(/^\//, "").split("/")[0];
    return !skip.includes(firstSegment);
  });

// Real published slugs that were wrongly dropped (verified in the DB).
const mustRender = [
  "blog/two-factor-authentication-methods-ranked-weakest-to-strongest",
  "blog/complete-two-factor-authentication-setup-guide",
  "news/nigeria-nimc-act-2026-digital-identity-authority",
  "news/paystack-dashboard-rebuild-ai-command-centre-2026",
  "news/paystack-launches-ai-dashboard-redesign-after-10-years",
  "blog/iphone-status-symbol-psychology",
  "news/ghana-2000-transformers-electricity-access-89-percent",
  "tools/ghana-tax-calculator",
  "blog",
  "news",
  "security",
];

// Internal routes that must stay out of the build.
const mustSkip = [
  "admin",
  "admin/news",
  "admin/whatsapp-queue",
  "admin/data-deals",
  "auth",
  "profile",
  "dashboard",
  "arcade",
  "design-demo",
  "tools-preview",
  "rundown-preview",
  "blog/:slug",
];

const rendered = new Set(included([...mustRender, ...mustSkip]));

let failures = 0;
console.log("--- must be rendered ---");
for (const p of mustRender) {
  const ok = rendered.has(p);
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${p}`);
}

console.log("\n--- must be skipped ---");
for (const p of mustSkip) {
  const ok = !rendered.has(p);
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${p}`);
}

console.log(`\nfailures: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
