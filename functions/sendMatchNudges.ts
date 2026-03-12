import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }
        
        // Find active matches created more than 24 hours ago
        // that haven't been nudged yet
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        
        // Fetch recent active matches
        const matches = await base44.asServiceRole.entities.Match.filter({
            is_match: true,
            status: 'active',
            matched_at: { $lt: yesterday, $gt: threeDaysAgo },
            has_nudged: false // Only nudge once
        });

        let nudgedCount = 0;

        for (const match of matches) {
            // Check if any messages exist for this match
            const messages = await base44.asServiceRole.entities.Message.filter({
                match_id: match.id
            }, '-created_date', 1);

            // If no messages, send nudge
            if (messages.length === 0) {
                // Send nudge to User 1
                await base44.asServiceRole.entities.Notification.create({
                    user_profile_id: match.user1_id,
                    type: 'system',
                    title: 'Don\'t be shy! 👋',
                    message: 'You have a new match waiting. Say hello!',
                    link_to: `Chat?matchId=${match.id}`
                });

                // Send nudge to User 2
                await base44.asServiceRole.entities.Notification.create({
                    user_profile_id: match.user2_id,
                    type: 'system',
                    title: 'Don\'t be shy! 👋',
                    message: 'You have a new match waiting. Say hello!',
                    link_to: `Chat?matchId=${match.id}`
                });

                // Mark as nudged
                await base44.asServiceRole.entities.Match.update(match.id, {
                    has_nudged: true
                });

                nudgedCount++;
            }
        }

        return Response.json({ 
            success: true, 
            matches_checked: matches.length,
            nudged: nudgedCount 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});