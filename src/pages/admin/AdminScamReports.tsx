import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Trash2, RefreshCw, ChevronLeft, ChevronRight, Search,
  AlertTriangle, CheckCircle, XCircle, Clock, Eye, ChevronDown, ChevronUp,
  ArrowRight, X, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ScamReport {
  id: string;
  scam_type: string;
  scam_title: string;
  description: string;
  reporter_name: string | null;
  reporter_email: string | null;
  evidence_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUSES = ["pending", "verified", "published", "rejected"] as const;

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  verified: { icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/20" },
  published: { icon: Eye, color: "text-green-400", bg: "bg-green-500/20" },
  rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20" },
};

const PER_PAGE = 15;

export default function AdminScamReports() {
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [converting, setConverting] = useState<string | null>(null);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("security_scam_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load reports");
      console.error(error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const filtered = reports.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.scam_title?.toLowerCase().includes(q) && !r.reporter_name?.toLowerCase().includes(q) && !r.scam_type?.toLowerCase().includes(q)) return false;
    }
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    verified: reports.filter((r) => r.status === "verified").length,
    published: reports.filter((r) => r.status === "published").length,
  };

  const updateStatus = async (report: ScamReport, newStatus: string) => {
    const { error } = await supabase
      .from("security_scam_reports")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", report.id);

    if (error) toast.error("Failed to update status");
    else { toast.success(`Status changed to ${newStatus}`); fetchReports(); }
  };

  const saveNotes = async (report: ScamReport) => {
    const { error } = await supabase
      .from("security_scam_reports")
      .update({ admin_notes: notesText.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", report.id);

    if (error) toast.error("Failed to save notes");
    else { toast.success("Notes saved"); setEditingNotes(null); fetchReports(); }
  };

  const deleteReport = async (report: ScamReport) => {
    if (!confirm(`Delete report "${report.scam_title}"?`)) return;
    const { error } = await supabase.from("security_scam_reports").delete().eq("id", report.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchReports(); }
  };

  const convertToAlert = async (report: ScamReport) => {
    setConverting(report.id);

    const payload = {
      title: report.scam_title,
      description: report.description,
      scam_type: report.scam_type || "other",
      severity: "medium",
      emoji: "\u26a0\ufe0f",
      is_active: true,
      is_published: false,
    };

    const { error } = await supabase
      .from("security_scam_alerts")
      .insert([payload]);

    if (error) {
      toast.error("Failed to convert to alert");
      console.error(error);
    } else {
      // Mark report as published
      await supabase
        .from("security_scam_reports")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", report.id);

      toast.success("Converted to scam alert (unpublished draft)");
      fetchReports();
    }
    setConverting(null);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" /> Scam Reports
            </h1>
            <p className="text-muted-foreground text-sm">Review user-submitted scam reports</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchReports}><RefreshCw className="w-4 h-4" /></Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Reports", value: stats.total, color: "text-foreground" },
            { label: "Pending Review", value: stats.pending, color: "text-yellow-400" },
            { label: "Verified", value: stats.verified, color: "text-blue-400" },
            { label: "Published", value: stats.published, color: "text-green-400" },
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
              placeholder="Search reports..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            <Button
              variant={filterStatus === "" ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilterStatus(""); setPage(1); }}
            >
              All
            </Button>
            {STATUSES.map((s) => {
              const sc = statusConfig[s];
              return (
                <Button
                  key={s}
                  variant={filterStatus === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setFilterStatus(s); setPage(1); }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No reports found</div>
        ) : (
          <div className="space-y-3">
            {paginated.map((report) => {
              const sc = statusConfig[report.status] || statusConfig.pending;
              const StatusIcon = sc.icon;
              const isExpanded = expandedId === report.id;

              return (
                <div key={report.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  {/* Row Header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1", sc.bg, sc.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {report.status}
                    </span>
                    <Badge variant="outline" className="text-xs">{report.scam_type || "unknown"}</Badge>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground text-sm">{report.scam_title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {report.reporter_name || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Reporter</div>
                          <div className="text-sm text-foreground">{report.reporter_name || "Anonymous"}</div>
                          {report.reporter_email && (
                            <div className="text-xs text-muted-foreground">{report.reporter_email}</div>
                          )}
                        </div>
                        {report.evidence_url && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Evidence URL</div>
                            <a href={report.evidence_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all">
                              {report.evidence_url}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-1">Description</div>
                        <div className="text-sm text-foreground whitespace-pre-wrap bg-background rounded-lg p-3 border border-border/50">
                          {report.description}
                        </div>
                      </div>

                      {/* Admin Notes */}
                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-1">Admin Notes</div>
                        {editingNotes === report.id ? (
                          <div className="flex gap-2">
                            <textarea
                              value={notesText}
                              onChange={(e) => setNotesText(e.target.value)}
                              rows={2}
                              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="sm" onClick={() => saveNotes(report)}><Save className="w-3 h-3" /></Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingNotes(null)}><X className="w-3 h-3" /></Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="text-sm text-muted-foreground bg-background rounded-lg p-3 border border-border/50 cursor-pointer hover:border-primary/50 min-h-[40px]"
                            onClick={() => { setEditingNotes(report.id); setNotesText(report.admin_notes || ""); }}
                          >
                            {report.admin_notes || "Click to add notes..."}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <div className="text-xs text-muted-foreground self-center mr-2">Set Status:</div>
                        {STATUSES.map((s) => (
                          <Button
                            key={s}
                            variant={report.status === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateStatus(report, s)}
                            disabled={report.status === s}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </Button>
                        ))}
                        <div className="flex-1" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => convertToAlert(report)}
                          disabled={converting === report.id}
                          className="text-primary border-primary/50 hover:bg-primary/10"
                        >
                          {converting === report.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <ArrowRight className="w-4 h-4 mr-1" />
                          )}
                          Convert to Alert
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReport(report)}
                          className="text-destructive border-destructive/50 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({filtered.length} reports)
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
      </div>
    </AdminLayout>
  );
}
