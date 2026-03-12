import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// SECURITY: Admin can ONLY see that check exists, NOT results
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { profile_id } = await req.json();

    if (!profile_id) {
      return Response.json({ error: 'Missing profile_id' }, { status: 400 });
    }

    // Fetch background check records
    const checks = await base44.asServiceRole.entities.BackgroundCheck.filter({
      user_profile_id: profile_id
    }, '-created_date');

    // PRIVACY: Return only metadata, NOT actual results
    const sanitized = checks.map(check => ({
      id: check.id,
      status: check.status,
      check_type: check.check_type,
      requested_at: check.created_date,
      completed_at: check.completed_at,
      // EXCLUDE: criminal_record, sex_offender_status, employment_history, etc.
      // Only show: "passed" / "failed" / "pending"
      result_summary: check.status === 'completed' ? (check.passed ? 'Passed' : 'Failed') : null
    }));

    return Response.json({ checks: sanitized });

  } catch (error) {
    console.error('Admin background check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});