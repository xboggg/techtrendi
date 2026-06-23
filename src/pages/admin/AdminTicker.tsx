import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Plus, Eye, EyeOff, Trash2, Save, X, RefreshCw,
  ChevronUp, ChevronDown, Megaphone, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface TickerItem {
  id: string;
  text: string;
  link: string | null;
  emoji: string | null;
  is_active: boolean;
  sort_order: number;
}

interface TickerSettings {
  id: number;
  enabled: boolean;
  position: "fixed" | "static";
  speed_secs: number;
}

const blankForm = { text: "", link: "", emoji: "" };

export default function AdminTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [settings, setSettings] = useState<TickerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<TickerItem | null>(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: its }, { data: st }] = await Promise.all([
      supabase.from("ticker_items").select("*").order("sort_order", { ascending: true }),
      supabase.from("ticker_settings").select("*").eq("id", 1).single(),
    ]);
    setItems((its as TickerItem[]) || []);
    setSettings((st as TickerSettings) || null);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ---- settings ----
  const saveSettings = async (patch: Partial<TickerSettings>) => {
    if (!settings) return;
    setSavingSettings(true);
    const next = { ...settings, ...patch };
    setSettings(next); // optimistic
    const { error } = await supabase
      .from("ticker_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSavingSettings(false);
    if (error) { toast.error("Failed to save settings"); fetchAll(); }
    else toast.success("Settings saved");
  };

  // ---- items ----
  const openNew = () => { setEditing(null); setForm(blankForm); setShowDialog(true); };
  const openEdit = (it: TickerItem) => {
    setEditing(it);
    setForm({ text: it.text, link: it.link || "", emoji: it.emoji || "" });
    setShowDialog(true);
  };

  const saveItem = async () => {
    if (!form.text.trim()) { toast.error("Text is required"); return; }
    setSaving(true);
    const payload = {
      text: form.text.trim(),
      link: form.link.trim() || null,
      emoji: form.emoji.trim() || null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("ticker_items")
        .update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editing.id));
    } else {
      const nextOrder = (items.reduce((m, i) => Math.max(m, i.sort_order), 0) || 0) + 10;
      ({ error } = await supabase.from("ticker_items")
        .insert([{ ...payload, sort_order: nextOrder, is_active: true }]));
    }
    setSaving(false);
    if (error) toast.error("Failed to save item");
    else { toast.success(editing ? "Item updated" : "Item added"); setShowDialog(false); fetchAll(); }
  };

  const toggleActive = async (it: TickerItem) => {
    const { error } = await supabase.from("ticker_items")
      .update({ is_active: !it.is_active, updated_at: new Date().toISOString() }).eq("id", it.id);
    if (error) toast.error("Failed to update");
    else { setItems((p) => p.map((x) => x.id === it.id ? { ...x, is_active: !x.is_active } : x)); }
  };

  const removeItem = async (it: TickerItem) => {
    if (!confirm(`Delete "${it.text}"?`)) return;
    const { error } = await supabase.from("ticker_items").delete().eq("id", it.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchAll(); }
  };

  // swap sort_order with the neighbour to move up/down
  const move = async (idx: number, dir: -1 | 1) => {
    const a = items[idx], b = items[idx + dir];
    if (!a || !b) return;
    setItems((p) => { const c = [...p]; [c[idx], c[idx + dir]] = [c[idx + dir], c[idx]]; return c; });
    await Promise.all([
      supabase.from("ticker_items").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("ticker_items").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
  };

  const activeCount = items.filter((i) => i.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Ticker / Announcements</h1>
              <p className="text-sm text-muted-foreground">The scrolling strip on the homepage. {activeCount} active item{activeCount !== 1 ? "s" : ""}.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
            <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Add item</Button>
          </div>
        </div>

        {loading || !settings ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Settings panel */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold">Ticker is {settings.enabled ? "ON" : "OFF"}</p>
                  <p className="text-sm text-muted-foreground">Master switch for the whole strip.</p>
                </div>
                <button
                  onClick={() => saveSettings({ enabled: !settings.enabled })}
                  disabled={savingSettings}
                  className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                    settings.enabled ? "bg-primary" : "bg-muted")}
                >
                  <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow",
                    settings.enabled ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="text-sm font-medium">Position</label>
                  <div className="flex gap-2 mt-1.5">
                    {(["fixed", "static"] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => saveSettings({ position: pos })}
                        className={cn("flex-1 px-3 py-2 rounded-xl text-sm border transition-colors",
                          settings.position === pos ? "bg-primary/10 border-primary/40 text-primary font-medium" : "border-border hover:bg-muted")}
                      >
                        {pos === "fixed" ? "Pinned to bottom" : "Scrolls away"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Scroll speed (seconds per loop)</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      type="number" min={10} max={120}
                      value={settings.speed_secs}
                      onChange={(e) => setSettings({ ...settings, speed_secs: Number(e.target.value) })}
                      className="w-28"
                    />
                    <Button size="sm" variant="outline" onClick={() => saveSettings({ speed_secs: settings.speed_secs })}>
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <span className="text-xs text-muted-foreground">lower = faster</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items list */}
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No items yet. Click "Add item" to create one.</div>
              ) : items.map((it, idx) => (
                <div key={it.id} className={cn("flex items-center gap-3 p-3", !it.is_active && "opacity-50")}>
                  <div className="flex flex-col">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-0.5 disabled:opacity-30 hover:text-primary"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="p-0.5 disabled:opacity-30 hover:text-primary"><ChevronDown className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {it.emoji && <span className="mr-1">{it.emoji}</span>}{it.text}
                    </p>
                    {it.link && (
                      <a href={it.link} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 truncate">
                        <ExternalLink className="w-3 h-3 shrink-0" /> {it.link}
                      </a>
                    )}
                  </div>
                  <button onClick={() => toggleActive(it)} title={it.is_active ? "Active — click to hide" : "Hidden — click to show"}
                    className={cn("p-2 rounded-lg", it.is_active ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-foreground hover:bg-muted")}>
                    {it.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(it)}>Edit</Button>
                  <button onClick={() => removeItem(it)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowDialog(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? "Edit item" : "Add item"}</h2>
              <button onClick={() => setShowDialog(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Text <span className="text-destructive">*</span></label>
                <Input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="e.g. New: MoMo Fee Calculator — try it" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Link (optional)</label>
                <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="/tools/momo-fee-calculator  or  https://..." className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">If set, the item becomes clickable.</p>
              </div>
              <div>
                <label className="text-sm font-medium">Emoji (optional)</label>
                <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  placeholder="🎉" className="mt-1 w-24" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={saveItem} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                {editing ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
