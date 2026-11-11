import { Link } from "react-router-dom";
import { ArrowRight, Laugh } from "lucide-react";
import { eiTechImage, eiTechSharePath, eiTechWebp, useEiTechMemes } from "@/data/eiTech";

// Homepage teaser for Ei Tech! (/ei-tech): the newest meme. First render = the list baked at
// build (matches the prerendered homepage); the live list swaps in a newer meme after mount.
export function EiTechHomeCard() {
  const meme = useEiTechMemes()[0];
  if (!meme) return null;
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container">
        <Link
          to={eiTechSharePath(meme)}
          className="group grid md:grid-cols-[1fr_1.1fr] overflow-hidden rounded-3xl bg-[#0f172a] text-white shadow-xl max-w-4xl mx-auto"
        >
          <picture className="block">
            <source srcSet={eiTechWebp(meme)} type="image/webp" />
            <img
              src={eiTechImage(meme)}
              alt={meme.alt}
              width={meme.width}
              height={meme.height}
              loading="lazy"
              className="block w-full h-72 sm:h-80 md:h-[440px] object-cover object-[50%_66%] md:object-[50%_45%] group-hover:scale-[1.02] transition-transform duration-500"
            />
          </picture>
          <div className="p-6 md:p-10 flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-medium text-orange-300">
              <Laugh className="w-4 h-4" /> Have a laugh
            </span>
            <h2 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">
              Ei <span className="text-orange-400">Tech!</span>
            </h2>
            <p className="mt-3 text-xl font-bold">{meme.title}</p>
            <p className="mt-1 text-white/70">{meme.caption}</p>
            <span className="mt-6 inline-flex w-fit items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold group-hover:bg-orange-600 transition-colors">
              See the joke <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
