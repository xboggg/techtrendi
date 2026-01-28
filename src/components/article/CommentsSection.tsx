import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Reply, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { AnimatedCard } from "@/components/ui/animated-card";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  parent_id: string | null;
  likes: number;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  user_name?: string;
  replies?: Comment[];
  user_has_liked?: boolean;
}

interface CommentsSectionProps {
  articleId: string;
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      // Fetch ALL comments for this article in ONE query (both parents and replies)
      const { data: allComments, error } = await (supabase as any)
        .from("comments")
        .select("*")
        .eq("article_id", articleId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!allComments || allComments.length === 0) {
        setComments([]);
        return;
      }

      // Collect all unique user IDs
      const userIds = [...new Set(allComments.map((c: any) => c.user_id))];
      const commentIds = allComments.map((c: any) => c.id);

      // Fetch profiles and likes in parallel (2 queries instead of N queries)
      const [profilesResult, likesResult] = await Promise.all([
        (supabase as any)
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds),
        user
          ? (supabase as any)
              .from("comment_likes")
              .select("comment_id")
              .in("comment_id", commentIds)
              .eq("user_id", user.id)
          : Promise.resolve({ data: [] })
      ]);

      // Build lookup maps
      const profileMap = new Map(
        (profilesResult.data || []).map((p: any) => [p.user_id, p.full_name || "Anonymous User"])
      );
      const likedIds = new Set(
        (likesResult.data || []).map((l: any) => l.comment_id)
      );

      // Separate parent comments and replies
      const parentComments = allComments.filter((c: any) => c.parent_id === null);
      const replies = allComments.filter((c: any) => c.parent_id !== null);

      // Group replies by parent_id
      const repliesByParent = new Map<string, any[]>();
      replies.forEach((reply: any) => {
        const existing = repliesByParent.get(reply.parent_id) || [];
        existing.push({
          ...reply,
          user_name: profileMap.get(reply.user_id) || "Anonymous User",
          user_has_liked: likedIds.has(reply.id)
        });
        repliesByParent.set(reply.parent_id, existing);
      });

      // Build final comments structure
      const commentsWithReplies = parentComments
        .map((comment: any) => ({
          ...comment,
          user_name: profileMap.get(comment.user_id) || "Anonymous User",
          user_has_liked: likedIds.has(comment.id),
          replies: repliesByParent.get(comment.id) || []
        }))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setComments(commentsWithReplies);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("comments")
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: newComment.trim(),
          parent_id: null,
        });

      if (error) throw error;

      // Award XP
      await (supabase as any).rpc("award_xp", { user_uuid: user.id, xp_amount: 25 });

      // Log activity
      await (supabase as any).from("user_activity").insert({
        user_id: user.id,
        activity_type: "comment",
        article_id: articleId,
        xp_earned: 25,
      });

      toast.success("Comment posted! +25 XP", { icon: "💬" });
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast.error("Please log in to reply");
      return;
    }

    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("comments")
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId,
        });

      if (error) throw error;

      // Award XP
      await (supabase as any).rpc("award_xp", { user_uuid: user.id, xp_amount: 20 });

      toast.success("Reply posted! +20 XP", { icon: "↩️" });
      setReplyContent("");
      setReplyingTo(null);
      fetchComments();
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) {
      toast.error("Please log in to like comments");
      return;
    }

    try {
      if (currentlyLiked) {
        await (supabase as any)
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
        toast.success("Like removed");
      } else {
        await (supabase as any)
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: user.id });
        toast.success("Liked!");
      }

      fetchComments();
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const { error } = await (supabase as any)
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Comment deleted");
      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const CommentCard = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <AnimatedCard delay={isReply ? 100 : 0} animation="fade-up" className={isReply ? "ml-12" : ""}>
      <div className="p-4 rounded-lg bg-card border border-border">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {(comment.user_name || "User").charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground">{comment.user_name || "Anonymous User"}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-muted-foreground italic">(edited)</span>
              )}
            </div>

            {/* Content */}
            <p className="text-foreground text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLikeComment(comment.id, comment.user_has_liked || false)}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  comment.user_has_liked
                    ? "text-red-500"
                    : "text-muted-foreground hover:text-red-500"
                }`}
              >
                <Heart className={`w-4 h-4 ${comment.user_has_liked ? "fill-current" : ""}`} />
                {comment.likes > 0 && <span>{comment.likes}</span>}
              </button>

              {!isReply && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
              )}

              {user?.id === comment.user_id && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={submitting}
                  >
                    {submitting ? "Posting..." : "Post Reply"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h2>
      </div>

      {/* New comment form */}
      {user ? (
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={handleSubmitComment} disabled={submitting || !newComment.trim()}>
            {submitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
          <p className="text-muted-foreground mb-3">Sign in to join the conversation</p>
          <Button asChild>
            <a href="/login">Sign In</a>
          </Button>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-card border border-border animate-pulse">
              <div className="h-4 bg-muted rounded w-1/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-1" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <CommentCard comment={comment} />
              {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-3">
                  {comment.replies.map((reply) => (
                    <CommentCard key={reply.id} comment={reply} isReply />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
