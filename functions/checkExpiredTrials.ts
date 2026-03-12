import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Check and downgrade expired premium trials
// NOTE: This runs as a scheduled automation or admin call
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Allow both scheduled automation (no user) and admin calls
    let isAdmin = false;
    try {
      const user = await base44.auth.me();
      isAdmin = user?.role === 'admin';
    } catch (e) {
      // No user context - running as scheduled automation, which is fine
    }
    
    const now = new Date();
    const nowISO = now.toISOString();
    
    // Get all premium users whose trial has expired (use date comparison)
    const allPremiumUsers = await base44.asServiceRole.entities.UserProfile.filter({
      is_premium: true
    });
    
    // Filter expired ones manually (more reliable than date query)
    const expiredTrials = allPremiumUsers.filter(profile => {
      if (!profile.premium_until) return false;
      const premiumEnd = new Date(profile.premium_until);
      return premiumEnd < now;
    });

    let downgraded = 0;
    const errors = [];
    
    for (const profile of expiredTrials) {
      try {
        // Skip Founding Members - they have separate trial logic
        if (profile.is_founding_member && profile.founding_member_trial_ends_at) {
          const trialEnd = new Date(profile.founding_member_trial_ends_at);
          if (trialEnd > now) continue; // Still in founding trial
        }
        
        // Check if they have active Stripe subscription
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
          user_profile_id: profile.id,
          status: 'active'
        });
        
        if (subscriptions.length > 0) {
          // Has active subscription - don't downgrade, just update premium_until
          const activeSub = subscriptions[0];
          if (activeSub.end_date) {
            // Use updateUserProfile function for reliable updates
            await base44.functions.invoke('updateUserProfile', {
              profile_id: profile.id,
              updates: { premium_until: activeSub.end_date }
            });
          }
          continue;
        }
        
        // Downgrade to free tier using updateUserProfile function
        await base44.functions.invoke('updateUserProfile', {
          profile_id: profile.id,
          updates: {
            is_premium: false,
            subscription_tier: 'free',
            premium_until: null
          }
        });

        // Send notification
        await base44.asServiceRole.entities.Notification.create({
          user_profile_id: profile.id,
          user_id: profile.user_id,
          type: 'admin_message',
          title: 'Your Premium Trial Has Ended',
          message: 'Thanks for trying Premium! Upgrade now to continue enjoying unlimited likes, profile boosts, and more.',
          link_to: 'PricingPlans',
          is_admin: true
        });

        downgraded++;
      } catch (profileError) {
        errors.push({ profile_id: profile.id, error: profileError.message });
      }
    }

    return Response.json({
      success: true,
      message: `Downgraded ${downgraded} expired trials`,
      downgraded,
      checked: expiredTrials.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Check expired trials error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});