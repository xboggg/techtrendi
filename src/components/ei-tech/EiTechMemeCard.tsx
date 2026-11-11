import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Facebook, Link2, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type EiTechMeme, eiTechDate, eiTechImage, eiTechWebp } from "@/data/eiTech";

const SITE_URL = "https://techtrendi.com";
export const EI_TECH_HUB_URL = `${SITE_URL}/ei-tech`;
export const eiTechUrl = (m: EiTechMeme) => `${SITE_URL}/ei-tech/${m.slug}`;

const waHref = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

// Share = send the PICTURE itself (that is how memes travel on WhatsApp/Status),
// with a line pointing back to Ei Tech!. Phones that can share files get the
// picture; everything else gets the meme's link (its own page, so the WhatsApp
// preview shows the right meme). The picture is fetched ahead of time when the
// card comes near the screen, because iPhones refuse to open the share sheet if
// we make them wait for a download after the tap.
export function EiTechShare({ meme, className }: { meme: EiTechMeme; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<File | null>(null);
  const [copied, setCopied] = useState(false);
  const url = eiTechUrl(meme);
  const text = `${meme.title} 😂 ${meme.caption}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof navigator === "undefined" || !navigator.canShare) return;
    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      fetch(eiTechImage(meme))
        .then((r) => (r.ok ? r.blob() : Promise.reject()))
        .then((b) => {
          const f = new File([b], `ei-tech-${meme.slug}.jpg`, { type: "image/jpeg" });
          if (navigator.canShare({ files: [f] })) fileRef.current = f;
        })
        .catch(() => {});
    };
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [meme]);

  const share = async () => {
    const file = fileRef.current;
    try {
      if (file) {
        await navigator.share({ files: [file], text: `${text}\nMore jokes: ${EI_TECH_HUB_URL}` });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: meme.title, text, url });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return; // person closed the share sheet
    }
    window.open(waHref(`${text}\n${url}`), "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <div ref={ref} className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={share}
        className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-[#25D366] text-white font-bold shadow-md hover:bg-[#1ebe5a] active:scale-[0.98] transition"
      >
        <Share2 className="w-5 h-5" /> Share
      </button>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className="inline-flex items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-[#1877F2] text-white hover:bg-[#166fe0] transition-colors"
      >
        <Facebook className="w-5 h-5" />
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copied" : "Copy link"}
        className="inline-flex items-center justify-center w-12 h-12 shrink-0 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
      >
        {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Link2 className="w-5 h-5" />}
      </button>
    </div>
  );
}

// One meme in the feed: big picture, title, one funny line, Share.
// `headingLevel` 1 on the meme's own page, 2 in the /ei-tech feed.
export function EiTechMemeCard({ meme, headingLevel = 2, linkTitle = false, eager = false }: {
  meme: EiTechMeme;
  headingLevel?: 1 | 2;
  linkTitle?: boolean;
  eager?: boolean;
}) {
  const H = headingLevel === 1 ? "h1" : "h2";
  const picture = (
    <picture>
      <source srcSet={eiTechWebp(meme)} type="image/webp" />
      <img
        src={eiTechImage(meme)}
        alt={meme.alt}
        width={meme.width}
        height={meme.height}
        loading={eager ? "eager" : "lazy"}
        className="block w-full h-auto bg-muted"
      />
    </picture>
  );
  return (
    <article id={meme.slug} className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg scroll-mt-24">
      {linkTitle ? <Link to={`/ei-tech/${meme.slug}`} aria-label={meme.title}>{picture}</Link> : picture}
      <div className="p-4 md:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <H className="text-xl md:text-2xl font-black text-foreground leading-tight">
            {linkTitle ? <Link to={`/ei-tech/${meme.slug}`} className="hover:text-orange-600 transition-colors">{meme.title}</Link> : meme.title}
          </H>
          <span className="shrink-0 text-xs text-muted-foreground">{eiTechDate(meme.date)}</span>
        </div>
        <p className="text-muted-foreground mt-1">{meme.caption}</p>
        <EiTechShare meme={meme} className="mt-4" />
      </div>
    </article>
  );
}
