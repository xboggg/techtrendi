// MTN Ghana Fibre Broadband guide (/broadband/ghana/mtn-fibre), 25 Nov 2026.
// Every figure here comes from MTN's own pages (shop.mtn.com.gh product data, MTN help centre
// articles with their "last edited" date, MTN terms pages) or from 2+ reputable Ghana news
// outlets. When MTN changes a price: update PLANS, LAST_CHECKED and the share picture
// (public/og-mtn-fibre-ghana.jpg), then run `node --experimental-strip-types scripts/test-mtn-fibre.mts`.

export const LAST_CHECKED = "25 November 2026";
export const PAGE_PATH = "/broadband/ghana/mtn-fibre";

export type PeriodId = "30" | "90" | "180" | "365";
export const PERIODS: { id: PeriodId; label: string; short: string; months: number }[] = [
  { id: "30", label: "1 month", short: "1 mo", months: 1 },
  { id: "90", label: "3 months", short: "3 mo", months: 3 },
  { id: "180", label: "6 months", short: "6 mo", months: 6 },
  { id: "365", label: "1 year", short: "1 yr", months: 12 },
];

export interface FibrePlan {
  id: "starter" | "plus" | "elite";
  name: string; // MTN's own plan name
  mbps: number;
  prices: Record<PeriodId, number>; // GH¢, paid once for the whole period
  goodFor: string[]; // MTN's own "ideal for" list, in plain words
  colour: string; // tailwind gradient
}

// MTN help centre "MTN Fibre Offers and Plans" (last edited 24 Aug 2026) + MTN shop.
export const PLANS: FibrePlan[] = [
  {
    id: "starter",
    name: "Home Starter",
    mbps: 100,
    prices: { "30": 299, "90": 852, "180": 1668, "365": 3229 },
    goodFor: ["Browsing and social media", "Online classes", "Small homes, light to normal use"],
    colour: "from-sky-500 to-cyan-500",
  },
  {
    id: "plus",
    name: "Home Plus",
    mbps: 300,
    prices: { "30": 444, "90": 1265, "180": 2478, "365": 4795 },
    goodFor: ["HD movies and TV", "Working from home and video calls", "Medium homes, many devices"],
    colour: "from-amber-400 to-orange-500",
  },
  {
    id: "elite",
    name: "Home Elite",
    mbps: 500,
    prices: { "30": 999, "90": 2847, "180": 5574, "365": 10789 },
    goodFor: ["4K streaming and online gaming", "Smart home gadgets", "Big homes, everyone online at once"],
    colour: "from-fuchsia-500 to-purple-600",
  },
];

/** What paying month by month for the same time would cost, and what a longer plan saves. */
export function planSaving(plan: FibrePlan, period: PeriodId) {
  const months = PERIODS.find((p) => p.id === period)!.months;
  const monthByMonth = plan.prices["30"] * months;
  const price = plan.prices[period];
  const saved = monthByMonth - price;
  return { price, monthByMonth, saved, percent: monthByMonth ? Math.round((saved / monthByMonth) * 100) : 0, perMonth: price / months };
}

// The June 2026 price cut (Graphic, Citi Newsroom, MyJoyOnline, 17 Jun 2026).
export const PRICE_CUT = { date: "17 June 2026", before: 987, after: 299, mbps: 100 };

// Download race files: sizes are typical, rounded, and labelled as such on the page.
export const RACE_FILES = [
  { id: "film", label: "A 2-hour HD film", gb: 4 },
  { id: "update", label: "A big phone update", gb: 6 },
  { id: "game", label: "A big video game", gb: 80 },
] as const;

/** Best-case seconds to download `gb` gigabytes at `mbps` (1 GB = 8,000 megabits). */
export function downloadSeconds(gb: number, mbps: number) {
  return (gb * 8000) / mbps;
}

export function humanTime(seconds: number) {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} sec`;
  const m = Math.floor(seconds / 60);
  if (m < 60) {
    const s = Math.round(seconds - m * 60);
    return s ? `${m} min ${s} sec` : `${m} min`;
  }
  const h = Math.floor(m / 60);
  const rm = m - h * 60;
  return rm ? `${h} hr ${rm} min` : `${h} hr`;
}

/** Plan picker, based on MTN's own "ideal for" guidance (small / medium / large homes). */
export function suggestPlan(people: number, heavy: boolean): FibrePlan["id"] {
  let level = people <= 3 ? 0 : people <= 6 ? 1 : 2;
  if (heavy) level = Math.min(2, level + 1);
  return (["starter", "plus", "elite"] as const)[level];
}

export const HOW_TO_BUY = [
  { how: "Dial *5057#", detail: "From the phone number linked to your fibre account." },
  { how: "MyMTN app", detail: "Manage Broadband → Buy Bundle." },
  { how: "Dial *170#", detail: "Choose Fixed Broadband." },
  { how: "Online", detail: "selfservice.mtn.com.gh or shop.mtn.com.gh" },
];

export const PAY_WITH = ["MTN MoMo", "Airtime", "Visa or Mastercard"];

export const HELP = {
  phone: ["100", "116"],
  whatsapp: "0554300000",
  whatsappLink: "https://wa.me/233554300000",
  email: "customercare.GH@mtn.com",
  x: "@AskMTNGhana",
};

export const FAQS: { question: string; answer: string }[] = [
  {
    question: "How much is MTN Fibre in Ghana?",
    answer:
      "For homes it is GH¢299 a month for up to 100 Mbps, GH¢444 for up to 300 Mbps and GH¢999 for up to 500 Mbps. You can also pay for 3, 6 or 12 months at once and save up to 10%.",
  },
  {
    question: "Is MTN Fibre really unlimited?",
    answer:
      "MTN sells these plans as unlimited, with no data cap. You pay for speed, not for gigabytes. MTN's older home terms still mention a fair-use policy, so very heavy use may be looked at.",
  },
  {
    question: "Do I pay for installation?",
    answer:
      "MTN's shop says installation is free on every plan right now. MTN's written terms still mention a one-time installation fee, so ask MTN to confirm it is free before they come.",
  },
  {
    question: "Is MTN Fibre available in my area?",
    answer:
      "Only in selected areas, mostly in parts of Accra and Kumasi for now, with more towns being added. Check your exact address on shop.mtn.com.gh (Check Fibre Availability) or dial *5057#.",
  },
  {
    question: "Will I always get the full 100, 300 or 500 Mbps?",
    answer:
      "No. MTN says the speeds are 'up to' figures and the service is shared, so speed can drop when many people are online. Wi-Fi is also slower in far rooms than near the router.",
  },
  {
    question: "Who owns the router?",
    answer:
      "MTN does. You use it free, but you must give it back when you stop, and you pay for it if it is lost, stolen or damaged.",
  },
  {
    question: "Can I change to a faster or slower plan?",
    answer:
      "Yes, but you must cancel your current plan first, then wait 30 days before choosing the new one, according to MTN's terms.",
  },
  {
    question: "What if I move house?",
    answer:
      "You can freeze your account for up to one month while you move. If your new home has no MTN fibre and more than 3 months are left on a long plan, you can ask for a part refund.",
  },
  {
    question: "What if there is no fibre on my street?",
    answer:
      "MTN offers Yello Home, a 4G router that works over the mobile network. The router costs GH¢1,200 at MTN service centres (bring your Ghana Card), and you buy data with *5060#.",
  },
];

export const SOURCES: { label: string; url: string; note: string }[] = [
  { label: "MTN online shop: Fibre Broadband", url: "https://shop.mtn.com.gh/", note: "Prices, free installation, up to 64 devices, 'shared-speed service'" },
  { label: "MTN help centre: MTN Fibre Offers and Plans", url: "https://help-center.mtn.com.gh/hc/en-us/articles/38318243021458-MTN-Fibre-Offers-and-Plans", note: "1, 3, 6 and 12-month prices (last edited 24 Aug 2026)" },
  { label: "MTN help centre: How to Buy and Renew Your MTN Fibre Bundle", url: "https://help-center.mtn.com.gh/hc/en-us/articles/38318303050386-How-to-Buy-and-Renew-Your-MTN-Fibre-Bundle", note: "*5057#, MyMTN app, *170#, self-service (last edited 24 Aug 2026)" },
  { label: "MTN: Unlimited Fiber Plan Terms of Service", url: "https://mtn.com.gh/unlimited-fiber-plan-terms-of-service/", note: "Auto-renewal, refunds, 30-day wait to change speed, freeze, outages" },
  { label: "MTN: Fibre Broadband terms (home)", url: "https://mtn.com.gh/mtn-fiber-broadband-service/", note: "Router stays MTN's property; installation fee wording; fair use" },
  { label: "MTN: Business Fibre terms", url: "https://mtn.com.gh/mtn-business-fibre/", note: "Selected areas only; 'up to' speeds not guaranteed; static IP" },
  { label: "Graphic Online, 17 Jun 2026", url: "https://www.graphic.com.gh/news/general-news/mtn-fibre-announces-fibre-broadband-price-cuts.html", note: "Price cut announced" },
  { label: "Citi Newsroom, 17 Jun 2026", url: "https://www.citinewsroom.com/2026/06/sam-george-announces-major-cut-in-mtn-fibre-broadband-prices/", note: "GH¢987 → GH¢299, Minister Sam George" },
  { label: "MyJoyOnline, 24 Jun 2026", url: "https://www.myjoyonline.com/mtn-ghana-redefines-home-internet-experience-with-unlimited-fibre-packages/", note: "MTN's announcement of the unlimited speed plans" },
  { label: "MyJoyOnline, 21 Jul 2026", url: "https://www.myjoyonline.com/mtn-ghana-launches-fibre-broadband-for-homes/", note: "Home roll-out starting in Accra and Kumasi" },
];
