// Paid sponsors (direct ads, not AdSense). Each one gets:
//  - a full landing page at /sponsored/<slug> (prerendered, noindex, kept out of the sitemap),
//  - a "Sponsored" card on the pages listed in `showOn` (exact paths).
// To add an advertiser, add an entry here. To stop one, set `active: false`
// (or remove it, and nginx 301 its page if it was shared widely).
//
// Google rules for an AdSense site: always label as Sponsored, mark outside links
// rel="sponsored", and never promote getting around security protections
// (e.g. iCloud / Activation Lock removal) or use other companies' logos.
// Don't invent prices, timings or guarantees the advertiser hasn't given.

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

export interface Sponsor {
  slug: string;
  active: boolean;
  name: string;
  tagline: string;
  /** One line for the Sponsored card. */
  cardText: string;
  /** Big headline at the top of the landing page. */
  headline: string;
  /** Short paragraph under the headline. */
  intro: string;
  /** Hero picture in public/sponsored/ (no third-party logos). */
  heroImage: string;
  heroImageAlt: string;
  /** Short chips under the intro. */
  highlights: string[];
  /** Optional "who is this for" panel. */
  audience?: { title: string; text: string };
  services: SponsorService[];
  steps: SponsorStep[];
  reasons: SponsorStep[];
  faqs: SponsorFaq[];
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
    headline: "Unlock your phone. Use any network.",
    intro:
      "Stuck with a phone that only works on one network? CyclopX Unlox removes the network lock from your own phone, so it accepts the SIM card you choose. Any brand, any model, done with professional unlocking tools.",
    heroImage: "/sponsored/cyclopx-unlox-hero.jpg",
    heroImageAlt: "CyclopX Unlox — Unlock Your World. Phone, iPhone, Android and carrier unlock solutions.",
    highlights: ["Any brand, any model", "All major networks", "Professional unlocking tools", "Fast, secure, reliable"],
    audience: {
      title: "Got a phone from abroad?",
      text: "Many phones bought or sent from the US are locked to one American network, so a Ghana SIM won't work in them. Once the phone is unlocked, you can use your MTN, Telecel or AT SIM like any other phone.",
    },
    services: [
      {
        title: "All phone unlocks",
        detail: "Any brand, any model",
        description: "Whatever phone you have, if it's locked to one network, CyclopX Unlox can unlock it so it works with SIM cards from other networks.",
      },
      {
        title: "iPhone network unlock",
        detail: "Use your iPhone on the network you choose",
        description: "iPhone stuck on one carrier? The network (carrier) lock is removed, so your iPhone accepts SIM cards from any network.",
      },
      {
        title: "Android unlocks",
        detail: "Samsung, Google, LG, Motorola and more",
        description: "Carrier-locked Samsung Galaxy, Google Pixel, LG, Motorola and other Android phones unlocked to work on other networks.",
      },
      {
        title: "Carrier unlock",
        detail: "AT&T, T-Mobile, Verizon, Xfinity, Boost, MetroPCS and all networks",
        description: "Phones locked to AT&T, T-Mobile, Verizon, Xfinity, Boost, MetroPCS, Cricket and other networks, unlocked so you can use them anywhere — including here in Ghana.",
      },
    ],
    steps: [
      { title: "Message on WhatsApp", detail: "Send your phone's brand and model, and the network it's locked to." },
      { title: "Get your quote", detail: "You'll be told the price and how long it takes for your phone." },
      { title: "Use any network", detail: "Once it's unlocked, put in the SIM card you want and you're connected." },
    ],
    reasons: [
      { title: "Professional tools", detail: "Unlocks are done with paid, professional unlocking services." },
      { title: "Any brand, any model", detail: "iPhone, Samsung, Google, LG, Motorola and more." },
      { title: "Fast, secure, reliable", detail: "A professional service from start to finish." },
      { title: "A real person to talk to", detail: "Ask your questions on WhatsApp before you pay anything." },
    ],
    faqs: [
      {
        q: "What does unlocking a phone mean?",
        a: "A locked phone only works with SIM cards from the network that sold it. Unlocking removes that limit, so your phone accepts a SIM card from any network.",
      },
      {
        q: "Will an unlocked phone from the US work in Ghana?",
        a: "Yes. Once it's unlocked it can use MTN, Telecel or AT SIM cards. Most modern phones support Ghana's networks — if you're unsure about your model, ask on WhatsApp.",
      },
      {
        q: "How much does it cost and how long does it take?",
        a: "It depends on your phone model and the network it's locked to. Send those details on WhatsApp and you'll get a quote.",
      },
      {
        q: "What details do I need to send?",
        a: "Your phone's brand and model, the network it's locked to, and its IMEI number. To see the IMEI, dial *#06# on the phone.",
      },
      {
        q: "Can any phone be unlocked?",
        a: "This service is only for phones that you own. Lost or stolen phones are not unlocked.",
      },
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
