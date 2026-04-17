// ─── Speed Typing Race — Full Game ───────────────────────────────────────────

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Keyboard,
  Gauge,
  Target,
  Timer,
  Car,
  Trophy,
  Settings,
  ChevronDown,
  Zap,
  Info,
} from 'lucide-react';

// Arcade shared infrastructure
import { GameModeSelector } from '@/components/arcade/GameModeSelector';
import { RoomLobby } from '@/components/arcade/RoomLobby';
import { CountdownOverlay } from '@/components/arcade/CountdownOverlay';
import { GameOverScreen } from '@/components/arcade/GameOverScreen';
import { Leaderboard } from '@/components/arcade/Leaderboard';
import { RankBadge } from '@/components/arcade/RankBadge';
import { StreakIndicator } from '@/components/arcade/StreakIndicator';
import { useGameRoom } from '@/lib/arcade/useGameRoom';
import { useGameAI } from '@/lib/arcade/useGameAI';
import { usePlayerProfile } from '@/lib/arcade/usePlayerProfile';
import { useLeaderboard } from '@/lib/arcade/useLeaderboard';
import { useRankSystem } from '@/lib/arcade/useRankSystem';
import { useStreakTracker } from '@/lib/arcade/useStreakTracker';
import { ELO } from '@/lib/arcade/constants';
import type { GameMode } from '@/lib/arcade/types';

// ─── Typing Passages ─────────────────────────────────────────────────────────

const PASSAGES: string[] = [
  "The best way to predict the future is to invent it. Technology is nothing but a tool, and the real power lies in the hands of those who dare to use it wisely.",
  "In the middle of difficulty lies opportunity. Every great developer you know got there by solving problems they thought were impossible at first.",
  "Any sufficiently advanced technology is indistinguishable from magic. We live in an era where yesterday's science fiction is today's engineering challenge.",
  "Code is like humor. When you have to explain it, it is bad. Write clean code that tells a story, and let the machine do the talking.",
  "The Internet is the first thing that humanity has built that humanity does not understand. It is the largest experiment in anarchy that we have ever had.",
  "First solve the problem, then write the code. A programmer who jumps into coding without a plan is like a sailor without a compass.",
  "Talk is cheap. Show me the code. The open source movement has proven that collaboration and transparency build better software than secrecy ever could.",
  "The only way to do great work is to love what you do. If you have not found it yet, keep looking and do not settle for less than extraordinary.",
  "Artificial intelligence is the new electricity. Just as electricity transformed industries a century ago, AI will transform every aspect of modern life.",
  "The computer was born to solve problems that did not exist before. Every solution creates new questions, and that is what keeps innovation alive.",
  "Simplicity is the ultimate sophistication. The most elegant code is not the one that does the most, but the one that does exactly what is needed.",
  "Data is the new oil. But unlike oil, data grows more valuable the more you refine and connect it across systems and platforms.",
  "The best error message is the one that never shows up. Thoughtful design anticipates mistakes before they happen and guides users toward success.",
  "Programs must be written for people to read, and only incidentally for machines to execute. Readability is not a luxury, it is a requirement.",
  "Every expert was once a beginner. The journey of a thousand miles begins with a single step, and every master coder once wrote their first hello world.",
  "The cloud is just someone else's computer, but that simple abstraction has revolutionized how we build, deploy, and scale applications worldwide.",
  "Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are not smart enough to debug it.",
  "Innovation distinguishes between a leader and a follower. The tech companies that thrive are those that constantly reinvent themselves.",
  "Privacy is not about having something to hide. It is about having the fundamental right to control what you reveal about yourself to the world.",
  "The function of good software is to make the complex appear to be simple. Behind every smooth user experience lies layers of careful engineering.",
  "Cybersecurity is not just about technology. It is about people, processes, and staying one step ahead of those who wish to do harm.",
  "Machine learning is automating automation itself. We are building systems that learn and improve without being explicitly programmed for every scenario.",
  "Responsive design is not just a technical strategy. It is a philosophy that puts users first regardless of their screen size or device.",
  "Open source is not just about code. It is a movement that believes in the power of community, shared knowledge, and collective problem solving.",
  "The web is more a social creation than a technical one. It was designed to help people work together, and that original vision still guides its evolution.",
];

// ─── Game Phase Type ─────────────────────────────────────────────────────────

type GamePhase =
  | 'menu'
  | 'mode-select'
  | 'lobby'
  | 'countdown'
  | 'racing'
  | 'finished';

// ─── AI Difficulty Presets ───────────────────────────────────────────────────

const AI_PRESETS = [
  { label: 'Easy', value: 0.2, wpm: '25-35 WPM', color: 'text-green-500' },
  { label: 'Medium', value: 0.5, wpm: '40-55 WPM', color: 'text-yellow-500' },
  { label: 'Hard', value: 0.8, wpm: '65-85 WPM', color: 'text-red-500' },
  { label: 'Insane', value: 0.95, wpm: '90-120 WPM', color: 'text-purple-500' },
];

// ─── Helper: Pick a random passage ──────────────────────────────────────────

function pickPassage(seed?: number): string {
  if (seed !== undefined) {
    return PASSAGES[Math.abs(seed) % PASSAGES.length];
  }
  return PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
}

// ─── Helper: Calculate WPM ──────────────────────────────────────────────────

function calculateWPM(charsTyped: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  const words = charsTyped / 5; // Standard: 5 chars = 1 word
  return Math.round(words / minutes);
}

// ─── SVG Race Track Component ───────────────────────────────────────────────

function RaceTrack({
  p1Progress,
  p2Progress,
  p1Name,
  p2Name,
  p1WPM = 0,
  p2WPM = 0,
  p1Color = 'emerald',
  p2Color = 'cyan',
}: {
  p1Progress: number;
  p2Progress: number;
  p1Name: string;
  p2Name: string;
  p1WPM?: number;
  p2WPM?: number;
  p1Color?: string;
  p2Color?: string;
}) {
  const svgColors: Record<string, { fill: string; stroke: string; lane: string; text: string }> = {
    emerald: { fill: '#10b981', stroke: '#059669', lane: 'rgba(16,185,129,0.12)', text: 'text-emerald-600 dark:text-emerald-400' },
    cyan: { fill: '#06b6d4', stroke: '#0891b2', lane: 'rgba(6,182,212,0.12)', text: 'text-cyan-600 dark:text-cyan-400' },
    violet: { fill: '#8b5cf6', stroke: '#7c3aed', lane: 'rgba(139,92,246,0.12)', text: 'text-violet-600 dark:text-violet-400' },
    rose: { fill: '#f43f5e', stroke: '#e11d48', lane: 'rgba(244,63,94,0.12)', text: 'text-rose-600 dark:text-rose-400' },
  };

  const c1 = svgColors[p1Color] || svgColors.emerald;
  const c2 = svgColors[p2Color] || svgColors.cyan;

  // Track layout: 40px per lane, 20px padding top/bottom
  const trackWidth = 600;
  const laneHeight = 40;
  const trackPadding = 16;
  const totalHeight = trackPadding * 2 + laneHeight * 2 + 8; // 8px gap between lanes

  const startX = 50;
  const finishX = trackWidth - 20;
  const trackLen = finishX - startX;

  const p1X = startX + (trackLen * Math.min(100, p1Progress)) / 100;
  const p2X = startX + (trackLen * Math.min(100, p2Progress)) / 100;

  const lane1Y = trackPadding;
  const lane2Y = trackPadding + laneHeight + 8;

  return (
    <div className="space-y-1">
      {/* Player labels with WPM */}
      <div className="flex items-center justify-between text-xs font-medium px-1">
        <div className="flex items-center gap-2">
          <span className={cn('truncate max-w-[100px]', c1.text)}>{p1Name}</span>
          <span className="tabular-nums text-muted-foreground">{p1WPM} WPM</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="tabular-nums text-muted-foreground">{p2WPM} WPM</span>
          <span className={cn('truncate max-w-[100px]', c2.text)}>{p2Name}</span>
        </div>
      </div>

      {/* SVG Race Track */}
      <svg
        viewBox={`0 0 ${trackWidth} ${totalHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '120px' }}
      >
        {/* Track background */}
        <rect x="0" y="0" width={trackWidth} height={totalHeight} rx="12" fill="currentColor" className="text-muted/30" />

        {/* Lane 1 */}
        <rect x={startX - 4} y={lane1Y} width={trackLen + 8} height={laneHeight} rx="6" fill={c1.lane} />
        {/* Lane 2 */}
        <rect x={startX - 4} y={lane2Y} width={trackLen + 8} height={laneHeight} rx="6" fill={c2.lane} />

        {/* Lane divider dashes */}
        {Array.from({ length: 20 }).map((_, i) => {
          const dx = startX + (trackLen / 20) * i;
          const midY = lane1Y + laneHeight + 4;
          return (
            <rect key={i} x={dx} y={midY} width={trackLen / 40} height={1} fill="currentColor" className="text-muted-foreground/30" rx="0.5" />
          );
        })}

        {/* Start line */}
        <line x1={startX} y1={lane1Y - 2} x2={startX} y2={lane2Y + laneHeight + 2} stroke="currentColor" className="text-muted-foreground/40" strokeWidth="2" strokeDasharray="4 3" />
        <text x={startX} y={lane1Y - 5} textAnchor="middle" fill="currentColor" className="text-muted-foreground/50" fontSize="8" fontWeight="600">START</text>

        {/* Finish line (checkered pattern) */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={`fin-${i}`}
            x={finishX - 2}
            y={lane1Y + i * ((laneHeight * 2 + 8) / 8)}
            width={6}
            height={(laneHeight * 2 + 8) / 8}
            fill={i % 2 === 0 ? 'currentColor' : 'transparent'}
            className="text-muted-foreground/40"
          />
        ))}
        <text x={finishX + 2} y={lane1Y - 5} textAnchor="middle" fill="currentColor" className="text-muted-foreground/50" fontSize="8" fontWeight="600">FINISH</text>

        {/* Distance markers at 25%, 50%, 75% */}
        {[25, 50, 75].map((pct) => {
          const mx = startX + (trackLen * pct) / 100;
          return (
            <g key={pct}>
              <line x1={mx} y1={lane1Y} x2={mx} y2={lane2Y + laneHeight} stroke="currentColor" className="text-muted-foreground/15" strokeWidth="1" strokeDasharray="3 3" />
              <text x={mx} y={totalHeight - 3} textAnchor="middle" fill="currentColor" className="text-muted-foreground/30" fontSize="7">{pct}%</text>
            </g>
          );
        })}

        {/* Player 1 exhaust trail */}
        {p1Progress > 2 && (
          <g style={{ transition: 'transform 0.3s ease-out', transform: `translateX(${p1X - startX}px)` }}>
            <circle cx={startX - 16} cy={lane1Y + 15} r="2.5" fill={c1.fill} opacity="0.15">
              <animate attributeName="r" values="2.5;4;2.5" dur="0.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={startX - 22} cy={lane1Y + 14} r="2" fill={c1.fill} opacity="0.08">
              <animate attributeName="r" values="2;3.5;2" dur="0.8s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Player 1 car */}
        <g style={{ transition: 'transform 0.3s ease-out', transform: `translateX(${p1X - startX}px)` }}>
          {/* Car body */}
          <rect x={startX - 12} y={lane1Y + 8} width={24} height={14} rx="4" fill={c1.fill} />
          {/* Car roof */}
          <rect x={startX - 6} y={lane1Y + 5} width={12} height={8} rx="3" fill={c1.stroke} />
          {/* Wheels */}
          <circle cx={startX - 7} cy={lane1Y + 24} r="3" fill="#374151" />
          <circle cx={startX + 7} cy={lane1Y + 24} r="3" fill="#374151" />
          {/* Wheel spin lines */}
          {p1Progress > 0 && p1Progress < 100 && (
            <>
              <line x1={startX - 10} y1={lane1Y + 24} x2={startX - 4} y2={lane1Y + 24} stroke="#6b7280" strokeWidth="0.5" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0;0.5" dur="0.3s" repeatCount="indefinite" />
              </line>
              <line x1={startX + 4} y1={lane1Y + 24} x2={startX + 10} y2={lane1Y + 24} stroke="#6b7280" strokeWidth="0.5" opacity="0.5">
                <animate attributeName="opacity" values="0;0.5;0" dur="0.3s" repeatCount="indefinite" />
              </line>
            </>
          )}
          {/* Headlight */}
          <rect x={startX + 10} y={lane1Y + 11} width="3" height="4" rx="1" fill="#fbbf24" opacity="0.9" />
          {/* Speed glow when moving fast */}
          {p1WPM > 50 && (
            <rect x={startX + 12} y={lane1Y + 10} width="5" height="6" rx="2" fill="#fbbf24" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="0.5s" repeatCount="indefinite" />
            </rect>
          )}
          {/* Progress text */}
          <text x={startX} y={lane1Y + 38} textAnchor="middle" fill={c1.fill} fontSize="8" fontWeight="700">{Math.round(p1Progress)}%</text>
        </g>

        {/* Player 2 exhaust trail */}
        {p2Progress > 2 && (
          <g style={{ transition: 'transform 0.3s ease-out', transform: `translateX(${p2X - startX}px)` }}>
            <circle cx={startX - 16} cy={lane2Y + 15} r="2.5" fill={c2.fill} opacity="0.15">
              <animate attributeName="r" values="2.5;4;2.5" dur="0.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={startX - 22} cy={lane2Y + 14} r="2" fill={c2.fill} opacity="0.08">
              <animate attributeName="r" values="2;3.5;2" dur="0.8s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Player 2 car */}
        <g style={{ transition: 'transform 0.3s ease-out', transform: `translateX(${p2X - startX}px)` }}>
          {/* Car body */}
          <rect x={startX - 12} y={lane2Y + 8} width={24} height={14} rx="4" fill={c2.fill} />
          {/* Car roof */}
          <rect x={startX - 6} y={lane2Y + 5} width={12} height={8} rx="3" fill={c2.stroke} />
          {/* Wheels */}
          <circle cx={startX - 7} cy={lane2Y + 24} r="3" fill="#374151" />
          <circle cx={startX + 7} cy={lane2Y + 24} r="3" fill="#374151" />
          {/* Wheel spin lines */}
          {p2Progress > 0 && p2Progress < 100 && (
            <>
              <line x1={startX - 10} y1={lane2Y + 24} x2={startX - 4} y2={lane2Y + 24} stroke="#6b7280" strokeWidth="0.5" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0;0.5" dur="0.3s" repeatCount="indefinite" />
              </line>
              <line x1={startX + 4} y1={lane2Y + 24} x2={startX + 10} y2={lane2Y + 24} stroke="#6b7280" strokeWidth="0.5" opacity="0.5">
                <animate attributeName="opacity" values="0;0.5;0" dur="0.3s" repeatCount="indefinite" />
              </line>
            </>
          )}
          {/* Headlight */}
          <rect x={startX + 10} y={lane2Y + 11} width="3" height="4" rx="1" fill="#fbbf24" opacity="0.9" />
          {/* Speed glow when moving fast */}
          {p2WPM > 50 && (
            <rect x={startX + 12} y={lane2Y + 10} width="5" height="6" rx="2" fill="#fbbf24" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="0.5s" repeatCount="indefinite" />
            </rect>
          )}
          {/* Progress text */}
          <text x={startX} y={lane2Y + 38} textAnchor="middle" fill={c2.fill} fontSize="8" fontWeight="700">{Math.round(p2Progress)}%</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Speedometer Component ─────────────────────────────────────────────────

function Speedometer({ wpm, maxWpm = 150 }: { wpm: number; maxWpm?: number }) {
  const clamped = Math.min(wpm, maxWpm);
  // Arc from -135 to +135 degrees (270 degree sweep)
  const angle = -135 + (clamped / maxWpm) * 270;
  const needleRad = (angle * Math.PI) / 180;
  const cx = 50, cy = 55, r = 38;
  const nx = cx + Math.cos(needleRad) * (r - 6);
  const ny = cy + Math.sin(needleRad) * (r - 6);

  // Color based on WPM
  const color = wpm >= 80 ? '#10b981' : wpm >= 50 ? '#f59e0b' : wpm >= 25 ? '#3b82f6' : '#6b7280';

  // Arc path helper
  const arcPath = (startDeg: number, endDeg: number, radius: number) => {
    const s = (startDeg * Math.PI) / 180;
    const e = (endDeg * Math.PI) / 180;
    const sx = cx + Math.cos(s) * radius;
    const sy = cy + Math.sin(s) * radius;
    const ex = cx + Math.cos(e) * radius;
    const ey = cy + Math.sin(e) * radius;
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${radius} ${radius} 0 ${large} 1 ${ex} ${ey}`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 70" className="w-20 h-14 sm:w-24 sm:h-16">
        {/* Background arc */}
        <path d={arcPath(-135, 135, r)} fill="none" stroke="currentColor" className="text-muted-foreground/15" strokeWidth="5" strokeLinecap="round" />
        {/* Filled arc */}
        <path d={arcPath(-135, angle, r)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" style={{ transition: 'all 0.3s ease-out' }} />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="2" strokeLinecap="round" style={{ transition: 'all 0.3s ease-out' }} />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill={color} style={{ transition: 'fill 0.3s' }} />
        {/* WPM text */}
        <text x={cx} y={cy + 14} textAnchor="middle" fill="currentColor" className="text-foreground" fontSize="10" fontWeight="800">{wpm}</text>
      </svg>
      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold -mt-1">WPM</span>
    </div>
  );
}

// ─── Live Stats Bar ─────────────────────────────────────────────────────────

function LiveStats({
  wpm,
  accuracy,
  elapsed,
}: {
  wpm: number;
  accuracy: number;
  elapsed: number;
}) {
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6">
      <div className="flex items-center gap-1.5">
        <Gauge className="w-4 h-4 text-emerald-500" />
        <div className="text-center">
          <motion.span
            key={wpm}
            initial={{ scale: 1.3, color: '#10b981' }}
            animate={{ scale: 1, color: 'inherit' }}
            className="text-lg sm:text-xl font-black tabular-nums"
          >
            {wpm}
          </motion.span>
          <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">WPM</span>
        </div>
      </div>

      <div className="w-px h-6 bg-border" />

      <div className="flex items-center gap-1.5">
        <Target className="w-4 h-4 text-blue-500" />
        <div className="text-center">
          <span
            className={cn(
              'text-lg sm:text-xl font-black tabular-nums',
              accuracy >= 95
                ? 'text-green-500'
                : accuracy >= 85
                ? 'text-yellow-500'
                : 'text-red-500'
            )}
          >
            {accuracy}%
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">ACC</span>
        </div>
      </div>

      <div className="w-px h-6 bg-border" />

      <div className="flex items-center gap-1.5">
        <Timer className="w-4 h-4 text-orange-500" />
        <span className="text-lg sm:text-xl font-black tabular-nums">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

// ─── Typing Display Component ───────────────────────────────────────────────

function TypingDisplay({
  passage,
  cursorPos,
  errors,
  isActive,
  label,
  className,
  flipped,
}: {
  passage: string;
  cursorPos: number;
  errors: Set<number>;
  isActive: boolean;
  label?: string;
  className?: string;
  flipped?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorSpanRef = useRef<HTMLSpanElement>(null);
  const [pulse, setPulse] = useState(false);
  const prevPosRef = useRef(cursorPos);

  // Auto-scroll to keep cursor visible
  useEffect(() => {
    if (cursorSpanRef.current && containerRef.current) {
      const cursor = cursorSpanRef.current;
      const container = containerRef.current;
      const cursorRect = cursor.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (
        cursorRect.top < containerRect.top + 20 ||
        cursorRect.bottom > containerRect.bottom - 20
      ) {
        cursor.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [cursorPos]);

  // Visual typing pulse indicator
  useEffect(() => {
    if (cursorPos !== prevPosRef.current) {
      prevPosRef.current = cursorPos;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 150);
      return () => clearTimeout(t);
    }
  }, [cursorPos]);

  // Find the current word boundaries for highlighting
  const currentWordRange = useMemo(() => {
    if (cursorPos >= passage.length) return { start: -1, end: -1 };
    let start = cursorPos;
    let end = cursorPos;
    while (start > 0 && passage[start - 1] !== ' ') start--;
    while (end < passage.length && passage[end] !== ' ') end++;
    return { start, end };
  }, [passage, cursorPos]);

  return (
    <div className={cn('relative', flipped && 'rotate-180', className)}>
      {label && (
        <div
          className={cn(
            'text-xs font-semibold uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5',
            isActive ? 'text-emerald-500' : 'text-muted-foreground'
          )}
        >
          {label}
          {/* Typing pulse indicator */}
          {isActive && (
            <span
              className={cn(
                'inline-block w-2 h-2 rounded-full transition-all duration-150',
                pulse
                  ? 'bg-emerald-500 scale-125 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                  : 'bg-emerald-500/30 scale-100'
              )}
            />
          )}
        </div>
      )}
      <div
        ref={containerRef}
        className={cn(
          'relative rounded-xl p-4 sm:p-5 text-base sm:text-lg leading-relaxed font-mono',
          'max-h-[200px] sm:max-h-[240px] overflow-y-auto',
          'border-2 transition-colors duration-200',
          'scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent',
          isActive
            ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10'
            : 'border-border bg-muted/30'
        )}
      >
        {/* Typing pulse ring */}
        {isActive && pulse && (
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-emerald-500/40 animate-ping pointer-events-none" />
        )}

        <div className="select-none">
          {passage.split('').map((char, i) => {
            const isTyped = i < cursorPos;
            const isCurrent = i === cursorPos;
            const isError = errors.has(i);
            const isInCurrentWord = isActive && !isTyped && i >= currentWordRange.start && i < currentWordRange.end;

            return (
              <span
                key={i}
                ref={isCurrent ? cursorSpanRef : undefined}
                className={cn(
                  'transition-colors duration-75',
                  isTyped && !isError && 'text-emerald-500 dark:text-emerald-400',
                  isTyped && isError && 'text-red-500 bg-red-500/20 rounded-sm',
                  isCurrent && isActive && 'bg-emerald-500/30 border-l-[3px] border-emerald-500 text-foreground font-black text-[1.2em] ring-2 ring-emerald-500/40 ring-offset-0 rounded-sm shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-[cursor-glow_1s_ease-in-out_infinite]',
                  !isTyped && !isCurrent && !isInCurrentWord && 'text-muted-foreground/60',
                  isInCurrentWord && !isCurrent && 'text-foreground/90 font-semibold'
                )}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Game Component ────────────────────────────────────────────────────

export default function SpeedTypingRace() {
  const navigate = useNavigate();

  // ─── State ──────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [mode, setMode] = useState<GameMode>('solo');
  const [passage, setPassage] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  // Player 1 state
  const [p1Pos, setP1Pos] = useState(0);
  const [p1Errors, setP1Errors] = useState<Set<number>>(new Set());
  const [p1TotalKeystrokes, setP1TotalKeystrokes] = useState(0);
  const [p1WPM, setP1WPM] = useState(0);
  const [p1Finished, setP1Finished] = useState(false);
  const [p1FinishTime, setP1FinishTime] = useState(0);

  // Player 2 / AI state
  const [p2Pos, setP2Pos] = useState(0);
  const [p2Errors, setP2Errors] = useState<Set<number>>(new Set());
  const [p2WPM, setP2WPM] = useState(0);
  const [p2Finished, setP2Finished] = useState(false);
  const [p2FinishTime, setP2FinishTime] = useState(0);

  // Timing
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Local mode: which player has focus
  const [localActivePlayer, setLocalActivePlayer] = useState<1 | 2>(1);

  // Online opponent name
  const [onlineOpponentName, setOnlineOpponentName] = useState('');

  // Refs
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const hiddenInput2Ref = useRef<HTMLInputElement>(null);
  const aiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const p1PosRef = useRef(0);
  const p2PosRef = useRef(0);
  const passageRef = useRef('');
  const startTimeRef = useRef(0);

  // ─── Hooks ──────────────────────────────────────────────────────────────
  const { player, getPlayerId, getDisplayName } = usePlayerProfile();
  const { calculateElo, getTierForRating } = useRankSystem();
  const { streak, multiplier, recordWin, recordLoss } = useStreakTracker();
  const {
    entries: leaderboardEntries,
    loading: leaderboardLoading,
    timeRange,
    setTimeRange,
    submitScore,
  } = useLeaderboard({ gameSlug: 'speed-typing-race' });

  const ai = useGameAI({
    difficulty: aiDifficulty,
    baseResponseTime: 2000,
  });

  const gameRoom = useGameRoom({
    gameSlug: 'speed-typing-race',
    playerName: getDisplayName(),
    onPlayerJoined: (name) => {
      setOnlineOpponentName(name);
    },
    onGameStart: (payload) => {
      const p = payload.passage as string;
      setPassage(p);
      passageRef.current = p;
      setPhase('countdown');
    },
    onBroadcast: (event, payload) => {
      if (event === 'progress') {
        setP2Pos(payload.pos as number);
        p2PosRef.current = payload.pos as number;
        setP2WPM(payload.wpm as number);
        if (payload.finished) {
          setP2Finished(true);
          setP2FinishTime(payload.time as number);
        }
      }
    },
  });

  // ─── Derived ────────────────────────────────────────────────────────────
  const p1Progress = passage.length > 0 ? (p1Pos / passage.length) * 100 : 0;
  const p2Progress = passage.length > 0 ? (p2Pos / passage.length) * 100 : 0;

  const p1Accuracy = useMemo(() => {
    if (p1TotalKeystrokes === 0) return 100;
    return Math.round(((p1TotalKeystrokes - p1Errors.size) / p1TotalKeystrokes) * 100);
  }, [p1TotalKeystrokes, p1Errors.size]);

  const p1Score = useMemo(() => {
    return Math.round(p1WPM * (p1Accuracy / 100));
  }, [p1WPM, p1Accuracy]);

  const p2Score = useMemo(() => {
    const p2Acc = passage.length > 0 ? ((passage.length - p2Errors.size) / passage.length) * 100 : 100;
    return Math.round(p2WPM * (p2Acc / 100));
  }, [p2WPM, p2Errors.size, passage.length]);

  const playerWon = useMemo(() => {
    if (!p1Finished && !p2Finished) return false;
    if (p1Finished && !p2Finished) return true;
    if (!p1Finished && p2Finished) return false;
    return p1Score >= p2Score;
  }, [p1Finished, p2Finished, p1Score, p2Score]);

  // ─── Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'racing' && startTime > 0) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, startTime]);

  // ─── AI Opponent Logic ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'racing' || mode !== 'solo') return;

    // AI typing: simulate realistic WPM
    // difficulty 0.2 => ~30 WPM, 0.5 => ~50 WPM, 0.8 => ~75 WPM, 0.95 => ~105 WPM
    const targetWPM = 25 + aiDifficulty * 85;
    // chars per second = (WPM * 5) / 60
    const cps = (targetWPM * 5) / 60;
    // Interval in ms for 1 character
    const interval = 1000 / cps;
    // Add variance: +/- 20%
    const variance = 0.2;

    aiIntervalRef.current = setInterval(() => {
      if (p2PosRef.current >= passageRef.current.length) {
        if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
        return;
      }

      // Occasionally add randomness
      const jitter = 1 + (Math.random() - 0.5) * variance * 2;
      const actualInterval = interval * jitter;

      // AI makes occasional errors at lower difficulty
      const errorChance = (1 - aiDifficulty) * 0.03;
      const madeError = Math.random() < errorChance;

      if (madeError) {
        setP2Errors((prev) => {
          const next = new Set(prev);
          next.add(p2PosRef.current);
          return next;
        });
      }

      const newPos = p2PosRef.current + 1;
      p2PosRef.current = newPos;
      setP2Pos(newPos);

      // Calculate AI WPM
      const aiElapsed = Date.now() - startTimeRef.current;
      const aiWpm = calculateWPM(newPos, aiElapsed);
      setP2WPM(aiWpm);

      if (newPos >= passageRef.current.length) {
        setP2Finished(true);
        setP2FinishTime(aiElapsed);
        if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
      }
    }, interval);

    return () => {
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    };
  }, [phase, mode, aiDifficulty]);

  // ─── Check game end ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'racing') return;

    const bothDone = p1Finished && (mode === 'solo' || mode === 'online' ? p2Finished || p1Finished : true);

    if (p1Finished && mode !== 'local') {
      // In solo/online: end as soon as player finishes
      endGame();
    } else if (mode === 'local' && p1Finished && p2Finished) {
      endGame();
    }
  }, [p1Finished, p2Finished, phase, mode]);

  // ─── End Game Handler ─────────────────────────────────────────────────

  const endGame = useCallback(() => {
    if (phase === 'finished') return;
    setPhase('finished');
    if (timerRef.current) clearInterval(timerRef.current);
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);

    // Submit score and track streak for online/solo
    if (mode === 'online' || mode === 'solo') {
      const won = playerWon;
      if (won) {
        recordWin();
      } else {
        recordLoss();
      }

      // Submit leaderboard score
      submitScore({
        playerId: getPlayerId(),
        playerName: getDisplayName(),
        gameSlug: 'speed-typing-race',
        score: p1Score,
        gameMode: mode,
        metadata: {
          wpm: p1WPM,
          accuracy: p1Accuracy,
          passage: passage.substring(0, 50),
        },
      });
    }
  }, [
    phase, mode, playerWon, p1Score, p1WPM, p1Accuracy, passage,
    recordWin, recordLoss, submitScore, getPlayerId, getDisplayName,
  ]);

  // ─── Online: broadcast progress ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'racing' || mode !== 'online') return;
    const interval = setInterval(() => {
      gameRoom.broadcast('progress', {
        pos: p1PosRef.current,
        wpm: p1WPM,
        finished: p1Finished,
        time: elapsed,
      });
    }, 200);
    return () => clearInterval(interval);
  }, [phase, mode, p1WPM, p1Finished, elapsed, gameRoom]);

  // ─── Input Handler ────────────────────────────────────────────────────

  const handleKeyInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, playerNum: 1 | 2) => {
      if (phase !== 'racing') return;
      const value = e.target.value;
      const pos = playerNum === 1 ? p1PosRef.current : p2PosRef.current;
      const psg = passageRef.current;

      if (pos >= psg.length) return;

      // The input value length tells us how many chars were typed
      const lastChar = value[value.length - 1];

      if (lastChar === undefined) {
        // Backspace: do nothing, we do not allow corrections
        e.target.value = '';
        return;
      }

      const expectedChar = psg[pos];
      const isCorrect = lastChar === expectedChar;

      if (playerNum === 1) {
        setP1TotalKeystrokes((prev) => prev + 1);
        if (!isCorrect) {
          setP1Errors((prev) => {
            const next = new Set(prev);
            next.add(pos);
            return next;
          });
        }
        const newPos = pos + 1;
        p1PosRef.current = newPos;
        setP1Pos(newPos);

        // Update WPM
        const elapsedNow = Date.now() - startTimeRef.current;
        setP1WPM(calculateWPM(newPos, elapsedNow));

        if (newPos >= psg.length) {
          setP1Finished(true);
          setP1FinishTime(elapsedNow);
        }
      } else {
        // Local player 2
        if (!isCorrect) {
          setP2Errors((prev) => {
            const next = new Set(prev);
            next.add(pos);
            return next;
          });
        }
        const newPos = pos + 1;
        p2PosRef.current = newPos;
        setP2Pos(newPos);

        const elapsedNow = Date.now() - startTimeRef.current;
        setP2WPM(calculateWPM(newPos, elapsedNow));

        if (newPos >= psg.length) {
          setP2Finished(true);
          setP2FinishTime(elapsedNow);
        }
      }

      // Clear input so it is always a single character
      e.target.value = '';
    },
    [phase]
  );

  // ─── Start Game ───────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    const now = Date.now();
    setStartTime(now);
    startTimeRef.current = now;
    setPhase('racing');

    // Focus the hidden input
    setTimeout(() => {
      if (mode === 'local') {
        if (localActivePlayer === 1) {
          hiddenInputRef.current?.focus();
        } else {
          hiddenInput2Ref.current?.focus();
        }
      } else {
        hiddenInputRef.current?.focus();
      }
    }, 50);
  }, [mode, localActivePlayer]);

  // ─── Reset Game ───────────────────────────────────────────────────────

  const resetGame = useCallback(() => {
    setP1Pos(0);
    setP1Errors(new Set());
    setP1TotalKeystrokes(0);
    setP1WPM(0);
    setP1Finished(false);
    setP1FinishTime(0);
    setP2Pos(0);
    setP2Errors(new Set());
    setP2WPM(0);
    setP2Finished(false);
    setP2FinishTime(0);
    setElapsed(0);
    setStartTime(0);
    p1PosRef.current = 0;
    p2PosRef.current = 0;
    setLocalActivePlayer(1);
    if (timerRef.current) clearInterval(timerRef.current);
    if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
  }, []);

  // ─── Mode Selection ───────────────────────────────────────────────────

  const handleModeSelect = useCallback(
    (selectedMode: GameMode) => {
      setMode(selectedMode);
      resetGame();

      if (selectedMode === 'solo') {
        // Show difficulty picker
        setShowSettings(true);
        return;
      }

      setShowSettings(false);

      if (selectedMode === 'online') {
        setPhase('lobby');
      } else {
        // Local mode: start immediately
        const p = pickPassage();
        setPassage(p);
        passageRef.current = p;
        setPhase('countdown');
      }
    },
    [resetGame]
  );

  // ─── Online: Start game as host ───────────────────────────────────────

  const handleOnlineStart = useCallback(() => {
    const p = pickPassage();
    setPassage(p);
    passageRef.current = p;

    // Broadcast the passage and start signal
    gameRoom.broadcast('game_start', { passage: p });
    setPhase('countdown');
  }, [gameRoom]);

  // ─── Play Again ───────────────────────────────────────────────────────

  const handlePlayAgain = useCallback(() => {
    resetGame();
    const p = pickPassage();
    setPassage(p);
    passageRef.current = p;
    setPhase('countdown');
  }, [resetGame]);

  // ─── Share ────────────────────────────────────────────────────────────

  const handleShare = useCallback(() => {
    const text = `Speed Typing Race on TechTrendi Arcade!\n${p1WPM} WPM | ${p1Accuracy}% accuracy | Score: ${p1Score}\nhttps://techtrendi.com/arcade/speed-typing-race`;
    if (navigator.share) {
      navigator.share({ title: 'Speed Typing Race', text });
    } else {
      navigator.clipboard.writeText(text);
    }
  }, [p1WPM, p1Accuracy, p1Score]);

  // ─── Local mode: handle tab switching between players ─────────────────

  const handleLocalSwitch = useCallback(() => {
    if (mode !== 'local') return;
    setLocalActivePlayer((prev) => {
      const next = prev === 1 ? 2 : 1;
      setTimeout(() => {
        if (next === 1) {
          hiddenInputRef.current?.focus();
        } else {
          hiddenInput2Ref.current?.focus();
        }
      }, 50);
      return next as 1 | 2;
    });
  }, [mode]);

  // ─── Opponent name ────────────────────────────────────────────────────

  const opponentName = useMemo(() => {
    if (mode === 'solo') return ai.aiName;
    if (mode === 'online') return onlineOpponentName || 'Opponent';
    return 'Player 2';
  }, [mode, ai.aiName, onlineOpponentName]);

  // ─── ELO calculation for display ──────────────────────────────────────

  const eloResult = useMemo(() => {
    if (phase !== 'finished' || mode === 'local') return null;
    const playerRating = player?.eloRating ?? ELO.DEFAULT_RATING;
    const opponentRating = mode === 'solo' ? ELO.DEFAULT_RATING : (player?.eloRating ?? ELO.DEFAULT_RATING);
    return calculateElo(
      playerRating,
      opponentRating,
      playerWon,
      player?.totalGames ?? 0
    );
  }, [phase, mode, player, playerWon, calculateElo]);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <Layout>
      <SEOHead
        title="Speed Typing Race - Arcade"
        description="Race opponents in real-time typing. Test your typing speed and accuracy in this multiplayer arcade game."
        canonical="https://techtrendi.com/arcade/speed-typing-race"
      />

      <div className="container py-4 sm:py-8 max-w-3xl mx-auto px-3 sm:px-4">
        {/* Header (hidden during racing for max space) */}
        {phase !== 'racing' && (
          <div className="mb-6">
            <Link
              to="/arcade"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Arcade
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/20">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black">Speed Typing Race</h1>
                <p className="text-sm text-muted-foreground">Type fast, type accurate, win the race.</p>
              </div>
            </div>

            {/* Player info bar */}
            {player && phase !== 'menu' && phase !== 'mode-select' && (
              <div className="flex items-center gap-3 mt-3 p-2 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{player.displayName}</span>
                <RankBadge tier={player.rankTier} rating={player.eloRating} size="sm" showRating />
                {streak.current > 0 && <StreakIndicator streak={streak.current} />}
              </div>
            )}
          </div>
        )}

        {/* ─── MENU PHASE ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Hero card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 sm:p-8 text-white">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 text-center space-y-3">
                  <div className="inline-flex items-center gap-2 text-white/90 text-sm font-medium px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                    <Keyboard className="w-4 h-4" />
                    Typing Challenge
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black">Race to the Finish</h2>
                  <p className="text-white/80 max-w-md mx-auto">
                    Type faster and more accurately than your opponent. Every keystroke counts in this real-time racing battle.
                  </p>
                </div>
              </div>

              {/* How to Play */}
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
                <h3 className="font-bold text-center text-foreground flex items-center justify-center gap-2 text-base">
                  <Info className="w-5 h-5 text-emerald-500" /> How to Play
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <Keyboard className="w-5 h-5 text-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Type the passage</p>
                      <p className="text-xs text-muted-foreground">As fast and accurately as you can</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <Gauge className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-500">WPM = Speed</p>
                      <p className="text-xs text-muted-foreground">Words per minute measures your typing speed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <Target className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        <span className="text-green-500">Green</span> = correct, <span className="text-red-500">Red</span> = error
                      </p>
                      <p className="text-xs text-muted-foreground">Visual feedback on every keystroke</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <Zap className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-500">Score = WPM x Accuracy</p>
                      <p className="text-xs text-muted-foreground">Speed and precision both matter</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Car className="w-4 h-4 text-violet-500 shrink-0" />
                    <span>Race against <span className="font-semibold text-violet-500">AI</span>, a <span className="font-semibold text-cyan-500">friend locally</span>, or <span className="font-semibold text-emerald-500">online opponents</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                    <span>Streaks and ranks earned through online wins</span>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              {player && player.totalGames > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                    <div className="text-xl font-black">{player.totalGames}</div>
                    <div className="text-xs text-muted-foreground">Games</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                    <div className="text-xl font-black text-green-500">{player.totalWins}</div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50 border border-border">
                    <div className="text-xl font-black">{player.bestStreak}</div>
                    <div className="text-xs text-muted-foreground">Best Streak</div>
                  </div>
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-500/20"
                onClick={() => setPhase('mode-select')}
              >
                <Keyboard className="w-5 h-5 mr-2" />
                Start Racing
              </Button>

              {/* Leaderboard */}
              <Leaderboard
                entries={leaderboardEntries}
                loading={leaderboardLoading}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                title="Top Typists"
                compact
              />
            </motion.div>
          )}

          {/* ─── MODE SELECT PHASE ─────────────────────────────────────── */}
          {phase === 'mode-select' && (
            <motion.div
              key="mode-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <button
                onClick={() => setPhase('menu')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h2 className="text-xl font-bold text-center">Choose Mode</h2>

              <GameModeSelector onSelect={handleModeSelect} />

              {/* AI Difficulty settings (shown after selecting solo) */}
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-xl border border-border p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">AI Difficulty</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AI_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setAiDifficulty(preset.value);
                          ai.setDifficulty(preset.value);
                          handleModeSelect('solo');
                        }}
                        className={cn(
                          'p-3 rounded-xl border-2 text-center transition-all hover:scale-[1.02]',
                          aiDifficulty === preset.value
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-border hover:border-emerald-500/50'
                        )}
                      >
                        <div className={cn('font-bold text-sm', preset.color)}>
                          {preset.label}
                        </div>
                        <div className="text-xs text-muted-foreground">{preset.wpm}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ─── LOBBY PHASE (Online) ──────────────────────────────────── */}
          {phase === 'lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RoomLobby
                roomCode={gameRoom.roomCode}
                isHost={gameRoom.isHost}
                opponentJoined={gameRoom.opponentJoined}
                opponentName={onlineOpponentName}
                onCreateRoom={gameRoom.createRoom}
                onJoinRoom={gameRoom.joinRoom}
                onStartGame={handleOnlineStart}
                onBack={() => {
                  gameRoom.leaveRoom();
                  setPhase('mode-select');
                }}
              />
            </motion.div>
          )}

          {/* ─── COUNTDOWN PHASE ───────────────────────────────────────── */}
          {phase === 'countdown' && (
            <CountdownOverlay onComplete={startGame} />
          )}

          {/* ─── RACING PHASE ──────────────────────────────────────────── */}
          {phase === 'racing' && (
            <motion.div
              key="racing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 sm:space-y-4"
            >
              {/* Minimal header during race */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    resetGame();
                    setPhase('menu');
                    if (mode === 'online') gameRoom.leaveRoom();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Quit
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {mode === 'solo' ? 'vs AI' : mode === 'local' ? 'Local' : 'Online'}
                  </span>
                </div>
              </div>

              {/* Race Track */}
              <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                <RaceTrack
                  p1Progress={p1Progress}
                  p2Progress={p2Progress}
                  p1Name={getDisplayName()}
                  p2Name={opponentName}
                  p1WPM={p1WPM}
                  p2WPM={p2WPM}
                  p1Color="emerald"
                  p2Color={mode === 'solo' ? 'violet' : 'cyan'}
                />
              </div>

              {/* Live Stats with Speedometer */}
              <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
                <div className="flex items-center justify-center gap-3 sm:gap-5">
                  <Speedometer wpm={p1WPM} />
                  <div className="w-px h-14 bg-border" />
                  <div className="flex flex-col items-center gap-1">
                    {/* Large WPM counter */}
                    <div className="flex items-baseline gap-1.5">
                      <motion.span
                        key={p1WPM}
                        initial={{ scale: 1.2, color: '#10b981' }}
                        animate={{ scale: 1, color: 'inherit' }}
                        transition={{ duration: 0.2 }}
                        className="text-3xl sm:text-4xl font-black tabular-nums leading-none"
                      >
                        {p1WPM}
                      </motion.span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-500 uppercase">WPM</span>
                    </div>
                    {/* Secondary stats row */}
                    <div className="flex items-center gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-blue-500" />
                        <span
                          className={cn(
                            'font-bold tabular-nums',
                            p1Accuracy >= 95 ? 'text-green-500' : p1Accuracy >= 85 ? 'text-yellow-500' : 'text-red-500'
                          )}
                        >
                          {p1Accuracy}%
                        </span>
                      </div>
                      <span className="text-muted-foreground/40">|</span>
                      <div className="flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-orange-500" />
                        <span className="font-bold tabular-nums text-foreground">
                          {Math.floor(elapsed / 60000)}:{Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typing Area */}
              {mode === 'local' ? (
                // ─── Local: Split screen ────────────────────────────────
                <div className="space-y-3">
                  <TypingDisplay
                    passage={passage}
                    cursorPos={p1Pos}
                    errors={p1Errors}
                    isActive={localActivePlayer === 1}
                    label="Player 1"
                  />

                  {/* Switch player button */}
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLocalSwitch}
                      className="text-xs"
                    >
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Switch to Player {localActivePlayer === 1 ? 2 : 1}
                    </Button>
                  </div>

                  <TypingDisplay
                    passage={passage}
                    cursorPos={p2Pos}
                    errors={p2Errors}
                    isActive={localActivePlayer === 2}
                    label="Player 2"
                  />

                  {/* Hidden inputs for local mode */}
                  <input
                    ref={hiddenInputRef}
                    type="text"
                    className="sr-only"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    onChange={(e) => handleKeyInput(e, 1)}
                    disabled={localActivePlayer !== 1 || p1Finished}
                  />
                  <input
                    ref={hiddenInput2Ref}
                    type="text"
                    className="sr-only"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    onChange={(e) => handleKeyInput(e, 2)}
                    disabled={localActivePlayer !== 2 || p2Finished}
                  />
                </div>
              ) : (
                // ─── Solo / Online: Single typing area ──────────────────
                <div
                  className="relative"
                  onClick={() => hiddenInputRef.current?.focus()}
                >
                  <TypingDisplay
                    passage={passage}
                    cursorPos={p1Pos}
                    errors={p1Errors}
                    isActive={!p1Finished}
                  />

                  {/* Tap to type hint (mobile) */}
                  {p1Pos === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 dark:bg-black/40 rounded-xl backdrop-blur-[1px] cursor-pointer sm:hidden"
                    >
                      <div className="text-center text-white">
                        <Keyboard className="w-8 h-8 mx-auto mb-2 animate-bounce" />
                        <p className="text-sm font-medium">Tap to start typing</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Hidden input captures keystrokes */}
                  <input
                    ref={hiddenInputRef}
                    type="text"
                    className="absolute inset-0 opacity-0 w-full h-full cursor-default"
                    style={{ fontSize: '16px' }} // Prevents iOS zoom
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    inputMode="text"
                    onChange={(e) => handleKeyInput(e, 1)}
                    disabled={p1Finished}
                    autoFocus
                  />
                </div>
              )}

              {/* Opponent WPM (for solo/online) */}
              {mode !== 'local' && (
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-violet-500" />
                    {opponentName}: {p2WPM} WPM
                  </span>
                  {p2Finished && (
                    <span className="text-yellow-500 font-semibold animate-pulse">Finished!</span>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── FINISHED PHASE ────────────────────────────────────────── */}
          {phase === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Detailed results above GameOverScreen */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-bold text-center">Race Results</h3>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Player 1 stats */}
                  <div className="rounded-xl bg-emerald-500/10 p-3 space-y-2 text-center">
                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      {getDisplayName()}
                    </div>
                    <div className="text-3xl font-black">{p1WPM}</div>
                    <div className="text-xs text-muted-foreground">WPM</div>
                    <div className="text-sm font-semibold">
                      <span
                        className={cn(
                          p1Accuracy >= 95
                            ? 'text-green-500'
                            : p1Accuracy >= 85
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        )}
                      >
                        {p1Accuracy}%
                      </span>
                      <span className="text-muted-foreground ml-1">accuracy</span>
                    </div>
                  </div>

                  {/* Player 2 / AI stats */}
                  <div className="rounded-xl bg-cyan-500/10 p-3 space-y-2 text-center">
                    <div className="text-xs font-medium text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                      {opponentName}
                    </div>
                    <div className="text-3xl font-black">{p2WPM}</div>
                    <div className="text-xs text-muted-foreground">WPM</div>
                    <div className="text-sm font-semibold">
                      {p2Finished ? (
                        <>
                          <span className="text-muted-foreground">
                            {passage.length > 0
                              ? Math.round(
                                  ((passage.length - p2Errors.size) /
                                    passage.length) *
                                    100
                                )
                              : 100}
                            %
                          </span>
                          <span className="text-muted-foreground ml-1">accuracy</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Did not finish</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time */}
                <div className="text-center text-sm text-muted-foreground">
                  Time: {Math.floor(elapsed / 60000)}:
                  {Math.floor((elapsed % 60000) / 1000)
                    .toString()
                    .padStart(2, '0')}
                </div>
              </div>

              <GameOverScreen
                won={playerWon}
                score={p1Score}
                opponentScore={p2Score}
                eloChange={eloResult?.change}
                newRating={eloResult?.newRating}
                rankTier={eloResult ? getTierForRating(eloResult.newRating) : player?.rankTier}
                streak={streak.current}
                onPlayAgain={handlePlayAgain}
                onShare={handleShare}
                onBackToArcade={() => navigate('/arcade')}
                playerName={getDisplayName()}
                opponentName={opponentName}
              />

              {/* Leaderboard */}
              <Leaderboard
                entries={leaderboardEntries}
                loading={leaderboardLoading}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                title="Top Typists"
                compact
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
