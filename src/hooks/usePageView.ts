import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isBotTraffic } from "@/lib/isBotTraffic";

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  return "Other";
}

function getSessionId(): string {
  let sid = sessionStorage.getItem("tt_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("tt_sid", sid);
  }
  return sid;
}

function isNewVisitor(): boolean {
  const key = "tt_returning";
  if (localStorage.getItem(key)) return false;
  localStorage.setItem(key, "1");
  return true;
}

function getUTMParams(): { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null } {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
}

async function fetchGeoData(): Promise<{ country: string | null; city: string | null }> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { country: null, city: null };
    const data = await res.json();
    return { country: data.country_name || null, city: data.city || null };
  } catch {
    return { country: null, city: null };
  }
}

// Cache geo data per session to avoid repeated API calls
let geoCache: { country: string | null; city: string | null } | null = null;

// page_views is not readable/writable by visitors (RLS). Both calls are
// SECURITY DEFINER RPCs: track_page_view inserts and returns the new id;
// update_page_view only touches this browser's own session (by its random
// session id), optionally a single row, and only engagement fields.
type PageViewUpdate = Partial<{
  time_on_page: number;
  session_duration: number;
  exit_page: string;
  country: string | null;
  city: string | null;
  is_bounce: boolean;
}>;

function updatePageView(viewId: string | null, fields: PageViewUpdate) {
  return (supabase as any).rpc("update_page_view", {
    p_session_id: getSessionId(),
    p_id: viewId,
    p: fields,
  });
}

async function getGeo() {
  if (geoCache) return geoCache;
  geoCache = await fetchGeoData();
  return geoCache;
}

export function usePageView() {
  const location = useLocation();
  const lastPath = useRef("");
  const pageEntryTime = useRef(Date.now());
  const currentViewId = useRef<string | null>(null);

  // Update time_on_page when leaving a page
  const updateTimeOnPage = useCallback(async () => {
    if (!currentViewId.current) return;
    const timeSpent = Math.round((Date.now() - pageEntryTime.current) / 1000);
    if (timeSpent < 1) return;
    try {
      await updatePageView(currentViewId.current, { time_on_page: timeSpent });
    } catch {
      // silent
    }
  }, []);

  // Track session duration & exit page on unload
  useEffect(() => {
    const handleUnload = async () => {
      await updateTimeOnPage();
      // Mark last page as exit page
      if (currentViewId.current) {
        try {
          await updatePageView(null, { exit_page: location.pathname });
        } catch {
          // silent
        }
      }
      // Calculate session duration
      const sessionStart = sessionStorage.getItem("tt_session_start");
      if (sessionStart) {
        const duration = Math.round((Date.now() - parseInt(sessionStart)) / 1000);
        try {
          await updatePageView(null, { session_duration: duration });
        } catch {
          // silent
        }
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [location.pathname, updateTimeOnPage]);

  useEffect(() => {
    if (location.pathname === lastPath.current) return;
    if (location.pathname.startsWith("/admin")) return;
    // Crawlers that execute JS were being recorded as visitors. Mediapartners-
    // Google alone accounted for 257 of 445 "US" pageviews, making the
    // dashboard overstate US traffic by roughly 2.6x.
    if (isBotTraffic()) return;

    // Update time on previous page before recording new one
    if (lastPath.current) {
      updateTimeOnPage();
    }

    lastPath.current = location.pathname;
    pageEntryTime.current = Date.now();

    // Track session start time
    if (!sessionStorage.getItem("tt_session_start")) {
      sessionStorage.setItem("tt_session_start", Date.now().toString());
    }

    // Count pages in session for bounce detection
    const pageCount = parseInt(sessionStorage.getItem("tt_page_count") || "0") + 1;
    sessionStorage.setItem("tt_page_count", pageCount.toString());

    const isFirst = pageCount === 1;
    const utmParams = getUTMParams();
    const newVisitor = isNewVisitor();

    const record = async () => {
      try {
        // Insert the view IMMEDIATELY (don't block on the external geo lookup —
        // it can be slow/blocked and would otherwise drop the whole view).
        const { data: viewId } = await (supabase as any).rpc("track_page_view", { p: {
          page_path: location.pathname,
          page_title: document.title,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          session_id: getSessionId(),
          device_type: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          country: null,
          city: null,
          entry_page: isFirst ? location.pathname : null,
          is_new_visitor: newVisitor,
          is_bounce: true, // Will be updated to false if user visits another page
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign,
        } });

        if (typeof viewId === "string" && viewId) {
          currentViewId.current = viewId;
          // Backfill geo asynchronously once it resolves (best-effort).
          getGeo().then((geo) => {
            if (geo.country || geo.city) {
              updatePageView(viewId, { country: geo.country, city: geo.city })
                .then(() => {}, () => {});
            }
          }).catch(() => {});
        }

        // If this is page 2+, mark previous pages in session as non-bounce
        if (pageCount > 1) {
          await updatePageView(null, { is_bounce: false });
        }
      } catch {
        // silent fail
      }
    };

    record();
  }, [location.pathname, updateTimeOnPage]);
}
