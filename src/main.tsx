import "./ssg/ssr-polyfill"; // must run before anything reads storage (build-only)
import { ViteReactSSG } from "vite-react-ssg";
import { routes } from "./ssg/routes";
import "./index.css";

// Stale-deploy recovery (global backstop for the router .catch in routes.tsx).
// A tab holding the OLD index.html requests now-missing hashed chunks / the old
// SSG data manifest; the server returns its 404 HTML page, so JSON.parse /
// dynamic import fails with "Unexpected token '<'" or "failed to fetch
// dynamically imported module". We reload to fetch the fresh index.html.
//
// Guard = a TIME-WINDOW cooldown shared with routes.tsx (key tt_chunk_reload_at).
// A long-lived tab can hit MANY deploys in one session — each new stale event
// (older than the cooldown) recovers; a genuinely-broken chunk that fails again
// within the cooldown does NOT reload again, so no infinite loop.
if (typeof window !== "undefined") {
  const KEY = "tt_chunk_reload_at";
  const COOLDOWN = 20_000;
  const looksLikeStaleChunk = (msg: string) =>
    /Unexpected token '<'|<!DOCTYPE|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
      msg || ""
    );
  const recover = (msg: string) => {
    if (!looksLikeStaleChunk(msg)) return;
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last <= COOLDOWN) return; // reloaded very recently → don't loop
    sessionStorage.setItem(KEY, String(Date.now()));
    window.location.reload();
  };
  window.addEventListener("error", (e) => recover(e?.message || ""));
  window.addEventListener("unhandledrejection", (e) =>
    recover((e?.reason && (e.reason.message || String(e.reason))) || "")
  );
}

// vite-react-ssg entry: pre-renders `routes` to static HTML at build time and
// hydrates them in the browser. (App.tsx is retained for reference during the
// migration; it is no longer the entry.)
export const createRoot = ViteReactSSG({ routes });
