import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function can be called by automation system or admin manually
    // Check if called by admin (optional - automation system doesn't pass auth)
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin' && user.email !== 'pivotngoyb@gmail.com') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (e) {
      // Called by automation system without user context - allowed
    }
    
    // Get all active matches
    const activeMatches = await base44.asServiceRole.entities.Match.filter({
      status: 'active',
      is_match: true
    });

    const alerts = [];
    const lookbackDays = 7; // Analyze last 7 days
    const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    for (const match of activeMatches) {
      // Get messages from this match in the last week
      const messages = await base44.asServiceRole.entities.Message.filter({
        match_id: match.id,
        created_date: { $gte: cutoffDate }
      }, 'created_date');

      if (messages.length < 5) continue; // Need at least 5 messages to analyze patterns

      // Group messages by sender
      const user1Messages = messages.filter(m => m.sender_id === match.user1_id).map(m => m.content).join('\n');
      const user2Messages = messages.filter(m => m.sender_id === match.user2_id).map(m => m.content).join('\n');

      // AI pattern analysis
      const patternAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this conversation for concerning patterns:

User A messages:
${user1Messages}

User B messages:
${user2Messages}

Detect:
1. Escalating aggressive language or threats
2. Manipulation or grooming behavior
3. Persistent boundary violations after rejection
4. Financial scam patterns
5. Requests for personal info (phone, address, social media)
6. Obsessive or stalking behavior
7. Coercion or pressure tactics

Rate severity 0-10 and provide specific evidence.`,
        response_json_schema: {
          type: "object",
          properties: {
            severity: { type: "number" },
            patterns_detected: { type: "array", items: { type: "string" } },
            concerning_user: { type: "string" },
            evidence: { type: "string" },
            recommended_action: { type: "string" }
          }
        }
      });

      // Create alerts for concerning patterns
      if (patternAnalysis.severity >= 6) {
        const concerningUserId = patternAnalysis.concerning_user === 'User A' ? match.user1_id : match.user2_id;
        const victimUserId = patternAnalysis.concerning_user === 'User A' ? match.user2_id : match.user1_id;

        // Get profiles
        const [concerningProfile] = await base44.asServiceRole.entities.UserProfile.filter({ id: concerningUserId });
        const [victimProfile] = await base44.asServiceRole.entities.UserProfile.filter({ id: victimUserId });

        // Create moderation action
        await base44.asServiceRole.entities.ModerationAction.create({
          user_profile_id: concerningUserId,
          action_type: 'pattern_detected',
          reason: `AI detected concerning patterns: ${patternAnalysis.patterns_detected.join(', ')}`,
          severity: patternAnalysis.severity >= 8 ? 'high' : 'medium',
          action_taken: 'pending',
          details: {
            matchId: match.id,
            evidence: patternAnalysis.evidence,
            recommended_action: patternAnalysis.recommended_action,
            patterns: patternAnalysis.patterns_detected
          }
        });

        // For high severity (8+), take immediate action
        if (patternAnalysis.severity >= 8) {
          // Send warning to concerning user
          await base44.asServiceRole.entities.Notification.create({
            user_profile_id: concerningUserId,
            type: 'admin_message',
            title: '⚠️ Community Guidelines Warning',
            message: 'Our AI detected potential violations of community guidelines in your recent conversations. Please review our terms. Continued violations may result in account suspension.',
            is_admin: true
          });

          // Alert victim with safety resources
          await base44.asServiceRole.entities.Notification.create({
            user_profile_id: victimUserId,
            type: 'admin_message',
            title: '🛡️ Safety Notice',
            message: 'If you feel unsafe in any conversation, please report it immediately. You can also block users and set up safety check-ins for meetups.',
            is_admin: true
          });

          // Notify admins
          await base44.asServiceRole.entities.Notification.create({
            user_profile_id: 'admin',
            type: 'admin_message',
            title: '🚨 High Severity Pattern Detected',
            message: `User ${concerningProfile?.display_name} (${concerningUserId}) - Severity: ${patternAnalysis.severity}/10 - Patterns: ${patternAnalysis.patterns_detected.join(', ')}`,
            is_admin: true
          });

          // Create report automatically
          await base44.asServiceRole.entities.Report.create({
            reporter_id: 'system',
            reported_id: concerningUserId,
            report_type: 'harassment',
            description: `AI-detected pattern: ${patternAnalysis.evidence}`,
            status: 'pending'
          });
        }

        alerts.push({
          matchId: match.id,
          severity: patternAnalysis.severity,
          concerningUser: concerningUserId,
          patterns: patternAnalysis.patterns_detected,
          action: patternAnalysis.severity >= 8 ? 'immediate_warning' : 'flagged_for_review'
        });
      }
    }

    return Response.json({
      success: true,
      analyzed: activeMatches.length,
      alerts_created: alerts.length,
      alerts
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});