import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { EiTechMemeCard, EI_TECH_HUB_URL } from "@/components/ei-tech/EiTechMemeCard";
import { EI_TECH_MEMES, eiTechShareImage } from "@/data/eiTech";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowRight, Share2 } from "lucide-react";

// Floating emoji in the hero. Fixed positions (never random: the page is
// prerendered, and random values would differ between build and browser).
const FLOATERS = [
  { e: "😂", l: "5%", t: "7%", s: "text-4xl md:text-6xl", d: 6, y: 14, r: -12 },
  { e: "📱", l: "86%", t: "14%", s: "text-4xl md:text-5xl", d: 7, y: -12, r: 10 },
  { e: "🐄", l: "10%", t: "72%", s: "text-4xl md:text-5xl", d: 8, y: -10, r: 8 },
  { e: "🤖", l: "82%", t: "70%", s: "text-4xl md:text-5xl", d: 6.5, y: 12, r: -8 },
  { e: "💻", l: "24%", t: "40%", s: "hidden md:block text-4xl", d: 9, y: 10, r: 6 },
  { e: "🔋", l: "72%", t: "42%", s: "hidden md:block text-3xl", d: 7.5, y: -14, r: -6 },
  { e: "🤣", l: "45%", t: "86%", s: "hidden md:block text-3xl", d: 8.5, y: -8, r: 12 },
];

// /ei-tech — every Ei Tech! meme, newest first (src/data/eiTech.ts), as a feed.
// Indexed; each meme's own page (/ei-tech/:slug) is noindex for now.
export default function EiTechHub() {
  const latest = EI_TECH_MEMES[0];
  const many = EI_TECH_MEMES.length > 1;

  const shareHub = async () => {
    const text = "Ei Tech! Funny tech jokes to laugh at and share 😂";
    try {
      if (navigator.share) { await navigator.share({ title: "Ei Tech!", text, url: EI_TECH_HUB_URL }); return; }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${EI_TECH_HUB_URL}`)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      <SEOHead
        title="Ei Tech! Funny Tech Jokes and Memes"
        description="Funny tech jokes and memes about phones, gadgets, apps and the internet. Have a laugh and share them with your friends and family."
        canonical="/ei-tech"
        image={latest ? eiTechShareImage(latest) : undefined}
        imageAlt={latest ? latest.alt : undefined}
        keywords={["tech jokes", "tech memes", "funny tech", "phone memes", "Ei Tech"]}
        breadcrumbs={[{ name: "Home", path: "/" }, { name: "Ei Tech!", path: "/ei-tech" }]}
      />

      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden bg-[#0b1020] text-white">
        {/* slow colour glows */}
        <motion.div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full bg-orange-500/25 blur-[130px]"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -bottom-48 -right-24 w-[38rem] h-[38rem] rounded-full bg-fuchsia-600/20 blur-[140px]"
          animate={{ x: [0, -40, 0], y: [0, -30, 0] }} transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "26px 26px" }} />

        {/* floating emoji */}
        {FLOATERS.map((f, i) => (
          <motion.span key={i} aria-hidden="true"
            className={cn("absolute select-none pointer-events-none opacity-70 drop-shadow-lg", f.s)}
            style={{ left: f.l, top: f.t }}
            animate={{ y: [0, f.y, 0], rotate: [0, f.r, 0] }}
            transition={{ duration: f.d, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}>
            {f.e}
          </motion.span>
        ))}

        <div className="container relative z-10 py-16 md:py-24 text-center">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur text-sm font-semibold text-orange-200">
            😂 Funny tech moments
          </motion.span>

          <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 120, delay: 0.1 }}
            className="mt-5 text-7xl sm:text-8xl md:text-9xl font-black tracking-tight leading-none">
            <motion.span className="inline-block origin-bottom"
              animate={{ rotate: [0, -8, 8, -5, 0] }} transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3.5, delay: 1.2 }}>
              Ei
            </motion.span>{" "}
            <span className="bg-gradient-to-r from-orange-300 via-orange-500 to-rose-500 bg-clip-text text-transparent">Tech!</span>
            <span className="sr-only"> Funny tech jokes and memes</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="mt-5 text-lg md:text-2xl text-white/80 max-w-xl mx-auto leading-relaxed">
            Laugh at it. Share it. Tag that friend. 😄
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#jokes" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold shadow-lg shadow-orange-500/30 hover:scale-[1.03] transition-transform">
              See the jokes <ArrowDown className="w-5 h-5" />
            </a>
            <button type="button" onClick={shareHub} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur text-white font-semibold hover:bg-white/15 transition-colors">
              <Share2 className="w-5 h-5" /> Share Ei Tech!
            </button>
          </motion.div>
        </div>

        {/* wavy bottom edge into the feed */}
        <svg className="relative block w-full h-10 md:h-16 text-orange-50 dark:text-background" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,40 C240,80 480,0 720,32 C960,64 1200,8 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      {/* ───────── FEED ───────── */}
      <section id="jokes" className="pb-14 pt-6 md:pt-10 bg-gradient-to-b from-orange-50 to-background dark:from-background dark:to-background scroll-mt-20">
        <div className="container">
          <div className={cn("mx-auto grid gap-8", many ? "max-w-4xl md:grid-cols-2 items-start" : "max-w-xl")}>
            {EI_TECH_MEMES.map((m, i) => (
              <EiTechMemeCard key={m.slug} meme={m} linkTitle eager={i === 0} />
            ))}
          </div>

          <div className="max-w-xl mx-auto mt-12 rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-bold text-foreground text-lg">Seen a funny tech moment?</p>
            <p className="text-muted-foreground mt-1">Send it to us. It could be the next Ei Tech!</p>
            <Link to="/contact" className="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
              Send it to us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
