import { Outlet } from "react-router-dom";
import { ToolPageProvider } from "./ToolPageContext";

// Comments now render inside Layout.tsx itself, right before the page's
// own Footer — rendering them here (after <Outlet/>) put them AFTER the
// routed page's Footer too, since every tool page wraps its content in its
// own <Layout>. That squeezed comments in visually right below the footer
// bar with no real separation, instead of being the last thing in the
// page's main content.
//
// ToolPageProvider marks every route nested under this layout (the
// existing, already-correct whitelist of individual tool pages in
// routes.tsx/App.tsx) so Layout.tsx knows to render comments in the right
// place, without needing a per-page prop or a URL-shape guess that can't
// actually distinguish a tool page from a /tools/:categoryId listing page.
export function ToolPageLayout() {
  return (
    <ToolPageProvider>
      <Outlet />
    </ToolPageProvider>
  );
}
