import { useEffect } from "react";

/**
 * Signals our self-hosted Prerender service that the page is ready to capture.
 *
 * Without this, the renderer waits for the network to go idle — which never
 * happens because of Cloudflare's bot-challenge script, AdSense, and Analytics
 * beacons — so it times out with empty HTML.
 *
 * We deliberately use a single fixed delay rather than tracking data-loading
 * state: not every page fetches through React-Query, so a state-based signal
 * fired before the real content had loaded (capturing only the layout). A fixed
 * wait gives every page's async content time to load and paint before capture.
 *
 * The Prerender browser loads exactly one URL per render, so firing once on
 * mount is all that's needed. For normal visitors this is a harmless no-op: it
 * sets a global flag the headless renderer reads, renders nothing, changes no UI.
 */
declare global {
  interface Window {
    prerenderReady?: boolean;
  }
}

const PRERENDER_READY_DELAY_MS = 6000;

export function PrerenderReady() {
  useEffect(() => {
    const t = setTimeout(() => {
      window.prerenderReady = true;
    }, PRERENDER_READY_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  return null;
}
