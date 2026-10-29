// Light/dark switch beside A / A+ on the data bundle pages (owner, 24 Oct 2026): the header's moon
// icon is easy to miss, and some readers prefer light. It names the theme it switches TO
// ("Light" while dark is on, "Dark" while light is on) and uses the site's ThemeContext, so the
// choice is stored site-wide exactly like the header's toggle. Fixed width: the swap moves nothing.
// Under 380px wide it shows the sun or moon only (44 x 44), with the same name for screen readers.
// The server and the first render both say "Dark" (the provider starts light); the provider's
// layout effect sets the real theme before the first paint, so nothing differs at hydration.
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLargeText } from "./shared";

export function ThemePill({ className }: { className?: string }) {
  let theme: ReturnType<typeof useTheme> | null = null;
  try { theme = useTheme(); } catch { theme = null; } // outside a ThemeProvider (tests): nothing to switch
  if (!theme) return null;
  const dark = theme.resolvedTheme === "dark";
  const to = dark ? "light" : "dark";
  return (
    <button type="button" onClick={() => theme!.setTheme(to)} data-testid="theme-pill" data-to={to}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={cn("inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-border bg-background/60 text-[15px] font-bold transition hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring min-[380px]:min-w-[5.25rem] min-[380px]:px-3", className)}>
      {dark ? <Sun className="h-4 w-4 shrink-0" aria-hidden /> : <Moon className="h-4 w-4 shrink-0" aria-hidden />}
      {/* The narrowest phones (under 380px) show the sun or moon only, so the status line keeps its room. */}
      <span className="max-[379px]:sr-only">{dark ? "Light" : "Dark"}</span>
    </button>
  );
}

/** Phones (owner, 25 Oct 2026): ONE compact "Aa" button at the right of the status row (44px,
 *  named "Display settings") instead of the Light/Dark pill and A / A+ side by side, which
 *  crowded the status line and the heading. It opens a small panel with two rows: "Text size"
 *  (A, A+) and "Theme" (Light, Dark). Same behaviour and storage as the inline controls: the text
 *  size through useLargeText, the theme through the site's ThemeContext. The panel is a Radix
 *  popover: it closes on an outside tap or Escape, takes focus when it opens and gives it back to
 *  the button when it closes. Owner, 29 Oct 2026: the "Theme" row is gone (the site header already
 *  has the light/dark switch); the panel is "Text size" only. */
export function DisplayMenu({ className }: { className?: string }) {
  const [large, pickSize] = useLargeText();
  const opt = (on: boolean) => cn(
    "inline-flex h-11 min-w-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[15px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    on ? "bg-foreground text-background" : "border border-border text-foreground hover:border-foreground/40",
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Display settings" data-testid="display-menu"
          className={cn("inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/60 text-base font-black transition hover:border-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>
          <span aria-hidden>Aa</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} aria-label="Display settings" data-testid="display-panel" className="w-64 space-y-3 rounded-2xl p-3">
        <div role="group" aria-labelledby="db-display-size" className="space-y-1.5">
          <p id="db-display-size" className="text-[15px] font-semibold">Text size</p>
          <div className="flex gap-2">
            <button type="button" className={opt(!large)} aria-pressed={!large} onClick={() => pickSize(false)} aria-label="A normal text" data-testid="display-size-normal"><span className="text-sm">A</span></button>
            <button type="button" className={opt(large)} aria-pressed={large} onClick={() => pickSize(true)} aria-label="A+ bigger text" data-testid="display-size-large"><span className="text-lg">A+</span></button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
