// Short links (techtrendi.com/s/<code>). All work happens in database functions
// (supabase/migrations/20261128_short_links.sql); visitors never touch the tables.
import { supabase } from "@/integrations/supabase/client";

export const SHORT_BASE = "https://techtrendi.com/s/";
const STORE_KEY = "techtrendi_short_links_v1";

export type CreateError =
  | "invalid" | "hidden_user" | "bad_host" | "shortener"
  | "alias_bad" | "alias_blocked" | "alias_taken" | "too_many" | "busy" | "network";

export const CREATE_ERRORS: Record<CreateError, string> = {
  invalid: "That doesn't look like a web address. It should start with https:// (for example https://example.com).",
  hidden_user: "This address hides its real site name behind an @ sign, a trick scammers use. We can't shorten it.",
  bad_host: "Please use a normal website address with a name (like example.com), not a number address or a home network.",
  shortener: "This is already a short link. Paste the full address it opens instead, so people can see where it really goes.",
  alias_bad: "The custom name can use small letters, numbers and dashes, 3 to 30 characters, for example my-shop.",
  alias_blocked: "That name could be mistaken for a bank, MoMo, a government office or a big company. Please pick another one.",
  alias_taken: "Someone already uses that name. Please try another one.",
  too_many: "You have made a lot of links in a short time. Please wait an hour and try again.",
  busy: "Too many links are being made right now. Please try again in a few minutes.",
  network: "We couldn't reach TechTrendi. Check your internet and try again.",
};

export type SavedLink = { code: string; token: string; url: string; created_at: string };
export type LinkStats = {
  code: string; url: string; host: string; status: string;
  clicks: number; last_click_at: string | null; created_at: string;
};
export type PublicLink =
  | { status: "active"; url: string; host: string; created_at: string }
  | { status: "paused"; host: string }
  | { status: "missing" | "gone" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- these functions are not in the generated types
const rpc = (fn: string, args: Record<string, unknown>) => (supabase as any).rpc(fn, args);

/** Turns what a person typed into a full https address, or null if it can't be one. */
export function normaliseUrl(input: string): string | null {
  let s = input.trim();
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.href;
  } catch {
    return null;
  }
}

export async function createShortLink(url: string, alias: string):
  Promise<{ ok: true; link: SavedLink } | { ok: false; error: CreateError }> {
  const { data, error } = await rpc("create_short_link", { p_url: url, p_alias: alias || null });
  if (error || !data) return { ok: false, error: "network" };
  if (data.error) return { ok: false, error: (data.error in CREATE_ERRORS ? data.error : "invalid") as CreateError };
  const link: SavedLink = { code: data.code, token: data.token, url: data.url, created_at: new Date().toISOString() };
  saveLinks([link, ...loadLinks().filter((l) => l.code !== link.code)]);
  return { ok: true, link };
}

export async function getShortLink(code: string): Promise<PublicLink | null> {
  const { data, error } = await rpc("get_short_link", { p_code: code });
  if (error || !data) return null;
  return data as PublicLink;
}

/** Counts the click and returns the address to open (null if the link was paused or removed). */
export async function followShortLink(code: string): Promise<string | null> {
  const { data, error } = await rpc("follow_short_link", { p_code: code });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function reportShortLink(code: string, reason: string): Promise<boolean> {
  try {
    const { data, error } = await rpc("report_short_link", { p_code: code, p_reason: reason });
    return !error && (data === "thanks" || data === "missing");
  } catch {
    return false;
  }
}

// The database answers for at most 200 links per call, so ask in batches.
const STATS_BATCH = 150;

export async function linkStats(links: SavedLink[]): Promise<LinkStats[] | null> {
  const out: LinkStats[] = [];
  for (let i = 0; i < links.length; i += STATS_BATCH) {
    const batch = links.slice(i, i + STATS_BATCH);
    const { data, error } = await rpc("short_link_stats", {
      p_items: batch.map(({ code, token }) => ({ code, token })),
    });
    if (error || !Array.isArray(data)) return null;
    out.push(...(data as LinkStats[]));
  }
  return out;
}

export async function deleteShortLink(link: SavedLink): Promise<boolean> {
  const { data, error } = await rpc("delete_short_link", { p_code: link.code, p_token: link.token });
  if (error) return false;
  saveLinks(loadLinks().filter((l) => l.code !== link.code));
  return data === true;
}

export function loadLinks(): SavedLink[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return Array.isArray(raw)
      ? raw.filter((l) => l && typeof l.code === "string" && typeof l.token === "string")
      : [];
  } catch {
    return [];
  }
}

export function forgetLink(code: string) {
  saveLinks(loadLinks().filter((l) => l.code !== code));
}

function saveLinks(links: SavedLink[]) {
  try {
    // Keep every link: dropping one would lose its private key, and with it the only way
    // to see its clicks or remove it. (A visitor can make at most 30 links a day.)
    localStorage.setItem(STORE_KEY, JSON.stringify(links));
  } catch {
    // storage blocked (private window): the link still works, only the list is not kept
  }
}
