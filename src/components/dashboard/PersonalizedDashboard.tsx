import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/components/ui/bookmark-system';
import { useReadingHistory } from '@/components/ui/reading-history';
import {
  TrendingUp,
  Clock,
  Bookmark,
  Star,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  BarChart2,
  Calendar,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollFadeIn, StaggeredChildren } from '@/components/ui/parallax';

interface RecommendedContent {
  id: string;
  title: string;
  category: string;
  slug: string;
  image?: string;
  readTime: string;
  score: number;
}

interface DashboardStats {
  articlesRead: number;
  bookmarksSaved: number;
  categoriesExplored: string[];
  readingStreak: number;
  totalReadingTime: number;
}

export function PersonalizedDashboard() {
  const { user, subscription } = useAuth();
  const { bookmarks } = useBookmarks();
  const { history } = useReadingHistory();
  const [recommendations, setRecommendations] = useState<RecommendedContent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Set time-based greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    // Calculate stats from reading history
    if (history.length > 0) {
      const categories = [...new Set(history.map((h) => h.category).filter(Boolean))];

      // Calculate reading streak
      const today = new Date();
      let streak = 0;
      const sortedHistory = [...history].sort(
        (a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()
      );

      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const hasReading = sortedHistory.some((h) =>
          h.visitedAt.startsWith(dateStr)
        );

        if (hasReading) streak++;
        else if (i > 0) break;
      }

      setStats({
        articlesRead: history.length,
        bookmarksSaved: bookmarks.length,
        categoriesExplored: categories as string[],
        readingStreak: streak,
        totalReadingTime: history.length * 5, // Estimate 5 min per article
      });
    }
  }, [history, bookmarks]);

  useEffect(() => {
    // Generate personalized recommendations
    const generateRecommendations = () => {
      // Get user's preferred categories from history
      const categoryCount: Record<string, number> = {};
      history.forEach((h) => {
        if (h.category) {
          categoryCount[h.category] = (categoryCount[h.category] || 0) + 1;
        }
      });

      // Sample recommendations (in real app, this would come from backend)
      const sampleContent: RecommendedContent[] = [
        {
          id: '1',
          title: 'Best Smartphones of 2024: Ultimate Buyer\'s Guide',
          category: 'Smartphones',
          slug: 'best-smartphones-2024',
          readTime: '8 min',
          score: 95,
        },
        {
          id: '2',
          title: 'How AI is Transforming Cybersecurity',
          category: 'Security',
          slug: 'ai-cybersecurity-2024',
          readTime: '6 min',
          score: 92,
        },
        {
          id: '3',
          title: 'MacBook Pro M3 vs Dell XPS 15: Which Should You Buy?',
          category: 'Laptops',
          slug: 'macbook-vs-dell-comparison',
          readTime: '10 min',
          score: 88,
        },
        {
          id: '4',
          title: '10 Essential Privacy Tools Everyone Should Use',
          category: 'Security',
          slug: 'essential-privacy-tools',
          readTime: '7 min',
          score: 90,
        },
        {
          id: '5',
          title: 'The Future of Wearable Technology',
          category: 'Gadgets',
          slug: 'future-wearable-tech',
          readTime: '5 min',
          score: 85,
        },
      ];

      // Filter out already read content
      const readSlugs = history.map((h) => h.slug);
      const unread = sampleContent.filter((c) => !readSlugs.includes(c.slug));

      setRecommendations(unread.slice(0, 4));
    };

    generateRecommendations();
  }, [history]);

  const quickActions = [
    {
      icon: Zap,
      label: 'Password Generator',
      href: '/tools/password-generator',
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      icon: BarChart2,
      label: 'Phone Comparison',
      href: '/tools/phone-comparison',
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      icon: Target,
      label: 'Security Check',
      href: '/tools/password-checker',
      color: 'bg-green-500/10 text-green-500',
    },
    {
      icon: Calendar,
      label: 'Upgrade Calculator',
      href: '/tools/upgrade-calculator',
      color: 'bg-orange-500/10 text-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <ScrollFadeIn>
        <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {greeting}, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}!
              </h2>
              <p className="text-muted-foreground">
                Here's what's personalized for you today
              </p>
            </div>
            {stats && stats.readingStreak > 0 && (
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-4 py-2 rounded-full">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-foreground">
                  {stats.readingStreak} day reading streak!
                </span>
              </div>
            )}
          </div>
        </div>
      </ScrollFadeIn>

      {/* Stats Grid */}
      {stats && (
        <ScrollFadeIn delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.articlesRead}</div>
              <div className="text-sm text-muted-foreground">Articles Read</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                <Bookmark className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.bookmarksSaved}</div>
              <div className="text-sm text-muted-foreground">Saved Items</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-accent" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.categoriesExplored.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.totalReadingTime}m</div>
              <div className="text-sm text-muted-foreground">Reading Time</div>
            </div>
          </div>
        </ScrollFadeIn>
      )}

      {/* Quick Actions */}
      <ScrollFadeIn delay={200}>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </ScrollFadeIn>

      {/* Personalized Recommendations */}
      <ScrollFadeIn delay={300}>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Recommended for You</h3>
            </div>
            <Link to="/reviews" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recommendations.length > 0 ? (
            <StaggeredChildren className="grid md:grid-cols-2 gap-4" staggerDelay={100}>
              {recommendations.map((item) => (
                <Link
                  key={item.id}
                  to={`/reviews/${item.slug}`}
                  className="flex gap-4 p-4 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {item.category}
                    </Badge>
                    <h4 className="font-medium text-foreground line-clamp-2 mb-1">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.readTime}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        {item.score}% match
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </StaggeredChildren>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Start reading to get personalized recommendations!
              </p>
              <Button asChild>
                <Link to="/reviews">Explore Reviews</Link>
              </Button>
            </div>
          )}
        </div>
      </ScrollFadeIn>

      {/* Premium Upsell (if not subscribed) */}
      {!subscription.subscribed && (
        <ScrollFadeIn delay={400}>
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Unlock Premium Features</h3>
                <p className="text-white/80">
                  Get ad-free reading, exclusive content, and advanced tools
                </p>
              </div>
              <Button variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
                <Link to="/auth">Upgrade Now</Link>
              </Button>
            </div>
          </div>
        </ScrollFadeIn>
      )}

      {/* Notification Preferences */}
      <ScrollFadeIn delay={500}>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Stay Updated</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Get notified about new content in your favorite categories
          </p>
          {stats && stats.categoriesExplored.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {stats.categoriesExplored.map((category) => (
                <Badge key={category} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </ScrollFadeIn>
    </div>
  );
}

export default PersonalizedDashboard;
