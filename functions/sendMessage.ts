import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { matchId, content, type = 'text', mediaUrl, idempotencyKey } = await req.json();

        if (!content && !mediaUrl) {
            return Response.json({ error: 'Message content required' }, { status: 400 });
        }

        // 1. Fetch My Profile
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (!profiles.length) return Response.json({ error: 'Profile not found' }, { status: 404 });
        const myProfile = profiles[0];

        // 2. Validate Match & Ownership
        const matches = await base44.entities.Match.filter({ id: matchId });
        if (!matches.length) return Response.json({ error: 'Match not found' }, { status: 404 });
        
        const match = matches[0];
        if (match.user1_id !== myProfile.id && match.user2_id !== myProfile.id) {
            return Response.json({ error: 'Not authorized' }, { status: 403 });
        }

        if (match.status !== 'active') {
            return Response.json({ error: 'Match is not active' }, { status: 403 });
        }
        
        const receiverId = match.user1_id === myProfile.id ? match.user2_id : match.user1_id;

        // Check blocking
        const receiverProfiles = await base44.entities.UserProfile.filter({ id: receiverId });
        if (!receiverProfiles.length) return Response.json({ error: 'Receiver not found' }, { status: 404 });
        const receiverProfile = receiverProfiles[0];

        if (receiverProfile.blocked_users?.includes(myProfile.id)) {
             return Response.json({ error: 'You cannot message this user' }, { status: 403 });
        }

        // 3. Fetch System Settings for configurable limits
        let rateLimits = { daily_message_limit_free: 20, duplicate_window_ms: 10000 };
        try {
            const settings = await base44.asServiceRole.entities.SystemSettings.filter({ key: 'rate_limits' });
            if (settings.length > 0 && settings[0].value) {
                rateLimits = { ...rateLimits, ...settings[0].value };
            }
        } catch (e) {
            console.log('Using default rate limits');
        }

        // 4. Scalable Rate Limiting (Deno KV)
        const kv = await Deno.openKv();
        const rateKey = ["msg_rate", myProfile.id];
        const lastMsg = await kv.get(rateKey);
        
        const now = Date.now();
        if (lastMsg.value && now - lastMsg.value < 1000) {
             return Response.json({ error: 'You are sending too quickly' }, { status: 429 });
        }
        await kv.set(rateKey, now);

        // 5. Idempotency Check (if client provides key)
        if (idempotencyKey) {
            const existingMsg = await base44.entities.Message.filter({ idempotency_key: idempotencyKey });
            if (existingMsg.length > 0) {
                return Response.json(existingMsg[0]); // Return existing message
            }
        }

        // 6. Subscription Limit - Fetch from centralized TierConfiguration
        const tier = myProfile.subscription_tier || 'free';
        
        // Try to get dynamic limits from TierConfiguration entity
        let dailyMessageLimit = -1; // Default to unlimited
        try {
            const tierConfigs = await base44.entities.TierConfiguration.filter({ tier_id: tier });
            if (tierConfigs.length > 0 && tierConfigs[0].limits?.daily_messages !== undefined) {
                dailyMessageLimit = tierConfigs[0].limits.daily_messages;
            } else {
                // Fallback to hardcoded defaults
                const defaultLimits = {
                    free: rateLimits.daily_message_limit_free || 20,
                    premium: 100,
                    elite: -1,
                    vip: -1
                };
                dailyMessageLimit = defaultLimits[tier] ?? 20;
            }
        } catch (e) {
            console.log('Using fallback message limits');
            const defaultLimits = { free: 20, premium: 100, elite: -1, vip: -1 };
            dailyMessageLimit = defaultLimits[tier] ?? 20;
        }
        
        // -1 means unlimited, otherwise enforce limit
        if (dailyMessageLimit !== -1) {
            const today = new Date().toISOString().split('T')[0];
            const dailyMsgs = await base44.entities.Message.filter({ 
                sender_id: myProfile.id,
                created_date: { $gte: `${today}T00:00:00.000Z` }
            });
            if (dailyMsgs.length >= dailyMessageLimit) {
                 return Response.json({ error: 'upgrade_required' }, { status: 403 });
            }
        }

        // 7. NON-BLOCKING AI Safety Analysis with Timeout
        let isFlagged = false;
        let isDeleted = false;
        let scamAnalysisData = null;

        if ((type === 'text' && content) || (type === 'image' && mediaUrl)) {
            try {
                // Wrap AI call in a timeout (5 seconds max)
                const analysisPromise = (async () => {
                    const lastFewMsgs = await base44.entities.Message.filter({ sender_id: myProfile.id }, '-created_date', 5);
                    const msgHistory = lastFewMsgs.map(m => m.content).join(" | ");

                    return await base44.integrations.Core.InvokeLLM({
                        prompt: `
                        Analyze this message for ZERO TOLERANCE violations.
                        Sender Context: Account age ${(new Date() - new Date(myProfile.created_date)) / (1000 * 60 * 60 * 24)} days.
                        Message Content: "${content || '[Image Attached]'}"
                        Recent History: "${msgHistory}"

                        STRICTLY DETECT (Zero Tolerance):
                        1. Harassment, bullying, threats
                        2. Hate speech, racism, discrimination
                        3. Sexual harassment, unsolicited explicit content
                        4. Fake profiles, catfishing
                        5. Scamming, money requests
                        6. Doxing (sharing private info)
                        7. Prostitution, trafficking, solicitation
                        8. Aggressive off-platform redirection

                        Return JSON: {
                            "is_safe": boolean,
                            "risk_score": number (0-100),
                            "scam_type": "string" (harassment, hate_speech, sexual_content, scam, doxing, trafficking, none),
                            "severity": "string" (low, medium, high, critical),
                            "reasons": ["string"]
                        }
                        `,
                        file_urls: mediaUrl ? [mediaUrl] : undefined,
                        response_json_schema: {
                            type: "object",
                            properties: {
                                is_safe: { type: "boolean" },
                                risk_score: { type: "number" },
                                scam_type: { type: "string" },
                                severity: { type: "string" },
                                reasons: { type: "array", items: { type: "string" } }
                            }
                        }
                    });
                })();

                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('AI_TIMEOUT')), 5000)
                );

                const analysis = await Promise.race([analysisPromise, timeoutPromise]);

                if (!analysis.is_safe || analysis.risk_score > 50) {
                    isFlagged = true;
                    if (analysis.risk_score > 80) isDeleted = true;

                    scamAnalysisData = {
                        risk_score: analysis.risk_score,
                        scam_type: analysis.scam_type,
                        ai_analysis: {
                            is_suspicious: !analysis.is_safe,
                            confidence: analysis.risk_score,
                            reasons: analysis.reasons
                        },
                        action_taken: isDeleted ? 'hidden' : 'flagged'
                    };

                    // AUTOMATIC ENFORCEMENT (High Confidence Only)
                    if (analysis.risk_score > 85) {
                        const violations = (myProfile.violation_count || 0) + 1;
                        let action = 'warning';
                        let suspensionDays = 0;
                        let notifyAuth = false;

                        if (analysis.severity === 'critical' || ['trafficking', 'doxing'].includes(analysis.scam_type)) {
                            action = 'permanent_ban';
                            notifyAuth = true;
                        } else if (analysis.severity === 'high' || analysis.risk_score > 95) {
                            action = violations >= 2 ? 'permanent_ban' : 'temporary_ban';
                            suspensionDays = 30;
                        } else {
                            if (violations >= 3) action = 'permanent_ban';
                            else if (violations >= 2) { action = 'temporary_ban'; suspensionDays = 7; }
                            else action = 'warning';
                        }

                        const updateData = { violation_count: violations };
                        
                        if (action === 'permanent_ban') {
                            updateData.is_banned = true;
                            updateData.ban_reason = `AI Auto-Ban: ${analysis.scam_type}`;
                            updateData.is_active = false;
                        } else if (action === 'temporary_ban') {
                            updateData.is_suspended = true;
                            updateData.suspension_expires_at = new Date(Date.now() + suspensionDays * 86400000).toISOString();
                            updateData.suspension_reason = `AI Auto-Suspend: ${analysis.scam_type}`;
                        } else {
                            updateData.warning_count = (myProfile.warning_count || 0) + 1;
                        }

                        await base44.asServiceRole.entities.UserProfile.update(myProfile.id, updateData);

                        const alertTitle = action === 'permanent_ban' ? '⛔ Account Banned' : 
                                         action === 'temporary_ban' ? '🚫 Account Suspended' : 
                                         '⚠️ Warning Issued';
                        
                        await base44.asServiceRole.entities.Notification.create({
                            user_profile_id: myProfile.id,
                            type: 'admin_message',
                            title: alertTitle,
                            message: `Violation detected: ${analysis.scam_type}. ${action === 'warning' ? 'Further violations will result in suspension.' : ''}`,
                            is_admin: true
                        });

                        if (notifyAuth) {
                            await base44.integrations.Core.SendEmail({
                                to: 'support@afrinnect.com',
                                subject: '🚨 URGENT: Illegal Activity Detected',
                                body: `User ${myProfile.display_name} (${myProfile.id}) detected for ${analysis.scam_type}.\nConfidence: ${analysis.risk_score}%\nContent: "${content}"`
                            });
                        }
                    }
                }
            } catch (e) {
                if (e.message === 'AI_TIMEOUT') {
                    console.log('AI safety analysis timed out - proceeding with message');
                    // Track the timeout for monitoring
                    try {
                        await base44.functions.invoke('trackAnalytics', {
                            eventType: 'ai_safety_timeout',
                            userId: myProfile.id,
                            properties: { match_id: matchId }
                        });
                    } catch (trackErr) {}
                } else {
                    console.error("Safety analysis failed", e);
                }
            }
        }

        // 8. Get next sequence number for this match
        const lastMessages = await base44.entities.Message.filter(
            { match_id: matchId }, 
            '-sequence_number', 
            1
        );
        const nextSequence = (lastMessages[0]?.sequence_number || 0) + 1;

        // 9. Check for duplicate message (content-based fallback)
        const duplicateWindowMs = rateLimits.duplicate_window_ms || 10000;
        const recentMessages = await base44.entities.Message.filter({
            match_id: matchId,
            sender_id: myProfile.id,
            created_date: { $gte: new Date(Date.now() - duplicateWindowMs).toISOString() }
        });
        
        const isDuplicate = recentMessages.some(m => 
            m.content === content && m.message_type === type
        );
        
        if (isDuplicate) {
            return Response.json({ 
                error: 'Duplicate message detected', 
                duplicate: true 
            }, { status: 409 });
        }
        
        // 10. Create Message with sequence number and idempotency key
        const messageData = {
            match_id: matchId,
            sender_id: myProfile.id,
            receiver_id: receiverId,
            sender_user_id: myProfile.user_id,
            receiver_user_id: receiverProfile.user_id,
            content: content,
            message_type: type,
            media_url: mediaUrl,
            sequence_number: nextSequence,
            is_read: false,
            is_flagged: isFlagged,
            is_deleted: isDeleted
        };
        
        if (idempotencyKey) {
            messageData.idempotency_key = idempotencyKey;
        }
        
        const message = await base44.entities.Message.create(messageData);

        // 11. Save Scam Analysis & Auto-Report to Admin
        if (scamAnalysisData) {
            await base44.asServiceRole.entities.ScamAnalysis.create({
                message_id: message.id,
                sender_id: myProfile.id,
                ...scamAnalysisData
            });

            if (scamAnalysisData.risk_score > 70) {
                 try {
                     await base44.asServiceRole.entities.Report.create({
                        reporter_id: receiverId,
                        reported_id: myProfile.id,
                        report_type: 'scam',
                        description: `[AI AUTO-FLAG] High Risk Message (${scamAnalysisData.risk_score}%). Type: ${scamAnalysisData.scam_type}. Reasons: ${scamAnalysisData.ai_analysis.reasons.join(', ')}`,
                        status: 'pending',
                        action_taken: isDeleted ? 'content_removed' : 'none',
                        evidence_urls: []
                     });
                 } catch (e) {
                     console.error("Failed to auto-report", e);
                 }
            }
        }

        // 12. Update match first_message tracking and remove expiry
        if (!match.first_message_sent) {
            await base44.asServiceRole.entities.Match.update(match.id, {
                first_message_sent: true,
                first_message_sent_by: myProfile.id,
                first_message_sent_at: new Date().toISOString(),
                expires_at: null // Remove expiry once a message is sent
            });
        }

        // 13. Notifications (only if not deleted)
        if (!isDeleted) {
            await base44.asServiceRole.entities.Notification.create({
                user_profile_id: receiverId,
                user_id: receiverProfile.user_id,
                type: 'message',
                title: `Message from ${myProfile.display_name}`,
                message: content.substring(0, 50),
                from_profile_id: myProfile.id,
                link_to: `Chat?matchId=${matchId}`
            });

            try {
                 await base44.functions.invoke('sendPushNotification', {
                     user_profile_id: receiverId,
                     title: `New message from ${myProfile.display_name}`,
                     body: content.substring(0, 50),
                     type: 'message'
                 });
            } catch(e) {}
        }

        // 14. Track analytics
        try {
            await base44.functions.invoke('trackAnalytics', {
                eventType: 'message_sent',
                userId: myProfile.id,
                properties: { 
                    match_id: matchId, 
                    message_type: type,
                    is_flagged: isFlagged 
                }
            });
        } catch (e) {}

        return Response.json(message);

    } catch (error) {
        // Alert on critical failures
        try {
            const base44 = createClientFromRequest(req);
            await base44.functions.invoke('alertSystemFailure', {
                error_type: 'sendMessage_failure',
                function_name: 'sendMessage',
                error_message: error.message,
                severity: 'high',
                metadata: { stack: error.stack?.substring(0, 500) }
            });
        } catch (alertErr) {
            console.error('Failed to alert:', alertErr);
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
});