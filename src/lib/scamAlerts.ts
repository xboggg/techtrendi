// Scam alerts (techtrendi.security_scam_alerts): shared types and helpers for the list page
// (/scam-alerts), the one-alert pages (/scam-alerts/<slug>, 21 Nov 2026) and the share buttons.

export const SITE_URL = "https://techtrendi.com";

export interface ScamAlert {
  id: string;
  slug?: string | null;
  emoji: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  scam_type: string;
  description: string;
  affected_platforms: string[];
  what_to_do: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  created_at: string;
}

/** Columns every alert view needs (no admin-only counters). */
export const ALERT_COLUMNS =
  "id,slug,title,description,scam_type,severity,emoji,what_to_do,affected_platforms,image_url,image_urls,created_at";

export const SLUG_RE = /^[a-z0-9-]{1,80}$/;

/** The alert's own page, or the list page when an alert has no slug yet. */
export function alertPath(a: { slug?: string | null }): string {
  return a.slug && SLUG_RE.test(a.slug) ? `/scam-alerts/${a.slug}` : "/scam-alerts";
}

export function alertUrl(a: { slug?: string | null }): string {
  return `${SITE_URL}${alertPath(a)}`;
}

/**
 * Share picture for an alert page: 1200x630 card drawn on the server by
 * /opt/tech-news/scam_share_cards.py (every 10 minutes) into
 * /var/www/techtrendi/images/scam-alerts/share/<slug>.jpg.
 */
export function alertShareImage(a: { slug?: string | null }): string {
  return a.slug && SLUG_RE.test(a.slug) ? `/images/scam-alerts/share/${a.slug}.jpg` : "/og-scam-alerts.jpg";
}

/** "21 Nov 2026" in Ghana time. Fixed, so the prerendered page and the browser agree. */
export function alertDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Accra" });
}

/** Search-result / preview text: the description, cut at a word near 155 characters. */
export function alertSummary(text: string, max = 155): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const i = cut.lastIndexOf(" ");
  return `${(i > 80 ? cut.slice(0, i) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

export const severityConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  low: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    label: "Low Risk",
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    label: "Medium Risk",
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
    label: "High Risk",
  },
  critical: {
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    label: "Critical",
  },
};
