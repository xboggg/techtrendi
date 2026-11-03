// Form for an ad's wording + picture (the `content` column of techtrendi.sponsors).
// Used by /admin/sponsors (mode "admin") and /my-ad (mode "owner").
// Owner: a new picture goes to pendingHeroImage and waits for an admin; the
// database refuses any other way (sponsors_guard). Admin: picture goes live.
import { useRef, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImagePlus, Loader2, Plus, Trash2, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { optimizeImage } from "@/lib/image-optimize";
import type { SponsorContent } from "@/data/sponsors";

type Mode = "admin" | "owner";

// Landing page picture: up to 1280 x 1200, under 300 KB (WhatsApp previews break above that).
const PICTURE = { maxWidth: 1280, maxHeight: 1200, quality: 0.85, format: "jpeg" as const, maxBytes: 300 * 1024 };

export async function uploadSponsorPicture(slug: string, file: File): Promise<string> {
  const { blob } = await optimizeImage(file, PICTURE);
  const path = `${slug}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("sponsor-images").upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("sponsor-images").getPublicUrl(path).data.publicUrl;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-semibold">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

type ListKey = "services" | "steps" | "reasons" | "faqs";

export function SponsorEditor({
  slug, mode, value, onChange,
}: { slug: string; mode: Mode; value: SponsorContent; onChange: (c: SponsorContent) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const c = value;
  const set = <K extends keyof SponsorContent>(k: K, v: SponsorContent[K]) => onChange({ ...c, [k]: v });

  const setItem = (key: ListKey, i: number, field: string, v: string) => {
    const list = [...((c[key] as unknown as Record<string, string>[]) || [])];
    list[i] = { ...list[i], [field]: v };
    onChange({ ...c, [key]: list } as SponsorContent);
  };
  const addItem = (key: ListKey, blank: Record<string, string>) =>
    onChange({ ...c, [key]: [...((c[key] as unknown as Record<string, string>[]) || []), blank] } as SponsorContent);
  const removeItem = (key: ListKey, i: number) =>
    onChange({ ...c, [key]: ((c[key] as unknown as Record<string, string>[]) || []).filter((_, j) => j !== i) } as SponsorContent);

  const pickPicture = async (file: File | undefined) => {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const url = await uploadSponsorPicture(slug, file);
      onChange(mode === "admin" ? { ...c, heroImage: url } : { ...c, pendingHeroImage: url });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const listBlock = (key: ListKey, fields: { name: string; label: string; long?: boolean }[], addLabel: string) => {
    const list = (c[key] as unknown as Record<string, string>[]) || [];
    return (
      <div className="space-y-3">
        {list.map((item, i) => (
          <div key={i} className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">#{i + 1}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(key, i)} className="text-destructive">
                <Trash2 className="mr-1 h-4 w-4" /> Remove
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((f) => (
                <Field key={f.name} label={f.label}>
                  {f.long ? (
                    <Textarea rows={3} value={item[f.name] || ""} onChange={(e) => setItem(key, i, f.name, e.target.value)} />
                  ) : (
                    <Input value={item[f.name] || ""} onChange={(e) => setItem(key, i, f.name, e.target.value)} />
                  )}
                </Field>
              ))}
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => addItem(key, Object.fromEntries(fields.map((f) => [f.name, ""])))}>
          <Plus className="mr-1 h-4 w-4" /> {addLabel}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-2xl border border-amber-400/40 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <strong>TechTrendi rules for ads:</strong> don't mention iCloud, Activation Lock, FRP, "bypass", hacking,
          cracking, jailbreak, blacklist removal, changing IMEI or removing passwords/screen locks (in text or in pictures), and don't use other companies' logos. These would put the site's Google ads at risk, so the system
          won't save them. Only promise what you really offer.
        </p>
      </div>

      <Section title="Picture" hint="The big picture at the top of the page. Best size: 1280 x 1200 pixels. It is made lighter automatically.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold">Showing now</p>
            {c.heroImage ? (
              <img src={c.heroImage} alt="" className="w-full rounded-xl border border-border object-cover" />
            ) : (
              <div className="flex aspect-[16/15] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">No picture yet</div>
            )}
          </div>
          {c.pendingHeroImage && (
            <div>
              <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-amber-600">
                <Clock className="h-4 w-4" /> Waiting for TechTrendi's approval
              </p>
              <img src={c.pendingHeroImage} alt="" className="w-full rounded-xl border-2 border-amber-400 object-cover" />
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pickPicture(e.target.files?.[0])} />
        <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {mode === "admin" ? "Upload a new picture" : "Send a new picture for approval"}
        </Button>
        {mode === "owner" && <p className="text-xs text-muted-foreground">TechTrendi checks every new picture before it goes on the page. Then press Save.</p>}
        {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        <Field label="Picture description" hint="One sentence describing the picture, for blind visitors and Google.">
          <Input value={c.heroImageAlt} onChange={(e) => set("heroImageAlt", e.target.value)} />
        </Field>
      </Section>

      <Section title="Name and headline">
        <Field label="Business name"><Input value={c.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Slogan" hint='Short, e.g. "Unlock Your World"'><Input value={c.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
        <Field label="Big headline" hint="The first line people read."><Input value={c.headline} onChange={(e) => set("headline", e.target.value)} /></Field>
        <Field label="Introduction" hint="2–3 sentences under the headline."><Textarea rows={4} value={c.intro} onChange={(e) => set("intro", e.target.value)} /></Field>
        <Field label="Card text" hint="One line shown on the small Sponsored card on other pages."><Input value={c.cardText} onChange={(e) => set("cardText", e.target.value)} /></Field>
      </Section>

      <Section title="Contact">
        <Field label="Phone number (for the buttons)" hint="Digits only, with country code, no + or spaces. Example: 233536616401">
          <Input inputMode="numeric" value={c.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Field label="Phone number as people see it" hint="Example: +233 536 616 401"><Input value={c.phoneDisplay} onChange={(e) => set("phoneDisplay", e.target.value)} /></Field>
        <Field label="WhatsApp starting message" hint="Already typed for the customer when they tap Chat on WhatsApp.">
          <Textarea rows={2} value={c.whatsappMessage} onChange={(e) => set("whatsappMessage", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Social media name (optional)" hint="Example: @CyclopXunlox"><Input value={c.socialHandle || ""} onChange={(e) => set("socialHandle", e.target.value)} /></Field>
          <Field label="Social networks (optional)" hint="Example: TikTok, Instagram and Facebook"><Input value={c.socialNetworks || ""} onChange={(e) => set("socialNetworks", e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Highlights" hint="Short points shown as ticks under the introduction (3–5 is best).">
        {(c.highlights || []).map((h, i) => (
          <div key={i} className="flex gap-2">
            <Input value={h} onChange={(e) => set("highlights", c.highlights.map((x, j) => (j === i ? e.target.value : x)))} />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => set("highlights", c.highlights.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => set("highlights", [...(c.highlights || []), ""])}><Plus className="mr-1 h-4 w-4" /> Add a highlight</Button>
      </Section>

      <Section title="Who it's for (optional box)" hint="Leave both empty to hide this box.">
        <Field label="Title"><Input value={c.audience?.title || ""} onChange={(e) => set("audience", { title: e.target.value, text: c.audience?.text || "" })} /></Field>
        <Field label="Text"><Textarea rows={3} value={c.audience?.text || ""} onChange={(e) => set("audience", { title: c.audience?.title || "", text: e.target.value })} /></Field>
      </Section>

      <Section title="Services">
        {listBlock("services", [
          { name: "title", label: "Service name" },
          { name: "detail", label: "Short line under the name" },
          { name: "description", label: "Description", long: true },
        ], "Add a service")}
      </Section>

      <Section title="How it works" hint="The steps a customer follows (3 is best).">
        {listBlock("steps", [{ name: "title", label: "Step" }, { name: "detail", label: "What happens", long: true }], "Add a step")}
      </Section>

      <Section title="Why people choose you">
        {listBlock("reasons", [{ name: "title", label: "Reason" }, { name: "detail", label: "Short explanation", long: true }], "Add a reason")}
      </Section>

      <Section title="Questions people ask">
        {listBlock("faqs", [{ name: "q", label: "Question" }, { name: "a", label: "Answer", long: true }], "Add a question")}
      </Section>

      <Section title="Closing box" hint="The big box at the bottom of the page, just above the buttons.">
        <Field label="Heading" hint='Example: "Ready to unlock your phone?"'><Input value={c.ctaTitle || ""} onChange={(e) => set("ctaTitle", e.target.value)} /></Field>
        <Field label="Line under the heading" hint='Example: "Message us on WhatsApp with your phone model and network."'><Input value={c.ctaText || ""} onChange={(e) => set("ctaText", e.target.value)} /></Field>
        <Field label="Promise" hint='Example: "Fast, secure, reliable"'><Input value={c.promise?.title || ""} onChange={(e) => set("promise", { title: e.target.value, detail: c.promise?.detail || "" })} /></Field>
      </Section>
    </div>
  );
}
