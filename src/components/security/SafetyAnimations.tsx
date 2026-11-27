// Moving drawings for the Online Safety page (/security), owner's go 27 Nov 2026.
// Same family as the moving drawings in blog/news articles: CSS keyframes only
// (classes .sh-* in index.css), calm and slow, nothing flashes. With the phone's
// "reduce motion" setting, or the site's own Reduce Motion switch, every drawing
// shows as a still picture in its finished state. Help buttons never move.

type Verdict = "high" | "medium" | "low" | "clear";

/** Hero picture: a fake "you've won" message arrives → STOP · SCAM stamp → "You're safe". */
export function ScamStoryDrawing({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 230"
      role="img"
      aria-label="A fake message says you have won GHS 2,500 and asks for your MoMo PIN. Stop, it is a scam. You are safe."
      className={`sh-story w-full h-auto ${className}`}
    >
      {/* phone */}
      <rect x="12" y="14" width="98" height="202" rx="20" fill="#0b1220" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
      <rect x="44" y="24" width="34" height="6" rx="3" fill="rgba(255,255,255,0.18)" />
      <rect x="26" y="150" width="54" height="10" rx="5" fill="rgba(255,255,255,0.08)" />
      <rect x="26" y="168" width="70" height="10" rx="5" fill="rgba(255,255,255,0.08)" />
      <rect x="26" y="186" width="42" height="10" rx="5" fill="rgba(255,255,255,0.08)" />
      {/* new-message ping on the phone */}
      <circle className="sh-ping" cx="61" cy="70" r="13" fill="none" stroke="#fbbf24" strokeWidth="2" />
      <circle cx="61" cy="70" r="8" fill="#fbbf24" />

      {/* the scam message */}
      <g className="sh-bubble">
        <path d="M136 52 h198 a16 16 0 0 1 16 16 v46 a16 16 0 0 1 -16 16 h-198 a16 16 0 0 1 -16 -16 v-12 l-12 -6 l12 -6 v-22 a16 16 0 0 1 16 -16 z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
        <text x="134" y="84" fontSize="16" fontWeight="800" fill="#ffffff" fontFamily="Inter, system-ui, sans-serif">You've won GHS 2,500!</text>
        <text x="134" y="108" fontSize="13" fill="#cbd5e1" fontFamily="Inter, system-ui, sans-serif">Send your MoMo PIN to claim</text>
      </g>

      {/* STOP stamp */}
      <g transform="translate(235 92) rotate(-8)">
        <g className="sh-stamp">
          <rect x="-86" y="-25" width="172" height="50" rx="10" fill="rgba(127,29,29,0.78)" stroke="#ef4444" strokeWidth="4" />
          <text x="0" y="9" textAnchor="middle" fontSize="23" fontWeight="900" letterSpacing="2" fill="#fca5a5" fontFamily="Inter, system-ui, sans-serif">STOP · SCAM</text>
        </g>
      </g>

      {/* You're safe */}
      <g className="sh-safe">
        <path d="M192 150 l22 -8 l22 8 v14 c0 14 -10 24 -22 29 c-12 -5 -22 -15 -22 -29 z" fill="rgba(16,185,129,0.18)" stroke="#34d399" strokeWidth="2.5" />
        <path className="sh-tick" d="M203 167 l7 7 l14 -15" fill="none" stroke="#6ee7b7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" />
        <text x="248" y="176" fontSize="17" fontWeight="800" fill="#6ee7b7" fontFamily="Inter, system-ui, sans-serif">You're safe</text>
      </g>
    </svg>
  );
}

const STEPS = [
  { n: "1", t: "Stop now", d: "Send no more money, codes or PIN. Whatever they tell you, stop." },
  { n: "2", t: "Freeze it", d: "Call your bank or mobile-money network and ask them to block the account." },
  { n: "3", t: "Report it: call 292", d: "Call or text 292, the Cyber Security Authority. Free, day and night." },
  { n: "4", t: "Lost money to an “investment”?", d: "Report to the SEC on 0800 100 065 or info@sec.gov.gh." },
];

/** The 4 "Been scammed?" steps, with a light travelling 1 → 2 → 3 → 4 and ticking each number. */
export function HelpStepsJourney() {
  return (
    <div className="relative mt-6">
      {/* rail — down the numbers on phones, across them on wider screens */}
      <span aria-hidden className="md:hidden absolute left-[15px] top-6 bottom-6 w-[3px] rounded-full bg-red-500/25">
        <span className="sh-dot-v absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-300 shadow-[0_0_14px_4px_rgba(248,113,113,0.7)]" />
      </span>
      <span aria-hidden className="hidden md:block absolute top-[15px] left-[12.5%] right-[12.5%] h-[3px] rounded-full bg-red-500/25">
        <span className="sh-dot-h absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-red-300 shadow-[0_0_14px_4px_rgba(248,113,113,0.7)]" />
      </span>
      <ol className="relative space-y-3 md:space-y-0 md:grid md:grid-cols-4 md:gap-3">
        {STEPS.map((s, i) => (
          <li key={s.n} className="flex gap-3 md:flex-col md:items-center md:text-center">
            <span
              className="sh-step relative z-10 shrink-0 w-8 h-8 rounded-full bg-red-500 text-white text-base font-bold flex items-center justify-center"
              style={{ animationDelay: `${i * 2}s` }}
            >
              {s.n}
            </span>
            <div className="flex-1 rounded-2xl bg-white/[0.05] border border-white/10 p-4 md:w-full">
              <p className="text-lg font-bold text-white leading-snug">{s.t}</p>
              <p className="text-base text-white/80 mt-1 leading-relaxed">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Scanning line laid over the message box while it is being checked. */
export function ScanOverlay() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden bg-cyan-400/[0.06]">
      <span className="sh-scan absolute inset-x-0 h-12" />
    </span>
  );
}

const MARK: Record<Verdict, { color: string; d: string }> = {
  high: { color: "#ef4444", d: "M22 22 L42 42 M42 22 L22 42" },
  medium: { color: "#f59e0b", d: "M32 18 V36 M32 45 V46" },
  low: { color: "#3b82f6", d: "M32 18 V36 M32 45 V46" },
  clear: { color: "#10b981", d: "M20 33 L28 41 L44 23" },
};

/** Big drawn ✓ / ✗ / ! for the checker's answer. */
export function VerdictMark({ verdict }: { verdict: Verdict }) {
  const m = MARK[verdict];
  return (
    <svg viewBox="0 0 64 64" className="w-14 h-14 shrink-0" aria-hidden>
      <circle className="sh-draw" cx="32" cy="32" r="28" fill="none" stroke={m.color} strokeWidth="4" pathLength={1} strokeDasharray="1" />
      <path className="sh-draw sh-draw-late" d={m.d} fill="none" stroke={m.color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" />
    </svg>
  );
}

/** Calm "live" dot (slower than Tailwind's animate-ping). */
export function LiveDot({ color = "bg-red-500", size = "h-2.5 w-2.5" }: { color?: string; size?: string }) {
  return (
    <span className={`relative flex ${size}`}>
      <span className={`sh-live absolute inline-flex h-full w-full rounded-full ${color}`} />
      <span className={`relative inline-flex rounded-full h-full w-full ${color}`} />
    </span>
  );
}
