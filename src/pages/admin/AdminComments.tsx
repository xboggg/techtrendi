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
import { Check, X, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Comment {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  reviews: { title: string } | null;
  profiles: { email: string | null; full_name: string | null } | null;
  isAdmin?: boolean;
}

export default function AdminComments() {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_comments")
        .select(`
          *,
          reviews:review_id (title)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles and admin roles separately since there's no direct relation
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from("profiles").select("user_id, email, full_name").in("user_id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds).eq("role", "admin")
      ]);
      
      const profileMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
      const adminSet = new Set(rolesResult.data?.map(r => r.user_id) || []);
      
      return (data || []).map(comment => ({
        ...comment,
        profiles: profileMap.get(comment.user_id) || null,
        isAdmin: adminSet.has(comment.user_id),
      })) as Comment[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase
        .from("review_comments")
        .update({ is_approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success("Comment status updated");
    },
    onError: (error) => {
      toast.error(`Failed to update comment: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("review_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete comment: ${error.message}`);
    },
  });

  const pendingCount = comments.filter((c) => !c.is_approved).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Comments</h1>
          <p className="text-muted-foreground">
            Moderate user comments {pendingCount > 0 && `(${pendingCount} pending)`}
          </p>
        </div>

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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : comments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No comments yet
                  </TableCell>
                </TableRow>
              ) : (
                comments.map((comment) => (
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
                              deleteMutation.mutate(comment.id);
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
        </div>
      </div>
    </AdminLayout>
  );
}
