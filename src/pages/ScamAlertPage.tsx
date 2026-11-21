import { useEffect, useState } from "react";
import { Link, useLoaderData, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, Loader2, Phone, ShieldAlert, ShieldCheck } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ScamScreenshot, alertImages } from "@/components/security/ScamScreenshot";
import { ScamAlertShareBar } from "@/components/security/ScamAlertShare";
import {
  type ScamAlert,
  ALERT_COLUMNS,
  SLUG_RE,
  alertDate,
  alertPath,
  alertShareImage,
  alertSummary,
  severityConfig,
} from "@/lib/scamAlerts";

// One scam alert on its own page (21 Nov 2026, owner: "are they individually sharable?").
// /scam-alerts/<slug>: prerendered from src/ssg/news-data.ts (scamAlertLoader) so Google and
// link previews see the title and picture; an alert added after the last build is fetched
// here in the browser. Share buttons share THIS page. Dates are fixed ("21 Nov 2026", Ghana
// time), never "2h ago", so the prerendered page and the browser match.

type Other = { slug: string; title: string; emoji?: string | null; created_at?: string };
type LoaderData = { alert: ScamAlert; others: Other[] } | null;

export default function ScamAlertPage() {
  const { slug = "" } = useParams();
  const loaded = (useLoaderData() as LoaderData) ?? null;
  const [alert, setAlert] = useState<ScamAlert | null>(loaded?.alert ?? null);
  const [others, setOthers] = useState<Other[]>(loaded?.others ?? []);
  const [loading, setLoading] = useState(!loaded?.alert);

  useEffect(() => {
    let live = true;
    if (!SLUG_RE.test(slug)) { setLoading(false); return; }
    // Fresh copy (an edit after the build shows at once); the build copy stays on any error.
    supabase
      .from("security_scam_alerts")
      .select(ALERT_COLUMNS)
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!live) return;
        if (data) setAlert(data as unknown as ScamAlert);
        setLoading(false);
      }, () => { if (live) setLoading(false); });
    supabase
      .from("security_scam_alerts")
      .select("slug,title,emoji,created_at")
      .neq("slug", slug)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (live && Array.isArray(data) && data.length) setOthers(data.filter((o) => o.slug) as Other[]);
      }, () => {});
    return () => { live = false; };
  }, [slug]);

  if (!alert) {
    return (
      <Layout>
        <SEOHead title="Scam alert not found" description="This scam alert is not available. See the latest scam alerts on TechTrendi." canonical="/scam-alerts" noindex />
        <section className="max-w-3xl mx-auto px-4 py-24 text-center">
          {loading ? (
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
          ) : (
            <>
              <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">This alert is not available</h1>
              <p className="text-muted-foreground mb-6">It may have been removed. The latest warnings are on the Scam Alerts page.</p>
              <Link to="/scam-alerts" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700">
                See all scam alerts <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </section>
      </Layout>
    );
  }

  const severity = severityConfig[alert.severity] || severityConfig.medium;
  const images = alertImages(alert);
  const path = alertPath(alert);

  return (
    <Layout>
      <SEOHead
        title={`Scam Alert: ${alert.title}`}
        description={alertSummary(alert.description)}
        canonical={path}
        image={alertShareImage(alert)}
        imageAlt={`Scam alert: ${alert.title}`}
        type="article"
        publishedTime={alert.created_at}
        category="Scam Alerts"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Security", path: "/security" },
          { name: "Scam Alerts", path: "/scam-alerts" },
          { name: alert.title, path },
        ]}
      />

      <article className="max-w-3xl mx-auto px-4 pt-6 pb-16">
        <Link to="/scam-alerts" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> All scam alerts
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> Scam alert
          </span>
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold", severity.bg, severity.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", severity.dot)} />
            {severity.label}
          </span>
          {alert.scam_type && <span className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">{alert.scam_type}</span>}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" /> {alertDate(alert.created_at)}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-4">
          {alert.emoji ? `${alert.emoji} ` : ""}{alert.title}
        </h1>

        <p className="text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-line mb-5">{alert.description}</p>

        {images.length > 0 && <ScamScreenshot srcs={images} title={alert.title} className="mb-5" />}

        {alert.affected_platforms && alert.affected_platforms.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {alert.affected_platforms.map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-md bg-muted border border-border text-xs text-muted-foreground">{p}</span>
            ))}
          </div>
        )}

        {alert.what_to_do && (
          <div className="rounded-2xl border-l-4 border-emerald-500 bg-emerald-500/10 p-4 mb-8">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> What to do
            </p>
            <p className="text-[15px] text-foreground/85 mt-1.5 leading-relaxed whitespace-pre-line">{alert.what_to_do}</p>
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-1">Warn your friends and family</h2>
          <p className="text-sm text-muted-foreground mb-4">Share this alert. One message can save someone's money.</p>
          <ScamAlertShareBar alert={alert} />
        </section>

        <div className="flex flex-wrap gap-2 mb-12">
          <a href="tel:292" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
            <Phone className="w-4 h-4" /> Report to CSA (292)
          </a>
          <Link to="/report-scam" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-muted/70">
            <ShieldAlert className="w-4 h-4" /> Report a scam to TechTrendi
          </Link>
        </div>

        {others.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">More scam alerts</h2>
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link to={alertPath(o)} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50">
                    <span className="text-xl leading-none mt-0.5">{o.emoji || "🚨"}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{o.title}</span>
                      {o.created_at && <span className="block text-xs text-muted-foreground mt-0.5">{alertDate(o.created_at)}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/scam-alerts" className="inline-flex items-center gap-1.5 mt-4 text-primary font-medium hover:gap-2.5 transition-all">
              See all scam alerts <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        )}
      </article>
    </Layout>
  );
}
