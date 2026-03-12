import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// RATE LIMITING: Track push notification sends
const pushRateLimits = new Map(); // user_profile_id -> {count, resetTime}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // SECURITY: Allow authenticated users (internal function calls pass auth context)
    // Also allow service role calls (from automations/webhooks)
    let isServiceCall = false;
    try {
      const user = await base44.auth.me();
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch (e) {
      // Check if called by service role (automation/webhook)
      isServiceCall = true;
    }
    
    const { user_profile_id, title, body, link, type, data: customData } = await req.json();

    if (!user_profile_id || !title || !body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // RATE LIMIT: Max 10 push notifications per user per hour (skip for service calls)
    if (!isServiceCall) {
      const now = Date.now();
      const userLimit = pushRateLimits.get(user_profile_id) || { count: 0, resetTime: now + 3600000 };
      
      if (now > userLimit.resetTime) {
        userLimit.count = 0;
        userLimit.resetTime = now + 3600000;
      }
      
      if (userLimit.count >= 10) {
        console.log(`Rate limit exceeded for user ${user_profile_id}`);
        return Response.json({ 
          success: false, 
          error: 'Rate limit exceeded - max 10 notifications per hour' 
        }, { status: 429 });
      }
      
      userLimit.count++;
      pushRateLimits.set(user_profile_id, userLimit);
    }

    // Get user's push subscription tokens
    const profile = await base44.asServiceRole.entities.UserProfile.filter({ id: user_profile_id });
    if (profile.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const userProfile = profile[0];

    // Always create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_profile_id,
      user_id: userProfile.user_id,
      type: type || 'admin_message',
      title,
      message: body,
      link_to: link || 'Matches',
      is_admin: false
    });

    // Send push notification via Firebase Cloud Messaging
    const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
    const pushToken = userProfile.push_token;
    
    if (!FCM_SERVER_KEY) {
      return Response.json({ 
        success: true, 
        method: 'in-app-only',
        message: 'In-app notification created. FCM_SERVER_KEY not configured for push.' 
      });
    }

    if (!pushToken) {
      return Response.json({ 
        success: true, 
        method: 'in-app-only',
        message: 'In-app notification created. User has no push token registered.' 
      });
    }

    // Send to FCM using HTTP v1 API (Legacy API)
    try {
      const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${FCM_SERVER_KEY}`
        },
        body: JSON.stringify({
          to: pushToken,
          notification: {
            title,
            body,
            click_action: link || 'https://afrinnect.app',
            icon: '/icon-192.png',
            badge: '/icon-72.png',
            sound: 'default'
          },
          data: {
            type: type || 'notification',
            link: link || 'Matches',
            ...customData
          },
          // Android specific
          android: {
            priority: 'high',
            notification: {
              channel_id: 'afrinnect_default',
              sound: 'default',
              default_vibrate_timings: true
            }
          },
          // iOS specific (APNs)
          apns: {
            headers: {
              'apns-priority': '10'
            },
            payload: {
              aps: {
                alert: { title, body },
                sound: 'default',
                badge: 1
              }
            }
          },
          // Web push
          webpush: {
            headers: {
              Urgency: 'high'
            },
            notification: {
              title,
              body,
              icon: '/icon-192.png',
              requireInteraction: type === 'match' || type === 'super_like'
            }
          }
        })
      });

      const fcmData = await fcmResponse.json();
      
      // Check for invalid token error
      if (fcmData.failure === 1 && fcmData.results?.[0]?.error === 'InvalidRegistration') {
        // Clear invalid token
        await base44.asServiceRole.entities.UserProfile.update(user_profile_id, {
          push_token: null
        });
        console.log(`Cleared invalid FCM token for user ${user_profile_id}`);
      }

      return Response.json({ 
        success: true, 
        method: 'push-and-in-app',
        fcm_success: fcmData.success === 1,
        fcm_result: fcmData 
      });
    } catch (fcmError) {
      console.error('FCM send error:', fcmError);
      return Response.json({ 
        success: true, 
        method: 'in-app-only',
        fcm_error: fcmError.message,
        message: 'In-app notification created. Push delivery failed.'
      });
    }
  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});