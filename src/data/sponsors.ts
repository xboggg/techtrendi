// Paid sponsors (direct ads, not AdSense). The ads live in the database table
// techtrendi.sponsors (supabase/migrations/20261102_sponsors.sql), edited at
// /admin/sponsors (admins) and /my-ad (each ad's owner, wording only).
// scripts/fetch-sponsors.mjs bakes the active ones into sponsors.json at build time:
//  - one prerendered landing page per ad at /sponsored/<slug> (noindex, not in the sitemap),
//  - a "Sponsored" card on the pages listed in show_on (exact paths).
// The landing page re-reads its row in the browser, so wording edits show at once.
//
// Google rules for an AdSense site: always label as Sponsored, mark outside links
// rel="sponsored", and never promote getting around security protections
// (iCloud / Activation Lock removal, bypass, FRP, hacking, IMEI change, removing
// passwords) or use other companies' logos.
// The database refuses those words for everyone; BANNED below mirrors it for a
// friendly message before saving. Don't invent prices, timings or guarantees.
import baked from "./sponsors.json";
import { supabase } from "@/integrations/supabase/client";
import { isBotTraffic } from "@/lib/isBotTraffic";

export interface SponsorService {
  title: string;
  detail: string;
  /** Longer description shown on the landing page. */
  description: string;
}

export interface SponsorStep {
  title: string;
  detail: string;
}

export interface SponsorFaq {
  q: string;
  a: string;
}

/** Everything the owner may edit (the `content` column). */
export interface SponsorContent {
  name: string;
  tagline: string;
  /** One line for the Sponsored card. */
  cardText: string;
  /** Big headline at the top of the landing page. */
  headline: string;
  /** Short paragraph under the headline. */
  intro: string;
  /** Live hero picture (only an admin can change it). */
  heroImage: string;
  heroImageAlt: string;
  /** Picture the owner uploaded, waiting for an admin to approve it. */
  pendingHeroImage?: string;
  /** WhatsApp/Facebook share picture; defaults to heroImage. */
  shareImage?: string;
  /** Short chips under the intro. */
  highlights: string[];
  /** Optional "who is this for" panel. */
  audience?: { title: string; text: string };
  services: SponsorService[];
  steps: SponsorStep[];
  reasons: SponsorStep[];
  faqs: SponsorFaq[];
  promise: { title: string; detail: string };
  /** Closing box heading and line (defaults are neutral). */
  ctaTitle?: string;
  ctaText?: string;
  /** Digits only, with country code, for wa.me and tel: links. */
  phone: string;
  /** How the number is shown to readers. */
  phoneDisplay: string;
  whatsappMessage: string;
  socialHandle?: string;
  socialNetworks?: string;
}

export interface Sponsor extends SponsorContent {
  slug: string;
  active: boolean;
  /** Pages (exact paths) that show this sponsor's card. "/" = homepage. */
  showOn: string[];
}

/** A row of techtrendi.sponsors as the site reads it. */
export interface SponsorRow {
  id?: string;
  slug: string;
  active: boolean;
  show_on: string[];
  content: SponsorContent;
  owner_email?: string | null;
  sort_order?: number;
  updated_at?: string;
}

/** Pages a card can be placed on (admin picks from these). */
export const SPONSOR_PAGES: { path: string; label: string }[] = [
  { path: "/", label: "Homepage" },
  { path: "/phones", label: "Phones section" },
  { path: "/tools/phone-comparison", label: "Phone Comparison tool" },
  { path: "/tools/upgrade-calculator", label: "Should I Upgrade? tool" },
  { path: "/tools", label: "Tools page" },
  { path: "/blog", label: "Blog page" },
  { path: "/news", label: "News page" },
  { path: "/security", label: "Security section" },
  { path: "/data-bundles/ghana", label: "Data bundles (Ghana)" },
];

/** Same words the database refuses (techtrendi.sponsor_banned_words, latest:
 *  supabase/migrations/20261103_sponsor_banned_words_more.sql). "Cracked screen",
 *  "check your IMEI" and "network unlock" stay allowed. */
const BANNED = /\bi[ -]?cloud|activation[ -]*lock|\bby[ -]?pass|\bfrp\b|\bmdm[ -]*remov|find[ -]*my[ -]*(iphone|device)[ -]*(off|remov)|\bhack|\bcrack(s|ing|er|ers)?\b|jail[ -]?break|black[ -]?list[a-z]*[ -]*(remov|clean|clear)|(remov|clean|clear)[a-z]*[ -]+(the[ -]+|your[ -]+)?black[ -]?list|\bimei[ -]*(chang|repair|edit|rewrit)|(chang|repair|edit|rewrit)[a-z]*[ -]+(the[ -]+|your[ -]+|an[ -]+)?imei|(remov|reset|bypass|unlock)[a-z]*[ -]+(the[ -]+|your[ -]+|a[ -]+)?(forgotten[ -]+)?(password|passcode|screen[ -]?lock|pattern[ -]?lock|pin[ -]?lock)|(password|passcode|screen[ -]?lock|pattern[ -]?lock)[ -]*remov/i;

/** Returns the first banned phrase found in the content, or null. */
export function findBannedWords(content: unknown): string | null {
  const m = JSON.stringify(content ?? {}).match(BANNED);
  return m ? m[0] : null;
}

export function rowToSponsor(row: SponsorRow): Sponsor {
  return { ...row.content, slug: row.slug, active: row.active, showOn: row.show_on ?? [] };
}

export const SPONSORS: Sponsor[] = (baked as unknown as SponsorRow[]).map(rowToSponsor);

export const sponsorPath = (s: { slug: string }) => `/sponsored/${s.slug}`;

export const getSponsorBySlug = (slug: string) => SPONSORS.find((s) => s.slug === slug && s.active);

export const getSponsorsForPage = (pathname: string) =>
  SPONSORS.filter((s) => s.active && s.showOn.includes(pathname));

/** Live copy of one active ad (browser only). undefined = could not check; null = not active. */
export async function fetchLiveSponsor(slug: string): Promise<Sponsor | null | undefined> {
  const { data, error } = await supabase
    .from("sponsors" as never)
    .select("slug, active, show_on, content")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) return undefined;
  const row = data as unknown as SponsorRow | null;
  if (!row || !row.content || typeof row.content.name !== "string") return null;
  return rowToSponsor(row);
}

// ---- Tap counts for /admin/sponsors (techtrendi.sponsor_clicks,
// supabase/migrations/20261103_sponsor_clicks.sql). Bots are skipped; the database
// skips admins and the same tap twice within 5 seconds. Never throws.
export type SponsorClickKind = "card" | "whatsapp" | "call";
const CARD_TAP_KEY = "tt-sponsor-card-tap";

export function recordSponsorClick(slug: string, kind: SponsorClickKind, page: string) {
  if (isBotTraffic()) return;
  let sid: string | null = null;
  try { sid = sessionStorage.getItem("tt_sid"); } catch { /* storage blocked */ }
  const device = window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
  supabase
    .rpc("track_sponsor_click" as never, { p: { slug, kind, page_path: page, session_id: sid, device_type: device } } as never)
    .then(() => {}, () => {});
}

/** The card opens the ad page with a full page load, which would cancel a request
 *  sent on tap, so the tap is noted here and the ad page records it (takeCardTap). */
export function noteCardTap(slug: string, page: string) {
  try { sessionStorage.setItem(CARD_TAP_KEY, JSON.stringify({ slug, page, at: Date.now() })); } catch { /* storage blocked */ }
}

/** The page the card was tapped on, if this ad page was opened by a card tap in the last minute. */
export function takeCardTap(slug: string): string | null {
  try {
    const raw = sessionStorage.getItem(CARD_TAP_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(CARD_TAP_KEY);
    const tap = JSON.parse(raw) as { slug?: string; page?: string; at?: number };
    return tap.slug === slug && typeof tap.page === "string" && Date.now() - (tap.at ?? 0) < 60_000 ? tap.page : null;
  } catch {
    return null;
  }
}

export interface SponsorStat {
  slug: string;
  period: "today" | "7d" | "30d" | "all";
  visits: number;
  visitors: number;
  card: number;
  whatsapp: number;
  call: number;
}

/** Visits + taps per ad (admins only). null = could not load. */
export async function fetchSponsorStats(): Promise<SponsorStat[] | null> {
  const { data, error } = await supabase.rpc("sponsor_stats" as never);
  if (error) return null;
  return ((data as unknown as SponsorStat[]) || []).map((r) => ({
    ...r, visits: Number(r.visits), visitors: Number(r.visitors), card: Number(r.card), whatsapp: Number(r.whatsapp), call: Number(r.call),
  }));
}

/** Blank wording for a new ad (admin "New ad"). */
export function emptySponsorContent(): SponsorContent {
  return {
    name: "", tagline: "", cardText: "", headline: "", intro: "",
    heroImage: "", heroImageAlt: "", highlights: [],
    services: [], steps: [], reasons: [], faqs: [],
    promise: { title: "", detail: "" },
    phone: "", phoneDisplay: "", whatsappMessage: "",
  };
}
