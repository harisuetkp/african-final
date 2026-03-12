import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { campaign_title, subject, body, target_audience } = await req.json();

    if (!subject || !body) {
      return Response.json({ error: 'Subject and body required' }, { status: 400 });
    }

    // Get target users based on audience
    let profiles = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    switch (target_audience) {
      case 'all':
        profiles = await base44.asServiceRole.entities.UserProfile.filter({ is_active: true });
        break;
      case 'premium':
        profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
          subscription_tier: { $in: ['premium', 'elite', 'vip'] }
        });
        break;
      case 'free':
        profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
          $or: [
            { subscription_tier: 'free' }, 
            { subscription_tier: null },
            { subscription_tier: { $exists: false } }
          ],
          is_active: true
        });
        break;
      case 'inactive':
        profiles = await base44.asServiceRole.entities.UserProfile.filter({
          last_active: { $lt: sevenDaysAgo },
          is_active: true
        });
        break;
      case 'founding_members':
        profiles = await base44.asServiceRole.entities.UserProfile.filter({
          is_founding_member: true,
          is_active: true
        });
        break;
      case 'new_users':
        profiles = await base44.asServiceRole.entities.UserProfile.filter({
          created_date: { $gte: sevenDaysAgo },
          is_active: true
        });
        break;
      default:
        profiles = await base44.asServiceRole.entities.UserProfile.filter({ is_active: true });
    }

    // Get user emails
    const userIds = profiles.map(p => p.user_id);
    let emailsSent = 0;

    for (const profile of profiles) {
      try {
        // Get user email from User entity
        const users = await base44.asServiceRole.entities.User.filter({ id: profile.user_id });
        if (users.length === 0) continue;

        const userEmail = users[0].email;

        // Personalize the body
        const personalizedBody = body
          .replace(/{name}/g, profile.display_name || 'there')
          .replace(/{email}/g, userEmail);

        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'Afrinnect',
          to: userEmail,
          subject: subject.replace(/{name}/g, profile.display_name || 'there'),
          body: `Hi ${profile.display_name || 'there'}!

${personalizedBody}

---

To unsubscribe from marketing emails, visit your settings in the app.

© ${new Date().getFullYear()} Afrinnect. All rights reserved.
Contact: Support@afrinnect.com`
        });

        emailsSent++;
      } catch (e) {
        console.error('Failed to send email to profile', profile.id, e);
      }
    }

    return Response.json({
      success: true,
      campaign: campaign_title,
      targeted: profiles.length,
      sent: emailsSent
    });
  } catch (error) {
    console.error('Newsletter error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});