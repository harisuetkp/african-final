import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function should be run daily via automation
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const results = {
      notifications_sent: 0,
      errors: []
    };

    // Get all founding members with active trials
    const foundingMembers = await base44.asServiceRole.entities.UserProfile.filter({
      is_founding_member: true,
      founding_trial_consumed: false
    });

    for (const profile of foundingMembers) {
      if (!profile.founding_member_trial_ends_at) continue;
      
      const trialEndsAt = new Date(profile.founding_member_trial_ends_at);
      const daysRemaining = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));

      // Send notifications at 14 days, 7 days, 3 days, and 1 day
      const notificationDays = [14, 7, 3, 1];
      
      if (notificationDays.includes(daysRemaining)) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: profile.created_by,
            subject: daysRemaining === 1 
              ? `⚠️ Your Founding Member Trial Ends Tomorrow!`
              : `⏰ Your Founding Member Trial Ends in ${daysRemaining} Days`,
            body: `
Hi ${profile.display_name},

${daysRemaining === 1 
  ? "This is your last day to enjoy premium features for free!"
  : `Your Founding Member premium trial is ending in ${daysRemaining} days.`}

Trial expires: ${trialEndsAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

Don't lose access to these premium features:
✨ Unlimited likes
👀 See who likes you
🔍 Advanced filters
✓ Read receipts
🎯 Priority support

${daysRemaining <= 3 
  ? "Subscribe now before it's too late!"
  : "Subscribe now to ensure uninterrupted access:"}

https://afrinnect.com/PricingPlans

Thank you for being one of our founding members! 💜

- The Afrinnect Team
            `.trim()
          });

          // Create in-app notification too
          await base44.asServiceRole.entities.Notification.create({
            user_profile_id: profile.id,
            user_id: profile.user_id,
            type: 'admin_message',
            title: daysRemaining === 1 ? 'Trial Ends Tomorrow!' : `Trial Ends in ${daysRemaining} Days`,
            message: `Your Founding Member trial expires ${daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`}. Subscribe to keep premium features.`,
            link_to: 'PricingPlans',
            is_admin: true
          });

          results.notifications_sent++;
        } catch (err) {
          results.errors.push({ profile_id: profile.id, error: err.message });
        }
      }
    }

    // Also check for expired trials that haven't been marked as consumed
    const expiredTrials = foundingMembers.filter(p => {
      if (!p.founding_member_trial_ends_at) return false;
      return new Date(p.founding_member_trial_ends_at) < now;
    });

    for (const profile of expiredTrials) {
      // Mark trial as consumed
      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        founding_trial_consumed: true,
        is_premium: false,
        subscription_tier: 'free'
      });
    }

    return Response.json({ 
      success: true, 
      ...results,
      expired_trials_processed: expiredTrials.length
    });

  } catch (error) {
    console.error('Trial notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});