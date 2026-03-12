import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, ...data } = await req.json();

    switch (action) {
      case 'create_ambassador': {
        const { handle, email, display_name, phone, country, commission_plan_id } = data;
        
        if (!handle || !email) {
          return Response.json({ error: 'handle and email required' }, { status: 400 });
        }

        // Check for existing
        const existing = await base44.asServiceRole.entities.Ambassador.filter({
          $or: [{ handle: handle.toLowerCase() }, { email }]
        });
        if (existing.length > 0) {
          return Response.json({ error: 'Ambassador with this handle or email already exists' }, { status: 400 });
        }

        const referralCode = `AMBA_${handle.toUpperCase()}`;
        const referralLink = `https://afrinnect.com/r/${referralCode}`;

        const ambassador = await base44.asServiceRole.entities.Ambassador.create({
          handle: handle.toLowerCase(),
          email,
          display_name: display_name || handle,
          phone,
          country,
          referral_code: referralCode,
          referral_link: referralLink,
          commission_plan_id,
          status: 'pending',
          tier: 'bronze',
          stats: {
            total_clicks: 0,
            total_signups: 0,
            total_activations: 0,
            total_subscribers: 0,
            total_revenue_generated: 0,
            total_commissions_earned: 0,
            total_commissions_paid: 0
          }
        });

        return Response.json({ success: true, ambassador });
      }

      case 'update_ambassador': {
        const { ambassador_id, updates } = data;
        
        if (!ambassador_id) {
          return Response.json({ error: 'ambassador_id required' }, { status: 400 });
        }

        // Don't allow updating certain fields
        delete updates.referral_code;
        delete updates.stats;

        await base44.asServiceRole.entities.Ambassador.update(ambassador_id, updates);
        return Response.json({ success: true });
      }

      case 'suspend_ambassador': {
        const { ambassador_id, reason } = data;
        
        await base44.asServiceRole.entities.Ambassador.update(ambassador_id, {
          status: 'suspended',
          suspended_reason: reason,
          suspended_at: new Date().toISOString()
        });

        return Response.json({ success: true });
      }

      case 'activate_ambassador': {
        const { ambassador_id } = data;
        
        await base44.asServiceRole.entities.Ambassador.update(ambassador_id, {
          status: 'active',
          suspended_reason: null,
          suspended_at: null
        });

        return Response.json({ success: true });
      }

      case 'approve_commissions': {
        // Approve all pending commissions past hold period
        const now = new Date();
        const pendingCommissions = await base44.asServiceRole.entities.AmbassadorCommission.filter({
          status: 'pending',
          hold_until: { $lte: now.toISOString() }
        });

        let approvedCount = 0;
        for (const commission of pendingCommissions) {
          // Check if referral is not suspicious
          const referral = commission.referral_id 
            ? (await base44.asServiceRole.entities.AmbassadorReferral.filter({ id: commission.referral_id }))[0]
            : null;

          if (!referral?.is_suspicious) {
            await base44.asServiceRole.entities.AmbassadorCommission.update(commission.id, {
              status: 'approved',
              approved_at: now.toISOString()
            });
            approvedCount++;
          }
        }

        return Response.json({ success: true, approved_count: approvedCount });
      }

      case 'process_payout': {
        const { ambassador_id, payout_method } = data;
        
        const ambassador = (await base44.asServiceRole.entities.Ambassador.filter({ id: ambassador_id }))[0];
        if (!ambassador) {
          return Response.json({ error: 'Ambassador not found' }, { status: 404 });
        }

        // Get approved commissions
        const approvedCommissions = await base44.asServiceRole.entities.AmbassadorCommission.filter({
          ambassador_id,
          status: 'approved'
        });

        if (approvedCommissions.length === 0) {
          return Response.json({ error: 'No approved commissions to pay' }, { status: 400 });
        }

        const totalAmount = approvedCommissions.reduce((sum, c) => sum + (c.amount || 0), 0);

        if (totalAmount < (ambassador.payout_threshold || 50)) {
          return Response.json({ error: `Amount below threshold ($${ambassador.payout_threshold || 50})` }, { status: 400 });
        }

        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Create payout record
        const payout = await base44.asServiceRole.entities.AmbassadorPayout.create({
          ambassador_id,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          total_amount: totalAmount,
          currency: 'USD',
          commission_count: approvedCommissions.length,
          commission_ids: approvedCommissions.map(c => c.id),
          status: 'pending',
          payout_method: payout_method || ambassador.payout_method,
          payout_details: ambassador.payout_details
        });

        // Mark commissions as paid
        for (const commission of approvedCommissions) {
          await base44.asServiceRole.entities.AmbassadorCommission.update(commission.id, {
            status: 'paid',
            paid_at: now.toISOString(),
            payout_id: payout.id
          });
        }

        // Update ambassador stats
        await base44.asServiceRole.entities.Ambassador.update(ambassador_id, {
          stats: {
            ...ambassador.stats,
            total_commissions_paid: (ambassador.stats?.total_commissions_paid || 0) + totalAmount
          }
        });

        return Response.json({ success: true, payout });
      }

      case 'mark_payout_paid': {
        const { payout_id, transaction_id } = data;
        
        await base44.asServiceRole.entities.AmbassadorPayout.update(payout_id, {
          status: 'paid',
          paid_at: new Date().toISOString(),
          transaction_id
        });

        return Response.json({ success: true });
      }

      case 'get_stats': {
        const ambassadors = await base44.asServiceRole.entities.Ambassador.list('-created_date', 500);
        const referrals = await base44.asServiceRole.entities.AmbassadorReferral.list('-created_date', 1000);
        const commissions = await base44.asServiceRole.entities.AmbassadorCommission.list('-created_date', 1000);
        const payouts = await base44.asServiceRole.entities.AmbassadorPayout.list('-created_date', 100);

        const activeAmbassadors = ambassadors.filter(a => a.status === 'active').length;
        const totalSignups = referrals.filter(r => r.status !== 'pending').length;
        const totalSubscribers = referrals.filter(r => r.status === 'subscribed').length;
        const totalRevenue = referrals.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
        
        const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0);
        const approvedCommissions = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.amount || 0), 0);
        const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0);

        const suspiciousReferrals = referrals.filter(r => r.is_suspicious).length;

        return Response.json({
          total_ambassadors: ambassadors.length,
          active_ambassadors: activeAmbassadors,
          total_signups: totalSignups,
          total_subscribers: totalSubscribers,
          total_revenue: totalRevenue,
          pending_commissions: pendingCommissions,
          approved_commissions: approvedCommissions,
          paid_commissions: paidCommissions,
          suspicious_referrals: suspiciousReferrals,
          conversion_rate: totalSignups > 0 ? (totalSubscribers / totalSignups * 100).toFixed(1) : 0
        });
      }

      case 'get_suspicious_referrals': {
        const suspicious = await base44.asServiceRole.entities.AmbassadorReferral.filter({
          is_suspicious: true
        });

        return Response.json({ referrals: suspicious });
      }

      case 'create_campaign': {
        const campaign = await base44.asServiceRole.entities.AmbassadorCampaign.create(data.campaign);
        return Response.json({ success: true, campaign });
      }

      case 'create_commission_plan': {
        const plan = await base44.asServiceRole.entities.AmbassadorCommissionPlan.create(data.plan);
        return Response.json({ success: true, plan });
      }

      case 'upload_content_asset': {
        const asset = await base44.asServiceRole.entities.AmbassadorContentAsset.create(data.asset);
        return Response.json({ success: true, asset });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});