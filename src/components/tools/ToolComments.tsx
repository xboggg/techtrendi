import { useLocation } from "react-router-dom";
import { CommentsBox } from "@/components/article/CommentsBox";

/**
 * Renders the comments box under a tool page, keyed on the tool slug from the
 * URL (e.g. /tools/ghana-tax-calculator). Reuses the same secure CommentsBox.
 * Tool comments are stored with article_type 'blog' (so they share the same
 * public-read policy); the slug namespaces them to the tool.
 */
export function ToolComments() {
  const { pathname } = useLocation();
  const m = pathname.match(/^\/tools\/([^/]+)\/?$/);
  if (!m) return null; // only on individual tool pages, not /tools index or category
  const slug = `tool:${m[1]}`;
  return (
    <div className="container max-w-3xl mx-auto px-4 pb-12">
      <CommentsBox slug={slug} type="blog" />
    </div>
  );
}

export default ToolComments;
