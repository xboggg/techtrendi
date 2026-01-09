import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  user_id?: string;
  content_type?: 'review' | 'article' | 'all';
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { user_id, content_type = 'all', limit = 10 }: RecommendationRequest = await req.json();

    let recommendations = [];

    if (user_id) {
      // Personalized recommendations based on user history
      const { data: history } = await supabaseClient
        .from('reading_history')
        .select('content_type, content_id')
        .eq('user_id', user_id)
        .order('read_at', { ascending: false })
        .limit(20);

      const { data: bookmarks } = await supabaseClient
        .from('bookmarks')
        .select('content_type, content_id')
        .eq('user_id', user_id);

      // Get categories user is interested in
      const readReviewIds = history?.filter(h => h.content_type === 'review').map(h => h.content_id) || [];
      const readArticleIds = history?.filter(h => h.content_type === 'article').map(h => h.content_id) || [];

      // Find categories from read content
      const { data: readReviews } = await supabaseClient
        .from('reviews')
        .select('category')
        .in('id', readReviewIds);

      const { data: readArticles } = await supabaseClient
        .from('articles')
        .select('category')
        .in('id', readArticleIds);

      // Count category preferences
      const categoryCount: Record<string, number> = {};
      [...(readReviews || []), ...(readArticles || [])].forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      });

      // Sort by preference
      const preferredCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

      // Exclude already read items
      const excludeReviewIds = [...readReviewIds, ...(bookmarks?.filter(b => b.content_type === 'review').map(b => b.content_id) || [])];
      const excludeArticleIds = [...readArticleIds, ...(bookmarks?.filter(b => b.content_type === 'article').map(b => b.content_id) || [])];

      // Get recommendations
      if (content_type === 'all' || content_type === 'review') {
        let reviewQuery = supabaseClient
          .from('reviews')
          .select('id, title, slug, category, rating, image')
          .eq('is_published', true);

        if (preferredCategories.length > 0) {
          reviewQuery = reviewQuery.in('category', preferredCategories);
        }

        if (excludeReviewIds.length > 0) {
          reviewQuery = reviewQuery.not('id', 'in', `(${excludeReviewIds.join(',')})`);
        }

        const { data: reviews } = await reviewQuery
          .order('views', { ascending: false })
          .limit(Math.ceil(limit / 2));

        recommendations.push(...(reviews || []).map(r => ({
          ...r,
          type: 'review',
          reason: preferredCategories.includes(r.category)
            ? `Based on your interest in ${r.category}`
            : 'Popular in your area',
        })));
      }

      if (content_type === 'all' || content_type === 'article') {
        let articleQuery = supabaseClient
          .from('articles')
          .select('id, title, slug, category, cover_image, excerpt')
          .eq('is_published', true);

        if (preferredCategories.length > 0) {
          articleQuery = articleQuery.in('category', preferredCategories);
        }

        if (excludeArticleIds.length > 0) {
          articleQuery = articleQuery.not('id', 'in', `(${excludeArticleIds.join(',')})`);
        }

        const { data: articles } = await articleQuery
          .order('views', { ascending: false })
          .limit(Math.ceil(limit / 2));

        recommendations.push(...(articles || []).map(a => ({
          ...a,
          type: 'article',
          reason: preferredCategories.includes(a.category)
            ? `Based on your interest in ${a.category}`
            : 'Trending now',
        })));
      }
    } else {
      // Non-personalized: return trending content
      if (content_type === 'all' || content_type === 'review') {
        const { data: reviews } = await supabaseClient
          .from('reviews')
          .select('id, title, slug, category, rating, image')
          .eq('is_published', true)
          .order('views', { ascending: false })
          .limit(Math.ceil(limit / 2));

        recommendations.push(...(reviews || []).map(r => ({
          ...r,
          type: 'review',
          reason: 'Trending review',
        })));
      }

      if (content_type === 'all' || content_type === 'article') {
        const { data: articles } = await supabaseClient
          .from('articles')
          .select('id, title, slug, category, cover_image, excerpt')
          .eq('is_published', true)
          .order('views', { ascending: false })
          .limit(Math.ceil(limit / 2));

        recommendations.push(...(articles || []).map(a => ({
          ...a,
          type: 'article',
          reason: 'Trending article',
        })));
      }
    }

    // Shuffle recommendations for variety
    recommendations = recommendations.sort(() => Math.random() - 0.5).slice(0, limit);

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
