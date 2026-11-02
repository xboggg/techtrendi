import type { ComponentType } from "react";

// The tool explanations (ToolContentSection + toolContent.ts, ~160 KB for all
// tools) live in their own file instead of the main bundle every page downloads.
// routes.tsx loads it as part of each tool page's route `lazy` step, which
// vite-react-ssg awaits BEFORE prerendering and BEFORE hydrating (and React
// Router awaits before showing a page reached by an in-site link). So by the
// time Layout renders a tool page, the section is already here and renders
// synchronously — no Suspense, so nothing can be thrown away while hydrating.
type ToolContentSectionComponent = ComponentType<{ toolId: string }>;

let section: ToolContentSectionComponent | null = null;

export function loadToolContentSection(): Promise<void> {
  return import("./ToolContentSection").then((m) => {
    section = m.ToolContentSection;
  });
}

export function getToolContentSection(): ToolContentSectionComponent | null {
  return section;
}
