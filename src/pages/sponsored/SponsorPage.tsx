import { useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  MessageCircle, Phone, ShieldCheck, Smartphone, Signal, Unlock, Zap, Info, Check,
  Globe2, Wrench, BadgeCheck, MessagesSquare, ChevronDown, ArrowRight,
} from "lucide-react";
import { trackEvents } from "@/lib/gtag";
import { getSponsorBySlug, type Sponsor } from "@/data/sponsors";
import NotFound from "../NotFound";

const SERVICE_ICONS = [Smartphone, Unlock, Zap, Signal];
const REASON_ICONS = [Wrench, Smartphone, ShieldCheck, MessagesSquare];

// Landing page for a paid sponsor (src/data/sponsors.ts). Labelled "Sponsored",
// noindex (kept out of Google results and the sitemap), outside links marked
// rel="sponsored". One route per sponsor is generated in routes.tsx.
export default function SponsorPage() {
  const { pathname } = useLocation();
  const sponsor = getSponsorBySlug(pathname.replace(/^\/sponsored\//, "").replace(/\/$/, ""));
  if (!sponsor) return <NotFound />;
  const s = sponsor;

  return (
    <Layout>
      <SEOHead
        title={`${s.name} (Sponsored)`}
        description={`${s.name}: ${s.cardText} Contact on WhatsApp or call ${s.phoneDisplay}.`}
        canonical={pathname}
        image={`/sponsored/${s.slug}.jpg`}
        imageAlt={`${s.name} — ${s.tagline}`}
        noindex
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-950 text-white">
        <div aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-fuchsia-600/25 blur-3xl" />
        <div className="container relative grid items-center gap-10 py-10 md:py-16 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200">
              Sponsored · {s.name}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              {s.headline}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-200 md:text-xl">{s.intro}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {s.highlights.map((h) => (
                <li key={h} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-100">
                  <Check className="h-4 w-4 text-emerald-300" /> {h}
                </li>
              ))}
            </ul>
            <ContactButtons s={s} pathname={pathname} className="mt-8" />
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-500/40 to-blue-500/40 blur-2xl" />
            <img
              src={s.heroImage}
              alt={s.heroImageAlt}
              width={560}
              height={520}
              className="relative w-full rounded-3xl border border-white/15 object-cover shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Who it's for */}
      {s.audience && (
        <section className="bg-slate-950 text-white">
          <div className="container py-10">
            <div className="flex flex-col gap-4 rounded-2xl border border-blue-400/25 bg-gradient-to-r from-blue-500/15 to-violet-500/15 p-6 md:flex-row md:items-center md:p-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20">
                <Globe2 className="h-7 w-7 text-blue-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold md:text-2xl">{s.audience.title}</h2>
                <p className="mt-2 leading-relaxed text-slate-300">{s.audience.text}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="bg-background">
        <div className="container py-14 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">What they unlock</p>
          <h2 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">Services</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {s.services.map((svc, i) => {
              const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
              return (
                <div key={svc.title} className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-foreground">{svc.title}</h3>
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">{svc.detail}</p>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{svc.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40">
        <div className="container py-14 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">Simple steps</p>
          <h2 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">How it works</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {s.steps.map((step, i) => (
              <li key={step.title} className="relative rounded-2xl border border-border bg-card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 text-lg font-bold text-foreground">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why choose */}
      <section className="bg-background">
        <div className="container py-14 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">Why {s.name}</p>
          <h2 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">Why people choose them</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {s.reasons.map((r, i) => {
              const Icon = REASON_ICONS[i % REASON_ICONS.length];
              return (
                <div key={r.title} className="rounded-2xl border border-border bg-card p-6">
                  <Icon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="mt-3 font-bold text-foreground">{r.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40">
        <div className="container max-w-3xl py-14 md:py-20">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">Questions people ask</h2>
          <div className="mt-8 space-y-3">
            {s.faqs.map((f) => (
              <details key={f.q} className="group rounded-xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-950 text-white">
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="container relative py-14 text-center md:py-20">
          <BadgeCheck className="mx-auto h-10 w-10 text-emerald-300" />
          <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">Ready to unlock your phone?</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-violet-100">
            Message {s.name} on WhatsApp with your phone model and network. {s.promise.title}.
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
    </Layout>
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
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-lg font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:brightness-110 sm:w-auto sm:flex-1"
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
