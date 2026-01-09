import { supabase } from '@/integrations/supabase/client';
import { ContentType } from './bookmarks';

export interface ReadingHistoryItem {
  id: string;
  user_id: string;
  content_type: ContentType;
  content_id: string;
  read_at: string;
  read_percentage: number;
  time_spent_seconds: number;
}

export interface ReadingStats {
  totalArticles: number;
  totalTimeMinutes: number;
  averageCompletion: number;
  thisWeek: number;
  thisMonth: number;
  byCategory: Record<string, number>;
}

export const readingHistoryService = {
  // Get reading history
  async getHistory(limit = 50): Promise<ReadingHistoryItem[]> {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .order('read_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get history by content type
  async getByType(contentType: ContentType, limit = 20): Promise<ReadingHistoryItem[]> {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('content_type', contentType)
      .order('read_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Add or update reading history
  async trackRead(
    contentType: ContentType,
    contentId: string,
    readPercentage = 0,
    timeSpentSeconds = 0
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Silent fail for anonymous users

    // Check for existing entry from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existing } = await supabase
      .from('reading_history')
      .select('id, read_percentage, time_spent_seconds')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .gte('read_at', today.toISOString())
      .single();

    if (existing) {
      // Update existing entry
      await supabase
        .from('reading_history')
        .update({
          read_percentage: Math.max(existing.read_percentage, readPercentage),
          time_spent_seconds: existing.time_spent_seconds + timeSpentSeconds,
          read_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new entry
      await supabase
        .from('reading_history')
        .insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          read_percentage: readPercentage,
          time_spent_seconds: timeSpentSeconds,
        });
    }
  },

  // Update read percentage
  async updateProgress(contentType: ContentType, contentId: string, percentage: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await supabase
      .from('reading_history')
      .update({ read_percentage: percentage })
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .gte('read_at', today.toISOString());
  },

  // Delete history item
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('reading_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Clear all history
  async clearHistory(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('reading_history')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  },

  // Get reading stats
  async getStats(): Promise<ReadingStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        totalArticles: 0,
        totalTimeMinutes: 0,
        averageCompletion: 0,
        thisWeek: 0,
        thisMonth: 0,
        byCategory: {},
      };
    }

    const { data: history, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = history?.filter(h => new Date(h.read_at) >= weekAgo).length || 0;
    const thisMonth = history?.filter(h => new Date(h.read_at) >= monthAgo).length || 0;

    const totalTime = history?.reduce((sum, h) => sum + h.time_spent_seconds, 0) || 0;
    const avgCompletion = history?.length
      ? history.reduce((sum, h) => sum + h.read_percentage, 0) / history.length
      : 0;

    const byCategory = history?.reduce((acc, h) => {
      acc[h.content_type] = (acc[h.content_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      totalArticles: history?.length || 0,
      totalTimeMinutes: Math.round(totalTime / 60),
      averageCompletion: Math.round(avgCompletion),
      thisWeek,
      thisMonth,
      byCategory,
    };
  },

  // Check if content was recently read
  async wasRecentlyRead(contentType: ContentType, contentId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { data } = await supabase
      .from('reading_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .gte('read_at', hourAgo.toISOString())
      .single();

    return !!data;
  },

  // Get continue reading items
  async getContinueReading(limit = 5): Promise<ReadingHistoryItem[]> {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .gt('read_percentage', 0)
      .lt('read_percentage', 100)
      .order('read_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
