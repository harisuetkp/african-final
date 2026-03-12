import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active users
    const users = await base44.asServiceRole.entities.UserProfile.filter({
      is_active: true,
      is_banned: false
    });

    let emailsSent = 0;
    const errors = [];

    for (const user of users) {
      try {
        // Get user's activity for the week
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        const [likes, views, matches] = await Promise.all([
          base44.asServiceRole.entities.Like.filter({
            liked_id: user.id,
            created_date: { $gte: weekAgo }
          }),
          base44.asServiceRole.entities.ProfileView.filter({
            viewed_profile_id: user.id,
            created_date: { $gte: weekAgo }
          }),
          base44.asServiceRole.entities.Match.filter({
            $or: [
              { user1_id: user.id, matched_at: { $gte: weekAgo } },
              { user2_id: user.id, matched_at: { $gte: weekAgo } }
            ],
            is_match: true
          })
        ]);

        // Only send if there's activity
        if (likes.length === 0 && views.length === 0 && matches.length === 0) {
          continue;
        }

        const isPremium = ['premium', 'elite', 'vip'].includes(user.subscription_tier);

        // Build email content
        let emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7c3aed; text-align: center;">Your Weekly Activity on Afrinnect 💕</h1>
            
            <div style="background: linear-gradient(to right, #f3e8ff, #fdf2f8); border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h2 style="margin-bottom: 15px;">This week you got:</h2>
              
              <div style="display: flex; justify-content: space-around; text-align: center;">
                <div>
                  <p style="font-size: 32px; font-weight: bold; color: #ec4899; margin: 0;">${likes.length}</p>
                  <p style="color: #6b7280; margin: 5px 0;">New Likes</p>
                </div>
                <div>
                  <p style="font-size: 32px; font-weight: bold; color: #7c3aed; margin: 0;">${views.length}</p>
                  <p style="color: #6b7280; margin: 5px 0;">Profile Views</p>
                </div>
                <div>
                  <p style="font-size: 32px; font-weight: bold; color: #10b981; margin: 0;">${matches.length}</p>
                  <p style="color: #6b7280; margin: 5px 0;">New Matches</p>
                </div>
              </div>
            </div>
        `;

        // Add FOMO for non-premium users
        if (!isPremium && likes.length > 0) {
          emailBody += `
            <div style="background: linear-gradient(to right, #fef3c7, #fde68a); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="font-size: 18px; font-weight: bold; color: #92400e; margin: 0;">
                🔒 ${likes.length} people liked you this week!
              </p>
              <p style="color: #78350f; margin: 10px 0;">
                Upgrade to Premium to see who they are and match instantly!
              </p>
              <a href="https://afrinnect.com/pricing" style="display: inline-block; background: linear-gradient(to right, #f59e0b, #d97706); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">
                Unlock Now →
              </a>
            </div>
          `;
        }

        emailBody += `
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://afrinnect.com" style="display: inline-block; background: linear-gradient(to right, #7c3aed, #ec4899); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Open Afrinnect
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
              You're receiving this because you're a member of Afrinnect. 
              <a href="https://afrinnect.com/settings" style="color: #7c3aed;">Manage preferences</a>
            </p>
          </div>
        `;

        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.created_by, // User's email
          subject: `💕 ${likes.length} people liked you this week on Afrinnect!`,
          body: emailBody
        });

        emailsSent++;
      } catch (e) {
        errors.push({ userId: user.id, error: e.message });
      }
    }

    return Response.json({
      success: true,
      emailsSent,
      totalUsers: users.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});