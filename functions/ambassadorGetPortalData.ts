import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find ambassador by user_id or email
    const ambassadors = await base44.asServiceRole.entities.Ambassador.filter({
      $or: [
        { user_id: user.id },
        { email: user.email }
      ]
    });

    if (ambassadors.length === 0) {
      return Response.json({ error: 'Not an ambassador' }, { status: 403 });
    }

    const ambassador = ambassadors[0];

    if (ambassador.status === 'suspended' || ambassador.status === 'terminated') {
      return Response.json({ 
        error: 'Ambassador account suspended',
        reason: ambassador.suspended_reason
      }, { status: 403 });
    }

    // Get commission plan
    const plan = ambassador.commission_plan_id 
      ? (await base44.asServiceRole.entities.AmbassadorCommissionPlan.filter({ id: ambassador.commission_plan_id }))[0]
      : (await base44.asServiceRole.entities.AmbassadorCommissionPlan.filter({ is_default: true, is_active: true }))[0];

    // Get commissions breakdown
    const allCommissions = await base44.asServiceRole.entities.AmbassadorCommission.filter({
      ambassador_id: ambassador.id
    });

    const pendingCommissions = allCommissions.filter(c => c.status === 'pending');
    const approvedCommissions = allCommissions.filter(c => c.status === 'approved');
    const paidCommissions = allCommissions.filter(c => c.status === 'paid');

    const pendingAmount = pendingCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const approvedAmount = approvedCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);
    const paidAmount = paidCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);

    // Get referrals for pipeline view
    const referrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({
      ambassador_id: ambassador.id
    });

    const foundingMemberReferrals = referrals.filter(r => r.is_founding_member && r.status !== 'subscribed');
    const potentialFutureRevenue = foundingMemberReferrals.length * (plan?.cpa_amount || 10);

    // Get recent events (anonymized)
    const recentEvents = await base44.asServiceRole.entities.AmbassadorReferralEvent.filter(
      { ambassador_id: ambassador.id },
      '-created_date',
      50
    );

    // Anonymize events
    const anonymizedEvents = recentEvents.map(e => ({
      id: e.id,
      event_type: e.event_type,
      created_date: e.created_date,
      revenue_amount: e.revenue_amount,
      // Don't expose user_id
      user_ref: e.user_id ? `REF-${e.user_id.slice(-6)}` : null
    }));

    // Get payouts
    const payouts = await base44.asServiceRole.entities.AmbassadorPayout.filter(
      { ambassador_id: ambassador.id },
      '-created_date',
      20
    );

    // Get active campaigns
    const now = new Date().toISOString();
    const activeCampaigns = await base44.asServiceRole.entities.AmbassadorCampaign.filter({
      is_active: true,
      starts_at: { $lte: now },
      ends_at: { $gte: now }
    });

    // Get content assets
    const contentAssets = await base44.asServiceRole.entities.AmbassadorContentAsset.filter({
      is_active: true
    });

    // Calculate conversion funnel
    const stats = ambassador.stats || {};
    const conversionRate = stats.total_signups > 0 
      ? ((stats.total_subscribers || 0) / stats.total_signups * 100).toFixed(1)
      : 0;
    const activationRate = stats.total_signups > 0 
      ? ((stats.total_activations || 0) / stats.total_signups * 100).toFixed(1)
      : 0;

    // Next payout estimate (1st of next month)
    const nextPayoutDate = new Date();
    nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
    nextPayoutDate.setDate(1);

    return Response.json({
      ambassador: {
        id: ambassador.id,
        handle: ambassador.handle,
        display_name: ambassador.display_name,
        tier: ambassador.tier,
        status: ambassador.status,
        referral_code: ambassador.referral_code,
        referral_link: ambassador.referral_link,
        qr_code_url: ambassador.qr_code_url,
        payout_method: ambassador.payout_method,
        payout_threshold: ambassador.payout_threshold,
        terms_accepted: ambassador.terms_accepted
      },
      stats: {
        total_clicks: stats.total_clicks || 0,
        total_signups: stats.total_signups || 0,
        total_activations: stats.total_activations || 0,
        total_subscribers: stats.total_subscribers || 0,
        total_revenue_generated: stats.total_revenue_generated || 0,
        conversion_rate: conversionRate,
        activation_rate: activationRate
      },
      earnings: {
        pending: pendingAmount,
        approved: approvedAmount,
        paid: paidAmount,
        total_earned: pendingAmount + approvedAmount + paidAmount,
        available_for_payout: approvedAmount,
        potential_pipeline: potentialFutureRevenue,
        founding_members_pending: foundingMemberReferrals.length
      },
      commission_plan: plan ? {
        name: plan.name,
        plan_type: plan.plan_type,
        cpa_amount: plan.cpa_amount,
        revenue_share_pct: plan.revenue_share_pct,
        recurring_share_pct: plan.recurring_share_pct,
        recurring_months: plan.recurring_months,
        activation_bonus: plan.activation_bonus,
        signup_bonus: plan.signup_bonus,
        tier_multiplier: plan.tier_multipliers?.[ambassador.tier] || 1
      } : null,
      recent_activity: anonymizedEvents,
      payouts,
      active_campaigns: activeCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        campaign_type: c.campaign_type,
        bonus_multiplier: c.bonus_multiplier,
        flat_bonus_amount: c.flat_bonus_amount,
        ends_at: c.ends_at
      })),
      content_assets: contentAssets,
      next_payout_date: nextPayoutDate.toISOString(),
      payout_eligible: approvedAmount >= (ambassador.payout_threshold || 50)
    });

  } catch (error) {
    console.error('Portal data error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});