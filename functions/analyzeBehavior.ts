import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user profile
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (!profiles.length) return Response.json({ success: false });
        const profile = profiles[0];

        // 1. Gather User Activity Data
        const [views, likes, matches, messages] = await Promise.all([
            base44.entities.ProfileView.count({ viewer_profile_id: profile.id }),
            base44.entities.Like.count({ liker_id: profile.id }),
            base44.entities.Match.count({ user1_id: profile.id }), // Approximation, need OR usually but simple count helps
            base44.entities.Message.count({ sender_id: profile.id })
        ]);

        // 2. Analyze via AI
        const prompt = `
        User Stats for ${profile.display_name}:
        - Views sent: ${views}
        - Likes sent: ${likes}
        - Matches: ${matches}
        - Messages sent: ${messages}
        - Account Age: ${Math.floor((new Date() - new Date(profile.created_date)) / (1000 * 60 * 60 * 24))} days
        - Bio length: ${profile.bio?.length || 0} chars
        - Photos: ${profile.photos?.length || 0}
        - Verified: ${profile.verification_status?.photo_verified}
        
        Task: Generate 3 personalized recommendations to improve their success or safety.
        Types: 'feature' (app feature to use), 'event' (suggest attending events), 'match_tip' (dating advice), 'safety_alert' (if behavior looks risky, unlikely here but possible).
        
        Return JSON: { 
            "recommendations": [
                { "type": "string", "title": "string", "description": "string", "action_link": "string (PageName)" }
            ] 
        }
        `;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    recommendations: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: { type: "string" },
                                title: { type: "string" },
                                description: { type: "string" },
                                action_link: { type: "string" }
                            }
                        }
                    }
                }
            }
        });

        // 3. Save Recommendations
        if (result.recommendations) {
            // Clear old ones
            const oldRecs = await base44.entities.UserRecommendation.filter({ user_id: user.id });
            for (const r of oldRecs) {
                await base44.entities.UserRecommendation.delete(r.id);
            }

            // Add new ones
            for (const rec of result.recommendations) {
                await base44.entities.UserRecommendation.create({
                    user_id: user.id,
                    type: rec.type,
                    title: rec.title,
                    description: rec.description,
                    action_link: rec.action_link,
                    is_dismissed: false
                });

                // If AI detects a safety threat, auto-report to Admin
                if (rec.type === 'safety_alert') {
                     try {
                         await base44.entities.Report.create({
                            reporter_id: user.id, // Self-report / System report
                            reported_id: user.id, // Flagging the user themselves for review
                            report_type: 'other',
                            description: `[AI BEHAVIOR ALERT] User flagged for risky behavior patterns. Title: ${rec.title}. Desc: ${rec.description}`,
                            status: 'pending',
                            action_taken: 'none',
                            evidence_urls: []
                         });
                     } catch(e) { console.error("Auto-report failed", e); }
                }
            }
        }

        return Response.json({ success: true, recommendations: result.recommendations });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});