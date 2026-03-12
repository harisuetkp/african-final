import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Admin-only function (for scheduled automation)
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all active users
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({
      is_active: true,
      is_banned: false
    }, '-last_active', 500);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let emailsSent = 0;
    const errors = [];

    for (const profile of profiles) {
      try {
        // Get profile analytics for the week
        const [views, likes, matches] = await Promise.all([
          base44.asServiceRole.entities.ProfileView.filter({
            viewed_profile_id: profile.id,
            created_date: { $gte: oneWeekAgo.toISOString() }
          }),
          base44.asServiceRole.entities.Like.filter({
            liked_id: profile.id,
            created_date: { $gte: oneWeekAgo.toISOString() }
          }),
          base44.asServiceRole.entities.Match.filter({
            $or: [
              { user1_id: profile.id },
              { user2_id: profile.id }
            ],
            is_match: true,
            matched_at: { $gte: oneWeekAgo.toISOString() }
          })
        ]);

        const viewCount = views.length;
        const likeCount = likes.length;
        const matchCount = matches.length;

        // Calculate percentile (simplified - compare to average)
        const avgViews = 15;
        const percentile = Math.min(99, Math.round((viewCount / avgViews) * 50));

        // Only send if there's activity to report
        if (viewCount > 0 || likeCount > 0) {
          const isPremium = profile.is_premium || ['premium', 'elite', 'vip'].includes(profile.subscription_tier);
          
          // Build email content
          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f5ff; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .stats { display: flex; justify-content: space-around; padding: 30px 20px; background: #faf8ff; }
    .stat { text-align: center; }
    .stat-number { font-size: 36px; font-weight: bold; color: #8B5CF6; }
    .stat-label { color: #666; font-size: 12px; text-transform: uppercase; }
    .content { padding: 20px 30px; }
    .percentile { background: linear-gradient(135deg, #FCD34D, #F59E0B); color: white; padding: 15px; border-radius: 12px; text-align: center; margin: 20px 0; }
    .cta { display: block; background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; text-decoration: none; padding: 15px 30px; border-radius: 30px; text-align: center; font-weight: bold; margin: 20px auto; }
    .blur-section { position: relative; padding: 20px; background: #f8f5ff; border-radius: 12px; margin: 20px 0; }
    .blur-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; border-radius: 12px; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Your Weekly Popularity Report</h1>
    </div>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-number">${viewCount}</div>
        <div class="stat-label">Profile Views</div>
      </div>
      <div class="stat">
        <div class="stat-number">${likeCount}</div>
        <div class="stat-label">Likes Received</div>
      </div>
      <div class="stat">
        <div class="stat-number">${matchCount}</div>
        <div class="stat-label">New Matches</div>
      </div>
    </div>
    
    <div class="content">
      <div class="percentile">
        🏆 You're in the <strong>Top ${100 - percentile}%</strong> this week!
      </div>
      
      ${!isPremium ? `
      <div class="blur-section">
        <p style="margin:0">👀 <strong>${likeCount} people</strong> are waiting for you...</p>
        <div class="blur-overlay">
          <span style="color:#8B5CF6;font-weight:bold">🔒 Upgrade to see who</span>
        </div>
      </div>
      ` : ''}
      
      <p style="text-align:center;color:#666">
        ${viewCount > avgViews 
          ? "You're getting noticed! Keep the momentum going." 
          : "Boost your profile to get more visibility this week!"}
      </p>
      
      <a href="https://afrinnect.com/Matches" class="cta">
        ${isPremium ? 'See Who Likes You →' : 'Unlock Your Admirers →'}
      </a>
    </div>
    
    <div class="footer">
      You're receiving this because you're a member of Afrinnect.<br>
      <a href="https://afrinnect.com/Settings" style="color:#8B5CF6">Manage notifications</a>
    </div>
  </div>
</body>
</html>
          `;

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: profile.created_by,
            subject: `📊 ${profile.display_name}, you had ${viewCount} profile views this week!`,
            body: emailHtml
          });

          emailsSent++;
        }
      } catch (e) {
        errors.push({ profile_id: profile.id, error: e.message });
      }
    }

    return Response.json({
      success: true,
      emails_sent: emailsSent,
      profiles_processed: profiles.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});