import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvents } from "@/lib/gtag";
import { getSponsorsForPage, sponsorPath } from "@/data/sponsors";

// "Sponsored" strip linking to a sponsor's full page. Shows only the sponsors
// whose `showOn` lists the current page (src/data/sponsors.ts); renders nothing
// otherwise. Static data, so it is in the prerendered HTML and hydrates cleanly.
export function SponsoredCard({ className }: { className?: string }) {
  const { pathname } = useLocation();
  const sponsors = getSponsorsForPage(pathname);
  if (sponsors.length === 0) return null;

  return (
    <div className={cn("container", className)}>
      {sponsors.map((s) => (
        <Link
          key={s.slug}
          to={sponsorPath(s)}
          onClick={() => trackEvents.sponsorClick(s.slug, "card", pathname)}
          className="group relative block overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-950 p-5 sm:p-6 text-white shadow-lg transition-shadow hover:shadow-violet-500/20"
        >
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/25 blur-3xl" />
          <span className="relative mb-3 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-200">
            Sponsored
          </span>
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500">
              <Unlock className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold leading-tight">
                {s.name} <span className="font-normal text-violet-200">· {s.tagline}</span>
              </p>
              <p className="mt-1 text-sm text-slate-300">{s.cardText}</p>
            </div>
            <ArrowRight className="hidden h-5 w-5 shrink-0 text-violet-200 transition-transform group-hover:translate-x-1 sm:block" />
          </div>
          <span className="relative mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-200 sm:hidden">
            See details <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ))}
    </div>
  );
}
