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
