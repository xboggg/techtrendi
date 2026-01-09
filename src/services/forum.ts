import { supabase } from '@/integrations/supabase/client';

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  thread_count?: number;
}

export interface ForumThread {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_solved: boolean;
  views: number;
  reply_count: number;
  last_reply_at: string | null;
  last_reply_user_id: string | null;
  created_at: string;
  updated_at: string;
  category?: ForumCategory;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface ForumReply {
  id: string;
  thread_id: string;
  user_id: string;
  parent_reply_id: string | null;
  content: string;
  is_solution: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  user_vote?: 'up' | 'down' | null;
}

export const forumService = {
  // ==========================================
  // CATEGORIES
  // ==========================================

  async getCategories(): Promise<ForumCategory[]> {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  },

  async getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // ==========================================
  // THREADS
  // ==========================================

  async getThreads(categorySlug?: string, page = 1, limit = 20): Promise<{ threads: ForumThread[]; total: number }> {
    let query = supabase
      .from('forum_threads')
      .select(`
        *,
        category:forum_categories(*),
        author:profiles!forum_threads_user_id_fkey(id, full_name, avatar_url)
      `, { count: 'exact' });

    if (categorySlug) {
      const category = await this.getCategoryBySlug(categorySlug);
      if (category) {
        query = query.eq('category_id', category.id);
      }
    }

    const { data, error, count } = await query
      .order('is_pinned', { ascending: false })
      .order('last_reply_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return { threads: data || [], total: count || 0 };
  },

  async getThreadBySlug(slug: string): Promise<ForumThread | null> {
    const { data, error } = await supabase
      .from('forum_threads')
      .select(`
        *,
        category:forum_categories(*),
        author:profiles!forum_threads_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Increment view count
    if (data) {
      await supabase
        .from('forum_threads')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', data.id);
    }

    return data;
  },

  async createThread(categoryId: string, title: string, content: string): Promise<ForumThread> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    const { data, error } = await supabase
      .from('forum_threads')
      .insert({
        category_id: categoryId,
        user_id: user.id,
        title,
        slug,
        content,
      })
      .select(`
        *,
        category:forum_categories(*),
        author:profiles!forum_threads_user_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateThread(id: string, updates: { title?: string; content?: string }): Promise<ForumThread> {
    const { data, error } = await supabase
      .from('forum_threads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAsSolved(threadId: string, replyId: string): Promise<void> {
    const { error: threadError } = await supabase
      .from('forum_threads')
      .update({ is_solved: true })
      .eq('id', threadId);

    if (threadError) throw threadError;

    const { error: replyError } = await supabase
      .from('forum_replies')
      .update({ is_solution: true })
      .eq('id', replyId);

    if (replyError) throw replyError;
  },

  // ==========================================
  // REPLIES
  // ==========================================

  async getReplies(threadId: string): Promise<ForumReply[]> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('forum_replies')
      .select(`
        *,
        author:profiles!forum_replies_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('thread_id', threadId)
      .order('created_at');

    if (error) throw error;

    // Get user votes if authenticated
    if (user && data) {
      const { data: votes } = await supabase
        .from('forum_votes')
        .select('reply_id, vote_type')
        .eq('user_id', user.id)
        .in('reply_id', data.map(r => r.id));

      const voteMap = new Map(votes?.map(v => [v.reply_id, v.vote_type]) || []);

      return data.map(reply => ({
        ...reply,
        user_vote: voteMap.get(reply.id) as 'up' | 'down' | undefined || null,
      }));
    }

    return data || [];
  },

  async createReply(threadId: string, content: string, parentReplyId?: string): Promise<ForumReply> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('forum_replies')
      .insert({
        thread_id: threadId,
        user_id: user.id,
        content,
        parent_reply_id: parentReplyId,
      })
      .select(`
        *,
        author:profiles!forum_replies_user_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateReply(id: string, content: string): Promise<ForumReply> {
    const { data, error } = await supabase
      .from('forum_replies')
      .update({ content })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteReply(id: string): Promise<void> {
    const { error } = await supabase
      .from('forum_replies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================================
  // VOTING
  // ==========================================

  async vote(replyId: string, voteType: 'up' | 'down'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check existing vote
    const { data: existing } = await supabase
      .from('forum_votes')
      .select('id, vote_type')
      .eq('user_id', user.id)
      .eq('reply_id', replyId)
      .single();

    if (existing) {
      if (existing.vote_type === voteType) {
        // Remove vote if same type
        await supabase
          .from('forum_votes')
          .delete()
          .eq('id', existing.id);
      } else {
        // Update vote if different type
        await supabase
          .from('forum_votes')
          .update({ vote_type: voteType })
          .eq('id', existing.id);
      }
    } else {
      // Create new vote
      await supabase
        .from('forum_votes')
        .insert({
          user_id: user.id,
          reply_id: replyId,
          vote_type: voteType,
        });
    }
  },

  // ==========================================
  // SEARCH
  // ==========================================

  async search(query: string, limit = 20): Promise<ForumThread[]> {
    const { data, error } = await supabase
      .from('forum_threads')
      .select(`
        *,
        category:forum_categories(*),
        author:profiles!forum_threads_user_id_fkey(id, full_name, avatar_url)
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
