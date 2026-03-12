import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email } = await req.json();
        const targetEmail = email || user.email; // Use user's email if not provided

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Expiry (10 mins)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Store in VerificationRequest entity
        // First invalidate previous requests
        const existing = await base44.entities.VerificationRequest.filter({ 
            user_id: user.id, 
            type: 'email',
            status: 'pending' 
        });
        
        for (const req of existing) {
            await base44.entities.VerificationRequest.update(req.id, { status: 'expired' });
        }

        await base44.entities.VerificationRequest.create({
            user_id: user.id,
            identifier: targetEmail,
            type: 'email',
            code: code,
            expires_at: expiresAt,
            status: 'pending'
        });

        // Send Email
        await base44.integrations.Core.SendEmail({
            to: targetEmail,
            subject: 'Afrinnect Verification Code',
            body: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`
        });

        return Response.json({ success: true, message: 'Code sent' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});