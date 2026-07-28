import { createContext, useContext } from "react";

// True only when the current route is inside ToolPageLayout's route-tree
// children (see routes.tsx / App.tsx) — the existing, already-correct
// whitelist of individual tool pages (e.g. /tools/life-progress-bar),
// as distinct from /tools/:categoryId listing pages, which share the
// identical URL shape and can't be told apart by path alone.
const ToolPageContext = createContext(false);

export function ToolPageProvider({ children }: { children: React.ReactNode }) {
  return <ToolPageContext.Provider value={true}>{children}</ToolPageContext.Provider>;
}

export function useIsToolPage(): boolean {
  return useContext(ToolPageContext);
}
