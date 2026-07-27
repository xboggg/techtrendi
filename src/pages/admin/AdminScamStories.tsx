import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Trash2, RefreshCw, ChevronLeft, ChevronRight, Search,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, X, Save, Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryLabel } from "@/lib/scamStories";
import toast from "react-hot-toast";

interface ScamStory {
  id: string;
  story_text: string;
  media_url: string | null;
  media_type: "none" | "photo" | "video";
  name_or_alias: string;
  country: string;
  region: string;
  scam_category: string;
  status: string;
  admin_note: string | null;
  reaction_count: number;
  created_at: string;
}

const STATUSES = ["pending", "approved", "rejected"] as const;

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  approved: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/20" },
  rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20" },
};

const PER_PAGE = 15;

export default function AdminScamStories() {
  const [stories, setStories] = useState<ScamStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => { fetchStories(); }, []);

  const fetchStories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("security_scam_stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load stories");
      console.error(error);
    } else {
      setStories(data || []);
    }
    setLoading(false);
  };

  const filtered = stories.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.story_text?.toLowerCase().includes(q) && !s.name_or_alias?.toLowerCase().includes(q) && !s.region?.toLowerCase().includes(q)) return false;
    }
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total: stories.length,
    pending: stories.filter((s) => s.status === "pending").length,
    approved: stories.filter((s) => s.status === "approved").length,
    rejected: stories.filter((s) => s.status === "rejected").length,
  };

  const updateStatus = async (story: ScamStory, newStatus: string) => {
    const { error } = await supabase
      .from("security_scam_stories")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", story.id);

    if (error) toast.error("Failed to update status");
    else { toast.success(`Marked as ${newStatus}`); fetchStories(); }
  };

  const saveNote = async (story: ScamStory) => {
    const { error } = await supabase
      .from("security_scam_stories")
      .update({ admin_note: noteText.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", story.id);

    if (error) toast.error("Failed to save note");
    else { toast.success("Note saved"); setEditingNote(null); fetchStories(); }
  };

  const deleteStory = async (story: ScamStory) => {
    if (!confirm(`Delete this story from ${story.name_or_alias}?`)) return;
    const { error } = await supabase.from("security_scam_stories").delete().eq("id", story.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchStories(); }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Heart className="w-6 h-6" /> Scam Stories
            </h1>
            <p className="text-muted-foreground text-sm">Review user-submitted stories before they appear on /scam-stories</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStories}><RefreshCw className="w-4 h-4" /></Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Stories", value: stats.total, color: "text-foreground" },
            { label: "Pending Review", value: stats.pending, color: "text-yellow-400" },
            { label: "Approved", value: stats.approved, color: "text-green-400" },
            { label: "Rejected", value: stats.rejected, color: "text-red-400" },
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
              placeholder="Search stories, name, or region..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            <Button variant={filterStatus === "" ? "default" : "outline"} size="sm" onClick={() => { setFilterStatus(""); setPage(1); }}>All</Button>
            {STATUSES.map((s) => (
              <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => { setFilterStatus(s); setPage(1); }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No stories found</div>
        ) : (
          <div className="space-y-3">
            {paginated.map((story) => {
              const sc = statusConfig[story.status] || statusConfig.pending;
              const StatusIcon = sc.icon;
              const isExpanded = expandedId === story.id;

              return (
                <div key={story.id} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30"
                    onClick={() => setExpandedId(isExpanded ? null : story.id)}
                  >
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1", sc.bg, sc.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {story.status}
                    </span>
                    <Badge variant="outline" className="text-xs">{categoryLabel(story.scam_category)}</Badge>
                    {story.media_type !== "none" && (
                      <Badge variant="outline" className="text-xs">{story.media_type}</Badge>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground line-clamp-1">{story.story_text}</span>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:block">{story.name_or_alias} · {story.region}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Heart className="w-3 h-3" /> {story.reaction_count}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-4 bg-muted/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Submitted by</div>
                          <div className="text-sm text-foreground">{story.name_or_alias}</div>
                          <div className="text-xs text-muted-foreground">{story.region}, {story.country}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Submitted</div>
                          <div className="text-sm text-foreground">{new Date(story.created_at).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-1">Story</div>
                        <div className="text-sm text-foreground whitespace-pre-wrap bg-background rounded-lg p-3 border border-border/50">
                          {story.story_text}
                        </div>
                      </div>

                      {story.media_url && (
                        <div className="mb-4">
                          <div className="text-xs text-muted-foreground mb-1">Attached {story.media_type}</div>
                          {story.media_type === "video" ? (
                            <video src={story.media_url} controls className="max-h-64 rounded-lg border border-border" />
                          ) : (
                            <img src={story.media_url} alt="" className="max-h-64 rounded-lg border border-border" />
                          )}
                        </div>
                      )}

                      {/* Admin Note (private) */}
                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-1">Private Admin Note (never shown publicly)</div>
                        {editingNote === story.id ? (
                          <div className="flex gap-2">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              rows={2}
                              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="sm" onClick={() => saveNote(story)}><Save className="w-3 h-3" /></Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingNote(null)}><X className="w-3 h-3" /></Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="text-sm text-muted-foreground bg-background rounded-lg p-3 border border-border/50 cursor-pointer hover:border-primary/50 min-h-[40px]"
                            onClick={() => { setEditingNote(story.id); setNoteText(story.admin_note || ""); }}
                          >
                            {story.admin_note || "Click to add a note, e.g. how you verified this claim..."}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <div className="text-xs text-muted-foreground self-center mr-2">Set Status:</div>
                        {STATUSES.map((s) => (
                          <Button
                            key={s}
                            variant={story.status === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateStatus(story, s)}
                            disabled={story.status === s}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </Button>
                        ))}
                        <div className="flex-1" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteStory(story)}
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
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages} ({filtered.length} stories)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
