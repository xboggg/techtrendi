import { supabase } from '@/integrations/supabase/client';

export type ContentType = 'review' | 'article' | 'tool' | 'guide';

export interface Bookmark {
  id: string;
  user_id: string;
  content_type: ContentType;
  content_id: string;
  created_at: string;
}

export const bookmarksService = {
  // Get all bookmarks for current user
  async getAll(): Promise<Bookmark[]> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get bookmarks by content type
  async getByType(contentType: ContentType): Promise<Bookmark[]> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('content_type', contentType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Check if content is bookmarked
  async isBookmarked(contentType: ContentType, contentId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  // Add bookmark
  async add(contentType: ContentType, contentId: string): Promise<Bookmark> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove bookmark
  async remove(contentType: ContentType, contentId: string): Promise<void> {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    if (error) throw error;
  },

  // Toggle bookmark
  async toggle(contentType: ContentType, contentId: string): Promise<boolean> {
    const isCurrentlyBookmarked = await this.isBookmarked(contentType, contentId);

    if (isCurrentlyBookmarked) {
      await this.remove(contentType, contentId);
      return false;
    } else {
      await this.add(contentType, contentId);
      return true;
    }
  },

  // Get bookmark count for user
  async getCount(): Promise<number> {
    const { count, error } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },
};
