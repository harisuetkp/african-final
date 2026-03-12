import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Call this function:
// - Every hour for event reminders
// - Once daily for subscription checks
// Pass ?task=hourly or ?task=daily in URL

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // SECURITY: Admin-only endpoint - verify authentication
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const url = new URL(req.url);
    const task = url.searchParams.get('task') || 'hourly';

    const results = {};

    // Hourly tasks: Event reminders
    if (task === 'hourly' || task === 'all') {
      const reminderResult = await base44.asServiceRole.functions.invoke('sendEventReminders', {});
      results.eventReminders = reminderResult.data;
    }

    // Daily tasks: Subscription expiry & match nudges
    if (task === 'daily' || task === 'all') {
      const expiryResult = await base44.asServiceRole.functions.invoke('checkExpiredSubscriptions', {});
      results.subscriptionCheck = expiryResult.data;

      // Send engagement nudges for inactive matches
      const nudgeResult = await base44.asServiceRole.functions.invoke('sendMatchNudges', {});
      results.matchNudges = nudgeResult.data;
    }

    return Response.json({
      success: true,
      task,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});