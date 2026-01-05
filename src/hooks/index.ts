/**
 * TechTrendi Custom Hooks
 *
 * This file exports all custom hooks for easy importing.
 * Import hooks like: import { useScrollAnimation, useTabPersistence } from '@/hooks';
 */

// ============================================
// SCROLL & ANIMATION HOOKS
// ============================================
export {
  useScrollAnimation,
  useParallax,
  useReadingProgress,
  useSmartNavbar,
  useScrollToTop,
  useTiltEffect,
  useCounter,
  useKeyboardNavigation
} from './useScrollAnimation';

// ============================================
// PERSISTENCE HOOKS
// ============================================
export {
  useTabPersistence,
  useUIPreferences,
  useScrollRestoration,
  useFormPersistence
} from './useTabPersistence';
