import { base44 } from './base44Client.js';

/**
 * Grants Founding Member status to a user profile.
 * Called during profile creation or manually by admin.
 * 
 * @param {object} payload
 * @param {string} payload.userProfileId - The user profile ID to grant status to
 * @param {string} payload.source - How the status was granted: 'global_toggle', 'invite_code', 'manual_admin'
 * @param {string} [payload.inviteCode] - The invite code used (if applicable)
 * @param {number} [payload.trialDays] - Override trial days (default: from system settings)
 */
export default async function grantFoundingMember(payload, context) {
  const { userProfileId, source, inviteCode, trialDays: overrideTrialDays } = payload;

  if (!userProfileId) {
    return { success: false, error: 'User profile ID is required' };
  }

  try {
    // Get the user profile
    const profiles = await base44.entities.UserProfile.filter({ id: userProfileId });
    if (profiles.length === 0) {
      return { success: false, error: 'User profile not found' };
    }

    const profile = profiles[0];

    // Check if already a founding member
    if (profile.is_founding_member && profile.founding_member_trial_ends_at) {
      const trialEnd = new Date(profile.founding_member_trial_ends_at);
      if (trialEnd > new Date()) {
        return { 
          success: false, 
          error: 'User is already a founding member',
          trialEndsAt: profile.founding_member_trial_ends_at
        };
      }
    }

    // Check if user has already consumed their founding trial
    if (profile.founding_trial_consumed) {
      return { 
        success: false, 
        error: 'User has already used their founding member trial' 
      };
    }

    // Get trial days from system settings or override
    let trialDays = overrideTrialDays || 183; // Default 6 months
    
    if (!overrideTrialDays) {
      const settings = await base44.entities.SystemSettings.filter({ key: 'founder_program' });
      if (settings.length > 0 && settings[0].value?.trial_days) {
        trialDays = settings[0].value.trial_days;
      }
    }

    // If using an invite code, validate and process it
    let codeId = null;
    if (source === 'invite_code' && inviteCode) {
      const codes = await base44.entities.FounderInviteCode.filter({ 
        code: inviteCode.toUpperCase(),
        is_active: true
      });

      if (codes.length === 0) {
        return { success: false, error: 'Invalid or inactive invite code' };
      }

      const code = codes[0];

      // Check if code has expired
      if (code.expires_at && new Date(code.expires_at) < new Date()) {
        return { success: false, error: 'Invite code has expired' };
      }

      // Check redemption limit
      if (code.current_redemptions >= code.max_redemptions) {
        return { success: false, error: 'Invite code has reached its redemption limit' };
      }

      // Use code's custom trial days if available
      if (code.trial_days) {
        trialDays = code.trial_days;
      }

      codeId = code.id;

      // Increment redemption count
      await base44.entities.FounderInviteCode.update(code.id, {
        current_redemptions: (code.current_redemptions || 0) + 1
      });

      // Record redemption
      await base44.entities.FounderCodeRedemption.create({
        code_id: code.id,
        code: inviteCode.toUpperCase(),
        user_id: profile.user_id,
        user_email: profile.created_by
      });
    }

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    // Update user profile with founding member status
    const updateData = {
      is_founding_member: true,
      founding_member_granted_at: new Date().toISOString(),
      founding_member_trial_ends_at: trialEndsAt.toISOString(),
      founding_member_source: source,
      founding_member_eligible: true,
      founding_trial_consumed: false, // Will be set to true when trial ends
      // Grant premium benefits
      subscription_tier: 'premium',
      is_premium: true,
      premium_until: trialEndsAt.toISOString(),
      // Add founding_member badge
      badges: [...(profile.badges || []).filter(b => b !== 'founding_member'), 'founding_member']
    };

    if (inviteCode) {
      updateData.founding_member_code_used = inviteCode.toUpperCase();
    }

    await base44.entities.UserProfile.update(profile.id, updateData);

    // Create welcome notification
    await base44.entities.Notification.create({
      user_profile_id: profile.id,
      user_id: profile.user_id,
      type: 'admin_message',
      title: '🎉 Welcome, Founding Member!',
      message: `You're now part of our exclusive first 1,000 members! Enjoy ${trialDays} days of FREE Premium access.`,
      is_admin: true
    });

    return {
      success: true,
      data: {
        userProfileId: profile.id,
        trialDays,
        trialEndsAt: trialEndsAt.toISOString(),
        source,
        codeId
      }
    };

  } catch (error) {
    console.error('Error granting founding member status:', error);
    return { success: false, error: error.message };
  }
}