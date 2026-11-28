// techtrendi.com/s/<code> — the safety stop. It never jumps straight to the other site:
// it shows where the link goes and the visitor decides. No ads on this page
// (see AdsenseRestore.tsx and index.html).
import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { ShieldCheck, AlertTriangle, ArrowRight, Flag, Link2 } from "lucide-react";
import { followShortLink, getShortLink, reportShortLink, type PublicLink } from "@/lib/shortLinks";

type Load = { state: "loading" } | { state: "error" } | { state: "ready"; link: PublicLink };

export default function ShortLink() {
  const { code = "" } = useParams();
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [going, setGoing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportFailed, setReportFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getShortLink(code).then((link) => {
      if (!alive) return;
      setLoad(link ? { state: "ready", link } : { state: "error" });
    });
    return () => {
      alive = false;
    };
  }, [code]);

  const go = async () => {
    if (load.state !== "ready" || load.link.status !== "active") return;
    const shown = load.link.url;
    setGoing(true);
    let target: string | null = shown;
    try {
      // Count the click; if the link was paused a moment ago, this returns null.
      // A slow connection must not trap the visitor: after 3 seconds go to the address they saw.
      target = await Promise.race([
        followShortLink(code),
        new Promise<string>((resolve) => setTimeout(() => resolve(shown), 3000)),
      ]);
    } catch {
      // counting failed: still let the visitor continue to the address they saw
    }
    if (!target || !/^https?:\/\//i.test(target)) {
      setGoing(false);
      setLoad({ state: "ready", link: { status: "gone" } });
      return;
    }
    window.location.assign(target);
  };

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  };

  const report = async (reason: string) => {
    setReportFailed(false);
    const ok = await reportShortLink(code, reason);
    if (!ok) {
      setReportFailed(true); // keep the choices open so the visitor can try again
      return;
    }
    setReported(true);
    setReportOpen(false);
  };

  return (
    <Layout>
      <SEOHead
        title="Where this link goes | TechTrendi"
        description="TechTrendi short links show you where they go before you open them."
        canonicalUrl="https://techtrendi.com/tools/url-shortener"
        noindex
      />
      <div className="container max-w-xl px-4 py-10 md:py-16">
        {load.state === "loading" && (
          <p className="py-16 text-center text-muted-foreground">Checking this link…</p>
        )}

        {load.state === "error" && (
          <Notice title="We couldn't check this link right now" icon="warn">
            Please check your internet and open the link again in a minute.
          </Notice>
        )}

        {load.state === "ready" && (load.link.status === "missing" || load.link.status === "gone") && (
          <Notice title="This short link doesn't work" icon="warn">
            It may have been typed wrongly, or the person who made it removed it.
          </Notice>
        )}

        {load.state === "ready" && load.link.status === "paused" && (
          <Notice title="This link is paused" icon="warn">
            People reported this link, so we have paused it while we check it. It was going to{" "}
            <strong className="break-all text-foreground">{load.link.host}</strong>. Don't look for it another way
            unless you fully trust the person who sent it.
          </Notice>
        )}

        {load.state === "ready" && load.link.status === "active" && (
          <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-8">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-primary">
              <ShieldCheck className="h-5 w-5" />
              TechTrendi link check
            </div>

            <p className="text-base text-muted-foreground">You are going to:</p>
            <p className="mt-1 break-all text-3xl font-bold leading-tight text-foreground md:text-4xl">
              {load.link.host}
            </p>
            <p className="mt-3 break-all rounded-lg bg-muted px-3 py-2 font-mono text-sm text-muted-foreground">
              {load.link.url}
            </p>

            {load.link.host.split(".").some((part) => part.startsWith("xn--")) && (
              <p className="mt-4 flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                This site name uses unusual letters. Scam sites do this to look like a real site. Be very careful.
              </p>
            )}

            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li>• Someone shared this link. TechTrendi did not check the site it opens.</li>
              <li>• Look at the site name above. Is it the site you expected?</li>
              <li>• Never type your MoMo PIN, bank PIN or a code sent to your phone on a site you were sent to.</li>
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={go}
                disabled={going}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60"
              >
                {going ? "Opening…" : "Continue"}
                {!going && <ArrowRight className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={goBack}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-lg border px-5 font-semibold"
              >
                Don't go
              </button>
            </div>

            <div className="mt-6 border-t pt-4 text-sm">
              {reported ? (
                <p className="text-muted-foreground">Thank you. We will look at this link.</p>
              ) : reportOpen ? (
                <div className="space-y-2">
                  <p className="font-medium">What is wrong with this link?</p>
                  {reportFailed && (
                    <p role="alert" className="text-red-600 dark:text-red-400">
                      We couldn't send your report. Check your internet and tap again.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {["It's a scam or fake site", "It has bad or adult content", "Something else"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => report(r)}
                        className="rounded-full border px-3 py-1.5 hover:bg-muted"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Flag className="h-4 w-4" />
                  Report this link
                </button>
              )}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <a href="/tools/url-shortener" className="inline-flex items-center gap-1.5 text-primary hover:underline">
            <Link2 className="h-4 w-4" />
            Make your own safe short link
          </a>
        </p>
      </div>
    </Layout>
  );
}

function Notice({ title, icon, children }: { title: string; icon: "warn"; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6 text-center shadow-sm md:p-8">
      {icon === "warn" && <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />}
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-3 text-muted-foreground">{children}</p>
    </div>
  );
}
