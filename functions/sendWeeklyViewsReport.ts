import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Weekly "Who Viewed Me" report - sends email teaser to free users, full report to premium
// Run via scheduled automation every Sunday
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }
        
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // Get all active users
        const activeUsers = await base44.asServiceRole.entities.UserProfile.filter({
            is_active: true,
            is_banned: false,
            is_suspended: false,
            last_active: { $gt: oneWeekAgo }
        });
        
        let sentCount = 0;
        
        for (const profile of activeUsers) {
            // Get views for this user in the past week
            const views = await base44.asServiceRole.entities.ProfileView.filter({
                viewed_profile_id: profile.id,
                created_date: { $gt: oneWeekAgo }
            });
            
            // Get likes for this user in the past week
            const likes = await base44.asServiceRole.entities.Like.filter({
                liked_id: profile.id,
                created_date: { $gt: oneWeekAgo }
            });
            
            if (views.length === 0 && likes.length === 0) continue;
            
            const isPremium = profile.subscription_tier === 'premium' || 
                             profile.subscription_tier === 'elite' || 
                             profile.subscription_tier === 'vip' ||
                             profile.is_premium;
            
            // Get viewer profiles (limit for free users)
            const uniqueViewerIds = [...new Set(views.map(v => v.viewer_profile_id))];
            const viewerLimit = isPremium ? 20 : 3;
            const viewerProfiles = await Promise.all(
                uniqueViewerIds.slice(0, viewerLimit).map(async (id) => {
                    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ id });
                    return profiles[0];
                })
            );
            
            // Build email content
            let emailBody = `
                <h2 style="color: #7c3aed;">Your Weekly Activity Report 📊</h2>
                <p>Hi ${profile.display_name},</p>
                <p>Here's what happened on your profile this week:</p>
                
                <div style="background: #f3f4f6; padding: 16px; border-radius: 12px; margin: 20px 0;">
                    <p style="font-size: 24px; font-weight: bold; color: #7c3aed; margin: 0;">
                        👁️ ${views.length} profile views
                    </p>
                    <p style="font-size: 24px; font-weight: bold; color: #ec4899; margin: 8px 0 0 0;">
                        ❤️ ${likes.length} likes received
                    </p>
                </div>
            `;
            
            if (isPremium) {
                // Full report for premium users
                emailBody += `<h3>People who viewed your profile:</h3><ul>`;
                for (const viewer of viewerProfiles.filter(Boolean)) {
                    emailBody += `<li><strong>${viewer.display_name}</strong> from ${viewer.current_city || viewer.current_country || 'Unknown'}</li>`;
                }
                emailBody += `</ul>`;
                
                if (uniqueViewerIds.length > viewerLimit) {
                    emailBody += `<p>...and ${uniqueViewerIds.length - viewerLimit} more viewers!</p>`;
                }
            } else {
                // Teaser for free users
                emailBody += `
                    <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                        <p style="font-size: 18px; font-weight: bold; color: #92400e;">🔒 ${uniqueViewerIds.length} people viewed your profile</p>
                        <p style="color: #78350f;">Upgrade to Premium to see who they are!</p>
                        <a href="https://afrinnect.com/PricingPlans" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 12px;">
                            👑 Upgrade Now
                        </a>
                    </div>
                `;
            }
            
            emailBody += `
                <p>Keep your profile active to get more views!</p>
                <p>— The Afrinnect Team</p>
            `;
            
            // Send email
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: profile.created_by,
                    subject: `📊 Your Weekly Report: ${views.length} views, ${likes.length} likes`,
                    body: emailBody
                });
                sentCount++;
            } catch (e) {
                console.error(`Failed to send email to ${profile.created_by}:`, e);
            }
            
            // Also create in-app notification
            await base44.asServiceRole.entities.Notification.create({
                user_profile_id: profile.id,
                user_id: profile.user_id,
                type: 'admin_message',
                title: '📊 Your Weekly Report',
                message: `${views.length} people viewed your profile and ${likes.length} people liked you this week!`,
                link_to: 'WhoLikesYou'
            });
        }
        
        return Response.json({
            success: true,
            usersProcessed: activeUsers.length,
            emailsSent: sentCount
        });
        
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});