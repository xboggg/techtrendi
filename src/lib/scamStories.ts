// Shared constants + client-side helpers for the "Share Your Story" feature.
// Kept in one place so the submission form, the board, and any future admin
// tooling agree on the exact same category/region labels.

export const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
];

// Ghana first, then ~30 other countries with meaningful Ghanaian diaspora /
// readership, alphabetical after that.
export const COUNTRIES = [
  "Ghana",
  "Benin",
  "Burkina Faso",
  "Cameroon",
  "Canada",
  "Cote d'Ivoire",
  "Egypt",
  "Ethiopia",
  "France",
  "Gambia",
  "Germany",
  "India",
  "Ireland",
  "Italy",
  "Kenya",
  "Liberia",
  "Mali",
  "Morocco",
  "Netherlands",
  "Nigeria",
  "Norway",
  "Qatar",
  "Rwanda",
  "Saudi Arabia",
  "Senegal",
  "Sierra Leone",
  "South Africa",
  "Spain",
  "Sweden",
  "Switzerland",
  "Togo",
  "Uganda",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
];

export const SCAM_CATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: "giveaway", label: "Fake Giveaway / Free Data", emoji: "\u{1F381}" },
  { value: "rental", label: "Rental / Apartment Scam", emoji: "\u{1F3E0}" },
  { value: "job_offer", label: "Fake Job Offer", emoji: "\u{1F4BC}" },
  { value: "romance", label: "Romance Scam", emoji: "❤️" },
  { value: "mobile_money", label: "Mobile Money Fraud", emoji: "\u{1F4F1}" },
  { value: "delivery", label: "Fake Delivery / Parcel Fee", emoji: "\u{1F4E6}" },
  { value: "boss_fraud", label: "Boss / CEO Impersonation", emoji: "\u{1F454}" },
  { value: "investment", label: "Investment / Crypto Scam", emoji: "\u{1F4C8}" },
  { value: "phishing_link", label: "Phishing Link / Fake Website", emoji: "\u{1F3A3}" },
  { value: "other", label: "Something Else", emoji: "❓" },
];

export function categoryLabel(value: string): string {
  return SCAM_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function categoryEmoji(value: string): string {
  return SCAM_CATEGORIES.find((c) => c.value === value)?.emoji || "\u{1F4CC}";
}

// ── Rate limiting (per-browser, localStorage-based) ─────────────────────────
// Same shape as the RateLimiter class in src/lib/security.ts, but standalone
// so this feature has no dependency on that file's in-memory-only limiter
// (which resets on page reload and wouldn't survive navigation).
const SUBMIT_KEY = "techtrendi:story-submits";
const MAX_SUBMITS = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getSubmitCooldown(): { allowed: boolean; retryInMinutes: number } {
  try {
    const raw = localStorage.getItem(SUBMIT_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const recent = timestamps.filter((t) => now - t < WINDOW_MS);
    if (recent.length < MAX_SUBMITS) return { allowed: true, retryInMinutes: 0 };
    const oldest = Math.min(...recent);
    const retryInMinutes = Math.ceil((WINDOW_MS - (now - oldest)) / 60000);
    return { allowed: false, retryInMinutes };
  } catch {
    return { allowed: true, retryInMinutes: 0 };
  }
}

export function recordSubmit(): void {
  try {
    const raw = localStorage.getItem(SUBMIT_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const recent = timestamps.filter((t) => now - t < WINDOW_MS);
    recent.push(now);
    localStorage.setItem(SUBMIT_KEY, JSON.stringify(recent));
  } catch {}
}

// ── Reaction guard (one "this helped me" tap per story per browser) ────────
const REACTED_KEY = "techtrendi:story-reactions";

export function hasReacted(storyId: string): boolean {
  try {
    const raw = localStorage.getItem(REACTED_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(storyId);
  } catch {
    return false;
  }
}

export function markReacted(storyId: string): void {
  try {
    const raw = localStorage.getItem(REACTED_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(storyId)) {
      ids.push(storyId);
      localStorage.setItem(REACTED_KEY, JSON.stringify(ids));
    }
  } catch {}
}
