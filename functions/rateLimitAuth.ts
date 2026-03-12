import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Rate limiters for different auth actions
const loginAttempts = new Map();
const signupAttempts = new Map();
const violationLog = new Map(); // Track violations for AI analysis

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  const hourAgo = now - 3600000;
  
  for (const [key, attempts] of loginAttempts.entries()) {
    loginAttempts.set(key, attempts.filter(time => time > hourAgo));
    if (loginAttempts.get(key).length === 0) {
      loginAttempts.delete(key);
    }
  }
  
  for (const [key, attempts] of signupAttempts.entries()) {
    signupAttempts.set(key, attempts.filter(time => time > hourAgo));
    if (signupAttempts.get(key).length === 0) {
      signupAttempts.delete(key);
    }
  }
}, 600000);

Deno.serve(async (req) => {
  try {
    const { action, identifier, user_email } = await req.json();
    
    if (!action || !identifier) {
      return Response.json({ error: 'Action and identifier required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const now = Date.now();
    const hourAgo = now - 3600000;

    if (action === 'login') {
      // Max 5 login attempts per email per hour
      const attempts = loginAttempts.get(identifier) || [];
      const recentAttempts = attempts.filter(time => time > hourAgo);
      
      if (recentAttempts.length >= 5) {
        // Log violation to database
        try {
          await base44.asServiceRole.entities.AdminAuditLog.create({
            admin_user_id: 'system',
            admin_email: 'system@afrinnect.com',
            action_type: 'rate_limit_exceeded',
            target_user_id: identifier,
            details: { 
              type: 'login',
              attempts: recentAttempts.length,
              email: user_email || identifier,
              timestamp: new Date().toISOString()
            }
          });

          // Track violations for AI analysis
          const violations = violationLog.get(identifier) || [];
          violations.push({ type: 'login', time: now });
          violationLog.set(identifier, violations);
        } catch (e) {
          console.error('Failed to log violation:', e);
        }

        return Response.json({ 
          allowed: false,
          error: 'Too many login attempts. Please wait 1 hour or reset your password.',
          retry_after: 3600
        }, { status: 429 });
      }
      
      loginAttempts.set(identifier, [...recentAttempts, now]);
      return Response.json({ allowed: true });
    }

    if (action === 'signup') {
      // Max 3 signups per IP per hour
      const attempts = signupAttempts.get(identifier) || [];
      const recentAttempts = attempts.filter(time => time > hourAgo);
      
      if (recentAttempts.length >= 3) {
        // Log violation to database
        try {
          await base44.asServiceRole.entities.AdminAuditLog.create({
            admin_user_id: 'system',
            admin_email: 'system@afrinnect.com',
            action_type: 'rate_limit_exceeded',
            target_user_id: identifier,
            details: { 
              type: 'signup',
              attempts: recentAttempts.length,
              ip: identifier,
              timestamp: new Date().toISOString()
            }
          });

          // Track violations for AI analysis
          const violations = violationLog.get(identifier) || [];
          violations.push({ type: 'signup', time: now });
          violationLog.set(identifier, violations);
        } catch (e) {
          console.error('Failed to log violation:', e);
        }

        return Response.json({ 
          allowed: false,
          error: 'Too many signup attempts. Please wait 1 hour.',
          retry_after: 3600
        }, { status: 429 });
      }
      
      signupAttempts.set(identifier, [...recentAttempts, now]);
      return Response.json({ allowed: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Rate limit error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});