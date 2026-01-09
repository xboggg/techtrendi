import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function should be called by a cron job to check for price drops
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active price alerts
    const { data: alerts, error: alertsError } = await supabaseClient
      .from('price_alerts')
      .select(`
        *,
        review:reviews(id, title, slug)
      `)
      .eq('is_active', true);

    if (alertsError) throw alertsError;

    const triggeredAlerts = [];

    for (const alert of alerts || []) {
      // Get latest price for this review
      const { data: latestPrice } = await supabaseClient
        .from('price_history')
        .select('price, retailer')
        .eq('review_id', alert.review_id)
        .eq('in_stock', true)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (latestPrice && latestPrice.price <= alert.target_price) {
        // Price alert triggered!
        triggeredAlerts.push({
          alert,
          currentPrice: latestPrice.price,
          retailer: latestPrice.retailer,
        });

        // Update alert as triggered
        await supabaseClient
          .from('price_alerts')
          .update({
            is_active: false,
            triggered_at: new Date().toISOString(),
          })
          .eq('id', alert.id);

        // Send notification
        await supabaseClient.functions.invoke('send-notification', {
          body: {
            user_id: alert.user_id,
            type: 'price_alert',
            title: 'Price Alert! 🎉',
            message: `${alert.review.title} is now $${latestPrice.price} at ${latestPrice.retailer}!`,
            link: `/reviews/${alert.review.slug}`,
            metadata: {
              review_id: alert.review_id,
              target_price: alert.target_price,
              current_price: latestPrice.price,
              retailer: latestPrice.retailer,
            },
            send_email: true,
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: alerts?.length || 0,
        triggered: triggeredAlerts.length,
        alerts: triggeredAlerts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking price alerts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
