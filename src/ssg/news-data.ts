/**
 * Build-time data for dynamic news routes (vite-react-ssg).
 *
 * - getStaticPaths(): which /news/:slug pages to pre-render (slugs from Supabase)
 * - loader(): fetch one article at build so its content is baked into the HTML
 *
 * These run ONLY during the SSG build (guarded by import.meta.env.SSR). On the
 * client, the article still loads via NewsArticle's existing fetch, so client
 * navigation is unaffected. A browser User-Agent is sent because the Supabase
 * REST host sits behind an nginx bot-blocker that 403s non-browser requests.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db2.techtrendi.com";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const BUILD_UA =
  "Mozilla/5.0 (compatible; TechTrendiSSG/1.0; +https://techtrendi.com) AppleWebKit/537.36";

// Pilot: cap the number of pre-rendered articles. Raise/remove once verified.
const NEWS_LIMIT = 20;

async function sbFetch(query: string): Promise<unknown[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "User-Agent": BUILD_UA,
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function newsStaticPaths(): Promise<string[]> {
  if (!import.meta.env.SSR) return [];
  const rows = await sbFetch(
    `news?select=slug&is_published=eq.true&order=created_at.desc&limit=${NEWS_LIMIT}`
  );
  return rows
    .map((r) => (r as { slug?: string }).slug)
    .filter((s): s is string => Boolean(s))
    .map((slug) => `news/${slug}`);
}

export async function newsLoader({ params }: { params: { slug?: string } }) {
  if (!import.meta.env.SSR || !params.slug) return null;
  const rows = await sbFetch(`news?slug=eq.${encodeURIComponent(params.slug)}&select=*`);
  return rows[0] ?? null;
}
