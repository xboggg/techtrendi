import { ReactNode, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClientOnly } from "vite-react-ssg";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { getToolByHref } from "@/data/tools";
import { ChevronLeft } from "lucide-react";
import { ToolContentSection } from "@/components/tools/ToolContentSection";
import { ToolComments } from "@/components/tools/ToolComments";
import { useIsToolPage } from "@/components/tools/ToolPageContext";
import { ToolJsonLd } from "@/components/seo/ToolJsonLd";
import { trackEvents } from "@/lib/gtag";

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

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
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
        {tool && <ToolContentSection toolId={tool.id} />}
        {/* Comments belong inside the page, above the footer — not bolted
            on after it. Client-only (not prerendered) to keep tool pages'
            static HTML clean and avoid an SSR fetch, same as before. */}
        {isIndividualToolPage && <ClientOnly>{() => <ToolComments />}</ClientOnly>}
      </main>
      <Footer />
    </div>
  );
}
