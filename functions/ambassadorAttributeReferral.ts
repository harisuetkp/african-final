import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Attribution window in days
const ATTRIBUTION_WINDOW_DAYS = 30;
const COMMISSION_HOLD_DAYS = 14;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referral_code, device_id, ip_address, user_agent, event_type } = await req.json();

    // event_type: 'click' | 'signup'
    if (!event_type) {
      return Response.json({ error: 'event_type required' }, { status: 400 });
    }

    // Find ambassador by referral code
    let ambassador = null;
    if (referral_code) {
      const ambassadors = await base44.asServiceRole.entities.Ambassador.filter({ 
        referral_code: referral_code.toUpperCase(),
        status: 'active'
      });
      if (ambassadors.length > 0) {
        ambassador = ambassadors[0];
      }
    }

    if (!ambassador) {
      return Response.json({ error: 'Invalid or inactive referral code' }, { status: 400 });
    }

    // Anti-fraud: Check for self-referral
    if (ambassador.user_id === user.id || ambassador.email === user.email) {
      return Response.json({ error: 'Self-referral not allowed' }, { status: 400 });
    }

    // Check if user already has a referral attribution
    const existingReferrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({ user_id: user.id });
    
    const now = new Date();
    const attributionExpiry = new Date(now.getTime() + (ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000));

    if (event_type === 'click') {
      // Record click event
      await base44.asServiceRole.entities.AmbassadorReferralEvent.create({
        ambassador_id: ambassador.id,
        user_id: user.id,
        event_type: 'click',
        device_id,
        ip_address,
        user_agent,
        metadata: { referral_code }
      });

      // Update ambassador click stats
      await base44.asServiceRole.entities.Ambassador.update(ambassador.id, {
        stats: {
          ...ambassador.stats,
          total_clicks: (ambassador.stats?.total_clicks || 0) + 1
        }
      });

      // If no existing referral, create pending one
      if (existingReferrals.length === 0) {
        await base44.asServiceRole.entities.AmbassadorReferral.create({
          ambassador_id: ambassador.id,
          user_id: user.id,
          attribution_source: 'link',
          referral_code_used: referral_code.toUpperCase(),
          first_click_at: now.toISOString(),
          attribution_expires_at: attributionExpiry.toISOString(),
          status: 'pending',
          device_id,
          ip_address,
          referral_history: [{
            ambassador_id: ambassador.id,
            source: 'link',
            timestamp: now.toISOString()
          }]
        });
      } else {
        // Last-touch: update attribution to new ambassador
        const existingRef = existingReferrals[0];
        const history = existingRef.referral_history || [];
        history.push({
          ambassador_id: ambassador.id,
          source: 'link',
          timestamp: now.toISOString()
        });

        await base44.asServiceRole.entities.AmbassadorReferral.update(existingRef.id, {
          ambassador_id: ambassador.id,
          referral_code_used: referral_code.toUpperCase(),
          attribution_expires_at: attributionExpiry.toISOString(),
          referral_history: history
        });
      }

      return Response.json({ success: true, event: 'click_recorded' });
    }

    if (event_type === 'signup') {
      // Anti-fraud checks
      const fraudFlags = [];

      // Check for duplicate device
      if (device_id) {
        const sameDeviceReferrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({ 
          device_id,
          ambassador_id: ambassador.id
        });
        if (sameDeviceReferrals.length > 2) {
          fraudFlags.push('multiple_signups_same_device');
        }
      }

      // Check for duplicate IP (allow some, flag excessive)
      if (ip_address) {
        const sameIPReferrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({ 
          ip_address,
          ambassador_id: ambassador.id 
        });
        if (sameIPReferrals.length > 5) {
          fraudFlags.push('excessive_signups_same_ip');
        }
      }

      // Get user profile
      const userProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
      const userProfile = userProfiles[0];

      // Check if phone matches ambassador
      if (userProfile?.phone_number && ambassador.phone === userProfile.phone_number) {
        fraudFlags.push('phone_matches_ambassador');
      }

      // Create or update referral record
      let referral;
      if (existingReferrals.length > 0) {
        referral = existingReferrals[0];
        
        // Check if attribution is still valid
        if (referral.attribution_expires_at && new Date(referral.attribution_expires_at) < now) {
          return Response.json({ error: 'Attribution window expired' }, { status: 400 });
        }

        await base44.asServiceRole.entities.AmbassadorReferral.update(referral.id, {
          status: 'signed_up',
          signup_at: now.toISOString(),
          attributed_at: now.toISOString(),
          user_profile_id: userProfile?.id,
          is_founding_member: userProfile?.is_founding_member || false,
          founding_trial_ends_at: userProfile?.founding_member_trial_ends_at,
          fraud_flags: fraudFlags,
          is_suspicious: fraudFlags.length > 0
        });
        referral = { ...referral, fraud_flags: fraudFlags };
      } else {
        // Direct code entry during signup
        referral = await base44.asServiceRole.entities.AmbassadorReferral.create({
          ambassador_id: ambassador.id,
          user_id: user.id,
          user_profile_id: userProfile?.id,
          attribution_source: 'code',
          referral_code_used: referral_code.toUpperCase(),
          attributed_at: now.toISOString(),
          signup_at: now.toISOString(),
          status: 'signed_up',
          device_id,
          ip_address,
          is_founding_member: userProfile?.is_founding_member || false,
          founding_trial_ends_at: userProfile?.founding_member_trial_ends_at,
          fraud_flags: fraudFlags,
          is_suspicious: fraudFlags.length > 0,
          referral_history: [{
            ambassador_id: ambassador.id,
            source: 'code',
            timestamp: now.toISOString()
          }]
        });
      }

      // Record signup event
      await base44.asServiceRole.entities.AmbassadorReferralEvent.create({
        ambassador_id: ambassador.id,
        user_id: user.id,
        referral_id: referral.id,
        event_type: 'signup',
        device_id,
        ip_address,
        user_agent,
        metadata: { referral_code, fraud_flags }
      });

      // Update ambassador stats
      await base44.asServiceRole.entities.Ambassador.update(ambassador.id, {
        stats: {
          ...ambassador.stats,
          total_signups: (ambassador.stats?.total_signups || 0) + 1
        }
      });

      // Check for signup bonus
      const plan = ambassador.commission_plan_id 
        ? (await base44.asServiceRole.entities.AmbassadorCommissionPlan.filter({ id: ambassador.commission_plan_id }))[0]
        : (await base44.asServiceRole.entities.AmbassadorCommissionPlan.filter({ is_default: true, is_active: true }))[0];

      if (plan?.signup_bonus > 0 && fraudFlags.length === 0) {
        const tierMultiplier = plan.tier_multipliers?.[ambassador.tier] || 1;
        const holdUntil = new Date(now.getTime() + (COMMISSION_HOLD_DAYS * 24 * 60 * 60 * 1000));

        await base44.asServiceRole.entities.AmbassadorCommission.create({
          ambassador_id: ambassador.id,
          referral_id: referral.id,
          user_id: user.id,
          commission_type: 'signup_bonus',
          original_amount: plan.signup_bonus,
          amount: plan.signup_bonus * tierMultiplier,
          tier_multiplier: tierMultiplier,
          currency: 'USD',
          status: 'pending',
          hold_until: holdUntil.toISOString()
        });
      }

      return Response.json({ 
        success: true, 
        event: 'signup_attributed',
        ambassador_name: ambassador.display_name,
        is_suspicious: fraudFlags.length > 0
      });
    }

    return Response.json({ error: 'Invalid event_type' }, { status: 400 });

  } catch (error) {
    console.error('Attribution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});