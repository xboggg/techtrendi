import "./ssg/ssr-polyfill"; // must run before anything reads storage (build-only)
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./ssg/routes";
import "./index.css";

// Stale-deploy recovery: after a new deploy, a tab holding the OLD index.html
// requests now-missing hashed chunks / the old SSG data manifest. The server
// returns its 404 HTML page, so JSON.parse / dynamic import fails with
// "Unexpected token '<'" or "failed to fetch dynamically imported module".
// Instead of showing an error screen, reload ONCE to pull the fresh index.html.
// The sessionStorage flag prevents an infinite reload loop on a genuine error.
if (typeof window !== "undefined") {
  const looksLikeStaleChunk = (msg: string) =>
    /Unexpected token '<'|<!DOCTYPE|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
      msg || ""
    );
  const recoverOnce = (msg: string) => {
    if (!looksLikeStaleChunk(msg)) return;
    if (sessionStorage.getItem("tt_chunk_reloaded")) return; // already tried
    sessionStorage.setItem("tt_chunk_reloaded", "1");
    window.location.reload();
  };
  window.addEventListener("error", (e) => recoverOnce(e?.message || ""));
  window.addEventListener("unhandledrejection", (e) =>
    recoverOnce((e?.reason && (e.reason.message || String(e.reason))) || "")
  );
  // A clean navigation means recovery worked — clear the guard for next time.
  window.addEventListener("load", () => {
    setTimeout(() => sessionStorage.removeItem("tt_chunk_reloaded"), 4000);
  });
}

// vite-react-ssg entry: pre-renders `routes` to static HTML at build time and
// hydrates them in the browser. (App.tsx is retained for reference during the
// migration; it is no longer the entry.)
export const createRoot = ViteReactSSG({ routes });
