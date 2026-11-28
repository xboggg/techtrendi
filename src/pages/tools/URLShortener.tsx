import { useCallback, useEffect, useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { QRCodeCanvas } from "qrcode.react";
import {
  Link2, Copy, Check, Trash2, QrCode, ShieldCheck, Download, MousePointerClick, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useMounted } from "@/hooks/useMounted";
import {
  CREATE_ERRORS, SHORT_BASE, createShortLink, deleteShortLink, forgetLink, linkStats, loadLinks, normaliseUrl,
  type LinkStats, type SavedLink,
} from "@/lib/shortLinks";

const shortUrl = (code: string) => SHORT_BASE + code;
const shortLabel = (code: string) => "techtrendi.com/s/" + code;
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

function QrBox({ code }: { code: string }) {
  const box = useRef<HTMLDivElement>(null);
  const download = () => {
    const canvas = box.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `techtrendi-${code}-qr.png`;
    a.click();
  };
  return (
    <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
      <div ref={box}>
        <QRCodeCanvas value={shortUrl(code)} size={160} level="M" marginSize={2} />
      </div>
      <div className="text-center text-sm text-neutral-700 sm:text-left">
        <p>Print this on a flyer or show it on your phone. Scanning it opens your short link.</p>
        <button
          type="button"
          onClick={download}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 font-medium text-neutral-900 hover:bg-neutral-100"
        >
          <Download className="h-4 w-4" /> Save QR picture
        </button>
      </div>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      toast.error("Couldn't copy. Press and hold the link to copy it.");
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
    >
      {done ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      {done ? "Copied" : label}
    </button>
  );
}

export default function URLShortener() {
  const mounted = useMounted();
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [latest, setLatest] = useState<SavedLink | null>(null);
  const [saved, setSaved] = useState<SavedLink[]>([]);
  const [stats, setStats] = useState<Record<string, LinkStats>>({});
  const [statsFailed, setStatsFailed] = useState(false);
  const [qrFor, setQrFor] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const links = loadLinks();
    setSaved(links);
    const s = await linkStats(links);
    if (!s) {
      setStatsFailed(true);
      return;
    }
    setStatsFailed(false);
    setStats(Object.fromEntries(s.map((x) => [x.code, x])));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const make = async () => {
    setError("");
    const full = normaliseUrl(url);
    if (!full) {
      setError(CREATE_ERRORS.invalid);
      return;
    }
    setBusy(true);
    const res = await createShortLink(full, alias.trim().toLowerCase());
    setBusy(false);
    if (!res.ok) {
      setError(CREATE_ERRORS[res.error]);
      return;
    }
    setLatest(res.link);
    setQrFor(null);
    setUrl("");
    setAlias("");
    refresh();
  };

  const remove = async (link: SavedLink) => {
    if (!window.confirm(`Remove ${shortLabel(link.code)}? Anyone who opens it will see that it no longer works.`)) return;
    const ok = await deleteShortLink(link);
    if (!ok) {
      toast.error("Couldn't remove it right now. Please try again.");
      return;
    }
    if (latest?.code === link.code) setLatest(null);
    toast.success("Link removed");
    refresh();
  };

  const whatsapp = (code: string) => `https://wa.me/?text=${encodeURIComponent(shortUrl(code))}`;

  return (
    <Layout>
      <SEOHead
        title="URL Shortener - Free Short Links with a Safety Check | TechTrendi"
        description="Turn a long link into a short techtrendi.com link, free and without signing up. Every link shows people where it goes before they open it. Count clicks and get a QR code."
        canonicalUrl="https://techtrendi.com/tools/url-shortener"
      />

      <div className="container max-w-3xl px-4 py-10 md:py-16">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <Link2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">URL Shortener</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Turn a long link into a short one. Free, no sign-up. Anyone who opens your link first sees where it goes.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <label htmlFor="long-url" className="text-sm font-medium">Your long link</label>
          <input
            id="long-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && make()}
            placeholder="https://example.com/a/very/long/link"
            className="mt-1 h-12 w-full rounded-lg border border-input bg-background px-3 text-base"
          />

          <label htmlFor="alias" className="mt-4 block text-sm font-medium">
            Custom name <span className="font-normal text-muted-foreground">(you can leave this empty)</span>
          </label>
          <div className="mt-1 flex items-center overflow-hidden rounded-lg border border-input bg-background">
            <span className="shrink-0 pl-3 text-sm text-muted-foreground">techtrendi.com/s/</span>
            <input
              id="alias"
              autoComplete="off"
              autoCapitalize="none"
              value={alias}
              onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && !busy && make()}
              placeholder="my-shop"
              maxLength={30}
              className="h-12 min-w-0 flex-1 bg-transparent px-1 text-base outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={make}
            disabled={busy || !url.trim()}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Link2 className="h-4 w-4" />
            {busy ? "Making your link…" : "Make short link"}
          </button>
        </div>

        {latest && (
          <div className="mt-6 rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 md:p-6">
            <p className="text-sm font-medium text-muted-foreground">Your short link is ready:</p>
            <p className="mt-1 break-all text-2xl font-bold text-primary">{shortLabel(latest.code)}</p>
            <p className="mt-1 break-all text-sm text-muted-foreground">Opens: {latest.url}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CopyButton text={shortUrl(latest.code)} label="Copy link" />
              <a
                href={whatsapp(latest.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <MessageCircle className="h-4 w-4" /> Share on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setQrFor(qrFor === latest.code ? null : latest.code)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <QrCode className="h-4 w-4" /> QR code
              </button>
            </div>
            {qrFor === latest.code && <QrBox code={latest.code} />}
          </div>
        )}

        <div className="mt-6 flex gap-3 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>
            <strong className="text-foreground">Why the safety check?</strong> Scammers hide fake sites behind short
            links. So every TechTrendi short link first shows the real site name, and people tap Continue only if it is
            the site they expected. Anyone can report a bad link, and reported links are paused.
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Your links</h2>
          {!mounted ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading your links…</p>
          ) : saved.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Links you make will show here, with how many times people opened them.</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Saved on this phone or computer only. If you clear your browser you lose this list, but your links keep working.
              </p>
              {statsFailed && (
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Couldn't load the click counts right now.</p>
              )}
              <ul className="mt-4 space-y-3">
                {saved.map((link) => {
                  const s = stats[link.code];
                  const gone = !statsFailed && !s;
                  return (
                    <li key={link.code} className="rounded-xl border bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="break-all font-semibold text-primary">{shortLabel(link.code)}</p>
                          <p className="break-all text-sm text-muted-foreground">{link.url}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Made {day(link.created_at)}
                            {s?.last_click_at ? ` · last opened ${day(s.last_click_at)}` : ""}
                            {s?.status === "paused" ? " · paused after reports, we are checking it" : ""}
                            {gone ? " · removed" : ""}
                          </p>
                        </div>
                        <div className="shrink-0 rounded-lg bg-primary/10 px-3 py-2 text-center">
                          <p className="flex items-center justify-center gap-1 text-xl font-bold text-primary">
                            <MousePointerClick className="h-4 w-4" />
                            {s ? s.clicks : "–"}
                          </p>
                          <p className="text-xs text-muted-foreground">opened</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!gone && <CopyButton text={shortUrl(link.code)} />}
                        {!gone && (
                          <button
                            type="button"
                            onClick={() => setQrFor(qrFor === link.code ? null : link.code)}
                            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                          >
                            <QrCode className="h-4 w-4" /> QR code
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => (gone ? (forgetLink(link.code), refresh()) : remove(link))}
                          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" /> {gone ? "Clear from list" : "Remove"}
                        </button>
                      </div>
                      {qrFor === link.code && !gone && latest?.code !== link.code && <QrBox code={link.code} />}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>
    </Layout>
  );
}
