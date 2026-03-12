import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Allow users to self-check and auto-downgrade if their subscription/trial has expired
// This ensures the frontend immediately reflects the correct state even if the cron job hasn't run yet.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profiles[0];
    const now = new Date();

    // Check if premium and expired
    if (profile.is_premium && profile.premium_until) {
      const expiryDate = new Date(profile.premium_until);
      
      if (expiryDate < now) {
        // Expired! Downgrade immediately.
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          is_premium: false,
          subscription_tier: 'free',
          premium_until: null
        });

        // Notify
        await base44.asServiceRole.entities.Notification.create({
            user_profile_id: profile.id,
            type: 'system',
            title: 'Premium Ended',
            message: 'Your premium benefits have expired. Upgrade to continue enjoying them.',
            link_to: 'PricingPlans'
        });

        return Response.json({ 
          status: 'expired', 
          downgraded: true,
          message: 'Subscription expired and downgraded to free' 
        });
      }
    }

    return Response.json({ 
      status: 'active', 
      is_premium: profile.is_premium,
      premium_until: profile.premium_until 
    });

  } catch (error) {
    console.error('Check my subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});