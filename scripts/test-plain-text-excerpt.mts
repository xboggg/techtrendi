// Verify plainTextExcerpt against the real post bodies that were showing a
// raw "#" in card previews. Imports the actual module — no reconstruction, so
// the test cannot pass while the shipped code is broken.
//
// Run: npx tsx scripts/test-plain-text-excerpt.mts
import { plainTextExcerpt } from "../src/lib/plainTextExcerpt";

// Verbatim openings pulled from techtrendi.creepy_tech_posts on 2026-10-10.
// 21 of 130 creepy_tech and 13 of 136 cyber_awareness posts start like this.
const realPosts = [
  "# YOUR FACE ISN'T PRIVATE ANYMORE.\n\nAI reverse image search just got terrifying. Companies like Google, Meta, and startups you've never heard of can now match a single photo of your face to your name.",
  "# Your Phone Is Draining Faster Than You Think\n\nYour battery dies 40% faster than it should? Here's why nobody talks about it.\n\nApps run in the background constantly.",
  "# Your Loyalty Card is Literally Tracking Your Life\n\nEvery swipe of that grocery card isn't just saving you $2.\n\nIt's a detailed map of your health, finances and habits.",
];

const markdownCases = [
  "## The Helpful Tech Support Blur\n\n**Bold text** and a [link](https://example.com) and `code`.",
  "- A bullet opener\n- second item",
  "1. A numbered opener\n2. second item",
  "> A quoted opener that should lose its marker.",
  "![alt text](img.png) then real content follows here.",
  "~~struck~~ and _italic_ and __bold__ text.",
  "<p>Some <strong>HTML</strong> mixed in</p>",
  "Text with &amp; and &nbsp; entities.",
  "```\ncode fence contents\n```\nReal text after the fence.",
  "Normal text with no markdown at all, which should pass straight through.",
];

let failures = 0;

function check(label: string, input: string | null | undefined, expectEmpty = false) {
  const out = plainTextExcerpt(input, 90);
  // A clean teaser must not start with a markdown marker or retain emphasis,
  // link syntax, HTML tags or leading whitespace.
  const dirty =
    /^[#>*\-+]|\*\*|__|~~|\[[^\]]*\]\(|<[a-z/]|&(amp|nbsp|lt|gt|quot|#39);|^\s/.test(out);
  const ok = expectEmpty ? out === "" : !dirty && out.length > 0;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label.padEnd(18)} ${JSON.stringify(out)}`);
}

console.log("--- real post bodies (from the database) ---");
realPosts.forEach((p, i) => check(`real #${i + 1}`, p));

console.log("\n--- markdown / html forms ---");
markdownCases.forEach((p, i) => check(`case #${i + 1}`, p));

console.log("\n--- edge cases (must return empty, not crash) ---");
([null, undefined, "", "   ", "#", "###   "] as const).forEach((e, i) =>
  check(`edge #${i + 1}`, e, true),
);

console.log("\n--- truncation ---");
const long = "word ".repeat(200);
const truncated = plainTextExcerpt(long, 50);
const truncOk = truncated.length <= 51 && truncated.endsWith("…");
if (!truncOk) failures++;
console.log(`${truncOk ? "ok  " : "FAIL"} length ${truncated.length}, ends with ellipsis: ${truncated.endsWith("…")}`);

console.log(`\nfailures: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
