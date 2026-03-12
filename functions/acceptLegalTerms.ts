import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    await req.json(); // consume body

    // Check if already accepted
    const existing = await base44.asServiceRole.entities.LegalAcceptance.filter({ user_id: user.id });
    if (existing.length > 0) {
        // Update existing record (re-acceptance)
        await base44.asServiceRole.entities.LegalAcceptance.update(existing[0].id, {
            terms_accepted: true,
            privacy_accepted: true,
            guidelines_accepted: true,
            accepted_at: new Date().toISOString(),
            ip_address: ip
        });
    } else {
        // Create new record
        await base44.asServiceRole.entities.LegalAcceptance.create({
            user_id: user.id,
            terms_accepted: true,
            privacy_accepted: true,
            guidelines_accepted: true,
            accepted_at: new Date().toISOString(),
            ip_address: ip,
            // Add custom fields if entity supports them, otherwise they are ignored (but schema had ip_address)
            // schema: user_id, terms_accepted, privacy_accepted, guidelines_accepted, accepted_at, ip_address
        });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Legal Acceptance Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});