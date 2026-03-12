import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function can be called by automation system or admin manually
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (e) {
      // Called by automation system without user context - allowed
    }

    // Find inactive users (no activity in 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const inactiveUsers = await base44.asServiceRole.entities.UserProfile.filter({
      last_active: { $lt: sevenDaysAgo },
      is_active: true,
      subscription_tier: 'free'
    });

    const results = [];

    for (const profile of inactiveUsers) {
      // Check if we already sent a winback email recently
      const recentlySent = await base44.asServiceRole.entities.Notification.filter({
        user_profile_id: profile.id,
        type: 'admin_message',
        title: { $regex: 'Come Back' },
        created_date: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() }
      });

      if (recentlySent.length > 0) continue;

      // Get user email
      const users = await base44.asServiceRole.entities.User.filter({ id: profile.user_id });
      if (users.length === 0) continue;

      const userEmail = users[0].email;

      // Check for pending likes
      const pendingLikes = await base44.asServiceRole.entities.Like.filter({
        liked_id: profile.id,
        is_seen: false
      });

      let emailSubject = "We miss you at Afrinnect! 💜";
      let emailBody = `Hi ${profile.display_name},\n\nWe noticed you haven't been active lately. `;

      if (pendingLikes.length > 0) {
        emailSubject = `${pendingLikes.length} people like you! 💕`;
        emailBody += `Great news - ${pendingLikes.length} ${pendingLikes.length === 1 ? 'person has' : 'people have'} liked your profile!\n\nCome back and see who's interested in connecting with you.`;
      } else {
        emailBody += `Your perfect match might be waiting for you!\n\nCome back and continue your journey to find meaningful connections.`;
      }

      emailBody += `\n\nClick here to log back in: ${Deno.env.get('APP_URL') || 'https://afrinnect.com'}\n\nWith love,\nThe Afrinnect Team`;

      // Send email
      await base44.integrations.Core.SendEmail({
        to: userEmail,
        subject: emailSubject,
        body: emailBody
      });

      // Create notification
      await base44.asServiceRole.entities.Notification.create({
        user_profile_id: profile.id,
        type: 'admin_message',
        title: 'Come Back to Afrinnect!',
        message: pendingLikes.length > 0 
          ? `${pendingLikes.length} people like you! Come back and connect.`
          : 'Your perfect match might be waiting!',
        is_admin: true
      });

      results.push({
        profileId: profile.id,
        email: userEmail,
        pendingLikes: pendingLikes.length
      });
    }

    return Response.json({
      success: true,
      emailsSent: results.length,
      results
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});