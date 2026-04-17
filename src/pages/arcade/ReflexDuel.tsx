// ─── Reflex Duel — Fast-paced trivia reflex game ──────────────────────────────
// Solo / Local split-screen / Online via Supabase Realtime
// 150+ questions across 5 categories, speed bonus scoring, lockout on wrong answer

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Zap, Calculator, BookOpen, Globe2, Palette, Lightbulb,
  Trophy, Timer, Lock, Volume2, VolumeX, ChevronDown, ChevronUp, Target, Clock,
  Award, AlertTriangle, Users,
} from 'lucide-react';
import {
  GameModeSelector,
  CountdownOverlay,
  GameOverScreen,
  RoomLobby,
} from '@/components/arcade';
import { shareScore } from '@/components/arcade/ShareScore';
import { useGameRoom } from '@/lib/arcade/useGameRoom';
import { useLeaderboard } from '@/lib/arcade/useLeaderboard';
import { usePlayerProfile } from '@/lib/arcade/usePlayerProfile';
import { useStreakTracker } from '@/lib/arcade/useStreakTracker';
import { useGameAI } from '@/lib/arcade/useGameAI';
import type { GameMode } from '@/lib/arcade/types';

// ─── Types ──────────────────────────────────────────────────────────────────

type Category = 'math' | 'vocabulary' | 'capitals' | 'colors' | 'general';

interface Question {
  id: string;
  category: Category;
  question: string;
  options: string[];
  correctIndex: number;
  /** For Stroop questions: the CSS color to render the word in */
  displayColor?: string;
}

type GamePhase =
  | 'menu'
  | 'mode-select'
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'round-result'
  | 'between-rounds'
  | 'game-over';

interface RoundResult {
  winner: 'p1' | 'p2' | 'none';
  p1Correct: boolean;
  p2Correct: boolean;
  p1Time: number | null;
  p2Time: number | null;
  p1Points: number;
  p2Points: number;
  correctIndex: number;
}

// ─── Category Config ────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<Category, { label: string; icon: typeof Calculator; color: string; bg: string }> = {
  math:       { label: 'Math',             icon: Calculator, color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  vocabulary: { label: 'Vocabulary',       icon: BookOpen,   color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  capitals:   { label: 'Flags & Capitals', icon: Globe2,     color: 'text-amber-400',   bg: 'bg-amber-500/20' },
  colors:     { label: 'Stroop Colors',    icon: Palette,    color: 'text-pink-400',    bg: 'bg-pink-500/20' },
  general:    { label: 'General Knowledge',icon: Lightbulb,  color: 'text-violet-400',  bg: 'bg-violet-500/20' },
};

const CATEGORIES: Category[] = ['math', 'vocabulary', 'capitals', 'colors', 'general'];

// ─── Constants ──────────────────────────────────────────────────────────────

const ROUNDS_PER_MATCH = 15;
const SOLO_QUESTIONS = 20;
const LOCKOUT_MS = 2000;
const ROUND_TIME_LIMIT_MS = 8000;
const BETWEEN_ROUND_MS = 1500;
const ROUND_RESULT_MS = 1800;
const BASE_POINTS = 100;

function getSpeedMultiplier(timeMs: number): number {
  if (timeMs <= 1000) return 3;
  if (timeMs <= 2000) return 2;
  if (timeMs <= 3000) return 1.5;
  return 1;
}

// ─── Question Bank (150+ questions) ─────────────────────────────────────────

function buildQuestionBank(): Question[] {
  const questions: Question[] = [];
  let qid = 0;
  const id = () => `q${++qid}`;

  // ── Math (35 questions) ──
  const mathQs: [string, string[], number][] = [
    ['What is 17 x 8?', ['126', '136', '146', '128'], 1],
    ['What is 25 x 4?', ['90', '100', '110', '80'], 1],
    ['What is 144 / 12?', ['11', '12', '13', '14'], 1],
    ['What is the square root of 144?', ['11', '12', '13', '14'], 1],
    ['What is 25% of 360?', ['80', '90', '72', '100'], 1],
    ['What is 15 x 15?', ['215', '225', '235', '250'], 1],
    ['What is 99 + 87?', ['176', '186', '196', '166'], 1],
    ['What is 7 x 9?', ['56', '63', '72', '54'], 1],
    ['What is 1000 - 637?', ['363', '373', '353', '463'], 0],
    ['What is 48 / 6?', ['7', '8', '9', '6'], 1],
    ['What is 33 x 3?', ['96', '99', '93', '102'], 1],
    ['What is 50% of 246?', ['113', '123', '133', '143'], 1],
    ['What is 12 x 12?', ['124', '134', '144', '154'], 2],
    ['What is 256 / 16?', ['14', '15', '16', '17'], 2],
    ['What is 19 + 47?', ['56', '66', '76', '86'], 1],
    ['What is 81 / 9?', ['7', '8', '9', '10'], 2],
    ['What is the square root of 169?', ['11', '12', '13', '14'], 2],
    ['What is 75% of 200?', ['125', '140', '150', '175'], 2],
    ['What is 13 x 7?', ['84', '91', '87', '93'], 1],
    ['What is 200 - 89?', ['101', '111', '121', '109'], 1],
    ['What is 64 / 8?', ['6', '7', '8', '9'], 2],
    ['What is 11 x 11?', ['111', '121', '131', '141'], 1],
    ['What is 45 + 67?', ['102', '112', '122', '132'], 1],
    ['What is 10% of 450?', ['40', '45', '50', '55'], 1],
    ['What is 16 x 5?', ['70', '75', '80', '85'], 2],
    ['What is 500 / 25?', ['15', '20', '25', '30'], 1],
    ['What is 37 + 58?', ['85', '95', '105', '115'], 1],
    ['What is the cube of 3?', ['9', '18', '27', '36'], 2],
    ['What is 2 to the power of 8?', ['128', '256', '512', '64'], 1],
    ['What is 14 x 6?', ['74', '84', '94', '64'], 1],
    ['What is 360 / 9?', ['30', '35', '40', '45'], 2],
    ['What is 88 - 29?', ['57', '59', '61', '63'], 1],
    ['What is 20% of 500?', ['80', '90', '100', '110'], 2],
    ['What is 23 x 4?', ['82', '88', '92', '96'], 2],
    ['What is the square root of 225?', ['13', '14', '15', '16'], 2],
  ];
  for (const [q, opts, ci] of mathQs) {
    questions.push({ id: id(), category: 'math', question: q, options: opts, correctIndex: ci });
  }

  // ── Vocabulary (32 questions) ──
  const vocabQs: [string, string[], number][] = [
    ['Synonym of "brave"?', ['Cowardly', 'Courageous', 'Timid', 'Cautious'], 1],
    ['Opposite of "ancient"?', ['Old', 'Antique', 'Modern', 'Historic'], 2],
    ['Synonym of "happy"?', ['Sad', 'Joyful', 'Angry', 'Bored'], 1],
    ['Opposite of "generous"?', ['Kind', 'Stingy', 'Wealthy', 'Humble'], 1],
    ['What does "ephemeral" mean?', ['Eternal', 'Short-lived', 'Heavy', 'Bright'], 1],
    ['Synonym of "enormous"?', ['Tiny', 'Massive', 'Narrow', 'Light'], 1],
    ['Opposite of "transparent"?', ['Clear', 'Visible', 'Opaque', 'Thin'], 2],
    ['What does "benevolent" mean?', ['Cruel', 'Kind-hearted', 'Lazy', 'Strict'], 1],
    ['Synonym of "peculiar"?', ['Normal', 'Strange', 'Plain', 'Simple'], 1],
    ['Opposite of "scarce"?', ['Rare', 'Limited', 'Abundant', 'Few'], 2],
    ['What does "diligent" mean?', ['Lazy', 'Careless', 'Hardworking', 'Slow'], 2],
    ['Synonym of "swift"?', ['Slow', 'Heavy', 'Quick', 'Dull'], 2],
    ['Opposite of "humble"?', ['Modest', 'Arrogant', 'Shy', 'Quiet'], 1],
    ['What does "lucid" mean?', ['Confused', 'Dark', 'Clear', 'Loud'], 2],
    ['Synonym of "cunning"?', ['Stupid', 'Honest', 'Clever', 'Weak'], 2],
    ['Opposite of "polite"?', ['Kind', 'Rude', 'Gentle', 'Calm'], 1],
    ['What does "ominous" mean?', ['Cheerful', 'Bright', 'Threatening', 'Quiet'], 2],
    ['Synonym of "meticulous"?', ['Careless', 'Thorough', 'Quick', 'Random'], 1],
    ['Opposite of "vivid"?', ['Bright', 'Dull', 'Loud', 'Clear'], 1],
    ['What does "ambiguous" mean?', ['Clear', 'Uncertain', 'Simple', 'Bold'], 1],
    ['Synonym of "reluctant"?', ['Eager', 'Hesitant', 'Bold', 'Quick'], 1],
    ['Opposite of "serene"?', ['Calm', 'Peaceful', 'Chaotic', 'Quiet'], 2],
    ['What does "frugal" mean?', ['Wasteful', 'Thrifty', 'Rich', 'Greedy'], 1],
    ['Synonym of "eloquent"?', ['Silent', 'Articulate', 'Boring', 'Shy'], 1],
    ['Opposite of "covert"?', ['Hidden', 'Overt', 'Secret', 'Quiet'], 1],
    ['What does "arduous" mean?', ['Easy', 'Difficult', 'Quick', 'Fun'], 1],
    ['Synonym of "abundant"?', ['Scarce', 'Plentiful', 'Small', 'Empty'], 1],
    ['Opposite of "rigid"?', ['Stiff', 'Hard', 'Flexible', 'Tough'], 2],
    ['What does "pragmatic" mean?', ['Dreamy', 'Practical', 'Lazy', 'Emotional'], 1],
    ['Synonym of "vigilant"?', ['Careless', 'Watchful', 'Sleepy', 'Slow'], 1],
    ['Opposite of "conceal"?', ['Hide', 'Cover', 'Reveal', 'Bury'], 2],
    ['What does "tenacious" mean?', ['Weak', 'Persistent', 'Lazy', 'Timid'], 1],
  ];
  for (const [q, opts, ci] of vocabQs) {
    questions.push({ id: id(), category: 'vocabulary', question: q, options: opts, correctIndex: ci });
  }

  // ── Flags & Capitals (32 questions) ──
  const capitalQs: [string, string[], number][] = [
    ['Capital of Ghana?', ['Lagos', 'Accra', 'Kumasi', 'Tema'], 1],
    ['Capital of Japan?', ['Osaka', 'Kyoto', 'Tokyo', 'Hiroshima'], 2],
    ['Capital of Australia?', ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], 2],
    ['Capital of Brazil?', ['Rio de Janeiro', 'Sao Paulo', 'Brasilia', 'Salvador'], 2],
    ['Capital of Canada?', ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], 2],
    ['Capital of Egypt?', ['Alexandria', 'Cairo', 'Luxor', 'Giza'], 1],
    ['Capital of France?', ['Lyon', 'Marseille', 'Paris', 'Nice'], 2],
    ['Capital of Germany?', ['Munich', 'Hamburg', 'Frankfurt', 'Berlin'], 3],
    ['Capital of India?', ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'], 1],
    ['Capital of Italy?', ['Milan', 'Venice', 'Rome', 'Florence'], 2],
    ['Capital of Kenya?', ['Mombasa', 'Kisumu', 'Nairobi', 'Nakuru'], 2],
    ['Capital of Mexico?', ['Guadalajara', 'Mexico City', 'Cancun', 'Monterrey'], 1],
    ['Capital of Nigeria?', ['Lagos', 'Abuja', 'Kano', 'Ibadan'], 1],
    ['Capital of Russia?', ['St. Petersburg', 'Moscow', 'Kazan', 'Sochi'], 1],
    ['Capital of South Africa?', ['Johannesburg', 'Cape Town', 'Pretoria', 'Durban'], 2],
    ['Capital of South Korea?', ['Busan', 'Seoul', 'Incheon', 'Daegu'], 1],
    ['Capital of Spain?', ['Barcelona', 'Seville', 'Madrid', 'Valencia'], 2],
    ['Capital of Turkey?', ['Istanbul', 'Ankara', 'Izmir', 'Antalya'], 1],
    ['Capital of the UK?', ['Manchester', 'Birmingham', 'London', 'Edinburgh'], 2],
    ['Capital of China?', ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen'], 1],
    ['Capital of Argentina?', ['Cordoba', 'Rosario', 'Buenos Aires', 'Mendoza'], 2],
    ['Capital of Thailand?', ['Chiang Mai', 'Phuket', 'Pattaya', 'Bangkok'], 3],
    ['Capital of Morocco?', ['Casablanca', 'Marrakech', 'Rabat', 'Fes'], 2],
    ['Capital of Poland?', ['Krakow', 'Warsaw', 'Gdansk', 'Wroclaw'], 1],
    ['Capital of Ethiopia?', ['Dire Dawa', 'Addis Ababa', 'Gondar', 'Hawassa'], 1],
    ['Capital of Peru?', ['Cusco', 'Arequipa', 'Lima', 'Trujillo'], 2],
    ['Capital of Sweden?', ['Gothenburg', 'Malmo', 'Stockholm', 'Uppsala'], 2],
    ['Capital of Indonesia?', ['Jakarta', 'Bali', 'Surabaya', 'Nusantara'], 0],
    ['Capital of Pakistan?', ['Karachi', 'Lahore', 'Islamabad', 'Peshawar'], 2],
    ['Capital of Colombia?', ['Medellin', 'Bogota', 'Cali', 'Cartagena'], 1],
    ['Capital of Tanzania?', ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza'], 1],
    ['Capital of New Zealand?', ['Auckland', 'Wellington', 'Christchurch', 'Hamilton'], 1],
  ];
  for (const [q, opts, ci] of capitalQs) {
    questions.push({ id: id(), category: 'capitals', question: q, options: opts, correctIndex: ci });
  }

  // ── Stroop Colors (30 questions) ──
  // The word says one color, displayed in a DIFFERENT color. Answer = display color.
  const colorNames = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'White'];
  const colorCSS: Record<string, string> = {
    Red: '#ef4444', Blue: '#3b82f6', Green: '#22c55e', Yellow: '#eab308',
    Purple: '#a855f7', Orange: '#f97316', Pink: '#ec4899', White: '#f8fafc',
  };

  for (let i = 0; i < 30; i++) {
    // Pick a word and a different display color
    const wordIdx = i % colorNames.length;
    let displayIdx = (i + 1 + Math.floor(i / colorNames.length)) % colorNames.length;
    if (displayIdx === wordIdx) displayIdx = (displayIdx + 1) % colorNames.length;

    const word = colorNames[wordIdx];
    const displayColorName = colorNames[displayIdx];

    // Build 4 options: correct + 3 distractors
    const correctAnswer = displayColorName;
    const distractors = colorNames
      .filter(c => c !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allOptions = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
    const correctIndex = allOptions.indexOf(correctAnswer);

    questions.push({
      id: id(),
      category: 'colors',
      question: `What COLOR is this text displayed in?\n"${word}"`,
      options: allOptions,
      correctIndex,
      displayColor: colorCSS[displayColorName],
    });
  }

  // ── General Knowledge (32 questions) ──
  const generalQs: [string, string[], number][] = [
    ['Largest planet in our solar system?', ['Saturn', 'Jupiter', 'Neptune', 'Uranus'], 1],
    ['Who painted the Mona Lisa?', ['Picasso', 'Da Vinci', 'Van Gogh', 'Monet'], 1],
    ['How many continents are there?', ['5', '6', '7', '8'], 2],
    ['What is the chemical symbol for gold?', ['Go', 'Gd', 'Au', 'Ag'], 2],
    ['Which ocean is the largest?', ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3],
    ['Who invented the telephone?', ['Edison', 'Tesla', 'Bell', 'Marconi'], 2],
    ['What is the hardest natural substance?', ['Iron', 'Diamond', 'Quartz', 'Ruby'], 1],
    ['How many bones in the adult human body?', ['186', '196', '206', '216'], 2],
    ['What is the speed of light (approx)?', ['300k km/s', '150k km/s', '500k km/s', '100k km/s'], 0],
    ['Which planet is closest to the Sun?', ['Venus', 'Mercury', 'Mars', 'Earth'], 1],
    ['What year did World War II end?', ['1943', '1944', '1945', '1946'], 2],
    ['What is the largest organ in the human body?', ['Liver', 'Brain', 'Skin', 'Heart'], 2],
    ['Who wrote "Romeo and Juliet"?', ['Dickens', 'Shakespeare', 'Austen', 'Twain'], 1],
    ['What is H2O commonly known as?', ['Oxygen', 'Hydrogen', 'Water', 'Helium'], 2],
    ['Which country has the most people?', ['USA', 'India', 'China', 'Indonesia'], 1],
    ['What is the smallest prime number?', ['0', '1', '2', '3'], 2],
    ['How many players on a soccer team?', ['9', '10', '11', '12'], 2],
    ['What does DNA stand for?', ['Dinucleic Acid', 'Deoxyribonucleic Acid', 'Dinitro Acid', 'Deoxyribo Acid'], 1],
    ['Which gas do plants absorb?', ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], 2],
    ['Who developed the theory of relativity?', ['Newton', 'Einstein', 'Hawking', 'Bohr'], 1],
    ['What is the capital of the United States?', ['New York', 'Los Angeles', 'Washington D.C.', 'Chicago'], 2],
    ['How many legs does a spider have?', ['6', '8', '10', '12'], 1],
    ['What is the boiling point of water in Celsius?', ['90', '95', '100', '110'], 2],
    ['Which instrument has 88 keys?', ['Guitar', 'Violin', 'Piano', 'Drum'], 2],
    ['What is the largest desert on Earth?', ['Sahara', 'Antarctic', 'Gobi', 'Arabian'], 1],
    ['Who was the first person on the Moon?', ['Buzz Aldrin', 'Neil Armstrong', 'John Glenn', 'Yuri Gagarin'], 1],
    ['What is the tallest mountain on Earth?', ['K2', 'Kangchenjunga', 'Everest', 'Lhotse'], 2],
    ['How many teeth does an adult have?', ['28', '30', '32', '34'], 2],
    ['Which blood type is a universal donor?', ['A', 'B', 'AB', 'O'], 3],
    ['What is the longest river in the world?', ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], 1],
    ['In which year did Ghana gain independence?', ['1955', '1957', '1960', '1963'], 1],
    ['What does CPU stand for?', ['Central Process Unit', 'Central Processing Unit', 'Computer Process Unit', 'Core Processing Unit'], 1],
  ];
  for (const [q, opts, ci] of generalQs) {
    questions.push({ id: id(), category: 'general', question: q, options: opts, correctIndex: ci });
  }

  return questions;
}

// Memoize question bank at module level
const ALL_QUESTIONS = buildQuestionBank();

function pickQuestions(count: number): Question[] {
  // Pick evenly from each category, then shuffle
  const perCat = Math.ceil(count / CATEGORIES.length);
  const grouped: Record<Category, Question[]> = {
    math: [], vocabulary: [], capitals: [], colors: [], general: [],
  };
  for (const q of ALL_QUESTIONS) grouped[q.category].push(q);

  const picked: Question[] = [];
  for (const cat of CATEGORIES) {
    const shuffled = [...grouped[cat]].sort(() => Math.random() - 0.5);
    picked.push(...shuffled.slice(0, perCat));
  }

  // Shuffle and trim to exact count
  return picked.sort(() => Math.random() - 0.5).slice(0, count);
}

// ─── Animations (CSS keyframes injected once) ───────────────────────────────

const STYLE_ID = 'reflex-duel-animations';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes rd-pulse-green {
      0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
      70% { box-shadow: 0 0 0 16px rgba(34,197,94,0); }
      100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    }
    @keyframes rd-shake {
      0%, 100% { transform: translateX(0); }
      10%, 50%, 90% { transform: translateX(-4px); }
      30%, 70% { transform: translateX(4px); }
    }
    @keyframes rd-lockout-fade {
      0% { opacity: 1; }
      100% { opacity: 0.4; }
    }
    .rd-correct { animation: rd-pulse-green 0.6s ease-out; }
    .rd-wrong { animation: rd-shake 0.4s ease-out; }
    .rd-lockout { animation: rd-lockout-fade 0.3s forwards; }

    @keyframes rd-timer-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .rd-timer-critical { animation: rd-timer-pulse 0.5s infinite; color: #ef4444; }

    @keyframes rd-glow-correct {
      0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
      50% { box-shadow: 0 0 20px 6px rgba(34,197,94,0.3); }
      100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
    }
    .rd-glow-correct { animation: rd-glow-correct 0.8s ease-out; }

    @keyframes rd-score-pop {
      0% { transform: scale(1); }
      30% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
    .rd-score-pop { animation: rd-score-pop 0.4s ease-out; }

    @keyframes rd-cat-slide {
      0% { opacity: 0; transform: translateY(-10px) scale(0.8); }
      60% { transform: translateY(2px) scale(1.05); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .rd-cat-slide { animation: rd-cat-slide 0.4s ease-out; }

    @keyframes rd-btn-press {
      0% { transform: scale(1); }
      50% { transform: scale(0.92); }
      100% { transform: scale(1); }
    }
    .rd-btn-press { animation: rd-btn-press 0.15s ease-out; }

    @keyframes rd-cat-icon-pop {
      0% { transform: scale(0) rotate(-20deg); opacity: 0; }
      60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    .rd-cat-icon-pop { animation: rd-cat-icon-pop 0.5s ease-out; }

    @keyframes rd-timer-gradient {
      0% { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
    }
    .rd-timer-gradient {
      background-size: 200% 100%;
      animation: rd-timer-gradient 2s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOW TO PLAY
// ═══════════════════════════════════════════════════════════════════════════════

function HowToPlayReflex() {
  const [open, setOpen] = useState(false);

  const rules = [
    { icon: Target, text: 'A question appears with 4 answers — tap the correct one fastest.', accent: 'text-blue-400' },
    { icon: AlertTriangle, text: 'Wrong answer = 2 second lockout penalty.', accent: 'text-red-400' },
    { icon: Clock, text: 'Speed bonus: under 1s = 3x, under 2s = 2x, under 3s = 1.5x points.', accent: 'text-amber-400' },
    { icon: Zap, text: '15 rounds per match in multiplayer, 20 in solo.', accent: 'text-emerald-400' },
    { icon: Award, text: '5 categories: Math, Vocabulary, Capitals, Stroop Colors, General Knowledge.', accent: 'text-violet-400' },
    { icon: Users, text: 'Solo: beat your own score. Multiplayer: first to tap correct wins the round.', accent: 'text-pink-400' },
  ];

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl',
          'bg-gradient-to-r from-rose-500/10 to-fuchsia-500/10',
          'border border-rose-500/20 dark:border-rose-500/30',
          'hover:from-rose-500/15 hover:to-fuchsia-500/15',
          'transition-all duration-200 text-sm font-bold',
          open ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground hover:text-rose-500',
        )}
      >
        <Lightbulb className="w-4 h-4" />
        How to Play
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-2">
              {rules.map((rule, i) => {
                const Icon = rule.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl bg-card/80 dark:bg-card/50 border border-border/50 hover:border-rose-500/30 transition-colors"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted/50', rule.accent)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-muted-foreground leading-relaxed pt-1">{rule.text}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORE COMPARISON BAR
// ═══════════════════════════════════════════════════════════════════════════════

function ScoreComparisonBar({ p1Score, p2Score, p1Name, p2Name }: { p1Score: number; p2Score: number; p1Name: string; p2Name: string }) {
  const total = p1Score + p2Score;
  const p1Pct = total > 0 ? (p1Score / total) * 100 : 50;

  return (
    <div className="max-w-lg mx-auto w-full px-4 py-3">
      <div className="flex items-center justify-between text-sm font-bold mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-rose-500 tabular-nums">{p1Score}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">{p1Name}</span>
        </div>
        <div className="text-xs font-black text-muted-foreground/40">VS</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">{p2Name}</span>
          <span className="text-fuchsia-500 tabular-nums">{p2Score}</span>
        </div>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden flex">
        <motion.div
          className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-l-full"
          animate={{ width: `${p1Pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full bg-gradient-to-r from-fuchsia-400 to-fuchsia-500 rounded-r-full"
          animate={{ width: `${100 - p1Pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ReflexDuel() {
  const navigate = useNavigate();

  // ── Shared hooks ──
  const { player, getPlayerId, getDisplayName } = usePlayerProfile();
  const { streak, recordWin, recordLoss } = useStreakTracker();
  const { submitScore } = useLeaderboard({ gameSlug: 'reflex-duel' });
  const ai = useGameAI({ difficulty: 0.5, baseResponseTime: 2500 });

  // ── Game state ──
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [mode, setMode] = useState<GameMode>('solo');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');

  // Round state
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [p1Answered, setP1Answered] = useState(false);
  const [p2Answered, setP2Answered] = useState(false);
  const [p1Locked, setP1Locked] = useState(false);
  const [p2Locked, setP2Locked] = useState(false);
  const [p1Choice, setP1Choice] = useState<number | null>(null);
  const [p2Choice, setP2Choice] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_LIMIT_MS);
  const [soundOn, setSoundOn] = useState(true);

  // Solo-specific
  const [soloStartTime, setSoloStartTime] = useState(0);
  const [soloTotalTime, setSoloTotalTime] = useState(0);
  const [soloCorrect, setSoloCorrect] = useState(0);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockoutTimerP1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockoutTimerP2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const betweenRoundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Online room ──
  const gameRoom = useGameRoom({
    gameSlug: 'reflex-duel',
    playerName: getDisplayName(),
    onPlayerJoined: (name) => setP2Name(name),
    onGameStart: (payload) => {
      const qs = payload.questions as Question[];
      if (qs) {
        setQuestions(qs);
        setPhase('countdown');
      }
    },
    onBroadcast: (event, payload) => {
      if (event === 'answer') {
        handleOnlineOpponentAnswer(
          payload.choiceIndex as number,
          payload.timeMs as number,
        );
      }
    },
  });

  // Inject CSS animations on mount
  useEffect(() => { injectStyles(); }, []);

  // ── Timer countdown ──
  useEffect(() => {
    if (phase === 'playing' && mode !== 'solo') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 100;
          if (next <= 0) {
            // Time is up for this round
            clearInterval(timerRef.current!);
            endRound();
            return 0;
          }
          return next;
        });
      }, 100);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase, currentRound, mode]);

  // ── Cleanup all timers on unmount ──
  useEffect(() => {
    return () => {
      [timerRef, aiTimerRef, lockoutTimerP1, lockoutTimerP2, roundResultTimerRef, betweenRoundTimerRef].forEach(ref => {
        if (ref.current) {
          if (typeof ref.current === 'number') clearTimeout(ref.current);
          else clearInterval(ref.current as ReturnType<typeof setInterval>);
        }
      });
    };
  }, []);

  // ── Derived ──
  const currentQuestion = questions[currentRound] ?? null;
  const totalRounds = mode === 'solo' ? SOLO_QUESTIONS : ROUNDS_PER_MATCH;
  const isLastRound = currentRound >= totalRounds - 1;

  // ═════════════════════════════════════════════════════════════════════════════
  // GAME LOGIC
  // ═════════════════════════════════════════════════════════════════════════════

  const startGame = useCallback((selectedMode: GameMode) => {
    setMode(selectedMode);
    const count = selectedMode === 'solo' ? SOLO_QUESTIONS : ROUNDS_PER_MATCH;
    const qs = pickQuestions(count);
    setQuestions(qs);
    setCurrentRound(0);
    setP1Score(0);
    setP2Score(0);
    setP1Name(getDisplayName());
    setP2Name(selectedMode === 'solo' ? ai.aiName : 'Player 2');
    setSoloStartTime(0);
    setSoloTotalTime(0);
    setSoloCorrect(0);

    if (selectedMode === 'online') {
      setPhase('lobby');
    } else {
      setPhase('countdown');
    }
  }, [getDisplayName, ai.aiName]);

  const beginRound = useCallback(() => {
    setP1Answered(false);
    setP2Answered(false);
    setP1Locked(false);
    setP2Locked(false);
    setP1Choice(null);
    setP2Choice(null);
    setRoundResult(null);
    setTimeLeft(ROUND_TIME_LIMIT_MS);
    setRoundStartTime(Date.now());
    setPhase('playing');

    if (mode === 'solo') {
      setSoloStartTime(Date.now());
    }

    // Schedule AI answer in solo mode
    if (mode === 'solo') {
      // No AI opponent in solo — it is a time trial
    }
  }, [mode]);

  const endRound = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  }, []);

  // Handle P1 answer (human, local-P1, or online-self)
  const handleP1Answer = useCallback((choiceIndex: number) => {
    if (p1Answered || p1Locked || phase !== 'playing' || !currentQuestion) return;

    const timeMs = Date.now() - roundStartTime;
    const isCorrect = choiceIndex === currentQuestion.correctIndex;

    setP1Choice(choiceIndex);

    if (mode === 'solo') {
      // Solo mode: just track correctness and move on
      setP1Answered(true);
      if (isCorrect) {
        setSoloCorrect(prev => prev + 1);
        const points = Math.round(BASE_POINTS * getSpeedMultiplier(timeMs));
        setP1Score(prev => prev + points);
      }
      // Brief result display then next question
      setRoundResult({
        winner: isCorrect ? 'p1' : 'none',
        p1Correct: isCorrect,
        p2Correct: false,
        p1Time: timeMs,
        p2Time: null,
        p1Points: isCorrect ? Math.round(BASE_POINTS * getSpeedMultiplier(timeMs)) : 0,
        p2Points: 0,
        correctIndex: currentQuestion.correctIndex,
      });
      setPhase('round-result');
      roundResultTimerRef.current = setTimeout(() => {
        if (currentRound < totalRounds - 1) {
          setCurrentRound(prev => prev + 1);
          setPhase('between-rounds');
          betweenRoundTimerRef.current = setTimeout(() => beginRound(), BETWEEN_ROUND_MS);
        } else {
          setSoloTotalTime(Date.now() - (soloStartTime || Date.now()));
          setPhase('game-over');
        }
      }, ROUND_RESULT_MS);
      return;
    }

    // Multiplayer (local or online)
    if (isCorrect) {
      setP1Answered(true);
      const points = Math.round(BASE_POINTS * getSpeedMultiplier(timeMs));
      setP1Score(prev => prev + points);

      if (mode === 'online') {
        gameRoom.broadcast('answer', { choiceIndex, timeMs });
      }

      // Check if round should end
      resolveMultiplayerRound(true, choiceIndex, timeMs, 'p1');
    } else {
      // Wrong answer — lockout
      setP1Locked(true);
      if (mode === 'online') {
        gameRoom.broadcast('answer', { choiceIndex, timeMs });
      }
      lockoutTimerP1.current = setTimeout(() => {
        setP1Locked(false);
      }, LOCKOUT_MS);
    }
  }, [p1Answered, p1Locked, phase, currentQuestion, roundStartTime, mode, currentRound, totalRounds, soloStartTime, beginRound, gameRoom]);

  // Handle P2 answer (local player 2)
  const handleP2Answer = useCallback((choiceIndex: number) => {
    if (p2Answered || p2Locked || phase !== 'playing' || !currentQuestion || mode !== 'local') return;

    const timeMs = Date.now() - roundStartTime;
    const isCorrect = choiceIndex === currentQuestion.correctIndex;

    setP2Choice(choiceIndex);

    if (isCorrect) {
      setP2Answered(true);
      const points = Math.round(BASE_POINTS * getSpeedMultiplier(timeMs));
      setP2Score(prev => prev + points);
      resolveMultiplayerRound(true, choiceIndex, timeMs, 'p2');
    } else {
      setP2Locked(true);
      lockoutTimerP2.current = setTimeout(() => {
        setP2Locked(false);
      }, LOCKOUT_MS);
    }
  }, [p2Answered, p2Locked, phase, currentQuestion, roundStartTime, mode]);

  // Handle online opponent answer
  const handleOnlineOpponentAnswer = useCallback((choiceIndex: number, timeMs: number) => {
    if (!currentQuestion) return;
    const isCorrect = choiceIndex === currentQuestion.correctIndex;

    setP2Choice(choiceIndex);

    if (isCorrect) {
      setP2Answered(true);
      const points = Math.round(BASE_POINTS * getSpeedMultiplier(timeMs));
      setP2Score(prev => prev + points);
      resolveMultiplayerRound(true, choiceIndex, timeMs, 'p2');
    } else {
      setP2Locked(true);
      setTimeout(() => setP2Locked(false), LOCKOUT_MS);
    }
  }, [currentQuestion]);

  // Resolve multiplayer round when someone answers correctly
  const resolveMultiplayerRound = useCallback((correct: boolean, choiceIndex: number, timeMs: number, who: 'p1' | 'p2') => {
    if (!currentQuestion) return;

    endRound();

    const result: RoundResult = {
      winner: who,
      p1Correct: who === 'p1',
      p2Correct: who === 'p2',
      p1Time: who === 'p1' ? timeMs : null,
      p2Time: who === 'p2' ? timeMs : null,
      p1Points: who === 'p1' ? Math.round(BASE_POINTS * getSpeedMultiplier(timeMs)) : 0,
      p2Points: who === 'p2' ? Math.round(BASE_POINTS * getSpeedMultiplier(timeMs)) : 0,
      correctIndex: currentQuestion.correctIndex,
    };

    setRoundResult(result);
    setPhase('round-result');

    roundResultTimerRef.current = setTimeout(() => {
      if (currentRound < totalRounds - 1) {
        setCurrentRound(prev => prev + 1);
        setPhase('between-rounds');
        betweenRoundTimerRef.current = setTimeout(() => beginRound(), BETWEEN_ROUND_MS);
      } else {
        setPhase('game-over');
      }
    }, ROUND_RESULT_MS);
  }, [currentQuestion, currentRound, totalRounds, endRound, beginRound]);

  // ── Game over handlers ──
  const p1Won = p1Score > p2Score;
  const isDraw = p1Score === p2Score;

  useEffect(() => {
    if (phase === 'game-over') {
      if (mode === 'solo') {
        // Submit solo score (points)
        submitScore({
          playerId: getPlayerId(),
          playerName: getDisplayName(),
          gameSlug: 'reflex-duel',
          score: p1Score,
          gameMode: 'solo',
          metadata: { correct: soloCorrect, total: totalRounds },
        });
        if (soloCorrect >= totalRounds * 0.7) recordWin();
        else recordLoss();
      } else {
        if (p1Won) recordWin();
        else if (!isDraw) recordLoss();

        submitScore({
          playerId: getPlayerId(),
          playerName: getDisplayName(),
          gameSlug: 'reflex-duel',
          score: p1Score,
          gameMode: mode,
          metadata: { opponentScore: p2Score, rounds: totalRounds },
        });
      }
    }
  }, [phase]);

  const handlePlayAgain = useCallback(() => {
    startGame(mode);
  }, [mode, startGame]);

  const handleBackToArcade = useCallback(() => {
    gameRoom.leaveRoom();
    navigate('/arcade');
  }, [navigate, gameRoom]);

  const handleShare = useCallback(() => {
    shareScore({
      gameName: 'Reflex Duel',
      score: p1Score,
      won: p1Won,
      streak: streak.current,
      url: 'https://techtrendi.com/arcade/reflex-duel',
    });
  }, [p1Score, p1Won, streak]);

  // Online: host starts game
  const handleOnlineStart = useCallback(() => {
    gameRoom.broadcast('game_start', { questions });
    setPhase('countdown');
  }, [gameRoom, questions]);

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  return (
    <Layout>
      <SEOHead
        title="Reflex Duel - Arcade"
        description="Test your reaction speed against opponents in this fast-paced trivia reflex game. 5 categories, 150+ questions. Who has the fastest reflexes?"
        canonical="https://techtrendi.com/arcade/reflex-duel"
      />

      {/* ── Menu / Mode Select ── */}
      {(phase === 'menu' || phase === 'mode-select') && (
        <div className="container py-8 max-w-2xl mx-auto">
          <Link
            to="/arcade"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Arcade
          </Link>

          <div className="text-center space-y-6 mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-500/30">
              <Zap className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
              Reflex Duel
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Answer trivia questions faster than your opponent. 5 categories, speed bonuses, and lockout penalties. Who has the sharpest reflexes?
            </p>
          </div>

          {/* Arena VS Scene */}
          <div className="relative mb-6">
            <svg viewBox="0 0 400 120" className="w-full max-w-sm mx-auto" aria-hidden="true">
              {/* Arena floor */}
              <ellipse cx="200" cy="100" rx="180" ry="16" fill="currentColor" className="text-muted/20" />
              {/* P1 figure */}
              <g className="text-rose-500">
                <circle cx="100" cy="50" r="16" fill="currentColor" />
                <rect x="92" y="68" width="16" height="28" rx="4" fill="currentColor" />
                <line x1="84" y1="76" x2="92" y2="84" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <line x1="108" y1="84" x2="116" y2="76" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </g>
              {/* VS text */}
              <text x="200" y="62" textAnchor="middle" className="fill-muted-foreground text-[28px] font-black" style={{ fontFamily: 'system-ui' }}>VS</text>
              {/* Lightning bolts */}
              <path d="M175 35 l8-12 l-3 8 l8 0 l-8 12 l3-8 l-8 0z" fill="currentColor" className="text-amber-400" />
              <path d="M217 35 l8-12 l-3 8 l8 0 l-8 12 l3-8 l-8 0z" fill="currentColor" className="text-amber-400" />
              {/* P2 figure */}
              <g className="text-fuchsia-500">
                <circle cx="300" cy="50" r="16" fill="currentColor" />
                <rect x="292" y="68" width="16" height="28" rx="4" fill="currentColor" />
                <line x1="284" y1="76" x2="292" y2="84" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <line x1="308" y1="84" x2="316" y2="76" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </g>
            </svg>
          </div>

          {/* Category preview */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              return (
                <div key={cat} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium', cfg.bg, cfg.color)}>
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </div>
              );
            })}
          </div>

          {/* How to Play */}
          <HowToPlayReflex />

          <GameModeSelector onSelect={startGame} />
        </div>
      )}

      {/* ── Online Lobby ── */}
      {phase === 'lobby' && (
        <div className="container py-8 max-w-2xl mx-auto">
          <RoomLobby
            roomCode={gameRoom.roomCode}
            isHost={gameRoom.isHost}
            opponentJoined={gameRoom.opponentJoined}
            opponentName={p2Name}
            onCreateRoom={gameRoom.createRoom}
            onJoinRoom={gameRoom.joinRoom}
            onStartGame={handleOnlineStart}
            onBack={() => setPhase('menu')}
          />
        </div>
      )}

      {/* ── Countdown ── */}
      <AnimatePresence>
        {phase === 'countdown' && (
          <CountdownOverlay onComplete={beginRound} />
        )}
      </AnimatePresence>

      {/* ── Playing / Round Result / Between Rounds ── */}
      {(phase === 'playing' || phase === 'round-result' || phase === 'between-rounds') && (
        mode === 'local' ? (
          <LocalGameView
            question={currentQuestion}
            round={currentRound}
            totalRounds={totalRounds}
            p1Score={p1Score}
            p2Score={p2Score}
            p1Name={p1Name}
            p2Name={p2Name}
            p1Locked={p1Locked}
            p2Locked={p2Locked}
            p1Answered={p1Answered}
            p2Answered={p2Answered}
            p1Choice={p1Choice}
            p2Choice={p2Choice}
            roundResult={roundResult}
            timeLeft={timeLeft}
            phase={phase}
            onP1Answer={handleP1Answer}
            onP2Answer={handleP2Answer}
          />
        ) : (
          <SinglePlayerView
            question={currentQuestion}
            round={currentRound}
            totalRounds={totalRounds}
            p1Score={p1Score}
            p2Score={mode === 'solo' ? undefined : p2Score}
            p1Name={p1Name}
            p2Name={mode === 'solo' ? undefined : p2Name}
            p1Locked={p1Locked}
            p1Answered={p1Answered}
            p1Choice={p1Choice}
            roundResult={roundResult}
            timeLeft={mode === 'solo' ? undefined : timeLeft}
            phase={phase}
            isSolo={mode === 'solo'}
            soloCorrect={soloCorrect}
            onAnswer={handleP1Answer}
            soundOn={soundOn}
            onToggleSound={() => setSoundOn(!soundOn)}
          />
        )
      )}

      {/* ── Game Over ── */}
      {phase === 'game-over' && (
        <div className="container py-8 max-w-lg mx-auto">
          {mode === 'solo' ? (
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-rose-500/30"
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="text-3xl font-black mb-2">Solo Complete!</h2>
                <p className="text-muted-foreground">
                  {soloCorrect}/{totalRounds} correct
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-5xl font-black tabular-nums bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent"
              >
                {p1Score.toLocaleString()}
              </motion.div>
              <p className="text-sm text-muted-foreground">points</p>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="space-y-3 pt-4">
                <Button size="lg" className="w-full h-14 text-base bg-gradient-to-r from-rose-500 to-fuchsia-600" onClick={handlePlayAgain}>
                  Play Again
                </Button>
                <div className="flex gap-3">
                  <Button size="lg" variant="outline" className="flex-1 h-12" onClick={handleShare}>
                    Share
                  </Button>
                  <Button size="lg" variant="ghost" className="flex-1 h-12" onClick={handleBackToArcade}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Arcade
                  </Button>
                </div>
              </motion.div>
            </div>
          ) : (
            <GameOverScreen
              won={p1Won}
              isDraw={isDraw}
              score={p1Score}
              opponentScore={p2Score}
              streak={streak.current}
              onPlayAgain={handlePlayAgain}
              onShare={handleShare}
              onBackToArcade={handleBackToArcade}
              playerName={p1Name}
              opponentName={p2Name}
            />
          )}
        </div>
      )}
    </Layout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE PLAYER VIEW (Solo + Online)
// ═══════════════════════════════════════════════════════════════════════════════

interface SinglePlayerViewProps {
  question: Question | null;
  round: number;
  totalRounds: number;
  p1Score: number;
  p2Score?: number;
  p1Name: string;
  p2Name?: string;
  p1Locked: boolean;
  p1Answered: boolean;
  p1Choice: number | null;
  roundResult: RoundResult | null;
  timeLeft?: number;
  phase: GamePhase;
  isSolo: boolean;
  soloCorrect?: number;
  onAnswer: (index: number) => void;
  soundOn: boolean;
  onToggleSound: () => void;
}

function SinglePlayerView({
  question, round, totalRounds, p1Score, p2Score, p1Name, p2Name,
  p1Locked, p1Answered, p1Choice, roundResult, timeLeft, phase,
  isSolo, soloCorrect, onAnswer, soundOn, onToggleSound,
}: SinglePlayerViewProps) {
  if (!question) return null;

  const showResult = phase === 'round-result' && roundResult;
  const catConfig = CATEGORY_CONFIG[question.category];
  const CatIcon = catConfig.icon;

  // Parse Stroop question
  const isStroop = question.category === 'colors';
  let stroopWord = '';
  if (isStroop) {
    const match = question.question.match(/"([^"]+)"/);
    if (match) stroopWord = match[1];
  }

  const timerPct = timeLeft !== undefined ? (timeLeft / ROUND_TIME_LIMIT_MS) * 100 : 100;
  const timerCritical = timeLeft !== undefined && timeLeft < 2000;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-2">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div key={question.category} className={cn('rd-cat-slide flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-md border', catConfig.bg, catConfig.color, 'border-current/20')}>
              <div className="rd-cat-icon-pop w-6 h-6 rounded-lg bg-current/10 flex items-center justify-center">
                <CatIcon className="w-4 h-4" />
              </div>
              {catConfig.label}
            </div>
            <span className="text-sm font-bold text-muted-foreground tabular-nums">
              {round + 1}/{totalRounds}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isSolo && soloCorrect !== undefined && (
              <span className="text-xs text-muted-foreground">
                {soloCorrect} correct
              </span>
            )}
            <button onClick={onToggleSound} className="text-muted-foreground hover:text-foreground transition-colors">
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Timer bar with gradient green->yellow->red */}
        {timeLeft !== undefined && (
          <div className="max-w-lg mx-auto mt-1.5">
            <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden shadow-inner">
              <motion.div
                className={cn('h-full rounded-full rd-timer-gradient', timerCritical && 'animate-pulse')}
                style={{
                  width: `${timerPct}%`,
                  background: timerPct > 60
                    ? 'linear-gradient(90deg, #22c55e, #4ade80, #86efac)'
                    : timerPct > 35
                    ? 'linear-gradient(90deg, #eab308, #facc15, #fde047)'
                    : timerPct > 15
                    ? 'linear-gradient(90deg, #f97316, #fb923c, #fdba74)'
                    : 'linear-gradient(90deg, #dc2626, #ef4444, #f87171)',
                  boxShadow: timerPct <= 15
                    ? '0 0 8px rgba(239,68,68,0.5)'
                    : timerPct <= 35
                    ? '0 0 6px rgba(249,115,22,0.3)'
                    : '0 0 6px rgba(34,197,94,0.3)',
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Animated score comparison bar (multiplayer) */}
      {!isSolo && p2Name && p2Score !== undefined && (
        <ScoreComparisonBar p1Score={p1Score} p2Score={p2Score} p1Name={p1Name} p2Name={p2Name} />
      )}

      {/* Solo score */}
      {isSolo && (
        <div className="max-w-lg mx-auto w-full px-4 py-3 text-center">
          <div className="text-3xl font-black tabular-nums bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
            {p1Score}
          </div>
          <div className="text-xs text-muted-foreground">points</div>
        </div>
      )}

      {/* Question area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6">
        <div className="max-w-lg w-full space-y-6">
          {/* Between rounds overlay */}
          {phase === 'between-rounds' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="text-6xl font-black text-muted-foreground/30 mb-2">
                Round {round + 1}
              </div>
              <div className="text-sm text-muted-foreground">Get ready...</div>
            </motion.div>
          )}

          {/* Question + Options */}
          {(phase === 'playing' || phase === 'round-result') && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`q-${round}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Question text */}
                <div className="text-center py-4">
                  {isStroop ? (
                    <div className="space-y-2">
                      <p className="text-base text-muted-foreground">What COLOR is this text displayed in?</p>
                      <p
                        className="text-5xl sm:text-6xl font-black py-4"
                        style={{ color: question.displayColor }}
                      >
                        {stroopWord}
                      </p>
                    </div>
                  ) : (
                    <h2 className="text-xl sm:text-2xl font-bold leading-snug px-2">
                      {question.question}
                    </h2>
                  )}
                </div>

                {/* Lockout indicator */}
                {p1Locked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 text-red-500 text-sm font-bold"
                  >
                    <Lock className="w-4 h-4" />
                    Locked out! Wait...
                  </motion.div>
                )}

                {/* Answer grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options.map((option, idx) => {
                    const isSelected = p1Choice === idx;
                    const isCorrectOption = showResult && idx === roundResult.correctIndex;
                    const isWrongSelection = showResult && isSelected && idx !== roundResult.correctIndex;
                    const optionStyles = [
                      { hover: 'hover:border-blue-400 hover:bg-blue-500/10 hover:shadow-blue-500/10', label: 'bg-blue-500', border: 'border-blue-500/30', activeBg: 'active:bg-blue-500/15' },
                      { hover: 'hover:border-emerald-400 hover:bg-emerald-500/10 hover:shadow-emerald-500/10', label: 'bg-emerald-500', border: 'border-emerald-500/30', activeBg: 'active:bg-emerald-500/15' },
                      { hover: 'hover:border-amber-400 hover:bg-amber-500/10 hover:shadow-amber-500/10', label: 'bg-amber-500', border: 'border-amber-500/30', activeBg: 'active:bg-amber-500/15' },
                      { hover: 'hover:border-purple-400 hover:bg-purple-500/10 hover:shadow-purple-500/10', label: 'bg-purple-500', border: 'border-purple-500/30', activeBg: 'active:bg-purple-500/15' },
                    ];
                    const s = optionStyles[idx];

                    return (
                      <motion.button
                        key={idx}
                        whileHover={(!p1Answered && !p1Locked && phase === 'playing') ? { scale: 1.03, y: -2 } : {}}
                        whileTap={(!p1Answered && !p1Locked && phase === 'playing') ? { scale: 0.93 } : {}}
                        onClick={() => onAnswer(idx)}
                        disabled={p1Answered || p1Locked || phase !== 'playing'}
                        className={cn(
                          'relative flex items-center gap-3 rounded-2xl p-4 sm:p-5 text-base sm:text-lg font-bold',
                          'border-2 transition-all duration-200 shadow-sm',
                          'min-h-[72px] sm:min-h-[88px] text-left',
                          // Default state
                          !showResult && !isSelected && `bg-card ${s.border} ${s.hover} ${s.activeBg} hover:shadow-md`,
                          // Locked out
                          p1Locked && 'rd-lockout opacity-40 cursor-not-allowed',
                          // Already answered
                          p1Answered && !showResult && 'opacity-60 cursor-not-allowed',
                          // Result: correct answer highlight with glow
                          isCorrectOption && 'rd-glow-correct bg-green-500/15 border-green-500 text-green-600 dark:text-green-400 shadow-green-500/20 shadow-md',
                          // Result: wrong selection
                          isWrongSelection && 'rd-wrong bg-red-500/15 border-red-500 text-red-600 dark:text-red-400 shadow-red-500/20 shadow-md',
                          // Selected but not yet resolved
                          isSelected && !showResult && 'border-primary bg-primary/10 shadow-primary/20 shadow-md',
                        )}
                      >
                        <span className={cn(
                          'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm',
                          isCorrectOption ? 'bg-green-500' : isWrongSelection ? 'bg-red-500' : isSelected && !showResult ? 'bg-primary' : s.label,
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">{option}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Round result banner */}
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'text-center py-3 rounded-xl font-bold text-sm',
                      roundResult.p1Correct
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    )}
                  >
                    {roundResult.p1Correct ? (
                      <>Correct! +{roundResult.p1Points} pts {roundResult.p1Time && roundResult.p1Time <= 1000 && '(3x speed bonus!)'}{roundResult.p1Time && roundResult.p1Time > 1000 && roundResult.p1Time <= 2000 && '(2x speed bonus!)'}{roundResult.p1Time && roundResult.p1Time > 2000 && roundResult.p1Time <= 3000 && '(1.5x speed bonus!)'}</>
                    ) : (
                      'Wrong answer!'
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL MULTIPLAYER VIEW (Split Screen)
// ═══════════════════════════════════════════════════════════════════════════════

interface LocalGameViewProps {
  question: Question | null;
  round: number;
  totalRounds: number;
  p1Score: number;
  p2Score: number;
  p1Name: string;
  p2Name: string;
  p1Locked: boolean;
  p2Locked: boolean;
  p1Answered: boolean;
  p2Answered: boolean;
  p1Choice: number | null;
  p2Choice: number | null;
  roundResult: RoundResult | null;
  timeLeft: number;
  phase: GamePhase;
  onP1Answer: (index: number) => void;
  onP2Answer: (index: number) => void;
}

function LocalGameView({
  question, round, totalRounds, p1Score, p2Score, p1Name, p2Name,
  p1Locked, p2Locked, p1Answered, p2Answered, p1Choice, p2Choice,
  roundResult, timeLeft, phase, onP1Answer, onP2Answer,
}: LocalGameViewProps) {
  if (!question) return null;

  const showResult = phase === 'round-result' && roundResult;
  const catConfig = CATEGORY_CONFIG[question.category];

  const isStroop = question.category === 'colors';
  let stroopWord = '';
  if (isStroop) {
    const match = question.question.match(/"([^"]+)"/);
    if (match) stroopWord = match[1];
  }

  const timerPct = (timeLeft / ROUND_TIME_LIMIT_MS) * 100;

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden select-none">
      {/* Between rounds overlay */}
      <AnimatePresence>
        {phase === 'between-rounds' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-background/90 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="text-5xl font-black text-muted-foreground/30 mb-2">
                Round {round + 1}
              </div>
              <div className="text-sm text-muted-foreground">Get ready...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Player 2 (Top Half — Rotated 180deg) ── */}
      <div className="flex-1 rotate-180 border-b-4 border-fuchsia-500/50 overflow-hidden">
        <LocalPlayerHalf
          playerLabel={p2Name}
          score={p2Score}
          question={question}
          isStroop={isStroop}
          stroopWord={stroopWord}
          locked={p2Locked}
          answered={p2Answered}
          choice={p2Choice}
          roundResult={roundResult}
          showResult={!!showResult}
          isP1={false}
          onAnswer={onP2Answer}
          phase={phase}
          color="fuchsia"
        />
      </div>

      {/* ── Center Bar (scores + timer + round) ── */}
      <div className="relative z-30 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-600 px-4 py-2 flex items-center justify-between text-white shadow-lg">
        <div className="text-center min-w-[60px]">
          <div className="text-lg font-black tabular-nums">{p1Score}</div>
          <div className="text-[10px] uppercase tracking-wide opacity-80">{p1Name}</div>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-bold opacity-80">{catConfig.label}</span>
          <span className="text-sm font-black tabular-nums">{round + 1}/{totalRounds}</span>
          {/* Mini timer */}
          <div className="w-20 h-1 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>

        <div className="text-center min-w-[60px]">
          <div className="text-lg font-black tabular-nums">{p2Score}</div>
          <div className="text-[10px] uppercase tracking-wide opacity-80">{p2Name}</div>
        </div>
      </div>

      {/* ── Player 1 (Bottom Half) ── */}
      <div className="flex-1 overflow-hidden">
        <LocalPlayerHalf
          playerLabel={p1Name}
          score={p1Score}
          question={question}
          isStroop={isStroop}
          stroopWord={stroopWord}
          locked={p1Locked}
          answered={p1Answered}
          choice={p1Choice}
          roundResult={roundResult}
          showResult={!!showResult}
          isP1={true}
          onAnswer={onP1Answer}
          phase={phase}
          color="rose"
        />
      </div>
    </div>
  );
}

// ── Local Player Half ──

interface LocalPlayerHalfProps {
  playerLabel: string;
  score: number;
  question: Question;
  isStroop: boolean;
  stroopWord: string;
  locked: boolean;
  answered: boolean;
  choice: number | null;
  roundResult: RoundResult | null;
  showResult: boolean;
  isP1: boolean;
  onAnswer: (index: number) => void;
  phase: GamePhase;
  color: string;
}

function LocalPlayerHalf({
  question, isStroop, stroopWord, locked, answered, choice,
  roundResult, showResult, isP1, onAnswer, phase,
}: LocalPlayerHalfProps) {
  const correctIndex = roundResult?.correctIndex ?? -1;

  return (
    <div className="h-full flex flex-col justify-center px-3 py-2">
      {/* Compact question */}
      <div className="text-center mb-3">
        {isStroop ? (
          <p
            className="text-2xl sm:text-3xl font-black"
            style={{ color: question.displayColor }}
          >
            {stroopWord}
          </p>
        ) : (
          <p className="text-sm sm:text-base font-bold leading-tight px-1 line-clamp-2">
            {question.question}
          </p>
        )}
      </div>

      {/* Lockout */}
      {locked && (
        <div className="flex items-center justify-center gap-1 text-red-500 text-xs font-bold mb-2">
          <Lock className="w-3 h-3" /> Locked!
        </div>
      )}

      {/* 2x2 answer grid */}
      <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto w-full">
        {question.options.map((option, idx) => {
          const isSelected = choice === idx;
          const isCorrectOption = showResult && idx === correctIndex;
          const isWrongSelection = showResult && isSelected && idx !== correctIndex;
          const labelColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
          const borderColors = ['border-blue-500/30', 'border-emerald-500/30', 'border-amber-500/30', 'border-purple-500/30'];

          return (
            <button
              key={idx}
              onClick={() => onAnswer(idx)}
              disabled={answered || locked || phase !== 'playing'}
              className={cn(
                'relative rounded-xl p-3 text-sm font-bold border-2 transition-all',
                'min-h-[56px] flex items-center gap-2 text-center',
                !showResult && !isSelected && `bg-card ${borderColors[idx]} active:scale-95`,
                locked && 'rd-lockout opacity-40',
                answered && !showResult && 'opacity-60',
                isCorrectOption && 'rd-correct bg-green-500/20 border-green-500 text-green-500',
                isWrongSelection && 'rd-wrong bg-red-500/20 border-red-500 text-red-500',
                isSelected && !showResult && 'border-primary bg-primary/10',
              )}
            >
              <span className={cn(
                'flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white',
                isCorrectOption ? 'bg-green-500' : isWrongSelection ? 'bg-red-500' : isSelected && !showResult ? 'bg-primary' : labelColors[idx],
              )}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1 text-center">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Result feedback */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'text-center mt-2 text-xs font-bold',
            (isP1 ? roundResult?.p1Correct : roundResult?.p2Correct)
              ? 'text-green-500' : 'text-red-500'
          )}
        >
          {(isP1 ? roundResult?.p1Correct : roundResult?.p2Correct)
            ? `+${isP1 ? roundResult?.p1Points : roundResult?.p2Points} pts!`
            : (isP1 ? roundResult?.winner === 'p2' : roundResult?.winner === 'p1')
              ? 'Opponent scored!'
              : 'No one scored'}
        </motion.div>
      )}
    </div>
  );
}
