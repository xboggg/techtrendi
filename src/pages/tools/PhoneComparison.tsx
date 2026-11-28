import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Smartphone, ExternalLink, ShieldCheck, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Rebuilt 28 Nov 2026. The old page scraped GSMArena (now behind a Cloudflare bot
// check) and fell back to AI guesses, which gave wrong specs. Now every phone comes
// from techtrendi.phones: specs copied from the maker's own website and checked
// against that page (/opt/tech-news/phones/desk.py on the server), and a phone only
// shows after Edmund taps "Add" in Telegram. New phones are found every week.

interface Phone {
  slug: string;
  brand: string;
  model: string;
  specs: Record<string, string>;
  source_url: string;
  checked_at: string;
}

const FIELDS: [string, string][] = [
  ["display", "Screen"],
  ["refresh_rate", "Screen refresh"],
  ["chipset", "Processor"],
  ["ram", "RAM"],
  ["storage", "Storage"],
  ["card_slot", "Memory card"],
  ["main_camera", "Main camera"],
  ["selfie_camera", "Selfie camera"],
  ["video", "Video recording"],
  ["battery", "Battery"],
  ["charging", "Charging"],
  ["network", "Network"],
  ["sim", "SIM"],
  ["water_resistance", "Water and dust"],
  ["os", "Software"],
  ["weight", "Weight"],
  ["dimensions", "Size"],
  ["colours", "Colours"],
  ["announced", "Released"],
];

/** First number before a unit, e.g. "6500mAh" -> 6500, used to mark the bigger value. */
function amount(value: string | undefined, unit: RegExp): number | null {
  if (!value) return null;
  const m = value.match(new RegExp("(\\d+(?:\\.\\d+)?)\\s*" + unit.source, "i"));
  return m ? parseFloat(m[1]) : null;
}
const BIGGER_IS_BETTER: Record<string, RegExp> = { battery: /mah/, charging: /w\b/ };

const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// null = the link has no such parameter; "" = the parameter is there but empty
function readParam(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

function PhonePicker({ id, label, phones, value, onChange }: {
  id: string; label: string; phones: Phone[]; value: string; onChange: (slug: string) => void;
}) {
  const brands = useMemo(() => [...new Set(phones.map((p) => p.brand))], [phones]);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base"
      >
        <option value="">Choose a phone</option>
        {brands.map((b) => (
          <optgroup key={b} label={b}>
            {phones.filter((p) => p.brand === b).map((p) => (
              <option key={p.slug} value={p.slug}>{p.brand} {p.model}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export default function PhoneComparison() {
  const [phones, setPhones] = useState<Phone[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- techtrendi schema table is not in the generated types (same as techEvents.ts)
    (supabase as any)
      .from("phones")
      .select("slug,brand,model,specs,source_url,checked_at")
      .order("brand")
      .order("model")
      .then(({ data, error }: { data: Phone[] | null; error: unknown }) => {
        if (!alive) return;
        if (error || !data) {
          setFailed(true);
          setPhones([]);
          return;
        }
        setPhones(data);
        const slugs = new Set(data.map((p) => p.slug));
        const qa = readParam("a");
        const qb = readParam("b");
        // Default pair only when the link names no phones at all; a shared link keeps
        // exactly what it says, including an empty choice.
        const fromLink = qa !== null || qb !== null;
        const pick = (q: string | null, fallback: string) =>
          q !== null && slugs.has(q) ? q : fromLink ? "" : fallback;
        setA(pick(qa, data[0]?.slug ?? ""));
        setB(pick(qb, data[1]?.slug ?? ""));
      });
    return () => {
      alive = false;
    };
  }, []);

  // Shareable link: ?a=<slug>&b=<slug>. Written only after the list has loaded, so the
  // link a visitor arrived with is never overwritten before it is read. A cleared choice
  // is kept as an empty parameter (a=) so a reload or a shared link stays cleared.
  useEffect(() => {
    if (!phones || failed) return;
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("a", a);
      u.searchParams.set("b", b);
      window.history.replaceState(null, "", u.toString());
    } catch {
      // ignore
    }
  }, [a, b, phones, failed]);

  const pa = phones?.find((p) => p.slug === a);
  const pb = phones?.find((p) => p.slug === b);
  const rows = FIELDS.filter(([k]) => pa?.specs?.[k] || pb?.specs?.[k]);

  const better = (key: string, side: "a" | "b") => {
    const unit = BIGGER_IS_BETTER[key];
    if (!unit) return false;
    const x = amount(pa?.specs?.[key], unit);
    const y = amount(pb?.specs?.[key], unit);
    if (x === null || y === null || x === y) return false;
    return side === "a" ? x > y : y > x;
  };

  const SourceLine = ({ p }: { p: Phone }) => (
    <div className="space-y-1 text-xs text-muted-foreground">
      <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
        Specs from {host(p.source_url)} <ExternalLink className="h-3 w-3" />
      </a>
      <div>Checked {day(p.checked_at)}</div>
      <a
        href={`https://www.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(`${p.brand} ${p.model}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 underline"
      >
        More on GSMArena <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );

  return (
    <Layout>
      <SEOHead
        title="Phone Comparison - Compare Phone Specs Side by Side"
        description="Compare Samsung, Tecno, Infinix, itel, iPhone and Xiaomi phones side by side. Every spec is taken from the maker's own website and checked."
        canonical="/tools/phone-comparison"
        keywords={["phone comparison", "compare phones", "phone specs", "tecno vs samsung", "infinix vs tecno", "phone vs phone"]}
      />
      <div className="container max-w-5xl py-10 md:py-16">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 to-zinc-700">
            <Smartphone className="h-7 w-7 text-white" />
          </div>
          <h1 className="mb-3 text-3xl font-bold md:text-4xl">Phone Comparison</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Pick two phones and see their specs side by side. Every spec comes from the phone maker's own website and is checked against that page.
          </p>
        </div>

        {phones === null ? (
          <p className="py-16 text-center text-muted-foreground" aria-busy="true">Loading phones...</p>
        ) : failed || phones.length < 2 ? (
          <p className="py-16 text-center text-muted-foreground">
            The phone list could not be loaded right now. Please try again in a minute.
          </p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <PhonePicker id="phone-a" label="First phone" phones={phones} value={a} onChange={setA} />
              <button
                type="button"
                onClick={() => { setA(b); setB(a); }}
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-input hover:bg-muted"
                aria-label="Swap phones"
              >
                <ArrowLeftRight className="h-5 w-5" />
              </button>
              <PhonePicker id="phone-b" label="Second phone" phones={phones} value={b} onChange={setB} />
            </div>
            <p className="mb-8 text-center text-xs text-muted-foreground">{phones.length} phones · new models added every week</p>

            {pa && pb && (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[minmax(84px,0.7fr)_1fr_1fr] bg-muted/60 text-sm font-semibold">
                  <div className="p-3" />
                  <div className="border-l border-border p-3">{pa.brand} {pa.model}</div>
                  <div className="border-l border-border p-3">{pb.brand} {pb.model}</div>
                </div>
                {rows.map(([key, label], i) => (
                  <div
                    key={key}
                    className={`grid grid-cols-[minmax(84px,0.7fr)_1fr_1fr] text-sm ${i % 2 ? "bg-muted/20" : ""}`}
                  >
                    <div className="p-3 font-medium text-muted-foreground">{label}</div>
                    {(["a", "b"] as const).map((side) => {
                      const p = side === "a" ? pa : pb;
                      const v = p.specs[key];
                      return (
                        <div key={side} className="break-words border-l border-border p-3">
                          {v ? (
                            <span className={better(key, side) ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
                              {v}
                            </span>
                          ) : (
                            <span className="text-muted-foreground" title="The maker's page does not say">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="grid grid-cols-[minmax(84px,0.7fr)_1fr_1fr] border-t border-border text-sm">
                  <div className="p-3 font-medium text-muted-foreground">Source</div>
                  <div className="border-l border-border p-3"><SourceLine p={pa} /></div>
                  <div className="border-l border-border p-3"><SourceLine p={pb} /></div>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p>
                A dash (—) means the maker's website does not say, so we leave it blank instead of guessing.
                Prices are not shown because they change from shop to shop. Some models are sold in Ghana with
                different memory sizes than listed.
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
