import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { matchId, suggestion } = await req.json();
        
        if (!matchId || !suggestion) {
            return Response.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Validate Match & Ownership
        const matches = await base44.entities.Match.filter({ id: matchId });
        if (!matches.length) return Response.json({ error: 'Match not found' }, { status: 404 });
        
        const match = matches[0];

        if (match.status !== 'active') {
            return Response.json({ error: 'Match is not active' }, { status: 400 });
        }
        
        // Fetch My Profile
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (!profiles.length) return Response.json({ error: 'Profile not found' }, { status: 404 });
        const myProfile = profiles[0];

        // Check ownership
        if (match.user1_id !== myProfile.id && match.user2_id !== myProfile.id) {
            return Response.json({ error: 'Not authorized' }, { status: 403 });
        }
        
        const receiverId = match.user1_id === myProfile.id ? match.user2_id : match.user1_id;

        // 2. Create Date Plan
        const plan = await base44.entities.DatePlan.create({
            match_id: matchId,
            suggested_by: 'ai',
            venue_name: suggestion.venue_name,
            venue_address: suggestion.venue_address,
            date_type: suggestion.date_type,
            budget_estimate: suggestion.budget_estimate,
            status: 'proposed',
            created_by_profile: myProfile.id
        });
      
        // 3. Notification
        await base44.entities.Notification.create({
            user_profile_id: receiverId,
            type: 'date_plan',
            title: '📅 Date Suggestion',
            message: `Date idea: ${suggestion.venue_name}`,
            from_profile_id: myProfile.id,
            link_to: `DatePlanner?matchId=${matchId}`
        });

        // 4. Push Notification
        try {
             await base44.functions.invoke('sendPushNotification', {
                 user_profile_id: receiverId,
                 title: '📅 New Date Suggestion',
                 body: `${myProfile.display_name} suggested a date at ${suggestion.venue_name}`,
                 type: 'date_plan'
             });
        } catch(e) {}

        return Response.json(plan);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});