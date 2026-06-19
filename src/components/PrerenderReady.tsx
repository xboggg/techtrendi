import { useEffect, useRef } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

/**
 * Signals our self-hosted Prerender service that the page's content is ready to
 * capture. Without this, the renderer waits for the network to go idle — which
 * never happens because of Cloudflare's bot-challenge script, AdSense, and
 * Analytics beacons — so it times out with empty HTML.
 *
 * For normal visitors this is a harmless no-op: it only sets a global flag that
 * the Prerender headless browser reads. It renders nothing and changes no UI.
 */
declare global {
  // eslint-disable-next-line no-var
  interface Window {
    prerenderReady?: boolean;
  }
}

export function PrerenderReady() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const location = useLocation();
  const readyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On every navigation, reset to "not ready" and arm a hard safety net so a
  // stuck/slow query can never hang the renderer indefinitely.
  useEffect(() => {
    window.prerenderReady = false;
    if (hardTimer.current) clearTimeout(hardTimer.current);
    hardTimer.current = setTimeout(() => {
      window.prerenderReady = true;
    }, 8000);
    return () => {
      if (hardTimer.current) clearTimeout(hardTimer.current);
    };
  }, [location.pathname]);

  // When all queries/mutations have settled, wait a short beat for paint, then
  // mark the page ready for capture.
  useEffect(() => {
    if (readyTimer.current) clearTimeout(readyTimer.current);
    if (isFetching === 0 && isMutating === 0) {
      readyTimer.current = setTimeout(() => {
        window.prerenderReady = true;
      }, 500);
    }
    return () => {
      if (readyTimer.current) clearTimeout(readyTimer.current);
    };
  }, [isFetching, isMutating, location.pathname]);

  return null;
}
