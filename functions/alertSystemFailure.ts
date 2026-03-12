import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Alert admins on critical system failures
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { 
      error_type, 
      function_name, 
      error_message, 
      severity = 'high',
      metadata = {}
    } = await req.json();

    if (!error_type || !error_message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Log to ErrorLog entity
    await base44.asServiceRole.entities.ErrorLog.create({
      type: 'error',
      message: `[${error_type}] ${error_message}`,
      url: function_name || 'backend-function',
      severity,
      breadcrumbs: [{ action: 'system_alert', data: metadata, timestamp: new Date().toISOString() }]
    });

    // Send email alert for critical/high severity
    if (severity === 'critical' || severity === 'high') {
      const adminEmail = 'pivotngoyb@gmail.com'; // Primary admin
      
      await base44.integrations.Core.SendEmail({
        to: adminEmail,
        subject: `🚨 [${severity.toUpperCase()}] Afrinnect System Alert: ${error_type}`,
        body: `
SYSTEM FAILURE ALERT
====================

Severity: ${severity.toUpperCase()}
Type: ${error_type}
Function: ${function_name || 'N/A'}
Time: ${new Date().toISOString()}

Error Message:
${error_message}

Metadata:
${JSON.stringify(metadata, null, 2)}

---
This is an automated alert from Afrinnect monitoring system.
Check the Admin Dashboard > Error Logs for more details.
        `
      });
    }

    // Create admin notifications (with error handling for RLS)
    try {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        const adminProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: admin.id });
        if (adminProfiles.length > 0) {
          try {
            await base44.asServiceRole.entities.Notification.create({
              user_profile_id: adminProfiles[0].id,
              user_id: admin.id,
              type: 'admin_message',
              title: `⚠️ System Alert: ${error_type}`,
              message: error_message.substring(0, 100),
              link_to: 'AdminDashboard',
              is_admin: true
            });
          } catch (notifErr) {
            console.log('Notification creation skipped due to RLS:', notifErr.message);
          }
        }
      }
    } catch (adminErr) {
      console.log('Admin lookup skipped:', adminErr.message);
    }

    return Response.json({ success: true, logged: true, alerted: severity === 'critical' || severity === 'high' });
  } catch (error) {
    console.error('Alert system error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});