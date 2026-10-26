// Data deal posts for the WhatsApp channel (admin only; owner, 23 Oct 2026).
// WhatsApp Channels have no posting API, so nothing is ever posted by itself: each post is
// ready-to-paste text with Copy, Open WhatsApp (wa.me/?text=...) and Mark as posted. Posts come
// from the real changes (ghana-changes.json) and the live prices (the same model the public pages
// use): price cuts, new bundles with top value, a new winner in Small buys or Any price, and the
// weekly "best data deals this week" post (Monday). "Posted" marks are kept in this browser
// (localStorage) — no database table. Admin access: AdminLayout, as every admin page.
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, CheckCheck, RotateCcw, Smartphone } from "lucide-react";
import { useBundleData } from "@/hooks/useBundleData";
import { useBundleChanges } from "@/hooks/useBundleChanges";
import { dealPosts, whatsappLink, type DealPost } from "@/lib/bundleChanges";
import { DATA_BUNDLES_BASE } from "@/data/dataBundlesRoute";

const POSTED_KEY = "tt-deal-posts-posted";

function readPosted(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(POSTED_KEY) || "{}") || {}; } catch { return {}; }
}
function writePosted(v: Record<string, string>) {
  try { localStorage.setItem(POSTED_KEY, JSON.stringify(v)); } catch { /* private mode: marks last for this visit only */ }
}

const KIND_LABEL: Record<DealPost["kind"], string> = { price_drop: "Price cut", new_value: "New bundle", new_winner: "New winner", weekly: "Weekly" };

export default function AdminDataDeals() {
  const { toast } = useToast();
  const data = useBundleData("ghana");
  const changesState = useBundleChanges("ghana");
  const changes = changesState?.status === "ok" ? changesState.doc : null;
  const [posted, setPosted] = useState<Record<string, string>>({});
  useEffect(() => { setPosted(readPosted()); }, []);
  const posts = useMemo(() => (data ? dealPosts(data.model, changes, new Date(), data.freshness.checkedAt, `${DATA_BUNDLES_BASE}/${data.country.id}`) : []), [data, changes]);

  const mark = (id: string, on: boolean) => {
    const next = { ...posted };
    if (on) next[id] = new Date().toISOString(); else delete next[id];
    setPosted(next);
    writePosted(next);
  };
  const copy = async (p: DealPost) => {
    try { await navigator.clipboard.writeText(p.text); toast({ title: "Copied", description: "Paste it in the WhatsApp channel." }); }
    catch { toast({ title: "Could not copy", description: "Select the text and copy it by hand.", variant: "destructive" }); }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Smartphone className="h-6 w-6" aria-hidden /> Data deal posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ready-to-paste posts for the WhatsApp channel, from the real price changes and today's prices. Nothing is posted by itself.
            {data && <> Prices checked {new Date(data.freshness.checkedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} GMT (Ghana time).</>}
          </p>
        </div>
        {!data && <p className="text-muted-foreground">Loading prices…</p>}
        {data && posts.length === 0 && <p className="text-muted-foreground">No posts right now.</p>}
        <ul className="space-y-4" data-testid="deal-posts">
          {posts.map((p) => {
            const done = posted[p.id];
            return (
              <li key={p.id} className="rounded-xl border border-border bg-card p-4" data-testid="deal-post" data-kind={p.kind} data-posted={done ? "1" : "0"}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{KIND_LABEL[p.kind]}</Badge>
                  <h2 className="font-semibold">{p.title}</h2>
                  {done && <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Posted {new Date(done).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</Badge>}
                </div>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 font-sans text-sm" data-testid="deal-post-text">{p.text}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => copy(p)}><Copy className="mr-1.5 h-4 w-4" aria-hidden /> Copy</Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={whatsappLink(p.text)} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" aria-hidden /> Open WhatsApp</a>
                  </Button>
                  {done
                    ? <Button size="sm" variant="ghost" onClick={() => mark(p.id, false)}><RotateCcw className="mr-1.5 h-4 w-4" aria-hidden /> Not posted</Button>
                    : <Button size="sm" onClick={() => mark(p.id, true)}><CheckCheck className="mr-1.5 h-4 w-4" aria-hidden /> Mark as posted</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AdminLayout>
  );
}
