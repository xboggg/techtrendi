import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Clock, LayoutGrid, List, MapPin, Radio, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  KIND_LABELS, MAIN_COUNTRIES, REGIONS, SHOWN_SOURCES, SOURCE_LABELS, TECH_EVENTS, TECH_EVENTS_OG, TECH_EVENTS_OG_ALT, TECH_EVENTS_PATH, TOPIC_LABELS, type TechEvent,
  dateRange, dayDiff, hasOwnPage, monthKey, monthLabel, place, todayISO, useTechEventsLive, useToday,
} from "@/data/techEvents";
import { DateTile, EventCalendar, EventCard, EventLink, EventRow, KindBadge, kindStyle } from "@/components/tech-events/EventParts";
import {
  EMPTY, FilterPanel, type Filters, WHEN_LABELS, activeCount, countBy, filtersFromSearch, matches, searchFromFilters, toggle,
} from "@/components/tech-events/EventFilters";
import { EventAbout, EventActions, EventFacts, pageUrlFor } from "@/components/tech-events/EventDetails";
import { Flag } from "@/components/tech-events/Flag";

type View = "list" | "grid" | "calendar";
type Sort = "soonest" | "newest";
const BIG = new Set(["conference", "summit", "festival", "expo"]);
const COUNTRY_NAMES: Record<string, string> = { GH: "Ghana", NG: "Nigeria", KE: "Kenya", ZA: "South Africa" };

// Ticking countdown, browser only (the prerendered page shows the day count, which never changes within a build day).
function Countdown({ e, today }: { e: TechEvent; today: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const target = e.start_time ? Date.parse(e.start_time) : Date.parse(`${e.starts_on}T08:00:00Z`);
  if (now === null || target <= now) {
    const d = Math.max(0, dayDiff(today, e.starts_on));
    return <div className="text-sm font-semibold text-white/80">{d === 0 ? "Starts today" : `Starts in ${d} day${d === 1 ? "" : "s"}`}</div>;
  }
  const s = Math.floor((target - now) / 1000);
  const units = [["days", Math.floor(s / 86400)], ["hrs", Math.floor((s % 86400) / 3600)], ["min", Math.floor((s % 3600) / 60)], ["sec", s % 60]] as const;
  return (
    <div className="flex gap-2" aria-label="Time left before it starts">
      {units.map(([l, v]) => (
        <div key={l} className="min-w-[3.25rem] rounded-xl bg-white/10 px-2 py-1.5 text-center ring-1 ring-white/15 backdrop-blur">
          <div className="text-xl font-black tabular-nums leading-none">{String(v).padStart(2, "0")}</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">{l}</div>
        </div>
      ))}
    </div>
  );
}

export default function TechEventsHub() {
  const [events] = useTechEventsLive();
  const today = useToday();
  const [f, setF] = useState<Filters>(EMPTY);
  const [view, setView] = useState<View>("list");
  const [sort, setSort] = useState<Sort>("soonest");
  const [sheet, setSheet] = useState(false);
  const [open, setOpen] = useState<TechEvent | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState<string>(monthKey(today));
  const [calDay, setCalDay] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Read the address bar once (filters are shareable links), then keep it in step.
  useEffect(() => {
    const r = filtersFromSearch(window.location.search);
    setF(r.f);
    if (r.view === "grid" || r.view === "calendar") setView(r.view);
    if (r.sort === "newest") setSort("newest");
    if (r.open && /^[a-z0-9-]{3,100}$/.test(r.open)) setOpenSlug(r.open);
    setCalMonth(r.cal || r.f.month || monthKey(todayISO()));
    setReady(true);
  }, []);
  useEffect(() => { if (f.month) setCalMonth(f.month); }, [f.month]);
  useEffect(() => {
    if (!ready) return;
    const s = searchFromFilters(f, view, sort, open?.slug || null, view === "calendar" && calMonth !== monthKey(today) ? calMonth : null);
    if (s !== window.location.search) window.history.replaceState(window.history.state, "", `${TECH_EVENTS_PATH}${s}`);
  }, [f, view, sort, open, ready, calMonth, today]);
  // ?e=<slug>: open that event once the live list has it.
  useEffect(() => {
    if (!openSlug) return;
    const e = events.find((x) => x.slug === openSlug);
    if (e) { setOpen(e); setOpenSlug(null); }
  }, [openSlug, events]);

  const upcoming = useMemo(() => events.filter((e) => e.ends_on >= today), [events, today]);
  const results = useMemo(() => {
    const r = events.filter((e) => matches(e, f, today));
    if (sort === "newest") return [...r].sort((a, b) => b.first_seen.localeCompare(a.first_seen) || a.starts_on.localeCompare(b.starts_on));
    return f.when === "past" ? [...r].sort((a, b) => b.starts_on.localeCompare(a.starts_on)) : r;
  }, [events, f, sort, today]);
  // Calendar: the month on screen replaces a picked month; any other "When" choice still applies
  // (Codex, PR #73). "All coming events" shows the whole month, past days dimmed.
  const calEvents = useMemo(() => events.filter((e) => matches(e, { ...f, month: null }, today, f.when === "upcoming" ? "when" : undefined)), [events, f, today]);
  const calCount = useMemo(() => calEvents.filter((e) => e.starts_on <= `${calMonth}-31` && e.ends_on >= `${calMonth}-01`).length, [calEvents, calMonth]);
  const shown = view === "calendar" ? calCount : results.length;
  const months = useMemo(() => [...new Set(upcoming.map((e) => monthKey(e.starts_on)))].sort(), [upcoming]);
  const groups = useMemo(() => {
    const g = new Map<string, TechEvent[]>();
    for (const e of results) { const k = sort === "newest" ? "" : monthKey(e.starts_on); g.set(k, [...(g.get(k) || []), e]); }
    return [...g.entries()];
  }, [results, sort]);

  const countries = new Set(upcoming.map((e) => e.country_code)).size;
  const thisWeek = upcoming.filter((e) => dayDiff(today, e.starts_on) <= 7).length;
  const spotlight = upcoming.find((e) => e.featured && e.starts_on >= today)
    || upcoming.find((e) => e.starts_on > today && BIG.has(e.kind) && (e.source === "labari" || !!e.summary))
    || upcoming.find((e) => e.starts_on > today && BIG.has(e.kind));
  const heroCountries = countBy(events, { ...EMPTY }, today, "country", (e) => e.country_code);
  const n = activeCount(f);
  const sets = (x: Filters) => { setF(x); setCalDay(null); };

  const chips: { label: string; cc?: string; clear: () => void }[] = [
    ...(f.q.trim() ? [{ label: `“${f.q.trim()}”`, clear: () => sets({ ...f, q: "" }) }] : []),
    ...(f.when !== "upcoming" ? [{ label: WHEN_LABELS[f.when], clear: () => sets({ ...f, when: "upcoming" }) }] : []),
    ...(f.month ? [{ label: monthLabel(f.month), clear: () => sets({ ...f, month: null }) }] : []),
    ...f.countries.map((c) => ({ label: events.find((e) => e.country_code === c)?.country || c, cc: c, clear: () => sets({ ...f, countries: toggle(f.countries, c) }) })),
    ...f.regions.map((r) => ({ label: r, clear: () => sets({ ...f, regions: toggle(f.regions, r) }) })),
    ...f.kinds.map((k) => ({ label: KIND_LABELS[k], clear: () => sets({ ...f, kinds: toggle(f.kinds, k) }) })),
    ...f.topics.map((t) => ({ label: TOPIC_LABELS[t], clear: () => sets({ ...f, topics: toggle(f.topics, t) }) })),
    ...(f.format !== "any" ? [{ label: f.format === "online" ? "Online" : "In person", clear: () => sets({ ...f, format: "any" }) }] : []),
    ...(f.free ? [{ label: "Free only", clear: () => sets({ ...f, free: false }) }] : []),
  ];

  const itemNames = TECH_EVENTS.filter((e) => e.ends_on >= today).slice(0, 20).map((e) => `${e.title} (${dateRange(e)}, ${place(e)})`);

  return (
    <Layout>
      <SEOHead
        title="Tech Events in Africa: Ghana, Nigeria, Kenya, South Africa"
        description={`${upcoming.length} coming tech events across Africa: conferences, meetups, hackathons and classes in Ghana, Nigeria, Kenya, South Africa and more. Updated every 6 hours.`}
        canonical={TECH_EVENTS_PATH}
        image={TECH_EVENTS_OG}
        imageAlt={TECH_EVENTS_OG_ALT}
        keywords={["tech events Africa", "tech events Ghana", "tech events Nigeria", "tech events Kenya", "tech events South Africa", "tech conferences Africa", "DevFest", "tech meetups Accra", "tech meetups Lagos", "hackathons Africa"]}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Tech Events", path: TECH_EVENTS_PATH }]}
        itemList={{ name: "Coming tech events in Africa", items: itemNames }}
      />

      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden bg-[#070b18] text-white">
        <motion.div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-indigo-600/30 blur-[120px]"
          animate={{ x: [0, 60, 0], y: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -bottom-52 -right-32 h-[36rem] w-[36rem] rounded-full bg-emerald-500/20 blur-[130px]"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 21, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)" }} />

        <div className="container relative mx-auto px-4 pb-12 pt-10 sm:pt-14 md:pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15 backdrop-blur">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
                Live list · checked every 6 hours
              </div>
              <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Tech events<br /><span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent">across Africa</span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">
                Conferences, meetups, hackathons and classes in Ghana, Nigeria, Kenya, South Africa and {Math.max(0, countries - 4)} more countries. Find one near you and add it to your calendar.
              </p>

              <div className="relative mt-6 max-w-xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                <input value={f.q} onChange={(ev) => sets({ ...f, q: ev.target.value })}
                  onKeyDown={(ev) => { if (ev.key === "Enter") document.getElementById("events")?.scrollIntoView({ behavior: "smooth" }); }}
                  placeholder="Search: AI, Accra, DevFest, fintech…" aria-label="Search tech events"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 py-4 pl-12 pr-4 text-base text-white placeholder:text-white/45 outline-none backdrop-blur transition focus:border-white/40 focus:bg-white/15" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => sets({ ...f, countries: [] })}
                  className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 transition", !f.countries.length ? "bg-white text-slate-900 ring-white" : "bg-white/5 text-white ring-white/20 hover:bg-white/15")}>
                  🌍 All of Africa
                </button>
                {MAIN_COUNTRIES.map((c) => (
                  <button key={c} onClick={() => { sets({ ...f, countries: toggle(f.countries, c) }); }}
                    className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 transition", f.countries.includes(c) ? "bg-white text-slate-900 ring-white" : "bg-white/5 text-white ring-white/20 hover:bg-white/15")}>
                    <Flag cc={c} /> {COUNTRY_NAMES[c]} <span className="opacity-60">{heroCountries.get(c) || 0}</span>
                  </button>
                ))}
              </div>

              <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                {[[upcoming.length, "coming events"], [countries, "countries"], [thisWeek, "in the next 7 days"]].map(([v, l]) => (
                  <div key={l as string} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                    <dt className="sr-only">{l}</dt>
                    <dd className="text-2xl font-black tabular-nums sm:text-3xl">{v}</dd>
                    <dd className="text-xs text-white/60">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* spotlight: the next big event */}
            {spotlight && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-3xl p-[1px]">
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", kindStyle(spotlight.kind).grad)} />
                <div className="relative rounded-[calc(1.5rem-1px)] bg-[#0c1224]/90 p-5 backdrop-blur sm:p-6">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300"><Sparkles className="h-4 w-4" /> Next big event</div>
                  <div className="flex gap-4">
                    <DateTile e={spotlight} size="lg" />
                    <div className="min-w-0">
                      <KindBadge kind={spotlight.kind} className="!bg-white/10 !text-white !ring-white/20" />
                      <h2 className="mt-1.5 text-xl font-bold leading-snug sm:text-2xl">{spotlight.title}</h2>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70"><MapPin className="h-4 w-4 shrink-0" /><Flag cc={spotlight.country_code} /> {place(spotlight)}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/70"><CalendarDays className="h-4 w-4 shrink-0" /> {dateRange(spotlight)}</p>
                    </div>
                  </div>
                  <div className="mt-5"><Countdown e={spotlight} today={today} /></div>
                  <EventLink e={spotlight} onOpen={setOpen}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-slate-900 transition hover:bg-white/90">
                    See details <ArrowRight className="h-4 w-4" />
                  </EventLink>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ───────── LIST + FILTERS ───────── */}
      <section id="events" className="container mx-auto scroll-mt-20 px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* desktop filters */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-card px-4 pb-2 shadow-sm">
              <div className="flex items-center justify-between border-b border-border py-3">
                <h2 className="flex items-center gap-2 font-bold"><SlidersHorizontal className="h-4 w-4" /> Filters</h2>
                {n > 0 && <button onClick={() => sets(EMPTY)} className="text-sm font-semibold text-primary hover:underline">Clear all ({n})</button>}
              </div>
              <FilterPanel events={events} f={f} set={sets} today={today} months={months} />
            </div>
          </aside>

          <div className="min-w-0">
            {/* toolbar */}
            <div className="sticky top-16 z-20 -mx-4 mb-4 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:rounded-2xl lg:border lg:bg-card lg:px-4">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setSheet(true)} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-semibold lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> Filters {n > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{n}</span>}
                </button>
                <div className="mr-auto text-sm text-muted-foreground" aria-live="polite">
                  <strong className="text-foreground">{shown}</strong> event{shown === 1 ? "" : "s"}{view === "calendar" ? ` in ${monthLabel(calMonth).split(" ")[0]}` : ""}
                </div>
                {view !== "calendar" && (
                  <select value={sort} onChange={(ev) => setSort(ev.target.value as Sort)} aria-label="Sort events"
                    className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium outline-none focus:border-primary">
                    <option value="soonest">{f.when === "past" ? "Most recent first" : "Soonest first"}</option>
                    <option value="newest">Just added</option>
                  </select>
                )}
                <div className="flex rounded-xl bg-muted p-1" role="group" aria-label="How to show events">
                  {([["list", List, "List"], ["grid", LayoutGrid, "Cards"], ["calendar", CalendarDays, "Calendar"]] as const).map(([v, Icon, label]) => (
                    <button key={v} onClick={() => setView(v)} aria-pressed={view === v} title={label}
                      className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition", view === v ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground")}>
                      <Icon className="h-4 w-4" /><span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {chips.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {chips.map((c) => (
                    <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20">
                      {c.cc && <Flag cc={c.cc} />}{c.label} <X className="h-3 w-3" />
                    </button>
                  ))}
                  <button onClick={() => sets(EMPTY)} className="px-1 text-xs font-semibold text-muted-foreground underline hover:text-foreground">Clear all</button>
                </div>
              )}
            </div>

            {view === "calendar" ? (
              <EventCalendar events={calEvents} month={calMonth} setMonth={setCalMonth} today={today} selected={calDay} setSelected={setCalDay} onOpen={setOpen} />
            ) : results.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><CalendarDays className="h-7 w-7 text-muted-foreground" /></div>
                <h3 className="text-lg font-bold">No events match</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Try fewer filters, another country, or a later month. New events are added every 6 hours.</p>
                <button onClick={() => sets(EMPTY)} className="mt-5 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Show all events</button>
              </div>
            ) : (
              <div className="space-y-8">
                {groups.map(([key, list]) => (
                  <div key={key || "all"}>
                    {key && (
                      <div className="mb-3 flex items-baseline gap-3">
                        <h2 className="text-xl font-black tracking-tight sm:text-2xl">{monthLabel(key)}</h2>
                        <span className="text-sm text-muted-foreground">{list.length} event{list.length === 1 ? "" : "s"}</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    {view === "grid" ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map((e) => <EventCard key={e.slug} e={e} today={today} onOpen={setOpen} />)}</div>
                    ) : (
                      <div className="space-y-3">{list.map((e) => <EventRow key={e.slug} e={e} today={today} onOpen={setOpen} />)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* browse by region (crawlable links + quick filters) */}
            <div className="mt-12 rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 p-5 sm:p-7">
              <h2 className="text-lg font-bold">Browse by part of Africa</h2>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {REGIONS.map((r) => {
                  const list = upcoming.filter((e) => e.region === r);
                  const top = [...new Set(list.map((e) => e.country_code))].slice(0, 6);
                  return (
                    <a key={r} href={`${TECH_EVENTS_PATH}?r=${encodeURIComponent(r)}`}
                      onClick={(ev) => { ev.preventDefault(); sets({ ...EMPTY, regions: [r] }); document.getElementById("events")?.scrollIntoView({ behavior: "smooth" }); }}
                      className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md">
                      <div>
                        <div className="font-bold group-hover:text-primary">{r}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground">{list.length} event{list.length === 1 ? "" : "s"} <span className="ml-1 inline-flex gap-1 align-middle">{top.map((c) => <Flag key={c} cc={c} />)}</span></div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* how it works + add your event */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-bold"><Radio className="h-5 w-5 text-emerald-500" /> Where these events come from</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Our tracker checks public event calendars every 6 hours:{" "}
                  {SHOWN_SOURCES.map((k) => [k, SOURCE_LABELS[k]] as const).map(([k, s], i, a) => (
                    <span key={k}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-foreground underline">{s.name}</a>{i < a.length - 2 ? ", " : i === a.length - 2 ? " and " : ""}</span>
                  ))}
                  , plus events our team checks by hand. We remove repeats and wrong listings. Dates can change, so always check the organiser's website before you travel.
                </p>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-emerald-600 p-5 text-white sm:p-6">
                <h2 className="flex items-center gap-2 font-bold"><Clock className="h-5 w-5" /> Know a tech event we missed?</h2>
                <p className="mt-2 text-sm text-white/85">Tell us the name, date, place and website. We'll check it and add it for free.</p>
                <a href="/contact" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-white/90">Tell us about it <ArrowRight className="h-4 w-4" /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* phone filters */}
      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent side="bottom" className="flex max-h-[88vh] flex-col rounded-t-3xl p-0">
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle className="flex items-center justify-between">
              <span>Filters</span>
              {n > 0 && <button onClick={() => sets(EMPTY)} className="mr-8 text-sm font-semibold text-primary">Clear all</button>}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5"><FilterPanel events={events} f={f} set={sets} today={today} months={months} /></div>
          <div className="border-t border-border p-4">
            <button onClick={() => { setSheet(false); document.getElementById("events")?.scrollIntoView({ behavior: "smooth" }); }}
              className="w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground">
              Show {shown} event{shown === 1 ? "" : "s"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* details of an event found after the last build (it has no page of its own yet) */}
      <Sheet open={!!open} onOpenChange={(v) => { if (!v) setOpen(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {open && (
            <div className="space-y-5 pb-6">
              <SheetHeader className="text-left">
                <KindBadge kind={open.kind} />
                <SheetTitle className="text-2xl font-black leading-tight">{open.title}</SheetTitle>
              </SheetHeader>
              <EventFacts e={open} />
              <EventActions e={open} pageUrl={pageUrlFor(open, hasOwnPage(open.slug))} />
              <EventAbout e={open} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
