import { supabase } from "@/integrations/supabase/client";

/**
 * Drop the og-meta.php cache entry for one article.
 *
 * Social crawlers (Telegram, WhatsApp, Facebook) are served by og-meta.php,
 * which reads a file cache with a 24-hour TTL *before* it queries Supabase.
 * So changing a cover image in the admin updated the database but left every
 * link preview showing the old picture for up to a day.
 *
 * That cost real debugging time twice — the "sold his kidney" article and the
 * Ghana transformers article — each needing someone to SSH in and delete the
 * file by hand. Calling this on save removes the stale entry immediately;
 * og-meta.php rebuilds it from Supabase on the next crawler request.
 *
 * Deliberately non-fatal: a failed purge must never block saving an article.
 * Worst case we fall back to the old behaviour and the preview updates within
 * 24 hours.
 */
export async function purgeOgCache(
  section: "blog" | "news" | "reviews" | "guides",
  slug: string,
): Promise<boolean> {
  if (!slug) return false;

  try {
    const base =
      import.meta.env.VITE_SUPABASE_URL || "https://db2.techtrendi.com";
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return false;

    const res = await fetch(`${base}/api/purge-og-cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ section, slug }),
    });

    return res.ok;
  } catch {
    // Network error, endpoint down, whatever — saving still succeeded.
    return false;
  }
}
