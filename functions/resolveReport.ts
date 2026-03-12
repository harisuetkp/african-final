import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        // Admin check
        if (!user || (user.role !== 'admin' && user.email !== 'pivotngoyb@gmail.com')) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { reportId, action, notes } = await req.json();

        // 1. Get the report to find the reporter
        const reports = await base44.entities.Report.filter({ id: reportId });
        if (!reports.length) return Response.json({ error: 'Report not found' }, { status: 404 });
        
        const report = reports[0];

        // 2. Update Report Status
        await base44.entities.Report.update(reportId, {
            status: 'resolved',
            action_taken: action,
            moderator_notes: notes || '',
            resolved_by: user.email,
            resolved_at: new Date().toISOString()
        });

        // 3. Notify the Reporter (Feedback Loop)
        // We don't reveal exact details for privacy, but confirm action was taken
        if (report.reporter_id) {
            const actionText = action === 'none' 
                ? 'We reviewed your report and found no violation at this time, but we will keep an eye on it.' 
                : 'Thanks to your report, we have taken action against the user violating our guidelines.';

            await base44.entities.Notification.create({
                user_profile_id: report.reporter_id,
                type: 'admin_message',
                title: 'Update on your Report 🛡️',
                message: actionText,
                is_admin: true,
                link_to: createPageUrl('Support')
            });

            // Optional: Push Notification
            try {
                await base44.functions.invoke('sendPushNotification', {
                    user_profile_id: report.reporter_id,
                    title: 'Report Status Update',
                    body: actionText,
                    type: 'admin_message'
                });
            } catch (e) {
                console.error('Failed to send push to reporter', e);
            }
        }

        return Response.json({ success: true });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});