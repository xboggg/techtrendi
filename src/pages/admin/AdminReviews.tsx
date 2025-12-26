import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Review {
  id: string;
  slug: string;
  title: string;
  category: string;
  image: string | null;
  rating: number;
  verdict: string;
  pros: string[];
  cons: string[];
  price: string | null;
  release_date: string | null;
  full_review: string | null;
  specs: Record<string, string>;
  is_published: boolean;
  views: number | null;
}

const reviewSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1, "Slug is required").max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  category: z.string().min(1, "Category is required"),
  rating: z.number().min(0).max(5),
  verdict: z.string().min(1, "Verdict is required").max(500),
  pros: z.string(),
  cons: z.string(),
  price: z.string().optional(),
  release_date: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  full_review: z.string().optional(),
  specs: z.string(),
  is_published: z.boolean(),
});

const categories = ["Smartphones", "Laptops", "Audio", "Wearables", "Tablets", "Accessories"];

function ReviewForm({ 
  review, 
  onSave, 
  onCancel 
}: { 
  review?: Review; 
  onSave: (data: Partial<Review>) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: review?.title || "",
    slug: review?.slug || "",
    category: review?.category || "Smartphones",
    rating: review?.rating || 4.0,
    verdict: review?.verdict || "",
    pros: review?.pros?.join("\n") || "",
    cons: review?.cons?.join("\n") || "",
    price: review?.price || "",
    release_date: review?.release_date || "",
    image: review?.image || "",
    full_review: review?.full_review || "",
    specs: review?.specs ? JSON.stringify(review.specs, null, 2) : "{}",
    is_published: review?.is_published ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = reviewSchema.parse({
        ...formData,
        rating: Number(formData.rating),
      });

      let specs = {};
      try {
        specs = JSON.parse(formData.specs);
      } catch {
        setErrors({ specs: "Invalid JSON format" });
        return;
      }

      onSave({
        title: validated.title,
        slug: validated.slug,
        category: validated.category,
        rating: validated.rating,
        verdict: validated.verdict,
        pros: validated.pros.split("\n").filter(Boolean),
        cons: validated.cons.split("\n").filter(Boolean),
        price: validated.price || null,
        release_date: validated.release_date || null,
        image: validated.image || null,
        full_review: validated.full_review || null,
        specs,
        is_published: validated.is_published,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            fieldErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setFormData({ ...formData, slug });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            onBlur={() => !formData.slug && generateSlug()}
          />
          {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <div className="flex gap-2">
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
            <Button type="button" variant="outline" onClick={generateSlug}>
              Generate
            </Button>
          </div>
          {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(v) => setFormData({ ...formData, category: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rating">Rating (0-5) *</Label>
          <Input
            id="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="$999"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="release_date">Release Date</Label>
          <Input
            id="release_date"
            value={formData.release_date}
            onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
            placeholder="Jan 2024"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Image URL</Label>
          <Input
            id="image"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="verdict">Verdict *</Label>
        <Textarea
          id="verdict"
          value={formData.verdict}
          onChange={(e) => setFormData({ ...formData, verdict: e.target.value })}
          rows={2}
        />
        {errors.verdict && <p className="text-sm text-red-500">{errors.verdict}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pros">Pros (one per line)</Label>
          <Textarea
            id="pros"
            value={formData.pros}
            onChange={(e) => setFormData({ ...formData, pros: e.target.value })}
            rows={4}
            placeholder="Great camera&#10;Long battery life&#10;Fast performance"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cons">Cons (one per line)</Label>
          <Textarea
            id="cons"
            value={formData.cons}
            onChange={(e) => setFormData({ ...formData, cons: e.target.value })}
            rows={4}
            placeholder="Expensive&#10;Heavy&#10;No headphone jack"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_review">Full Review</Label>
        <Textarea
          id="full_review"
          value={formData.full_review}
          onChange={(e) => setFormData({ ...formData, full_review: e.target.value })}
          rows={6}
          placeholder="Write the full review here..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="specs">Specs (JSON)</Label>
        <Textarea
          id="specs"
          value={formData.specs}
          onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
          rows={4}
          className="font-mono text-sm"
        />
        {errors.specs && <p className="text-sm text-red-500">{errors.specs}</p>}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="is_published"
          checked={formData.is_published}
          onCheckedChange={(v) => setFormData({ ...formData, is_published: v })}
        />
        <Label htmlFor="is_published">Published</Label>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {review ? "Update Review" : "Create Review"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminReviews() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | undefined>();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Review>) => {
      const { error } = await supabase.from("reviews").insert([data as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review created successfully");
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create review: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Review> }) => {
      const { error } = await supabase.from("reviews").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review updated successfully");
      setIsDialogOpen(false);
      setEditingReview(undefined);
    },
    onError: (error) => {
      toast.error(`Failed to update review: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete review: ${error.message}`);
    },
  });

  const handleSave = (data: Partial<Review>) => {
    if (editingReview) {
      updateMutation.mutate({ id: editingReview.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reviews</h1>
            <p className="text-muted-foreground">Manage product reviews</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingReview(undefined);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {editingReview ? "Edit Review" : "Create New Review"}
                </DialogTitle>
              </DialogHeader>
              <ReviewForm
                review={editingReview}
                onSave={handleSave}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingReview(undefined);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No reviews yet
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{review.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-primary text-primary" />
                        {Number(review.rating).toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={review.is_published ? "default" : "outline"}>
                        {review.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>{review.views?.toLocaleString() || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(review)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(review.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
