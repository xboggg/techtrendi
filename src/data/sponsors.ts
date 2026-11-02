// Paid sponsors (direct ads, not AdSense). Each one gets:
//  - a full page at /sponsored/<slug> (prerendered, noindex, kept out of the sitemap),
//  - a "Sponsored" card on the pages listed in `showOn` (exact paths).
// To add an advertiser, add an entry here. To stop one, set `active: false`
// (or remove it, and nginx 301 its page if it was shared widely).
//
// Google rules for an AdSense site: always label as Sponsored, mark outside links
// rel="sponsored", and never promote getting around security protections
// (e.g. iCloud / Activation Lock removal) or use other companies' logos.

export interface SponsorService {
  title: string;
  detail: string;
}

export interface Sponsor {
  slug: string;
  active: boolean;
  name: string;
  tagline: string;
  /** One line for the Sponsored card. */
  cardText: string;
  /** Short paragraph at the top of the full page. */
  intro: string;
  services: SponsorService[];
  promise: { title: string; detail: string };
  /** Digits only, with country code, for wa.me and tel: links. */
  phone: string;
  /** How the number is shown to readers. */
  phoneDisplay: string;
  whatsappMessage: string;
  socialHandle?: string;
  socialNetworks?: string;
  /** Pages (exact paths) that show this sponsor's card. "/" = homepage. */
  showOn: string[];
}

export const SPONSORS: Sponsor[] = [
  {
    slug: "cyclopx-unlox",
    active: true,
    name: "CyclopX Unlox",
    tagline: "Unlock Your World",
    cardText: "Phone and carrier unlocking for your own phone. Any brand, any network.",
    intro:
      "Locked to one network? CyclopX Unlox unlocks your own phone so it works with the network you choose. Any brand, any model, handled by a professional.",
    services: [
      { title: "All phone unlocks", detail: "Any brand, any model" },
      { title: "iPhone network unlock", detail: "Use your iPhone on the network you choose" },
      { title: "Android unlocks", detail: "Samsung, Google, LG, Motorola and more" },
      { title: "Carrier unlock", detail: "AT&T, T-Mobile, Verizon, Xfinity, Boost, MetroPCS and all networks" },
    ],
    promise: { title: "Fast, secure, reliable", detail: "Professional service" },
    phone: "233546616401",
    phoneDisplay: "+233 546 616 401",
    whatsappMessage: "Hi CyclopX Unlox, I saw your ad on TechTrendi. I'd like to unlock my phone.",
    socialHandle: "@CyclopXunlox",
    socialNetworks: "TikTok, Instagram and Facebook",
    showOn: ["/", "/phones", "/tools/phone-comparison", "/tools/upgrade-calculator"],
  },
];

export const sponsorPath = (s: Sponsor) => `/sponsored/${s.slug}`;

export const getSponsorBySlug = (slug: string) => SPONSORS.find((s) => s.slug === slug && s.active);

export const getSponsorsForPage = (pathname: string) =>
  SPONSORS.filter((s) => s.active && s.showOn.includes(pathname));
