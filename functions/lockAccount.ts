import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Admin Only
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        const { target_user_id, reason } = await req.json();
        
        if (!target_user_id || !reason) {
            return Response.json({ error: 'Missing parameters' }, { status: 400 });
        }
        
        // 1. Get Profile
        const profiles = await base44.entities.UserProfile.filter({ user_id: target_user_id });
        if (!profiles.length) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }
        const profile = profiles[0];
        
        // 2. "Lock" the account
        // We simulate a lock by invalidating sessions (if we could) and banning
        // Since we can't invalidate Base44 managed sessions directly, we set a flag 
        // that frontend/middleware checks to force logout.
        
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            is_suspended: true,
            suspension_reason: `Account Locked: ${reason} (Contact Support to unlock)`,
            suspension_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year essentially
        });
        
        // 3. Log it
        await base44.asServiceRole.entities.AdminAuditLog.create({
            admin_user_id: user.id,
            admin_email: user.email,
            action_type: 'account_locked',
            target_user_id: target_user_id,
            details: { reason }
        });
        
        // 4. Send Email to User (Security Alert)
        try {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: profile.created_by,
                subject: 'Security Alert: Account Locked',
                body: `Your account has been locked due to suspicious activity: ${reason}. Please contact support immediately if you believe this is an error.`
            });
        } catch(e) {
            console.error("Failed to send lock email", e);
        }

        return Response.json({ success: true, message: 'Account locked successfully' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});