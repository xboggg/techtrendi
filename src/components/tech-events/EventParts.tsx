// Building blocks for the tech events pages (/tech-events, /tech-events/:slug). Data and
// helpers: src/data/techEvents.ts.
import { Link } from "react-router-dom";
import {
  CalendarPlus, ChevronLeft, ChevronRight, Code2, Download, GraduationCap, Landmark, MapPin, Mic2,
  PartyPopper, Store, Ticket, Trophy, Users, Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DAYS, FORMAT_LABELS, KIND_LABELS, MON, MONTHS, TOPIC_LABELS, type TechEvent, addDays, dateRange,
  downloadIcs, eventPath, eventStatus, flag, googleCalendarUrl, hasOwnPage, parts, place, timeRange, weekday,
} from "@/data/techEvents";

// ---------------- look per type of event ----------------
export const KIND_STYLE: Record<string, { grad: string; soft: string; Icon: React.ComponentType<{ className?: string }> }> = {
  conference: { grad: "from-sky-500 to-indigo-600", soft: "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/20", Icon: Mic2 },
  summit: { grad: "from-violet-500 to-fuchsia-600", soft: "bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/20", Icon: Landmark },
  festival: { grad: "from-orange-500 to-rose-600", soft: "bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/20", Icon: PartyPopper },
  meetup: { grad: "from-emerald-500 to-teal-600", soft: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20", Icon: Users },
  workshop: { grad: "from-amber-500 to-orange-600", soft: "bg-amber-500/10 text-amber-800 dark:text-amber-300 ring-amber-500/20", Icon: GraduationCap },
  hackathon: { grad: "from-lime-500 to-emerald-600", soft: "bg-lime-500/10 text-lime-800 dark:text-lime-300 ring-lime-500/20", Icon: Code2 },
  expo: { grad: "from-cyan-500 to-blue-600", soft: "bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 ring-cyan-500/20", Icon: Store },
  awards: { grad: "from-yellow-400 to-amber-600", soft: "bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 ring-yellow-500/20", Icon: Trophy },
};
export const kindStyle = (k: string) => KIND_STYLE[k] || KIND_STYLE.conference;

// ---------------- small pieces ----------------
export function KindBadge({ kind, className }: { kind: string; className?: string }) {
  const s = kindStyle(kind);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", s.soft, className)}>
      <s.Icon className="h-3 w-3" />{KIND_LABELS[kind] || "Event"}
    </span>
  );
}

export function TopicChips({ topics, max = 3 }: { topics: string[]; max?: number }) {
  if (!topics.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {topics.slice(0, max).map((t) => (
        <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">{TOPIC_LABELS[t] || t}</span>
      ))}
    </div>
  );
}

const WHEN_STYLE: Record<string, string> = {
  now: "bg-red-500 text-white", today: "bg-red-500 text-white", tomorrow: "bg-orange-500 text-white",
  soon: "bg-amber-400/90 text-amber-950", later: "bg-muted text-muted-foreground", ended: "bg-muted text-muted-foreground line-through",
};

export function WhenBadge({ e, today }: { e: TechEvent; today: string }) {
  const s = eventStatus(e, today);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", WHEN_STYLE[s.when])}>
      {(s.when === "now" || s.when === "today") && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      {s.label}
    </span>
  );
}

export function Extras({ e }: { e: TechEvent }) {
  return (
    <>
      {e.format !== "in_person" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-500/20 dark:text-blue-300">
          <Wifi className="h-3 w-3" />{FORMAT_LABELS[e.format]}
        </span>
      )}
      {e.is_free === true && !e.sold_out && (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-600/10 px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-inset ring-green-600/20 dark:text-green-300">
          <Ticket className="h-3 w-3" />Free
        </span>
      )}
      {e.sold_out && <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-white">Sold out</span>}
    </>
  );
}

/** Big date square: month on top, day number, weekday underneath. */
export function DateTile({ e, size = "md" }: { e: TechEvent; size?: "md" | "lg" }) {
  const p = parts(e.starts_on);
  const multi = e.starts_on !== e.ends_on;
  const s = kindStyle(e.kind);
  return (
    <div className={cn("flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl bg-card text-center shadow-sm ring-1 ring-border",
      size === "lg" ? "h-24 w-24" : "h-[4.5rem] w-16 sm:h-20 sm:w-[4.5rem]")}>
      <div className={cn("w-full bg-gradient-to-r py-0.5 text-[10px] font-bold uppercase tracking-wider text-white", s.grad)}>{MON[p.m - 1]}</div>
      <div className={cn("font-black leading-none tabular-nums text-foreground", size === "lg" ? "mt-2 text-4xl" : "mt-1.5 text-2xl sm:text-[1.7rem]")}>{p.d}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">
        {multi ? `to ${parts(e.ends_on).d} ${parts(e.ends_on).m !== p.m ? MON[parts(e.ends_on).m - 1] : ""}`.trim() : DAYS[weekday(e.starts_on)].slice(0, 3)}
      </div>
    </div>
  );
}

/** Link to the event's own page; for an event newer than the last build, opens its details here. */
export function EventLink({ e, onOpen, className, children }: { e: TechEvent; onOpen?: (e: TechEvent) => void; className?: string; children: React.ReactNode }) {
  if (hasOwnPage(e.slug) || !onOpen) return <Link to={eventPath(e)} className={className}>{children}</Link>;
  return (
    <a href={eventPath(e)} className={className} onClick={(ev) => { ev.preventDefault(); onOpen(e); }}>{children}</a>
  );
}

// ---------------- list row ----------------
export function EventRow({ e, today, onOpen }: { e: TechEvent; today: string; onOpen?: (e: TechEvent) => void }) {
  const t = timeRange(e);
  return (
    <EventLink e={e} onOpen={onOpen}
      className="group flex min-w-0 gap-3 rounded-2xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:gap-4 sm:p-4">
      <DateTile e={e} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <WhenBadge e={e} today={today} />
          <KindBadge kind={e.kind} />
          <Extras e={e} />
        </div>
        <h3 className="text-base font-bold leading-snug text-foreground group-hover:text-primary sm:text-lg">{e.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <span aria-hidden="true">{flag(e.country_code)}</span>
          <span className="truncate">{place(e)}{e.starts_on !== e.ends_on ? ` · ${dateRange(e)}` : t ? ` · ${t}` : ""}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TopicChips topics={e.topics} />
          {typeof e.going === "number" && e.going > 0 && (
            <span className="text-[11px] font-medium text-muted-foreground"><Users className="mr-0.5 inline h-3 w-3" />{e.going} going</span>
          )}
        </div>
      </div>
      <ChevronRight className="hidden h-5 w-5 shrink-0 self-center text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary sm:block" />
    </EventLink>
  );
}

// ---------------- grid card ----------------
export function EventCard({ e, today, onOpen }: { e: TechEvent; today: string; onOpen?: (e: TechEvent) => void }) {
  const s = kindStyle(e.kind);
  const p = parts(e.starts_on);
  return (
    <EventLink e={e} onOpen={onOpen}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
      <div className={cn("relative h-28 overflow-hidden bg-gradient-to-br p-4 text-white", s.grad)}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
        <s.Icon className="absolute -bottom-4 -right-3 h-28 w-28 opacity-15 transition group-hover:rotate-6 group-hover:scale-110" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-90">{MON[p.m - 1]} {p.y}</div>
            <div className="text-4xl font-black leading-none tabular-nums">{p.d}{e.starts_on !== e.ends_on && <span className="text-xl font-bold opacity-90">–{parts(e.ends_on).d}{parts(e.ends_on).m !== p.m ? ` ${MON[parts(e.ends_on).m - 1]}` : ""}</span>}</div>
          </div>
          <span className="text-3xl drop-shadow" aria-hidden="true">{flag(e.country_code)}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <WhenBadge e={e} today={today} />
          <KindBadge kind={e.kind} />
          <Extras e={e} />
        </div>
        <h3 className="line-clamp-2 font-bold leading-snug text-foreground group-hover:text-primary">{e.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{place(e)}</span></p>
        <div className="mt-auto pt-3"><TopicChips topics={e.topics} max={2} /></div>
      </div>
    </EventLink>
  );
}

// ---------------- month calendar ----------------
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function EventCalendar({ events, month, setMonth, today, selected, setSelected, onOpen }: {
  events: TechEvent[]; month: string; setMonth: (m: string) => void; today: string;
  selected: string | null; setSelected: (d: string | null) => void; onOpen?: (e: TechEvent) => void;
}) {
  const [y, m] = month.split("-").map(Number);
  const first = `${month}-01`;
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (weekday(first) + 6) % 7; // Monday first
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => addDays(first, i))];
  while (cells.length % 7) cells.push(null);
  const on = (d: string) => events.filter((e) => e.starts_on <= d && e.ends_on >= d);
  const shift = (n: number) => { const t = new Date(Date.UTC(y, m - 1 + n, 1)); setMonth(`${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`); setSelected(null); };
  const inMonth = events.filter((e) => e.starts_on <= `${month}-31` && e.ends_on >= first).length;
  const dayList = selected ? on(selected) : [];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-3 sm:px-5">
          <button onClick={() => shift(-1)} className="rounded-full p-2 hover:bg-muted" aria-label="Previous month"><ChevronLeft className="h-5 w-5" /></button>
          <div className="text-center">
            <div className="text-lg font-bold">{MONTHS[m - 1]} {y}</div>
            <div className="text-xs text-muted-foreground">{inMonth} event{inMonth === 1 ? "" : "s"}</div>
          </div>
          <button onClick={() => shift(1)} className="rounded-full p-2 hover:bg-muted" aria-label="Next month"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-[11px] font-semibold uppercase text-muted-foreground">
          {WEEK.map((w) => <div key={w} className="py-2">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            if (!d) return <div key={i} className="min-h-[3.25rem] border-b border-r border-border/60 bg-muted/20 sm:min-h-[6.5rem]" />;
            const list = on(d);
            const isToday = d === today, isSel = d === selected;
            return (
              <button key={i} onClick={() => setSelected(isSel ? null : d)} disabled={!list.length}
                className={cn("relative flex min-h-[3.25rem] min-w-0 flex-col items-start justify-start border-b border-r border-border/60 p-1 text-left transition sm:min-h-[6.5rem] sm:p-1.5",
                  list.length ? "hover:bg-primary/5" : "cursor-default", isSel && "bg-primary/10 ring-2 ring-inset ring-primary", d < today && "opacity-60")}>
                <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground")}>{parts(d).d}</span>
                {/* phones: coloured dots */}
                <div className="mt-0.5 flex flex-wrap gap-0.5 sm:hidden">
                  {list.slice(0, 4).map((e) => <span key={e.slug} className={cn("h-1.5 w-1.5 rounded-full bg-gradient-to-r", kindStyle(e.kind).grad)} />)}
                  {list.length > 4 && <span className="text-[9px] font-bold leading-none text-muted-foreground">+</span>}
                </div>
                {/* wider screens: titles */}
                <div className="mt-1 hidden w-full min-w-0 space-y-0.5 sm:block">
                  {list.slice(0, 2).map((e) => (
                    <div key={e.slug} className={cn("truncate rounded bg-gradient-to-r px-1 py-0.5 text-[10px] font-semibold text-white", kindStyle(e.kind).grad)}>{e.title}</div>
                  ))}
                  {list.length > 2 && <div className="px-1 text-[10px] font-semibold text-muted-foreground">+{list.length - 2} more</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {selected ? (
        <div>
          <h3 className="mb-2 text-sm font-bold text-muted-foreground">{DAYS[weekday(selected)]} {parts(selected).d} {MONTHS[parts(selected).m - 1]}: {dayList.length} event{dayList.length === 1 ? "" : "s"}</h3>
          <div className="space-y-3">{dayList.map((e) => <EventRow key={e.slug} e={e} today={today} onOpen={onOpen} />)}</div>
        </div>
      ) : inMonth > 0 ? (
        <p className="text-center text-sm text-muted-foreground">Tap a day to see its events.</p>
      ) : (
        <p className="text-center text-sm text-muted-foreground">No events this month with your filters. Try the next month.</p>
      )}
    </div>
  );
}

// ---------------- add to calendar ----------------
export function AddToCalendar({ e, className }: { e: TechEvent; className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-semibold transition hover:bg-muted", className)}>
          <CalendarPlus className="h-5 w-5" /> Add to my calendar
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuItem asChild>
          <a href={googleCalendarUrl(e)} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <CalendarPlus className="mr-2 h-4 w-4" /> Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => downloadIcs(e)} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" /> iPhone, Outlook or other (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
