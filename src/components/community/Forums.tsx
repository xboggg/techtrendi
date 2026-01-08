import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  MessageSquare,
  Users,
  Clock,
  Pin,
  Lock,
  TrendingUp,
  Plus,
  Search,
  ChevronRight,
  ThumbsUp,
  Eye,
  Reply,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  threadCount: number;
  postCount: number;
  lastPost?: {
    title: string;
    author: string;
    date: string;
  };
}

interface ForumThread {
  id: string;
  title: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  createdAt: string;
  lastReplyAt: string;
  replyCount: number;
  viewCount: number;
  likeCount: number;
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];
  excerpt: string;
}

interface ForumPost {
  id: string;
  threadId: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    postCount: number;
    joinDate: string;
  };
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  isEdited: boolean;
  quotedPost?: {
    id: string;
    author: string;
    excerpt: string;
  };
}

// Sample data
const sampleCategories: ForumCategory[] = [
  {
    id: '1',
    name: 'General Discussion',
    description: 'Talk about anything tech-related',
    icon: 'MessageSquare',
    threadCount: 156,
    postCount: 1243,
    lastPost: { title: 'Best budget phone 2024?', author: 'TechEnthusiast', date: '2024-01-15' },
  },
  {
    id: '2',
    name: 'Reviews & Feedback',
    description: 'Share your product experiences',
    icon: 'Star',
    threadCount: 89,
    postCount: 567,
    lastPost: { title: 'iPhone 15 Pro long-term review', author: 'GadgetGuru', date: '2024-01-14' },
  },
  {
    id: '3',
    name: 'Help & Support',
    description: 'Get help with tech issues',
    icon: 'HelpCircle',
    threadCount: 234,
    postCount: 1890,
    lastPost: { title: 'Laptop not charging', author: 'NewUser123', date: '2024-01-15' },
  },
  {
    id: '4',
    name: 'Deals & Offers',
    description: 'Share and find the best tech deals',
    icon: 'Tag',
    threadCount: 78,
    postCount: 345,
    lastPost: { title: 'Amazon sale - 50% off headphones', author: 'DealHunter', date: '2024-01-15' },
  },
];

const sampleThreads: ForumThread[] = [
  {
    id: '1',
    title: 'What\'s the best smartphone for photography in 2024?',
    author: { id: '1', name: 'PhotoPro', avatar: undefined },
    category: 'General Discussion',
    createdAt: '2024-01-10',
    lastReplyAt: '2024-01-15',
    replyCount: 45,
    viewCount: 1234,
    likeCount: 28,
    isPinned: true,
    isLocked: false,
    tags: ['smartphones', 'photography', 'camera'],
    excerpt: 'Looking for recommendations on the best camera phones. Budget is around $1000...',
  },
  {
    id: '2',
    title: 'MacBook Air M3 vs Dell XPS 15 - Which should I buy?',
    author: { id: '2', name: 'LaptopBuyer', avatar: undefined },
    category: 'General Discussion',
    createdAt: '2024-01-12',
    lastReplyAt: '2024-01-14',
    replyCount: 32,
    viewCount: 890,
    likeCount: 15,
    isPinned: false,
    isLocked: false,
    tags: ['laptops', 'macbook', 'dell'],
    excerpt: 'Need a laptop for programming and light video editing. Torn between these two...',
  },
  {
    id: '3',
    title: 'Best wireless earbuds under $100?',
    author: { id: '3', name: 'AudioFan', avatar: undefined },
    category: 'General Discussion',
    createdAt: '2024-01-08',
    lastReplyAt: '2024-01-13',
    replyCount: 67,
    viewCount: 2100,
    likeCount: 42,
    isPinned: false,
    isLocked: false,
    tags: ['audio', 'earbuds', 'budget'],
    excerpt: 'What are your recommendations for affordable wireless earbuds with good sound quality?',
  },
];

// Forum Categories List
export function ForumCategories({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Forum Categories</h2>
        <Button variant="outline" size="sm">
          <Search className="w-4 h-4 mr-2" />
          Search Forums
        </Button>
      </div>
      <div className="grid gap-4">
        {sampleCategories.map((category) => (
          <Link
            key={category.id}
            to={`/community/forum/${category.id}`}
            className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {category.threadCount} threads
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {category.postCount} posts
                </span>
              </div>
            </div>
            {category.lastPost && (
              <div className="hidden md:block text-right text-sm">
                <p className="text-foreground truncate max-w-48">{category.lastPost.title}</p>
                <p className="text-muted-foreground">by {category.lastPost.author}</p>
              </div>
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// Thread List
export function ThreadList({ categoryId, className }: { categoryId?: string; className?: string }) {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'unanswered'>('latest');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={sortBy === 'latest' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('latest')}
          >
            <Clock className="w-4 h-4 mr-1" />
            Latest
          </Button>
          <Button
            variant={sortBy === 'popular' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('popular')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Popular
          </Button>
          <Button
            variant={sortBy === 'unanswered' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('unanswered')}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Unanswered
          </Button>
        </div>
        {user && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Thread
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sampleThreads.map((thread) => (
          <div
            key={thread.id}
            className={cn(
              'p-4 bg-card border border-border rounded-xl hover:shadow-md transition-shadow',
              thread.isPinned && 'border-primary/50 bg-primary/5'
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium">
                {thread.author.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {thread.isPinned && (
                    <Badge variant="secondary" className="text-xs">
                      <Pin className="w-3 h-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                  {thread.isLocked && (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </div>
                <Link to={`/community/thread/${thread.id}`} className="group">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {thread.title}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{thread.excerpt}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {thread.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>by {thread.author.name}</span>
                  <span className="flex items-center gap-1">
                    <Reply className="w-3 h-3" />
                    {thread.replyCount} replies
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {thread.viewCount} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {thread.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(thread.lastReplyAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Forum Stats Widget
export function ForumStats({ className }: { className?: string }) {
  const stats = {
    totalThreads: 557,
    totalPosts: 4045,
    totalMembers: 1234,
    onlineNow: 42,
    newestMember: 'TechNewbie2024',
  };

  return (
    <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
      <h3 className="font-semibold text-foreground mb-4">Forum Statistics</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Threads</span>
          <span className="font-medium text-foreground">{stats.totalThreads.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Posts</span>
          <span className="font-medium text-foreground">{stats.totalPosts.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Members</span>
          <span className="font-medium text-foreground">{stats.totalMembers.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Online Now</span>
          <span className="font-medium text-green-500">{stats.onlineNow}</span>
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Newest member: <span className="text-primary">{stats.newestMember}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Main Forum Component
export function CommunityForum({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-8', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Community Forum</h1>
          <p className="text-muted-foreground">Join discussions with fellow tech enthusiasts</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <ForumCategories />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Recent Discussions</h2>
            <ThreadList />
          </div>
        </div>
        <div className="space-y-4">
          <ForumStats />
        </div>
      </div>
    </div>
  );
}

export default CommunityForum;
