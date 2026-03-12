import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }
        
        // Calculate tomorrow's date range
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startOfDay = new Date(tomorrow.setHours(0,0,0,0)).toISOString();
        const endOfDay = new Date(tomorrow.setHours(23,59,59,999)).toISOString();

        // Find events starting tomorrow
        const events = await base44.asServiceRole.entities.Event.filter({
            start_date: { $gte: startOfDay, $lte: endOfDay }
        });

        let count = 0;

        for (const event of events) {
            if (event.attendees && event.attendees.length > 0) {
                // Send push to all attendees
                for (const userId of event.attendees) {
                    await base44.asServiceRole.functions.invoke('sendPushNotification', {
                        user_profile_id: userId,
                        title: 'Upcoming Event! 📅',
                        body: `Reminder: ${event.title} is tomorrow!`,
                        type: 'event'
                    });
                    count++;
                }
            }
        }

        return Response.json({ reminders_sent: count });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});