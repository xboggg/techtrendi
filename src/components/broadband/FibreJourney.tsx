import { useReducedMotion } from "framer-motion";

/**
 * "How fibre reaches your home": light pulses travel along a glass cable from the
 * street to a house, the router, and then out as Wi-Fi to phones, TV and laptop.
 * Pure SVG + CSS animation (no picture files). Respects "reduce motion".
 */
export function FibreJourney() {
  const reduce = useReducedMotion();
  const pulse = (delay: number, colour: string) =>
    reduce ? null : (
      <circle r="5" fill={colour} filter="url(#fj-glow)">
        <animateMotion dur="3.2s" repeatCount="indefinite" begin={`${delay}s`} path="M20 150 C 120 150, 150 90, 250 90 S 380 150, 470 150" />
      </circle>
    );

  return (
    <figure className="rounded-3xl border bg-slate-950 text-white p-4 sm:p-6 overflow-hidden">
      <svg viewBox="0 0 700 250" className="w-full h-auto" role="img" aria-labelledby="fj-title fj-desc">
        <title id="fj-title">How fibre broadband reaches your home</title>
        <desc id="fj-desc">
          Light travels through a thin glass cable from MTN's network on the street into your house. The MTN router
          turns the light into internet and shares it by Wi-Fi with your phones, TV and laptop.
        </desc>
        <defs>
          <filter id="fj-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="fj-cable" x1="0" x2="1">
            <stop offset="0" stopColor="#facc15" stopOpacity=".25" />
            <stop offset="1" stopColor="#facc15" stopOpacity=".9" />
          </linearGradient>
        </defs>

        {/* street cabinet */}
        <g>
          <rect x="4" y="110" width="44" height="80" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
          <rect x="12" y="122" width="28" height="6" rx="3" fill="#facc15" />
          <rect x="12" y="134" width="28" height="6" rx="3" fill="#22d3ee" />
          <text x="30" y="214" textAnchor="middle" className="text-[22px] md:text-[15px]" fill="#cbd5e1" fontWeight="700">Street</text>
        </g>

        {/* the glass cable */}
        <path d="M20 150 C 120 150, 150 90, 250 90 S 380 150, 470 150" fill="none" stroke="url(#fj-cable)" strokeWidth="6" strokeLinecap="round" />
        <text x="250" y="66" textAnchor="middle" className="text-[22px] md:text-[15px]" fill="#fde68a" fontWeight="700">Light in a glass cable</text>
        {pulse(0, "#fffbeb")}
        {pulse(1.05, "#a5f3fc")}
        {pulse(2.1, "#fde68a")}

        {/* house */}
        <g>
          <path d="M440 120 L540 50 L640 120" fill="none" stroke="#facc15" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
          <rect x="462" y="116" width="156" height="110" rx="10" fill="#0f172a" stroke="#facc15" strokeWidth="4" />
          {/* the cable comes through the wall to the router */}
          <path d="M462 150 C 490 150, 500 192, 508 193" fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
          {/* router */}
          <rect x="508" y="182" width="64" height="22" rx="6" fill="#f8fafc" />
          <line x1="516" y1="182" x2="512" y2="160" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
          <line x1="564" y1="182" x2="568" y2="160" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
          <circle cx="522" cy="193" r="3" fill="#22c55e">
            {!reduce && <animate attributeName="opacity" values="1;.2;1" dur="1.2s" repeatCount="indefinite" />}
          </circle>
          <circle cx="533" cy="193" r="3" fill="#22c55e" />
          {/* wifi */}
          <g fill="none" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round">
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${540 - 14 - i * 12} ${170 - i * 10} Q540 ${156 - i * 22} ${540 + 14 + i * 12} ${170 - i * 10}`} opacity={1 - i * 0.25}>
                {!reduce && <animate attributeName="opacity" values={`0;${1 - i * 0.25};0`} dur="1.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />}
              </path>
            ))}
          </g>
          <text x="540" y="247" textAnchor="middle" className="text-[22px] md:text-[15px]" fill="#cbd5e1" fontWeight="700">Your home</text>
        </g>

        {/* devices */}
        <g fill="none" stroke="#e2e8f0" strokeWidth="3">
          <rect x="660" y="60" width="22" height="38" rx="4" />
          <rect x="652" y="122" width="40" height="26" rx="3" />
          <line x1="672" y1="148" x2="672" y2="156" />
          <path d="M650 190 h44 l6 12 h-56 z" />
        </g>
        <g fill="none" stroke="#67e8f9" strokeWidth="2" strokeDasharray="4 5" opacity=".8">
          <path d="M600 140 Q630 100 656 84" />
          <path d="M610 160 Q632 145 650 136" />
          <path d="M610 186 Q634 190 650 192" />
        </g>
      </svg>
      <figcaption className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-slate-200">
        <span><b className="text-yellow-300">1.</b> MTN's glass cable carries light to your street.</span>
        <span><b className="text-yellow-300">2.</b> A thin cable is brought into your house, to the MTN router.</span>
        <span><b className="text-yellow-300">3.</b> The router turns the light into internet and shares it as Wi-Fi.</span>
      </figcaption>
    </figure>
  );
}
