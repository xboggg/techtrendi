// Homepage hero pictures (owner, 31 Oct 2026; preview approved the same day).
// Upload (made lighter in the browser: a big copy for computers and a small one
// for phones), put them in order, switch them on/off, tap the face so phones
// crop around it, and write a short description. Every change saves at once.
// Table: techtrendi.hero_slides (supabase/migrations/20261031_hero_slides.sql).
import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, ChevronUp, Image as ImageIcon, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Slide {
  id: string;
  image_url: string;
  phone_image_url: string | null;
  alt: string;
  focus_x: number;
  focus_y: number;
  is_active: boolean;
  sort_order: number;
}

// Computer copy: up to 1920px wide, under 300 KB. Phone copy: up to 1280px, under 180 KB.
const BIG = { maxWidth: 1920, maxHeight: 1920, quality: 0.82, maxBytes: 300 * 1024 };
const SMALL = { maxWidth: 1280, maxHeight: 1280, quality: 0.8, maxBytes: 180 * 1024 };
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db2.techtrendi.com";

const sizeText = (b: number) => (b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

async function uploadBlob(blob: Blob, fileName: string): Promise<string> {
  const form = new FormData();
  form.append("file", blob, fileName);
  form.append("folder", "hero");
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  const res = await fetch(`${SUPABASE_URL}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }
  return (await res.json()).url as string;
}

export default function AdminHeroImages() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState<string | null>(null);
  const [askingId, setAskingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("hero_slides").select("*").order("sort_order", { ascending: true });
    if (error) toast.error("Could not load the pictures");
    const rows = (data as Slide[]) || [];
    setSlides(rows);
    setSelId((cur) => (cur && rows.some((r) => r.id === cur) ? cur : rows[0]?.id ?? null));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const sel = slides.find((s) => s.id === selId) || null;
  const selNum = sel ? slides.indexOf(sel) + 1 : 0;
  useEffect(() => { setAltDraft(sel?.alt ?? ""); }, [sel?.id, sel?.alt]);

  const patch = async (id: string, values: Partial<Slide>) => {
    const before = slides;
    setSlides((p) => p.map((s) => (s.id === id ? { ...s, ...values } : s)));
    const { error } = await supabase.from("hero_slides").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Not saved. Please try again."); setSlides(before); return false; }
    return true;
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
      toast.error("Please choose a photo (JPG, PNG or WebP).");
      return;
    }
    setUploading(true);
    setLastUpload(null);
    try {
      const { optimizeImage } = await import("@/lib/image-optimize");
      const big = await optimizeImage(file, BIG);
      const small = await optimizeImage(file, SMALL);
      const image_url = await uploadBlob(big.blob, big.fileName);
      const phone_image_url = await uploadBlob(small.blob, small.fileName.replace(/\.(\w+)$/, "-phone.$1"));
      const sort_order = slides.reduce((m, s) => Math.max(m, s.sort_order), 0) + 10;
      const { data, error } = await supabase.from("hero_slides")
        .insert([{ image_url, phone_image_url, alt: "", focus_x: 50, focus_y: 50, is_active: true, sort_order }])
        .select("*").single();
      if (error || !data) throw new Error(error?.message || "Could not save the picture");
      setSlides((p) => [...p, data as Slide]);
      setSelId((data as Slide).id);
      setLastUpload(`Made lighter: ${sizeText(file.size)} → ${sizeText(big.blob.size)}`);
      toast.success("Picture added. Now tap the face.");
    } catch (err) {
      toast.error(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = slides[idx], b = slides[idx + dir];
    if (!a || !b) return;
    setSlides((p) => { const c = [...p]; [c[idx], c[idx + dir]] = [{ ...b, sort_order: a.sort_order }, { ...a, sort_order: b.sort_order }]; return c; });
    const [r1, r2] = await Promise.all([
      supabase.from("hero_slides").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("hero_slides").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    if (r1.error || r2.error) { toast.error("Order not saved. Please try again."); fetchAll(); }
  };

  const toggle = (s: Slide) => {
    if (s.is_active && slides.filter((x) => x.is_active).length === 1) {
      toast.error("Keep at least one picture showing.");
      return;
    }
    patch(s.id, { is_active: !s.is_active });
  };

  const remove = async (s: Slide) => {
    if (s.is_active && slides.filter((x) => x.is_active).length === 1) {
      toast.error("Keep at least one picture showing.");
      setAskingId(null);
      return;
    }
    const { error } = await supabase.from("hero_slides").delete().eq("id", s.id);
    setAskingId(null);
    if (error) { toast.error("Not removed. Please try again."); return; }
    toast.success("Picture removed");
    fetchAll();
  };

  const setFocus = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!sel) return;
    const r = e.currentTarget.getBoundingClientRect();
    const focus_x = Math.min(100, Math.max(0, Math.round(((e.clientX - r.left) / r.width) * 100)));
    const focus_y = Math.min(100, Math.max(0, Math.round(((e.clientY - r.top) / r.height) * 100)));
    patch(sel.id, { focus_x, focus_y });
  };

  const saveAlt = async () => {
    if (!sel || altDraft.trim() === sel.alt) return;
    if (await patch(sel.id, { alt: altDraft.trim() })) toast.success("Description saved");
  };

  const showing = slides.filter((s) => s.is_active).length;
  const pos = (s: Slide) => `${s.focus_x}% ${s.focus_y}%`;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div className="flex items-start gap-2">
            <ImageIcon className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold">Homepage pictures</h1>
              <p className="text-sm text-muted-foreground">The big pictures at the top of the homepage. They change every 7 seconds, in this order. {showing} of {slides.length} showing. Every change saves by itself.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] items-start">
            <div className="space-y-3 min-w-0">
              {slides.map((s, idx) => (
                <div key={s.id} className={cn("rounded-2xl bg-card p-3 space-y-3", s.id === selId ? "border-2 border-primary" : "border border-border")}>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setSelId(s.id)} aria-label={`Set where the face is for picture ${idx + 1}`}
                      className="relative w-[120px] h-[68px] sm:w-[176px] sm:h-[99px] shrink-0 overflow-hidden rounded-xl bg-muted">
                      <img src={s.phone_image_url || s.image_url} alt="" loading="lazy" className={cn("w-full h-full object-cover", !s.is_active && "opacity-40")} style={{ objectPosition: pos(s) }} />
                      <span className="absolute top-1.5 left-1.5 grid place-items-center w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold">{idx + 1}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">Picture {idx + 1}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{s.alt || "No description yet"}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1.5">
                      <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label={`Move picture ${idx + 1} up`}
                        className="grid place-items-center w-11 h-9 rounded-lg border border-border hover:bg-muted disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => move(idx, 1)} disabled={idx === slides.length - 1} aria-label={`Move picture ${idx + 1} down`}
                        className="grid place-items-center w-11 h-9 rounded-lg border border-border hover:bg-muted disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" role="switch" aria-checked={s.is_active} onClick={() => toggle(s)}
                      className="flex flex-1 sm:flex-none items-center gap-2.5 h-11 px-3 rounded-xl border border-border bg-muted/40">
                      <span className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors", s.is_active ? "bg-emerald-600" : "bg-slate-400")}>
                        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", s.is_active ? "left-[22px]" : "left-0.5")} />
                      </span>
                      <span className="text-sm font-semibold">{s.is_active ? "Showing" : "Hidden"}</span>
                    </button>
                    <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setSelId(s.id)}>Set face</Button>
                    <button type="button" onClick={() => setAskingId(s.id)} aria-label={`Remove picture ${idx + 1}`}
                      className="grid place-items-center w-11 h-11 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {askingId === s.id && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-2.5">
                      <p className="text-sm font-semibold">Remove this picture from the homepage? You can hide it instead and keep it.</p>
                      <div className="flex gap-2">
                        <Button type="button" variant="destructive" className="flex-1 h-11 rounded-xl" onClick={() => remove(s)}>Yes, remove</Button>
                        <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setAskingId(null)}>Keep it</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full flex flex-col sm:flex-row items-center gap-3 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-50 dark:bg-amber-500/10 p-5 text-center sm:text-left disabled:opacity-70">
                <span className="grid place-items-center w-12 h-12 shrink-0 rounded-2xl bg-amber-600 text-white">
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                </span>
                <span className="space-y-1">
                  <span className="block font-bold">{uploading ? "Making it lighter and uploading…" : "Add a picture"}</span>
                  <span className="block text-sm text-muted-foreground">From your phone or computer. Any size: we make it light and fast, with a computer copy and a phone copy.</span>
                </span>
              </button>

              {lastUpload && (
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
                  <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"><Check className="w-5 h-5" /></span>
                  <p className="text-sm"><span className="font-bold">{lastUpload}.</span> <span className="text-muted-foreground">Now tap the face so phones crop it well.</span></p>
                </div>
              )}
            </div>

            {sel && (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-4 lg:sticky lg:top-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold">Picture {selNum}: where is the face?</h2>
                  <p className="text-sm text-muted-foreground">Tap the person's face. Phones only show a narrow slice of the picture, so we keep that spot in view.</p>
                </div>
                <button type="button" onClick={setFocus} aria-label="Tap where the face is"
                  className="relative block w-full aspect-video overflow-hidden rounded-xl bg-muted cursor-crosshair">
                  <img src={sel.image_url} alt="" className="w-full h-full object-cover pointer-events-none" />
                  <span className="absolute w-9 h-9 -ml-[18px] -mt-[18px] rounded-full border-[3px] border-white bg-amber-600/55 pointer-events-none shadow"
                    style={{ left: `${sel.focus_x}%`, top: `${sel.focus_y}%` }} />
                </button>
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">On a computer</p>
                    <div className="aspect-video overflow-hidden rounded-lg bg-slate-900">
                      <img src={sel.image_url} alt="" className="w-full h-full object-cover" style={{ objectPosition: pos(sel) }} />
                    </div>
                  </div>
                  <div className="w-[84px] space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">On a phone</p>
                    <div className="w-[84px] h-[150px] overflow-hidden rounded-2xl border-[3px] border-slate-900 bg-slate-900">
                      <img src={sel.phone_image_url || sel.image_url} alt="" className="w-full h-full object-cover" style={{ objectPosition: pos(sel) }} />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="hero-alt" className="text-sm font-semibold">What's in the picture? (short)</label>
                  <Input id="hero-alt" value={altDraft} maxLength={160} onChange={(e) => setAltDraft(e.target.value)} onBlur={saveAlt}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    placeholder="e.g. Woman using her phone on a busy Accra street" className="h-11 rounded-xl" />
                  <p className="text-xs text-muted-foreground">Google and blind visitors read this.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
