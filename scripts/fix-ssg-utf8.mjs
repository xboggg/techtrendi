// Runs before `vite-react-ssg build` (package.json "build").
//
// React 18's renderToPipeableStream fills 2048-byte blocks. When the next character is
// multi-byte ("…", "₵", "é", emoji) and does not fit the 1-2 bytes left in a block, React sends
// the WHOLE block, unused tail included, so a stray byte lands in the page and shows as "�".
// React 19 fixed it (it sends only the filled part). Found 10 Nov 2026: adding one menu link moved
// a block edge onto the "…" of the comments box on /news/the-rundown-2026-09-26-ai-rogue-big-money,
// which became "thoughts�…" in the prerendered page.
// This applies React 19's one-line fix to react-dom/server for Node. Idempotent; when the line is
// gone (React upgraded), it says so and changes nothing.
import { readFileSync, writeFileSync } from "node:fs";

const FIXES = [
  {
    file: "node_modules/react-dom/cjs/react-dom-server.node.production.min.js",
    from: "d<b.length&&(t(a,k),",
    to: "d<b.length&&(t(a,k.subarray(0,l)),",
  },
  {
    file: "node_modules/react-dom/cjs/react-dom-server.node.development.js",
    from: "    writeToDestination(destination, currentView);\n    currentView = new Uint8Array(VIEW_SIZE);\n    writtenBytes = textEncoder.encodeInto(stringChunk.slice(read), currentView).written;",
    to: "    writeToDestination(destination, currentView.subarray(0, writtenBytes));\n    currentView = new Uint8Array(VIEW_SIZE);\n    writtenBytes = textEncoder.encodeInto(stringChunk.slice(read), currentView).written;",
  },
];

for (const { file, from, to } of FIXES) {
  let src;
  try {
    src = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  } catch {
    console.log(`[fix-ssg-utf8] ${file}: not installed`);
    continue;
  }
  if (src.includes(to)) { console.log(`[fix-ssg-utf8] ${file}: already fixed`); continue; }
  const n = src.split(from).length - 1;
  if (n === 0) { console.log(`[fix-ssg-utf8] ${file}: line not found (React upgraded?); nothing changed`); continue; }
  if (n !== 1) { console.error(`[fix-ssg-utf8] ${file}: line found ${n} times; not changed`); process.exit(1); }
  writeFileSync(file, src.replace(from, to));
  console.log(`[fix-ssg-utf8] ${file}: fixed`);
}
