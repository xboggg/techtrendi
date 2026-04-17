// ─── TugOfWarScene — Isometric 3D SVG Tug-of-War Visualization ─────────────
// Pure SVG + CSS 3D transforms. No canvas, no Three.js, no external libraries.

import { useEffect, useState, useMemo } from 'react';

export interface TugOfWarSceneProps {
  p1Score: number;
  p2Score: number;
  maxScore: number;
  p1Name?: string;
  p2Name?: string;
  p1Color?: string;
  p2Color?: string;
  lastAction?: 'p1-correct' | 'p1-wrong' | 'p2-correct' | 'p2-wrong' | null;
  roundsWon?: [number, number];
  totalRounds?: number;
}

// ─── Inject global keyframes once ──────────────────────────────────────────

const STYLE_ID = 'tow-iso-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes tow-bob {
      0%,100%{transform:translateY(0)}
      50%{transform:translateY(-2px)}
    }
    @keyframes tow-bob2 {
      0%,100%{transform:translateY(0)}
      50%{transform:translateY(-3px)}
    }
    @keyframes tow-yank-l {
      0%{transform:translateX(0)}
      25%{transform:translateX(-10px)}
      50%{transform:translateX(3px)}
      100%{transform:translateX(0)}
    }
    @keyframes tow-yank-r {
      0%{transform:translateX(0)}
      25%{transform:translateX(10px)}
      50%{transform:translateX(-3px)}
      100%{transform:translateX(0)}
    }
    @keyframes tow-wobble {
      0%,100%{transform:rotate(0deg)}
      25%{transform:rotate(4deg)}
      60%{transform:rotate(-3deg)}
    }
    @keyframes tow-jump {
      0%,100%{transform:translateY(0)}
      30%{transform:translateY(-10px)}
      60%{transform:translateY(-4px)}
    }
    @keyframes tow-dust-iso {
      0%{opacity:.65;transform:translate(0,0) scale(1)}
      100%{opacity:0;transform:translate(var(--dx,-6px),-14px) scale(.2)}
    }
    @keyframes tow-flag-pulse {
      0%,100%{transform:scale(1)}
      50%{transform:scale(1.25)}
    }
    @keyframes tow-crowd-wave {
      0%,100%{transform:translateY(0)}
      50%{transform:translateY(-2px)}
    }
    @keyframes tow-confetti {
      0%{opacity:1;transform:translate(0,0) rotate(0deg)}
      100%{opacity:0;transform:translate(var(--cx,10px),var(--cy,-30px)) rotate(var(--cr,180deg))}
    }
    @keyframes tow-glow-pulse {
      0%,100%{opacity:.25}
      50%{opacity:.55}
    }
    .tow-i-bob{animation:tow-bob 1s ease-in-out infinite}
    .tow-i-bob2{animation:tow-bob2 1.1s ease-in-out infinite .15s}
    .tow-i-yank-l{animation:tow-yank-l .4s ease-out}
    .tow-i-yank-r{animation:tow-yank-r .4s ease-out}
    .tow-i-wobble{animation:tow-wobble .4s ease-out}
    .tow-i-jump{animation:tow-jump .45s ease-in-out infinite}
    .tow-i-flag-pulse{animation:tow-flag-pulse .55s ease-in-out infinite}
    .tow-i-crowd{animation:tow-crowd-wave 2s ease-in-out infinite}
    .tow-i-glow{animation:tow-glow-pulse 1.2s ease-in-out infinite}
  `;
  document.head.appendChild(s);
}

// ─── Isometric character (3 per team, depth-staggered) ─────────────────────

function IsoCharacter({
  x, y, scale, color, mirror, lean, headband, shadow,
}: {
  x: number; y: number; scale: number; color: string;
  mirror?: boolean; lean: number; headband: string; shadow: boolean;
}) {
  const d = mirror ? -1 : 1;
  const lAngle = lean * d;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* Ground shadow */}
      {shadow && (
        <ellipse cx={0} cy={6} rx={10 * scale} ry={3.5 * scale}
          fill="rgba(0,0,0,.2)" />
      )}
      <g transform={`rotate(${lAngle},0,-18)`}>
        {/* Body shadow offset (gives thickness) */}
        <line x1={1.5} y1={-28} x2={1.5} y2={-8}
          stroke="rgba(0,0,0,.18)" strokeWidth={3} strokeLinecap="round" />
        {/* Body */}
        <line x1={0} y1={-29} x2={0} y2={-8}
          stroke={color} strokeWidth={3} strokeLinecap="round" />
        {/* Head shadow */}
        <circle cx={1.5} cy={-35} r={5.5} fill="rgba(0,0,0,.12)" />
        {/* Head */}
        <circle cx={0} cy={-36} r={5.5} fill={color} />
        {/* Headband */}
        <ellipse cx={0} cy={-38} rx={6} ry={2}
          fill={headband} opacity={.85} />
        {/* Eyes */}
        <circle cx={d * 2} cy={-37} r={1} fill="white" />
        <circle cx={d * 2} cy={-37} r={.5} fill="#222" />
        {/* Arms gripping rope — two arms at slightly different heights */}
        <line x1={0} y1={-25} x2={d * 13} y2={-20}
          stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <line x1={0} y1={-21} x2={d * 11} y2={-17}
          stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        {/* Hands (fists) */}
        <circle cx={d * 13} cy={-20} r={2} fill={color} />
        <circle cx={d * 11} cy={-17} r={1.8} fill={color} />
        {/* Back leg braced */}
        <line x1={0} y1={-8} x2={-d * 9} y2={6}
          stroke={color} strokeWidth={2.8} strokeLinecap="round" />
        {/* Front leg */}
        <line x1={0} y1={-8} x2={d * 5} y2={6}
          stroke={color} strokeWidth={2.8} strokeLinecap="round" />
        {/* Shoes */}
        <ellipse cx={-d * 9} cy={7} rx={3} ry={1.5} fill={color} opacity={.75} />
        <ellipse cx={d * 5} cy={7} rx={3} ry={1.5} fill={color} opacity={.75} />
      </g>
    </g>
  );
}

// ─── Dust burst ────────────────────────────────────────────────────────────

function IsoDust({ x, y, active, side }: {
  x: number; y: number; active: boolean; side: 'left' | 'right';
}) {
  if (!active) return null;
  const dx = side === 'left' ? -1 : 1;
  return (
    <g>
      {[0, 1, 2, 3].map(i => (
        <circle key={i}
          cx={x + i * dx * 5} cy={y - i * 2}
          r={2 - i * .35} fill="#c4a06a" opacity={0}
          style={{
            animation: `tow-dust-iso .55s ease-out ${i * .08}s forwards`,
            ['--dx' as string]: `${dx * (6 + i * 4)}px`,
          }}
        />
      ))}
    </g>
  );
}

// ─── Confetti ──────────────────────────────────────────────────────────────

function Confetti({ active, cx: baseCx, cy: baseCy }: {
  active: boolean; cx: number; cy: number;
}) {
  const pieces = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      dx: (Math.random() - .5) * 80,
      dy: -(Math.random() * 40 + 15),
      rot: Math.random() * 360,
      color: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#ec4899'][i % 6],
      delay: i * .06,
      size: 2 + Math.random() * 2,
    })), []);

  if (!active) return null;
  return (
    <g>
      {pieces.map((p, i) => (
        <rect key={i}
          x={baseCx} y={baseCy}
          width={p.size} height={p.size * .6}
          fill={p.color} rx={.5}
          style={{
            animation: `tow-confetti .9s ease-out ${p.delay}s forwards`,
            ['--cx' as string]: `${p.dx}px`,
            ['--cy' as string]: `${p.dy}px`,
            ['--cr' as string]: `${p.rot}deg`,
            opacity: 0,
          }}
        />
      ))}
    </g>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function TugOfWarScene({
  p1Score, p2Score, maxScore,
  p1Name = 'Player 1', p2Name = 'Player 2',
  p1Color = '#3b82f6', p2Color = '#f97316',
  lastAction = null,
  roundsWon = [0, 0], totalRounds = 3,
}: TugOfWarSceneProps) {
  const [dustKey, setDustKey] = useState(0);

  useEffect(() => { injectStyles(); }, []);
  useEffect(() => { if (lastAction) setDustKey(k => k + 1); }, [lastAction]);

  const scoreDiff = p2Score - p1Score;
  const norm = Math.max(-1, Math.min(1, scoreDiff / maxScore));
  const ropeShift = norm * 100;

  const p1Lean = norm < 0 ? -14 - norm * 4 : -4 + norm * 10;
  const p2Lean = norm > 0 ? -14 + norm * 4 : -4 - norm * 10;

  const p1Class = lastAction === 'p1-correct' ? 'tow-i-yank-l'
    : lastAction === 'p1-wrong' ? 'tow-i-wobble' : 'tow-i-bob';
  const p2Class = lastAction === 'p2-correct' ? 'tow-i-yank-r'
    : lastAction === 'p2-wrong' ? 'tow-i-wobble' : 'tow-i-bob2';

  const nearWin = Math.abs(norm) > .7;
  const p1Won = p1Score >= maxScore;
  const p2Won = p2Score >= maxScore;
  const gameOver = p1Won || p2Won;

  const isDark = typeof window !== 'undefined'
    && document.documentElement.classList.contains('dark');

  // Colors
  const skyTop = isDark ? '#0f172a' : '#7ec8e3';
  const skyBot = isDark ? '#1e293b' : '#bae6fd';
  const grassA = isDark ? '#1a3a1a' : '#34d399';
  const grassB = isDark ? '#0f2a0f' : '#22c55e';
  const dirtA = isDark ? '#44301a' : '#d4a574';
  const dirtB = isDark ? '#2c1f10' : '#b8956a';

  // Rope geometry
  const ropeY = 165;
  const rL = 160 + ropeShift;
  const rR = 640 + ropeShift;
  const rMx = (rL + rR) / 2;
  const sag = 5 + Math.abs(norm) * 3;
  const ropeD = `M${rL},${ropeY} Q${rMx},${ropeY + sag} ${rR},${ropeY}`;

  const flagX = 400 + ropeShift;
  const flagY = ropeY - 2;

  // Team positions (3 chars each, depth-staggered: back chars smaller & higher)
  const teamLeft = [
    { x: rL - 28, y: ropeY - 2, s: 1 },
    { x: rL - 56, y: ropeY - 8, s: .88 },
    { x: rL - 80, y: ropeY - 14, s: .76 },
  ];
  const teamRight = [
    { x: rR + 28, y: ropeY - 2, s: 1 },
    { x: rR + 56, y: ropeY - 8, s: .88 },
    { x: rR + 80, y: ropeY - 14, s: .76 },
  ];

  // Stadium bleacher shapes
  const bleachers = (xOff: number, yOff: number, flip: boolean) => {
    const f = flip ? -1 : 1;
    return (
      <g transform={`translate(${xOff},${yOff})`} opacity={isDark ? .25 : .18}>
        {/* Tiered rows */}
        {[0, 1, 2].map(row => (
          <rect key={row}
            x={f > 0 ? 0 : -60} y={-row * 8 - 10}
            width={60} height={7} rx={1}
            fill={isDark ? '#475569' : '#94a3b8'}
          />
        ))}
        {/* Crowd dots */}
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={i}
            cx={(f > 0 ? 4 : -56) + i * 8}
            cy={-((i % 3) * 8) - 14}
            r={2.5}
            fill={isDark ? '#64748b' : '#6b7280'}
          />
        ))}
      </g>
    );
  };

  // Isometric grid lines on ground
  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      // Horizontal-ish lines across the diamond
      lines.push({
        x1: 100 + t * 100, y1: 200 + t * 20,
        x2: 700 - t * 100, y2: 200 + t * 20,
      });
    }
    return lines;
  }, []);

  return (
    <div className="w-full max-w-[700px] mx-auto select-none">
      {/* Score header */}
      <div className="flex justify-between items-center px-1 mb-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate max-w-[100px]"
            style={{ color: p1Color }}>{p1Name}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full border"
                style={{
                  backgroundColor: i < roundsWon[0] ? p1Color : 'transparent',
                  borderColor: i < roundsWon[0] ? p1Color : `${p1Color}40`,
                }} />
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Round {Math.min(roundsWon[0] + roundsWon[1] + 1, totalRounds)}/{totalRounds}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full border"
                style={{
                  backgroundColor: i < roundsWon[1] ? p2Color : 'transparent',
                  borderColor: i < roundsWon[1] ? p2Color : `${p2Color}40`,
                }} />
            ))}
          </div>
          <span className="font-bold text-sm truncate max-w-[100px]"
            style={{ color: p2Color }}>{p2Name}</span>
        </div>
      </div>

      {/* Isometric 3D container */}
      <div style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 45%',
      }}>
        <div style={{
          transform: 'rotateX(8deg)',
          transformStyle: 'preserve-3d',
          transition: 'transform .3s ease',
        }}>
          <svg viewBox="0 0 800 320"
            className="w-full h-auto rounded-xl border border-border overflow-hidden"
            style={{ maxHeight: '340px' }}
            xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ti-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={skyTop} />
                <stop offset="100%" stopColor={skyBot} />
              </linearGradient>
              <linearGradient id="ti-grass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={grassA} />
                <stop offset="100%" stopColor={grassB} />
              </linearGradient>
              <linearGradient id="ti-dirt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={dirtA} />
                <stop offset="100%" stopColor={dirtB} />
              </linearGradient>
              <linearGradient id="ti-rope" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4a054" />
                <stop offset="50%" stopColor="#b8860b" />
                <stop offset="100%" stopColor="#8b6914" />
              </linearGradient>
              {/* Stadium light glow for dark mode */}
              {isDark && (
                <radialGradient id="ti-light" cx=".5" cy=".3" r=".7">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity=".08" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                </radialGradient>
              )}
            </defs>

            {/* ── Sky ──────────────────────────────────────────────── */}
            <rect width="800" height="200" fill="url(#ti-sky)" />

            {/* Stadium lights (dark mode) */}
            {isDark && <>
              <rect x="80" y="20" width="4" height="80" fill="#475569" rx="2" />
              <circle cx="82" cy="18" r="8" fill="#fbbf24" opacity=".6" />
              <rect x="716" y="20" width="4" height="80" fill="#475569" rx="2" />
              <circle cx="718" cy="18" r="8" fill="#fbbf24" opacity=".6" />
              <rect width="800" height="320" fill="url(#ti-light)" />
            </>}

            {/* Clouds (light mode) or stars (dark mode) */}
            {isDark ? (
              <g opacity=".4">
                {[90, 220, 380, 540, 680].map((cx, i) => (
                  <circle key={i} cx={cx} cy={15 + (i % 3) * 12}
                    r={1} fill="white" />
                ))}
              </g>
            ) : (
              <g opacity=".3">
                <ellipse cx="140" cy="45" rx="38" ry="12" fill="white" />
                <ellipse cx="168" cy="40" rx="22" ry="9" fill="white" />
                <ellipse cx="580" cy="55" rx="32" ry="11" fill="white" />
                <ellipse cx="606" cy="50" rx="20" ry="8" fill="white" />
              </g>
            )}

            {/* ── Bleachers / Crowd silhouettes ────────────────────── */}
            <g className={
              (lastAction === 'p1-correct' || lastAction === 'p2-correct')
                ? 'tow-i-crowd' : ''
            }>
              {bleachers(60, 140, false)}
              {bleachers(680, 140, true)}
              {/* Back bleachers (smaller = further) */}
              {bleachers(250, 110, false)}
              {bleachers(500, 110, true)}
            </g>

            {/* ── Isometric ground diamond ─────────────────────────── */}
            {/* Main field */}
            <polygon points="400,175 750,210 400,280 50,210"
              fill="url(#ti-grass)" />

            {/* Ground shadow beneath entire scene */}
            <polygon points="400,178 750,213 400,283 50,213"
              fill="rgba(0,0,0,.12)" />

            {/* Grid lines for depth */}
            <g opacity=".12" stroke={isDark ? '#94a3b8' : '#166534'} strokeWidth=".7">
              {gridLines.map((l, i) => (
                <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
              ))}
              {/* Vertical-ish lines */}
              {[200, 300, 400, 500, 600].map(xv => (
                <line key={xv}
                  x1={xv} y1={175 + Math.abs(xv - 400) * .1}
                  x2={xv} y2={280 - Math.abs(xv - 400) * .15}
                />
              ))}
            </g>

            {/* Dirt strip center */}
            <polygon points="400,195 530,210 400,255 270,210"
              fill="url(#ti-dirt)" opacity=".85" />

            {/* Score zone glows */}
            {norm < -.3 && (
              <polygon points="400,175 200,195 50,210 200,225 400,210"
                fill={p1Color}
                opacity={Math.min(.35, (Math.abs(norm) - .3) * .7)}
                className={nearWin ? 'tow-i-glow' : ''} />
            )}
            {norm > .3 && (
              <polygon points="400,175 600,195 750,210 600,225 400,210"
                fill={p2Color}
                opacity={Math.min(.35, (norm - .3) * .7)}
                className={nearWin ? 'tow-i-glow' : ''} />
            )}

            {/* Center line */}
            <line x1="400" y1="188" x2="400" y2="265"
              stroke="white" strokeWidth="2" opacity=".45" />
            {/* Center diamond marker */}
            <polygon points="400,206 406,210 400,214 394,210"
              fill="white" opacity=".5" />

            {/* ── Shadows on ground (characters + rope) ────────────── */}
            <g opacity=".15">
              {teamLeft.map((c, i) => (
                <ellipse key={`sl${i}`}
                  cx={c.x} cy={c.y + 12}
                  rx={8 * c.s} ry={3 * c.s} fill="#000" />
              ))}
              {teamRight.map((c, i) => (
                <ellipse key={`sr${i}`}
                  cx={c.x} cy={c.y + 12}
                  rx={8 * c.s} ry={3 * c.s} fill="#000" />
              ))}
            </g>

            {/* ── Rope ─────────────────────────────────────────────── */}
            <g style={{
              transition: 'transform .5s cubic-bezier(.34,1.56,.64,1)',
            }}>
              {/* Rope shadow on ground */}
              <path d={`M${rL},${ropeY + 8} Q${rMx},${ropeY + sag + 10} ${rR},${ropeY + 8}`}
                fill="none" stroke="rgba(0,0,0,.1)" strokeWidth="7"
                strokeLinecap="round" />
              {/* Outer rope (dark edge) */}
              <path d={ropeD} fill="none"
                stroke="#7a5c1e" strokeWidth="7" strokeLinecap="round" />
              {/* Main rope */}
              <path d={ropeD} fill="none"
                stroke="url(#ti-rope)" strokeWidth="5.5" strokeLinecap="round" />
              {/* Braid texture — dashed highlight */}
              <path d={ropeD} fill="none"
                stroke="rgba(255,255,255,.18)" strokeWidth="2.5"
                strokeLinecap="round" strokeDasharray="6,5" />
              {/* Secondary braid line offset */}
              <path d={`M${rL},${ropeY + 1} Q${rMx},${ropeY + sag + 1} ${rR},${ropeY + 1}`}
                fill="none" stroke="rgba(0,0,0,.1)" strokeWidth="1.5"
                strokeDasharray="4,7" strokeDashoffset="3" />
            </g>

            {/* ── Flag / center marker ─────────────────────────────── */}
            <g className={nearWin ? 'tow-i-flag-pulse' : ''}
              style={{
                transformOrigin: `${flagX}px ${flagY}px`,
                transition: 'all .5s cubic-bezier(.34,1.56,.64,1)',
              }}>
              {/* Pole shadow */}
              <line x1={flagX + 2} y1={flagY + 4} x2={flagX + 2} y2={flagY - 22}
                stroke="rgba(0,0,0,.12)" strokeWidth="2" />
              {/* Pole */}
              <line x1={flagX} y1={flagY + 2} x2={flagX} y2={flagY - 24}
                stroke="#555" strokeWidth="2" strokeLinecap="round" />
              {/* Flag (3D-ish triangle with highlight) */}
              <polygon
                points={`${flagX},${flagY - 24} ${flagX + 18},${flagY - 18} ${flagX},${flagY - 12}`}
                fill={nearWin ? (norm < 0 ? p1Color : p2Color) : '#ef4444'} />
              <polygon
                points={`${flagX},${flagY - 24} ${flagX + 10},${flagY - 20} ${flagX},${flagY - 16}`}
                fill="rgba(255,255,255,.2)" />
              {/* Flag shadow on ground */}
              <ellipse cx={flagX + 4} cy={flagY + 12} rx={6} ry={2}
                fill="rgba(0,0,0,.1)" />
              {/* Rope knot */}
              <circle cx={flagX} cy={flagY} r={4} fill="#9a7520"
                stroke="#6b4f0a" strokeWidth="1.2" />
              <circle cx={flagX - 1} cy={flagY - 1} r={1.5}
                fill="rgba(255,255,255,.2)" />
            </g>

            {/* ── Left Team (P1) ───────────────────────────────────── */}
            <g className={gameOver && p1Won ? 'tow-i-jump' : p1Class}>
              {teamLeft.map((c, i) => (
                <IsoCharacter key={`l${i}`}
                  x={c.x} y={c.y} scale={c.s}
                  color={p1Color} mirror={false}
                  lean={p1Lean + i * 2}
                  headband={p1Color}
                  shadow={true} />
              ))}
              <IsoDust key={`d1-${dustKey}`}
                x={teamLeft[0].x - 10} y={teamLeft[0].y + 8}
                active={lastAction === 'p1-correct'} side="left" />
            </g>

            {/* ── Right Team (P2) ──────────────────────────────────── */}
            <g className={gameOver && p2Won ? 'tow-i-jump' : p2Class}>
              {teamRight.map((c, i) => (
                <IsoCharacter key={`r${i}`}
                  x={c.x} y={c.y} scale={c.s}
                  color={p2Color} mirror={true}
                  lean={p2Lean + i * 2}
                  headband={p2Color}
                  shadow={true} />
              ))}
              <IsoDust key={`d2-${dustKey}`}
                x={teamRight[0].x + 10} y={teamRight[0].y + 8}
                active={lastAction === 'p2-correct'} side="right" />
            </g>

            {/* ── Confetti on win ──────────────────────────────────── */}
            {gameOver && (
              <>
                <Confetti active={p1Won} cx={teamLeft[0].x} cy={teamLeft[0].y - 40} />
                <Confetti active={p2Won} cx={teamRight[0].x} cy={teamRight[0].y - 40} />
              </>
            )}

            {/* ── Scores on ground ─────────────────────────────────── */}
            <text x={120} y={225} textAnchor="middle"
              fill={p1Color} fontSize="16" fontWeight="bold"
              fontFamily="system-ui,sans-serif" opacity=".85">
              {p1Score}
            </text>
            <text x={680} y={225} textAnchor="middle"
              fill={p2Color} fontSize="16" fontWeight="bold"
              fontFamily="system-ui,sans-serif" opacity=".85">
              {p2Score}
            </text>

            {/* ── Win overlay ──────────────────────────────────────── */}
            {gameOver && (
              <g>
                <rect x="250" y="70" width="300" height="50" rx="14"
                  fill="rgba(0,0,0,.65)" />
                <text x="400" y="102" textAnchor="middle"
                  fill="white" fontSize="20" fontWeight="bold"
                  fontFamily="system-ui,sans-serif">
                  {p1Won ? p1Name : p2Name} Wins!
                </text>
              </g>
            )}

            {/* ── Position indicator ───────────────────────────────── */}
            <rect x="150" y="298" width="500" height="4" rx="2"
              fill={isDark ? '#334155' : '#e5e7eb'} />
            <line x1="400" y1="296" x2="400" y2="304"
              stroke={isDark ? '#4b5563' : '#9ca3af'} strokeWidth="1" />
            <circle
              cx={400 + norm * 240} cy="300" r="5.5"
              fill={norm < 0 ? p1Color : norm > 0 ? p2Color
                : (isDark ? '#9ca3af' : '#6b7280')}
              stroke="white" strokeWidth="1.5"
              style={{ transition: 'cx .5s cubic-bezier(.34,1.56,.64,1)' }}
            />

            {/* ── Depth vignette overlay ───────────────────────────── */}
            <rect width="800" height="320" fill="none"
              stroke="rgba(0,0,0,.15)" strokeWidth="40" rx="10"
              style={{ pointerEvents: 'none' }} />
          </svg>
        </div>
      </div>
    </div>
  );
}
