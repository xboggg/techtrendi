import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Eye, EyeOff, Trash2, Edit3, Save, X, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Post {
  id: string;
  number: number;
  title: string;
  emoji: string;
  category: string;
  content: string | null;
  is_published: boolean;
  views: number;
  created_at: string;
}

const GENERATE_API = "https://db.techtrendi.com/api/generate-card";

export default function AdminCyberAwareness() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [adminPage, setAdminPage] = useState(1);
  const ADMIN_PER_PAGE = 10;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cyber_awareness_posts")
      .select("*")
      .order("number", { ascending: true });

    if (error) {
      toast.error("Failed to load posts");
      console.error(error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const generateContent = async (post: Post) => {
    setGenerating(post.id);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const authToken = authSession?.access_token || "";

      const res = await fetch(GENERATE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: post.title,
          category: post.category,
          type: "cyber_awareness",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${res.status}`);
      }
      const data = await res.json();
      const content = data.content;

      if (!content) throw new Error("No content returned");

      const { error } = await supabase
        .from("cyber_awareness_posts")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", post.id);

      if (error) throw error;
      toast.success(`Generated content for #${post.number}`);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const togglePublish = async (post: Post) => {
    const { error } = await supabase
      .from("cyber_awareness_posts")
      .update({ is_published: !post.is_published, updated_at: new Date().toISOString() })
      .eq("id", post.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(post.is_published ? "Unpublished" : "Published");
      fetchPosts();
    }
  };

  const publishAll = async () => {
    const unpublished = posts.filter((p) => !p.is_published && p.content);
    if (unpublished.length === 0) {
      toast("All posts with content are already published");
      return;
    }
    const { error } = await supabase
      .from("cyber_awareness_posts")
      .update({ is_published: true, updated_at: new Date().toISOString() })
      .not("content", "is", null);

    if (error) {
      toast.error("Failed to publish all");
    } else {
      toast.success(`Published ${unpublished.length} posts`);
      fetchPosts();
    }
  };

  const saveEdit = async (post: Post) => {
    const { error } = await supabase
      .from("cyber_awareness_posts")
      .update({
        title: editTitle,
        emoji: editEmoji,
        content: editContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    if (error) {
      toast.error("Failed to save");
    } else {
      toast.success("Saved");
      setEditingId(null);
      fetchPosts();
    }
  };

  const deletePost = async (post: Post) => {
    if (!confirm(`Delete #${post.number} "${post.title}"?`)) return;
    const { error } = await supabase
      .from("cyber_awareness_posts")
      .delete()
      .eq("id", post.id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Deleted");
      fetchPosts();
    }
  };

  const bulkGenerate = async () => {
    const noContent = posts.filter((p) => !p.content);
    if (noContent.length === 0) {
      toast("All posts already have content");
      return;
    }
    setBulkGenerating(true);
    let success = 0;
    for (const post of noContent) {
      try {
        await generateContent(post);
        success++;
      } catch {}
      await new Promise((r) => setTimeout(r, 2000));
    }
    setBulkGenerating(false);
    toast.success(`Generated ${success}/${noContent.length} posts`);
  };

  const publishedCount = posts.filter((p) => p.is_published).length;
  const withContent = posts.filter((p) => p.content).length;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cyber Awareness Posts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {posts.length} posts · {withContent} with content · {publishedCount} published
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchPosts} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={bulkGenerate}
              disabled={bulkGenerating}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              {bulkGenerating ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1" />
              )}
              AI Generate All Empty
            </Button>
            <Button size="sm" onClick={publishAll}>
              <Eye className="w-4 h-4 mr-1" />
              Publish All With Content
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {posts.slice((adminPage - 1) * ADMIN_PER_PAGE, adminPage * ADMIN_PER_PAGE).map((post) => {
              const isEditing = editingId === post.id;
              const isGeneratingThis = generating === post.id;

              return (
                <div
                  key={post.id}
                  className={cn(
                    "bg-card border border-border rounded-xl p-4 transition-all",
                    !post.content && "border-yellow-500/30 bg-yellow-500/5",
                    post.is_published && "border-green-500/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded mt-0.5">
                      #{post.number}
                    </span>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              value={editEmoji}
                              onChange={(e) => setEditEmoji(e.target.value)}
                              className="w-16 px-2 py-1 border border-border rounded-md bg-background text-sm"
                              placeholder="Emoji"
                            />
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1 px-3 py-1 border border-border rounded-md bg-background text-sm font-semibold"
                              placeholder="Title"
                            />
                          </div>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={8}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm resize-y"
                            placeholder="Card content..."
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(post)}>
                              <Save className="w-3.5 h-3.5 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              <X className="w-3.5 h-3.5 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {post.category}
                            </span>
                            {post.is_published && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                                Published
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground">
                            {post.emoji} {post.title}
                          </h3>
                          {post.content ? (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-line">
                              {post.content}
                            </p>
                          ) : (
                            <p className="text-sm text-yellow-600 mt-1 italic">
                              No content yet — generate with AI or write manually
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => generateContent(post)}
                          disabled={isGeneratingThis}
                          title="AI Generate"
                        >
                          {isGeneratingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-purple-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingId(post.id);
                            setEditTitle(post.title);
                            setEditEmoji(post.emoji);
                            setEditContent(post.content || "");
                          }}
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => togglePublish(post)}
                          title={post.is_published ? "Unpublish" : "Publish"}
                        >
                          {post.is_published ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deletePost(post)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Admin Pagination */}
        {posts.length > ADMIN_PER_PAGE && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={adminPage === 1}
              onClick={() => setAdminPage(adminPage - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              Page {adminPage} of {Math.ceil(posts.length / ADMIN_PER_PAGE)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={adminPage >= Math.ceil(posts.length / ADMIN_PER_PAGE)}
              onClick={() => setAdminPage(adminPage + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
