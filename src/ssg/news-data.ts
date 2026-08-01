/**
 * Build-time data for dynamic article routes (vite-react-ssg).
 *
 * Strategy (per the content audit):
 *  - NEWS: pre-render "Africa Tech" articles (the differentiated, indexable
 *    content) plus "Big Tech" (The Rundown's daily world-tech digest --
 *    genuinely international content, but original editorial synthesis
 *    written for TechTrendi's audience, so it earns the same SEO treatment).
 *    Everything else (other international/commodity news) is client-rendered.
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

const MAX_ROWS = 2000; // safety ceiling (Africa Tech + Big Tech ~435, blog ~265)

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
        `news?select=*&is_published=eq.true&category=in.(Africa%20Tech,Big%20Tech)&order=created_at.desc&limit=${MAX_ROWS}`
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

// List-page loaders: seed /blog and /news with the same build-time data so
// their article cards exist in the static HTML (2026-07-26 — the pages were
// previously 100% client-fetched via useEffect, so crawlers saw an empty
// shell). Client-side fetch still runs after hydration for freshness; this
// only fixes what ships in the prerendered HTML.
export async function blogListLoader() {
  if (!import.meta.env.SSR) return null;
  return [...(await getBlogMap()).values()];
}

export async function newsListLoader() {
  if (!import.meta.env.SSR) return null;
  return [...(await getNewsMap()).values()];
}

// Same fix for /store — DigiStore.tsx fetched products entirely client-side
// via useQuery, so the store page's raw HTML had zero product cards, even the
// one published book (2026-07-26). No per-product SSG pages exist, so this is
// a flat fetch (not cached/keyed by slug like blog/news).
let productsCache: Row[] | null = null;

export async function productsListLoader() {
  if (!import.meta.env.SSR) return null;
  if (!productsCache) {
    productsCache = await sbFetch(
      `products?select=*&is_published=eq.true&order=is_featured.desc&order=created_at.desc`
    );
  }
  return productsCache;
}

// Same fix for /security — the "Scams going round in Ghana" hub fetched its
// scam-alert cards, threat-level banner, and related articles entirely
// client-side via three separate useEffect calls, so none of it existed in
// the prerendered HTML (2026-07-27 — found because a NEW scam wasn't showing
// up here even though it had just been added to the /blog roundup article).
export async function securityPageLoader() {
  if (!import.meta.env.SSR) return null;
  const [alerts, threatRows, articleRows] = await Promise.all([
    sbFetch(
      "security_scam_alerts?select=id,title,description,scam_type,severity,emoji,what_to_do,affected_platforms,created_at&is_published=eq.true&is_active=eq.true&order=created_at.desc&limit=6"
    ),
    sbFetch(
      "security_threat_level?select=level,title,description,active_threats,updated_at&order=updated_at.desc&limit=1"
    ),
    getBlogMap(), // reuse the already-cached full article list rather than a 4th fetch
  ]);

  const secTags = ["scam", "security", "phishing", "password", "privacy", "fraud", "cyber", "online safety"];
  const articles = [...articleRows.values()].filter((a: any) =>
    (a.tags || []).some((t: string) => secTags.some((s) => t.toLowerCase().includes(s))) ||
    secTags.some((s) => (a.category || "").toLowerCase().includes(s))
  );

  return {
    alerts,
    threat: threatRows[0] ?? null,
    articles: articles.slice(0, 6),
    articleCount: articles.length,
  };
}
