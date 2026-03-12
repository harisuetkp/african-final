import { base44 } from './base44Client.js';

/**
 * Scheduled function to check and handle expired founding member trials.
 * Should run daily via automation.
 */
export default async function checkExpiredFounderTrials(payload, context) {
  try {
    const now = new Date();
    const results = {
      expired: 0,
      warningsSent: 0,
      lastChanceSent: 0,
      errors: []
    };

    // Get all active founding members
    const foundingMembers = await base44.entities.UserProfile.filter({
      is_founding_member: true,
      founding_trial_consumed: false
    });

    for (const member of foundingMembers) {
      try {
        const trialEnd = member.founding_member_trial_ends_at 
          ? new Date(member.founding_member_trial_ends_at)
          : null;

        if (!trialEnd) continue;

        const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

        // Trial has expired
        if (daysRemaining <= 0) {
          await handleExpiredTrial(member);
          results.expired++;
        }
        // 7 days warning
        else if (daysRemaining === 7) {
          await sendTrialWarning(member, 7);
          results.warningsSent++;
        }
        // 3 days warning
        else if (daysRemaining === 3) {
          await sendTrialWarning(member, 3);
          results.warningsSent++;
        }
        // 1 day last chance
        else if (daysRemaining === 1) {
          await sendLastChance(member);
          results.lastChanceSent++;
        }

      } catch (memberError) {
        results.errors.push({
          memberId: member.id,
          error: memberError.message
        });
      }
    }

    return {
      success: true,
      data: results
    };

  } catch (error) {
    console.error('Error checking expired founder trials:', error);
    return { success: false, error: error.message };
  }
}

async function handleExpiredTrial(member) {
  // Mark trial as consumed and downgrade to free
  await base44.entities.UserProfile.update(member.id, {
    founding_trial_consumed: true,
    subscription_tier: 'free',
    is_premium: false,
    premium_until: null,
    badges: (member.badges || []).filter(b => b !== 'founding_member')
  });

  // Send expiration notification
  await base44.entities.Notification.create({
    user_profile_id: member.id,
    user_id: member.user_id,
    type: 'admin_message',
    title: '💔 Your Founding Member Trial Has Ended',
    message: 'Your free Premium access has expired. Upgrade now to keep all your benefits and continue connecting!',
    is_admin: true,
    link_to: '/PricingPlans'
  });

  // Send push notification
  try {
    await base44.functions.invoke('sendPushNotification', {
      user_profile_id: member.id,
      title: '💔 Trial Ended',
      body: 'Your Founding Member trial has ended. Upgrade to keep Premium!',
      link: '/PricingPlans',
      type: 'admin_message'
    });
  } catch (e) {
    console.log('Push notification failed:', e);
  }

  // Send email
  try {
    await base44.integrations.Core.SendEmail({
      to: member.created_by,
      subject: 'Your Afrinnect Founding Member Trial Has Ended',
      body: `
        <h2>Hi ${member.display_name}! 💔</h2>
        <p>Your Founding Member trial has come to an end. We hope you've enjoyed the Premium experience!</p>
        <p>Don't worry – you can still keep all the amazing features you've been enjoying. Upgrade now to continue:</p>
        <ul>
          <li>✨ Unlimited likes & matches</li>
          <li>👀 See who likes you</li>
          <li>⏪ Unlimited rewinds</li>
          <li>🚀 Profile boosts</li>
        </ul>
        <p><a href="https://afrinnect.com/PricingPlans" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Upgrade Now</a></p>
        <p>As one of our founding members, you'll always hold a special place in our community. ❤️</p>
        <p>– The Afrinnect Team</p>
      `
    });
  } catch (e) {
    console.log('Email failed:', e);
  }
}

async function sendTrialWarning(member, daysRemaining) {
  await base44.entities.Notification.create({
    user_profile_id: member.id,
    user_id: member.user_id,
    type: 'admin_message',
    title: `⏰ ${daysRemaining} Days Left of Your Free Premium!`,
    message: `Your Founding Member trial ends in ${daysRemaining} days. Upgrade now to keep your benefits!`,
    is_admin: true,
    link_to: '/PricingPlans'
  });

  // Send push notification
  try {
    await base44.functions.invoke('sendPushNotification', {
      user_profile_id: member.id,
      title: `⏰ ${daysRemaining} Days Left!`,
      body: `Your free Premium ends in ${daysRemaining} days. Don't lose your benefits!`,
      link: '/PricingPlans',
      type: 'admin_message'
    });
  } catch (e) {
    console.log('Push notification failed:', e);
  }
}

async function sendLastChance(member) {
  await base44.entities.Notification.create({
    user_profile_id: member.id,
    user_id: member.user_id,
    type: 'admin_message',
    title: '🚨 LAST DAY of Your Free Premium!',
    message: 'Your Founding Member trial ends TOMORROW! Upgrade now to keep unlimited likes, see who likes you, and more!',
    is_admin: true,
    link_to: '/PricingPlans'
  });

  // Send push notification
  try {
    await base44.functions.invoke('sendPushNotification', {
      user_profile_id: member.id,
      title: '🚨 LAST DAY!',
      body: 'Your free Premium ends TOMORROW! Upgrade now!',
      link: '/PricingPlans',
      type: 'admin_message'
    });
  } catch (e) {
    console.log('Push notification failed:', e);
  }

  // Send email
  try {
    await base44.integrations.Core.SendEmail({
      to: member.created_by,
      subject: '🚨 LAST DAY: Your Afrinnect Premium Ends Tomorrow!',
      body: `
        <h2>Hi ${member.display_name}! ⏰</h2>
        <p><strong>This is your last day of FREE Premium access!</strong></p>
        <p>Tomorrow, you'll lose:</p>
        <ul>
          <li>❌ Unlimited likes</li>
          <li>❌ Seeing who likes you</li>
          <li>❌ Unlimited rewinds</li>
          <li>❌ Profile boosts</li>
        </ul>
        <p>Don't let your connections fade away!</p>
        <p><a href="https://afrinnect.com/PricingPlans" style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">UPGRADE NOW - LAST CHANCE!</a></p>
        <p>❤️ The Afrinnect Team</p>
      `
    });
  } catch (e) {
    console.log('Email failed:', e);
  }
}