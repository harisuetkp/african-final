import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function checks for matches expiring soon and expired matches
// Run via scheduled automation every hour
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }
        
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        
        // Find matches without messages that are expiring soon (within 1 hour)
        const expiringMatches = await base44.asServiceRole.entities.Match.filter({
            is_match: true,
            status: 'active',
            is_expired: false,
            expires_at: { $gt: now.toISOString(), $lt: oneHourFromNow.toISOString() }
        });
        
        let lastChanceNotifications = 0;
        let expiredCount = 0;
        
        // Send "Last Chance" notifications for expiring matches
        for (const match of expiringMatches) {
            // Check if any messages exist
            const messages = await base44.asServiceRole.entities.Message.filter({
                match_id: match.id
            }, '-created_date', 1);
            
            if (messages.length === 0 && !match.last_chance_sent) {
                // Get both user profiles
                const [user1Profiles, user2Profiles] = await Promise.all([
                    base44.asServiceRole.entities.UserProfile.filter({ id: match.user1_id }),
                    base44.asServiceRole.entities.UserProfile.filter({ id: match.user2_id })
                ]);
                
                const user1 = user1Profiles[0];
                const user2 = user2Profiles[0];
                
                if (user1 && user2) {
                    // Calculate remaining time
                    const expiresAt = new Date(match.expires_at);
                    const minutesLeft = Math.round((expiresAt - now) / (60 * 1000));
                    
                    // Send notification to User 1
                    await base44.asServiceRole.entities.Notification.create({
                        user_profile_id: match.user1_id,
                        user_id: user1.user_id,
                        type: 'match',
                        title: '⏰ Last Chance!',
                        message: `Your match with ${user2.display_name} expires in ${minutesLeft} minutes! Send a message now.`,
                        from_profile_id: match.user2_id,
                        link_to: `Chat?matchId=${match.id}`
                    });
                    
                    // Send push notification to User 1
                    try {
                        await base44.asServiceRole.functions.invoke('sendPushNotification', {
                            user_profile_id: match.user1_id,
                            title: '⏰ Last Chance!',
                            body: `Your match with ${user2.display_name} expires soon!`,
                            link: `Chat?matchId=${match.id}`,
                            type: 'match_expiring'
                        });
                    } catch (e) { console.error('Push failed:', e); }
                    
                    // Send notification to User 2
                    await base44.asServiceRole.entities.Notification.create({
                        user_profile_id: match.user2_id,
                        user_id: user2.user_id,
                        type: 'match',
                        title: '⏰ Last Chance!',
                        message: `Your match with ${user1.display_name} expires in ${minutesLeft} minutes! Send a message now.`,
                        from_profile_id: match.user1_id,
                        link_to: `Chat?matchId=${match.id}`
                    });
                    
                    // Send push notification to User 2
                    try {
                        await base44.asServiceRole.functions.invoke('sendPushNotification', {
                            user_profile_id: match.user2_id,
                            title: '⏰ Last Chance!',
                            body: `Your match with ${user1.display_name} expires soon!`,
                            link: `Chat?matchId=${match.id}`,
                            type: 'match_expiring'
                        });
                    } catch (e) { console.error('Push failed:', e); }
                    
                    // Mark as last chance sent
                    await base44.asServiceRole.entities.Match.update(match.id, {
                        last_chance_sent: true
                    });
                    
                    lastChanceNotifications++;
                }
            }
        }
        
        // Find and expire matches past their expiry date with no messages
        const expiredMatches = await base44.asServiceRole.entities.Match.filter({
            is_match: true,
            status: 'active',
            is_expired: false,
            expires_at: { $lt: now.toISOString() }
        });
        
        for (const match of expiredMatches) {
            // Check if any messages exist
            const messages = await base44.asServiceRole.entities.Message.filter({
                match_id: match.id
            }, '-created_date', 1);
            
            // If no messages, expire the match
            if (messages.length === 0) {
                await base44.asServiceRole.entities.Match.update(match.id, {
                    is_expired: true,
                    status: 'expired'
                });
                expiredCount++;
            } else {
                // Messages exist, remove expiry (match is safe)
                await base44.asServiceRole.entities.Match.update(match.id, {
                    expires_at: null
                });
            }
        }
        
        return Response.json({
            success: true,
            lastChanceNotifications,
            expiredCount,
            checkedExpiring: expiringMatches.length,
            checkedExpired: expiredMatches.length
        });
        
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});