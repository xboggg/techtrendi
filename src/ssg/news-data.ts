/**
 * Build-time data for dynamic article routes (vite-react-ssg).
 *
 * Strategy (per the content audit):
 *  - NEWS: pre-render only the "Africa Tech" articles (the differentiated,
 *    indexable content). International/commodity news is client-rendered.
 *  - BLOG: pre-render all published guides.
 *
 * Performance: each table is fetched ONCE (cached) and shared by getStaticPaths
 * + every loader, so we do ~2 queries total instead of one per article — which
 * keeps the build inside the CI time budget.
 *
 * Everything here is guarded by import.meta.env.SSR so it runs only during the
 * build. On the client, articles still load via the page's own fetch, so client
 * navigation (including non-prerendered international news) is unaffected.
 * A browser User-Agent is sent because the Supabase host sits behind an nginx
 * bot-blocker that 403s non-browser requests.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db2.techtrendi.com";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const BUILD_UA =
  "Mozilla/5.0 (compatible; TechTrendiSSG/1.0; +https://techtrendi.com) AppleWebKit/537.36";

const MAX_ROWS = 2000; // safety ceiling (Africa Tech ~333, blog ~265)

type Row = { slug?: string } & Record<string, unknown>;

async function sbFetch(query: string): Promise<Row[]> {
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
    return Array.isArray(data) ? (data as Row[]) : [];
  } catch {
    return [];
  }
}

function toMap(rows: Row[]): Map<string, Row> {
  return new Map(rows.filter((r) => r.slug).map((r) => [r.slug as string, r]));
}

// One fetch per table, cached for the whole build.
let newsCache: Map<string, Row> | null = null;
let blogCache: Map<string, Row> | null = null;

async function getNewsMap(): Promise<Map<string, Row>> {
  if (!newsCache) {
    newsCache = toMap(
      await sbFetch(
        `news?select=*&is_published=eq.true&category=eq.Africa%20Tech&order=created_at.desc&limit=${MAX_ROWS}`
      )
    );
  }
  return newsCache;
}

async function getBlogMap(): Promise<Map<string, Row>> {
  if (!blogCache) {
    blogCache = toMap(
      await sbFetch(`articles?select=*&is_published=eq.true&order=created_at.desc&limit=${MAX_ROWS}`)
    );
  }
  return blogCache;
}

export async function newsStaticPaths(): Promise<string[]> {
  if (!import.meta.env.SSR) return [];
  return [...(await getNewsMap()).keys()].map((slug) => `news/${slug}`);
}

export async function newsLoader({ params }: { params: { slug?: string } }) {
  if (!import.meta.env.SSR || !params.slug) return null;
  return (await getNewsMap()).get(params.slug) ?? null;
}

export async function blogStaticPaths(): Promise<string[]> {
  if (!import.meta.env.SSR) return [];
  return [...(await getBlogMap()).keys()].map((slug) => `blog/${slug}`);
}

export async function blogLoader({ params }: { params: { slug?: string } }) {
  if (!import.meta.env.SSR || !params.slug) return null;
  return (await getBlogMap()).get(params.slug) ?? null;
}
