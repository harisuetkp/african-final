import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_email, user_name } = await req.json();

    if (!user_email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Send welcome email
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Afrinnect',
      to: user_email,
      subject: 'Welcome to Afrinnect! 💜',
      body: `
        Hi ${user_name || 'there'}!
        
        Welcome to Afrinnect - where African love stories begin! 🌍❤️
        
        We're excited to have you join our community of amazing singles looking for meaningful connections.
        
        Here's what you can do next:
        1. Complete your profile to get better matches
        2. Upload your best photos
        3. Start swiping and find your perfect match!
        
        Pro tip: Users with complete profiles get 3x more matches! ✨
        
        Need help? Just reply to this email or visit our support page.
        
        Happy matching!
        The Afrinnect Team
        
        ---
        Follow us: Instagram | Twitter | Facebook
      `
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});