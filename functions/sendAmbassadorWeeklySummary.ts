import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Run weekly via automation (e.g., every Monday)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const results = {
      emails_sent: 0,
      errors: []
    };

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get all active ambassadors
    const ambassadors = await base44.asServiceRole.entities.Ambassador.filter({ status: 'active' });

    for (const ambassador of ambassadors) {
      try {
        // Get weekly stats
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

        // Only send if there's some activity or it's been a while
        const hasActivity = clicks > 0 || signups > 0 || subscribers > 0 || earnings > 0;
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ambassador.email,
          subject: hasActivity 
            ? `📊 Your Weekly Ambassador Report - $${earnings.toFixed(2)} earned!`
            : `📊 Your Weekly Ambassador Report`,
          body: `
Hi ${ambassador.display_name},

Here's your weekly performance summary for Afrinnect:

📈 THIS WEEK'S STATS:
━━━━━━━━━━━━━━━━━━━━
🔗 Link clicks: ${clicks}
📝 New signups: ${signups}
⭐ New subscribers: ${subscribers}
💰 Earnings: $${earnings.toFixed(2)}

📊 ALL-TIME STATS:
━━━━━━━━━━━━━━━━━━━━
Total signups: ${ambassador.stats?.total_signups || 0}
Total subscribers: ${ambassador.stats?.total_subscribers || 0}
Total earned: $${(ambassador.stats?.total_commissions_earned || 0).toFixed(2)}
Conversion rate: ${ambassador.stats?.total_signups ? ((ambassador.stats?.total_subscribers || 0) / ambassador.stats.total_signups * 100).toFixed(1) : 0}%

${hasActivity 
  ? (earnings > 0 
    ? '🎉 Great job this week! Your earnings are looking good!' 
    : '💪 Nice work getting signups! Keep pushing for conversions!')
  : '💡 Tip: Share your link on social media to boost your earnings!'}

Your referral link: https://afrinnect.com/Onboarding?a=${ambassador.referral_code}

View your full dashboard: https://afrinnect.com/AmbassadorPortal

Keep spreading the love! 💜

- The Afrinnect Team
          `.trim()
        });

        results.emails_sent++;
      } catch (err) {
        results.errors.push({ ambassador_id: ambassador.id, error: err.message });
      }
    }

    return Response.json({ success: true, ...results });

  } catch (error) {
    console.error('Weekly summary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});