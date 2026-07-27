// Shared localStorage contract between the real Cyber Risk Scorecard tool
// (/tools/cyber-risk-scorecard) and the teaser ring on /security, so the
// teaser can show a visitor's OWN real score instead of a fake static number.
// Nothing here is sent anywhere — same "stays in your browser" guarantee the
// tool already advertises.
const KEY = "techtrendi:risk-score";

export interface StoredRiskScore {
  score: number;
  takenAt: string; // ISO timestamp
}

export function saveRiskScore(score: number): void {
  try {
    const data: StoredRiskScore = { score, takenAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function getRiskScore(): StoredRiskScore | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.score !== "number" || typeof parsed.takenAt !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
