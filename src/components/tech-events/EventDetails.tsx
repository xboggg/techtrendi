// The facts and buttons for one event: used on its own page (/tech-events/:slug) and in the
// pop-up the list opens for an event found after the last build.
import { useState } from "react";
import { Building2, CalendarDays, Check, Clock, ExternalLink, Info, Link2, MapPin, Share2, Ticket, Users, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FORMAT_LABELS, KIND_LABELS, SOURCE_LABELS, TECH_EVENTS_URL, TOPIC_LABELS, type TechEvent, dateRange,
  mapUrl, officialUrl, place, plainSummary, timeRange, flag,
} from "@/data/techEvents";
import { AddToCalendar } from "./EventParts";

function Fact({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 font-semibold leading-snug text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function shareText(e: TechEvent) {
  return `${e.title}\n📅 ${dateRange(e)}\n📍 ${place(e)}\n\nFound on TechTrendi:`;
}

export function EventFacts({ e }: { e: TechEvent }) {
  const t = timeRange(e);
  const map = mapUrl(e);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Fact icon={CalendarDays} label="Date">{dateRange(e)}</Fact>
      {t && <Fact icon={Clock} label="Time">{t}</Fact>}
      <Fact icon={e.format === "online" ? Wifi : MapPin} label="Where">
        <span className="mr-1" aria-hidden="true">{flag(e.country_code)}</span>
        {e.venue ? `${e.venue}, ` : ""}{place(e)}
        {map && <a href={map} target="_blank" rel="noopener noreferrer" className="mt-0.5 block text-sm font-medium text-primary hover:underline">Open in Google Maps</a>}
      </Fact>
      <Fact icon={Info} label="Type">{KIND_LABELS[e.kind] || "Event"} · {FORMAT_LABELS[e.format]}</Fact>
      {e.host && <Fact icon={Building2} label="Organised by">{e.host}</Fact>}
      {(e.is_free !== null || e.sold_out) && (
        <Fact icon={Ticket} label="Entry">{e.sold_out ? "Sold out" : e.is_free ? "Free (you may still need to register)" : "Paid ticket"}</Fact>
      )}
      {typeof e.going === "number" && e.going > 0 && <Fact icon={Users} label="People going">{e.going.toLocaleString("en-GB")}</Fact>}
    </div>
  );
}

export function EventActions({ e, pageUrl }: { e: TechEvent; pageUrl: string }) {
  const [copied, setCopied] = useState(false);
  const url = officialUrl(e);
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: e.title, text: shareText(e), url: pageUrl }); return; }
    } catch (err) { if ((err as Error)?.name === "AbortError") return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText(e)} ${pageUrl}`)}`, "_blank", "noopener,noreferrer");
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(pageUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer nofollow"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110 sm:col-span-2">
          {e.event_url ? "Go to the event website" : `See it on ${SOURCE_LABELS[e.source]?.name || "the listing"}`} <ExternalLink className="h-4 w-4" />
        </a>
      )}
      <AddToCalendar e={e} />
      <button onClick={share} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-semibold text-white transition hover:brightness-105">
        <Share2 className="h-5 w-5" /> Share with friends
      </button>
      <button onClick={copy} className={cn("inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted sm:col-span-2", copied && "border-green-600 text-green-700 dark:text-green-400")}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}

export function EventAbout({ e }: { e: TechEvent }) {
  const src = SOURCE_LABELS[e.source];
  return (
    <div className="space-y-4">
      <p className="whitespace-pre-line text-base leading-relaxed text-foreground/90">{plainSummary(e)}</p>
      {e.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {e.topics.map((t) => <span key={t} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">{TOPIC_LABELS[t] || t}</span>)}
        </div>
      )}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
        <strong>Check before you go.</strong> Dates and places can change. Please confirm on the organiser's website before you pay or travel.
      </div>
      <p className="text-xs text-muted-foreground">
        Listed by{" "}
        {e.source_url ? <a href={e.source_url} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-foreground">{src?.name || e.source}</a> : src?.name || e.source}
        {" "}and checked by TechTrendi's event tracker. Know something is wrong? <a href="/contact" className="underline hover:text-foreground">Tell us</a>.
      </p>
    </div>
  );
}

export const pageUrlFor = (e: TechEvent, own: boolean) => (own ? `${TECH_EVENTS_URL}/${e.slug}` : `${TECH_EVENTS_URL}?e=${e.slug}`);
