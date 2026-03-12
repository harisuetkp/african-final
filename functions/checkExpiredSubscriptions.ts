import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function can be called by automation system or admin manually
        try {
          const user = await base44.auth.me();
          if (user && user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
          }
        } catch (e) {
          // Called by automation system without user context - allowed
        }

        const now = new Date().toISOString();
        
        // Find expired active subscriptions
        const expiredSubs = await base44.asServiceRole.entities.Subscription.filter({
            status: 'active',
            end_date: { $lt: now }
        });

        const results = [];

        for (const sub of expiredSubs) {
            // Update subscription
            await base44.asServiceRole.entities.Subscription.update(sub.id, {
                status: 'expired'
            });

            // Update user profile
            await base44.asServiceRole.entities.UserProfile.update(sub.user_profile_id, {
                is_premium: false,
                subscription_tier: 'free'
            });

            // Notify user
            await base44.asServiceRole.entities.Notification.create({
                user_profile_id: sub.user_profile_id,
                type: 'system',
                title: 'Subscription Expired',
                message: 'Your premium subscription has expired. Renew now to keep your benefits!'
            });
            
            results.push(sub.id);
        }

        return Response.json({ success: true, checked: results.length, ids: results });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});