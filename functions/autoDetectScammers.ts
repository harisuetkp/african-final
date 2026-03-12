import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// AI-powered scammer detection and auto-ban
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function can be called by automation system or admin manually
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin' && user.email !== 'pivotngoyb@gmail.com') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (e) {
      // Called by automation system without user context - allowed
    }

    // Get all rate limit violations from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const violations = await base44.asServiceRole.entities.AdminAuditLog.filter({
      action_type: 'rate_limit_exceeded',
      created_date: { $gte: yesterday }
    });

    // Group violations by target_user_id (email or IP)
    const violationsByUser = violations.reduce((acc, v) => {
      const target = v.target_user_id;
      if (!acc[target]) acc[target] = [];
      acc[target].push(v);
      return acc;
    }, {});

    const suspiciousUsers = [];
    
    // Analyze each user's violation pattern
    for (const [userId, userViolations] of Object.entries(violationsByUser)) {
      // If they have 3+ violations in 24 hours, they're suspicious
      if (userViolations.length >= 3) {
        const email = userViolations[0].details?.email || userId;
        
        // Use AI to analyze the pattern
        const aiAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Analyze this user's behavior and determine if they are a scammer or bot:

User: ${email}
Total violations in 24h: ${userViolations.length}
Violation types: ${userViolations.map(v => v.details?.type).join(', ')}
Timestamps: ${userViolations.map(v => new Date(v.created_date).toLocaleString()).join(', ')}

Based on this pattern:
1. Is this likely a bot/automated attack? (yes/no)
2. Is this likely a scammer trying to create fake accounts? (yes/no)
3. Should we ban this user? (yes/no)
4. Confidence level (0-100)
5. Reasoning (1 sentence)

Respond ONLY in JSON format:
{
  "is_bot": true/false,
  "is_scammer": true/false,
  "should_ban": true/false,
  "confidence": 85,
  "reasoning": "explanation here"
}`,
          response_json_schema: {
            type: "object",
            properties: {
              is_bot: { type: "boolean" },
              is_scammer: { type: "boolean" },
              should_ban: { type: "boolean" },
              confidence: { type: "number" },
              reasoning: { type: "string" }
            }
          }
        });

        const analysis = aiAnalysis;
        
        if (analysis.should_ban && analysis.confidence >= 70) {
          suspiciousUsers.push({
            email,
            violations: userViolations.length,
            analysis,
            userId
          });

          // Find user profiles with this email
          const profiles = await base44.asServiceRole.entities.UserProfile.filter({
            created_by: email
          });

          // Auto-ban if AI is confident (Parallel)
          await Promise.all(profiles.map(profile => 
            base44.asServiceRole.entities.UserProfile.update(profile.id, {
              is_banned: true,
              is_active: false,
              ban_reason: `Auto-banned by AI: ${analysis.reasoning}`
            })
          ));

          // Log the auto-ban
          await base44.asServiceRole.entities.AdminAuditLog.create({
            admin_user_id: 'ai_system',
            admin_email: 'ai@afrinnect.com',
            action_type: 'user_ban',
            target_user_id: email,
            details: {
              reason: 'AI auto-ban',
              violations: userViolations.length,
              ai_analysis: analysis,
              banned_profiles: profiles.map(p => p.id)
            }
          });

          // Create a report for admin review
          if (profiles.length > 0) {
            await base44.asServiceRole.entities.Report.create({
              reporter_id: 'system',
              reported_id: profiles[0].id,
              report_type: 'scam',
              description: `AI detected suspicious behavior: ${analysis.reasoning}. User had ${userViolations.length} rate limit violations in 24h.`,
              status: 'resolved',
              action_taken: 'permanent_ban',
              moderator_notes: `Auto-banned by AI with ${analysis.confidence}% confidence`
            });
          }
        }
      }
    }

    return Response.json({
      success: true,
      analyzed: Object.keys(violationsByUser).length,
      banned: suspiciousUsers.length,
      details: suspiciousUsers
    });
  } catch (error) {
    console.error('Auto-detect scammers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});