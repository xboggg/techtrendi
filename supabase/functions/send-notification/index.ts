import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  user_id: string;
  type: 'comment_reply' | 'new_review' | 'price_alert' | 'mention' | 'system' | 'subscription';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  send_email?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotificationPayload = await req.json();

    // Validate required fields
    if (!payload.user_id || !payload.type || !payload.title || !payload.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert notification into database
    const { data: notification, error: insertError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link,
        metadata: payload.metadata || {},
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Optionally send email notification
    if (payload.send_email) {
      // Get user's email preferences
      const { data: preferences } = await supabaseClient
        .from('user_preferences')
        .select('notifications_email')
        .eq('user_id', payload.user_id)
        .single();

      if (preferences?.notifications_email !== false) {
        // Get user email
        const { data: { user } } = await supabaseClient.auth.admin.getUserById(payload.user_id);

        if (user?.email) {
          // Send email using Resend or other email service
          // This is a placeholder - implement based on your email provider
          console.log(`Would send email to ${user.email}: ${payload.title}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, notification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
