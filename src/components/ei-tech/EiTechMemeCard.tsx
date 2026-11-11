import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Facebook, Lightbulb, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type EiTechMeme, eiTechDate, eiTechImage, eiTechWebp } from "@/data/eiTech";

const SITE_URL = "https://techtrendi.com";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const eiTechUrl = (m: EiTechMeme) => `${SITE_URL}/ei-tech/${m.slug}`;

// WhatsApp first and biggest: that is where Ghanaians share jokes.
export function EiTechShare({ meme, className }: { meme: EiTechMeme; className?: string }) {
  const [copied, setCopied] = useState(false);
  const url = eiTechUrl(meme);
  const waText = `${meme.title} 😂 ${meme.caption}\n${url}`;

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
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] text-white font-semibold shadow-md hover:bg-[#1ebe5a] transition-colors"
      >
        <WhatsAppIcon className="w-5 h-5" /> Share on WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1877F2] text-white hover:bg-[#166fe0] transition-colors"
      >
        <Facebook className="w-5 h-5" />
      </a>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 h-12 px-4 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

// One meme: picture, title, share buttons and "the real lesson".
// `headingLevel` 1 on the meme's own page, 2 in the list on /ei-tech.
export function EiTechMemeCard({ meme, headingLevel = 2, linkTitle = false, eager = false }: {
  meme: EiTechMeme;
  headingLevel?: 1 | 2;
  linkTitle?: boolean;
  eager?: boolean;
}) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <article id={meme.slug} className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm scroll-mt-24">
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
      <div className="p-5 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">{eiTechDate(meme.date)}</p>
        <H className="text-2xl md:text-3xl font-black text-foreground mt-1 leading-tight">
          {linkTitle ? <Link to={`/ei-tech/${meme.slug}`} className="hover:text-orange-600 transition-colors">{meme.title}</Link> : meme.title}
        </H>
        <p className="text-lg text-muted-foreground mt-1">{meme.caption}</p>

        <EiTechShare meme={meme} className="mt-5" />

        <div className="mt-6 rounded-2xl border-l-4 border-orange-500 bg-orange-500/10 p-4 md:p-5">
          <p className="flex items-center gap-1.5 text-sm font-bold text-orange-700 dark:text-orange-400">
            <Lightbulb className="w-4 h-4" /> The real lesson
          </p>
          <p className="text-foreground/85 mt-2 leading-relaxed">{meme.lesson}</p>
          {meme.links && meme.links.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {meme.links.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                    {l.label} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
