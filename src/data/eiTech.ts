// Ei Tech! — TechTrendi's funny tech memes (/ei-tech), started 11 Nov 2026.
//
// The memes live in the database (techtrendi.ei_tech_memes). Edmund adds them from
// Telegram: he sends the picture to @technews_highlight_bot, the meme desk
// (/opt/tech-news/meme_desk.py) writes the title, line and vote, adds the Ei Tech!
// bar, and he taps Publish. Nothing in this repo changes when a meme is added.
//
//   - The build bakes the published list into eiTechMemes.json
//     (scripts/fetch-ei-tech.mjs): those memes are prerendered, each with its own
//     page /ei-tech/<slug> and share card.
//   - In the browser the pages re-read the table (useEiTechMemes), so a meme
//     published after the last build shows straight away. Until the next build
//     (daily, 11:30 UTC) it has no page of its own, so its link is
//     /ei-tech?m=<slug> (the list, scrolled to it) — see eiTechSharePath.
//
// Keep it light: a short title and one funny line. We don't explain jokes or tell
// people what they mean (Edmund, 11 Nov 2026). `alt` only describes the picture.
// Laughs and votes are stored by slug (ei_tech_reactions), so never rename a slug
// or swap a meme's vote sides after people have voted.
//
// `date` is a plain string, so nothing here depends on the visitor's clock
// (the pages are prerendered — see Security.tsx timeAgo for why that matters).

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import baked from "./eiTechMemes.json";

export interface EiTechVoteSide {
  emoji: string;
  label: string;
}

export interface EiTechMeme {
  slug: string;
  title: string;
  /** Publish day, "YYYY-MM-DD" (UTC). */
  date: string;
  /** One short funny line under the title, in the joke's own voice. */
  caption: string;
  /** What the picture shows (not what it means), for blind readers and Google. */
  alt: string;
  width: number;
  height: number;
  jpg: string;
  webp: string;
  share: string;
  /** Optional two-sided vote; memes without one still get the 😂 button. */
  vote?: { a: EiTechVoteSide; b: EiTechVoteSide };
}

interface EiTechRow {
  slug: string; title: string; caption: string; alt: string; width: number; height: number;
  image_jpg: string; image_webp: string; share_image: string;
  vote_a_emoji: string | null; vote_a_label: string | null; vote_b_emoji: string | null; vote_b_label: string | null;
  published_at: string;
}

const COLS = "slug,title,caption,alt,width,height,image_jpg,image_webp,share_image,vote_a_emoji,vote_a_label,vote_b_emoji,vote_b_label,published_at";

function toMeme(r: EiTechRow): EiTechMeme {
  return {
    slug: r.slug, title: r.title, caption: r.caption, alt: r.alt, width: r.width, height: r.height,
    date: (r.published_at || "").slice(0, 10),
    jpg: r.image_jpg, webp: r.image_webp, share: r.share_image,
    vote: r.vote_a_label && r.vote_b_label
      ? { a: { emoji: r.vote_a_emoji || "", label: r.vote_a_label }, b: { emoji: r.vote_b_emoji || "", label: r.vote_b_label } }
      : undefined,
  };
}

/** Published memes as of the last build, newest first. */
export const EI_TECH_MEMES: EiTechMeme[] = (baked as EiTechRow[]).map(toMeme);
const BAKED_SLUGS = new Set(EI_TECH_MEMES.map((m) => m.slug));

/** The meme's own page once the build has made it, else the list scrolled to it. */
export const eiTechSharePath = (m: EiTechMeme) => (BAKED_SLUGS.has(m.slug) ? `/ei-tech/${m.slug}` : `/ei-tech?m=${m.slug}`);

/** Every published meme, newest first: the baked list at first (matches the
 *  prerendered page), then the live list from the database after mount. */
export function useEiTechMemes(): EiTechMeme[] {
  return useEiTechMemesLive()[0];
}

/** Same, plus whether the live list has answered yet (true also when it failed). */
export function useEiTechMemesLive(): [EiTechMeme[], boolean] {
  const [memes, setMemes] = useState<EiTechMeme[]>(EI_TECH_MEMES);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let alive = true;
    (supabase as any).from("ei_tech_memes").select(COLS).eq("status", "published")
      .order("published_at", { ascending: false }).limit(200)
      .then(({ data }: { data: EiTechRow[] | null }) => {
        if (!alive) return;
        if (Array.isArray(data) && data.length) setMemes(data.map(toMeme));
        setDone(true);
      }, () => { if (alive) setDone(true); });
    return () => { alive = false; };
  }, []);
  return [memes, done];
}

export const eiTechImage = (m: EiTechMeme) => m.jpg;
export const eiTechWebp = (m: EiTechMeme) => m.webp;
export const eiTechShareImage = (m: EiTechMeme) => m.share;

/** "11 Nov 2026" — fixed format, same on the server and in every browser. */
export function eiTechDate(date: string) {
  const [y, mo, d] = date.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return y && mo && d ? `${d} ${months[mo - 1]} ${y}` : "";
}
