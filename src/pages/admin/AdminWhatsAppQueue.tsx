import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle, Copy, CheckCheck, Clock, RotateCcw,
  Edit2, ExternalLink, Search, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface QueueRow {
  id: string;
  article_id: string;
  channel_post: string;
  group_post: string;
  channel_sent_at: string | null;
  group_sent_at: string | null;
  custom_hook: string | null;
  created_at: string;
  updated_at: string;
  article: {
    id: string;
    title: string;
    slug: string;
    category: string;
    excerpt: string | null;
    created_at: string;
  };
}

type FilterStatus = "all" | "pending" | "posted";

export default function AdminWhatsAppQueue() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editChannel, setEditChannel] = useState("");
  const [editGroup, setEditGroup] = useState("");

  // Fetch queue with article join
  const { data: queue = [], isLoading } = useQuery({
    queryKey: ["whatsapp-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_queue")
        .select("*, article:articles!whatsapp_queue_article_id_fkey(id, title, slug, category, excerpt, created_at)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as QueueRow[];
    },
  });

  // Mutations
  const markSent = useMutation({
    mutationFn: async ({ id, target }: { id: string; target: "channel" | "group" }) => {
      const field = target === "channel" ? "channel_sent_at" : "group_sent_at";
      const { error } = await supabase
        .from("whatsapp_queue")
        .update({ [field]: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-queue"] }),
  });

  const markUnsent = useMutation({
    mutationFn: async ({ id, target }: { id: string; target: "channel" | "group" | "both" }) => {
      const update: Record<string, null> = {};
      if (target === "channel" || target === "both") update.channel_sent_at = null;
      if (target === "group" || target === "both") update.group_sent_at = null;
      const { error } = await supabase.from("whatsapp_queue").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-queue"] }),
  });

  const savePost = useMutation({
    mutationFn: async ({ id, channel, group }: { id: string; channel: string; group: string }) => {
      const { error } = await supabase
        .from("whatsapp_queue")
        .update({ channel_post: channel, group_post: group, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp-queue"] });
      setEditingId(null);
      toast({ title: "Saved", description: "Post updated" });
    },
  });

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const pending = queue.filter(q => !q.channel_sent_at || !q.group_sent_at).length;
    const sentWeek = queue.filter(q => {
      const dates = [q.channel_sent_at, q.group_sent_at].filter(Boolean).map(d => new Date(d!));
      return dates.some(d => d > weekAgo);
    }).length;
    const sentMonth = queue.filter(q => {
      const dates = [q.channel_sent_at, q.group_sent_at].filter(Boolean).map(d => new Date(d!));
      return dates.some(d => d > monthAgo);
    }).length;

    return { pending, sentWeek, sentMonth };
  }, [queue]);

  // Filtered list
  const filteredQueue = useMemo(() => {
    return queue.filter(q => {
      if (!q.article) return false;
      if (filter === "pending" && q.channel_sent_at && q.group_sent_at) return false;
      if (filter === "posted" && (!q.channel_sent_at || !q.group_sent_at)) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!q.article.title.toLowerCase().includes(s) && !q.article.category.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [queue, filter, search]);

  const copyAndMark = async (row: QueueRow, target: "channel" | "group") => {
    const text = target === "channel" ? row.channel_post : row.group_post;
    try {
      await navigator.clipboard.writeText(text);
      await markSent.mutateAsync({ id: row.id, target });
      toast({ title: `Copied ${target} post`, description: "Paste it into WhatsApp" });
    } catch {
      toast({ title: "Copy failed", description: "Try selecting and copying manually", variant: "destructive" });
    }
  };

  const beginEdit = (row: QueueRow) => {
    setEditingId(row.id);
    setEditChannel(row.channel_post);
    setEditGroup(row.group_post);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">WhatsApp Queue</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Auto-generated WhatsApp posts for every published article. Copy with one tap.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-3 md:p-4">
            <div className="text-2xl md:text-3xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 md:p-4">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.sentWeek}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Sent this week</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 md:p-4">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.sentMonth}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Sent this month</div>
          </div>
        </div>

        {/* Filter + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(["all", "pending", "posted"] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                  filter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {s} {s === "all" && `(${queue.length})`}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or category..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Queue list */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading queue...</div>
        ) : filteredQueue.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No posts in this view</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQueue.map(row => {
              const channelDone = !!row.channel_sent_at;
              const groupDone = !!row.group_sent_at;
              const bothDone = channelDone && groupDone;
              const editing = editingId === row.id;

              return (
                <div key={row.id} className={cn(
                  "bg-card border rounded-xl p-4 transition-all",
                  bothDone ? "border-green-200 dark:border-green-900/30 opacity-75" : "border-border"
                )}>
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{row.article.category}</Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(row.article.created_at)}
                        </span>
                        {channelDone && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCheck className="w-3 h-3" /> Channel</span>}
                        {groupDone && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCheck className="w-3 h-3" /> Group</span>}
                        {!bothDone && <span className="text-xs text-amber-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>}
                      </div>
                      <h3 className="font-semibold text-foreground text-sm md:text-base leading-snug">
                        <Link to={`/blog/${row.article.slug}`} target="_blank" className="hover:text-primary inline-flex items-center gap-1">
                          {row.article.title}
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </Link>
                      </h3>
                    </div>
                  </div>

                  {/* Post preview / editor */}
                  {editing ? (
                    <div className="space-y-3 mb-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Channel post</label>
                        <Textarea value={editChannel} onChange={e => setEditChannel(e.target.value)} rows={6} className="text-sm font-mono" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Group post</label>
                        <Textarea value={editGroup} onChange={e => setEditGroup(e.target.value)} rows={6} className="text-sm font-mono" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => savePost.mutate({ id: row.id, channel: editChannel, group: editGroup })}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-3 mb-3 text-xs md:text-sm whitespace-pre-wrap font-mono text-muted-foreground max-h-32 overflow-y-auto">
                      {row.channel_post}
                    </div>
                  )}

                  {/* Action buttons */}
                  {!editing && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => copyAndMark(row, "channel")}
                        className={channelDone ? "bg-muted text-muted-foreground hover:bg-muted/80" : "bg-green-600 hover:bg-green-700 text-white"}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        {channelDone ? "Copy Channel again" : "Copy for Channel"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => copyAndMark(row, "group")}
                        className={groupDone ? "bg-muted text-muted-foreground hover:bg-muted/80" : "bg-green-600 hover:bg-green-700 text-white"}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        {groupDone ? "Copy Group again" : "Copy for Group"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => beginEdit(row)}>
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      {(channelDone || groupDone) && (
                        <Button size="sm" variant="ghost" onClick={() => markUnsent.mutate({ id: row.id, target: "both" })}
                          className="text-muted-foreground">
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Mark unsent
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
