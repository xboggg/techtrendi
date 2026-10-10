// Verify postBodyToText against the real post bodies that rendered as raw
// tags on /cyber-awareness. Imports the actual module, so the test cannot
// pass while the shipped code is broken.
//
// Run: npx tsx scripts/test-post-body-text.mts
import { postBodyToText } from "../src/lib/renderPostBody";

// Verbatim from techtrendi.cyber_awareness_posts, 2026-10-11. These are the
// cards visible in the bug report screenshot.
const realHtmlPosts = [
  `<p><strong>You get a MoMo credit alert. Someone sent you money you weren't expecting. Seconds later your phone rings — a panicked stranger says they sent it to the wrong number by mistake and begs you to send it back.</strong></p><p>Here is what you never see: the first alert is fake.</p>`,
  `<p><strong>Your phone loses signal for no obvious reason. You assume it's network. Hours later you discover your MoMo wallet and bank account have been completely emptied — while your SIM was dead.</strong></p><p>SIM-swapping is methodical.</p>`,
  `<p><strong>Your phone buzzes. 'Your account has been temporarily blocked due to suspicious activity.'</strong></p><p>The person who answers sounds completely professional.</p>`,
];

const markdownPosts = [
  "# Your Phone Is Draining Faster Than You Think\n\nYour battery dies 40% faster than it should?",
  "## The Helpful Tech Support Blur\n\n**Bold** and a [link](https://example.com).",
];

const structural = [
  { label: "lists", input: "<ul><li>First item</li><li>Second item</li></ul>" },
  { label: "br tags", input: "Line one<br>Line two<br/>Line three" },
  { label: "entities", input: "<p>Tom &amp; Jerry &mdash; &quot;quoted&quot; &hellip;</p>" },
  { label: "nested", input: "<div><p>Outer <strong>bold <em>italic</em></strong></p></div>" },
];

let failures = 0;

function check(label: string, input: string, mustNotContain = /<[a-z/]|&[a-z]+;|^\s|\*\*|^#/i) {
  const out = postBodyToText(input);
  const bad = mustNotContain.test(out) || out.length === 0;
  if (bad) failures++;
  console.log(`${bad ? "FAIL" : "ok  "} ${label.padEnd(14)} ${JSON.stringify(out.slice(0, 88))}`);
}

console.log("--- real HTML posts (from the screenshot) ---");
realHtmlPosts.forEach((p, i) => check(`html #${i + 1}`, p));

console.log("\n--- markdown posts ---");
markdownPosts.forEach((p, i) => check(`md #${i + 1}`, p));

console.log("\n--- structural cases ---");
structural.forEach((c) => check(c.label, c.input));

console.log("\n--- paragraph breaks preserved ---");
const twoParas = postBodyToText("<p>First para.</p><p>Second para.</p>");
const hasBreak = twoParas.includes("\n\n");
if (!hasBreak) failures++;
console.log(`${hasBreak ? "ok  " : "FAIL"} break kept   ${JSON.stringify(twoParas)}`);

console.log("\n--- edge cases (must not crash) ---");
([null, undefined, "", "   ", "<p></p>"] as const).forEach((e, i) => {
  const out = postBodyToText(e);
  const ok = out === "";
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} edge #${i + 1}        ${JSON.stringify(out)}`);
});

console.log(`\nfailures: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
