// Filters for /tech-events: the state, the matching rules (with a count next to every choice),
// the address-bar sync (?c=GH,NG&t=ai&w=month ...) and the panel (desktop side column and the
// phone sheet use the same panel).
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  KIND_LABELS, KIND_ORDER, MAIN_COUNTRIES, MONTHS, REGIONS, TOPIC_LABELS, type TechEvent,
  addDays, dayDiff, flag, monthKey, weekday,
} from "@/data/techEvents";
import { kindStyle } from "./EventParts";

export type When = "upcoming" | "week" | "weekend" | "month" | "3months" | "past";
export type Facet = "country" | "region" | "kind" | "topic" | "format" | "when";
export interface Filters {
  q: string;
  countries: string[];
  regions: string[];
  kinds: string[];
  topics: string[];
  format: "any" | "in_person" | "online";
  free: boolean;
  when: When;
  /** A single month "YYYY-MM" (overrides `when` except "past"). */
  month: string | null;
}

export const EMPTY: Filters = { q: "", countries: [], regions: [], kinds: [], topics: [], format: "any", free: false, when: "upcoming", month: null };

export const WHEN_LABELS: Record<When, string> = {
  upcoming: "All coming events", week: "Next 7 days", weekend: "This weekend", month: "Next 30 days", "3months": "Next 3 months", past: "Past events",
};

const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

function whenMatch(e: TechEvent, f: Filters, today: string) {
  if (f.when === "past") return e.ends_on < today && (!f.month || monthKey(e.starts_on) === f.month || monthKey(e.ends_on) === f.month);
  if (e.ends_on < today) return false;
  if (f.month) return e.starts_on <= `${f.month}-31` && e.ends_on >= `${f.month}-01`;
  if (f.when === "upcoming") return true;
  if (f.when === "weekend") {
    const wd = weekday(today); // 0 Sun ... 6 Sat
    const sat = wd === 0 ? addDays(today, -1) : addDays(today, 6 - wd);
    const sun = addDays(sat, 1);
    return e.starts_on <= sun && e.ends_on >= (wd === 0 ? today : sat);
  }
  const span = f.when === "week" ? 7 : f.when === "month" ? 30 : 92;
  return dayDiff(today, e.starts_on) <= span;
}

/** Does the event pass every filter except `skip` (used for the counts beside each choice)? */
export function matches(e: TechEvent, f: Filters, today: string, skip?: Facet) {
  if (skip !== "when" && !whenMatch(e, f, today)) return false;
  if (skip !== "country" && f.countries.length && !f.countries.includes(e.country_code)) return false;
  if (skip !== "region" && f.regions.length && !f.regions.includes(e.region)) return false;
  if (skip !== "kind" && f.kinds.length && !f.kinds.includes(e.kind)) return false;
  if (skip !== "topic" && f.topics.length && !f.topics.some((t) => e.topics.includes(t))) return false;
  if (skip !== "format" && f.format !== "any" && (f.format === "online" ? e.format === "in_person" : e.format === "online")) return false;
  if (f.free && e.is_free !== true) return false;
  if (f.q.trim()) {
    const hay = norm([e.title, e.city, e.country, e.region, e.venue, e.host, KIND_LABELS[e.kind], ...e.topics.map((t) => TOPIC_LABELS[t])].filter(Boolean).join(" "));
    if (!norm(f.q).trim().split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

export function countBy(events: TechEvent[], f: Filters, today: string, facet: Facet, key: (e: TechEvent) => string | string[]) {
  const out = new Map<string, number>();
  for (const e of events) {
    if (!matches(e, f, today, facet)) continue;
    const k = key(e);
    for (const x of Array.isArray(k) ? k : [k]) out.set(x, (out.get(x) || 0) + 1);
  }
  return out;
}

export const activeCount = (f: Filters) =>
  f.countries.length + f.regions.length + f.kinds.length + f.topics.length + (f.format !== "any" ? 1 : 0) + (f.free ? 1 : 0) +
  (f.when !== "upcoming" ? 1 : 0) + (f.month ? 1 : 0) + (f.q.trim() ? 1 : 0);

// ---------------- address bar ----------------
const list = (s: string | null, ok: (x: string) => boolean) => (s ? s.split(",").filter(ok).slice(0, 30) : []);

export function filtersFromSearch(search: string): { f: Filters; view: string | null; sort: string | null; open: string | null } {
  const p = new URLSearchParams(search);
  const w = p.get("w") as When | null;
  const m = p.get("m");
  return {
    f: {
      q: (p.get("q") || "").slice(0, 80),
      countries: list(p.get("c"), (x) => /^[A-Z]{2}$/.test(x)),
      regions: list(p.get("r"), (x) => REGIONS.includes(x)),
      kinds: list(p.get("k"), (x) => x in KIND_LABELS),
      topics: list(p.get("t"), (x) => x in TOPIC_LABELS),
      format: p.get("f") === "online" ? "online" : p.get("f") === "in_person" ? "in_person" : "any",
      free: p.get("free") === "1",
      when: w && w in WHEN_LABELS ? w : "upcoming",
      month: m && /^\d{4}-\d{2}$/.test(m) ? m : null,
    },
    view: p.get("v"), sort: p.get("s"), open: p.get("e"),
  };
}

export function searchFromFilters(f: Filters, view: string, sort: string, open: string | null) {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.countries.length) p.set("c", f.countries.join(","));
  if (f.regions.length) p.set("r", f.regions.join(","));
  if (f.kinds.length) p.set("k", f.kinds.join(","));
  if (f.topics.length) p.set("t", f.topics.join(","));
  if (f.format !== "any") p.set("f", f.format);
  if (f.free) p.set("free", "1");
  if (f.when !== "upcoming") p.set("w", f.when);
  if (f.month) p.set("m", f.month);
  if (view !== "list") p.set("v", view);
  if (sort !== "soonest") p.set("s", sort);
  if (open) p.set("e", open);
  const s = p.toString().replace(/%2C/g, ",");
  return s ? `?${s}` : "";
}

export const toggle = (arr: string[], x: string) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);

// ---------------- panel ----------------
function Section({ title, children, onClear }: { title: string; children: React.ReactNode; onClear?: () => void }) {
  return (
    <div className="border-b border-border py-4 last:border-0">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
        {onClear && <button onClick={onClear} className="text-xs font-semibold text-primary hover:underline">Clear</button>}
      </div>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children, count, className }: { on: boolean; onClick: () => void; children: React.ReactNode; count?: number; className?: string }) {
  const empty = count === 0 && !on;
  return (
    <button onClick={onClick} disabled={empty} aria-pressed={on}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
        on ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card hover:border-primary/50 hover:bg-primary/5",
        empty && "cursor-not-allowed opacity-40", className)}>
      {on && <Check className="h-3.5 w-3.5" />}
      {children}
      {typeof count === "number" && <span className={cn("text-xs tabular-nums", on ? "opacity-90" : "text-muted-foreground")}>{count}</span>}
    </button>
  );
}

export function FilterPanel({ events, f, set, today, months }: {
  events: TechEvent[]; f: Filters; set: (f: Filters) => void; today: string; months: string[];
}) {
  const countries = countBy(events, f, today, "country", (e) => e.country_code);
  const regions = countBy(events, f, today, "region", (e) => e.region);
  const kinds = countBy(events, f, today, "kind", (e) => e.kind);
  const topics = countBy(events, f, today, "topic", (e) => e.topics);
  const names = new Map(events.map((e) => [e.country_code, e.country]));
  const otherCountries = [...names.keys()].filter((c) => !MAIN_COUNTRIES.includes(c))
    .sort((a, b) => (countries.get(b) || 0) - (countries.get(a) || 0) || names.get(a)!.localeCompare(names.get(b)!));
  const topicKeys = Object.keys(TOPIC_LABELS).filter((t) => (topics.get(t) || 0) > 0 || f.topics.includes(t))
    .sort((a, b) => (topics.get(b) || 0) - (topics.get(a) || 0));

  return (
    <div>
      <Section title="Search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={f.q} onChange={(ev) => set({ ...f, q: ev.target.value })} placeholder="Event, city or topic"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          {f.q && <button onClick={() => set({ ...f, q: "" })} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
        </div>
      </Section>

      <Section title="When" onClear={f.when !== "upcoming" || f.month ? () => set({ ...f, when: "upcoming", month: null }) : undefined}>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(WHEN_LABELS) as When[]).map((w) => (
            <Chip key={w} on={f.when === w && !f.month} onClick={() => set({ ...f, when: w, month: null })}>{WHEN_LABELS[w]}</Chip>
          ))}
        </div>
        {months.length > 0 && (
          <select value={f.month || ""} onChange={(ev) => set({ ...f, month: ev.target.value || null, when: f.when === "past" ? "past" : "upcoming" })}
            className="mt-2.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" aria-label="Pick a month">
            <option value="">Or pick a month…</option>
            {months.map((m) => { const [y, mo] = m.split("-").map(Number); return <option key={m} value={m}>{MONTHS[mo - 1]} {y}</option>; })}
          </select>
        )}
      </Section>

      <Section title="Country" onClear={f.countries.length ? () => set({ ...f, countries: [] }) : undefined}>
        <div className="flex flex-wrap gap-1.5">
          {MAIN_COUNTRIES.map((c) => (
            <Chip key={c} on={f.countries.includes(c)} count={countries.get(c) || 0} onClick={() => set({ ...f, countries: toggle(f.countries, c) })}>
              <span aria-hidden="true">{flag(c)}</span>{{ GH: "Ghana", NG: "Nigeria", KE: "Kenya", ZA: "South Africa" }[c]}
            </Chip>
          ))}
        </div>
        {otherCountries.length > 0 && (
          <details className="group mt-2" open={f.countries.some((c) => !MAIN_COUNTRIES.includes(c))}>
            <summary className="cursor-pointer list-none text-sm font-semibold text-primary hover:underline">
              <span className="group-open:hidden">More countries ({otherCountries.length})</span>
              <span className="hidden group-open:inline">Fewer countries</span>
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {otherCountries.map((c) => (
                <Chip key={c} on={f.countries.includes(c)} count={countries.get(c) || 0} onClick={() => set({ ...f, countries: toggle(f.countries, c) })}>
                  <span aria-hidden="true">{flag(c)}</span>{names.get(c)}
                </Chip>
              ))}
            </div>
          </details>
        )}
      </Section>

      <Section title="Part of Africa" onClear={f.regions.length ? () => set({ ...f, regions: [] }) : undefined}>
        <div className="flex flex-wrap gap-1.5">
          {REGIONS.map((r) => (
            <Chip key={r} on={f.regions.includes(r)} count={regions.get(r) || 0} onClick={() => set({ ...f, regions: toggle(f.regions, r) })}>{r}</Chip>
          ))}
        </div>
      </Section>

      <Section title="What kind" onClear={f.kinds.length ? () => set({ ...f, kinds: [] }) : undefined}>
        <div className="flex flex-wrap gap-1.5">
          {KIND_ORDER.map((k) => {
            const S = kindStyle(k);
            return (
              <Chip key={k} on={f.kinds.includes(k)} count={kinds.get(k) || 0} onClick={() => set({ ...f, kinds: toggle(f.kinds, k) })}>
                <S.Icon className="h-3.5 w-3.5" />{KIND_LABELS[k]}
              </Chip>
            );
          })}
        </div>
      </Section>

      <Section title="Topic" onClear={f.topics.length ? () => set({ ...f, topics: [] }) : undefined}>
        <div className="flex flex-wrap gap-1.5">
          {topicKeys.map((t) => (
            <Chip key={t} on={f.topics.includes(t)} count={topics.get(t) || 0} onClick={() => set({ ...f, topics: toggle(f.topics, t) })}>{TOPIC_LABELS[t]}</Chip>
          ))}
        </div>
      </Section>

      <Section title="How to attend">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {([["any", "Any"], ["in_person", "In person"], ["online", "Online"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => set({ ...f, format: v })} aria-pressed={f.format === v}
              className={cn("rounded-lg py-2 text-sm font-semibold transition", f.format === v ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground")}>{l}</button>
          ))}
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
          <span>
            <span className="block text-sm font-semibold">Free events only</span>
            <span className="block text-xs text-muted-foreground">Only events marked free by the organiser</span>
          </span>
          <Switch checked={f.free} onCheckedChange={(v) => set({ ...f, free: v })} />
        </label>
      </Section>
    </div>
  );
}
