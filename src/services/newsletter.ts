import { supabase } from '@/integrations/supabase/client';

export interface NewsletterSubscription {
  id: string;
  email: string;
  user_id: string | null;
  topics: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  unsubscribed_at: string | null;
}

export const newsletterService = {
  // Subscribe to newsletter
  async subscribe(
    email: string,
    topics: string[] = ['general'],
    frequency: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<{ success: boolean; message: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscriptions')
      .select('id, is_active')
      .eq('email', email)
      .single();

    if (existing) {
      if (existing.is_active) {
        return { success: false, message: 'This email is already subscribed.' };
      } else {
        // Reactivate subscription
        await supabase
          .from('newsletter_subscriptions')
          .update({
            is_active: true,
            topics,
            frequency,
            unsubscribed_at: null,
          })
          .eq('id', existing.id);

        return { success: true, message: 'Your subscription has been reactivated!' };
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID();

    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email,
        user_id: user?.id || null,
        topics,
        frequency,
        verification_token: verificationToken,
        is_verified: !!user, // Auto-verify if logged in
      });

    if (error) throw error;

    // TODO: Send verification email via Supabase Edge Function
    // For now, just return success
    return {
      success: true,
      message: user
        ? 'You have been subscribed to our newsletter!'
        : 'Please check your email to verify your subscription.',
    };
  },

  // Unsubscribe from newsletter
  async unsubscribe(email: string): Promise<void> {
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) throw error;
  },

  // Verify subscription
  async verify(token: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .update({ is_verified: true, verification_token: null })
      .eq('verification_token', token)
      .select()
      .single();

    if (error) return false;
    return !!data;
  },

  // Get subscription for current user
  async getSubscription(): Promise<NewsletterSubscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Update subscription preferences
  async updatePreferences(
    updates: { topics?: string[]; frequency?: 'daily' | 'weekly' | 'monthly' }
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('newsletter_subscriptions')
      .update(updates)
      .or(`user_id.eq.${user.id},email.eq.${user.email}`);

    if (error) throw error;
  },

  // Available topics
  getTopics(): { id: string; name: string; description: string }[] {
    return [
      { id: 'general', name: 'General Updates', description: 'Weekly digest of top tech news' },
      { id: 'reviews', name: 'New Reviews', description: 'Get notified when we publish new reviews' },
      { id: 'deals', name: 'Deals & Discounts', description: 'Best tech deals and price drops' },
      { id: 'security', name: 'Security Alerts', description: 'Important security news and tips' },
      { id: 'tutorials', name: 'How-To Guides', description: 'New tutorials and guides' },
    ];
  },
};
