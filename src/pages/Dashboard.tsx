import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useTools } from "@/contexts/ToolsContext";
import { allTools, categories, Tool } from "@/data/tools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, Clock, TrendingUp, Star, Crown, ArrowRight, Sparkles,
  BarChart3, Zap, Target, ChevronRight, Wrench, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

const TierBadge = ({ tier }: { tier: string }) => {
  if (tier === "free") {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400">
        Free
      </span>
    );
  }
  if (tier === "free-account") {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
        Free+
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
      <Crown className="w-2.5 h-2.5" />
      Pro
    </span>
  );
};

function ToolCard({ tool, onFavoriteClick, isFavorite }: { tool: Tool; onFavoriteClick: (id: string) => void; isFavorite: boolean }) {
  return (
    <Link
      to={tool.href}
      className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300"
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
        "bg-gradient-to-br",
        tool.gradient
      )}>
        <tool.icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {tool.title}
          </h4>
          <TierBadge tier={tool.tier} />
        </div>
        <p className="text-sm text-muted-foreground truncate">{tool.description}</p>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onFavoriteClick(tool.id);
        }}
        className={cn(
          "p-2 rounded-lg transition-all shrink-0",
          isFavorite
            ? "text-red-500 hover:bg-red-500/10"
            : "text-muted-foreground hover:text-red-500 hover:bg-muted"
        )}
      >
        <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
      </button>
    </Link>
  );
}

export default function Dashboard() {
  const { user, subscription } = useAuth();
  const {
    getFavoriteTools,
    getRecentTools,
    getMostUsedTools,
    toggleFavorite,
    isFavorite,
    recentlyUsed
  } = useTools();

  const favoriteTools = getFavoriteTools();
  const recentTools = getRecentTools(6);
  const mostUsedTools = getMostUsedTools(6);

  // Calculate stats
  const totalToolsUsed = recentlyUsed.length;
  const totalUses = recentlyUsed.reduce((sum, u) => sum + u.useCount, 0);

  // Get most used category
  const categoryUsage: Record<string, number> = {};
  recentlyUsed.forEach(usage => {
    const tool = allTools.find(t => t.id === usage.toolId);
    if (tool) {
      categoryUsage[tool.categoryId] = (categoryUsage[tool.categoryId] || 0) + usage.useCount;
    }
  });
  const topCategoryId = Object.entries(categoryUsage).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topCategory = categories.find(c => c.id === topCategoryId);

  if (!user) {
    return (
      <Layout>
        <SEOHead title="Dashboard - TechTrendi" description="Your personal tools dashboard" />
        <div className="container py-20">
          <div className="max-w-md mx-auto text-center">
            <Wrench className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Sign in to access your dashboard</h1>
            <p className="text-muted-foreground mb-8">
              Track your favorite tools, recently used tools, and more.
            </p>
            <Button asChild size="lg">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="My Dashboard - TechTrendi"
        description="Your personal tools dashboard with favorites, recently used, and stats."
        canonicalUrl="https://techtrendi.com/dashboard"
      />

      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="text-muted-foreground">
              Here's your personalized tools dashboard
            </p>
          </div>
          {!subscription.subscribed && (
            <Button asChild className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Link to="/premium">
                <Crown className="w-4 h-4" />
                Upgrade to Premium
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{favoriteTools.length}</p>
                  <p className="text-sm text-muted-foreground">Favorites</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalToolsUsed}</p>
                  <p className="text-sm text-muted-foreground">Tools Used</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalUses}</p>
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  {topCategory ? (
                    <topCategory.icon className="w-6 h-6 text-amber-500" />
                  ) : (
                    <Target className="w-6 h-6 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold truncate">{topCategory?.title.split(' ')[0] || 'None'}</p>
                  <p className="text-sm text-muted-foreground">Top Category</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Favorite Tools */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                My Favorites
              </CardTitle>
              <Link to="/tools" className="text-sm text-primary hover:underline flex items-center gap-1">
                Browse All <ChevronRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {favoriteTools.length > 0 ? (
                favoriteTools.slice(0, 5).map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onFavoriteClick={toggleFavorite}
                    isFavorite={true}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No favorites yet</p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/tools" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Browse Tools
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Used */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Recently Used
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTools.length > 0 ? (
                recentTools.slice(0, 5).map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onFavoriteClick={toggleFavorite}
                    isFavorite={isFavorite(tool.id)}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No recent tools</p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/tools" className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Start Using Tools
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Used */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Most Used Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mostUsedTools.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mostUsedTools.map((tool, index) => {
                    const usage = recentlyUsed.find(u => u.toolId === tool.id);
                    return (
                      <Link
                        key={tool.id}
                        to={tool.href}
                        className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                      >
                        <div className="relative">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            "bg-gradient-to-br",
                            tool.gradient
                          )}>
                            <tool.icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {tool.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Used {usage?.useCount || 0} times
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No usage data yet</p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/tools" className="gap-2">
                      <Zap className="w-4 h-4" />
                      Explore Tools
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Categories */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/tools/${cat.id}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
              >
                <cat.icon className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-center">{cat.title.split(' ')[0]}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
