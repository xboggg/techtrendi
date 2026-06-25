import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, Crown, Youtube, Instagram, Twitter, TrendingUp, TrendingDown,
  Users, Eye, Heart, MessageSquare, Share2, Play, Clock, Calendar,
  ArrowUpRight, ArrowDownRight, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface PlatformStats {
  followers: number;
  followersChange: number;
  engagement: number;
  engagementChange: number;
  views: number;
  viewsChange: number;
  posts: number;
}

interface ContentItem {
  id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  date: string;
  platform: string;
}

// Demo data
const demoStats: Record<string, PlatformStats> = {
  youtube: {
    followers: 15420,
    followersChange: 5.2,
    engagement: 4.8,
    engagementChange: 0.3,
    views: 125000,
    viewsChange: 12.5,
    posts: 48,
  },
  instagram: {
    followers: 8750,
    followersChange: 3.1,
    engagement: 6.2,
    engagementChange: -0.5,
    views: 45000,
    viewsChange: 8.2,
    posts: 156,
  },
  twitter: {
    followers: 4230,
    followersChange: 2.8,
    engagement: 3.1,
    engagementChange: 1.2,
    views: 28000,
    viewsChange: -2.3,
    posts: 312,
  },
};

const demoContent: ContentItem[] = [
  {
    id: "1",
    title: "10 Tips for Better Productivity",
    views: 12500,
    likes: 890,
    comments: 124,
    shares: 45,
    date: "2024-01-15",
    platform: "youtube",
  },
  {
    id: "2",
    title: "Behind the scenes of my workspace",
    views: 8200,
    likes: 1240,
    comments: 89,
    shares: 23,
    date: "2024-01-14",
    platform: "instagram",
  },
  {
    id: "3",
    title: "Hot take: AI will change everything",
    views: 5600,
    likes: 234,
    comments: 156,
    shares: 78,
    date: "2024-01-13",
    platform: "twitter",
  },
  {
    id: "4",
    title: "How I Built My Side Hustle",
    views: 9800,
    likes: 720,
    comments: 98,
    shares: 34,
    date: "2024-01-12",
    platform: "youtube",
  },
  {
    id: "5",
    title: "Morning routine that changed my life",
    views: 6400,
    likes: 980,
    comments: 67,
    shares: 19,
    date: "2024-01-11",
    platform: "instagram",
  },
];

export default function CreatorAnalytics() {
  const { user, subscription } = useAuth();
  const isPremium = subscription?.subscribed;

  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [dateRange, setDateRange] = useState("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = demoStats[selectedPlatform];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success("Analytics refreshed!");
  };

  const platformContent = demoContent.filter((c) => c.platform === selectedPlatform);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return Youtube;
      case "instagram":
        return Instagram;
      case "twitter":
        return Twitter;
      default:
        return BarChart3;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "youtube":
        return "text-red-500";
      case "instagram":
        return "text-pink-500";
      case "twitter":
        return "text-blue-400";
      default:
        return "text-gray-500";
    }
  };

  if (!isPremium) {
    return (
      <Layout>
        <SEOHead
          title="Creator Analytics - Unified Dashboard | TechTrendi"
          description="Track your YouTube, Instagram, and Twitter analytics in one unified dashboard. See what's working and grow your audience."
          canonicalUrl="https://techtrendi.com/tools/creator-analytics"
        />
        <div className="container py-12 md:py-20 max-w-2xl">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center">
              <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Creator Analytics</h1>
              <p className="text-muted-foreground mb-6">
                Track your YouTube, Instagram, and Twitter analytics in one unified dashboard. See what's working and grow your audience faster.
              </p>
              <Button asChild size="lg">
                <a href="/auth">
                  <Crown className="w-4 h-4 mr-2" />
                  Get Premium - $4.99/month
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Creator Analytics - Unified Dashboard | TechTrendi"
        description="Track your YouTube, Instagram, and Twitter analytics in one unified dashboard. See what's working and grow your audience."
        canonicalUrl="https://techtrendi.com/tools/creator-analytics"
      />

      <div className="container py-12 md:py-20 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Badge className="mb-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Crown className="w-3 h-3 mr-1" />
              Premium Tool
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Creator <span className="text-primary">Analytics</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              All your social stats in one place
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-background"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Platform Tabs */}
        <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              YouTube
            </TabsTrigger>
            <TabsTrigger value="instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-500" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="twitter" className="flex items-center gap-2">
              <Twitter className="w-4 h-4 text-blue-400" />
              Twitter
            </TabsTrigger>
          </TabsList>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <Badge
                    variant="outline"
                    className={cn(
                      stats.followersChange >= 0
                        ? "text-green-600 border-green-200"
                        : "text-red-600 border-red-200"
                    )}
                  >
                    {stats.followersChange >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(stats.followersChange)}%
                  </Badge>
                </div>
                <p className="text-3xl font-bold">{formatNumber(stats.followers)}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                  <Badge
                    variant="outline"
                    className={cn(
                      stats.viewsChange >= 0
                        ? "text-green-600 border-green-200"
                        : "text-red-600 border-red-200"
                    )}
                  >
                    {stats.viewsChange >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(stats.viewsChange)}%
                  </Badge>
                </div>
                <p className="text-3xl font-bold">{formatNumber(stats.views)}</p>
                <p className="text-sm text-muted-foreground">Views</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-5 h-5 text-muted-foreground" />
                  <Badge
                    variant="outline"
                    className={cn(
                      stats.engagementChange >= 0
                        ? "text-green-600 border-green-200"
                        : "text-red-600 border-red-200"
                    )}
                  >
                    {stats.engagementChange >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(stats.engagementChange)}%
                  </Badge>
                </div>
                <p className="text-3xl font-bold">{stats.engagement}%</p>
                <p className="text-sm text-muted-foreground">Engagement</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{stats.posts}</p>
                <p className="text-sm text-muted-foreground">Total Posts</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Over Time</CardTitle>
              <CardDescription>Your follower and engagement trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-muted/50 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Analytics Chart</p>
                  <p className="text-sm">Connect your accounts to see real data</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Content */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Your best posts from the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformContent.map((content) => {
                  const Icon = getPlatformIcon(content.platform);
                  return (
                    <div
                      key={content.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className={cn("w-6 h-6", getPlatformColor(content.platform))} />
                        </div>
                        <div>
                          <p className="font-medium">{content.title}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {content.date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{formatNumber(content.views)}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{formatNumber(content.likes)}</p>
                          <p className="text-xs text-muted-foreground">Likes</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{formatNumber(content.comments)}</p>
                          <p className="text-xs text-muted-foreground">Comments</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{formatNumber(content.shares)}</p>
                          <p className="text-xs text-muted-foreground">Shares</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Best Performing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-1">Productivity Tips</p>
                <p className="text-sm text-muted-foreground">
                  Content about productivity gets 2.3x more engagement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Best Time to Post
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-1">9 AM - 11 AM</p>
                <p className="text-sm text-muted-foreground">
                  Tuesday and Thursday mornings perform best
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Audience Insight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold mb-1">25-34 years</p>
                <p className="text-sm text-muted-foreground">
                  Your primary audience demographic
                </p>
              </CardContent>
            </Card>
          </div>
        </Tabs>

        {/* Connect Accounts CTA */}
        <Card className="mt-8 border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Connect Your Accounts</h3>
                <p className="text-muted-foreground">
                  Link your social media accounts to see real analytics data
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500" />
                  Connect YouTube
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  Connect Instagram
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-blue-400" />
                  Connect Twitter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
