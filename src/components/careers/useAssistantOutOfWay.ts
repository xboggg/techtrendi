// Keeps the site-wide assistant button (AIChatInterface, fixed bottom-right on every page) off the
// jobs board's Apply buttons (owner, 8 Nov 2026: it sat on top of "Apply on Himalayas").
// While the board is mounted the button becomes a plain 48px circle 16px from the corner, hides
// while the reader scrolls, and stays hidden at rest while its place is over something tappable.
// Same approach as the data bundle pages (components/data-bundles/shared.tsx), kept separate so
// the jobs board does not pull in that page's code. Style and classes are removed on unmount.
import { useEffect } from "react";

/** The button's own accessible name in AIChatInterface.tsx (checked by scripts/test-careers.mts). */
export const ASSISTANT_SELECTOR = 'button[aria-label="Open AI Chat"]';
const REST_MS = 800;
const SCROLLING = "jobs-scrolling";
const COVERING = "jobs-chat-covering";
const TAPPABLE = "a[href],button,input,select,textarea,summary,label,[role=button],[tabindex]:not([tabindex='-1'])";

function wouldCover(): boolean {
  const w = document.documentElement.clientWidth, h = window.innerHeight;
  const L = w - 16 - 48, T = h - 16 - 48;
  const points: [number, number][] = [[L + 24, T + 24], [L + 6, T + 6], [L + 42, T + 6], [L + 6, T + 42], [L + 42, T + 42]];
  return points.some(([x, y]) => {
    const under = document.elementsFromPoint(x, y).find((e) => !e.closest(ASSISTANT_SELECTOR));
    return !!under?.closest(TAPPABLE);
  });
}

const CSS = [
  `${ASSISTANT_SELECTOR} { right: 16px !important; bottom: calc(16px + env(safe-area-inset-bottom, 0px)) !important; width: 48px !important; height: 48px !important; transition: opacity 200ms ease, transform 200ms ease !important; }`,
  `${ASSISTANT_SELECTOR} > div { width: 48px !important; height: 48px !important; }`,
  `html.${SCROLLING} ${ASSISTANT_SELECTOR}:not(:focus-visible), html.${COVERING} ${ASSISTANT_SELECTOR}:not(:focus-visible) { opacity: 0 !important; transform: translateY(24px) scale(0.9) !important; pointer-events: none !important; }`,
  `@media (prefers-reduced-motion: reduce) { ${ASSISTANT_SELECTOR} { transition: none !important; } }`,
].join("\n");

/** `layoutKey`: anything that changes when the content under the button changes without a
 *  scroll (a new page of jobs, a card opened), so the "is it covering?" check runs again. */
export function useAssistantOutOfWay(layoutKey: unknown): void {
  useEffect(() => {
    const t = setTimeout(() => document.documentElement.classList.toggle(COVERING, wouldCover()), 150);
    return () => clearTimeout(t);
  }, [layoutKey]);

  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-testid", "jobs-assistant-style");
    style.textContent = CSS;
    document.head.appendChild(style);
    const root = document.documentElement;
    let t: ReturnType<typeof setTimeout> | undefined;
    const settle = () => root.classList.toggle(COVERING, wouldCover());
    const onScroll = () => {
      root.classList.add(SCROLLING);
      clearTimeout(t);
      t = setTimeout(() => { settle(); root.classList.remove(SCROLLING); }, REST_MS);
    };
    settle();
    const first = setTimeout(settle, 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      style.remove();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearTimeout(t);
      clearTimeout(first);
      root.classList.remove(SCROLLING, COVERING);
    };
  }, []);
}
