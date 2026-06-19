import type { RouteRecord } from "vite-react-ssg";
import RootLayout from "./RootLayout";
import Index from "../pages/Index";

// Adapt our pages (which use `export default`) to vite-react-ssg's `lazy`,
// which expects the module to resolve to an object exposing `Component`.
const d = (imp: () => Promise<{ default: React.ComponentType }>) => () =>
  imp().then((m) => ({ Component: m.default }));

/**
 * PILOT routes only — a small, safe proof set (homepage + static policy pages)
 * to validate that vite-react-ssg pre-renders this app's full provider tree
 * into real HTML and hydrates correctly. The full 205-route conversion follows
 * once this is proven. App.tsx remains the live client app until then.
 */
export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <RootLayout />,
    entry: "src/ssg/RootLayout.tsx",
    children: [
      { index: true, element: <Index /> },
      { path: "about", lazy: d(() => import("../pages/About")) },
      { path: "privacy", lazy: d(() => import("../pages/Privacy")) },
      { path: "terms", lazy: d(() => import("../pages/Terms")) },
      { path: "contact", lazy: d(() => import("../pages/Contact")) },
    ],
  },
];
