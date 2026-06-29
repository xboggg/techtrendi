import { usePageView } from "@/hooks/usePageView";

/**
 * Mounts the page-view tracker. usePageView records every route change to the
 * `page_views` table (path, title, device, session, geo, time-on-page, etc.),
 * which powers the in-admin Analytics dashboard. Excludes /admin internally.
 *
 * Rendered inside <ClientOnly> in RootLayout so it only runs in the browser
 * after hydration — never during the SSG build.
 */
export function PageViewTracker() {
  usePageView();
  return null;
}

export default PageViewTracker;
