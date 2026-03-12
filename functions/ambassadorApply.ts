import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { 
      handle, 
      display_name, 
      email, 
      phone, 
      country, 
      bio,
      social_links,
      audience_size,
      how_promote,
      terms_accepted 
    } = await req.json();

    // Validation
    if (!handle || !email || !country) {
      return Response.json({ error: 'Handle, email, and country are required' }, { status: 400 });
    }

    if (!terms_accepted) {
      return Response.json({ error: 'You must accept the terms and conditions' }, { status: 400 });
    }

    // Check handle format
    if (!/^[a-z0-9]+$/.test(handle)) {
      return Response.json({ error: 'Handle can only contain lowercase letters and numbers' }, { status: 400 });
    }

    if (handle.length < 3 || handle.length > 20) {
      return Response.json({ error: 'Handle must be 3-20 characters' }, { status: 400 });
    }

    // Check for existing ambassador
    const existing = await base44.asServiceRole.entities.Ambassador.filter({
      $or: [{ handle: handle.toLowerCase() }, { email }]
    });

    if (existing.length > 0) {
      if (existing[0].email === email) {
        return Response.json({ error: 'You already have an ambassador application' }, { status: 400 });
      }
      return Response.json({ error: 'This handle is already taken' }, { status: 400 });
    }

    // Check that at least one social link is provided
    const hasSocial = social_links && Object.values(social_links).some(v => v && v.trim());
    if (!hasSocial) {
      return Response.json({ error: 'Please provide at least one social media link' }, { status: 400 });
    }

    // Get default commission plan
    const defaultPlan = (await base44.asServiceRole.entities.AmbassadorCommissionPlan.filter({ 
      is_default: true, 
      is_active: true 
    }))[0];

    const referralCode = `AMBA_${handle.toUpperCase()}`;
    const referralLink = `https://afrinnect.com/Onboarding?a=${referralCode}`;

    // Create ambassador record
    const ambassador = await base44.asServiceRole.entities.Ambassador.create({
      user_id: user.id,
      handle: handle.toLowerCase(),
      email,
      display_name: display_name || handle,
      phone,
      country,
      bio,
      social_links,
      referral_code: referralCode,
      referral_link: referralLink,
      commission_plan_id: defaultPlan?.id,
      status: 'pending',
      tier: 'bronze',
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      stats: {
        total_clicks: 0,
        total_signups: 0,
        total_activations: 0,
        total_subscribers: 0,
        total_revenue_generated: 0,
        total_commissions_earned: 0,
        total_commissions_paid: 0
      },
      notes: `Audience: ${audience_size || 'Not specified'}\nPromotion plan: ${how_promote || 'Not specified'}`
    });

    // Send confirmation email to applicant
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: 'Afrinnect Ambassador Application Received',
      body: `
Hi ${display_name || handle},

Thank you for applying to become an Afrinnect Ambassador!

We've received your application and will review it within 24-48 hours. You'll receive an email notification once your application is approved.

Your requested handle: @${handle}
Your referral code (once approved): ${referralCode}

In the meantime, feel free to follow us on social media for updates!

- The Afrinnect Team
      `.trim()
    });

    // Notify admin of new application
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'pivotngoyb@gmail.com',
      subject: `New Ambassador Application: @${handle}`,
      body: `
New ambassador application received:

Handle: @${handle}
Name: ${display_name}
Email: ${email}
Country: ${country}
Audience Size: ${audience_size || 'Not specified'}

Social Links:
- Instagram: ${social_links?.instagram || 'N/A'}
- TikTok: ${social_links?.tiktok || 'N/A'}
- YouTube: ${social_links?.youtube || 'N/A'}
- Twitter: ${social_links?.twitter || 'N/A'}

Bio: ${bio || 'Not provided'}
Promotion Plan: ${how_promote || 'Not provided'}

Review in admin dashboard: https://afrinnect.com/AdminDashboard
      `.trim()
    });

    return Response.json({ 
      success: true, 
      ambassador_id: ambassador.id,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Apply error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});