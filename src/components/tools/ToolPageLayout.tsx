import { useLocation, Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { getToolByHref, categories } from "@/data/tools";

export function ToolPageLayout() {
  const { pathname } = useLocation();
  const tool = getToolByHref(pathname);
  const category = tool
    ? categories.find((c) => c.id === tool.categoryId)
    : null;

  const linkTo = category ? `/tools/${category.id}` : "/tools";
  const linkLabel = category ? category.title : "All Tools";

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{linkLabel}</span>
        </Link>
      </div>
      <Outlet />
    </>
  );
}
