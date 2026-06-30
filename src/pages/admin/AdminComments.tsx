import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, RefreshCw, MessageCircle, EyeOff, CheckCircle, Flag, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Comment {
  id: string;
  article_slug: string;
  article_type: "blog" | "news";
  name: string;
  comment: string;
  parent_id: string | null;
  status: "visible" | "flagged" | "hidden";
  created_at: string;
}

type Filter = "all" | "flagged" | "visible" | "hidden";

const statusBadge: Record<string, { label: string; cls: string }> = {
  visible: { label: "Visible", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  flagged: { label: "Flagged", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  hidden: { label: "Hidden", cls: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
};

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("flagged");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Admin (authenticated) can read all statuses per RLS.
      const { data, error } = await supabase
        .from("comments")
        .select("id, article_slug, article_type, name, comment, parent_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setComments((data as Comment[]) || []);
    } catch {
      toast.error("Failed to load comments");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const setStatus = async (c: Comment, status: Comment["status"]) => {
    const { error } = await supabase.from("comments").update({ status }).eq("id", c.id);
    if (error) { toast.error("Update failed (are you logged in as admin?)"); return; }
    setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, status } : x)));
    toast.success(`Comment ${status === "visible" ? "approved" : status}`);
  };

  const remove = async (c: Comment) => {
    if (!confirm("Delete this comment permanently?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", c.id);
    if (error) { toast.error("Delete failed (are you logged in as admin?)"); return; }
    setComments((prev) => prev.filter((x) => x.id !== c.id));
    toast.success("Comment deleted");
  };

  const counts = {
    all: comments.length,
    flagged: comments.filter((c) => c.status === "flagged").length,
    visible: comments.filter((c) => c.status === "visible").length,
    hidden: comments.filter((c) => c.status === "hidden").length,
  };

  const shown = filter === "all" ? comments : comments.filter((c) => c.status === filter);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Comments Moderation</h1>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {counts.flagged > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <Flag className="w-4 h-4" />
            <span><strong>{counts.flagged}</strong> comment{counts.flagged === 1 ? "" : "s"} flagged for review (contained links or spam words — hidden from the public until you approve).</span>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {(["flagged", "visible", "hidden", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors border",
                filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {f} <span className="opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin inline" /></div>
        ) : shown.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No {filter === "all" ? "" : filter} comments.</div>
        ) : (
          <div className="space-y-3">
            {shown.map((c) => {
              const sb = statusBadge[c.status];
              const articleUrl = `/${c.article_type === "news" ? "news" : "blog"}/${c.article_slug}`;
              return (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{c.name}</span>
                      <Badge variant="outline" className={sb.cls}>{sb.label}</Badge>
                      {c.parent_id && <Badge variant="outline" className="text-xs">reply</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-primary hover:underline inline-flex items-center gap-1">
                      view <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  {/* plain text render — safe (no HTML injection) */}
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words mb-3">{c.comment}</p>
                  <div className="flex flex-wrap gap-2">
                    {c.status !== "visible" && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => setStatus(c, "visible")}>
                        <CheckCircle className="w-4 h-4" /> Approve / Show
                      </Button>
                    )}
                    {c.status !== "hidden" && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-muted-foreground" onClick={() => setStatus(c, "hidden")}>
                        <EyeOff className="w-4 h-4" /> Hide
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => remove(c)}>
                      <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
