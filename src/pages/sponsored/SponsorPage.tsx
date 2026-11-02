import { useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { MessageCircle, Phone, ShieldCheck, Smartphone, Signal, Unlock, Zap, Info } from "lucide-react";
import { trackEvents } from "@/lib/gtag";
import { getSponsorBySlug } from "@/data/sponsors";
import NotFound from "../NotFound";

const SERVICE_ICONS = [Smartphone, Unlock, Zap, Signal];

// Full page for a paid sponsor (src/data/sponsors.ts). Labelled "Sponsored",
// noindex (kept out of Google results and the sitemap), outside links marked
// rel="sponsored". One route per sponsor is generated in routes.tsx.
export default function SponsorPage() {
  const { pathname } = useLocation();
  const sponsor = getSponsorBySlug(pathname.replace(/^\/sponsored\//, "").replace(/\/$/, ""));
  if (!sponsor) return <NotFound />;

  const s = sponsor;
  const whatsapp = `https://wa.me/${s.phone}?text=${encodeURIComponent(s.whatsappMessage)}`;
  const outside = { target: "_blank", rel: "sponsored nofollow noopener noreferrer" } as const;

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

      <div className="bg-gradient-to-b from-indigo-950 via-violet-950 to-slate-950 text-white">
        <div className="container max-w-3xl py-10 md:py-16">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200">
            Sponsored
          </span>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/30">
              <Unlock className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{s.name}</h1>
              <p className="mt-1 text-lg text-violet-200 md:text-xl">{s.tagline} 🌍</p>
            </div>
          </div>

          <p className="mt-6 text-lg leading-relaxed text-slate-200">{s.intro}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsapp}
              {...outside}
              onClick={() => trackEvents.sponsorClick(s.slug, "whatsapp", pathname)}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] sm:w-auto sm:flex-1 px-6 text-lg font-bold text-white shadow-lg transition hover:brightness-110"
            >
              <MessageCircle className="h-6 w-6" /> Chat on WhatsApp
            </a>
            <a
              href={`tel:+${s.phone}`}
              rel="sponsored nofollow"
              onClick={() => trackEvents.sponsorClick(s.slug, "call", pathname)}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-white/25 sm:w-auto sm:flex-1 bg-white/10 px-6 text-lg font-bold text-white transition hover:bg-white/20"
            >
              <Phone className="h-6 w-6" /> Call {s.phoneDisplay}
            </a>
          </div>

          <h2 className="mt-12 text-xl font-bold">Services</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {s.services.map((svc, i) => {
              const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
              return (
                <div key={svc.title} className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
                  <div>
                    <p className="font-semibold">{svc.title}</p>
                    <p className="text-sm text-slate-300">{svc.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <p className="font-semibold">{s.promise.title}</p>
              <p className="text-sm text-slate-300">{s.promise.detail}</p>
            </div>
          </div>

          {s.socialHandle && (
            <p className="mt-8 text-slate-300">
              Find them on {s.socialNetworks}: <span className="font-semibold text-white">{s.socialHandle}</span>
            </p>
          )}

          <div className="mt-10 flex gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong className="text-white">Advertisement.</strong> TechTrendi does not provide this service. Please deal
              directly with {s.name}. Only unlock a phone that you own.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
