import { base44 } from './base44Client.js';

/**
 * Admin actions for managing the Founding Member program.
 * 
 * @param {object} payload
 * @param {string} payload.action - Action to perform: 'update_settings', 'create_code', 'revoke_code', 'grant_status', 'revoke_status', 'extend_trial'
 * @param {object} payload.data - Action-specific data
 */
export default async function adminManageFounder(payload, context) {
  const { action, data } = payload;

  // Verify admin (in production, check context.user.role === 'admin')
  
  try {
    switch (action) {
      case 'update_settings':
        return await updateSettings(data);
      
      case 'create_code':
        return await createInviteCode(data);
      
      case 'revoke_code':
        return await revokeInviteCode(data);
      
      case 'grant_status':
        return await grantFounderStatus(data);
      
      case 'revoke_status':
        return await revokeFounderStatus(data);
      
      case 'extend_trial':
        return await extendTrial(data);
      
      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  } catch (error) {
    console.error(`Error in adminManageFounder (${action}):`, error);
    return { success: false, error: error.message };
  }
}

async function updateSettings(data) {
  const { founders_mode_enabled, auto_assign_new_users, trial_days } = data;

  // Get existing settings
  const settings = await base44.entities.SystemSettings.filter({ key: 'founder_program' });
  
  const newValue = {
    founders_mode_enabled: founders_mode_enabled ?? settings[0]?.value?.founders_mode_enabled ?? false,
    auto_assign_new_users: auto_assign_new_users ?? settings[0]?.value?.auto_assign_new_users ?? false,
    trial_days: trial_days ?? settings[0]?.value?.trial_days ?? 183
  };

  if (settings.length > 0) {
    await base44.entities.SystemSettings.update(settings[0].id, {
      value: newValue,
      updated_by: 'admin'
    });
  } else {
    await base44.entities.SystemSettings.create({
      key: 'founder_program',
      value: newValue,
      description: 'Founding Member Program Configuration'
    });
  }

  return { success: true, data: newValue };
}

async function createInviteCode(data) {
  const { code, max_redemptions = 100, trial_days = 183, expires_at, notes } = data;

  if (!code || code.length < 4) {
    return { success: false, error: 'Code must be at least 4 characters' };
  }

  // Check if code already exists
  const existing = await base44.entities.FounderInviteCode.filter({ 
    code: code.toUpperCase() 
  });
  
  if (existing.length > 0) {
    return { success: false, error: 'Code already exists' };
  }

  const newCode = await base44.entities.FounderInviteCode.create({
    code: code.toUpperCase(),
    max_redemptions,
    current_redemptions: 0,
    is_active: true,
    trial_days,
    expires_at: expires_at || null,
    notes: notes || null
  });

  return { success: true, data: newCode };
}

async function revokeInviteCode(data) {
  const { codeId } = data;

  if (!codeId) {
    return { success: false, error: 'Code ID is required' };
  }

  await base44.entities.FounderInviteCode.update(codeId, {
    is_active: false
  });

  return { success: true };
}

async function grantFounderStatus(data) {
  const { userProfileId, trialDays } = data;

  if (!userProfileId) {
    return { success: false, error: 'User profile ID is required' };
  }

  const profiles = await base44.entities.UserProfile.filter({ id: userProfileId });
  if (profiles.length === 0) {
    return { success: false, error: 'User profile not found' };
  }

  const profile = profiles[0];
  const days = trialDays || 183;
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + days);

  await base44.entities.UserProfile.update(profile.id, {
    is_founding_member: true,
    founding_member_granted_at: new Date().toISOString(),
    founding_member_trial_ends_at: trialEndsAt.toISOString(),
    founding_member_source: 'manual_admin',
    founding_member_eligible: true,
    founding_trial_consumed: false,
    subscription_tier: 'premium',
    is_premium: true,
    premium_until: trialEndsAt.toISOString(),
    badges: [...(profile.badges || []).filter(b => b !== 'founding_member'), 'founding_member']
  });

  // Send notification
  await base44.entities.Notification.create({
    user_profile_id: profile.id,
    user_id: profile.user_id,
    type: 'admin_message',
    title: '🎉 Founding Member Status Granted!',
    message: `You've been granted ${days} days of FREE Premium as a Founding Member!`,
    is_admin: true
  });

  return { success: true, trialEndsAt: trialEndsAt.toISOString() };
}

async function revokeFounderStatus(data) {
  const { userProfileId } = data;

  if (!userProfileId) {
    return { success: false, error: 'User profile ID is required' };
  }

  const profiles = await base44.entities.UserProfile.filter({ id: userProfileId });
  if (profiles.length === 0) {
    return { success: false, error: 'User profile not found' };
  }

  const profile = profiles[0];

  await base44.entities.UserProfile.update(profile.id, {
    is_founding_member: false,
    founding_trial_consumed: true,
    subscription_tier: 'free',
    is_premium: false,
    premium_until: null,
    badges: (profile.badges || []).filter(b => b !== 'founding_member')
  });

  return { success: true };
}

async function extendTrial(data) {
  const { userProfileId, additionalDays } = data;

  if (!userProfileId || !additionalDays) {
    return { success: false, error: 'User profile ID and additional days are required' };
  }

  const profiles = await base44.entities.UserProfile.filter({ id: userProfileId });
  if (profiles.length === 0) {
    return { success: false, error: 'User profile not found' };
  }

  const profile = profiles[0];
  
  // Calculate new end date
  const currentEnd = profile.founding_member_trial_ends_at 
    ? new Date(profile.founding_member_trial_ends_at)
    : new Date();
  
  const newEnd = new Date(currentEnd);
  newEnd.setDate(newEnd.getDate() + additionalDays);

  await base44.entities.UserProfile.update(profile.id, {
    founding_member_trial_ends_at: newEnd.toISOString(),
    premium_until: newEnd.toISOString()
  });

  // Send notification
  await base44.entities.Notification.create({
    user_profile_id: profile.id,
    user_id: profile.user_id,
    type: 'admin_message',
    title: '🎁 Trial Extended!',
    message: `Your Founding Member trial has been extended by ${additionalDays} days!`,
    is_admin: true
  });

  return { success: true, newTrialEndsAt: newEnd.toISOString() };
}