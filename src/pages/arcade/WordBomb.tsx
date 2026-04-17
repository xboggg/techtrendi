// ─── Word Bomb — Type words containing letter combos before the bomb explodes ─
// Modes: Solo (survive longest), Local (alternate turns), Online (Supabase Realtime), Daily Challenge
// Timer shrinks each round. 3 lives. Cannot repeat words.

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bomb, Clock, Heart, Trophy, Volume2, VolumeX, Calendar, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { GameModeSelector } from '@/components/arcade/GameModeSelector';
import { RoomLobby } from '@/components/arcade/RoomLobby';
import { CountdownOverlay } from '@/components/arcade/CountdownOverlay';
import { GameOverScreen } from '@/components/arcade/GameOverScreen';
import { RankBadge } from '@/components/arcade/RankBadge';
import { StreakIndicator } from '@/components/arcade/StreakIndicator';
import { useGameRoom } from '@/lib/arcade/useGameRoom';
import { usePlayerProfile } from '@/lib/arcade/usePlayerProfile';
import { useStreakTracker } from '@/lib/arcade/useStreakTracker';
import { useRankSystem } from '@/lib/arcade/useRankSystem';
import { useLeaderboard } from '@/lib/arcade/useLeaderboard';
import { useDailyChallenge } from '@/lib/arcade/useDailyChallenge';
import { WORD_SET } from '@/data/arcade/wordlist';
import type { GameMode } from '@/lib/arcade/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type GamePhase = 'menu' | 'lobby' | 'countdown' | 'playing' | 'exploding' | 'game-over';

type Difficulty = 'easy' | 'medium' | 'hard';

interface PlayerState {
  lives: number;
  score: number;
  usedWords: Set<string>;
  isActive: boolean;
}

// ─── Letter Combos ──────────────────────────────────────────────────────────

const EASY_COMBOS = [
  'TH', 'IN', 'ER', 'AN', 'RE', 'ED', 'ON', 'IT', 'AL', 'EN',
  'AT', 'OR', 'AR', 'TE', 'LE', 'IS', 'OU', 'ND', 'ST', 'NT',
  'ES', 'SE', 'OF', 'TO', 'HA', 'AS', 'HE', 'WA', 'FO', 'OT',
  'NE', 'VE', 'DE', 'OW', 'ME', 'RI', 'RO', 'LI', 'WI', 'CE',
];

const MEDIUM_COMBOS = [
  'PL', 'TR', 'GR', 'CH', 'SH', 'WH', 'BL', 'PR', 'CR', 'FL',
  'FR', 'GL', 'SP', 'SK', 'SN', 'SW', 'DR', 'BR', 'CL', 'TW',
  'SC', 'SL', 'SM', 'WR', 'STR', 'THR', 'SPR', 'SCR', 'SQU',
  'ACK', 'ATE', 'OOK', 'ING', 'ANK', 'OOL', 'URN', 'EAR', 'OWN',
  'AIL', 'AMP', 'OOD', 'IGH', 'EAD', 'OON', 'EEL', 'AIR', 'OAT',
];

const HARD_COMBOS = [
  'QU', 'PH', 'GHT', 'TION', 'OUS', 'MENT', 'NESS', 'ABLE',
  'IGHT', 'OUGH', 'ATCH', 'IGHT', 'OUND', 'ANGE', 'ENCE', 'ANCE',
  'TURE', 'IOUS', 'ULAR', 'WARD', 'IBLE', 'ICAL', 'IOUS',
  'XP', 'ZZ', 'KN', 'WR', 'GN', 'PS', 'MN',
  'RUPT', 'JECT', 'PLEX', 'QUES', 'XACT',
];

function getDifficultyForRound(round: number): Difficulty {
  if (round <= 5) return 'easy';
  if (round <= 15) return 'medium';
  return 'hard';
}

function getRandomCombo(round: number, rng?: () => number): string {
  const rand = rng || Math.random;
  const difficulty = getDifficultyForRound(round);
  let pool: string[];

  if (difficulty === 'easy') {
    pool = EASY_COMBOS;
  } else if (difficulty === 'medium') {
    // Mix in some easy for variety
    pool = [...MEDIUM_COMBOS, ...EASY_COMBOS.slice(0, 10)];
  } else {
    pool = [...HARD_COMBOS, ...MEDIUM_COMBOS.slice(0, 10)];
  }

  return pool[Math.floor(rand() * pool.length)];
}

// ─── Timer Constants ────────────────────────────────────────────────────────

const INITIAL_TIME = 8;
const TIME_DECREASE = 0.3;
const MIN_TIME = 3;

function getTimeForRound(round: number): number {
  return Math.max(MIN_TIME, INITIAL_TIME - (round - 1) * TIME_DECREASE);
}

// ─── Word Validation ────────────────────────────────────────────────────────

function isValidWord(word: string): boolean {
  return word.length >= 2 && WORD_SET.has(word.toLowerCase());
}

function containsCombo(word: string, combo: string): boolean {
  return word.toUpperCase().includes(combo.toUpperCase());
}

// ─── Seeded RNG for Daily Challenge ─────────────────────────────────────────

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getDailySeed(): number {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

// ─── Fuse Timer Component (visual fuse that shortens) ───────────────────────

function FuseTimer({
  timeLeft,
  maxTime,
}: {
  timeLeft: number;
  maxTime: number;
}) {
  const progress = Math.max(0, timeLeft / maxTime);
  const isLow = progress < 0.3;
  const isCritical = progress < 0.15;

  // Fuse path: curved rope that shortens with time
  const fuseLength = progress * 100;

  return (
    <div className="relative w-full h-10">
      <svg viewBox="0 0 300 40" className="w-full h-full" preserveAspectRatio="none">
        {/* Background track */}
        <path
          d="M10 20 Q75 5, 150 20 Q225 35, 290 20"
          fill="none"
          stroke="#374151"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Active fuse (shortens) */}
        <path
          d="M10 20 Q75 5, 150 20 Q225 35, 290 20"
          fill="none"
          stroke={isCritical ? '#ef4444' : isLow ? '#f97316' : '#d97706'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${fuseLength * 2.8} 1000`}
          className="transition-all duration-100"
        />
        {/* Spark at the burning tip */}
        {timeLeft > 0 && (
          <>
            <circle
              cx={10 + fuseLength * 2.8 > 290 ? 290 : 10 + fuseLength * 2.8 * 0.95}
              cy="20"
              r="5"
              fill={isCritical ? '#ef4444' : '#fbbf24'}
              className="animate-pulse"
            >
              <animate attributeName="r" values="4;7;4" dur="0.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.6;1" dur="0.2s" repeatCount="indefinite" />
            </circle>
            {/* Spark glow */}
            <circle
              cx={10 + fuseLength * 2.8 > 290 ? 290 : 10 + fuseLength * 2.8 * 0.95}
              cy="20"
              r="10"
              fill={isCritical ? '#ef4444' : '#fbbf24'}
              opacity="0.3"
              className="animate-ping"
            />
            {/* Tiny spark particles */}
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={10 + fuseLength * 2.8 > 290 ? 290 : 10 + fuseLength * 2.8 * 0.95}
                cy="20"
                r="2"
                fill="#fde68a"
              >
                <animate
                  attributeName="cx"
                  values={`${10 + fuseLength * 2.8 * 0.95};${10 + fuseLength * 2.8 * 0.95 + (i - 1) * 12}`}
                  dur="0.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values="20;{10 + i * 8}"
                  dur="0.4s"
                  repeatCount="indefinite"
                />
                <animate attributeName="opacity" values="1;0" dur="0.4s" repeatCount="indefinite" />
              </circle>
            ))}
          </>
        )}
      </svg>
    </div>
  );
}

// ─── Bomb Component ─────────────────────────────────────────────────────────

function BombDisplay({
  combo,
  timeLeft,
  maxTime,
  isExploding,
  shake,
}: {
  combo: string;
  timeLeft: number;
  maxTime: number;
  isExploding: boolean;
  shake: boolean;
}) {
  const progress = Math.max(0, timeLeft / maxTime);
  const isCritical = timeLeft < 3;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={
        isExploding
          ? { scale: [1, 1.5, 0], rotate: [0, 10, -10, 0], opacity: [1, 1, 0] }
          : shake
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
          : isCritical
          ? { scale: [1, 1.06, 1], rotate: [0, -3, 3, 0] }
          : {}
      }
      transition={
        isExploding
          ? { duration: 0.6, ease: 'easeOut' }
          : shake
          ? { duration: 0.4 }
          : isCritical
          ? { duration: 0.25, repeat: Infinity }
          : {}
      }
    >
      {/* Red glow ring behind bomb when critical */}
      {isCritical && !isExploding && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '110%',
            height: '110%',
            background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.1) 40%, transparent 70%)',
            boxShadow: '0 0 40px 20px rgba(239,68,68,0.25), 0 0 80px 40px rgba(239,68,68,0.1)',
          }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Bomb SVG body */}
      <div
        className="relative w-40 h-48 sm:w-48 sm:h-56 flex items-center justify-center"
        style={{
          filter: isCritical
            ? 'drop-shadow(0 0 25px rgba(239, 68, 68, 0.7)) drop-shadow(0 0 50px rgba(239, 68, 68, 0.4)) drop-shadow(0 0 80px rgba(239, 68, 68, 0.2))'
            : 'drop-shadow(0 0 12px rgba(0, 0, 0, 0.5))',
        }}
      >
        <svg viewBox="0 0 200 240" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Bomb body - round with gradient */}
          <defs>
            <radialGradient id="bombBody" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#4a5568" />
              <stop offset="50%" stopColor="#2d3748" />
              <stop offset="100%" stopColor="#1a202c" />
            </radialGradient>
            <radialGradient id="bombShine" cx="30%" cy="25%" r="30%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            {isCritical && (
              <radialGradient id="criticalGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(239,68,68,0.3)" />
                <stop offset="100%" stopColor="rgba(239,68,68,0)" />
              </radialGradient>
            )}
          </defs>

          {/* Critical glow behind bomb */}
          {isCritical && (
            <circle cx="100" cy="145" r="90" fill="url(#criticalGlow)">
              <animate attributeName="r" values="85;95;85" dur="0.5s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Main bomb circle */}
          <circle cx="100" cy="145" r="72" fill="url(#bombBody)" stroke={isCritical ? '#ef4444' : '#4a5568'} strokeWidth="3" />
          {/* Highlight/shine */}
          <circle cx="100" cy="145" r="70" fill="url(#bombShine)" />

          {/* Fuse nozzle (top of bomb) */}
          <rect x="90" y="72" width="20" height="14" rx="3" fill="#6b7280" />
          <rect x="92" y="74" width="16" height="2" rx="1" fill="#9ca3af" opacity="0.4" />

          {/* Fuse rope - curves up and shortens with time */}
          {!isExploding && (
            <>
              <path
                d={`M100 72 Q110 ${55 - progress * 15}, ${108 + progress * 12} ${40 - progress * 10} Q${115 + progress * 10} ${25 - progress * 5}, ${105 + progress * 20} ${15 - progress * 5}`}
                fill="none"
                stroke="#92400e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress * 60} 200`}
              />
              {/* Spark at fuse tip */}
              {timeLeft > 0 && (
                <>
                  <circle cx={105 + progress * 20} cy={15 - progress * 5} r="6" fill="#fbbf24">
                    <animate attributeName="r" values="4;8;4" dur="0.25s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0.7;1" dur="0.15s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={105 + progress * 20} cy={15 - progress * 5} r="3" fill="#fef3c7">
                    <animate attributeName="r" values="2;4;2" dur="0.2s" repeatCount="indefinite" />
                  </circle>
                  {/* Spark particles */}
                  {[0, 1, 2, 3].map((i) => (
                    <circle key={i} r="1.5" fill={['#fbbf24', '#f97316', '#fde68a', '#ef4444'][i]}>
                      <animate
                        attributeName="cx"
                        values={`${105 + progress * 20};${105 + progress * 20 + (i % 2 ? 10 : -10)}`}
                        dur={`${0.3 + i * 0.1}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="cy"
                        values={`${15 - progress * 5};${5 - i * 3}`}
                        dur={`${0.3 + i * 0.1}s`}
                        repeatCount="indefinite"
                      />
                      <animate attributeName="opacity" values="1;0" dur={`${0.3 + i * 0.1}s`} repeatCount="indefinite" />
                    </circle>
                  ))}
                </>
              )}
            </>
          )}
        </svg>

        {/* Letter combo overlaid on bomb center */}
        <motion.span
          className={cn(
            'absolute text-3xl sm:text-4xl font-black tracking-wider select-none',
            'top-1/2 left-1/2 -translate-x-1/2 translate-y-[10%]',
            isCritical ? 'text-red-400' : 'text-amber-400'
          )}
          style={{
            textShadow: isCritical
              ? '0 0 12px rgba(239,68,68,0.8), 0 2px 4px rgba(0,0,0,0.5)'
              : '0 0 8px rgba(251,191,36,0.5), 0 2px 4px rgba(0,0,0,0.5)',
          }}
          animate={isCritical ? { scale: [1, 1.1, 1] } : {}}
          transition={isCritical ? { duration: 0.5, repeat: Infinity } : {}}
        >
          {combo}
        </motion.span>
      </div>
    </motion.div>
  );
}

// ─── Explosion Effect ───────────────────────────────────────────────────────

function ExplosionEffect({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onComplete, 1500);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  // More particles in multiple rings
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        angle: (i / 40) * 360 + Math.random() * 15,
        distance: 40 + Math.random() * 140,
        size: 3 + Math.random() * 14,
        delay: Math.random() * 0.2,
        color: ['#ef4444', '#f97316', '#fbbf24', '#f59e0b', '#dc2626', '#fde68a', '#ff6b6b'][
          Math.floor(Math.random() * 7)
        ],
        rotate: Math.random() * 360,
      })),
    []
  );

  // Debris chunks
  const debris = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i / 12) * 360,
        distance: 80 + Math.random() * 120,
        size: 6 + Math.random() * 10,
        delay: Math.random() * 0.1,
      })),
    []
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      {/* Screen flash red */}
      <motion.div
        className="fixed inset-0 bg-red-600 z-40"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Expanding shockwave ring 1 */}
      <motion.div
        className="absolute rounded-full border-4 border-orange-400"
        initial={{ width: 0, height: 0, opacity: 1 }}
        animate={{ width: 400, height: 400, opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />

      {/* Expanding shockwave ring 2 */}
      <motion.div
        className="absolute rounded-full border-2 border-yellow-300"
        initial={{ width: 0, height: 0, opacity: 0.8 }}
        animate={{ width: 300, height: 300, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      />

      {/* Central fireball */}
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          background: 'radial-gradient(circle, #fde68a 0%, #f97316 30%, #ef4444 60%, transparent 100%)',
        }}
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: [0.2, 3.5, 4], opacity: [1, 0.8, 0] }}
        transition={{ duration: 0.8, times: [0, 0.5, 1] }}
      />

      {/* Secondary fireball */}
      <motion.div
        className="absolute w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, #ffffff 0%, #fbbf24 40%, transparent 100%)',
        }}
        initial={{ scale: 0.1, opacity: 1 }}
        animate={{ scale: [0.1, 2, 2.5], opacity: [1, 0.6, 0] }}
        transition={{ duration: 0.6, times: [0, 0.5, 1], delay: 0.05 }}
      />

      {/* BOOM text */}
      <motion.span
        className="absolute text-6xl sm:text-7xl font-black text-red-500 z-10"
        style={{ textShadow: '0 0 30px rgba(239,68,68,1), 0 0 60px rgba(239,68,68,0.5)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 0] }}
        transition={{ duration: 1, times: [0, 0.3, 1] }}
      >
        BOOM!
      </motion.span>

      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0.1,
            rotate: p.rotate,
          }}
          transition={{ duration: 0.9, delay: p.delay, ease: 'easeOut' }}
        />
      ))}

      {/* Debris chunks (rectangles) */}
      {debris.map((d) => (
        <motion.div
          key={`debris-${d.id}`}
          className="absolute bg-gray-700 rounded-sm"
          style={{ width: d.size, height: d.size * 0.6 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: Math.cos((d.angle * Math.PI) / 180) * d.distance,
            y: Math.sin((d.angle * Math.PI) / 180) * d.distance + 40,
            opacity: 0,
            rotate: 360 + Math.random() * 360,
          }}
          transition={{ duration: 1.2, delay: d.delay, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  );
}

// ─── Hearts Display ─────────────────────────────────────────────────────────

function HeartsDisplay({
  lives,
  maxLives,
  label,
}: {
  lives: number;
  maxLives: number;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {label && (
        <span className="text-xs text-gray-400 mr-1 font-medium">{label}</span>
      )}
      {Array.from({ length: maxLives }, (_, i) => {
        const isBreaking = i === lives;
        const isAlive = i < lives;

        return (
          <div key={i} className="relative">
            <motion.div
              animate={
                isBreaking
                  ? { scale: [1, 1.3, 0], rotate: [0, -15, 30], opacity: [1, 1, 0] }
                  : {}
              }
              transition={isBreaking ? { duration: 0.6, ease: 'easeOut' } : {}}
            >
              <Heart
                className={cn(
                  'w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300',
                  isAlive
                    ? 'fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                    : 'fill-gray-700 text-gray-700'
                )}
              />
            </motion.div>

            {/* Shatter particles when heart breaks */}
            {isBreaking && (
              <div className="absolute inset-0 pointer-events-none">
                {[0, 1, 2, 3, 4, 5].map((p) => (
                  <motion.div
                    key={p}
                    className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-red-500"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos((p / 6) * Math.PI * 2) * 20,
                      y: Math.sin((p / 6) * Math.PI * 2) * 20,
                      opacity: 0,
                      scale: 0,
                    }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Valid Word Flash ───────────────────────────────────────────────────────

function ValidWordFlash({ word }: { word: string }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 1.2] }}
      transition={{ duration: 0.7 }}
    >
      <span className="text-4xl sm:text-5xl font-black text-emerald-400 uppercase"
        style={{ textShadow: '0 0 20px rgba(52,211,153,0.6)' }}
      >
        {word}!
      </span>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const MAX_LIVES = 3;
const GAME_SLUG = 'word-bomb' as const;

export default function WordBomb() {
  const navigate = useNavigate();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [mode, setMode] = useState<GameMode>('solo');
  const [round, setRound] = useState(1);
  const [combo, setCombo] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [maxTime, setMaxTime] = useState(INITIAL_TIME);
  const [isExploding, setIsExploding] = useState(false);
  const [shake, setShake] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [validFlash, setValidFlash] = useState<string | null>(null);
  const [greenFlash, setGreenFlash] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isDailyMode, setIsDailyMode] = useState(false);
  const [dailyRng, setDailyRng] = useState<(() => number) | null>(null);

  // Player states
  const [p1, setP1] = useState<PlayerState>({
    lives: MAX_LIVES,
    score: 0,
    usedWords: new Set(),
    isActive: true,
  });
  const [p2, setP2] = useState<PlayerState>({
    lives: MAX_LIVES,
    score: 0,
    usedWords: new Set(),
    isActive: true,
  });
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const allUsedWords = useRef<Set<string>>(new Set());

  // Shared hooks
  const { profile, ensureProfile } = usePlayerProfile();
  const { streak, recordWin, recordLoss } = useStreakTracker();
  const { getRankForRating } = useRankSystem();
  const { submitScore } = useLeaderboard();

  // Online room
  const {
    roomCode,
    isHost,
    isConnected,
    opponentJoined,
    createRoom,
    joinRoom,
    broadcast,
    leaveRoom,
  } = useGameRoom({
    gameSlug: GAME_SLUG as any,
    playerName: profile?.displayName || 'Player',
    onGameStart: () => {
      setPhase('countdown');
    },
    onBroadcast: (event, payload) => {
      handleOnlineBroadcast(event, payload);
    },
  });

  // Daily challenge
  const {
    alreadyPlayed: dailyPlayed,
    submitScore: submitDailyScore,
  } = useDailyChallenge({ gameSlug: GAME_SLUG as any });

  // ─── Game Logic ─────────────────────────────────────────────────────────────

  const startNewRound = useCallback(
    (roundNum: number, rng?: () => number) => {
      const newCombo = getRandomCombo(roundNum, rng || dailyRng || undefined);
      const time = getTimeForRound(roundNum);
      setCombo(newCombo);
      setTimeLeft(time);
      setMaxTime(time);
      setInput('');
      setIsExploding(false);
      setShake(false);

      // Focus the input
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [dailyRng]
  );

  const startGame = useCallback(
    (gameMode: GameMode, daily = false) => {
      setMode(gameMode);
      setRound(1);
      setP1({ lives: MAX_LIVES, score: 0, usedWords: new Set(), isActive: true });
      setP2({ lives: MAX_LIVES, score: 0, usedWords: new Set(), isActive: true });
      setCurrentPlayer(0);
      allUsedWords.current = new Set();
      setIsDailyMode(daily);

      let rng: (() => number) | null = null;
      if (daily) {
        rng = seededRng(getDailySeed());
        setDailyRng(() => rng);
      } else {
        setDailyRng(null);
      }

      if (gameMode === 'online') {
        // Wait for countdown
        setPhase('lobby');
      } else {
        setPhase('countdown');
      }
    },
    []
  );

  const handleExplosion = useCallback(() => {
    setIsExploding(true);
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);

    const activeP = mode === 'local' ? currentPlayer : 0;
    const setter = activeP === 0 ? setP1 : setP2;

    setter((prev) => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        // Delayed game over
        setTimeout(() => {
          setPhase('game-over');
        }, 1300);
        return { ...prev, lives: 0, isActive: false };
      }
      return { ...prev, lives: newLives };
    });

    // After explosion animation, start next round or switch player
    setTimeout(() => {
      if (mode === 'local') {
        // Switch to other player if current lost a life but still alive
        setCurrentPlayer((prev) => (prev === 0 ? 1 : 0));
      }
      setRound((prev) => {
        const next = prev + 1;
        startNewRound(next);
        return next;
      });
    }, 1300);
  }, [mode, currentPlayer, startNewRound]);

  const handleSubmitWord = useCallback(() => {
    const word = input.trim().toLowerCase();

    if (!word) return;

    // Validate
    if (!isValidWord(word)) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setInput('');
      return;
    }

    if (!containsCombo(word, combo)) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setInput('');
      return;
    }

    if (allUsedWords.current.has(word)) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setInput('');
      return;
    }

    // Valid word!
    allUsedWords.current.add(word);
    setValidFlash(word);
    setGreenFlash(true);
    setTimeout(() => setValidFlash(null), 700);
    setTimeout(() => setGreenFlash(false), 300);

    // Score: 1 base + bonus for length + bonus for hard combos
    const lengthBonus = Math.max(0, word.length - 4);
    const difficultyBonus = getDifficultyForRound(round) === 'hard' ? 2 : getDifficultyForRound(round) === 'medium' ? 1 : 0;
    const points = 1 + lengthBonus + difficultyBonus;

    const activeP = mode === 'local' ? currentPlayer : 0;
    const setter = activeP === 0 ? setP1 : setP2;
    setter((prev) => ({
      ...prev,
      score: prev.score + points,
      usedWords: new Set([...prev.usedWords, word]),
    }));

    // Broadcast for online
    if (mode === 'online') {
      broadcast('word-accepted', { word, round, points });
    }

    // Next round
    if (mode === 'local') {
      setCurrentPlayer((prev) => (prev === 0 ? 1 : 0));
    }
    setRound((prev) => {
      const next = prev + 1;
      startNewRound(next);
      return next;
    });
    setInput('');
  }, [input, combo, round, mode, currentPlayer, broadcast, startNewRound]);

  // ─── Online Broadcast Handler ─────────────────────────────────────────────

  const handleOnlineBroadcast = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      if (event === 'word-accepted') {
        const word = payload.word as string;
        allUsedWords.current.add(word);
        setP2((prev) => ({
          ...prev,
          score: prev.score + (payload.points as number || 1),
          usedWords: new Set([...prev.usedWords, word]),
        }));
      } else if (event === 'explosion') {
        setP2((prev) => {
          const newLives = prev.lives - 1;
          if (newLives <= 0) {
            setTimeout(() => setPhase('game-over'), 500);
            return { ...prev, lives: 0, isActive: false };
          }
          return { ...prev, lives: newLives };
        });
      } else if (event === 'game-over') {
        setPhase('game-over');
      }
    },
    []
  );

  // ─── Timer Effect ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 0.05;
        if (next <= 0) {
          clearInterval(timerRef.current!);
          handleExplosion();
          return 0;
        }
        return next;
      });
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, round, handleExplosion]);

  // ─── Check game over for local mode ───────────────────────────────────────

  useEffect(() => {
    if (mode === 'local' && phase === 'playing') {
      if (p1.lives <= 0 || p2.lives <= 0) {
        setTimeout(() => setPhase('game-over'), 1300);
      }
    }
  }, [p1.lives, p2.lives, mode, phase]);

  // ─── Countdown complete ───────────────────────────────────────────────────

  const handleCountdownComplete = useCallback(() => {
    setPhase('playing');
    startNewRound(1, dailyRng || undefined);
  }, [startNewRound, dailyRng]);

  // ─── Key handler ──────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitWord();
      }
    },
    [handleSubmitWord]
  );

  // ─── Score helpers ────────────────────────────────────────────────────────

  const soloScore = p1.score;
  const localWinner = p1.lives > 0 ? 0 : 1;
  const wonGame = mode === 'solo'
    ? true // Solo always shows score
    : mode === 'local'
    ? currentPlayer === 0 ? p2.lives <= 0 : p1.lives <= 0
    : p2.lives <= 0;

  // ─── Play Again ───────────────────────────────────────────────────────────

  const handlePlayAgain = useCallback(() => {
    startGame(mode, isDailyMode);
  }, [mode, isDailyMode, startGame]);

  const handleBackToMenu = useCallback(() => {
    setPhase('menu');
    leaveRoom();
  }, [leaveRoom]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout>
      <SEOHead
        title="Word Bomb | TechTrendi Arcade"
        description="Type words containing letter combos before the bomb explodes! Fast-paced word game."
      />

      <div
        className={cn(
          'min-h-screen bg-gray-950 text-white overflow-hidden relative',
          screenShake && 'animate-[shake_0.3s_ease-in-out]'
        )}
      >
        {/* Green flash overlay */}
        <AnimatePresence>
          {greenFlash && (
            <motion.div
              className="absolute inset-0 bg-emerald-500/15 z-30 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>

        {/* Valid word flash */}
        <AnimatePresence>
          {validFlash && <ValidWordFlash word={validFlash} />}
        </AnimatePresence>

        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 relative z-10">
          {/* ─── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              {phase === 'menu' ? (
                <Link
                  to="/arcade"
                  className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              ) : (
                <button
                  onClick={handleBackToMenu}
                  className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-400 via-red-500 to-yellow-500 bg-clip-text text-transparent">
                  Word Bomb
                </h1>
                {phase === 'playing' && (
                  <p className="text-xs text-gray-500">Round {round}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {profile && (
                <RankBadge tier={getRankForRating(profile.eloRating)} size="sm" />
              )}
              {streak && streak.current > 0 && (
                <StreakIndicator streak={streak.current} />
              )}
              <button
                onClick={() => setMuted(!muted)}
                className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 transition-colors"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ─── Menu Phase ──────────────────────────────────────────────── */}
          {phase === 'menu' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Hero bomb SVG */}
              <div className="flex flex-col items-center py-6">
                <div className="w-32 h-36 mb-4">
                  <svg viewBox="0 0 200 240" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="menuBombBody" cx="40%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="#4a5568" />
                        <stop offset="50%" stopColor="#2d3748" />
                        <stop offset="100%" stopColor="#1a202c" />
                      </radialGradient>
                      <radialGradient id="menuBombShine" cx="30%" cy="25%" r="30%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </radialGradient>
                    </defs>
                    <circle cx="100" cy="145" r="72" fill="url(#menuBombBody)" stroke="#4a5568" strokeWidth="3" />
                    <circle cx="100" cy="145" r="70" fill="url(#menuBombShine)" />
                    <rect x="90" y="72" width="20" height="14" rx="3" fill="#6b7280" />
                    <path d="M100 72 Q115 50, 125 30" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="125" cy="28" r="6" fill="#fbbf24">
                      <animate attributeName="r" values="4;8;4" dur="0.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0.6;1" dur="0.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="125" cy="28" r="3" fill="#fef3c7">
                      <animate attributeName="r" values="2;4;2" dur="0.6s" repeatCount="indefinite" />
                    </circle>
                    <text x="100" y="155" textAnchor="middle" fill="#fbbf24" fontWeight="900" fontSize="28" fontFamily="system-ui">TH</text>
                  </svg>
                </div>
                <p className="text-gray-400 text-center max-w-sm text-sm sm:text-base">
                  A bomb is ticking! Type a word containing the shown letters before it
                  explodes. Survive as long as you can.
                </p>
              </div>

              {/* How to Play */}
              <div className="bg-gray-900/60 rounded-2xl p-5 border border-gray-800 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  How to Play
                </h3>
                <div className="space-y-2.5 text-sm text-gray-400">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold shrink-0 mt-0.5">1</span>
                    <span>The bomb shows <strong className="text-amber-400">2-3 letters</strong>. Type any valid English word that contains those letters.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold shrink-0 mt-0.5">2</span>
                    <span>Timer starts at <strong className="text-orange-400">8 seconds</strong> and shrinks each round down to 3s. Be quick!</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold shrink-0 mt-0.5">3</span>
                    <span>You have <strong className="text-red-400">3 lives</strong>. If the bomb explodes, you lose a heart.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0 mt-0.5">4</span>
                    <span><strong className="text-emerald-400">Longer words = more points</strong>. Bonus for length and harder combos.</span>
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-center">Choose Mode</h2>
                <GameModeSelector onSelect={(m) => startGame(m)} />

                {/* Daily Challenge button */}
                <button
                  onClick={() => {
                    if (dailyPlayed) return;
                    startGame('solo', true);
                  }}
                  disabled={dailyPlayed}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-bold text-lg transition-all',
                    dailyPlayed
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white hover:opacity-90 shadow-lg shadow-orange-500/20'
                  )}
                >
                  <Calendar className="w-5 h-5" />
                  {dailyPlayed ? 'Daily Challenge Complete' : 'Daily Challenge'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Lobby Phase (Online) ────────────────────────────────────── */}
          {phase === 'lobby' && (
            <RoomLobby
              roomCode={roomCode}
              isHost={isHost}
              isConnected={isConnected}
              opponentJoined={opponentJoined}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
              onCancel={handleBackToMenu}
              onStartGame={() => {
                broadcast('game-start', { round: 1 });
                setPhase('countdown');
              }}
            />
          )}

          {/* ─── Countdown Phase ─────────────────────────────────────────── */}
          {phase === 'countdown' && (
            <CountdownOverlay
              onComplete={handleCountdownComplete}
              title="Word Bomb"
              subtitle={isDailyMode ? 'Daily Challenge' : undefined}
            />
          )}

          {/* ─── Playing Phase ───────────────────────────────────────────── */}
          {phase === 'playing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Score & Lives Bar */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-start gap-1">
                  {mode === 'local' && (
                    <span className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-full',
                      currentPlayer === 0
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    )}>
                      {currentPlayer === 0 ? 'P1 Turn' : 'P2 Turn'}
                    </span>
                  )}
                  <HeartsDisplay
                    lives={mode === 'local' && currentPlayer === 1 ? p2.lives : p1.lives}
                    maxLives={MAX_LIVES}
                    label={mode === 'local' ? (currentPlayer === 0 ? 'P1' : 'P2') : undefined}
                  />
                </div>

                <div className="flex items-center gap-4">
                  {mode === 'local' && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">P1: {p1.score} | P2: {p2.score}</div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-gray-800/80 px-3 py-1.5 rounded-xl">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-lg font-bold text-amber-400">
                      {mode === 'local' ? (currentPlayer === 0 ? p1.score : p2.score) : p1.score}
                    </span>
                  </div>
                </div>
              </div>

              {/* Opponent lives (local/online) */}
              {mode === 'local' && (
                <div className="flex justify-end">
                  <HeartsDisplay
                    lives={currentPlayer === 0 ? p2.lives : p1.lives}
                    maxLives={MAX_LIVES}
                    label={currentPlayer === 0 ? 'P2' : 'P1'}
                  />
                </div>
              )}
              {mode === 'online' && (
                <div className="flex justify-end">
                  <HeartsDisplay lives={p2.lives} maxLives={MAX_LIVES} label="Opponent" />
                </div>
              )}

              {/* Fuse Timer */}
              <FuseTimer timeLeft={timeLeft} maxTime={maxTime} />

              {/* Timer text */}
              <div className="text-center">
                <span
                  className={cn(
                    'text-sm font-mono font-bold',
                    timeLeft < 2 ? 'text-red-500' : timeLeft < 4 ? 'text-orange-400' : 'text-gray-400'
                  )}
                >
                  {Math.max(0, timeLeft).toFixed(1)}s
                </span>
              </div>

              {/* Bomb */}
              <div className="flex justify-center py-2 sm:py-4 relative">
                <BombDisplay
                  combo={combo}
                  timeLeft={timeLeft}
                  maxTime={maxTime}
                  isExploding={isExploding}
                  shake={shake}
                />

                {/* Explosion overlay */}
                <AnimatePresence>
                  {isExploding && (
                    <ExplosionEffect onComplete={() => setIsExploding(false)} />
                  )}
                </AnimatePresence>
              </div>

              {/* Instruction */}
              <p className="text-center text-gray-500 text-xs sm:text-sm">
                Type a word containing{' '}
                <span className="text-amber-400 font-bold">&quot;{combo}&quot;</span>
              </p>

              {/* Input */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                  onKeyDown={handleKeyDown}
                  disabled={isExploding || phase !== 'playing'}
                  placeholder="Type your word..."
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className={cn(
                    'w-full px-5 py-4 text-xl sm:text-2xl font-bold text-center',
                    'bg-gray-900 border-2 rounded-2xl',
                    'focus:outline-none focus:ring-0 transition-colors',
                    'placeholder:text-gray-700 text-white uppercase tracking-wider',
                    shake
                      ? 'border-red-500 bg-red-500/10'
                      : greenFlash
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 focus:border-amber-500'
                  )}
                />
                <button
                  onClick={handleSubmitWord}
                  disabled={!input.trim() || isExploding}
                  className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2',
                    'px-4 py-2 rounded-xl font-bold text-sm',
                    'transition-all',
                    input.trim() && !isExploding
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  )}
                >
                  GO
                </button>
              </div>

              {/* Used words count */}
              <div className="text-center text-xs text-gray-600">
                {allUsedWords.current.size} word{allUsedWords.current.size !== 1 ? 's' : ''} used
              </div>

              {/* Difficulty indicator */}
              <div className="flex justify-center">
                <span
                  className={cn(
                    'text-xs px-3 py-1 rounded-full font-medium',
                    getDifficultyForRound(round) === 'easy'
                      ? 'bg-green-500/20 text-green-400'
                      : getDifficultyForRound(round) === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {getDifficultyForRound(round).toUpperCase()}
                </span>
              </div>
            </motion.div>
          )}

          {/* ─── Game Over Phase ──────────────────────────────────────────── */}
          {phase === 'game-over' && (
            <div className="py-6">
              <GameOverScreen
                won={mode === 'solo' ? p1.score > 0 : (mode === 'local' ? p1.lives > 0 : p2.lives <= 0)}
                score={mode === 'local' ? Math.max(p1.score, p2.score) : p1.score}
                opponentScore={mode === 'solo' ? undefined : (mode === 'local' ? Math.min(p1.score, p2.score) : p2.score)}
                streak={streak?.current}
                onPlayAgain={handlePlayAgain}
                onBackToArcade={() => navigate('/arcade')}
                playerName={mode === 'local' ? (p1.lives > 0 ? 'Player 1' : 'Player 2') : profile?.displayName}
                opponentName={mode === 'online' ? 'Opponent' : mode === 'local' ? (p1.lives > 0 ? 'Player 2' : 'Player 1') : undefined}
              />

              {/* Extra stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 bg-gray-900/60 rounded-2xl p-4 border border-gray-800 space-y-3"
              >
                <h3 className="font-bold text-gray-300 text-sm">Game Stats</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-black text-amber-400">{round - 1}</div>
                    <div className="text-xs text-gray-500">Rounds</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-400">
                      {allUsedWords.current.size}
                    </div>
                    <div className="text-xs text-gray-500">Words</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-blue-400">
                      {p1.score}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>

                {isDailyMode && (
                  <div className="flex items-center justify-center gap-2 text-sm text-orange-400">
                    <Calendar className="w-4 h-4" />
                    <span>Daily Challenge Score: {p1.score}</span>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Inline keyframes for screen shake */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-8px) translateY(2px); }
          20% { transform: translateX(8px) translateY(-2px); }
          30% { transform: translateX(-6px) translateY(1px); }
          40% { transform: translateX(6px) translateY(-1px); }
          50% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          70% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
          90% { transform: translateX(-1px); }
        }
      `}</style>
    </Layout>
  );
}
