import { ReactNode, Suspense, lazy, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClientOnly } from "vite-react-ssg";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { getToolByHref } from "@/data/tools";
import { ChevronLeft } from "lucide-react";
import { ToolComments } from "@/components/tools/ToolComments";
import { useIsToolPage } from "@/components/tools/ToolPageContext";
import { ToolJsonLd } from "@/components/seo/ToolJsonLd";
import { trackEvents } from "@/lib/gtag";

// The tool explanations (toolContent.ts, ~156 KB for all tools) load in their
// own file instead of the main bundle that every page downloads. The prerender
// waits for it (onAllReady), so each tool page's HTML still contains the text;
// in the browser the server HTML stays on screen until the file arrives.
// A failed load skips the section instead of reaching the page's ErrorBoundary.
const ToolContentSection = lazy(() =>
  import("@/components/tools/ToolContentSection")
    .then((m) => ({ default: m.ToolContentSection }))
    .catch(() => ({ default: () => null }))
);

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHomepage = location.pathname === "/";

  const tool = useMemo(() => {
    if (!location.pathname.startsWith("/tools/")) return null;
    return getToolByHref(location.pathname) || null;
  }, [location.pathname]);

  // Set by ToolPageProvider — true only on routes nested under
  // ToolPageLayout in routes.tsx/App.tsx, the existing whitelist of real
  // individual tool pages. A URL-shape check alone can't tell a tool page
  // (/tools/life-progress-bar) apart from a category listing page
  // (/tools/business) since both share the exact same /tools/:x shape.
  const isIndividualToolPage = useIsToolPage();

  // GA4 tool_use event — fires once per tool page visit. Complements the
  // page_view GA4 already sends automatically; without this, GA4 has no
  // explicit signal that a page visited under /tools/ was actually a tool
  // (vs. a category listing page), since both share the same URL shape.
  useEffect(() => {
    if (isIndividualToolPage) {
      trackEvents.toolUse(tool?.title ?? location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIndividualToolPage, location.pathname]);

  // overflow-x-clip used to sit on the wrapper below; it can stop AdSense
  // Auto Ads placing units inside. Horizontal overflow is already contained
  // on html/body in index.css, so sideways scroll is still prevented without
  // clipping the ad-insertable tree.
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to main content — accessibility + AdSense compliance */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className={`flex-1 ${isHomepage ? "" : "pt-16 md:pt-20"}`}>
        {tool && (
          <div className="container pt-4 pb-0">
            <Link
              to={`/tools/${tool.categoryId}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to {tool.category}</span>
            </Link>
          </div>
        )}
        {tool && <ToolJsonLd tool={tool} />}
        {children}
        {tool && (
          <Suspense fallback={null}>
            <ToolContentSection toolId={tool.id} />
          </Suspense>
        )}
        {/* Comments belong inside the page, above the footer — not bolted
            on after it. Client-only (not prerendered) to keep tool pages'
            static HTML clean and avoid an SSR fetch, same as before. */}
        {isIndividualToolPage && <ClientOnly>{() => <ToolComments />}</ClientOnly>}
      </main>
      <Footer />
    </div>
  );
}
