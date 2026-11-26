// Tech events across Africa (/tech-events), started 25 Nov 2026.
//
// The events live in the database (techtrendi.tech_events). Nobody types them in: the monitor
// on the server (/opt/tech-news/tech_events/sync.py, every 6 hours) reads Labari Data (the
// calendar behind techlabari.com/event-calendar), dev.events, Luma, Google Developer Groups Ghana
// and a hand-checked list (checked_events.json), merges the same event
// seen on two sites, sorts it by plain keyword rules (no AI) and tells Edmund on Telegram
// about new ones. To hide a wrong event: set its status to 'hidden' (the monitor never
// un-hides).
//
//   - The build bakes the live list into techEvents.json (scripts/fetch-tech-events.mjs):
//     those events are prerendered, each with its own page /tech-events/<slug>.
//   - In the browser the pages re-read the table (useTechEventsLive), so an event found after
//     the last build shows straight away. Until the next build it has no page of its own, so
//     its link is /tech-events?e=<slug> (the list opens its details) — see eventPath.
//
// Dates are plain "YYYY-MM-DD" strings (the event's own local day). Nothing rendered on the
// server depends on the visitor's clock: "today" starts as the build day and switches to the
// real day after the page loads (useToday), so the prerendered HTML and the first browser
// render always match.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import baked from "./techEvents.json";

export type EventFormat = "in_person" | "online" | "hybrid";

export interface TechEvent {
  slug: string;
  title: string;
  starts_on: string;
  ends_on: string;
  /** Exact start/end (ISO) when the source gives one (Luma meetups). */
  start_time: string | null;
  end_time: string | null;
  timezone: string | null;
  city: string | null;
  country_code: string;
  country: string;
  region: string;
  venue: string | null;
  format: EventFormat;
  kind: string;
  topics: string[];
  summary: string | null;
  event_url: string | null;
  source: string;
  source_url: string | null;
  is_free: boolean | null;
  sold_out: boolean | null;
  going: number | null;
  host: string | null;
  featured: boolean;
  first_seen: string;
}

const COLS = "slug,title,starts_on,ends_on,start_time,end_time,timezone,city,country_code,country,region,venue,format,kind,topics,summary,event_url,source,source_url,is_free,sold_out,going,host,featured,first_seen";

const BAKED = baked as { generated_on: string; events: TechEvent[] };
export const BUILD_DAY = BAKED.generated_on;
export const TECH_EVENTS: TechEvent[] = BAKED.events;
const BAKED_SLUGS = new Set(TECH_EVENTS.map((e) => e.slug));

export const TECH_EVENTS_PATH = "/tech-events";
export const TECH_EVENTS_URL = "https://techtrendi.com/tech-events";

/** The event's own page once the build has made it, else the list with its details open. */
export const eventPath = (e: TechEvent) => (BAKED_SLUGS.has(e.slug) ? `/tech-events/${e.slug}` : `/tech-events?e=${e.slug}`);
export const hasOwnPage = (slug: string) => BAKED_SLUGS.has(slug);

const okUrl = (u: unknown) => typeof u === "string" && /^https?:\/\/[^\s"'<>]+$/.test(u);
const okRow = (r: TechEvent) => r && /^[a-z0-9-]{3,100}$/.test(r.slug) && /^\d{4}-\d{2}-\d{2}$/.test(r.starts_on) &&
  /^\d{4}-\d{2}-\d{2}$/.test(r.ends_on) && /^[A-Z]{2}$/.test(r.country_code) &&
  (r.event_url == null || okUrl(r.event_url)) && (r.source_url == null || okUrl(r.source_url));

/** Every live event, soonest first: the baked list at first (matches the prerendered page),
 *  then the live list from the database after mount. Second value: the live list answered. */
export function useTechEventsLive(): [TechEvent[], boolean] {
  const [events, setEvents] = useState<TechEvent[]>(TECH_EVENTS);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let alive = true;
    const since = addDays(todayISO(), -120);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- techtrendi schema table is not in the generated types (same as eiTech.ts)
    (supabase as any).from("tech_events").select(COLS).gte("ends_on", since)
      .order("starts_on", { ascending: true }).order("slug", { ascending: true }).limit(1000)
      .then(({ data }: { data: TechEvent[] | null }) => {
        if (!alive) return;
        const rows = Array.isArray(data) ? data.filter(okRow) : [];
        if (rows.length) setEvents(rows.map((r) => ({ ...r, topics: r.topics || [] })));
        setDone(true);
      }, () => { if (alive) setDone(true); });
    return () => { alive = false; };
  }, []);
  return [events, done];
}

// ---------------- days (string maths only, so build and browser agree) ----------------
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "Today" as the build day on the server and the first render, then the visitor's real day. */
export function useToday() {
  const [today, setToday] = useState(BUILD_DAY);
  useEffect(() => { setToday(todayISO()); }, []);
  return today;
}

const toUTC = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
export const dayDiff = (a: string, b: string) => Math.round((toUTC(b) - toUTC(a)) / 864e5);
export function addDays(iso: string, n: number) {
  const t = new Date(toUTC(iso) + n * 864e5);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}
export const weekday = (iso: string) => new Date(toUTC(iso)).getUTCDay(); // 0 = Sunday

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MON = MONTHS.map((m) => m.slice(0, 3));
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const parts = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return { y, m, d }; };
export const monthKey = (iso: string) => iso.slice(0, 7);
export const monthLabel = (key: string) => { const [y, m] = key.split("-").map(Number); return `${MONTHS[m - 1]} ${y}`; };

/** "5 Dec 2026", "5–6 Dec 2026", "30 Nov – 2 Dec 2026", "30 Dec 2026 – 2 Jan 2027". */
export function dateRange(e: Pick<TechEvent, "starts_on" | "ends_on">) {
  const a = parts(e.starts_on), b = parts(e.ends_on);
  if (e.starts_on === e.ends_on) return `${a.d} ${MON[a.m - 1]} ${a.y}`;
  if (a.y !== b.y) return `${a.d} ${MON[a.m - 1]} ${a.y} – ${b.d} ${MON[b.m - 1]} ${b.y}`;
  if (a.m !== b.m) return `${a.d} ${MON[a.m - 1]} – ${b.d} ${MON[b.m - 1]} ${b.y}`;
  return `${a.d}–${b.d} ${MON[a.m - 1]} ${a.y}`;
}

/** Local start/end time in the event's own time zone, e.g. "9:00 am – 4:00 pm (Lagos time)".
 *  Built from numeric parts so Node and every browser print exactly the same text. */
export function timeRange(e: Pick<TechEvent, "start_time" | "end_time" | "timezone">) {
  if (!e.start_time) return null;
  const f = (iso: string) => {
    try {
      const p = new Intl.DateTimeFormat("en-GB", { timeZone: e.timezone || "UTC", hour: "numeric", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date(iso));
      const h = Number(p.find((x) => x.type === "hour")?.value), m = p.find((x) => x.type === "minute")?.value || "00";
      return `${h % 12 || 12}:${m} ${h < 12 ? "am" : "pm"}`;
    } catch { return null; }
  };
  const s = f(e.start_time), t = e.end_time ? f(e.end_time) : null;
  if (!s) return null;
  const city = e.timezone ? e.timezone.split("/").pop()!.replace(/_/g, " ") : "UTC";
  return `${s}${t && t !== s ? ` – ${t}` : ""} (${city} time)`;
}

export type EventWhen = "now" | "today" | "tomorrow" | "soon" | "later" | "ended";
/** Where the event sits against `today`, and a short plain label. */
export function eventStatus(e: TechEvent, today: string): { when: EventWhen; label: string } {
  if (e.ends_on < today) return { when: "ended", label: "Ended" };
  if (e.starts_on <= today) return e.starts_on === e.ends_on && e.starts_on === today ? { when: "today", label: "Today" } : { when: "now", label: "Happening now" };
  const n = dayDiff(today, e.starts_on);
  if (n === 1) return { when: "tomorrow", label: "Tomorrow" };
  if (n <= 7) return { when: "soon", label: `In ${n} days` };
  if (n <= 30) return { when: "later", label: `In ${Math.round(n / 7)} week${Math.round(n / 7) > 1 ? "s" : ""}` };
  return { when: "later", label: `In ${Math.round(n / 30)} month${Math.round(n / 30) > 1 ? "s" : ""}` };
}

// ---------------- labels ----------------
export const KIND_LABELS: Record<string, string> = {
  conference: "Conference", summit: "Summit", festival: "Tech festival", meetup: "Meetup",
  workshop: "Workshop or class", hackathon: "Hackathon", expo: "Expo", awards: "Awards",
};
export const KIND_ORDER = ["conference", "summit", "festival", "meetup", "workshop", "hackathon", "expo", "awards"];

export const TOPIC_LABELS: Record<string, string> = {
  ai: "AI", fintech: "Fintech and money", crypto: "Crypto and blockchain", startups: "Startups and investors",
  security: "Cyber security", developers: "Coding and developers", cloud: "Cloud and data",
  telecom: "Telecom and internet", health: "Health tech", agri: "Agri tech", climate: "Energy and climate",
  women: "Women in tech", design: "Design and product", hardware: "Drones, robots and hardware",
  gaming: "Gaming", government: "Government and policy", education: "Education and skills",
};

export const FORMAT_LABELS: Record<EventFormat, string> = { in_person: "In person", online: "Online", hybrid: "In person + online" };

export const REGIONS = ["West Africa", "East Africa", "Southern Africa", "North Africa", "Central Africa"];

/** Countries shown first in the country picker (owner, 25 Nov 2026: Ghana, Nigeria, Kenya, SA). */
export const MAIN_COUNTRIES = ["GH", "NG", "KE", "ZA"];

export const SOURCE_LABELS: Record<string, { name: string; url: string }> = {
  labari: { name: "Labari Data", url: "https://app.labaridata.com/events" },
  devevents: { name: "dev.events", url: "https://dev.events/AF" },
  luma: { name: "Luma", url: "https://luma.com" },
  gdg: { name: "Google Developer Groups", url: "https://gdg.community.dev" },
  manual: { name: "TechTrendi", url: "https://techtrendi.com" },
};

/** Share picture for /tech-events and every event page. Design: docs/og-designs/og-tech-events.html
 *  (render at 1200x630, JPEG, keep under ~300 KB for WhatsApp). */
export const TECH_EVENTS_OG = "/og-tech-events.jpg";
export const TECH_EVENTS_OG_ALT = "Tech Events in Africa: conferences, meetups, hackathons and classes in Ghana, Nigeria, Kenya, South Africa and more. Updated every 6 hours. TechTrendi.";

/** The calendars named in "Where these events come from" (owner, 26 Nov 2026: dev.events and Luma only). */
export const SHOWN_SOURCES = ["devevents", "luma"] as const;

/** Sources never named on the pages (owner, 26 Nov 2026: no "Labari Data" text). */
export const UNNAMED_SOURCES = new Set(["labari"]);

/** The listing's name for "See it on …", or null when it is not named. */
export const sourceName = (e: TechEvent) => (UNNAMED_SOURCES.has(e.source) ? null : SOURCE_LABELS[e.source]?.name || null);

/** 🇬🇭 from "GH" (regional indicator letters). */
export const flag = (cc: string) => /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "";

export const place = (e: TechEvent) => (e.format === "online" ? "Online" : [e.city, e.country].filter(Boolean).join(", "));

/** One plain sentence about the event when the source gave no description. */
export function plainSummary(e: TechEvent) {
  if (e.summary) return e.summary;
  const kind = (KIND_LABELS[e.kind] || "event").toLowerCase();
  const topic = e.topics.length ? ` about ${e.topics.slice(0, 2).map((t) => (TOPIC_LABELS[t] || t).toLowerCase()).join(" and ")}` : "";
  const where = e.format === "online" ? "online" : `in ${place(e)}`;
  return `${e.title} is a tech ${kind}${topic}, ${where}, on ${dateRange(e)}.`;
}

/** The best "find out more" link: the organiser's own site, else the listing we found it on. */
export const officialUrl = (e: TechEvent) => e.event_url || e.source_url || null;

// ---------------- add to calendar ----------------
const icsDate = (iso: string) => iso.replace(/-/g, "");
const icsStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

export function googleCalendarUrl(e: TechEvent) {
  const dates = e.start_time
    ? `${icsStamp(e.start_time)}/${icsStamp(e.end_time || e.start_time)}`
    : `${icsDate(e.starts_on)}/${icsDate(addDays(e.ends_on, 1))}`;
  const q = new URLSearchParams({
    action: "TEMPLATE", text: e.title, dates,
    details: `${plainSummary(e)}\n\nMore: ${officialUrl(e) || TECH_EVENTS_URL}\nFound on TechTrendi: ${TECH_EVENTS_URL}/${e.slug}`,
    location: e.format === "online" ? "Online" : [e.venue, e.city, e.country].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/** A .ics file (Apple Calendar, Outlook, Samsung...). */
export function icsFile(e: TechEvent) {
  const when = e.start_time
    ? [`DTSTART:${icsStamp(e.start_time)}`, `DTEND:${icsStamp(e.end_time || e.start_time)}`]
    : [`DTSTART;VALUE=DATE:${icsDate(e.starts_on)}`, `DTEND;VALUE=DATE:${icsDate(addDays(e.ends_on, 1))}`];
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TechTrendi//Tech Events//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${e.slug}@techtrendi.com`, `DTSTAMP:${icsStamp(new Date().toISOString())}`, ...when,
    `SUMMARY:${icsText(e.title)}`,
    `DESCRIPTION:${icsText(`${plainSummary(e)}\n\nMore: ${officialUrl(e) || TECH_EVENTS_URL}`)}`,
    `LOCATION:${icsText(e.format === "online" ? "Online" : [e.venue, e.city, e.country].filter(Boolean).join(", "))}`,
    ...(officialUrl(e) ? [`URL:${officialUrl(e)}`] : []),
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

export function downloadIcs(e: TechEvent) {
  const blob = new Blob([icsFile(e)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${e.slug}.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

export const mapUrl = (e: TechEvent) =>
  e.format === "online" ? null : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([e.venue, e.city, e.country].filter(Boolean).join(", "))}`;

/** schema.org Event for an event's own page (Google event results). */
export function eventJsonLd(e: TechEvent) {
  const attendance = { in_person: "OfflineEventAttendanceMode", online: "OnlineEventAttendanceMode", hybrid: "MixedEventAttendanceMode" }[e.format];
  const physical = { "@type": "Place", name: e.venue || [e.city, e.country].filter(Boolean).join(", "),
    address: { "@type": "PostalAddress", ...(e.city ? { addressLocality: e.city } : {}), addressCountry: e.country_code } };
  const virtual = { "@type": "VirtualLocation", url: officialUrl(e) || `${TECH_EVENTS_URL}/${e.slug}` };
  return {
    "@context": "https://schema.org", "@type": "Event", name: e.title, description: plainSummary(e),
    startDate: e.start_time || e.starts_on, endDate: e.end_time || e.ends_on,
    eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: `https://schema.org/${attendance}`,
    location: e.format === "online" ? virtual : e.format === "hybrid" ? [physical, virtual] : physical,
    ...(officialUrl(e) ? { url: officialUrl(e) } : {}),
    ...(e.host ? { organizer: { "@type": "Organization", name: e.host } } : {}),
    ...(e.is_free === true ? { isAccessibleForFree: true } : {}),
  };
}

/** JSON for a <script type="application/ld+json">, safe inside HTML. */
export const ldJson = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");
