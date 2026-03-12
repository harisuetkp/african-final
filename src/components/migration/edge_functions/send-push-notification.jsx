/**
 * Supabase Edge Function: Send Push Notification
 * Uses Firebase Cloud Messaging (same as current setup)
 * 
 * Deploy with: supabase functions deploy send-push-notification
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, title, body, data, type } = await req.json();

    // Get user's push token
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('push_token, display_name')
      .eq('user_id', userId)
      .single();

    if (!profile?.push_token) {
      return new Response(
        JSON.stringify({ error: 'No push token found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send via FCM
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: profile.push_token,
        notification: {
          title,
          body,
          icon: '/icon-192.png',
          badge: '/badge.png',
        },
        data: {
          ...data,
          type,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channel_id: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      }),
    });

    const result = await fcmResponse.json();

    // Also create in-app notification
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileData) {
      await supabase.from('notifications').insert({
        user_profile_id: profileData.id,
        user_id: userId,
        type: type || 'admin_message',
        title,
        message: body,
        is_read: false,
      });
    }

    return new Response(
      JSON.stringify({ success: true, fcm: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});