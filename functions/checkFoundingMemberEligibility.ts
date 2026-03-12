import { base44 } from './base44Client.js';

/**
 * Checks if a user is eligible for Founding Member status.
 * Used during signup/onboarding to determine if the user should get FM status.
 * 
 * @param {object} payload
 * @param {string} [payload.userProfileId] - Existing user profile ID (if checking for existing user)
 * @param {string} [payload.inviteCode] - Invite code to validate
 */
export default async function checkFoundingMemberEligibility(payload, context) {
  const { userProfileId, inviteCode } = payload;

  try {
    // Get founder program settings
    const settings = await base44.entities.SystemSettings.filter({ key: 'founder_program' });
    const founderConfig = settings[0]?.value || {
      founders_mode_enabled: false,
      auto_assign_new_users: false,
      trial_days: 183
    };

    // Check if founder mode is globally enabled
    if (!founderConfig.founders_mode_enabled) {
      // Even if global mode is off, check if they have a valid invite code
      if (inviteCode) {
        const codeResult = await validateInviteCode(inviteCode);
        if (codeResult.valid) {
          return {
            eligible: true,
            reason: 'invite_code',
            trialDays: codeResult.trialDays,
            codeId: codeResult.codeId
          };
        }
      }
      
      return {
        eligible: false,
        reason: 'founder_mode_disabled'
      };
    }

    // If checking for an existing user
    if (userProfileId) {
      const profiles = await base44.entities.UserProfile.filter({ id: userProfileId });
      if (profiles.length === 0) {
        return { eligible: false, reason: 'profile_not_found' };
      }

      const profile = profiles[0];

      // Check if already used founding trial
      if (profile.founding_trial_consumed) {
        return { eligible: false, reason: 'trial_already_consumed' };
      }

      // Check if already an active founding member
      if (profile.is_founding_member && profile.founding_member_trial_ends_at) {
        const trialEnd = new Date(profile.founding_member_trial_ends_at);
        if (trialEnd > new Date()) {
          return { 
            eligible: false, 
            reason: 'already_founding_member',
            trialEndsAt: profile.founding_member_trial_ends_at
          };
        }
      }
    }

    // Check invite code if provided
    if (inviteCode) {
      const codeResult = await validateInviteCode(inviteCode);
      if (codeResult.valid) {
        return {
          eligible: true,
          reason: 'invite_code',
          trialDays: codeResult.trialDays,
          codeId: codeResult.codeId
        };
      } else {
        return {
          eligible: false,
          reason: codeResult.reason
        };
      }
    }

    // Check if auto-assign is enabled for new users
    if (founderConfig.auto_assign_new_users) {
      // Count current founding members to enforce limit
      const foundingMembers = await base44.entities.UserProfile.filter({ 
        is_founding_member: true 
      });
      
      const FOUNDING_MEMBER_LIMIT = 1000;
      
      if (foundingMembers.length < FOUNDING_MEMBER_LIMIT) {
        return {
          eligible: true,
          reason: 'auto_assign',
          trialDays: founderConfig.trial_days,
          slotsRemaining: FOUNDING_MEMBER_LIMIT - foundingMembers.length
        };
      } else {
        return {
          eligible: false,
          reason: 'founding_slots_full',
          totalFounders: foundingMembers.length
        };
      }
    }

    return {
      eligible: false,
      reason: 'not_eligible'
    };

  } catch (error) {
    console.error('Error checking founding member eligibility:', error);
    return { eligible: false, reason: 'error', error: error.message };
  }
}

async function validateInviteCode(code) {
  const codes = await base44.entities.FounderInviteCode.filter({ 
    code: code.toUpperCase(),
    is_active: true
  });

  if (codes.length === 0) {
    return { valid: false, reason: 'invalid_code' };
  }

  const inviteCode = codes[0];

  // Check expiration
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    return { valid: false, reason: 'code_expired' };
  }

  // Check redemption limit
  if (inviteCode.current_redemptions >= inviteCode.max_redemptions) {
    return { valid: false, reason: 'code_limit_reached' };
  }

  return {
    valid: true,
    trialDays: inviteCode.trial_days || 183,
    codeId: inviteCode.id
  };
}