import { ReactNode, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { getToolByHref } from "@/data/tools";
import { ChevronLeft } from "lucide-react";
import { ToolContentSection } from "@/components/tools/ToolContentSection";
import { ToolJsonLd } from "@/components/seo/ToolJsonLd";

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

  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <Header />
      <main className={`flex-1 ${isHomepage ? "" : "pt-16 md:pt-20"}`}>
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
      </main>
      <Footer />
    </div>
  );
}
