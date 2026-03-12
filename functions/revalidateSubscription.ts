import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@^14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

// Revalidate subscription status on login
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ valid: true, tier: 'free' });
    }

    const profile = profiles[0];
    
    // If user is free tier, nothing to validate
    if (profile.subscription_tier === 'free' || !profile.is_premium) {
      return Response.json({ valid: true, tier: 'free' });
    }

    // Check if premium has expired based on premium_until date
    const now = new Date();
    const premiumUntil = profile.premium_until ? new Date(profile.premium_until) : null;
    
    if (premiumUntil && premiumUntil < now) {
      // Premium expired - check Stripe for active subscription
      if (profile.stripe_customer_id) {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length > 0) {
          // Has active Stripe subscription - update profile
          const sub = subscriptions.data[0];
          const endDate = new Date(sub.current_period_end * 1000);
          
          await base44.entities.UserProfile.update(profile.id, {
            is_premium: true,
            premium_until: endDate.toISOString().split('T')[0]
          });

          return Response.json({ 
            valid: true, 
            tier: profile.subscription_tier,
            renewed: true,
            premium_until: endDate.toISOString()
          });
        }
      }

      // No active subscription - downgrade to free
      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        is_premium: false,
        subscription_tier: 'free',
        premium_until: null
      });

      // Create notification
      await base44.asServiceRole.entities.Notification.create({
        user_profile_id: profile.id,
        user_id: user.id,
        type: 'admin_message',
        title: 'Subscription Expired',
        message: 'Your premium subscription has expired. Upgrade to continue enjoying premium features.',
        link_to: 'PricingPlans',
        is_admin: true
      });

      return Response.json({ 
        valid: false, 
        tier: 'free',
        expired: true,
        message: 'Subscription expired'
      });
    }

    // Premium still valid
    return Response.json({ 
      valid: true, 
      tier: profile.subscription_tier,
      premium_until: profile.premium_until
    });

  } catch (error) {
    console.error('Subscription revalidation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});