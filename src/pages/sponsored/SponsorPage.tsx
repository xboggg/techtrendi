import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  MessageCircle, Phone, ShieldCheck, Smartphone, Signal, Unlock, Zap, Info, Check,
  Globe2, Wrench, BadgeCheck, MessagesSquare, ChevronDown, ArrowRight,
} from "lucide-react";
import { trackEvents } from "@/lib/gtag";
import { fetchLiveSponsor, getSponsorBySlug, type Sponsor } from "@/data/sponsors";
import NotFound from "../NotFound";

const SERVICE_ICONS = [Smartphone, Unlock, Zap, Signal];
const REASON_ICONS = [Wrench, Smartphone, ShieldCheck, MessagesSquare];
const NEON_NUMBER = [
  "text-cyan-400 [text-shadow:0_0_14px_#22d3ee]",
  "text-purple-400 [text-shadow:0_0_14px_#a855f7]",
  "text-blue-400 [text-shadow:0_0_14px_#3b82f6]",
];
const REASON_TONES = [
  { tile: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10", icon: "bg-emerald-500" },
  { tile: "border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10", icon: "bg-blue-500" },
  { tile: "border-violet-200 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10", icon: "bg-violet-600" },
  { tile: "border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10", icon: "bg-orange-500" },
];
// Stagger index for the sp-in / sp-pop / data-reveal animations (index.css).
const delay = (i: number) => ({ "--d": i }) as CSSProperties;

// Landing page for a paid sponsor (src/data/sponsors.ts). Labelled "Sponsored",
// noindex (kept out of Google results and the sitemap), outside links marked
// rel="sponsored". One route per sponsor is generated in routes.tsx.
// First paint = the copy baked at build (same on server and browser, so hydration
// matches); then the live row replaces it, so the owner's edits show at once.
export default function SponsorPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/sponsored\//, "").replace(/\/$/, "");
  const [sponsor, setSponsor] = useState<Sponsor | null | undefined>(() => getSponsorBySlug(slug));

  useEffect(() => {
    let alive = true;
    fetchLiveSponsor(slug).then((live) => {
      if (alive && live !== undefined) setSponsor(live); // undefined = couldn't check: keep the baked copy
    });
    return () => { alive = false; };
  }, [slug]);

  // Orbitron for the neon "How it works" heading + step numbers, sponsor pages only
  // (text= keeps the file tiny). Added by hand: a <Head> link is dropped by the
  // head manager when the page hydrates.
  useEffect(() => {
    if (document.getElementById("sp-orbitron")) return;
    const link = document.createElement("link");
    link.id = "sp-orbitron";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap&text=How%20it%20works0123456789";
    document.head.appendChild(link);
  }, []);

  // Scroll reveal: [data-reveal] blocks glide in as they come into view. Classes
  // are added straight to the DOM after hydration, so server and browser HTML match
  // and the page still shows everything if JS or IntersectionObserver is missing.
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = pageRef.current;
    if (!root || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("sp-anim");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    root.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sponsor]);

  if (!sponsor) return <NotFound />;
  const s = sponsor;

  return (
    <Layout>
      <div ref={pageRef}>
      <SEOHead
        title={`${s.name} (Sponsored)`}
        description={`${s.name}: ${s.cardText} Contact on WhatsApp or call ${s.phoneDisplay}.`}
        canonical={pathname}
        image={s.shareImage || s.heroImage}
        imageAlt={`${s.name} — ${s.tagline}`}
        noindex
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-950 text-white">
        <div aria-hidden className="sp-blob pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
        <div aria-hidden className="sp-blob pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-fuchsia-600/25 blur-3xl" style={{ animationDelay: "-9s" }} />
        <div className={`container relative grid items-center gap-10 py-10 md:py-16 ${s.heroImage ? "lg:grid-cols-2" : "max-w-3xl"}`}>
          <div>
            <span className="sp-in inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200" style={delay(0)}>
              Sponsored · {s.name}
            </span>
            <h1 className="sp-in mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl" style={delay(1)}>
              {s.headline}
            </h1>
            <p className="sp-in mt-5 text-lg leading-relaxed text-slate-200 md:text-xl" style={delay(2)}>{s.intro}</p>
            {s.highlights?.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {s.highlights.map((h, i) => (
                  <li key={h} className="sp-pop inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-100" style={delay(i)}>
                    <Check className="h-4 w-4 text-emerald-300" /> {h}
                  </li>
                ))}
              </ul>
            )}
            <div className="sp-in" style={delay(4)}>
              <ContactButtons s={s} pathname={pathname} className="mt-8" />
            </div>
          </div>
          {s.heroImage && (
            <div className="sp-in relative mx-auto w-full max-w-md lg:max-w-none" style={delay(2)}>
              <div aria-hidden className="animate-hero-glow absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-500/40 to-blue-500/40 blur-2xl" />
              <div className="animate-hero-float">
                <img
                  src={s.heroImage}
                  alt={s.heroImageAlt}
                  width={560}
                  height={520}
                  className="relative w-full rounded-3xl border border-white/15 object-cover shadow-2xl"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Who it's for */}
      {(s.audience?.title || s.audience?.text) && (
        <section className="bg-slate-950 text-white">
          <div className="container py-10">
            <div data-reveal className="flex flex-col gap-4 rounded-2xl border border-blue-400/25 bg-gradient-to-r from-blue-500/15 to-violet-500/15 p-6 md:flex-row md:items-center md:p-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20">
                <Globe2 className="h-7 w-7 text-blue-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold md:text-2xl">{s.audience?.title}</h2>
                <p className="mt-2 leading-relaxed text-slate-300">{s.audience?.text}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {s.services?.length > 0 && (
      <section className="bg-background">
        <div className="container py-14 md:py-20">
          <div data-reveal>
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">What they offer</p>
            <h2 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">Services</h2>
          </div>
          <ServiceSlider services={s.services} />
        </div>
      </section>
      )}

      {/* How it works (neon, matches the poster) */}
      {s.steps?.length > 0 && (
      <section className="relative overflow-hidden bg-[radial-gradient(120%_60%_at_50%_0%,#1e1b4b_0%,#070b1f_55%,#030512_100%)] text-slate-200">
        <div aria-hidden className="sp-scan pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent" />
        <div className="container relative py-14 md:py-20">
          <div data-reveal>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Simple steps</p>
            <h2 className="mt-2 sp-orb text-3xl font-black text-white [text-shadow:0_0_18px_rgba(168,85,247,0.6)] md:text-4xl">How it works</h2>
          </div>
          <ol className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
            {s.steps.map((step, i) => (
              <li key={step.title} data-reveal style={delay(i)} className="sp-neon">
                <div className="relative flex h-full items-start gap-4 rounded-[1.2rem] bg-[#0b1029] p-5 md:flex-col md:p-6">
                  <span
                    className={`sp-glow sp-orb text-3xl font-black leading-none ${NEON_NUMBER[i % NEON_NUMBER.length]}`}
                    style={{ animationDelay: `${i * 0.4}s` }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-slate-300">{step.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      )}

      {/* Why choose */}
      {s.reasons?.length > 0 && (
      <section className="bg-background">
        <div className="container py-14 md:py-20">
          <div data-reveal>
            <p className="text-sm font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">Why {s.name}</p>
            <h2 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">Why people choose them</h2>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
            {s.reasons.map((r, i) => {
              const Icon = REASON_ICONS[i % REASON_ICONS.length];
              const tone = REASON_TONES[i % REASON_TONES.length];
              return (
                <div key={r.title} data-reveal style={delay(i)} className={`group rounded-2xl border p-4 transition hover:-translate-y-1 hover:shadow-lg md:p-6 ${tone.tile}`}>
                  <div className={`sp-wiggle flex h-10 w-10 items-center justify-center rounded-xl text-white md:h-12 md:w-12 ${tone.icon}`}>
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold leading-snug text-foreground md:text-base">{r.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground md:text-sm">{r.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* FAQ */}
      {s.faqs?.length > 0 && (
      <section className="bg-muted/40">
        <div className="container max-w-3xl py-14 md:py-20">
          <div data-reveal>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">Questions people ask</h2>
            <p className="mt-2 text-muted-foreground">Tap a question to see the answer.</p>
          </div>
          <FaqChat faqs={s.faqs} />
        </div>
      </section>
      )}

      {/* Final call to action */}
      <section className="sp-flow relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-950 text-white">
        <div aria-hidden className="sp-blob pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div data-reveal className="container relative py-14 text-center md:py-20">
          <BadgeCheck className="mx-auto h-10 w-10 text-emerald-300" />
          <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">{s.ctaTitle || `Get in touch with ${s.name}`}</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-violet-100">
            {s.ctaText || "Message them on WhatsApp or give them a call."}
            {s.promise?.title ? ` ${s.promise.title}.` : ""}
          </p>
          <ContactButtons s={s} pathname={pathname} className="mx-auto mt-8 max-w-2xl" />
          {s.socialHandle && (
            <p className="mt-6 text-violet-100">
              Also on {s.socialNetworks}: <span className="font-semibold text-white">{s.socialHandle}</span>
            </p>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-slate-950">
        <div className="container py-6">
          <p className="flex gap-2 text-sm text-slate-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong className="text-slate-200">Advertisement.</strong> TechTrendi does not provide this service. Please
              deal directly with {s.name}. Only unlock a phone that you own.
            </span>
          </p>
        </div>
      </div>
      </div>
    </Layout>
  );
}

// Questions as a WhatsApp-style chat: the question is the visitor's green bubble
// (a button), the answer comes back as a white bubble. First one open on load.
function FaqChat({ faqs }: { faqs: Sponsor["faqs"] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="mt-8 space-y-3">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} data-reveal style={delay(i)} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${i}`}
              className={`flex min-h-12 max-w-[88%] items-center gap-3 self-end rounded-2xl rounded-br-md px-4 py-3 text-left font-semibold shadow-sm transition-colors duration-300 ${
                isOpen ? "bg-[#075e54] text-white" : "bg-[#dcf8c6] text-[#064e3b] hover:bg-[#c9f2ad]"
              }`}
            >
              <span>{f.q}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div id={`faq-answer-${i}`} className="sp-bubble flex max-w-[88%] items-end gap-2 self-start">
                <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-[11px] font-extrabold text-white">CX</span>
                <p className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 leading-relaxed text-foreground shadow-sm">{f.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Phones: one full-width card at a time (no peek of the next), swipe with snap,
// dots + "Swipe" hint. sm and up: the usual 2-column grid.
function ServiceSlider({ services }: { services: Sponsor["services"] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const t = trackRef.current;
    if (!t) return;
    let best = 0;
    Array.from(t.children).forEach((c, i) => {
      const d = Math.abs((c as HTMLElement).offsetLeft - t.scrollLeft);
      if (d < Math.abs((t.children[best] as HTMLElement).offsetLeft - t.scrollLeft)) best = i;
    });
    setActive(best);
  };
  const goTo = (i: number) => {
    const t = trackRef.current;
    const card = t?.children[i] as HTMLElement | undefined;
    if (t && card) t.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  };

  return (
    <div data-reveal className="mt-8">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="sp-noscroll relative flex snap-x snap-mandatory gap-4 overflow-x-auto sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible"
      >
        {services.map((svc, i) => {
          const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
          return (
            <div
              key={svc.title}
              className="group relative w-full shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-300 [scroll-snap-stop:always] hover:-translate-y-1 hover:border-violet-400/60 hover:shadow-xl hover:shadow-violet-500/10 sm:w-auto"
            >
              <div aria-hidden className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-violet-500 to-blue-500 transition-transform duration-500 group-hover:scale-x-100" />
              <div className="flex items-start justify-between">
                <div className="sp-wiggle flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/30">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-3xl font-extrabold text-violet-500/15">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{svc.title}</h3>
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400">{svc.detail}</p>
              <p className="mt-3 leading-relaxed text-muted-foreground">{svc.description}</p>
            </div>
          );
        })}
      </div>
      {services.length > 1 && (
        <div className="mt-5 flex flex-col items-center gap-2 sm:hidden">
          <div className="flex gap-2">
            {services.map((svc, i) => (
              <button
                key={svc.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show service ${i + 1}`}
                aria-current={i === active}
                className={`h-2.5 rounded-full transition-all duration-300 ${i === active ? "w-7 bg-violet-600" : "w-2.5 bg-violet-300 dark:bg-violet-800"}`}
              />
            ))}
          </div>
          <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            {active + 1} of {services.length} · Swipe <ArrowRight className="sp-nudge h-4 w-4" />
          </p>
        </div>
      )}
    </div>
  );
}

function ContactButtons({ s, pathname, className = "" }: { s: Sponsor; pathname: string; className?: string }) {
  const whatsapp = `https://wa.me/${s.phone}?text=${encodeURIComponent(s.whatsappMessage)}`;
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <a
        href={whatsapp}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        onClick={() => trackEvents.sponsorClick(s.slug, "whatsapp", pathname)}
        className="cta-sheen sp-ring inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-lg font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:brightness-110 sm:w-auto sm:flex-1"
      >
        <MessageCircle className="h-6 w-6" /> Chat on WhatsApp <ArrowRight className="h-5 w-5" />
      </a>
      <a
        href={`tel:+${s.phone}`}
        rel="sponsored nofollow"
        onClick={() => trackEvents.sponsorClick(s.slug, "call", pathname)}
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 text-lg font-bold text-white transition hover:bg-white/20 sm:w-auto sm:flex-1"
      >
        <Phone className="h-6 w-6" /> Call {s.phoneDisplay}
      </a>
    </div>
  );
}
