import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Rate limiting check could go here
    // For now, we trust the client (authenticated or not)

    // Sanitize and validate
    const errorData = {
      message: (body.message || 'Unknown error').substring(0, 1000),
      stack: (body.stack || '').substring(0, 5000),
      component_stack: (body.componentStack || '').substring(0, 5000),
      type: body.type || 'error',
      url: (body.url || '').substring(0, 500),
      user_id: body.userId,
      user_email: body.userEmail,
      browser: (body.browser || 'unknown').substring(0, 100),
      os: (body.os || 'unknown').substring(0, 100),
      device: (body.device || 'unknown').substring(0, 100),
      breadcrumbs: Array.isArray(body.breadcrumbs) ? body.breadcrumbs.slice(-20) : [], // Keep last 20 actions
      severity: body.severity || 'medium',
      status: 'new'
    };

    // Use service role to ensure we can write to ErrorLog even if user permissions are restricted
    await base44.asServiceRole.entities.ErrorLog.create(errorData);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to log client error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});