import { useEffect, useState } from "react";

/**
 * Floating buttons (Ei Tech!, AI chat) slide away while the reader scrolls DOWN,
 * so they never sit on top of the text being read, and come back when the reader
 * scrolls up or stops scrolling for a moment. Owner-approved fix, 12 Nov 2026.
 *
 * Returns true while the button should be hidden.
 */
export function useHideOnScroll({ topOffset = 120, idleMs = 900 }: { topOffset?: number; idleMs?: number } = {}): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastY = window.scrollY;
    let idle: ReturnType<typeof setTimeout> | undefined;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      if (y <= topOffset) setHidden(false);          // near the top: always show
      else if (delta > 4) setHidden(true);            // reading downwards: get out of the way
      else if (delta < -4) setHidden(false);          // scrolling back up: come back
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => setHidden(false), idleMs); // stopped scrolling: come back
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (idle) clearTimeout(idle);
    };
  }, [topOffset, idleMs]);

  return hidden;
}
