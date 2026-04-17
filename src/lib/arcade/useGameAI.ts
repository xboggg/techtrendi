// ─── useGameAI — AI opponent with configurable difficulty ────────────────────

import { useCallback, useRef } from 'react';

interface AIConfig {
  /** Difficulty from 0 (easy) to 1 (impossible). Default 0.5 */
  difficulty: number;
  /** Base response time in ms. AI responds between baseTime*0.5 and baseTime*2 */
  baseResponseTime: number;
}

interface UseGameAIReturn {
  /** Get AI response time in ms (simulates thinking) */
  getResponseTime: () => number;
  /** Determine if AI answers correctly based on difficulty */
  shouldAnswerCorrectly: () => boolean;
  /** Get a plausible wrong answer near the correct one */
  getWrongAnswer: (correctAnswer: number) => number;
  /** AI "types" text with realistic speed — returns characters per interval */
  getTypingSpeed: () => number;
  /** AI reaction time in ms (for reflex-type games) */
  getReactionTime: () => number;
  /** Get AI display name */
  aiName: string;
  /** Update difficulty mid-game */
  setDifficulty: (d: number) => void;
}

const AI_NAMES = [
  'CyberBot',
  'NeuraMind',
  'QuantumQ',
  'ByteStorm',
  'LogicPrime',
  'CodeNinja',
  'PixelWiz',
  'DataDash',
];

export function useGameAI(config?: Partial<AIConfig>): UseGameAIReturn {
  const difficultyRef = useRef(config?.difficulty ?? 0.5);
  const baseTimeRef = useRef(config?.baseResponseTime ?? 3000);
  const nameRef = useRef(AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)]);

  const setDifficulty = useCallback((d: number) => {
    difficultyRef.current = Math.max(0, Math.min(1, d));
  }, []);

  // Response time: harder AI is faster
  const getResponseTime = useCallback(() => {
    const d = difficultyRef.current;
    const base = baseTimeRef.current;
    // Easy AI: 1.5-3x base time. Hard AI: 0.3-0.8x base time
    const minMultiplier = 0.3 + (1 - d) * 1.2; // 0.3 (hard) to 1.5 (easy)
    const maxMultiplier = 0.8 + (1 - d) * 1.2; // 0.8 (hard) to 2.0 (easy)
    const multiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
    return Math.round(base * multiplier);
  }, []);

  // Accuracy: harder AI is more likely to be correct
  const shouldAnswerCorrectly = useCallback(() => {
    const d = difficultyRef.current;
    // Easy: 40% correct, Medium: 70%, Hard: 90%, Impossible: 98%
    const accuracy = 0.4 + d * 0.58;
    return Math.random() < accuracy;
  }, []);

  // Generate a plausible wrong answer
  const getWrongAnswer = useCallback((correctAnswer: number) => {
    const offsets = [-3, -2, -1, 1, 2, 3, 5, 10, -5, -10];
    const offset = offsets[Math.floor(Math.random() * offsets.length)];
    return correctAnswer + offset;
  }, []);

  // Typing speed: characters revealed per 100ms interval
  const getTypingSpeed = useCallback(() => {
    const d = difficultyRef.current;
    // Easy: ~2-4 chars/100ms (~20-40 WPM). Hard: ~6-10 chars/100ms (~60-100 WPM)
    const base = 2 + d * 6;
    const variance = (Math.random() - 0.5) * 2;
    return Math.max(1, Math.round(base + variance));
  }, []);

  // Reaction time for reflex games
  const getReactionTime = useCallback(() => {
    const d = difficultyRef.current;
    // Easy: 500-800ms. Hard: 150-250ms. Impossible: 100-180ms
    const minTime = 100 + (1 - d) * 400; // 100 (hard) to 500 (easy)
    const maxTime = 180 + (1 - d) * 620; // 180 (hard) to 800 (easy)
    return Math.round(minTime + Math.random() * (maxTime - minTime));
  }, []);

  return {
    getResponseTime,
    shouldAnswerCorrectly,
    getWrongAnswer,
    getTypingSpeed,
    getReactionTime,
    aiName: nameRef.current,
    setDifficulty,
  };
}
