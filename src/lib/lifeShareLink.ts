// Builds/parses the shareable link for the Life Progress Bar's "Share Your
// Life Stats" button. The stats are encoded directly in the URL (short keys,
// rounded numbers) so the link works statelessly — no database row, no
// server round-trip to create it. The og-meta.php bot-facing responder and
// the life-card-og image-rendering service both decode this same format.
import type { LifeCardTheme } from "./lifeCardCanvas";

export interface LifeShareData {
  lifeProgress: number; // 0-100
  daysLived: number;
  daysRemaining: number;
  saturdaysRemaining: number;
  zodiacSign: string;
  generation: string;
  theme: LifeCardTheme;
}

// Short keys keep the encoded payload (and therefore the URL) compact.
interface EncodedShape {
  p: number; // lifeProgress, rounded to 1 decimal
  d: number; // daysLived
  r: number; // daysRemaining
  s: number; // saturdaysRemaining
  z: string; // zodiacSign
  g: string; // generation
  t: LifeCardTheme;
}

export function buildLifeShareUrl(data: LifeShareData): string {
  const encoded: EncodedShape = {
    p: Math.round(data.lifeProgress * 10) / 10,
    d: Math.round(data.daysLived),
    r: Math.round(data.daysRemaining),
    s: Math.round(data.saturdaysRemaining),
    z: data.zodiacSign,
    g: data.generation,
    t: data.theme,
  };
  const json = JSON.stringify(encoded);
  const payload = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `https://techtrendi.com/tools/life-progress-bar?share=${payload}`;
}

export function parseLifeShareParam(payload: string): LifeShareData | null {
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(base64)));
    const parsed = JSON.parse(json) as EncodedShape;
    return {
      lifeProgress: parsed.p,
      daysLived: parsed.d,
      daysRemaining: parsed.r,
      saturdaysRemaining: parsed.s,
      zodiacSign: parsed.z,
      generation: parsed.g,
      theme: parsed.t,
    };
  } catch {
    return null;
  }
}
