import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image,
  Loader2,
  Search,
  Newspaper,
  Clock,
  Calendar,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 15;

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  cover_image: string | null;
  is_published: boolean;
  read_time_minutes: number | null;
  views: number | null;
  created_at: string;
  updated_at: string;
  meta_description: string | null;
  tags: string[] | null;
  author: string | null;
}

const NEWS_CATEGORIES = [
  { value: "AI Tech", label: "AI Tech" },
  { value: "Big Tech", label: "Big Tech" },
  { value: "Crypto", label: "Crypto" },
  { value: "Cybersecurity", label: "Cybersecurity" },
  { value: "Gadgets", label: "Gadgets" },
  { value: "Gaming", label: "Gaming" },
  { value: "Green Tech", label: "Green Tech" },
  { value: "Health Tech", label: "Health Tech" },
  { value: "Space", label: "Space" },
  { value: "Startups", label: "Startups" },
];

const initialNewsState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "AI Tech",
  cover_image: "",
  is_published: false,
  read_time_minutes: 3,
  meta_description: "",
  tags: "",
  author: "TechTrendi Team",
};

export default function AdminNews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState(initialNewsState);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "drafts" | "today">("all");
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch news
  const { data: news = [], isLoading } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as NewsItem[];
    },
  });

  // Create news mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("news").insert({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content,
        category: data.category,
        cover_image: data.cover_image || null,
        is_published: data.is_published,
        read_time_minutes: data.read_time_minutes,
        meta_description: data.meta_description || null,
        tags: data.tags ? data.tags.split(",").map(t => t.trim()) : null,
        author: data.author || "TechTrendi Team",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast({ title: "News article created successfully!" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating news", description: String(error), variant: "destructive" });
    },
  });

  // Update news mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("news")
        .update({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt || null,
          content: data.content,
          category: data.category,
          cover_image: data.cover_image || null,
          is_published: data.is_published,
          read_time_minutes: data.read_time_minutes,
          meta_description: data.meta_description || null,
          tags: data.tags ? data.tags.split(",").map(t => t.trim()) : null,
          author: data.author || "TechTrendi Team",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast({ title: "News article updated successfully!" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error updating news", description: String(error), variant: "destructive" });
    },
  });

  // Delete news mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast({ title: "News article deleted successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error deleting news", description: String(error), variant: "destructive" });
    },
  });

  // Toggle publish status
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("news")
        .update({ is_published, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast({ title: "Publication status updated!" });
    },
  });

  const resetForm = () => {
    setFormData(initialNewsState);
    setEditingNews(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: NewsItem) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt || "",
      content: item.content,
      category: item.category,
      cover_image: item.cover_image || "",
      is_published: item.is_published,
      read_time_minutes: item.read_time_minutes || 3,
      meta_description: item.meta_description || "",
      tags: item.tags?.join(", ") || "",
      author: item.author || "TechTrendi Team",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNews) {
      updateMutation.mutate({ id: editingNews.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { optimizeImage } = await import("@/lib/image-optimize");
      const { blob, fileName } = await optimizeImage(file);

      const uploadForm = new FormData();
      uploadForm.append("file", blob, fileName);
      uploadForm.append("folder", "news");

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
      setFormData(prev => ({ ...prev, cover_image: url }));
      toast({ title: "Image uploaded & optimized!" });
    } catch (error) {
      toast({ title: "Error uploading image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Filter news
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        filterCategory === "all" || item.category === filterCategory;

      let matchesStatus = true;
      if (filterStatus === "published") matchesStatus = item.is_published;
      else if (filterStatus === "drafts") matchesStatus = !item.is_published;
      else if (filterStatus === "today") {
        const date = new Date(item.created_at);
        const today = new Date();
        matchesStatus = date.toDateString() === today.toDateString();
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [news, searchQuery, filterCategory, filterStatus]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredNews.length);
  const paginatedNews = filteredNews.slice(startIndex, endIndex);

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout
      title="News Management"
      description="Create and manage tech news articles"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {NEWS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add News
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5" />
                  {editingNews ? "Edit News Article" : "Create News Article"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          title: e.target.value,
                          slug: generateSlug(e.target.value),
                        });
                      }}
                      placeholder="Enter news title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      placeholder="url-friendly-slug"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NEWS_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) =>
                        setFormData({ ...formData, author: e.target.value })
                      }
                      placeholder="Author name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="read_time">Read Time (minutes)</Label>
                    <Input
                      id="read_time"
                      type="number"
                      min="1"
                      value={formData.read_time_minutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          read_time_minutes: parseInt(e.target.value) || 3,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                      placeholder="AI, technology, breaking news"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt / Summary</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    placeholder="Brief summary of the news article"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description (SEO)</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) =>
                      setFormData({ ...formData, meta_description: e.target.value })
                    }
                    placeholder="SEO meta description (155 characters max)"
                    rows={2}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.meta_description.length}/160 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <Input
                        value={formData.cover_image}
                        onChange={(e) =>
                          setFormData({ ...formData, cover_image: e.target.value })
                        }
                        placeholder="Image URL or upload below"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                      />
                      <Button type="button" variant="outline" disabled={uploading}>
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Image className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {formData.cover_image && (
                    <img
                      src={formData.cover_image}
                      alt="Preview"
                      className="mt-2 max-h-40 rounded-lg object-cover"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Content (HTML supported)</Label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    placeholder="Write your news article content..."
                  />
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) =>
                        setFormData({ ...formData, is_published: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Publish immediately</span>
                  </label>

                  <div className="flex-1" />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingNews ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats - clickable filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => { setFilterStatus(filterStatus === "all" ? "all" : "all"); setCurrentPage(1); setFilterStatus("all"); }}
            className={`bg-card border rounded-xl p-4 text-left transition-all hover:shadow-md ${filterStatus === "all" ? "ring-2 ring-primary border-primary" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Newspaper className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{news.length}</p>
                <p className="text-xs text-muted-foreground">Total News</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => { setFilterStatus(filterStatus === "published" ? "all" : "published"); setCurrentPage(1); }}
            className={`bg-card border rounded-xl p-4 text-left transition-all hover:shadow-md ${filterStatus === "published" ? "ring-2 ring-green-500 border-green-500" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Eye className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {news.filter((n) => n.is_published).length}
                </p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => { setFilterStatus(filterStatus === "drafts" ? "all" : "drafts"); setCurrentPage(1); }}
            className={`bg-card border rounded-xl p-4 text-left transition-all hover:shadow-md ${filterStatus === "drafts" ? "ring-2 ring-yellow-500 border-yellow-500" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <EyeOff className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {news.filter((n) => !n.is_published).length}
                </p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => { setFilterStatus(filterStatus === "today" ? "all" : "today"); setCurrentPage(1); }}
            className={`bg-card border rounded-xl p-4 text-left transition-all hover:shadow-md ${filterStatus === "today" ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {news.filter((n) => {
                    const date = new Date(n.created_at);
                    const today = new Date();
                    return date.toDateString() === today.toDateString();
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </button>
        </div>

        {/* News Table */}
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredNews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No news articles found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedNews.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.cover_image ? (
                        <img
                          src={item.cover_image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Newspaper className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          /news/{item.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.is_published ? "default" : "outline"}
                        className={item.is_published ? "bg-green-500" : ""}
                      >
                        {item.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            togglePublishMutation.mutate({
                              id: item.id,
                              is_published: !item.is_published,
                            })
                          }
                          title={item.is_published ? "Unpublish" : "Publish"}
                        >
                          {item.is_published ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Delete this news article?")) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
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
          {filteredNews.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{endIndex} of {filteredNews.length}
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
