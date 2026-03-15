import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Trash2, Shield, MessageCircle, FileText, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 15;
import { toast } from "sonner";
import { format } from "date-fns";

interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  reviews: { title: string } | null;
  profiles: { email: string | null; full_name: string | null } | null;
  isAdmin?: boolean;
  isModerator?: boolean;
}

interface ArticleComment {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  likes: number;
  article_title?: string;
  profiles: { email: string | null; full_name: string | null } | null;
  isAdmin?: boolean;
  isModerator?: boolean;
}

export default function AdminComments() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"articles" | "reviews">("articles");
  const [articlePage, setArticlePage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);

  // Fetch article comments
  const { data: articleComments = [], isLoading: isLoadingArticles } = useQuery({
    queryKey: ["admin-article-comments"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch profiles and roles
      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      const [profilesResult, rolesResult] = await Promise.all([
        (supabase as any).from("profiles").select("user_id, email, full_name").in("user_id", userIds),
        (supabase as any).from("user_roles").select("user_id, role").in("user_id", userIds).in("role", ["admin", "moderator"])
      ]);

      const profileMap = new Map(profilesResult.data?.map((p: any) => [p.user_id, p]) || []);
      const adminSet = new Set(rolesResult.data?.filter((r: any) => r.role === "admin").map((r: any) => r.user_id) || []);
      const moderatorSet = new Set(rolesResult.data?.filter((r: any) => r.role === "moderator").map((r: any) => r.user_id) || []);

      return (data || []).map((comment: any) => ({
        ...comment,
        profiles: profileMap.get(comment.user_id) || null,
        isAdmin: adminSet.has(comment.user_id),
        isModerator: moderatorSet.has(comment.user_id),
      })) as ArticleComment[];
    },
  });

  // Fetch review comments
  const { data: reviewComments = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["admin-review-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_comments")
        .select(`
          *,
          reviews:review_id (title)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch profiles and roles (admin + moderator) separately since there's no direct relation
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("user_id, email, full_name").in("user_id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds).in("role", ["admin", "moderator"])
      ]);

      const profileMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
      const adminSet = new Set(rolesResult.data?.filter(r => r.role === "admin").map(r => r.user_id) || []);
      const moderatorSet = new Set(rolesResult.data?.filter(r => r.role === "moderator").map(r => r.user_id) || []);

      return (data || []).map(comment => ({
        ...comment,
        profiles: profileMap.get(comment.user_id) || null,
        isAdmin: adminSet.has(comment.user_id),
        isModerator: moderatorSet.has(comment.user_id),
      })) as ReviewComment[];
    },
  });

  const isLoading = activeTab === "articles" ? isLoadingArticles : isLoadingReviews;

  // Review comments mutations
  const approveMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase
        .from("review_comments")
        .update({ is_approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-review-comments"] });
      toast.success("Comment status updated");
    },
    onError: (error) => {
      toast.error(`Failed to update comment: ${error.message}`);
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error, count } = await supabase
        .from("review_comments")
        .delete({ count: "exact" })
        .eq("id", id);
      if (error) throw error;
      if (count === 0) {
        throw new Error("Delete blocked by RLS policy. Check admin permissions.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-review-comments"] });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  // Article comments mutations
  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete any replies to this comment
      await (supabase as any).from("comments").delete().eq("parent_id", id);
      // Then delete the comment itself
      const { error, count } = await (supabase as any)
        .from("comments")
        .delete({ count: "exact" })
        .eq("id", id);
      if (error) throw error;
      if (count === 0) {
        throw new Error("Delete blocked by RLS policy. Check admin permissions.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-article-comments"] });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const pendingReviewCount = reviewComments.filter((c) => !c.is_approved).length;

  // Article pagination
  const articleTotalPages = Math.max(1, Math.ceil(articleComments.length / ITEMS_PER_PAGE));
  const articleSafePage = Math.min(articlePage, articleTotalPages);
  const articleStartIndex = (articleSafePage - 1) * ITEMS_PER_PAGE;
  const articleEndIndex = Math.min(articleStartIndex + ITEMS_PER_PAGE, articleComments.length);
  const paginatedArticleComments = articleComments.slice(articleStartIndex, articleEndIndex);

  // Review pagination
  const reviewTotalPages = Math.max(1, Math.ceil(reviewComments.length / ITEMS_PER_PAGE));
  const reviewSafePage = Math.min(reviewPage, reviewTotalPages);
  const reviewStartIndex = (reviewSafePage - 1) * ITEMS_PER_PAGE;
  const reviewEndIndex = Math.min(reviewStartIndex + ITEMS_PER_PAGE, reviewComments.length);
  const paginatedReviewComments = reviewComments.slice(reviewStartIndex, reviewEndIndex);

  const getPageNumbers = (totalPages: number, safePage: number) => {
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Comments</h1>
          <p className="text-muted-foreground">
            Moderate user comments
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("articles")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === "articles"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            Article Comments ({articleComments.length})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === "reviews"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Review Comments ({reviewComments.length})
            {pendingReviewCount > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingReviewCount} pending</Badge>
            )}
          </button>
        </div>

        {/* Article Comments Table */}
        {activeTab === "articles" && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Article ID</TableHead>
                  <TableHead className="max-w-md">Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Likes</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingArticles ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : articleComments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No article comments yet
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedArticleComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {comment.profiles?.full_name || comment.profiles?.email || "Unknown"}
                          {comment.isAdmin && (
                            <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                              <Shield className="w-3 h-3" />
                              Admin
                            </Badge>
                          )}
                          {comment.isModerator && !comment.isAdmin && (
                            <Badge variant="secondary" className="gap-1 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                              <Shield className="w-3 h-3" />
                              Mod
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {comment.article_id?.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="max-w-md truncate">{comment.content}</TableCell>
                      <TableCell>
                        <Badge variant={comment.parent_id ? "outline" : "default"}>
                          {comment.parent_id ? "Reply" : "Comment"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {comment.likes || 0}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(comment.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this comment?")) {
                              deleteArticleMutation.mutate(comment.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Article Pagination */}
            {articleComments.length > ITEMS_PER_PAGE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {articleStartIndex + 1}-{articleEndIndex} of {articleComments.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setArticlePage((p) => Math.max(1, p - 1))}
                    disabled={articleSafePage === 1}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-card text-foreground text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getPageNumbers(articleTotalPages, articleSafePage).map((page, idx) =>
                    page === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setArticlePage(page)}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors ${
                          articleSafePage === page
                            ? "bg-primary text-primary-foreground font-medium"
                            : "border border-border bg-card text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setArticlePage((p) => Math.min(articleTotalPages, p + 1))}
                    disabled={articleSafePage === articleTotalPages}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-card text-foreground text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review Comments Table */}
        {activeTab === "reviews" && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead className="max-w-md">Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingReviews ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : reviewComments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No review comments yet
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReviewComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {comment.profiles?.full_name || comment.profiles?.email || "Unknown"}
                          {comment.isAdmin && (
                            <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                              <Shield className="w-3 h-3" />
                              Admin
                            </Badge>
                          )}
                          {comment.isModerator && !comment.isAdmin && (
                            <Badge variant="secondary" className="gap-1 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                              <Shield className="w-3 h-3" />
                              Moderator
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {comment.reviews?.title || "Unknown Review"}
                      </TableCell>
                      <TableCell className="max-w-md truncate">{comment.content}</TableCell>
                      <TableCell>
                        <Badge variant={comment.is_approved ? "default" : "secondary"}>
                          {comment.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(comment.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!comment.is_approved && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => approveMutation.mutate({ id: comment.id, is_approved: true })}
                              className="text-green-600 hover:text-green-600"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          {comment.is_approved && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => approveMutation.mutate({ id: comment.id, is_approved: false })}
                              className="text-yellow-600 hover:text-yellow-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this comment?")) {
                                deleteReviewMutation.mutate(comment.id);
                              }
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Review Pagination */}
            {reviewComments.length > ITEMS_PER_PAGE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {reviewStartIndex + 1}-{reviewEndIndex} of {reviewComments.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                    disabled={reviewSafePage === 1}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border bg-card text-foreground text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getPageNumbers(reviewTotalPages, reviewSafePage).map((page, idx) =>
                    page === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setReviewPage(page)}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors ${
                          reviewSafePage === page
                            ? "bg-primary text-primary-foreground font-medium"
                            : "border border-border bg-card text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))}
                    disabled={reviewSafePage === reviewTotalPages}
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
