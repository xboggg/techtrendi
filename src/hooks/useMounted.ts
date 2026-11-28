import { useEffect, useState } from "react";

/**
 * false while the page is being built ahead of time and during the browser's
 * first (hydration) render; true right after. Use it to show parts that depend
 * on today's date or on browser storage only on the visitor's device, so the
 * pre-built HTML and the browser never disagree (React errors #418/#425).
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
