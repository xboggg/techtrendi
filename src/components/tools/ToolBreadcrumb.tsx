import { Link } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";

interface ToolBreadcrumbProps {
  toolName: string;
  categoryId?: string;
  categoryName?: string;
}

const categoryMap: Record<string, { id: string; name: string }> = {
  business: { id: "business", name: "Business & Freelancer" },
  productivity: { id: "productivity", name: "Productivity" },
  career: { id: "career", name: "Career" },
  creator: { id: "creator", name: "Creator & Marketing" },
  developer: { id: "developer", name: "Developer Tools" },
  security: { id: "security", name: "Security & Privacy" },
  design: { id: "design", name: "Design & Writing" },
  other: { id: "other", name: "Lifestyle & Fun" },
};

export function ToolBreadcrumb({ toolName, categoryId, categoryName }: ToolBreadcrumbProps) {
  const category = categoryId ? categoryMap[categoryId] : null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <Link
        to="/tools"
        className="flex items-center gap-1 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Toolbox
      </Link>
      {(category || categoryName) && (
        <>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            to={`/tools/${category?.id || categoryId}`}
            className="hover:text-primary transition-colors"
          >
            {categoryName || category?.name}
          </Link>
        </>
      )}
      <ChevronRight className="w-3.5 h-3.5" />
      <span className="text-foreground font-medium truncate">{toolName}</span>
    </div>
  );
}
