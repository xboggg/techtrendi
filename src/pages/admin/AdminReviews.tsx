import { useState, useMemo } from "react";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Plus, Pencil, Trash2, Star, ChevronLeft, ChevronRight, Search, ChevronDown, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 15;
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
  is_featured: boolean;
  views: number | null;
  created_at: string;
  updated_at: string;
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
  image: z.string().optional().or(z.literal("")),
  full_review: z.string().optional(),
  specs: z.string(),
  is_published: z.boolean(),
  is_featured: z.boolean(),
});

const categories = ["Smartphones", "Laptops", "Audio", "Wearables", "Tablets", "Smart Home", "TVs", "Gaming", "Cameras", "Networking", "Drones", "VR/AR", "Apps", "SaaS Tools", "Accessories"];

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
    is_featured: review?.is_featured ?? false,
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    toast.info("Optimizing and uploading image...");
    try {
      const { optimizeImage } = await import("@/lib/image-optimize");
      const { blob, fileName } = await optimizeImage(file);
      const uploadForm = new FormData();
      uploadForm.append("file", blob, fileName);
      uploadForm.append("folder", "reviews");
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db2.techtrendi.com";
      const res = await fetch(`${SUPABASE_URL}/api/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
        body: uploadForm,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await res.json();
      setFormData(prev => ({ ...prev, image: url }));
      toast.success("Image uploaded and optimized!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Try again.");
    } finally {
      setUploading(false);
    }
  };

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
        is_featured: validated.is_featured,
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
            placeholder="Image URL or upload below"
          />
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="review-image-upload"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => document.getElementById("review-image-upload")?.click()}
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>
            {formData.image && (
              <img src={formData.image} alt="Preview" className="h-10 w-16 object-cover rounded border" />
            )}
          </div>
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
        <Label>Full Review</Label>
        <RichTextEditor
          value={formData.full_review}
          onChange={(value) => setFormData({ ...formData, full_review: value })}
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

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="is_published"
            checked={formData.is_published}
            onCheckedChange={(v) => setFormData({ ...formData, is_published: v })}
          />
          <Label htmlFor="is_published">Published</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="is_featured"
            checked={formData.is_featured}
            onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
          />
          <Label htmlFor="is_featured">Featured on Homepage</Label>
        </div>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase.from("reviews").update({ is_featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Featured status updated");
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
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

  // Date quick filter helpers
  const setQuickDateFilter = (preset: "today" | "week" | "month" | "all") => {
    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    let from = to;
    if (preset === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      from = d.toISOString().slice(0, 10);
    } else if (preset === "month") {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      from = d.toISOString().slice(0, 10);
    }
    setDateFrom(from);
    setDateTo(to);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let result = reviews;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter(r => r.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      const isPublished = statusFilter === "published";
      result = result.filter(r => r.is_published === isPublished);
    }

    // Featured filter
    if (featuredFilter !== "all") {
      const isFeatured = featuredFilter === "featured";
      result = result.filter(r => r.is_featured === isFeatured);
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter(r => r.created_at && r.created_at.slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      result = result.filter(r => r.created_at && r.created_at.slice(0, 10) <= dateTo);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: any = a[sortField as keyof Review];
      let bVal: any = b[sortField as keyof Review];

      if (sortField === "rating" || sortField === "views") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [reviews, searchQuery, categoryFilter, statusFilter, featuredFilter, sortField, sortDirection, dateFrom, dateTo]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setFeaturedFilter("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || statusFilter !== "all" || featuredFilter !== "all" || dateFrom || dateTo;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredReviews.length);
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10 w-64"
            />
          </div>

          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <Select value={featuredFilter} onValueChange={(v) => { setFeaturedFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="not-featured">Not Featured</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button variant={dateFrom && dateFrom === dateTo && dateFrom === new Date().toISOString().slice(0, 10) ? "default" : "outline"} size="sm" onClick={() => setQuickDateFilter("today")}>Today</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateFilter("week")}>This Week</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateFilter("month")}>This Month</Button>
            <Button variant={!dateFrom && !dateTo ? "default" : "outline"} size="sm" onClick={() => setQuickDateFilter("all")}>All</Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => toggleSort("title")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Title
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("rating")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Rating
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("created_at")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort("views")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Views
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No reviews yet
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReviews.map((review) => (
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
                    <TableCell className="text-sm text-muted-foreground">
                      {review.created_at ? (
                        <>
                          <div>{formatDate(review.created_at)}</div>
                          {review.updated_at && review.updated_at.slice(0, 10) !== review.created_at.slice(0, 10) && (
                            <div className="text-xs text-muted-foreground/70 mt-0.5">
                              Updated: {formatDate(review.updated_at)}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground/50">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={review.is_featured || false}
                        onCheckedChange={(checked) =>
                          toggleFeaturedMutation.mutate({ id: review.id, is_featured: checked })
                        }
                      />
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

          {/* Pagination */}
          {filteredReviews.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{endIndex} of {filteredReviews.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-card text-foreground text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors ${
                        safePage === page
                          ? "bg-primary text-primary-foreground font-medium"
                          : "border border-border bg-card text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-card text-foreground text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
