import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText, MessageSquare, Star, Newspaper,
  Users, Package, Activity, BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [
        articlesRes,
        newsRes,
        reviewsRes,
        productsRes,
        commentsRes,
        usersRes,
        messagesRes,
        recentArticlesRes,
        recentNewsRes,
      ] = await Promise.all([
        supabase.from("articles").select("id, is_published", { count: "exact" }),
        supabase.from("news").select("id, is_published", { count: "exact" }),
        supabase.from("reviews").select("id", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("review_comments").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("contact_submissions").select("id, is_read", { count: "exact" }),
        supabase.from("articles").select("id, title, slug, created_at, category").order("created_at", { ascending: false }).limit(5),
        supabase.from("news").select("id, title, slug, created_at, category").order("created_at", { ascending: false }).limit(5),
      ]);

      // Published counts
      const publishedArticles = articlesRes.data?.filter(a => a.is_published).length || 0;
      const publishedNews = newsRes.data?.filter(n => n.is_published).length || 0;

      // Unread messages
      const unreadMessages = messagesRes.data?.filter(m => !m.is_read).length || 0;

      return {
        articles: {
          total: articlesRes.count || 0,
          published: publishedArticles,
        },
        news: {
          total: newsRes.count || 0,
          published: publishedNews,
        },
        reviews: reviewsRes.count || 0,
        products: productsRes.count || 0,
        comments: commentsRes.count || 0,
        users: usersRes.count || 0,
        messages: {
          total: messagesRes.count || 0,
          unread: unreadMessages,
        },
        recentArticles: recentArticlesRes.data || [],
        recentNews: recentNewsRes.data || [],
      };
    },
  });

  const mainStats = [
    {
      label: "Total Articles",
      value: stats?.articles.total || 0,
      subtext: `${stats?.articles.published || 0} published`,
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      href: "/admin/articles"
    },
    {
      label: "News Posts",
      value: stats?.news.total || 0,
      subtext: `${stats?.news.published || 0} published`,
      icon: Newspaper,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      href: "/admin/news"
    },
    {
      label: "Reviews",
      value: stats?.reviews || 0,
      subtext: "product reviews",
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      href: "/admin/reviews"
    },
    {
      label: "Products",
      value: stats?.products || 0,
      subtext: "in store",
      icon: Package,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      href: "/admin/products"
    },
  ];

  const secondaryStats = [
    {
      label: "Users",
      value: stats?.users || 0,
      icon: Users,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      label: "Comments",
      value: stats?.comments || 0,
      icon: MessageSquare,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Messages",
      value: stats?.messages.total || 0,
      icon: MessageSquare,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: "Unread",
      value: stats?.messages.unread || 0,
      icon: MessageSquare,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your content overview.</p>
          </div>
          {stats?.messages.unread ? (
            <Link to="/admin/messages" className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors">
              <MessageSquare className="w-4 h-4" />
              {stats.messages.unread} unread message{stats.messages.unread > 1 ? "s" : ""}
            </Link>
          ) : null}
        </div>

        {/* Main Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((stat) => (
            <Link key={stat.label} to={stat.href}>
              <Card className="hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {stat.value.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryStats.map((stat) => (
            <Card key={stat.label} className="bg-card/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Articles */}
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Recent Articles
              </CardTitle>
              <Link to="/admin/articles" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentArticles.map((article: any) => (
                  <div key={article.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{article.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="px-2 py-0.5 bg-muted rounded">{article.category}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground ml-4">
                      {formatDate(article.created_at)}
                    </div>
                  </div>
                ))}
                {!stats?.recentArticles.length && (
                  <p className="text-muted-foreground text-center py-4">No articles yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent News */}
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-purple-500" />
                Recent News
              </CardTitle>
              <Link to="/admin/news" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentNews.map((news: any) => (
                  <div key={news.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{news.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="px-2 py-0.5 bg-muted rounded">{news.category}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground ml-4">
                      {formatDate(news.created_at)}
                    </div>
                  </div>
                ))}
                {!stats?.recentNews.length && (
                  <p className="text-muted-foreground text-center py-4">No news yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Link to="/admin/articles" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <FileText className="w-6 h-6 text-blue-500" />
                <span className="text-sm font-medium">New Article</span>
              </Link>
              <Link to="/admin/news" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Newspaper className="w-6 h-6 text-purple-500" />
                <span className="text-sm font-medium">Add News</span>
              </Link>
              <Link to="/admin/reviews" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Star className="w-6 h-6 text-yellow-500" />
                <span className="text-sm font-medium">Add Review</span>
              </Link>
              <Link to="/admin/products" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Package className="w-6 h-6 text-orange-500" />
                <span className="text-sm font-medium">Add Product</span>
              </Link>
              <Link to="/admin/analytics" className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
                <span className="text-sm font-medium">Analytics</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
