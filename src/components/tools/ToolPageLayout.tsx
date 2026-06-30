import { Outlet } from "react-router-dom";
import { ClientOnly } from "vite-react-ssg";
import { ToolComments } from "./ToolComments";

export function ToolPageLayout() {
  return (
    <>
      <Outlet />
      {/* Comments render only in the browser (not prerendered) — keeps tool
          pages' static HTML clean and avoids SSR fetches. */}
      <ClientOnly>{() => <ToolComments />}</ClientOnly>
    </>
  );
}
