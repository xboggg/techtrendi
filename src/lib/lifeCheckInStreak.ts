// Daily check-in streak for the Life Progress Bar — the "come back tomorrow"
// hook. Purely client-side (localStorage), no account needed: a visitor who
// opens the page on consecutive calendar days keeps the streak; missing a
// day resets it to 1 on their next visit.
const STORAGE_KEY = "techtrendi_life_progress_streak";

export interface StreakState {
  count: number;
  lastVisitDate: string; // YYYY-MM-DD, visitor's local date
  longestCount: number;
}

function todayLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

// Call once per page load. Returns the up-to-date streak state after
// recording today's visit (idempotent — visiting twice in one day doesn't
// double-count).
export function recordCheckIn(): StreakState {
  const today = todayLocal();
  let prev: StreakState | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) prev = JSON.parse(raw);
  } catch {
    prev = null;
  }

  let next: StreakState;
  if (!prev) {
    next = { count: 1, lastVisitDate: today, longestCount: 1 };
  } else if (prev.lastVisitDate === today) {
    next = prev; // already checked in today, no change
  } else {
    const gap = daysBetween(prev.lastVisitDate, today);
    const newCount = gap === 1 ? prev.count + 1 : 1; // consecutive day vs. broken streak
    next = {
      count: newCount,
      lastVisitDate: today,
      longestCount: Math.max(newCount, prev.longestCount),
    };
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private browsing, quota) — streak just won't persist
  }
  return next;
}
