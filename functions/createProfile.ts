import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.json();

    // 1. Check for existing profile
    const existingProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (existingProfiles.length > 0) {
        return Response.json({ error: 'Profile already exists' }, { status: 400 });
    }

    // 2. ENHANCED Device/Phone Limits (Security)
    if (formData.phone_number) {
        const phoneCheck = await base44.asServiceRole.entities.UserProfile.filter({ phone_number: formData.phone_number });
        if (phoneCheck.length >= 1) { // STRICTER: Only 1 account per phone number
             return Response.json({ error: 'This phone number is already registered with another account.' }, { status: 400 });
        }
    }

    // Check for ACTIVE profiles only (allow re-registration after account deletion)
    const allUserProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    // Enforce strict one account per user policy (but allow re-registration after deletion)
    if (allUserProfiles.length >= 1) {
         return Response.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }
    
    // Check for banned email domains (disposable emails)
    const disposableDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com', 'throwaway.email', 'fakeinbox.com', 'trashmail.com', 'yopmail.com'];
    const emailDomain = user.email?.split('@')[1]?.toLowerCase();
    if (emailDomain && disposableDomains.some(d => emailDomain.includes(d))) {
        return Response.json({ error: 'Please use a valid email address. Temporary/disposable emails are not allowed.' }, { status: 400 });
    }
    
    // Check device limit more strictly
    const deviceId = formData.device_id || `web_${Date.now()}`;
    const existingDeviceProfiles = await base44.asServiceRole.entities.UserProfile.filter({
        device_ids: { $contains: deviceId }
    });
    if (existingDeviceProfiles.length >= 2) {
        return Response.json({ error: 'Too many accounts from this device. Please contact support if you believe this is an error.' }, { status: 400 });
    }

    // 3. Prepare Secure Data (deviceId already defined above)
    
    // Check Founding Member Program Settings
    let isFoundingMember = false;
    let foundingTrialEndsAt = null;
    let foundingMemberSource = null;
    let grantPremiumTrial = false; // Only true if founder code or auto-assign
    let trialExpiresAt = null;

    try {
        const settingsRecords = await base44.asServiceRole.entities.SystemSettings.filter({ key: 'founder_program' });
        const founderSettings = settingsRecords[0]?.value || {
            founders_mode_enabled: false,
            auto_assign_new_users: false,
            trial_days: 183
        };

        // Check if user provided an invite code
        if (formData.founder_invite_code) {
            const codes = await base44.asServiceRole.entities.FounderInviteCode.filter({ 
                code: formData.founder_invite_code.toUpperCase(),
                is_active: true
            });

            if (codes.length > 0) {
                const code = codes[0];
                const now = new Date();
                
                // Validate code
                const isExpired = code.expires_at && new Date(code.expires_at) < now;
                const isMaxed = code.current_redemptions >= code.max_redemptions;

                if (!isExpired && !isMaxed) {
                    isFoundingMember = true;
                    grantPremiumTrial = true;
                    foundingMemberSource = 'invite_code';
                    const trialDays = code.trial_days || founderSettings.trial_days || 183;
                    foundingTrialEndsAt = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000)).toISOString();
                    trialExpiresAt = foundingTrialEndsAt;

                    // Record redemption
                    await base44.asServiceRole.entities.FounderCodeRedemption.create({
                        code_id: code.id,
                        code: code.code,
                        user_id: user.id,
                        user_email: user.email,
                        device_id: deviceId
                    });

                    // Increment redemption count
                    await base44.asServiceRole.entities.FounderInviteCode.update(code.id, {
                        current_redemptions: (code.current_redemptions || 0) + 1
                    });
                }
            }
        }
        // Auto-assign if founders mode is on and auto-assign is enabled
        else if (founderSettings.founders_mode_enabled && founderSettings.auto_assign_new_users) {
            isFoundingMember = true;
            grantPremiumTrial = true;
            foundingMemberSource = 'global_toggle';
            const trialDays = founderSettings.trial_days || 183;
            foundingTrialEndsAt = new Date(Date.now() + (trialDays * 24 * 60 * 60 * 1000)).toISOString();
            trialExpiresAt = foundingTrialEndsAt;
        }
        // If founder mode is OFF and no code provided, user starts as FREE (no trial)
    } catch (e) {
        console.error('Founder program check failed:', e);
        // Continue with free tier (no premium)
    }

    // 2.1 Validate Age (Server-side Enforcement)
    if (formData.birth_date) {
        const birthDate = new Date(formData.birth_date);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs); 
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (age < 18) {
             return Response.json({ error: 'You must be at least 18 years old to use this service.' }, { status: 400 });
        }
    } else {
        return Response.json({ error: 'Birth date is required' }, { status: 400 });
    }

    // 2.1.5 GEOGRAPHIC RESTRICTION: Only USA and Canada allowed
    const isAdmin = user.role === 'admin' || user.email === 'pivotngoyb@gmail.com';
    const allowedCountries = ['United States', 'United States of America', 'USA', 'Canada'];
    if (!isAdmin) {
        const currentCountry = formData.current_country;
        if (!currentCountry || !allowedCountries.some(c => c.toLowerCase() === currentCountry.toLowerCase())) {
            return Response.json({ 
                error: 'Afrinnect is currently only available in the United States and Canada. Join our waitlist to be notified when we expand to your region!' 
            }, { status: 400 });
        }
        
        // Validate location coordinates exist (prevent bypass)
        if (!formData.location?.lat || !formData.location?.lng) {
            return Response.json({ 
                error: 'Location verification is required. Please enable location services to continue.' 
            }, { status: 400 });
        }
    }

    // 2.2 ENHANCED AI Content Safety Check (Fake Profiles / Hate Speech / Scams)
    if (formData.bio || formData.display_name) {
        try {
            const safetyCheck = await base44.integrations.Core.InvokeLLM({
                prompt: `You are a strict content moderator for a dating app. Analyze this user profile data for safety:

Name: "${formData.display_name}"
Bio: "${formData.bio || 'None provided'}"
Photos count: ${formData.photos?.length || 0}
Country: ${formData.current_country}

STRICTLY detect and reject if ANY of these are true:
1. FAKE PROFILES: Celebrity names, famous people names, fictional characters, obviously fake names (e.g., "John Smith 123", random characters)
2. SCAM INDICATORS: Mentions of money, crypto, investment, "make money fast", WhatsApp/Telegram numbers, external links, email addresses in bio
3. HATE SPEECH: Any racist, sexist, homophobic, or discriminatory content
4. SOLICITATION: Prostitution, escort services, "massage" services, OnlyFans/adult content promotion
5. SPAM: Repeated characters, nonsensical text, promotional content
6. CATFISH SIGNALS: Claims of being a model, celebrity, or rich person in bio

Be STRICT - when in doubt, reject. We prefer false positives over letting scammers through.

Return JSON: {"is_safe": boolean, "reason": "string", "risk_level": "low" | "medium" | "high", "flags": ["list of specific concerns"]}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        is_safe: { type: "boolean" },
                        reason: { type: "string" },
                        risk_level: { type: "string" },
                        flags: { type: "array", items: { type: "string" } }
                    }
                }
            });

            if (!safetyCheck.is_safe) {
                // Log the rejection for review
                try {
                    await base44.asServiceRole.entities.AdminAuditLog.create({
                        admin_user_id: 'ai_system',
                        admin_email: 'ai@afrinnect.com',
                        action_type: 'profile_rejected',
                        target_user_id: user.email,
                        details: {
                            reason: safetyCheck.reason,
                            risk_level: safetyCheck.risk_level,
                            flags: safetyCheck.flags,
                            name: formData.display_name,
                            bio: formData.bio?.substring(0, 200)
                        }
                    });
                } catch (logError) {
                    console.error('Failed to log rejection:', logError);
                }
                return Response.json({ error: `Profile rejected: ${safetyCheck.reason}` }, { status: 400 });
            }
            
            // If medium/high risk but passed, flag for review
            if (safetyCheck.risk_level === 'medium' || safetyCheck.risk_level === 'high') {
                try {
                    await base44.asServiceRole.entities.AdminAuditLog.create({
                        admin_user_id: 'ai_system',
                        admin_email: 'ai@afrinnect.com',
                        action_type: 'profile_flagged_for_review',
                        target_user_id: user.email,
                        details: {
                            risk_level: safetyCheck.risk_level,
                            flags: safetyCheck.flags,
                            name: formData.display_name
                        }
                    });
                } catch (logError) {
                    console.error('Failed to log flag:', logError);
                }
            }
        } catch (e) {
            console.error("Profile safety check failed", e);
            // For safety, block profile creation if AI check fails
            return Response.json({ error: 'Profile verification temporarily unavailable. Please try again in a few minutes.' }, { status: 503 });
        }
    }

    const allowedFields = {
        display_name: formData.display_name,
        birth_date: formData.birth_date,
        gender: formData.gender,
        looking_for: formData.looking_for,
        photos: formData.photos,
        primary_photo: formData.primary_photo,
        bio: formData.bio,
        country_of_origin: formData.country_of_origin,
        current_country: formData.current_country,
        current_state: formData.current_state,
        current_city: formData.current_city,
        tribe_ethnicity: formData.tribe_ethnicity,
        languages: formData.languages,
        religion: formData.religion,
        education: formData.education,
        profession: formData.profession,
        relationship_goal: formData.relationship_goal,
        height_cm: formData.height_cm,
        lifestyle: formData.lifestyle,
        cultural_values: formData.cultural_values,
        interests: formData.interests,
        prompts: formData.prompts,
        push_token: formData.push_token,
        phone_number: formData.phone_number
    };

    const profileData = {
        ...allowedFields,
        user_id: user.id,
        // Force critical fields (User cannot override these)
        is_active: true,
        last_active: new Date().toISOString(),
        daily_likes_count: 0,
        daily_likes_reset_date: new Date().toISOString().split('T')[0],
        // Set subscription based on founder status
        is_premium: grantPremiumTrial,
        subscription_tier: grantPremiumTrial ? 'premium' : 'free',
        premium_until: trialExpiresAt, // null if not a founder
        verification_status: {
          email_verified: true, // Auto-verify email on signup as they own the account
          phone_verified: false,
          photo_verified: false,
          id_verified: false
        },
        device_ids: [deviceId],
        device_info: [{
          device_id: deviceId,
          device_name: formData.device_name || 'Web Browser',
          last_login: new Date().toISOString()
        }],
        // Reset potentially malicious fields
        violation_count: 0,
        warning_count: 0,
        is_banned: false,
        is_suspended: false
    };

    // Add Founding Member fields if applicable
    if (isFoundingMember) {
        profileData.is_founding_member = true;
        profileData.founding_member_granted_at = new Date().toISOString();
        profileData.founding_member_trial_ends_at = foundingTrialEndsAt;
        profileData.founding_member_source = foundingMemberSource;
        profileData.founding_member_code_used = formData.founder_invite_code?.toUpperCase() || null;
        profileData.founding_member_eligible = false;
        profileData.founding_trial_consumed = true;
        profileData.badges = ['founding_member'];
    } else {
        profileData.founding_member_eligible = true;
        profileData.founding_trial_consumed = false;
    }

    const newProfile = await base44.entities.UserProfile.create(profileData);

    // 4. Post-Creation Actions (Async)
    // Welcome Email
    try {
        await base44.functions.invoke('sendWelcomeEmail', {
          user_email: user.email,
          user_name: formData.display_name
        });
    } catch (e) {}

    // Referral Logic
    if (formData.referred_by && formData.referred_by !== user.id) {
        try {
            // Validate referrer
            const referrers = await base44.asServiceRole.entities.User.filter({ id: formData.referred_by });
            if (referrers.length > 0) {
                // Create Referral Record
                await base44.asServiceRole.entities.Referral.create({
                    referrer_id: formData.referred_by,
                    referred_id: user.id,
                    referred_email: user.email,
                    status: 'completed',
                    reward_given: true,
                    reward_claimed: true
                });

                // Award Referrer (Extend Premium by 3 days)
                const referrerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: formData.referred_by });
                if (referrerProfiles.length > 0) {
                    const rProfile = referrerProfiles[0];
                    let newExpiry = new Date();
                    if (rProfile.premium_until && new Date(rProfile.premium_until) > new Date()) {
                        newExpiry = new Date(rProfile.premium_until);
                    }
                    newExpiry.setDate(newExpiry.getDate() + 3);
                    
                    await base44.asServiceRole.entities.UserProfile.update(rProfile.id, {
                        is_premium: true,
                        subscription_tier: rProfile.subscription_tier === 'free' ? 'premium' : rProfile.subscription_tier,
                        premium_until: newExpiry.toISOString()
                    });

                    // Notify Referrer
                    await base44.asServiceRole.entities.Notification.create({
                        user_profile_id: rProfile.id,
                        type: 'admin_message',
                        title: 'Referral Reward! 🎁',
                        message: `Your friend joined Afrinnect! You've earned 3 extra days of Premium access.`,
                        is_read: false
                    });
                }
            }
        } catch (e) {
            console.error('Referral processing failed:', e);
        }
    }

    // Ambassador Referral Attribution
    if (formData.ambassador_code) {
        try {
            const ambassadors = await base44.asServiceRole.entities.Ambassador.filter({
                referral_code: formData.ambassador_code.toUpperCase(),
                status: 'active'
            });

            if (ambassadors.length > 0) {
                const ambassador = ambassadors[0];
                
                // Anti-fraud: Check for self-referral
                if (ambassador.user_id !== user.id && ambassador.email !== user.email) {
                    const now = new Date();
                    const attributionExpiry = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

                    // Create referral record
                    await base44.asServiceRole.entities.AmbassadorReferral.create({
                        ambassador_id: ambassador.id,
                        user_id: user.id,
                        user_profile_id: newProfile.id,
                        attribution_source: 'code',
                        referral_code_used: formData.ambassador_code.toUpperCase(),
                        attributed_at: now.toISOString(),
                        signup_at: now.toISOString(),
                        attribution_expires_at: attributionExpiry.toISOString(),
                        status: 'signed_up',
                        device_id: deviceId,
                        is_founding_member: isFoundingMember,
                        founding_trial_ends_at: foundingTrialEndsAt,
                        referral_history: [{
                            ambassador_id: ambassador.id,
                            source: 'code',
                            timestamp: now.toISOString()
                        }]
                    });

                    // Record signup event
                    await base44.asServiceRole.entities.AmbassadorReferralEvent.create({
                        ambassador_id: ambassador.id,
                        user_id: user.id,
                        event_type: 'signup',
                        device_id: deviceId,
                        metadata: { referral_code: formData.ambassador_code }
                    });

                    // Update ambassador stats
                    await base44.asServiceRole.entities.Ambassador.update(ambassador.id, {
                        stats: {
                            ...ambassador.stats,
                            total_signups: (ambassador.stats?.total_signups || 0) + 1
                        }
                    });

                    // Check for signup bonus
                    const plan = ambassador.commission_plan_id 
                        ? (await base44.asServiceRole.entities.AmbassadorCommissionPlan.filter({ id: ambassador.commission_plan_id }))[0]
                        : (await base44.asServiceRole.entities.AmbassadorCommissionPlan.filter({ is_default: true, is_active: true }))[0];

                    if (plan?.signup_bonus > 0) {
                        const tierMultiplier = plan.tier_multipliers?.[ambassador.tier] || 1;
                        const holdUntil = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));

                        await base44.asServiceRole.entities.AmbassadorCommission.create({
                            ambassador_id: ambassador.id,
                            user_id: user.id,
                            commission_type: 'signup_bonus',
                            original_amount: plan.signup_bonus,
                            amount: plan.signup_bonus * tierMultiplier,
                            tier_multiplier: tierMultiplier,
                            currency: 'USD',
                            status: 'pending',
                            hold_until: holdUntil.toISOString()
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Ambassador attribution failed:', e);
            // Don't fail profile creation
        }
    }

    return Response.json({ success: true, profile: newProfile });

  } catch (error) {
    console.error('Create Profile Error:', error);
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return Response.json({ error: 'Profile already exists' }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});