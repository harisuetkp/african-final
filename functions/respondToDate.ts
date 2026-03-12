import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { datePlanId, response } = await req.json(); // response: 'accepted' | 'declined'

        if (!datePlanId || !['accepted', 'declined'].includes(response)) {
            return Response.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        // 1. Fetch Date Plan
        const plans = await base44.entities.DatePlan.filter({ id: datePlanId });
        if (!plans.length) return Response.json({ error: 'Date plan not found' }, { status: 404 });
        const plan = plans[0];

        // 2. Fetch Match to verify ownership
        const matches = await base44.entities.Match.filter({ id: plan.match_id });
        if (!matches.length) return Response.json({ error: 'Match not found' }, { status: 404 });
        const match = matches[0];

        if (match.status !== 'active') {
            return Response.json({ error: 'Match is not active' }, { status: 400 });
        }

        // 3. Verify User is part of match AND NOT the creator (you can't accept your own proposal)
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (!profiles.length) return Response.json({ error: 'Profile not found' }, { status: 404 });
        const myProfile = profiles[0];

        if (match.user1_id !== myProfile.id && match.user2_id !== myProfile.id) {
            return Response.json({ error: 'Not authorized' }, { status: 403 });
        }

        if (plan.created_by_profile === myProfile.id) {
             return Response.json({ error: 'Cannot respond to your own proposal' }, { status: 400 });
        }

        // 4. Update Status
        await base44.entities.DatePlan.update(plan.id, {
            status: response
        });

        // 5. Notify Original Creator
        const creatorId = plan.created_by_profile;
        const title = response === 'accepted' ? '✅ Date Accepted!' : '❌ Date Declined';
        const message = response === 'accepted' 
            ? `${myProfile.display_name} accepted the date at ${plan.venue_name}!` 
            : `${myProfile.display_name} declined the date proposal.`;

        await base44.entities.Notification.create({
            user_profile_id: creatorId,
            type: 'date_plan',
            title: title,
            message: message,
            from_profile_id: myProfile.id,
            link_to: `DatePlanner?matchId=${plan.match_id}`
        });

        // 6. Push Notification
        try {
            await base44.functions.invoke('sendPushNotification', {
                user_profile_id: creatorId,
                title: title,
                body: message,
                type: 'date_plan'
            });
        } catch(e) {}

        return Response.json({ success: true, status: response });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});