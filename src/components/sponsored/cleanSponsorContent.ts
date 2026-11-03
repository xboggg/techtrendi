import type { SponsorContent } from "@/data/sponsors";

// Before saving: trim every text and drop empty highlights/list rows, so the
// landing page never shows blank boxes. An empty "who it's for" box is removed.
export function cleanSponsorContent(c: SponsorContent): SponsorContent {
  const t = (s: unknown) => (typeof s === "string" ? s.trim() : "");
  const rows = <T extends Record<string, string>>(list: T[] | undefined, keys: (keyof T)[]) =>
    (list || [])
      .map((r) => Object.fromEntries(keys.map((k) => [k, t(r[k])])) as T)
      .filter((r) => keys.some((k) => r[k]));
  const out: SponsorContent = {
    ...c,
    name: t(c.name), tagline: t(c.tagline), cardText: t(c.cardText), headline: t(c.headline), intro: t(c.intro),
    heroImageAlt: t(c.heroImageAlt), phone: t(c.phone).replace(/\D/g, ""), phoneDisplay: t(c.phoneDisplay),
    whatsappMessage: t(c.whatsappMessage), socialHandle: t(c.socialHandle), socialNetworks: t(c.socialNetworks),
    highlights: (c.highlights || []).map(t).filter(Boolean),
    services: rows(c.services, ["title", "detail", "description"]),
    steps: rows(c.steps, ["title", "detail"]),
    reasons: rows(c.reasons, ["title", "detail"]),
    faqs: rows(c.faqs, ["q", "a"]),
    promise: { title: t(c.promise?.title), detail: t(c.promise?.detail) },
    ctaTitle: t(c.ctaTitle), ctaText: t(c.ctaText),
  };
  if (c.audience && (t(c.audience.title) || t(c.audience.text))) out.audience = { title: t(c.audience.title), text: t(c.audience.text) };
  else delete out.audience;
  return out;
}
