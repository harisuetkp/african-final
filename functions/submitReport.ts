import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reported_id, report_type, description } = await req.json();

    if (!reported_id || !report_type) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get Reporter Profile
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (profiles.length === 0) return Response.json({ error: 'Profile not found' }, { status: 404 });
    const reporter = profiles[0];

    // 2. Check Rate Limit (Prevent spam)
    // Max 5 reports per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentReports = await base44.entities.Report.filter({
        reporter_id: reporter.id,
        created_date: { $gte: oneHourAgo }
    });

    if (recentReports.length >= 5) {
        return Response.json({ error: 'You have submitted too many reports recently. Please try again later.' }, { status: 429 });
    }

    // 3. AI Triage & Severity Analysis
    let severity = 'low';
    let autoAction = 'none';
    let moderatorNotes = '';

    try {
        const triage = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this user report for severity.
            Type: ${report_type}
            Description: "${description}"
            
            Determine severity (low, medium, high, critical) based on potential harm.
            Critical = Immediate danger, illegal activity, severe hate speech.
            
            Return JSON: {"severity": "string", "recommended_action": "string"}`,
            response_json_schema: {
                type: "object",
                properties: {
                    severity: { type: "string" },
                    recommended_action: { type: "string" }
                }
            }
        });
        severity = triage.severity;
        moderatorNotes = `AI Triage: ${severity.toUpperCase()} - ${triage.recommended_action}`;
        
        // Critical reports trigger immediate notification
        if (severity === 'critical' || severity === 'high') {
             await base44.integrations.Core.SendEmail({
                to: 'support@afrinnect.com',
                subject: `🚨 URGENT REPORT: ${report_type.toUpperCase()}`,
                body: `High severity report received.\nReporter: ${reporter.email}\nTarget ID: ${reported_id}\nReason: ${description}\nAI Severity: ${severity}`
            });
        }
    } catch (e) {
        console.error("AI Triage failed", e);
    }

    // 4. Create Report
    await base44.asServiceRole.entities.Report.create({
        reporter_id: reporter.id,
        reported_id,
        report_type,
        description: description || '',
        status: 'pending', 
        action_taken: autoAction,
        moderator_notes: moderatorNotes
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Submit Report Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});