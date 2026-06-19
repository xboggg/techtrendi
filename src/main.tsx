import "./ssg/ssr-polyfill"; // must run before anything reads storage (build-only)
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./ssg/routes";
import "./index.css";

// vite-react-ssg entry: pre-renders `routes` to static HTML at build time and
// hydrates them in the browser. (App.tsx is retained for reference during the
// migration; it is no longer the entry.)
export const createRoot = ViteReactSSG({ routes });
