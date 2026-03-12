import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Scheduled task to auto-approve commissions past hold period
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Verify admin for manual calls
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date();

    // Find all pending commissions past hold period
    const pendingCommissions = await base44.asServiceRole.entities.AmbassadorCommission.filter({
      status: 'pending',
      hold_until: { $lte: now.toISOString() }
    });

    let approvedCount = 0;
    let skippedCount = 0;

    for (const commission of pendingCommissions) {
      // Check if referral is suspicious
      if (commission.referral_id) {
        const referrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({ 
          id: commission.referral_id 
        });
        
        if (referrals.length > 0 && referrals[0].is_suspicious) {
          skippedCount++;
          continue;
        }
      }

      // Approve the commission
      await base44.asServiceRole.entities.AmbassadorCommission.update(commission.id, {
        status: 'approved',
        approved_at: now.toISOString()
      });

      // Update ambassador stats
      const ambassadors = await base44.asServiceRole.entities.Ambassador.filter({ 
        id: commission.ambassador_id 
      });
      
      if (ambassadors.length > 0) {
        const ambassador = ambassadors[0];
        await base44.asServiceRole.entities.Ambassador.update(ambassador.id, {
          stats: {
            ...ambassador.stats,
            total_commissions_earned: (ambassador.stats?.total_commissions_earned || 0) + commission.amount
          }
        });
      }

      approvedCount++;
    }

    console.log(`Auto-approved ${approvedCount} commissions, skipped ${skippedCount} suspicious`);

    return Response.json({ 
      success: true, 
      approved: approvedCount, 
      skipped: skippedCount,
      total_processed: pendingCommissions.length
    });

  } catch (error) {
    console.error('Commission approval error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});