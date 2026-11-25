import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Head } from "vite-react-ssg";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { cn } from "@/lib/utils";
import {
  KIND_LABELS, TECH_EVENTS, TECH_EVENTS_PATH, type TechEvent, dateRange, eventJsonLd, eventStatus, flag, ldJson, place,
  plainSummary, useTechEventsLive, useToday,
} from "@/data/techEvents";
import { DateTile, EventRow, Extras, KindBadge, WhenBadge, kindStyle } from "@/components/tech-events/EventParts";
import { EventAbout, EventActions, EventFacts, pageUrlFor } from "@/components/tech-events/EventDetails";
import NotFound from "../NotFound";

// /tech-events/:slug — one event. Prerendered for every event in src/data/techEvents.json;
// the live list then refreshes its facts (time, "going", sold out). noindex for now (owner's
// site is still being indexed; 25 Nov 2026) — the /tech-events list is the indexed page.
export default function TechEventPage() {
  const { slug } = useParams();
  const [events, loaded] = useTechEventsLive();
  const today = useToday();
  const e = events.find((x) => x.slug === slug) || TECH_EVENTS.find((x) => x.slug === slug);

  const more = useMemo(() => {
    if (!e) return { here: [] as TechEvent[], same: [] as TechEvent[] };
    const next = events.filter((x) => x.slug !== e.slug && x.ends_on >= today);
    const here = next.filter((x) => x.country_code === e.country_code).slice(0, 4);
    const shown = new Set(here.map((x) => x.slug));
    const same = next.filter((x) => !shown.has(x.slug) && (x.kind === e.kind || x.topics.some((t) => e.topics.includes(t)))).slice(0, 4);
    return { here, same };
  }, [e, events, today]);

  if (!e) {
    if (!loaded) return <Layout><div className="container py-24 text-center text-muted-foreground">Loading…</div></Layout>;
    return <NotFound />;
  }
  const s = kindStyle(e.kind);
  const ended = eventStatus(e, today).when === "ended";
  const pageUrl = pageUrlFor(e, true);

  return (
    <Layout>
      <SEOHead
        title={`${e.title}: ${dateRange(e)}, ${place(e)}`}
        description={plainSummary(e).slice(0, 300)}
        canonical={`${TECH_EVENTS_PATH}/${e.slug}`}
        noindex
        noindexFollow
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Tech Events", path: TECH_EVENTS_PATH }, { name: e.title, path: `${TECH_EVENTS_PATH}/${e.slug}` }]}
      />
      <Head><script type="application/ld+json">{ldJson(eventJsonLd(e))}</script></Head>

      <section className="relative overflow-hidden bg-[#070b18] text-white">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40", s.grad)} />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <s.Icon className="absolute -bottom-10 -right-6 h-64 w-64 opacity-10" />
        <div className="container relative mx-auto px-4 pb-10 pt-6 sm:pb-14">
          <nav className="mb-6 flex items-center gap-1 text-sm text-white/70" aria-label="Breadcrumb">
            <Link to={TECH_EVENTS_PATH} className="inline-flex items-center gap-1 font-semibold hover:text-white"><ArrowLeft className="h-4 w-4" /> All tech events</Link>
            <ChevronRight className="h-3.5 w-3.5" /><span>{e.country}</span>
          </nav>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <DateTile e={e} size="lg" />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <WhenBadge e={e} today={today} />
                <KindBadge kind={e.kind} className="!bg-white/10 !text-white !ring-white/20" />
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">{e.title}</h1>
              <p className="mt-2 text-lg text-white/80"><span aria-hidden="true">{flag(e.country_code)}</span> {place(e)} · {dateRange(e)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        {ended && (
          <div className="mb-6 rounded-2xl border border-border bg-muted p-4 text-sm font-medium">
            This event has ended. <Link to={TECH_EVENTS_PATH} className="font-semibold text-primary underline">See coming tech events</Link>.
          </div>
        )}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-8">
            <div>
              <h2 className="mb-3 text-xl font-bold">About this {(KIND_LABELS[e.kind] || "event").toLowerCase()}</h2>
              <div className="mb-3 flex flex-wrap gap-1.5"><Extras e={e} /></div>
              <EventAbout e={e} />
            </div>
            <div>
              <h2 className="mb-3 text-xl font-bold">The details</h2>
              <EventFacts e={e} />
            </div>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <h2 className="mb-3 font-bold">{ended ? "Event links" : "Going? Do these"}</h2>
              <EventActions e={e} pageUrl={pageUrl} />
            </div>
          </aside>
        </div>

        {more.here.length > 0 && (
          <div className="mt-12">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">More tech events in {e.country} {flag(e.country_code)}</h2>
              <Link to={`${TECH_EVENTS_PATH}?c=${e.country_code}`} className="shrink-0 text-sm font-semibold text-primary hover:underline">See all</Link>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{more.here.map((x) => <EventRow key={x.slug} e={x} today={today} />)}</div>
          </div>
        )}
        {more.same.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-xl font-bold">You may also like</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{more.same.map((x) => <EventRow key={x.slug} e={x} today={today} />)}</div>
          </div>
        )}
      </section>
    </Layout>
  );
}
