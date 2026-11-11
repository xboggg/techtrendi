// Ei Tech! — TechTrendi's funny tech memes (/ei-tech), started 11 Nov 2026.
//
// Every meme is OUR OWN picture: Edmund sends a joke he has seen, we remake it
// as a new image with the Ei Tech! bar. Never add a picture copied from
// someone else (copyright, and AdSense treats copied pictures as low value).
//
// Keep it light: a short title and one funny line, nothing more. We do not
// explain the joke or tell people what it means — readers have their own
// views (Edmund, 11 Nov 2026). `alt` only describes what is IN the picture.
//
// Adding one: put the files in public/ei-tech/ (<slug>.jpg ~1080 wide with the
// Ei Tech! bar, <slug>.webp, and a 1200x630 <slug>-share.jpg for link previews,
// all under 300 KB), then add an entry at the TOP of this list. The build makes
// /ei-tech/<slug> automatically, and its share tags come from that page.
//
// `date` is a plain string on purpose: the pages are prerendered, so nothing
// here may depend on the visitor's clock (hydration — see Security.tsx timeAgo).

export interface EiTechMeme {
  slug: string;
  title: string;
  /** Publish day, "YYYY-MM-DD". Shown as written; newest entry goes first. */
  date: string;
  /** One short funny line under the title, in the joke's own voice. */
  caption: string;
  /** What the picture shows (not what it means), for blind readers and Google. */
  alt: string;
  width: number;
  height: number;
}

export const EI_TECH_MEMES: EiTechMeme[] = [
  {
    slug: "iphone-vs-cow",
    title: "iPhone or cow?",
    date: "2026-11-11",
    caption: "Same money. Two years later… Ei!",
    alt: "A laughing man at a roadside kiosk wears a T-shirt: an orange iPhone and a cow both cost $1,300. Two years later the iPhone has a cracked screen, and the cow has two calves.",
    width: 1080,
    height: 1460,
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
