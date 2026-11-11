// Ei Tech! — TechTrendi's funny tech memes (/ei-tech), started 11 Nov 2026.
//
// Every meme is OUR OWN picture: Edmund sends a joke he has seen, we remake it
// as a new image with the Ei Tech! bar. Never add a picture copied from
// someone else (copyright, and AdSense treats copied pictures as low value).
//
// Adding one: put the files in public/ei-tech/ (<slug>.jpg ~1080 wide with the
// Ei Tech! bar, <slug>.webp, and a 1200x630 <slug>-share.jpg for link previews,
// all under 300 KB), then add an entry at the TOP of this list. The build makes
// /ei-tech/<slug> automatically and public/og-meta.php reads the share picture
// from that page, so nothing else needs changing.
//
// `date` is a plain string on purpose: the pages are prerendered, so nothing
// here may depend on the visitor's clock (hydration — see Security.tsx timeAgo).

export interface EiTechMeme {
  slug: string;
  title: string;
  /** Publish day, "YYYY-MM-DD". Shown as written; newest entry goes first. */
  date: string;
  /** Short line under the title, in the joke's own voice. */
  caption: string;
  /** What the picture shows, for blind readers and Google Images. */
  alt: string;
  width: number;
  height: number;
  /** "The real lesson": 2–4 plain sentences, so the page is more than a picture. */
  lesson: string;
  /** Optional TechTrendi pages that go with the lesson. */
  links?: { label: string; href: string }[];
}

export const EI_TECH_MEMES: EiTechMeme[] = [
  {
    slug: "iphone-vs-cow",
    title: "iPhone or cow?",
    date: "2026-11-11",
    caption: "Same money. Two years later… Ei!",
    alt: "A laughing man in Accra wears a T-shirt: an orange iPhone and a cow both cost $1,300. Two years later the iPhone has a cracked screen, and the cow has two calves.",
    width: 1080,
    height: 1460,
    lesson:
      "The joke is true. A new phone starts losing value the day you buy it, and a cracked screen cuts its price even more. A cow can grow into a small herd. Before you spend big on the newest phone, ask yourself if you really need it, or if your current phone can do the job for another year.",
    links: [
      { label: "Should I upgrade my phone? (free calculator)", href: "/tools/upgrade-calculator" },
      { label: "iPhone 18 Pro: upgrade, wait, or buy the 17 Pro?", href: "/blog/iphone-18-pro-ghana-upgrade-or-wait-2026" },
    ],
  },
];

export const eiTechImage = (m: EiTechMeme) => `/ei-tech/${m.slug}.jpg`;
export const eiTechWebp = (m: EiTechMeme) => `/ei-tech/${m.slug}.webp`;
export const eiTechShareImage = (m: EiTechMeme) => `/ei-tech/${m.slug}-share.jpg`;

/** "11 Nov 2026" — fixed format, same on the server and in every browser. */
export function eiTechDate(date: string) {
  const [y, mo, d] = date.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[mo - 1]} ${y}`;
}
