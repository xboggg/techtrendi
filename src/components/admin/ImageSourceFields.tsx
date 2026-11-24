import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IMAGE_SOURCE_OPTIONS, imageSourceLabel, type ImageAttribution } from "@/lib/imageAttribution";

// Admin panel: "Image Source" under the Cover Image field (News and Blog editors, 24 Nov 2026).
// "Automatic" lets the database work the label out from the picture's filename (AI pictures and
// Pexels/Unsplash photos). Any other choice is the admin's and is kept as chosen.

export const AUTO_SOURCE = "auto";

export interface ImageSourceForm {
  image_source_choice: string; // AUTO_SOURCE or an ImageSourceType
  image_credit: string;
  image_caption: string;
}

export const initialImageSourceForm: ImageSourceForm = {
  image_source_choice: AUTO_SOURCE,
  image_credit: "",
  image_caption: "",
};

/** Form values for an existing row. Automatic labels show as "Automatic". */
export function imageSourceFormFrom(row: ImageAttribution): ImageSourceForm {
  return {
    image_source_choice: !row.image_source_type || row.image_source_auto ? AUTO_SOURCE : row.image_source_type,
    image_credit: row.image_credit || "",
    image_caption: row.image_caption || "",
  };
}

/**
 * The admin changed the cover picture in the form. A credit and caption the admin has not
 * edited belong to the OLD picture, so they are emptied (Codex review on PR #69); anything
 * the admin typed is kept. Use for both the URL box and the upload button.
 */
export function withNewCover<T extends ImageSourceForm & { cover_image: string }>(
  prev: T,
  cover: string,
  saved?: ImageAttribution & { cover_image?: string | null },
): T {
  const next = { ...prev, cover_image: cover };
  if (cover === (saved?.cover_image || "")) return next;
  if (prev.image_credit === (saved?.image_credit || "")) next.image_credit = "";
  if (prev.image_caption === (saved?.image_caption || "")) next.image_caption = "";
  return next;
}

/** Columns to save. Automatic is sent as NULL; the database fills it in. */
export function imageSourceColumns(f: ImageSourceForm) {
  return {
    image_source_type: f.image_source_choice === AUTO_SOURCE ? null : f.image_source_choice,
    image_credit: f.image_credit.trim() || null,
    image_caption: f.image_caption.trim() || null,
  };
}

export function ImageSourceFields({
  value,
  onChange,
  saved,
}: {
  value: ImageSourceForm;
  onChange: (next: ImageSourceForm) => void;
  /** The row as last saved, to say what "Automatic" currently means. */
  saved?: ImageAttribution & { cover_image?: string | null };
}) {
  const savedAutoLabel =
    saved && (saved.image_source_auto || !saved.image_source_type) ? imageSourceLabel(saved.image_source_type) : null;
  const chosen = IMAGE_SOURCE_OPTIONS.find((o) => o.value === value.image_source_choice);

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="space-y-1.5">
        <Label>Image Source</Label>
        <Select value={value.image_source_choice} onValueChange={(v) => onChange({ ...value, image_source_choice: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUTO_SOURCE}>Automatic (from the picture)</SelectItem>
            {IMAGE_SOURCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {value.image_source_choice === AUTO_SOURCE
            ? savedAutoLabel
              ? `Right now: ${savedAutoLabel}. AI pictures and Pexels/Unsplash photos are labelled by themselves.`
              : saved?.cover_image
                ? "Not known for this picture yet - please choose one, so readers know where it comes from."
                : "AI pictures and Pexels/Unsplash photos are labelled by themselves. Choose one for your own pictures."
            : chosen?.hint}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="image_credit">Credit (optional)</Label>
          <Input
            id="image_credit"
            value={value.image_credit}
            onChange={(e) => onChange({ ...value, image_credit: e.target.value })}
            placeholder="e.g. Ministry of Foreign Affairs, Ghana"
            maxLength={120}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="image_caption">Caption (optional)</Label>
          <Input
            id="image_caption"
            value={value.image_caption}
            onChange={(e) => onChange({ ...value, image_caption: e.target.value })}
            placeholder="What the picture shows"
            maxLength={240}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Shown as a small label on the picture, with the caption and "Image: credit" under it. The picture itself is not changed.
      </p>
    </div>
  );
}
