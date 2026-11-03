// Paid sponsor ads (owner, 2 Nov 2026). Create ads, switch them on/off, choose the
// pages that show the "Sponsored" card, link each ad to its owner's login (they then
// edit the wording at /my-ad), approve the owner's new picture, and edit everything.
// Table: techtrendi.sponsors (supabase/migrations/20261102_sponsors.sql).
// New ads and card/page changes reach the site on the next build (daily 11:30 UTC
// or any deploy); wording edits show on the ad's page at once.
import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Check, ExternalLink, Loader2, Megaphone, Plus, Save, UserRound, X } from "lucide-react";
import toast from "react-hot-toast";
import { SponsorEditor } from "@/components/sponsored/SponsorEditor";
import { SPONSOR_PAGES, emptySponsorContent, findBannedWords, type SponsorContent, type SponsorRow } from "@/data/sponsors";
import { cleanSponsorContent } from "@/components/sponsored/cleanSponsorContent";

type Row = SponsorRow & { id: string };

export default function AdminSponsors() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SponsorContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("sponsors" as never).select("*").order("sort_order").order("slug");
    if (error) toast.error("Could not load the ads");
    setRows(((data as unknown) as Row[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const editing = rows.find((r) => r.id === editId) || null;
  const open = (r: Row) => { setEditId(r.id); setDraft(r.content); setOwnerEmail(r.owner_email || ""); window.scrollTo({ top: 0 }); };

  const update = async (id: string, patch: Partial<Row>, okText: string) => {
    const { error } = await supabase.from("sponsors" as never).update(patch as never).eq("id", id);
    if (error) { toast.error(error.message || "Not saved"); return false; }
    toast.success(okText);
    await load();
    return true;
  };

  const saveContent = async () => {
    if (!editing || !draft) return;
    const content = cleanSponsorContent(draft);
    const bad = findBannedWords(content);
    if (bad) { toast.error(`Not allowed on TechTrendi: "${bad}". Please remove it.`); return; }
    if (!/^[0-9]{8,15}$/.test(content.phone)) { toast.error("Phone number: digits only, with country code (e.g. 233546616401)."); return; }
    setSaving(true);
    const ok = await update(editing.id, { content }, "Saved. The ad page shows it now.");
    setSaving(false);
    if (ok) setDraft(content);
  };

  const approvePicture = async (r: Row, approve: boolean) => {
    const { pendingHeroImage, ...rest } = r.content;
    const content = approve && pendingHeroImage ? { ...rest, heroImage: pendingHeroImage } : rest;
    if (await update(r.id, { content: content as SponsorContent }, approve ? "Picture approved — it's on the page now." : "Picture rejected.")) {
      if (editId === r.id) setDraft(content as SponsorContent);
    }
  };

  const togglePage = (r: Row, path: string, on: boolean) => {
    const show_on = on ? [...new Set([...r.show_on, path])] : r.show_on.filter((p) => p !== path);
    update(r.id, { show_on }, "Pages updated (cards change on the next site update).");
  };

  const saveOwner = async () => {
    if (!editing) return;
    const { data, error } = await supabase.rpc("set_sponsor_owner" as never, { _sponsor: editing.id, _email: ownerEmail } as never);
    if (error) { toast.error(error.message); return; }
    if (data === false) { toast.error("No account with that email. Ask them to sign up on TechTrendi first, then try again."); return; }
    toast.success(ownerEmail.trim() ? "Owner linked. They can now edit this ad at techtrendi.com/my-ad" : "Owner removed.");
    load();
  };

  const createAd = async () => {
    const slug = newSlug.trim().toLowerCase();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) { toast.error("Address: small letters, numbers and dashes only, e.g. kofi-phones"); return; }
    if (!newName.trim()) { toast.error("Please type the business name."); return; }
    if (!/^[0-9]{8,15}$/.test(newPhone)) { toast.error("Phone number: digits only, with country code (e.g. 233546616401)."); return; }
    const content = { ...emptySponsorContent(), name: newName.trim(), phone: newPhone, phoneDisplay: `+${newPhone}` };
    const { error } = await supabase.from("sponsors" as never).insert({ slug, active: false, content } as never);
    if (error) { toast.error(error.message.includes("duplicate") ? "That address is already used." : error.message); return; }
    toast.success("Ad created (switched off). Fill it in, then switch it on.");
    setNewSlug(""); setNewName(""); setNewPhone("");
    load();
  };

  // ---- Edit view ----
  if (editing && draft) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-4xl space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={() => { setEditId(null); setDraft(null); }}><ArrowLeft className="mr-1 h-4 w-4" /> All ads</Button>
            <h1 className="text-2xl font-bold">{editing.content.name || editing.slug}</h1>
            <a href={`/sponsored/${editing.slug}`} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
              View page <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <section className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4">
            <h2 className="text-lg font-bold">Settings (admin only)</h2>
            <div className="flex items-center gap-3">
              <Switch checked={editing.active} onCheckedChange={(v) => update(editing.id, { active: v }, v ? "Ad switched ON." : "Ad switched OFF.")} />
              <span className="font-semibold">{editing.active ? "Showing on the site" : "Switched off"}</span>
            </div>
            <p className="text-sm text-muted-foreground">Page address: <strong>techtrendi.com/sponsored/{editing.slug}</strong></p>
            <div>
              <Label className="font-semibold">Show the "Sponsored" card on:</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {SPONSOR_PAGES.map((p) => (
                  <label key={p.path} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={editing.show_on.includes(p.path)} onCheckedChange={(v) => togglePage(editing, p.path, v === true)} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold flex items-center gap-1"><UserRound className="h-4 w-4" /> Owner's login email</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input type="email" placeholder="owner@email.com" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                <Button variant="outline" onClick={saveOwner}>Link owner</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The owner signs up on TechTrendi first, with this email. Once linked, they can edit only this ad's wording at
                techtrendi.com/my-ad. Leave empty and press Link owner to remove them.
              </p>
            </div>
            {editing.content.pendingHeroImage && (
              <div className="rounded-xl border-2 border-amber-400 p-4">
                <p className="font-semibold">The owner sent a new picture. Check it has no "iCloud"/"bypass" words and no company logos.</p>
                <img src={editing.content.pendingHeroImage} alt="" className="mt-3 max-h-72 rounded-lg border border-border" />
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => approvePicture(editing, true)}><Check className="mr-1 h-4 w-4" /> Approve</Button>
                  <Button variant="outline" onClick={() => approvePicture(editing, false)}><X className="mr-1 h-4 w-4" /> Reject</Button>
                </div>
              </div>
            )}
          </section>

          <SponsorEditor slug={editing.slug} mode="admin" value={draft} onChange={setDraft} />

          <div className="sticky bottom-4 flex justify-end">
            <Button size="lg" onClick={saveContent} disabled={saving} className="shadow-lg">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save wording
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ---- List view ----
  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Megaphone className="h-6 w-6" /> Sponsored ads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paid ads for businesses. Wording edits show on the ad page at once; new ads, switching on/off and card pages
            reach the whole site at the next daily update (11:30) or whenever the site is updated.
          </p>
        </div>

        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
                {r.content.heroImage && <img src={r.content.heroImage} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{r.content.name || r.slug}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.active ? "On" : "Off"} · {r.show_on.length} page{r.show_on.length === 1 ? "" : "s"} · {r.owner_email ? `owner: ${r.owner_email}` : "no owner login"}
                  </p>
                  {r.content.pendingHeroImage && <p className="text-sm font-semibold text-amber-600">New picture waiting for approval</p>}
                </div>
                <Button variant="outline" onClick={() => open(r)}>Edit</Button>
              </div>
            ))}
            {rows.length === 0 && <p className="text-muted-foreground">No ads yet.</p>}
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="flex items-center gap-2 font-bold"><Plus className="h-5 w-5" /> New ad</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input placeholder="Business name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="Page address, e.g. kofi-phones" value={newSlug} onChange={(e) => setNewSlug(e.target.value.toLowerCase())} />
            <Input placeholder="Phone, e.g. 233541234567" inputMode="numeric" value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))} />
          </div>
          <Button onClick={createAd}>Create (switched off)</Button>
        </section>
      </div>
    </AdminLayout>
  );
}
