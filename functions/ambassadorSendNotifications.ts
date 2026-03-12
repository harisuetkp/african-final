import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { notification_type, ambassador_id, data = {} } = await req.json();

    if (!notification_type) {
      return Response.json({ error: 'notification_type required' }, { status: 400 });
    }

    // Get ambassador if specified
    let ambassador = null;
    if (ambassador_id) {
      ambassador = (await base44.asServiceRole.entities.Ambassador.filter({ id: ambassador_id }))[0];
      if (!ambassador) {
        return Response.json({ error: 'Ambassador not found' }, { status: 404 });
      }
    }

    switch (notification_type) {
      case 'commission_earned': {
        // Sent when a new commission is created
        const { commission_type, amount, user_name } = data;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ambassador.email,
          subject: `🎉 New Commission Earned - $${amount.toFixed(2)}`,
          body: `
Hi ${ambassador.display_name},

Great news! You just earned a commission!

Commission Details:
- Type: ${commission_type.replace('_', ' ')}
- Amount: $${amount.toFixed(2)} USD
${user_name ? `- Referred user: ${user_name}` : ''}

This commission will be available for payout after a 14-day hold period.

View your earnings: https://afrinnect.com/AmbassadorPortal

Keep up the great work! 🚀

- The Afrinnect Team
          `.trim()
        });
        break;
      }

      case 'referral_signup': {
        // Sent when someone signs up using their code
        const { user_name } = data;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ambassador.email,
          subject: `🎊 New Signup from Your Referral!`,
          body: `
Hi ${ambassador.display_name},

Someone just signed up using your referral code!

${user_name ? `New user: ${user_name}` : ''}

They're now in your referral pipeline. You'll earn commission when they subscribe to premium.

Keep sharing your link to grow your earnings!

Your referral link: https://afrinnect.com/Onboarding?a=${ambassador.referral_code}

- The Afrinnect Team
          `.trim()
        });
        break;
      }

      case 'payout_eligible': {
        // Sent when ambassador crosses payout threshold
        const threshold = ambassador.payout_threshold || 50;
        const approvedCommissions = await base44.asServiceRole.entities.AmbassadorCommission.filter({
          ambassador_id: ambassador.id,
          status: 'approved'
        });
        const totalApproved = approvedCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ambassador.email,
          subject: `💰 You're Eligible for Payout!`,
          body: `
Hi ${ambassador.display_name},

You've reached the payout threshold!

Available for payout: $${totalApproved.toFixed(2)} USD

Payouts are processed on the 1st and 15th of each month. Make sure your payout details are up to date in your ambassador portal.

View your earnings: https://afrinnect.com/AmbassadorPortal

- The Afrinnect Team
          `.trim()
        });
        break;
      }

      case 'trial_expiring': {
        // Sent to founding members when trial is expiring
        const { profile_id, days_remaining, trial_ends_at } = data;
        const profile = (await base44.asServiceRole.entities.UserProfile.filter({ id: profile_id }))[0];
        if (!profile) break;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: profile.created_by,
          subject: `⏰ Your Founding Member Trial Ends in ${days_remaining} Days`,
          body: `
Hi ${profile.display_name},

Your Founding Member premium trial is ending soon!

Trial expires: ${new Date(trial_ends_at).toLocaleDateString()}
Days remaining: ${days_remaining}

Don't lose access to these premium features:
- Unlimited likes
- See who likes you
- Advanced filters
- Read receipts
- Priority support

Subscribe now to keep all your premium benefits: https://afrinnect.com/PricingPlans

Thank you for being one of our founding members! 💜

- The Afrinnect Team
          `.trim()
        });
        break;
      }

      case 'ambassador_approved': {
        // Sent when ambassador application is approved
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ambassador.email,
          subject: `🎉 Welcome to the Afrinnect Ambassador Program!`,
          body: `
Hi ${ambassador.display_name},

Congratulations! Your ambassador application has been approved!

You're now officially an Afrinnect Ambassador. Here's how to get started:

1. Access your portal: https://afrinnect.com/AmbassadorPortal
2. Your unique referral code: ${ambassador.referral_code}
3. Your referral link: https://afrinnect.com/Onboarding?a=${ambassador.referral_code}

How to earn:
- Share your link on social media
- Tell friends and family about Afrinnect
- Create content featuring Afrinnect
- Earn commission on every premium subscriber

We're excited to have you on board! 🚀

- The Afrinnect Team
          `.trim()
        });
        break;
      }

      case 'weekly_summary': {
        // Weekly performance summary for ambassadors
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const weeklyEvents = await base44.asServiceRole.entities.AmbassadorReferralEvent.filter({
          ambassador_id: ambassador.id,
          created_date: { $gte: weekAgo.toISOString() }
        });

        const weeklyCommissions = await base44.asServiceRole.entities.AmbassadorCommission.filter({
          ambassador_id: ambassador.id,
          created_date: { $gte: weekAgo.toISOString() }
        });

        const clicks = weeklyEvents.filter(e => e.event_type === 'click').length;
        const signups = weeklyEvents.filter(e => e.event_type === 'signup').length;
        const subscribers = weeklyEvents.filter(e => e.event_type === 'subscribe').length;
        const earnings = weeklyCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ambassador.email,
          subject: `📊 Your Weekly Ambassador Report`,
          body: `
Hi ${ambassador.display_name},

Here's your weekly performance summary:

This Week's Stats:
- Link clicks: ${clicks}
- New signups: ${signups}
- New subscribers: ${subscribers}
- Earnings: $${earnings.toFixed(2)}

All-Time Stats:
- Total signups: ${ambassador.stats?.total_signups || 0}
- Total subscribers: ${ambassador.stats?.total_subscribers || 0}
- Total earned: $${(ambassador.stats?.total_commissions_earned || 0).toFixed(2)}

${earnings > 0 ? 'Great job this week! Keep it up! 🎉' : 'Share your link more to boost your earnings!'}

View full dashboard: https://afrinnect.com/AmbassadorPortal

- The Afrinnect Team
          `.trim()
        });
        break;
      }

      default:
        return Response.json({ error: 'Unknown notification_type' }, { status: 400 });
    }

    return Response.json({ success: true, notification_type });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});