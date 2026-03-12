import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Fraud detection rules
const FRAUD_RULES = {
  // Same IP registering multiple times
  MAX_SIGNUPS_PER_IP_PER_DAY: 3,
  // Same device registering multiple times  
  MAX_SIGNUPS_PER_DEVICE_PER_DAY: 2,
  // Too fast signups from same ambassador
  MIN_MINUTES_BETWEEN_SIGNUPS: 5,
  // Suspicious conversion rate (too high = fake signups)
  MAX_DAILY_CONVERSION_RATE: 0.8,
  // Self-referral check
  CHECK_SELF_REFERRAL: true,
  // Velocity check - too many signups in short period
  MAX_SIGNUPS_PER_HOUR: 10,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { 
      action,
      referral_id,
      ambassador_id,
      user_id,
      ip_address,
      device_id,
      user_email
    } = await req.json();

    if (action === 'check_referral') {
      // Check a new referral for fraud indicators
      const flags = [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const ambassador = (await base44.asServiceRole.entities.Ambassador.filter({ id: ambassador_id }))[0];
      if (!ambassador) {
        return Response.json({ error: 'Ambassador not found' }, { status: 404 });
      }

      // 1. Check for same IP abuse
      if (ip_address) {
        const sameIpReferrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({
          ambassador_id,
          ip_address,
          created_date: { $gte: oneDayAgo.toISOString() }
        });
        if (sameIpReferrals.length >= FRAUD_RULES.MAX_SIGNUPS_PER_IP_PER_DAY) {
          flags.push('multiple_signups_same_ip');
        }
      }

      // 2. Check for same device abuse
      if (device_id) {
        const sameDeviceReferrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({
          ambassador_id,
          device_id,
          created_date: { $gte: oneDayAgo.toISOString() }
        });
        if (sameDeviceReferrals.length >= FRAUD_RULES.MAX_SIGNUPS_PER_DEVICE_PER_DAY) {
          flags.push('multiple_signups_same_device');
        }
      }

      // 3. Check signup velocity (too fast)
      const recentReferrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({
        ambassador_id,
        created_date: { $gte: new Date(now.getTime() - FRAUD_RULES.MIN_MINUTES_BETWEEN_SIGNUPS * 60 * 1000).toISOString() }
      });
      if (recentReferrals.length > 0) {
        flags.push('rapid_signups');
      }

      // 4. Check hourly velocity
      const hourlyReferrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({
        ambassador_id,
        created_date: { $gte: oneHourAgo.toISOString() }
      });
      if (hourlyReferrals.length >= FRAUD_RULES.MAX_SIGNUPS_PER_HOUR) {
        flags.push('velocity_exceeded');
      }

      // 5. Check for self-referral
      if (FRAUD_RULES.CHECK_SELF_REFERRAL && user_email) {
        if (user_email.toLowerCase() === ambassador.email.toLowerCase()) {
          flags.push('self_referral');
        }
        // Check similar email patterns
        const ambassadorEmailBase = ambassador.email.split('@')[0].replace(/[0-9]/g, '').toLowerCase();
        const userEmailBase = user_email.split('@')[0].replace(/[0-9]/g, '').toLowerCase();
        if (ambassadorEmailBase === userEmailBase && ambassador.email !== user_email) {
          flags.push('similar_email_pattern');
        }
      }

      // 6. Check if IP is from known VPN/proxy (simplified check)
      // In production, you'd use an IP reputation service
      
      // 7. Check ambassador's overall suspicious pattern
      const ambassadorReferrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({
        ambassador_id,
        created_date: { $gte: oneDayAgo.toISOString() }
      });
      const subscribedCount = ambassadorReferrals.filter(r => r.status === 'subscribed').length;
      if (ambassadorReferrals.length >= 5) {
        const conversionRate = subscribedCount / ambassadorReferrals.length;
        // If too high (near 100%) it might be fake
        if (conversionRate >= FRAUD_RULES.MAX_DAILY_CONVERSION_RATE) {
          flags.push('suspicious_conversion_rate');
        }
      }

      const isSuspicious = flags.length > 0;

      // Update referral with fraud flags
      if (referral_id && flags.length > 0) {
        await base44.asServiceRole.entities.AmbassadorReferral.update(referral_id, {
          fraud_flags: flags,
          is_suspicious: isSuspicious
        });
      }

      // If severely suspicious, flag the ambassador too
      if (flags.includes('velocity_exceeded') || flags.includes('self_referral') || flags.length >= 3) {
        const existingFlags = ambassador.fraud_flags || [];
        const newFlags = [...new Set([...existingFlags, ...flags])];
        await base44.asServiceRole.entities.Ambassador.update(ambassador_id, {
          fraud_flags: newFlags
        });
      }

      return Response.json({ 
        is_suspicious: isSuspicious, 
        flags,
        action_recommended: flags.length >= 3 ? 'suspend_review' : flags.length > 0 ? 'flag_for_review' : 'allow'
      });
    }

    if (action === 'run_daily_audit') {
      // Daily fraud audit across all ambassadors
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }

      const results = {
        ambassadors_checked: 0,
        suspicious_found: 0,
        referrals_flagged: 0,
        auto_suspended: 0
      };

      const ambassadors = await base44.asServiceRole.entities.Ambassador.filter({ status: 'active' });
      
      for (const ambassador of ambassadors) {
        results.ambassadors_checked++;
        
        // Check for patterns
        const referrals = await base44.asServiceRole.entities.AmbassadorReferral.filter({
          ambassador_id: ambassador.id
        });

        // Group by IP
        const ipCounts = {};
        const deviceCounts = {};
        for (const ref of referrals) {
          if (ref.ip_address) {
            ipCounts[ref.ip_address] = (ipCounts[ref.ip_address] || 0) + 1;
          }
          if (ref.device_id) {
            deviceCounts[ref.device_id] = (deviceCounts[ref.device_id] || 0) + 1;
          }
        }

        // Flag referrals with repeated IPs/devices
        const suspiciousIps = Object.entries(ipCounts).filter(([_, count]) => count > 5).map(([ip]) => ip);
        const suspiciousDevices = Object.entries(deviceCounts).filter(([_, count]) => count > 3).map(([device]) => device);

        for (const ref of referrals) {
          const flags = [];
          if (suspiciousIps.includes(ref.ip_address)) flags.push('repeated_ip_pattern');
          if (suspiciousDevices.includes(ref.device_id)) flags.push('repeated_device_pattern');
          
          if (flags.length > 0 && !ref.is_suspicious) {
            await base44.asServiceRole.entities.AmbassadorReferral.update(ref.id, {
              fraud_flags: [...(ref.fraud_flags || []), ...flags],
              is_suspicious: true
            });
            results.referrals_flagged++;
          }
        }

        // Check if ambassador should be auto-suspended
        const suspiciousCount = referrals.filter(r => r.is_suspicious).length;
        const suspiciousRate = referrals.length > 10 ? suspiciousCount / referrals.length : 0;
        
        if (suspiciousRate > 0.5) {
          await base44.asServiceRole.entities.Ambassador.update(ambassador.id, {
            status: 'suspended',
            suspended_reason: 'Auto-suspended: High fraud rate detected',
            suspended_at: new Date().toISOString()
          });
          results.auto_suspended++;
          results.suspicious_found++;
        }
      }

      return Response.json({ success: true, results });
    }

    if (action === 'clear_flags') {
      // Admin action to clear flags after review
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }

      if (referral_id) {
        await base44.asServiceRole.entities.AmbassadorReferral.update(referral_id, {
          fraud_flags: [],
          is_suspicious: false
        });
      }

      if (ambassador_id) {
        await base44.asServiceRole.entities.Ambassador.update(ambassador_id, {
          fraud_flags: []
        });
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Fraud check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});