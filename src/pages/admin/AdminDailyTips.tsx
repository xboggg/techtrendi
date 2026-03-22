import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plus, Eye, EyeOff, Trash2, Edit3, Save, X, RefreshCw,
  ChevronLeft, ChevronRight, Search, Upload, Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface DailyTip {
  id: string;
  tip_text: string;
  category: string;
  emoji: string;
  source: string | null;
  display_date: string | null;
  is_published: boolean;
  views: number;
  created_at: string;
}

const CATEGORIES = [
  "general", "mobile_money", "phishing", "passwords", "mobile", "phone_scam",
  "authentication", "network", "backup", "monitoring", "privacy", "shopping",
  "social_media", "browsing", "malware", "family"
];

const PER_PAGE = 15;

export default function AdminDailyTips() {
  const [tips, setTips] = useState<DailyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingTip, setEditingTip] = useState<DailyTip | null>(null);
  const [saving, setSaving] = useState(false);

  // Bulk import
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkCategory, setBulkCategory] = useState("general");
  const [bulkImporting, setBulkImporting] = useState(false);

  // Form
  const [form, setForm] = useState({
    tip_text: "", category: "general", emoji: "\ud83d\udca1", source: "", display_date: "",
  });

  useEffect(() => { fetchTips(); }, []);

  const fetchTips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("security_daily_tips")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load tips");
      console.error(error);
    } else {
      setTips(data || []);
    }
    setLoading(false);
  };

  const filtered = tips.filter((t) => {
    if (search && !t.tip_text.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const uniqueCategories = [...new Set(tips.map((t) => t.category))];
  const stats = {
    total: tips.length,
    published: tips.filter((t) => t.is_published).length,
    withDate: tips.filter((t) => t.display_date).length,
    categories: uniqueCategories.length,
  };

  const openCreate = () => {
    setEditingTip(null);
    setForm({ tip_text: "", category: "general", emoji: "\ud83d\udca1", source: "", display_date: "" });
    setShowDialog(true);
  };

  const openEdit = (tip: DailyTip) => {
    setEditingTip(tip);
    setForm({
      tip_text: tip.tip_text,
      category: tip.category,
      emoji: tip.emoji || "\ud83d\udca1",
      source: tip.source || "",
      display_date: tip.display_date || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.tip_text.trim()) {
      toast.error("Tip text is required");
      return;
    }
    setSaving(true);

    const payload = {
      tip_text: form.tip_text.trim(),
      category: form.category,
      emoji: form.emoji,
      source: form.source.trim() || null,
      display_date: form.display_date || null,
    };

    if (editingTip) {
      const { error } = await supabase
        .from("security_daily_tips")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingTip.id);

      if (error) toast.error("Failed to update tip");
      else { toast.success("Tip updated"); setShowDialog(false); fetchTips(); }
    } else {
      const { error } = await supabase
        .from("security_daily_tips")
        .insert([payload]);

      if (error) toast.error("Failed to create tip");
      else { toast.success("Tip created"); setShowDialog(false); fetchTips(); }
    }
    setSaving(false);
  };

  const togglePublish = async (tip: DailyTip) => {
    const { error } = await supabase
      .from("security_daily_tips")
      .update({ is_published: !tip.is_published, updated_at: new Date().toISOString() })
      .eq("id", tip.id);

    if (error) toast.error("Failed to update");
    else { toast.success(tip.is_published ? "Unpublished" : "Published"); fetchTips(); }
  };

  const deleteTip = async (tip: DailyTip) => {
    if (!confirm("Delete this tip?")) return;
    const { error } = await supabase.from("security_daily_tips").delete().eq("id", tip.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchTips(); }
  };

  const handleBulkImport = async () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error("No tips to import");
      return;
    }
    setBulkImporting(true);

    const rows = lines.map((line) => ({
      tip_text: line,
      category: bulkCategory,
      emoji: "\ud83d\udca1",
      is_published: false,
    }));

    const { error } = await supabase.from("security_daily_tips").insert(rows);

    if (error) {
      toast.error("Bulk import failed");
      console.error(error);
    } else {
      toast.success(`Imported ${lines.length} tips`);
      setBulkText("");
      setShowBulkImport(false);
      fetchTips();
    }
    setBulkImporting(false);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="w-6 h-6" /> Daily Tips
            </h1>
            <p className="text-muted-foreground text-sm">Manage security daily tips</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTips}><RefreshCw className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setShowBulkImport(true)}>
              <Upload className="w-4 h-4 mr-1" /> Bulk Import
            </Button>
            <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Tip</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Tips", value: stats.total, color: "text-foreground" },
            { label: "Published", value: stats.published, color: "text-green-400" },
            { label: "With Display Date", value: stats.withDate, color: "text-blue-400" },
            { label: "Categories Used", value: stats.categories, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tips..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No tips found</div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-3">Emoji</th>
                  <th className="p-3">Tip</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Published</th>
                  <th className="p-3">Views</th>
                  <th className="p-3">Display Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((tip) => (
                  <tr key={tip.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-xl">{tip.emoji}</td>
                    <td className="p-3 text-foreground max-w-[300px]">
                      <span className="line-clamp-2">{tip.tip_text}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">{tip.category.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs max-w-[100px] truncate">{tip.source || "-"}</td>
                    <td className="p-3">
                      <button onClick={() => togglePublish(tip)} className="hover:opacity-80">
                        {tip.is_published ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </td>
                    <td className="p-3 text-muted-foreground">{tip.views}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {tip.display_date ? new Date(tip.display_date).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(tip)} className="p-1 hover:text-primary"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteTip(tip)} className="p-1 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({filtered.length} tips)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Create/Edit Dialog */}
        {showDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDialog(false)}>
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">{editingTip ? "Edit Tip" : "New Daily Tip"}</h2>
                <button onClick={() => setShowDialog(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Tip Text *</label>
                  <textarea
                    value={form.tip_text}
                    onChange={(e) => setForm({ ...form, tip_text: e.target.value })}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Enter your security tip..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Emoji</label>
                    <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Source (optional)</label>
                  <Input
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    placeholder="e.g. CERT-GH, NCSC"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Display Date (optional)</label>
                  <Input
                    type="date"
                    value={form.display_date}
                    onChange={(e) => setForm({ ...form, display_date: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                    {editingTip ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Import Dialog */}
        {showBulkImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowBulkImport(false)}>
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Bulk Import Tips</h2>
                <button onClick={() => setShowBulkImport(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Category for all imported tips</label>
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Tips (one per line)
                  </label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={10}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    placeholder="Never share your OTP with anyone&#10;Use a password manager for unique passwords&#10;Enable two-factor authentication on all accounts"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {bulkText.split("\n").filter((l) => l.trim()).length} tips detected
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowBulkImport(false)}>Cancel</Button>
                  <Button onClick={handleBulkImport} disabled={bulkImporting}>
                    {bulkImporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                    Import
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
