import { base44 } from './base44Client.js';

/**
 * Gets statistics about the Founding Member program for admin dashboard.
 */
export default async function getFounderStats(payload, context) {
  try {
    // Get all founding members
    const foundingMembers = await base44.entities.UserProfile.filter({ 
      is_founding_member: true 
    });

    const now = new Date();

    // Calculate stats
    let activeCount = 0;
    let expiredCount = 0;
    let convertedCount = 0;
    let sourceCounts = {
      global_toggle: 0,
      invite_code: 0,
      manual_admin: 0
    };

    const recentFounders = [];
    const expiringThisWeek = [];
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const member of foundingMembers) {
      const trialEnd = member.founding_member_trial_ends_at 
        ? new Date(member.founding_member_trial_ends_at) 
        : null;

      // Count by status
      if (trialEnd && trialEnd > now) {
        activeCount++;
        
        // Check if expiring this week
        if (trialEnd <= weekFromNow) {
          expiringThisWeek.push({
            id: member.id,
            display_name: member.display_name,
            email: member.created_by,
            trial_ends_at: member.founding_member_trial_ends_at
          });
        }
      } else {
        expiredCount++;
      }

      // Count conversions
      if (member.founding_member_converted) {
        convertedCount++;
      }

      // Count by source
      const source = member.founding_member_source || 'global_toggle';
      if (sourceCounts[source] !== undefined) {
        sourceCounts[source]++;
      }

      // Get recent founders (last 7 days)
      const grantedAt = member.founding_member_granted_at 
        ? new Date(member.founding_member_granted_at)
        : null;
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      if (grantedAt && grantedAt > weekAgo) {
        recentFounders.push({
          id: member.id,
          display_name: member.display_name,
          email: member.created_by,
          granted_at: member.founding_member_granted_at,
          source: member.founding_member_source
        });
      }
    }

    // Get invite code stats
    const inviteCodes = await base44.entities.FounderInviteCode.list();
    const codeStats = inviteCodes.map(code => ({
      id: code.id,
      code: code.code,
      redemptions: code.current_redemptions || 0,
      max_redemptions: code.max_redemptions || 100,
      is_active: code.is_active,
      expires_at: code.expires_at,
      trial_days: code.trial_days
    }));

    // Get founder program settings
    const settings = await base44.entities.SystemSettings.filter({ key: 'founder_program' });
    const founderConfig = settings[0]?.value || {
      founders_mode_enabled: false,
      auto_assign_new_users: false,
      trial_days: 183
    };

    // Calculate conversion rate
    const conversionRate = expiredCount > 0 
      ? Math.round((convertedCount / expiredCount) * 100) 
      : 0;

    return {
      success: true,
      data: {
        summary: {
          total: foundingMembers.length,
          active: activeCount,
          expired: expiredCount,
          converted: convertedCount,
          conversionRate,
          slotsRemaining: Math.max(0, 1000 - foundingMembers.length)
        },
        sourceCounts,
        recentFounders: recentFounders.slice(0, 10),
        expiringThisWeek,
        inviteCodes: codeStats,
        config: founderConfig
      }
    };

  } catch (error) {
    console.error('Error getting founder stats:', error);
    return { success: false, error: error.message };
  }
}