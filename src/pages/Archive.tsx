import { useEffect, useState } from "react";
import { Link, useLoaderData, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ArchiveData } from "@/ssg/news-data";

// Archive pages (16 Nov 2026): /news/archive/N and /blog/archive/N.
// Every news story and guide as a plain link, newest first, 50 per page. Search Console showed
// Google had indexed 1 page of ~1,730 because /news and /blog page through their lists with
// buttons (Google never presses them), so most stories had no link pointing to them at all.
// The list is built into the page at build time (src/ssg/news-data.ts). If a reader reaches
// this page by tapping inside the site, the same list is fetched in the browser.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db2.techtrendi.com";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const PAGE_SIZE = 50; // keep in step with ARCHIVE_PAGE_SIZE in src/ssg/news-data.ts

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Fixed format from the ISO date, so the server HTML and the browser always print the same thing.
function shortDate(iso: string): string {
  const m = (iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : "";
}

function parse(pathname: string): { kind: "news" | "blog"; page: number } {
  const m = pathname.match(/^\/(news|blog)\/archive\/(\d+)/);
  return { kind: (m?.[1] as "news" | "blog") || "news", page: Math.max(1, Number(m?.[2] || 1)) };
}

export default function Archive() {
  const loaderData = (useLoaderData() as ArchiveData | null) ?? null;
  const { pathname } = useLocation();
  const { kind, page } = parse(pathname);
  const [data, setData] = useState<ArchiveData | null>(loaderData && loaderData.kind === kind && loaderData.page === page ? loaderData : null);

  useEffect(() => {
    if (data && data.kind === kind && data.page === page) return;
    const controller = new AbortController();
    const table = kind === "news" ? "news" : "articles";
    const filter = kind === "news" ? "&category=in.(Africa%20Tech,Big%20Tech)" : "";
    fetch(`${SUPABASE_URL}/rest/v1/${table}?select=slug,title,created_at,category&is_published=eq.true${filter}&order=created_at.desc&limit=2000`, {
      headers: { apikey: SUPABASE_KEY },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        const p = Math.min(page, totalPages);
        setData({ kind, page: p, totalPages, total: rows.length, items: rows.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE) });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [kind, page, data]);

  const label = kind === "news" ? "news stories" : "guides and articles";
  const heading = kind === "news" ? "All news stories" : "All guides and articles";
  const base = `/${kind}/archive`;
  const totalPages = data?.totalPages ?? 1;

  return (
    <Layout>
      <SEOHead
        title={`${heading} — page ${page}${data ? ` of ${totalPages}` : ""}`}
        description={`Every TechTrendi ${label}, newest first. Page ${page}${data ? ` of ${totalPages}` : ""}.`}
        canonical={`${base}/${page}`}
      />
      <div className="container max-w-3xl py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to={`/${kind}`} className="hover:text-foreground">{kind === "news" ? "News" : "Blog"}</Link>
          <span>/</span>
          <span className="text-foreground">All</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">{heading}</h1>
        <p className="text-muted-foreground mt-2">
          {data ? `${data.total} ${label}, newest first. Page ${page} of ${totalPages}.` : "Loading…"}
        </p>

        {data && (
          <ol className="mt-8 divide-y divide-border border-y border-border">
            {data.items.map((it) => (
              <li key={it.slug} className="py-3">
                <Link to={`/${kind}/${it.slug}`} className="block group">
                  <span className="font-medium text-foreground group-hover:text-primary leading-snug">{it.title}</span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    {shortDate(it.created_at)}{it.category ? ` · ${it.category}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        {data && totalPages > 1 && (
          <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-between gap-3">
            {page > 1 ? (
              <Link to={`${base}/${page - 1}`} rel="prev" className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border px-4 font-medium hover:border-primary">
                <ChevronLeft className="w-4 h-4" /> Newer
              </Link>
            ) : <span />}
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            {page < totalPages ? (
              <Link to={`${base}/${page + 1}`} rel="next" className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border px-4 font-medium hover:border-primary">
                Older <ChevronRight className="w-4 h-4" />
              </Link>
            ) : <span />}
          </nav>
        )}

        {data && totalPages > 1 && (
          <p className="mt-6 flex flex-wrap gap-2 text-sm">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link key={n} to={`${base}/${n}`} aria-current={n === page ? "page" : undefined}
                className={n === page ? "min-w-9 rounded-md bg-primary px-2 py-1 text-center text-primary-foreground" : "min-w-9 rounded-md border border-border px-2 py-1 text-center hover:border-primary"}>
                {n}
              </Link>
            ))}
          </p>
        )}
      </div>
    </Layout>
  );
}
