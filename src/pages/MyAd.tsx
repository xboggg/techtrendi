// /my-ad: a sponsor's owner edits THEIR OWN ad's wording (owner, 2 Nov 2026).
// An admin links the owner's login to the ad in /admin/sponsors. The database lets
// this account read/edit only that row's `content`, and a new picture only as
// pendingHeroImage (waits for admin approval) — see 20261102_sponsors.sql.
// Not prerendered (vite.config skip) and noindex.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, LogIn, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SponsorEditor } from "@/components/sponsored/SponsorEditor";
import { cleanSponsorContent } from "@/components/sponsored/cleanSponsorContent";
import { findBannedWords, type SponsorContent, type SponsorRow } from "@/data/sponsors";

type Row = SponsorRow & { id: string };

export default function MyAd() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SponsorContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("sponsors" as never)
        .select("id, slug, active, show_on, content, updated_at")
        .eq("owner_id", user.id)
        .order("slug");
      if (error) { toast.error("Could not load your ad. Please refresh."); setRows([]); return; }
      const list = ((data as unknown) as Row[]) || [];
      setRows(list);
      if (list[0]) { setSelId(list[0].id); setDraft(list[0].content); }
    })();
  }, [user]);

  const current = rows?.find((r) => r.id === selId) || null;

  const save = async () => {
    if (!current || !draft) return;
    const content = cleanSponsorContent(draft);
    const bad = findBannedWords(content);
    if (bad) { toast.error(`"${bad}" is not allowed on TechTrendi. Please remove it and save again.`); return; }
    if (!/^[0-9]{8,15}$/.test(content.phone)) { toast.error("Phone number: digits only, with country code (e.g. 233546616401)."); return; }
    setSaving(true);
    const { error } = await supabase.from("sponsors" as never).update({ content } as never).eq("id", current.id);
    setSaving(false);
    if (error) { toast.error(error.message || "Not saved. Please try again."); return; }
    setDraft(content);
    setRows((rs) => (rs || []).map((r) => (r.id === current.id ? { ...r, content } : r)));
    toast.success(content.pendingHeroImage ? "Saved. Your new picture will show once TechTrendi approves it." : "Saved. Your page shows the changes now.");
  };

  return (
    <Layout>
      <SEOHead title="My ad" description="Edit your sponsored ad on TechTrendi." canonical="/my-ad" noindex />
      <div className="container max-w-4xl py-8 md:py-12">
        {authLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : !user ? (
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
            <h1 className="text-2xl font-bold">My ad</h1>
            <p className="mt-2 text-muted-foreground">Sign in with the email TechTrendi linked to your ad.</p>
            <Button asChild className="mt-6"><Link to="/auth?next=/my-ad"><LogIn className="mr-2 h-4 w-4" /> Sign in</Link></Button>
          </div>
        ) : rows === null ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : rows.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
            <h1 className="text-2xl font-bold">My ad</h1>
            <p className="mt-2 text-muted-foreground">
              No ad is linked to <strong>{user.email}</strong> yet. Ask TechTrendi to link your ad to this email.
            </p>
          </div>
        ) : current && draft ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold md:text-3xl">My ad: {current.content.name}</h1>
              <a href={`/sponsored/${current.slug}`} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
                View my page <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            {rows.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {rows.map((r) => (
                  <Button key={r.id} variant={r.id === selId ? "default" : "outline"} onClick={() => { setSelId(r.id); setDraft(r.content); }}>
                    {r.content.name}
                  </Button>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Change your wording below and press <strong>Save</strong>. Your page updates straight away.
              {!current.active && " Your ad is switched off at the moment — TechTrendi switches it on."}
            </p>
            <SponsorEditor slug={current.slug} mode="owner" value={draft} onChange={setDraft} />
            <div className="sticky bottom-4 flex justify-end">
              <Button size="lg" onClick={save} disabled={saving} className="shadow-lg">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
