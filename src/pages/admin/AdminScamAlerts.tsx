import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plus, Eye, EyeOff, Trash2, Edit3, Save, X, RefreshCw,
  ChevronLeft, ChevronRight, Search, AlertTriangle, Shield, Power, PowerOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ScamAlert {
  id: string;
  title: string;
  description: string;
  scam_type: string;
  severity: string;
  emoji: string;
  affected_platforms: string[] | null;
  what_to_do: string | null;
  is_active: boolean;
  is_published: boolean;
  views: number;
  created_at: string;
}

const SCAM_TYPES = [
  "phishing", "vishing", "smishing", "romance", "investment",
  "lottery", "impersonation", "tech_support", "mobile_money",
  "employment", "advance_fee", "other"
];

const SEVERITIES = ["low", "medium", "high", "critical"];

const severityColor: Record<string, string> = {
  low: "bg-green-500/20 text-green-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

const PER_PAGE = 15;

export default function AdminScamAlerts() {
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState<ScamAlert | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "", description: "", scam_type: "phishing", severity: "medium",
    emoji: "\u26a0\ufe0f", affected_platforms: "", what_to_do: "",
  });

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("security_scam_alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load alerts");
      console.error(error);
    } else {
      setAlerts(data || []);
    }
    setLoading(false);
  };

  const filtered = alerts.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && a.scam_type !== filterType) return false;
    if (filterSeverity && a.severity !== filterSeverity) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total: alerts.length,
    active: alerts.filter((a) => a.is_active).length,
    published: alerts.filter((a) => a.is_published).length,
    highCritical: alerts.filter((a) => a.severity === "high" || a.severity === "critical").length,
  };

  const openCreate = () => {
    setEditingAlert(null);
    setForm({ title: "", description: "", scam_type: "phishing", severity: "medium", emoji: "\u26a0\ufe0f", affected_platforms: "", what_to_do: "" });
    setShowDialog(true);
  };

  const openEdit = (alert: ScamAlert) => {
    setEditingAlert(alert);
    setForm({
      title: alert.title,
      description: alert.description || "",
      scam_type: alert.scam_type,
      severity: alert.severity,
      emoji: alert.emoji || "\u26a0\ufe0f",
      affected_platforms: (alert.affected_platforms || []).join(", "),
      what_to_do: alert.what_to_do || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      scam_type: form.scam_type,
      severity: form.severity,
      emoji: form.emoji,
      affected_platforms: form.affected_platforms ? form.affected_platforms.split(",").map((s) => s.trim()).filter(Boolean) : [],
      what_to_do: form.what_to_do.trim() || null,
    };

    if (editingAlert) {
      const { error } = await supabase
        .from("security_scam_alerts")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingAlert.id);

      if (error) toast.error("Failed to update alert");
      else { toast.success("Alert updated"); setShowDialog(false); fetchAlerts(); }
    } else {
      const { error } = await supabase
        .from("security_scam_alerts")
        .insert([payload]);

      if (error) toast.error("Failed to create alert");
      else { toast.success("Alert created"); setShowDialog(false); fetchAlerts(); }
    }
    setSaving(false);
  };

  const togglePublish = async (alert: ScamAlert) => {
    const { error } = await supabase
      .from("security_scam_alerts")
      .update({ is_published: !alert.is_published, updated_at: new Date().toISOString() })
      .eq("id", alert.id);

    if (error) toast.error("Failed to update");
    else { toast.success(alert.is_published ? "Unpublished" : "Published"); fetchAlerts(); }
  };

  const toggleActive = async (alert: ScamAlert) => {
    const { error } = await supabase
      .from("security_scam_alerts")
      .update({ is_active: !alert.is_active, updated_at: new Date().toISOString() })
      .eq("id", alert.id);

    if (error) toast.error("Failed to update");
    else { toast.success(alert.is_active ? "Deactivated" : "Activated"); fetchAlerts(); }
  };

  const deleteAlert = async (alert: ScamAlert) => {
    if (!confirm(`Delete "${alert.title}"?`)) return;
    const { error } = await supabase.from("security_scam_alerts").delete().eq("id", alert.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchAlerts(); }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Scam Alerts</h1>
            <p className="text-muted-foreground text-sm">Manage security scam alerts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAlerts}><RefreshCw className="w-4 h-4" /></Button>
            <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New Alert</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Active", value: stats.active, color: "text-green-400" },
            { label: "Published", value: stats.published, color: "text-blue-400" },
            { label: "High/Critical", value: stats.highCritical, color: "text-red-400" },
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
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Types</option>
            {SCAM_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Severities</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No alerts found</div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-3">Emoji</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Active</th>
                  <th className="p-3">Published</th>
                  <th className="p-3">Views</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((alert) => (
                  <tr key={alert.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-xl">{alert.emoji}</td>
                    <td className="p-3 font-medium text-foreground max-w-[200px] truncate">{alert.title}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">{alert.scam_type.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="p-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", severityColor[alert.severity] || "")}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => toggleActive(alert)} className="hover:opacity-80">
                        {alert.is_active ? <Power className="w-4 h-4 text-green-400" /> : <PowerOff className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <button onClick={() => togglePublish(alert)} className="hover:opacity-80">
                        {alert.is_published ? <Eye className="w-4 h-4 text-blue-400" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </td>
                    <td className="p-3 text-muted-foreground">{alert.views}</td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(alert.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(alert)} className="p-1 hover:text-primary"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteAlert(alert)} className="p-1 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
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
              Page {page} of {totalPages} ({filtered.length} alerts)
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
                <h2 className="text-lg font-bold text-foreground">{editingAlert ? "Edit Alert" : "New Scam Alert"}</h2>
                <button onClick={() => setShowDialog(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-20">
                    <label className="text-xs text-muted-foreground block mb-1">Emoji</label>
                    <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Title *</label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Scam Type</label>
                    <select
                      value={form.scam_type}
                      onChange={(e) => setForm({ ...form, scam_type: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {SCAM_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Severity</label>
                    <select
                      value={form.severity}
                      onChange={(e) => setForm({ ...form, severity: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Affected Platforms (comma-separated)</label>
                  <Input
                    value={form.affected_platforms}
                    onChange={(e) => setForm({ ...form, affected_platforms: e.target.value })}
                    placeholder="WhatsApp, Telegram, SMS"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">What To Do</label>
                  <textarea
                    value={form.what_to_do}
                    onChange={(e) => setForm({ ...form, what_to_do: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Steps users should take..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                    {editingAlert ? "Update" : "Create"}
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
