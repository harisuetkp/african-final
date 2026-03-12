import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { code, type = 'email' } = await req.json();

        // Find pending request
        const requests = await base44.entities.VerificationRequest.filter({
            user_id: user.id,
            type: type,
            status: 'pending',
            code: code
        });

        const validRequest = requests.find(r => new Date(r.expires_at) > new Date());

        if (!validRequest) {
            return Response.json({ success: false, error: 'Invalid or expired code' });
        }

        // Mark as verified
        await base44.entities.VerificationRequest.update(validRequest.id, { status: 'verified' });

        // Update UserProfile
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
            const profile = profiles[0];
            const updatedStatus = { ...profile.verification_status, [`${type}_verified`]: true };
            
            // Auto-verify badge if both verified?
            // For now just update the specific flag
            await base44.entities.UserProfile.update(profile.id, {
                verification_status: updatedStatus
            });
        }

        return Response.json({ success: true });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});