import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Boost user profile for 24 hours (only verified users)
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
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profiles[0];

    // CRITICAL: Only verified users can boost (Photo OR ID verified)
    const isVerified = profile.verification_status?.photo_verified || profile.verification_status?.id_verified;
    
    if (!isVerified) {
      return Response.json({ 
        error: 'Only verified users can boost their profile. Please complete photo verification to unlock this feature.',
        verified: false
      }, { status: 403 });
    }

    // Check if user has an active boost
    if (profile.profile_boost_active && profile.boost_expires_at) {
      const expiresAt = new Date(profile.boost_expires_at);
      if (expiresAt > new Date()) {
        return Response.json({
          error: 'You already have an active boost',
          active: true,
          expires_at: profile.boost_expires_at
        }, { status: 400 });
      }
    }

    // Check boost availability based on subscription tier
    const tier = profile.subscription_tier || 'free';
    const boostLimits = {
      free: 1,      // 1 boost per month
      premium: 5,   // 5 boosts per month
      elite: 10,    // 10 boosts per month
      vip: 999      // Unlimited boosts
    };

    const limit = boostLimits[tier] || 1;

    // Check monthly boost usage
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const recentBoosts = await base44.entities.ProfileBoost.filter({
      user_profile_id: profile.id,
      created_date: { $gte: monthAgo }
    });

    if (recentBoosts.length >= limit) {
      return Response.json({
        error: `You've used all your boosts for this month. ${tier === 'free' ? 'Upgrade to Premium for more boosts!' : 'Try again next month.'}`,
        limit_reached: true,
        tier,
        limit
      }, { status: 400 });
    }

    // Activate boost for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await base44.entities.UserProfile.update(profile.id, {
      profile_boost_active: true,
      boost_expires_at: expiresAt
    });

    // Create boost record
    await base44.entities.ProfileBoost.create({
      user_profile_id: profile.id,
      boost_duration_hours: 24,
      status: 'active',
      expires_at: expiresAt
    });

    return Response.json({
      success: true,
      message: 'Profile boosted! Your profile will be shown to more people for the next 24 hours.',
      expires_at: expiresAt
    });
  } catch (error) {
    console.error('Boost profile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});