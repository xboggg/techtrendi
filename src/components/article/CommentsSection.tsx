import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Reply, Trash2, Flag, MoreVertical } from "lucide-react";
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
  user?: {
    name: string;
    email: string;
  };
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
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          user:users(name, email)
        `)
        .eq("article_id", articleId)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from("comments")
            .select(`
              *,
              user:users(name, email)
            `)
            .eq("parent_id", comment.id)
            .order("created_at", { ascending: true });

          // Check if user has liked each comment
          if (user) {
            const { data: userLikes } = await supabase
              .from("comment_likes")
              .select("comment_id")
              .in("comment_id", [comment.id, ...(replies?.map(r => r.id) || [])])
              .eq("user_id", user.id);

            const likedIds = new Set(userLikes?.map(l => l.comment_id) || []);

            return {
              ...comment,
              user_has_liked: likedIds.has(comment.id),
              replies: replies?.map(r => ({
                ...r,
                user_has_liked: likedIds.has(r.id)
              })) || []
            };
          }

          return { ...comment, replies: replies || [] };
        })
      );

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
      const { error } = await supabase
        .from("comments")
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: newComment.trim(),
          parent_id: null,
        });

      if (error) throw error;

      // Award XP
      await supabase.rpc("award_xp", { user_uuid: user.id, xp_amount: 25 });

      // Update user comment count
      await supabase
        .from("users")
        .update({ total_comments: (user.total_comments || 0) + 1 })
        .eq("id", user.id);

      // Log activity
      await supabase.from("user_activity").insert({
        user_id: user.id,
        activity_type: "comment",
        article_id: articleId,
        xp_earned: 25,
      });

      toast.success("Comment posted!");
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
      const { error } = await supabase
        .from("comments")
        .insert({
          article_id: articleId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId,
        });

      if (error) throw error;

      // Award XP
      await supabase.rpc("award_xp", { user_uuid: user.id, xp_amount: 20 });

      toast.success("Reply posted!");
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
        await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: user.id });
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
      const { error } = await supabase
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
            {comment.user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground">{comment.user?.name || "Anonymous"}</span>
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
