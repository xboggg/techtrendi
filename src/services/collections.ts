import { supabase } from '@/integrations/supabase/client';
import { ContentType } from './bookmarks';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  content_type: ContentType;
  content_id: string;
  added_at: string;
  notes: string | null;
}

export const collectionsService = {
  // Get all collections for current user
  async getAll(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        item_count:collection_items(count)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(c => ({
      ...c,
      item_count: c.item_count?.[0]?.count || 0
    }));
  },

  // Get single collection with items
  async getById(id: string): Promise<Collection & { items: CollectionItem[] }> {
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    if (collectionError) throw collectionError;

    const { data: items, error: itemsError } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', id)
      .order('added_at', { ascending: false });

    if (itemsError) throw itemsError;

    return { ...collection, items: items || [] };
  },

  // Create new collection
  async create(name: string, description?: string, isPublic = false): Promise<Collection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name,
        description,
        is_public: isPublic,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update collection
  async update(id: string, updates: Partial<Pick<Collection, 'name' | 'description' | 'is_public' | 'cover_image'>>): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete collection
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Add item to collection
  async addItem(collectionId: string, contentType: ContentType, contentId: string, notes?: string): Promise<CollectionItem> {
    const { data, error } = await supabase
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        content_type: contentType,
        content_id: contentId,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove item from collection
  async removeItem(collectionId: string, contentType: ContentType, contentId: string): Promise<void> {
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    if (error) throw error;
  },

  // Check if item is in collection
  async isItemInCollection(collectionId: string, contentType: ContentType, contentId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('collection_items')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  // Get public collections
  async getPublic(limit = 10): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        item_count:collection_items(count)
      `)
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(c => ({
      ...c,
      item_count: c.item_count?.[0]?.count || 0
    }));
  },
};
