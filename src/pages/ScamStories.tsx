import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Pin, Heart, Image as ImageIcon, Video, FileText, X, Loader2, Upload,
  CheckCircle2, Sparkles, ChevronDown,
} from "lucide-react";
import { GHANA_REGIONS, COUNTRIES, SCAM_CATEGORIES, categoryLabel, categoryEmoji, getSubmitCooldown, recordSubmit, hasReacted, markReacted } from "@/lib/scamStories";
import { optimizeImage } from "@/lib/image-optimize";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Story {
  id: string;
  story_text: string;
  media_url: string | null;
  media_type: "none" | "photo" | "video";
  name_or_alias: string;
  country: string;
  region: string;
  scam_category: string;
  reaction_count: number;
  created_at: string;
}

const PAGE_SIZE = 12;

// A handful of fixed rotation/photo-tone values so the scrapbook feels
// hand-pinned rather than perfectly aligned, without random layout shift on
// every re-render (each card's look is derived from its own id, so it's
// stable across reactions/filter changes).
const ROTATIONS = [-3, 2, -1.5, 3, -2.5, 1.5, -1, 2.5];
const PHOTO_TONES = ["#F1E4D3", "#E3EEE9", "#EFE1EC", "#E6E9F3", "#F3E9DE"];
function hashOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function StoryCard({ story, onReact }: { story: Story; onReact: (id: string) => void }) {
  const h = hashOf(story.id);
  const rotation = ROTATIONS[h % ROTATIONS.length];
  const tone = PHOTO_TONES[h % PHOTO_TONES.length];
  const [reacted, setReacted] = useState(false);
  const [count, setCount] = useState(story.reaction_count);

  useEffect(() => { setReacted(hasReacted(story.id)); }, [story.id]);

  const handleReact = () => {
    if (reacted) return;
    setReacted(true);
    setCount((c) => c + 1);
    markReacted(story.id);
    onReact(story.id);
  };

  return (
    <div style={{ transform: `rotate(${rotation}deg)` }} className="transition-transform duration-200 hover:z-10 hover:!rotate-0">
      <div className="w-3.5 h-3.5 rounded-full bg-rose-500 mx-auto -mb-1.5 relative top-1.5 shadow-md" />
      <div className="bg-white dark:bg-neutral-900 p-2.5 pb-4 rounded-sm shadow-[0_8px_20px_rgba(0,0,0,0.14)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
        {story.media_type === "photo" && story.media_url ? (
          <div className="rounded-[2px] overflow-hidden mb-2.5 bg-muted">
            <img src={story.media_url} alt="" className="w-full h-36 object-cover" loading="lazy" />
          </div>
        ) : story.media_type === "video" && story.media_url ? (
          <div className="rounded-[2px] overflow-hidden mb-2.5 bg-black">
            <video src={story.media_url} controls className="w-full h-36 object-cover" preload="none" />
          </div>
        ) : (
          <div className="rounded-[2px] mb-2.5 h-24 flex items-center justify-center text-xs text-neutral-500" style={{ background: tone }}>
            <FileText className="w-4 h-4 mr-1.5" /> text story
          </div>
        )}
        <p className="text-[13.5px] leading-snug text-neutral-800 dark:text-neutral-200 line-clamp-5" style={{ fontFamily: "Georgia, serif" }}>
          {story.story_text}
        </p>
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-700">
          <div className="text-[11px] text-neutral-500">
            <div className="font-medium text-neutral-700 dark:text-neutral-300">— {story.name_or_alias}</div>
            <div>{story.region}{story.country !== "Ghana" ? `, ${story.country}` : ""}</div>
          </div>
          <button
            onClick={handleReact}
            disabled={reacted}
            className={cn(
              "flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full transition-colors shrink-0",
              reacted ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" : "bg-neutral-100 text-neutral-500 hover:bg-rose-50 hover:text-rose-500 dark:bg-neutral-800 dark:hover:bg-rose-950/30"
            )}
          >
            <Heart className={cn("w-3 h-3", reacted && "fill-current")} /> {count}
          </button>
        </div>
        <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
          {categoryEmoji(story.scam_category)} {categoryLabel(story.scam_category)}
        </span>
      </div>
    </div>
  );
}

const emptyForm = {
  story_text: "",
  name_or_alias: "",
  country: "Ghana",
  region: "",
  scam_category: "",
};

function SubmitModal({ open, onClose, onSubmitted }: { open: boolean; onClose: () => void; onSubmitted: () => void }) {
  const [form, setForm] = useState(emptyForm);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<"photo" | "video" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm"];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("That file type isn't supported. Please use a JPG, PNG, WEBP, GIF photo, or MP4/MOV/WEBM video.");
      return;
    }
    const kind = file.type.startsWith("video/") ? "video" : "photo";
    if (file.size > 50 * 1024 * 1024) {
      toast.error(kind === "video" ? "Video is too large — please keep it under 50MB (try a shorter clip)." : "Photo is too large — please keep it under 50MB.");
      return;
    }
    setMediaFile(file);
    setMediaKind(kind);
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setMediaFile(null);
    setMediaKind(null);
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.story_text.trim() || !form.name_or_alias.trim() || !form.region.trim() || !form.scam_category) {
      toast.error("Please fill in your story, name/alias, region, and scam type.");
      return;
    }

    const cooldown = getSubmitCooldown();
    if (!cooldown.allowed) {
      toast.error(`You've reached the submission limit for now. Try again in about ${cooldown.retryInMinutes} minutes.`);
      return;
    }

    setSubmitting(true);
    try {
      let media_url: string | null = null;
      let media_type: "none" | "photo" | "video" = "none";

      if (mediaFile && mediaKind) {
        let uploadBlob: Blob = mediaFile;
        let fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${mediaFile.name.split(".").pop()}`;

        if (mediaKind === "photo") {
          const optimized = await optimizeImage(mediaFile);
          uploadBlob = optimized.blob;
          fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${optimized.fileName}`;
        }

        const { error: uploadError } = await supabase.storage.from("scam-stories").upload(fileName, uploadBlob);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("scam-stories").getPublicUrl(fileName);
        media_url = data.publicUrl;
        media_type = mediaKind;
      }

      const { error } = await supabase.from("security_scam_stories").insert({
        story_text: form.story_text.trim(),
        name_or_alias: form.name_or_alias.trim(),
        country: form.country,
        region: form.region.trim(),
        scam_category: form.scam_category,
        media_url,
        media_type,
        status: "pending",
      });
      if (error) throw error;

      recordSubmit();
      toast.success("Thank you — your story is being reviewed and will appear once approved.");
      setForm(emptyForm);
      clearFile();
      onSubmitted();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong submitting your story. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between gap-3 p-5 bg-card/95 backdrop-blur border-b border-border">
          <h2 className="font-bold text-lg text-foreground flex items-center gap-2"><Pin className="w-4.5 h-4.5 text-rose-500" /> Pin your story</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label>What happened? <span className="text-red-500">*</span></Label>
            <Textarea
              value={form.story_text}
              onChange={(e) => setForm((f) => ({ ...f, story_text: e.target.value }))}
              placeholder="Tell it in your own words — what the scam looked like, what they asked you to do, and what happened next..."
              rows={5}
              className="resize-none"
              maxLength={2000}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Add a photo or video (optional)</Label>
            {mediaPreview && mediaFile ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                {mediaKind === "video" ? (
                  <video src={mediaPreview} controls className="w-full max-h-48 object-contain bg-black" />
                ) : (
                  <img src={mediaPreview} alt="" className="w-full max-h-48 object-contain bg-muted" />
                )}
                <button type="button" onClick={clearFile} className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background">
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[11px] px-2.5 py-1.5 flex items-center justify-between">
                  <span>{mediaFile.name} · {formatBytes(mediaFile.size)}</span>
                  {mediaKind === "photo" && <span className="text-emerald-300">will be compressed before upload</span>}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all"
              >
                <Upload className="w-4 h-4" /> Upload a screenshot or short video
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleFile} />
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, GIF, or MP4/MOV/WEBM — up to 50MB. Photos are automatically compressed before upload.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Your name or alias <span className="text-red-500">*</span></Label>
              <Input
                value={form.name_or_alias}
                onChange={(e) => setForm((f) => ({ ...f, name_or_alias: e.target.value }))}
                placeholder="e.g. Ama K. or Anonymous"
                maxLength={40}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country <span className="text-red-500">*</span></Label>
              <Select value={form.country} onValueChange={(v) => setForm((f) => ({ ...f, country: v, region: "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Region <span className="text-red-500">*</span></Label>
            {form.country === "Ghana" ? (
              <Select value={form.region} onValueChange={(v) => setForm((f) => ({ ...f, region: v }))}>
                <SelectTrigger><SelectValue placeholder="Select your region" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {GHANA_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                placeholder="Your state / province / region"
                maxLength={60}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>What kind of scam was it? <span className="text-red-500">*</span></Label>
            <Select value={form.scam_category} onValueChange={(v) => setForm((f) => ({ ...f, scam_category: v }))}>
              <SelectTrigger><SelectValue placeholder="Choose the closest match" /></SelectTrigger>
              <SelectContent>
                {SCAM_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            Your story is reviewed before it appears publicly — this keeps the board trustworthy for everyone. Up to 3 submissions per day.
          </p>

          <Button type="submit" disabled={submitting} size="lg" className="w-full">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit for review"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ScamStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filterCountry, setFilterCountry] = useState("All");
  const [filterRegion, setFilterRegion] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);

  const fetchStories = useCallback(async () => {
    const { data, error } = await supabase
      .from("security_scam_stories")
      .select("id,story_text,media_url,media_type,name_or_alias,country,region,scam_category,reaction_count,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(300);
    if (!error && data) setStories(data as Story[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const regionsForFilter = useMemo(() => {
    const set = new Set(stories.filter((s) => filterCountry === "All" || s.country === filterCountry).map((s) => s.region));
    return Array.from(set).sort();
  }, [stories, filterCountry]);

  const filtered = useMemo(() => {
    return stories.filter((s) =>
      (filterCountry === "All" || s.country === filterCountry) &&
      (filterRegion === "All" || s.region === filterRegion) &&
      (filterCategory === "All" || s.scam_category === filterCategory)
    );
  }, [stories, filterCountry, filterRegion, filterCategory]);

  const visible = filtered.slice(0, visibleCount);

  const handleReact = async (id: string) => {
    try { await supabase.rpc("increment_story_reaction", { story_id: id }); } catch {}
  };

  return (
    <Layout>
      <SEOHead
        title="Share Your Scam Story | TechTrendi"
        description="Real scam stories from real people across Ghana and beyond — shared to help others spot the same tricks before it happens to them."
        canonical="/scam-stories"
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-rose-50/40 to-background dark:from-amber-950/20 dark:via-rose-950/10 dark:to-background border-b border-border/50">
        <div className="relative max-w-3xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500 shadow-lg shadow-rose-500/20 mb-6">
            <Pin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Real scams. Real people.</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Every story here happened to someone, somewhere close to you. Share yours — it might be exactly what saves someone else.
          </p>
          <Button size="lg" onClick={() => setModalOpen(true)} className="bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25">
            <Pin className="w-4 h-4 mr-2" /> Share your story
          </Button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <Select value={filterCountry} onValueChange={(v) => { setFilterCountry(v); setFilterRegion("All"); setVisibleCount(PAGE_SIZE); }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="All">All countries</SelectItem>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRegion} onValueChange={(v) => { setFilterRegion(v); setVisibleCount(PAGE_SIZE); }}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="All regions" /></SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="All">All regions</SelectItem>
              {regionsForFilter.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setVisibleCount(PAGE_SIZE); }}>
            <SelectTrigger className="w-[190px]"><SelectValue placeholder="All scam types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All scam types</SelectItem>
              {SCAM_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-40" />
            No stories match those filters yet — be the first to share one.
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-b from-amber-50/60 to-transparent dark:from-amber-950/10 rounded-3xl p-6 md:p-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
                {visible.map((s) => <StoryCard key={s.id} story={s} onReact={handleReact} />)}
              </div>
            </div>
            {visibleCount < filtered.length && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Show more stories <ChevronDown className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <SubmitModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmitted={fetchStories} />
    </Layout>
  );
}
