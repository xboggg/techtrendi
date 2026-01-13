import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Calendar,
  Crown,
  Settings,
  Bookmark,
  History,
  Star,
  MessageSquare,
  Edit,
  Camera,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarksList } from '@/components/ui/bookmark-system';
import { ReadingHistoryList } from '@/components/ui/reading-history';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  is_premium: boolean;
  subscription_status: string | null;
}

interface UserStats {
  commentsCount: number;
  ratingsCount: number;
  bookmarksCount: number;
}

export default function Profile() {
  const { user, subscription, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ commentsCount: 0, ratingsCount: 0, bookmarksCount: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchStats();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If profile doesn't exist, create a default one for display
        if (error.code === 'PGRST116') {
          const defaultProfile: UserProfile = {
            id: user.id,
            email: user.email || '',
            full_name: null,
            avatar_url: null,
            created_at: user.created_at || new Date().toISOString(),
            is_premium: false,
            subscription_status: null,
          };
          setProfile(defaultProfile);
          setEditName('');
        } else {
          throw error;
        }
      } else {
        setProfile(data);
        setEditName(data.full_name || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Still set a minimal profile so the page renders
      const fallbackProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        is_premium: false,
        subscription_status: null,
      };
      setProfile(fallbackProfile);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch comments count
      const { count: commentsCount } = await supabase
        .from('review_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch ratings count
      const { count: ratingsCount } = await supabase
        .from('review_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get bookmarks from localStorage
      const bookmarks = JSON.parse(localStorage.getItem('techtrendi_bookmarks') || '[]');

      setStats({
        commentsCount: commentsCount || 0,
        ratingsCount: ratingsCount || 0,
        bookmarksCount: bookmarks.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName })
        .eq('id', user.id);

      if (error) throw error;
      setProfile((prev) => prev ? { ...prev, full_name: editName } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <div className="max-w-md mx-auto">
            <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading Profile...</h2>
            <p className="text-muted-foreground mb-4">Setting up your profile</p>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'User'}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-foreground">
                    {(profile.full_name || profile.email).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <button className="absolute bottom-0 right-0 p-2 bg-background border border-border rounded-full shadow-sm hover:bg-muted transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-3 py-1 border border-border rounded-lg bg-background text-foreground"
                      placeholder="Your name"
                    />
                    <Button size="sm" onClick={handleUpdateProfile}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-foreground">
                      {profile.full_name || 'Anonymous User'}
                    </h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDate(profile.created_at)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {subscription.subscribed ? (
                  <Badge className="bg-gradient-accent text-accent-foreground">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium Member
                  </Badge>
                ) : (
                  <Badge variant="secondary">Free Plan</Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/premium">
                  <Crown className="w-4 h-4 mr-2" />
                  {subscription.subscribed ? 'Manage' : 'Upgrade'}
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.commentsCount}</div>
              <div className="text-sm text-muted-foreground">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.ratingsCount}</div>
              <div className="text-sm text-muted-foreground">Ratings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{stats.bookmarksCount}</div>
              <div className="text-sm text-muted-foreground">Saved</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="gap-2">
              <Bookmark className="w-4 h-4" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    to="/tools"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Explore Tools</p>
                      <p className="text-sm text-muted-foreground">Use our free utility tools</p>
                    </div>
                  </Link>
                  <Link
                    to="/reviews"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Browse Reviews</p>
                      <p className="text-sm text-muted-foreground">Read product reviews</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Subscription Info */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Subscription</h3>
                {subscription.subscribed ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className="bg-green-500/10 text-green-500">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="text-foreground">Premium</span>
                    </div>
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <Link to="/premium">Manage Subscription</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      Unlock premium features and ad-free experience
                    </p>
                    <Button asChild>
                      <Link to="/premium">Upgrade to Premium</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookmarks">
            <BookmarksList />
          </TabsContent>

          <TabsContent value="history">
            <ReadingHistoryList />
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Password</p>
                      <p className="text-sm text-muted-foreground">••••••••</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Change
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="font-semibold text-foreground mb-4">Danger Zone</h3>
                <Button
                  variant="destructive"
                  onClick={() => {
                    signOut();
                    navigate('/');
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
