import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@^14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate Admin
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.email !== 'pivotngoyb@gmail.com')) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_profile_id, violation_type, content, severity, details } = await req.json();

    // Get user profile to check violation history
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ id: user_profile_id });
    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profiles[0];
    const violationCount = profile.violation_count || 0;
    const warningCount = profile.warning_count || 0;

    // Define severity levels and their thresholds
    const SEVERITY_CONFIG = {
      low: { threshold: 3, label: 'minor' },        // Spam, minor issues
      medium: { threshold: 5, label: 'moderate' },  // Harassment, inappropriate content
      high: { threshold: 7, label: 'serious' },     // Hate speech, explicit content
      critical: { threshold: 9, label: 'severe' }   // Illegal activity, threats, child safety
    };

    const severityLevel = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
    let action = 'warning';
    let suspensionDays = 0;
    let shouldBan = false;
    let notifyAuthorities = false;

    // Critical violations = immediate ban
    if (severity === 'critical' || severityLevel.threshold >= 9) {
      action = 'permanent_ban';
      shouldBan = true;
      notifyAuthorities = true;
    }
    // High severity = immediate suspension or ban based on history
    else if (severity === 'high' || severityLevel.threshold >= 7) {
      if (violationCount >= 1) {
        action = 'permanent_ban';
        shouldBan = true;
      } else {
        action = 'temporary_ban';
        suspensionDays = 30;
      }
    }
    // Medium severity = progressive discipline
    else if (severity === 'medium' || severityLevel.threshold >= 5) {
      if (violationCount >= 2) {
        action = 'permanent_ban';
        shouldBan = true;
      } else if (violationCount >= 1 || warningCount >= 2) {
        action = 'temporary_ban';
        suspensionDays = 14;
      } else {
        action = 'warning';
      }
    }
    // Low severity = warnings before suspension
    else {
      if (violationCount >= 3) {
        action = 'temporary_ban';
        suspensionDays = 7;
      } else if (warningCount >= 3) {
        action = 'temporary_ban';
        suspensionDays = 7;
      } else {
        action = 'warning';
      }
    }

    // Apply enforcement action
    const updateData = {
      violation_count: violationCount + 1
    };

    if (action === 'warning') {
      updateData.warning_count = warningCount + 1;
      
      // Send warning notification
      await base44.asServiceRole.entities.Notification.create({
        user_profile_id: user_profile_id,
        type: 'admin_message',
        title: '⚠️ Community Guidelines Warning',
        message: `You received a warning for: ${violation_type}. Repeated violations may result in suspension or permanent ban.`,
        is_admin: true,
        link_to: 'CommunityGuidelines'
      });
    } 
    else if (action === 'temporary_ban') {
      const suspensionExpiry = new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000);
      updateData.is_suspended = true;
      updateData.suspension_expires_at = suspensionExpiry.toISOString();
      updateData.suspension_reason = `${violation_type}: ${details || 'Community guidelines violation'}`;

      // Send suspension notification
      await base44.asServiceRole.entities.Notification.create({
        user_profile_id: user_profile_id,
        type: 'admin_message',
        title: '🚫 Account Suspended',
        message: `Your account has been suspended for ${suspensionDays} days due to: ${violation_type}. You can return on ${suspensionExpiry.toLocaleDateString()}.`,
        is_admin: true
      });

      // Send email notification
      const userProfiles = await base44.asServiceRole.entities.UserProfile.filter({ id: user_profile_id });
      if (userProfiles.length > 0) {
        const user = await base44.asServiceRole.auth.getUserById(userProfiles[0].user_id);
        
        // PAUSE SUBSCRIPTION (Suspend Billing)
        try {
            const activeSubs = await base44.asServiceRole.entities.Subscription.filter({
                user_profile_id: user_profile_id,
                status: 'active'
            });
            
            if (activeSubs.length > 0) {
                const sub = activeSubs[0];
                if (sub.payment_provider === 'stripe' && sub.external_id) {
                    await stripe.subscriptions.update(sub.external_id, {
                        pause_collection: {
                            behavior: 'void', // Don't charge, void invoices
                            resumes_at: Math.floor(suspensionExpiry.getTime() / 1000) // Auto-resume when suspension ends
                        }
                    });
                    
                    // Update local status
                    await base44.asServiceRole.entities.Subscription.update(sub.id, {
                        status: 'paused'
                    });
                    
                    console.log(`Paused subscription ${sub.id} until ${suspensionExpiry}`);
                }
            }
        } catch (err) {
            console.error('Failed to pause subscription:', err);
        }

        if (user) {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: 'Afrinnect Account Suspended',
            body: `Your Afrinnect account has been suspended for ${suspensionDays} days due to violation of community guidelines: ${violation_type}. Your subscription billing has been paused and will resume automatically on ${suspensionExpiry.toLocaleDateString()}.`
          });
        }
      }
    }
    else if (action === 'permanent_ban') {
      updateData.is_banned = true;
      updateData.ban_reason = `${violation_type}: ${details || 'Serious community guidelines violation'}`;
      updateData.is_active = false;

      // CANCEL SUBSCRIPTION IMMEDIATELY
      try {
          const activeSubs = await base44.asServiceRole.entities.Subscription.filter({
              user_profile_id: user_profile_id,
              status: 'active'
          });
          
          if (activeSubs.length > 0) {
              const sub = activeSubs[0];
              if (sub.payment_provider === 'stripe' && sub.external_id) {
                  // Immediate cancellation
                  await stripe.subscriptions.cancel(sub.external_id);
                  
                  // Update local status
                  await base44.asServiceRole.entities.Subscription.update(sub.id, {
                      status: 'cancelled',
                      auto_renew: false
                  });
                  
                  console.log(`Cancelled subscription ${sub.id} due to ban`);
              }
          }
      } catch (err) {
          console.error('Failed to cancel subscription:', err);
      }

      // Send ban notification
      await base44.asServiceRole.entities.Notification.create({
        user_profile_id: user_profile_id,
        type: 'admin_message',
        title: '🛑 Account Permanently Banned',
        message: `Your account has been permanently banned for: ${violation_type}. This decision is final.`,
        is_admin: true
      });

      // Send email notification
      const userProfiles = await base44.asServiceRole.entities.UserProfile.filter({ id: user_profile_id });
      if (userProfiles.length > 0) {
        const user = await base44.asServiceRole.auth.getUserById(userProfiles[0].user_id);
        if (user) {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: 'Afrinnect Account Banned',
            body: `Your Afrinnect account has been permanently banned due to serious violation of community guidelines: ${violation_type}. If you believe this is an error, please contact support.`
          });
        }
      }
    }

    // Update user profile with new violation data
    await base44.asServiceRole.entities.UserProfile.update(user_profile_id, updateData);

    // Create moderation action record
    await base44.asServiceRole.entities.ModerationAction.create({
      user_profile_id: user_profile_id,
      action_type: violation_type,
      reason: details || content || 'Automated moderation',
      severity: severity,
      action_taken: action,
      automated: true
    });

    // Create audit log
    await base44.asServiceRole.entities.AdminAuditLog.create({
      admin_user_id: 'system_ai',
      admin_email: 'ai@afrinnect.com',
      action_type: action === 'warning' ? 'user_warned' : action === 'permanent_ban' ? 'user_ban' : 'user_suspension',
      target_user_id: user_profile_id,
      details: {
        violation_type,
        severity,
        violation_count: violationCount + 1,
        action_taken: action,
        automated: true,
        content: content?.substring(0, 200)
      }
    });

    // If critical, notify authorities (admin team)
    if (notifyAuthorities) {
      // Get all admin users
      const adminUsers = await base44.asServiceRole.entities.UserProfile.filter({ is_active: true });
      const user = await base44.asServiceRole.auth.getUserById(profile.user_id);
      
      for (const admin of adminUsers) {
        const adminUser = await base44.asServiceRole.auth.getUserById(admin.user_id);
        if (adminUser?.role === 'admin') {
          await base44.asServiceRole.entities.Notification.create({
            user_profile_id: admin.id,
            type: 'admin_message',
            title: '🚨 Critical Violation Detected',
            message: `User ${profile.display_name} flagged for: ${violation_type}. Automatic ban applied. Review required.`,
            is_admin: true,
            link_to: 'AdminDashboard'
          });
        }
      }

      // Send email to support
      await base44.integrations.Core.SendEmail({
        to: 'support@afrinnect.com',
        subject: '🚨 URGENT: Critical Violation Detected',
        body: `Critical violation detected and user automatically banned:\n\nUser: ${profile.display_name} (${user?.email})\nViolation: ${violation_type}\nSeverity: ${severity}\nDetails: ${details}\nContent: ${content?.substring(0, 500)}\n\nReview immediately in admin dashboard.`
      });
    }

    return Response.json({
      success: true,
      action,
      violation_count: violationCount + 1,
      warning_count: action === 'warning' ? warningCount + 1 : warningCount,
      suspension_days: suspensionDays,
      is_banned: shouldBan,
      notify_authorities: notifyAuthorities,
      message: action === 'warning' 
        ? 'Warning issued' 
        : action === 'temporary_ban' 
        ? `Suspended for ${suspensionDays} days` 
        : 'Permanently banned'
    });

  } catch (error) {
    console.error('Auto-enforcement error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});