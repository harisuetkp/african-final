import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const COMMISSION_HOLD_DAYS = 14;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function can be called from webhooks or internal triggers
    const { 
      event_type, // activate, subscribe, renew, cancel, refund, chargeback
      user_id,
      subscription_id,
      amount,
      currency = 'USD',
      metadata = {}
    } = await req.json();

    if (!event_type || !user_id) {
      return Response.json({ error: 'event_type and user_id required' }, { status: 400 });
    }

    // Find referral record for this user
    const referrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({ user_id });
    if (referrals.length === 0) {
      return Response.json({ success: true, message: 'No ambassador referral found' });
    }

    const referral = referrals[0];
    const ambassador = (await base44.asServiceRole.entities.Ambassador.filter({ id: referral.ambassador_id }))[0];
    
    if (!ambassador || ambassador.status !== 'active') {
      return Response.json({ success: true, message: 'Ambassador inactive' });
    }

    // Get commission plan
    const plan = ambassador.commission_plan_id 
      ? (await base44.asServiceRole.entities.AmbassadorCommissionPlan.filter({ id: ambassador.commission_plan_id }))[0]
      : (await base44.asServiceRole.entities.AmbassadorCommissionPlan.filter({ is_default: true, is_active: true }))[0];

    if (!plan) {
      return Response.json({ success: true, message: 'No commission plan found' });
    }

    const now = new Date();
    const tierMultiplier = plan.tier_multipliers?.[ambassador.tier] || 1;
    const holdUntil = new Date(now.getTime() + (COMMISSION_HOLD_DAYS * 24 * 60 * 60 * 1000));

    // Record the event
    await base44.asServiceRole.entities.AmbassadorReferralEvent.create({
      ambassador_id: ambassador.id,
      user_id,
      referral_id: referral.id,
      event_type,
      subscription_id,
      revenue_amount: amount,
      currency,
      metadata
    });

    // Process based on event type
    switch (event_type) {
      case 'activate': {
        // User completed profile + sent first message
        if (referral.status !== 'activated') {
          await base44.asServiceRole.entities.AmbassadorReferral.update(referral.id, {
            status: 'activated',
            activated_at: now.toISOString()
          });

          // Update ambassador stats
          await base44.asServiceRole.entities.Ambassador.update(ambassador.id, {
            stats: {
              ...ambassador.stats,
              total_activations: (ambassador.stats?.total_activations || 0) + 1
            }
          });

          // Activation bonus
          if (plan.activation_bonus > 0 && !referral.is_suspicious) {
            await base44.asServiceRole.entities.AmbassadorCommission.create({
              ambassador_id: ambassador.id,
              referral_id: referral.id,
              user_id,
              commission_type: 'activation_bonus',
              original_amount: plan.activation_bonus,
              amount: plan.activation_bonus * tierMultiplier,
              tier_multiplier: tierMultiplier,
              currency: 'USD',
              status: 'pending',
              hold_until: holdUntil.toISOString()
            });
          }
        }
        break;
      }

      case 'subscribe': {
        // First paid subscription
        await base44.asServiceRole.entities.AmbassadorReferral.update(referral.id, {
          status: 'subscribed',
          first_subscription_at: now.toISOString(),
          total_revenue: (referral.total_revenue || 0) + (amount || 0)
        });

        // Update ambassador stats
        await base44.asServiceRole.entities.Ambassador.update(ambassador.id, {
          stats: {
            ...ambassador.stats,
            total_subscribers: (ambassador.stats?.total_subscribers || 0) + 1,
            total_revenue_generated: (ambassador.stats?.total_revenue_generated || 0) + (amount || 0)
          }
        });

        // Calculate commission based on plan type
        if (!referral.is_suspicious) {
          let commissionAmount = 0;
          let commissionType = 'cpa';

          if (plan.plan_type === 'cpa' && plan.cpa_amount) {
            commissionAmount = plan.cpa_amount;
            commissionType = 'cpa';
          } else if ((plan.plan_type === 'revenue_share' || plan.plan_type === 'hybrid') && plan.revenue_share_pct && amount) {
            commissionAmount = amount * (plan.revenue_share_pct / 100);
            commissionType = 'revenue_share';
          } else if (plan.plan_type === 'recurring_share' && plan.recurring_share_pct && amount) {
            commissionAmount = amount * (plan.recurring_share_pct / 100);
            commissionType = 'recurring_share';
          }

          // CPA bonus removed - hybrid plan now only uses revenue_share + recurring_share

          if (commissionAmount > 0) {
            await base44.asServiceRole.entities.AmbassadorCommission.create({
              ambassador_id: ambassador.id,
              referral_id: referral.id,
              user_id,
              subscription_id,
              commission_type: commissionType,
              original_amount: commissionAmount,
              amount: commissionAmount * tierMultiplier,
              tier_multiplier: tierMultiplier,
              currency,
              status: 'pending',
              hold_until: holdUntil.toISOString()
            });
          }

          // Check for active campaigns
          const activeCampaigns = await base44.asServiceRole.entities.AmbassadorCampaign.filter({
            is_active: true,
            starts_at: { $lte: now.toISOString() },
            ends_at: { $gte: now.toISOString() }
          });

          for (const campaign of activeCampaigns) {
            // Check eligibility
            const tierEligible = !campaign.eligible_tiers?.length || campaign.eligible_tiers.includes(ambassador.tier);
            const idEligible = !campaign.eligible_ambassador_ids?.length || campaign.eligible_ambassador_ids.includes(ambassador.id);

            if (tierEligible && idEligible) {
              if (campaign.campaign_type === 'bonus_multiplier' && campaign.bonus_multiplier && commissionAmount > 0) {
                const bonusAmount = commissionAmount * (campaign.bonus_multiplier - 1);
                await base44.asServiceRole.entities.AmbassadorCommission.create({
                  ambassador_id: ambassador.id,
                  referral_id: referral.id,
                  user_id,
                  subscription_id,
                  commission_type: 'campaign_bonus',
                  original_amount: bonusAmount,
                  amount: bonusAmount * tierMultiplier,
                  tier_multiplier: tierMultiplier,
                  currency,
                  status: 'pending',
                  hold_until: holdUntil.toISOString(),
                  notes: `Campaign: ${campaign.name}`
                });
              } else if (campaign.campaign_type === 'flat_bonus' && campaign.flat_bonus_amount) {
                await base44.asServiceRole.entities.AmbassadorCommission.create({
                  ambassador_id: ambassador.id,
                  referral_id: referral.id,
                  user_id,
                  subscription_id,
                  commission_type: 'campaign_bonus',
                  original_amount: campaign.flat_bonus_amount,
                  amount: campaign.flat_bonus_amount * tierMultiplier,
                  tier_multiplier: tierMultiplier,
                  currency,
                  status: 'pending',
                  hold_until: holdUntil.toISOString(),
                  notes: `Campaign: ${campaign.name}`
                });
              }
            }
          }

          // Check milestone bonuses
          if (plan.milestone_rules?.length > 0) {
            const currentStats = ambassador.stats || {};
            for (const milestone of plan.milestone_rules) {
              let currentValue = 0;
              if (milestone.type === 'signups') currentValue = currentStats.total_signups || 0;
              else if (milestone.type === 'subscribers') currentValue = (currentStats.total_subscribers || 0) + 1;
              else if (milestone.type === 'revenue') currentValue = (currentStats.total_revenue_generated || 0) + (amount || 0);

              // Check if just crossed threshold
              const previousValue = milestone.type === 'subscribers' 
                ? (currentStats.total_subscribers || 0)
                : milestone.type === 'revenue'
                  ? (currentStats.total_revenue_generated || 0)
                  : currentValue;

              if (currentValue >= milestone.threshold && previousValue < milestone.threshold) {
                await base44.asServiceRole.entities.AmbassadorCommission.create({
                  ambassador_id: ambassador.id,
                  referral_id: referral.id,
                  user_id,
                  commission_type: 'milestone_bonus',
                  original_amount: milestone.bonus_amount,
                  amount: milestone.bonus_amount * tierMultiplier,
                  tier_multiplier: tierMultiplier,
                  currency: 'USD',
                  status: 'pending',
                  hold_until: holdUntil.toISOString(),
                  notes: `Milestone: ${milestone.threshold} ${milestone.type}`
                });
              }
            }
          }
        }
        break;
      }

      case 'renew': {
        // Recurring payment
        await base44.asServiceRole.entities.AmbassadorReferral.update(referral.id, {
          total_revenue: (referral.total_revenue || 0) + (amount || 0)
        });

        await base44.asServiceRole.entities.Ambassador.update(ambassador.id, {
          stats: {
            ...ambassador.stats,
            total_revenue_generated: (ambassador.stats?.total_revenue_generated || 0) + (amount || 0)
          }
        });

        // Check if within recurring months window
        if ((plan.plan_type === 'recurring_share' || plan.plan_type === 'hybrid') && plan.recurring_share_pct && amount) {
          const firstSubDate = referral.first_subscription_at ? new Date(referral.first_subscription_at) : null;
          if (firstSubDate) {
            const monthsSinceFirst = Math.floor((now.getTime() - firstSubDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
            if (monthsSinceFirst < (plan.recurring_months || 6)) {
              const commissionAmount = amount * (plan.recurring_share_pct / 100);
              if (commissionAmount > 0 && !referral.is_suspicious) {
                await base44.asServiceRole.entities.AmbassadorCommission.create({
                  ambassador_id: ambassador.id,
                  referral_id: referral.id,
                  user_id,
                  subscription_id,
                  commission_type: 'recurring_share',
                  original_amount: commissionAmount,
                  amount: commissionAmount * tierMultiplier,
                  tier_multiplier: tierMultiplier,
                  currency,
                  status: 'pending',
                  hold_until: holdUntil.toISOString(),
                  notes: `Renewal month ${monthsSinceFirst + 1}`
                });
              }
            }
          }
        }
        break;
      }

      case 'refund':
      case 'chargeback': {
        // Reverse pending/approved commissions for this subscription
        const commissionsToReverse = await base44.asServiceRole.entities.AmbassadorCommission.filter({
          subscription_id,
          status: { $in: ['pending', 'approved'] }
        });

        for (const commission of commissionsToReverse) {
          await base44.asServiceRole.entities.AmbassadorCommission.update(commission.id, {
            status: 'reversed',
            reversal_reason: event_type
          });
        }

        // Update revenue stats (subtract)
        await base44.asServiceRole.entities.AmbassadorReferral.update(referral.id, {
          total_revenue: Math.max(0, (referral.total_revenue || 0) - (amount || 0))
        });

        await base44.asServiceRole.entities.Ambassador.update(ambassador.id, {
          stats: {
            ...ambassador.stats,
            total_revenue_generated: Math.max(0, (ambassador.stats?.total_revenue_generated || 0) - (amount || 0))
          }
        });
        break;
      }

      case 'cancel': {
        await base44.asServiceRole.entities.AmbassadorReferral.update(referral.id, {
          status: 'churned'
        });
        break;
      }
    }

    return Response.json({ success: true, event_type, processed: true });

  } catch (error) {
    console.error('Process event error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});