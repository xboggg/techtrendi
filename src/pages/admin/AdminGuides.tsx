import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Star, Clock, Eye, Search, Home, ChevronLeft, ChevronRight, Link2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Link } from "react-router-dom";

interface Guide {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  cover_image: string | null;
  read_time_minutes: number | null;
  views: number | null;
  is_published: boolean;
  is_featured: boolean;
  homepage_featured: boolean;
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://db.techtrendi.com";
const REWRITE_API = import.meta.env.VITE_ARTICLE_API_URL || "https://db.techtrendi.com/api";
const ITEMS_PER_PAGE = 15;

const GUIDE_CATEGORIES = [
  "Phones", "Security", "AI Tech", "Productivity", "How-To", "Side Hustles",
  "Gaming", "Accessories", "Career in Tech", "Health Tech", "Remote Work", "Green Tech",
];

export default function AdminGuides() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "drafts" | "today">("all");
  const [filterHomepage, setFilterHomepage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Rewrite from URL state
  const [rewriteDialogOpen, setRewriteDialogOpen] = useState(false);
  const [rewriteUrls, setRewriteUrls] = useState("");
  const [rewriteCategory, setRewriteCategory] = useState(GUIDE_CATEGORIES[0]);
  const [rewriteGenerating, setRewriteGenerating] = useState(false);

  const handleRewriteFromUrl = async () => {
    const urls = rewriteUrls.trim().split(/[\n\s]+/).filter((u) => u.startsWith("http"));
    if (urls.length === 0) return;
    setRewriteGenerating(true);
    try {
      const res = await fetch(`${REWRITE_API}/rewrite-from-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ""}`,
        },
        body: JSON.stringify({
          content_type: "guide",
          category: rewriteCategory,
          urls,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      const result = await res.json();
      toast({ title: "Guide rewritten & published!", description: `"${result.title}" from ${urls.length} source(s)` });
      queryClient.invalidateQueries({ queryKey: ["admin-guides"] });
      setRewriteDialogOpen(false);
      setRewriteUrls("");
    } catch (err) {
      toast({ title: "Rewrite failed", description: String(err), variant: "destructive" });
    } finally {
      setRewriteGenerating(false);
    }
  };

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["admin-guides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, excerpt, category, cover_image, read_time_minutes, views, is_published, is_featured, homepage_featured, created_at")
        .eq("content_type", "guide")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Guide[];
    },
    refetchInterval: 30000,
  });

  const toggleHomepage = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("articles")
        .update({ homepage_featured: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guides"] });
      toast({ title: "Guide updated!" });
    },
    onError: (err) => {
      toast({ title: "Update failed", description: String(err), variant: "destructive" });
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("articles")
        .update({ is_featured: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guides"] });
      toast({ title: "Featured status updated!" });
    },
    onError: (err) => {
      toast({ title: "Update failed", description: String(err), variant: "destructive" });
    },
  });

  const categories = useMemo(() => {
    const cats = new Set(guides.map((g) => g.category));
    return Array.from(cats).sort();
  }, [guides]);

  const homepageCount = guides.filter((g) => g.homepage_featured).length;
  const totalViews = useMemo(() => guides.reduce((sum, g) => sum + (g.views || 0), 0), [guides]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return guides.filter((g) => {
      const matchesSearch = !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === "all" || g.category === filterCategory;
      const matchesHomepage = !filterHomepage || g.homepage_featured;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "published" && g.is_published) ||
        (filterStatus === "drafts" && !g.is_published) ||
        (filterStatus === "today" && g.created_at.slice(0, 10) === todayStr);
      return matchesSearch && matchesCategory && matchesHomepage && matchesStatus;
    });
  }, [guides, search, filterCategory, filterHomepage, filterStatus, todayStr]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filtered.length);
  const paginated = filtered.slice(startIndex, endIndex);

  const handleStatusFilter = (status: "all" | "published" | "drafts" | "today") => {
    setFilterStatus((prev) => (prev === status ? "all" : status));
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setFilterCategory(value);
    setCurrentPage(1);
  };

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Guides</h1>
            <p className="text-muted-foreground">Manage your guide articles and homepage featured picks.</p>
          </div>

          <Dialog open={rewriteDialogOpen} onOpenChange={setRewriteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-cyan-500/50 text-cyan-600 hover:bg-cyan-500/10">
                <Link2 className="w-4 h-4 mr-2" />
                Rewrite Guide from URL
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-cyan-500" />
                  Rewrite Guide from URL
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Source URL(s) *</Label>
                  <Textarea
                    placeholder={"Paste guide/tutorial URL(s) (one per line):\nhttps://example.com/how-to-1\nhttps://example.com/guide-2"}
                    value={rewriteUrls}
                    onChange={(e) => setRewriteUrls(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    AI scrapes these sources and writes a completely original TechTrendi guide. Multiple URLs get synthesized into one richer guide.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={rewriteCategory} onValueChange={setRewriteCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GUIDE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleRewriteFromUrl}
                  disabled={rewriteGenerating || !rewriteUrls.trim()}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                >
                  {rewriteGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rewriting guide... (60-90s)
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Rewrite & Publish Guide
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <button
            onClick={() => handleStatusFilter("all")}
            className={`text-left transition-all hover:shadow-md bg-card border border-border rounded-lg p-4 ${filterStatus === "all" ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Total Guides</span>
            </div>
            <p className="text-2xl font-bold">{guides.length}</p>
          </button>
          <button
            onClick={() => handleStatusFilter("published")}
            className={`text-left transition-all hover:shadow-md bg-card border border-border rounded-lg p-4 ${filterStatus === "published" ? "ring-2 ring-green-500" : ""}`}
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Published</span>
            </div>
            <p className="text-2xl font-bold">{guides.filter((g) => g.is_published).length}</p>
          </button>
          <button
            onClick={() => handleStatusFilter("drafts")}
            className={`text-left transition-all hover:shadow-md bg-card border border-border rounded-lg p-4 ${filterStatus === "drafts" ? "ring-2 ring-yellow-500" : ""}`}
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">Drafts</span>
            </div>
            <p className="text-2xl font-bold">{guides.filter((g) => !g.is_published).length}</p>
          </button>
          <button
            onClick={() => handleStatusFilter("today")}
            className={`text-left transition-all hover:shadow-md bg-card border border-border rounded-lg p-4 ${filterStatus === "today" ? "ring-2 ring-blue-500" : ""}`}
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Today</span>
            </div>
            <p className="text-2xl font-bold">{guides.filter((g) => g.created_at.slice(0, 10) === todayStr).length}</p>
          </button>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">Featured</span>
            </div>
            <p className="text-2xl font-bold">{guides.filter((g) => g.is_featured).length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Home className="w-4 h-4 text-blue-500" />
              <span className="text-sm">On Homepage</span>
            </div>
            <p className="text-2xl font-bold">{homepageCount}<span className="text-sm font-normal text-muted-foreground"> / 8</span></p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="w-4 h-4 text-green-500" />
              <span className="text-sm">Total Views</span>
            </div>
            <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
          </div>
        </div>

        {/* Search + Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search guides..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={() => { setFilterHomepage(!filterHomepage); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              filterHomepage
                ? "bg-blue-500/10 text-blue-600 border border-blue-500/30 hover:bg-blue-500/20"
                : "border border-border bg-card text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Home className="w-4 h-4" />
            Homepage Only ({homepageCount})
          </button>
        </div>

        {/* Guide List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading guides...</div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Guide</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Category</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Views</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      <span className="flex items-center justify-center gap-1">
                        <Star className="w-3 h-3" /> Featured
                      </span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((guide) => (
                    <tr key={guide.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {guide.cover_image ? (
                            <img src={guide.cover_image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <BookOpen className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-foreground line-clamp-1 flex items-center gap-1">
                              {guide.is_featured && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                              {guide.title}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {guide.read_time_minutes || 5} min read
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{guide.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {guide.views || 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleFeatured.mutate({ id: guide.id, value: !guide.is_featured })}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            guide.is_featured
                              ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 hover:bg-yellow-500/20"
                              : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                          }`}
                        >
                          <Star className={`w-3 h-3 ${guide.is_featured ? "fill-yellow-500" : ""}`} />
                          {guide.is_featured ? "Featured" : "Set Featured"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/guides/edit/${guide.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {search || filterCategory !== "all" ? "No guides match your filters." : "No guides found."}
              </div>
            )}

            {/* Pagination */}
            {filtered.length > ITEMS_PER_PAGE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{endIndex} of {filtered.length}
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
        )}
      </div>
    </AdminLayout>
  );
}
