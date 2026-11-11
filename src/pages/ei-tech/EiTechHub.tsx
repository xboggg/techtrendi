import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { EiTechMemeCard } from "@/components/ei-tech/EiTechMemeCard";
import { EI_TECH_MEMES, eiTechShareImage } from "@/data/eiTech";
import { ArrowRight, Laugh } from "lucide-react";

// /ei-tech — every Ei Tech! meme, newest first (src/data/eiTech.ts).
// Indexed; each meme's own page (/ei-tech/:slug) is noindex for now, so Google
// sees one solid page instead of many picture-only ones.
export default function EiTechHub() {
  const latest = EI_TECH_MEMES[0];
  return (
    <Layout>
      <SEOHead
        title="Ei Tech! Funny Tech Jokes from Ghana"
        description="Funny tech jokes and memes from Ghana. Laugh, share them on WhatsApp, and learn one real money-saving or safety tip from each joke."
        canonical="/ei-tech"
        image={latest ? eiTechShareImage(latest) : undefined}
        imageAlt={latest ? latest.alt : undefined}
        keywords={["tech jokes", "tech memes", "Ghana memes", "funny tech", "Ei Tech"]}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Ei Tech!", path: "/ei-tech" }]}
      />

      <section className="bg-[#0f172a] text-white">
        <div className="container py-12 md:py-16 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-medium text-orange-300">
            <Laugh className="w-4 h-4" /> Tech jokes from Ghana
          </span>
          <p className="mt-4 text-5xl md:text-7xl font-black tracking-tight">
            Ei <span className="text-orange-400">Tech!</span>
          </p>
          <h1 className="mt-4 text-lg md:text-xl text-white/80 max-w-xl mx-auto leading-relaxed">
            Funny tech moments. Have a laugh, share it with your people, and take away one real lesson from each joke.
          </h1>
        </div>
      </section>

      <section className="py-10 md:py-14 bg-gradient-to-b from-orange-50/60 to-background dark:from-orange-950/10 dark:to-background">
        <div className="container">
          <div className="max-w-xl mx-auto space-y-10">
            {EI_TECH_MEMES.map((m, i) => (
              <EiTechMemeCard key={m.slug} meme={m} linkTitle eager={i === 0} />
            ))}
          </div>

          <div className="max-w-xl mx-auto mt-12 rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-bold text-foreground text-lg">Seen a funny tech moment?</p>
            <p className="text-muted-foreground mt-1">Tell us about it. The best ones become the next Ei Tech!</p>
            <Link to="/contact" className="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
              Send it to us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
