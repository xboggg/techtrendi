import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Star, Eye } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [reviewsRes, commentsRes, ratingsRes] = await Promise.all([
        supabase.from("reviews").select("id, views", { count: "exact" }),
        supabase.from("review_comments").select("id", { count: "exact" }),
        supabase.from("review_ratings").select("id", { count: "exact" }),
      ]);

      const totalViews = reviewsRes.data?.reduce((sum, r) => sum + (r.views || 0), 0) || 0;

      return {
        reviews: reviewsRes.count || 0,
        comments: commentsRes.count || 0,
        ratings: ratingsRes.count || 0,
        totalViews,
      };
    },
  });

  const statCards = [
    { label: "Total Reviews", value: stats?.reviews || 0, icon: FileText, color: "text-blue-500" },
    { label: "Total Comments", value: stats?.comments || 0, icon: MessageSquare, color: "text-green-500" },
    { label: "Total Ratings", value: stats?.ratings || 0, icon: Star, color: "text-yellow-500" },
    { label: "Total Views", value: stats?.totalViews || 0, icon: Eye, color: "text-purple-500" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your review platform</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stat.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
