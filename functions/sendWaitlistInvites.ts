import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Admin check
        const isSuperAdmin = user?.email === 'pivotngoyb@gmail.com' || user?.role === 'admin';
        if (!isSuperAdmin) {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { subject, body } = await req.json();

        if (!subject || !body) {
            return Response.json({ error: 'Subject and body are required' }, { status: 400 });
        }

        // Get all pending and invited waitlist entries
        // LIMITATION: Fetching max 1000 for now. For larger lists, pagination would be needed.
        const pendingEntries = await base44.entities.WaitlistEntry.filter({ status: 'pending' }, '-created_date', 1000);
        const invitedEntries = await base44.entities.WaitlistEntry.filter({ status: 'invited' }, '-created_date', 1000);

        // Combine and deduplicate by email
        const allEntries = [...pendingEntries];
        const seenEmails = new Set(pendingEntries.map(e => e.email));

        for (const entry of invitedEntries) {
            if (!seenEmails.has(entry.email)) {
                allEntries.push(entry);
                seenEmails.add(entry.email);
            }
        }

        let sentCount = 0;
        // Use allEntries instead of entries
        const entries = allEntries;
        const errors = [];

        for (const entry of entries) {
            try {
                // Personalize body
                const personalizedBody = body.replace('{{name}}', entry.full_name || 'Friend');

                await base44.integrations.Core.SendEmail({
                    to: entry.email,
                    subject: subject,
                    body: personalizedBody,
                    from_name: "Afrinnect Team"
                });

                // Update status
                await base44.entities.WaitlistEntry.update(entry.id, { status: 'invited' });
                sentCount++;
            } catch (err) {
                console.error(`Failed to send email to ${entry.email}:`, err);
                errors.push({ email: entry.email, error: err.message });
            }
        }

        return Response.json({ 
            success: true, 
            sent: sentCount, 
            total: entries.length,
            errors: errors 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});