import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Check if user is banned or if their deleted account was banned
Deno.serve(async (req) => {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ banned: false });
    }

    const base44 = createClientFromRequest(req);
    
    try {
      // Check if there's a deleted account with this email that was banned
      const deletedAccounts = await base44.asServiceRole.entities.DeletedAccount.filter({ 
        user_email: email 
      });
      
      // If they have any deleted account marked as banned, prevent login
      const wasBanned = deletedAccounts.some(acc => 
        acc.deletion_reason?.includes('banned') || 
        acc.deletion_reason?.includes('cannot return')
      );
      
      if (wasBanned) {
        return Response.json({ 
          banned: true,
          reason: 'Your account was previously banned and you cannot create a new account.'
        });
      }
      
      // Also check if they have an existing active profile that's banned
      const existingProfiles = await base44.asServiceRole.entities.UserProfile.filter({ 
        created_by: email 
      });
      
      const hasActiveBan = existingProfiles.some(p => 
        p.is_banned || 
        (p.is_suspended && new Date(p.suspension_expires_at) > new Date())
      );
      
      if (hasActiveBan) {
        return Response.json({ 
          banned: true,
          reason: 'Your account is currently banned or suspended.'
        });
      }
    } catch (e) {
      console.log('Ban check query failed, allowing login:', e.message);
    }

    return Response.json({ banned: false });
  } catch (error) {
    console.error('Check banned user error:', error);
    // On error, allow login to avoid blocking legitimate users
    return Response.json({ banned: false });
  }
});