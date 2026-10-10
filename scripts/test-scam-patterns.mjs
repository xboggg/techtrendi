// Verify the scam checker against the real patterns in scamPatterns.ts.
// Loads the live file so the test cannot drift from the shipped logic.
import { readFileSync } from "node:fs";

const SRC = new URL("../src/lib/scamPatterns.ts", import.meta.url);

const src = readFileSync(SRC, "utf8");

// Each pattern line looks like:  { pattern: /…/i, label: "…", risk: "high" as const,
const P = [];
for (const line of src.split("\n")) {
  const t = line.trim();
  if (!t.startsWith("{ pattern:")) continue;
  const slash = t.indexOf("/");
  const end = t.indexOf("/i,", slash);
  if (slash < 0 || end < 0) continue;
  const body = t.slice(slash + 1, end);
  const label = (t.match(/label:\s*"([^"]+)"/) || [])[1];
  const risk = (t.match(/risk:\s*"(high|medium|low)"/) || [])[1];
  if (!label || !risk) continue;
  try {
    P.push({ pattern: new RegExp(body, "i"), label, risk });
  } catch (e) {
    console.log("UNPARSEABLE:", label, e.message);
  }
}
console.log(`patterns loaded from source: ${P.length}\n`);

function verdict(s) {
  const hits = P.filter((p) => p.pattern.test(s));
  const H = hits.filter((x) => x.risk === "high").length;
  const M = hits.filter((x) => x.risk === "medium").length;
  const v =
    H >= 2 ? "HIGH" : H === 1 || M >= 2 ? "MEDIUM" : hits.length === 0 ? "CLEAR" : "LOW";
  return [v, hits.map((x) => x.label)];
}

const scams = [
  "Hello, I mistakenly sent GHS 500 to your number. Please send it back, I am a trader and that was my capital.",
  "Good morning. Sorry wrong number, I sent money to you by mistake. Kindly return it.",
  "Please I sent 300 cedis to this number by error. Send it back to me please.",
  "I transferred to the wrong number. Reverse it back to me now please.",
  "Dear customer, an amount was credited to your wallet accidentally. Kindly return the money.",
  "Boss I paid into your momo by mistake, please reverse it.",
  // The exact message from the 10 Oct 2026 site review, which the old
  // patterns rated only "Some Red Flags".
  "MTN MoMo: Dear customer, GHS 500 was sent to your wallet by mistake. Please send it back to 0244000000 immediately or your account will be blocked. Call now.",
];

// A safety tool that cries wolf on ordinary messages trains people to ignore it.
const legit = [
  "Hi, your order has shipped and will arrive Tuesday. Track it in the app.",
  "Thanks for lunch! I'll pay you back on Friday when I get paid.",
  "I will pay you back tomorrow, promise.",
  "The meeting moved to 3pm. See you in the conference room.",
  "Your ECG bill for October is GHS 240. Pay at any authorised vendor.",
  "I sent the documents you asked for to your email.",
  "Can you send me the report back with your comments?",
];

let fail = 0;
console.log("--- SCAMS (want HIGH) ---");
for (const s of scams) {
  const [v, l] = verdict(s);
  const ok = v === "HIGH";
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${v.padEnd(7)} ${l.join(" + ")}`);
}

console.log("\n--- LEGITIMATE (want CLEAR or LOW) ---");
for (const s of legit) {
  const [v, l] = verdict(s);
  const ok = v === "CLEAR" || v === "LOW";
  if (!ok) fail++;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${v.padEnd(7)} ${(l.join(" + ") || "(none)").padEnd(40)} | ${s.slice(0, 42)}`,
  );
}

console.log(`\nfailures: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
