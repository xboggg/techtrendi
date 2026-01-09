import { supabase } from '@/integrations/supabase/client';

export interface PricePoint {
  id: string;
  review_id: string;
  retailer: string;
  price: number;
  currency: string;
  url: string | null;
  in_stock: boolean;
  recorded_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  review_id: string;
  target_price: number;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
}

export interface PriceStats {
  current: number;
  lowest: number;
  highest: number;
  average: number;
  priceChange: number;
  percentChange: number;
}

export const priceTrackerService = {
  // ==========================================
  // PRICE HISTORY
  // ==========================================

  async getPriceHistory(reviewId: string, days = 90): Promise<PricePoint[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('review_id', reviewId)
      .gte('recorded_at', cutoffDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getLatestPrices(reviewId: string): Promise<PricePoint[]> {
    // Get the most recent price from each retailer
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('review_id', reviewId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;

    // Group by retailer and get latest
    const latestByRetailer = new Map<string, PricePoint>();
    for (const price of data || []) {
      if (!latestByRetailer.has(price.retailer)) {
        latestByRetailer.set(price.retailer, price);
      }
    }

    return Array.from(latestByRetailer.values());
  },

  async getPriceStats(reviewId: string): Promise<PriceStats | null> {
    const history = await this.getPriceHistory(reviewId);

    if (history.length === 0) return null;

    const prices = history.map(p => p.price);
    const current = prices[prices.length - 1];
    const previous = prices.length > 1 ? prices[prices.length - 2] : current;

    return {
      current,
      lowest: Math.min(...prices),
      highest: Math.max(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
      priceChange: current - previous,
      percentChange: previous > 0 ? ((current - previous) / previous) * 100 : 0,
    };
  },

  async getLowestPrice(reviewId: string): Promise<PricePoint | null> {
    const prices = await this.getLatestPrices(reviewId);
    if (prices.length === 0) return null;

    const inStock = prices.filter(p => p.in_stock);
    if (inStock.length === 0) return prices[0];

    return inStock.reduce((min, p) => p.price < min.price ? p : min);
  },

  // ==========================================
  // PRICE ALERTS
  // ==========================================

  async getAlerts(): Promise<PriceAlert[]> {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAlertForReview(reviewId: string): Promise<PriceAlert | null> {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('review_id', reviewId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createAlert(reviewId: string, targetPrice: number): Promise<PriceAlert> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Remove existing alert for this review
    await supabase
      .from('price_alerts')
      .delete()
      .eq('user_id', user.id)
      .eq('review_id', reviewId);

    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: user.id,
        review_id: reviewId,
        target_price: targetPrice,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAlert(id: string, targetPrice: number): Promise<PriceAlert> {
    const { data, error } = await supabase
      .from('price_alerts')
      .update({ target_price: targetPrice, is_active: true, triggered_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAlert(id: string): Promise<void> {
    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deactivateAlert(id: string): Promise<void> {
    const { error } = await supabase
      .from('price_alerts')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================================
  // DEALS
  // ==========================================

  async getBestDeals(limit = 10): Promise<Array<{ review_id: string; discount_percent: number; current_price: number; original_price: number }>> {
    // This would typically be a database function or view
    // For now, we'll calculate on the client side
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id, price')
      .eq('is_published', true)
      .not('price', 'is', null)
      .limit(50);

    if (error) throw error;

    const deals = [];
    for (const review of reviews || []) {
      const stats = await this.getPriceStats(review.id);
      if (stats && stats.current < stats.highest) {
        deals.push({
          review_id: review.id,
          current_price: stats.current,
          original_price: stats.highest,
          discount_percent: Math.round(((stats.highest - stats.current) / stats.highest) * 100),
        });
      }
    }

    return deals
      .sort((a, b) => b.discount_percent - a.discount_percent)
      .slice(0, limit);
  },
};
