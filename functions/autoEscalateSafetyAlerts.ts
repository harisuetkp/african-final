import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function can be called by automation system (no user auth required)
    // or by admin manually
    
    // Get all triggered safety alerts
    const alerts = await base44.asServiceRole.entities.SafetyCheck.filter({
      status: 'alert_triggered',
      panic_triggered: true
    });

    const escalations = [];

    for (const alert of alerts) {
      // Get user profile
      const [profile] = await base44.asServiceRole.entities.UserProfile.filter({
        id: alert.user_profile_id
      });

      if (!profile) continue;

      // Check time since alert was triggered
      const alertTime = new Date(alert.updated_date);
      const now = new Date();
      const minutesSinceAlert = (now - alertTime) / 1000 / 60;

      // Auto-escalate if alert is more than 5 minutes old and not resolved
      if (minutesSinceAlert >= 5) {
        // Send escalated notifications
        
        // 1. Email to support team
        await base44.integrations.Core.SendEmail({
          to: 'support@afrinnect.com',
          subject: '🚨 CRITICAL: Unresolved Safety Alert',
          body: `
            CRITICAL SAFETY ALERT - REQUIRES IMMEDIATE ACTION
            
            User: ${profile.display_name} (${profile.id})
            Alert Triggered: ${minutesSinceAlert.toFixed(0)} minutes ago
            
            Meeting Location: ${alert.date_location}
            Meeting With: ${alert.meeting_with_profile_id}
            
            Emergency Contact: ${alert.emergency_contact_name}
            Contact Phone: ${alert.emergency_contact_phone}
            
            ${alert.panic_location ? `Last Known Location: https://maps.google.com/?q=${alert.panic_location.lat},${alert.panic_location.lng}` : 'Location unavailable'}
            
            ACTION REQUIRED: Contact emergency contact and verify user safety immediately.
          `
        });

        // 2. Send second alert to emergency contact
        await base44.integrations.Core.SendEmail({
          to: alert.emergency_contact_phone + '@sms.gateway.com',
          subject: '🚨 URGENT: Second Alert',
          body: `${profile.display_name} triggered emergency alert ${minutesSinceAlert.toFixed(0)} minutes ago. No response yet. ${alert.panic_location ? `Location: https://maps.google.com/?q=${alert.panic_location.lat},${alert.panic_location.lng}` : ''} PLEASE VERIFY THEIR SAFETY IMMEDIATELY.`
        });

        // 3. Get the other user's profile for investigation
        const [otherProfile] = await base44.asServiceRole.entities.UserProfile.filter({
          id: alert.meeting_with_profile_id
        });

        if (otherProfile) {
          // Temporary suspend the other user's account pending investigation
          await base44.asServiceRole.entities.UserProfile.update(otherProfile.id, {
            is_suspended: true,
            suspension_reason: 'Emergency safety alert triggered by date partner - pending investigation',
            suspension_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });

          // Send notification to suspended user
          await base44.asServiceRole.entities.Notification.create({
            user_profile_id: otherProfile.id,
            type: 'admin_message',
            title: 'Account Temporarily Suspended',
            message: 'Your account has been temporarily suspended pending a safety investigation. Our team will contact you within 24 hours.',
            is_admin: true
          });
        }

        // 4. Create audit log
        await base44.asServiceRole.entities.AdminAuditLog.create({
          admin_user_id: 'SYSTEM',
          admin_email: 'system@afrinnect.com',
          action_type: 'safety_alert_escalated',
          target_user_id: profile.id,
          details: {
            alert_id: alert.id,
            minutes_since_trigger: minutesSinceAlert,
            other_user_suspended: !!otherProfile,
            location: alert.panic_location
          }
        });

        escalations.push({
          alert_id: alert.id,
          user: profile.display_name,
          minutes_elapsed: minutesSinceAlert,
          actions_taken: ['support_notified', 'emergency_contact_alerted', otherProfile ? 'user_suspended' : null].filter(Boolean)
        });
      }
    }

    return Response.json({
      success: true,
      alerts_checked: alerts.length,
      escalations_made: escalations.length,
      escalations
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});