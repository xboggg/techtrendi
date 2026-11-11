import { Link, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { EiTechMemeCard } from "@/components/ei-tech/EiTechMemeCard";
import { eiTechImage, eiTechSharePath, eiTechShareImage, useEiTechMemesLive } from "@/data/eiTech";
import NotFound from "@/pages/NotFound";
import { ArrowLeft } from "lucide-react";

// /ei-tech/:slug — one meme, the page people land on from a shared link.
// Prerendered for every meme in the baked list (src/data/eiTech.ts), with the
// meme's 1200x630 share card as og:image. A meme published since the last build
// is looked up in the live list (links normally send those to /ei-tech?m=<slug>).
export default function EiTechMemePage() {
  const { slug } = useParams();
  const [memes, loaded] = useEiTechMemesLive();
  const meme = memes.find((m) => m.slug === slug);
  if (!meme) {
    if (!loaded) return <Layout><div className="container py-24 text-center text-muted-foreground">Loading…</div></Layout>;
    return <NotFound />;
  }
  const others = memes.filter((m) => m.slug !== meme.slug).slice(0, 4);

  return (
    <Layout>
      <SEOHead
        title={`${meme.title} | Ei Tech!`}
        description={`${meme.caption} A tech joke from Ei Tech! on TechTrendi. Have a laugh and share it.`}
        canonical={`/ei-tech/${meme.slug}`}
        image={eiTechShareImage(meme)}
        imageAlt={meme.alt}
        noindex
        noindexFollow
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Ei Tech!", path: "/ei-tech" },
          { name: meme.title, path: `/ei-tech/${meme.slug}` },
        ]}
      />

      <section className="py-8 md:py-12 bg-gradient-to-b from-orange-50/60 to-background dark:from-orange-950/10 dark:to-background">
        <div className="container">
          <div className="max-w-xl mx-auto">
            <Link to="/ei-tech" className="inline-flex items-center gap-1.5 mb-5 text-sm font-semibold text-foreground hover:text-orange-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> <span>Ei <span className="text-orange-500">Tech!</span></span> all jokes
            </Link>
            <EiTechMemeCard meme={meme} headingLevel={1} eager />

            {others.length > 0 ? (
              <div className="mt-12">
                <h2 className="text-xl font-bold text-foreground mb-4">More from Ei Tech!</h2>
                <div className="grid grid-cols-2 gap-4">
                  {others.map((m) => (
                    <Link key={m.slug} to={eiTechSharePath(m)} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                      <img src={eiTechImage(m)} alt={m.alt} width={m.width} height={m.height} loading="lazy" className="block w-full aspect-square object-cover object-top" />
                      <p className="p-3 text-sm font-semibold text-foreground group-hover:text-orange-600 transition-colors">{m.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-10 text-center text-muted-foreground">
                More jokes are coming. <Link to="/ei-tech" className="font-semibold text-primary hover:underline">See Ei Tech!</Link>
              </p>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
