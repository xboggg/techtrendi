import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Same tag as index.html (keep in sync).
const ADSENSE_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3437377907350211";
const RELOADED_KEY = "tt-adfree-reload";

/** Paid sponsor pages: no Google ads (their HTML has no AdSense tag, see scripts/strip-ads-sponsored.mjs). */
const isAdFreePath =(path: string) => path.startsWith("/sponsored/");

// Keeps Google Auto ads off sponsor pages without touching any other page:
// - leaving a sponsor page for a normal page inside the site: add the AdSense tag
//   back (that page's HTML had it, but this tab started on the ad-free page);
// - reaching a sponsor page inside the site while the tag is already running:
//   reload it once, so the browser gets the ad-free HTML.
export function AdsenseRestore() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!import.meta.env.PROD) return; // dev serves index.html (with the tag) on every route
    const tag = document.querySelector(`script[src^="${ADSENSE_SRC.split("?")[0]}"]`);

    if (isAdFreePath(pathname)) {
      if (!tag) return;
      let done: string | null = null;
      try { done = sessionStorage.getItem(RELOADED_KEY); } catch { /* storage blocked */ }
      if (done === pathname) return; // already reloaded once for this page: never loop
      try { sessionStorage.setItem(RELOADED_KEY, pathname); } catch { return; }
      window.location.reload();
      return;
    }

    try { sessionStorage.removeItem(RELOADED_KEY); } catch { /* storage blocked */ }
    if (tag) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = ADSENSE_SRC;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }, [pathname]);

  return null;
}
