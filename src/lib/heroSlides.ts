// Homepage hero pictures (owner, 31 Oct 2026). Managed in /admin/hero-images and
// stored in techtrendi.hero_slides. The build bakes the current list into
// src/data/heroSlides.json (scripts/fetch-hero-slides.mjs) so the first paint
// already shows the right pictures; the homepage then re-reads the table so an
// admin change shows straight away, before the next build.

export interface HeroSlide {
  image_url: string;
  phone_image_url: string | null;
  alt: string;
  focus_x: number;
  focus_y: number;
}

export const HERO_SELECT = "image_url,phone_image_url,alt,focus_x,focus_y";

// Used only if the table and the baked file are both empty, so the hero can never go blank.
export const FALLBACK_HERO_SLIDES: HeroSlide[] = [
  { image_url: "/images/hero/hero-ghana-v2.jpg", phone_image_url: null, alt: "Woman using her phone on a busy Accra street", focus_x: 75, focus_y: 50 },
  { image_url: "/images/hero/hero-ghana-dev2.jpg", phone_image_url: null, alt: "Man working on a laptop in a tech co-working space", focus_x: 75, focus_y: 50 },
];

const clampPct = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 50;
};

// Keeps only rows a hero can show: a site path or https URL, nothing that could break the CSS url().
export function cleanHeroSlides(rows: unknown): HeroSlide[] {
  if (!Array.isArray(rows)) return [];
  const okUrl = (u: unknown): u is string => typeof u === "string" && /^(\/|https:\/\/)[^\s"'()\\]+$/.test(u);
  return rows
    .filter((r) => r && okUrl((r as HeroSlide).image_url))
    .map((r) => {
      const s = r as HeroSlide;
      return {
        image_url: s.image_url,
        phone_image_url: okUrl(s.phone_image_url) ? s.phone_image_url : null,
        alt: typeof s.alt === "string" ? s.alt : "",
        focus_x: clampPct(s.focus_x),
        focus_y: clampPct(s.focus_y),
      };
    });
}

export const sameHeroSlides = (a: HeroSlide[], b: HeroSlide[]) => JSON.stringify(a) === JSON.stringify(b);
