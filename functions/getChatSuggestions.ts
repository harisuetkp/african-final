import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { matchId } = await req.json();

        // 1. Fetch Match Details & Profiles
        const matches = await base44.entities.Match.filter({ id: matchId });
        if (!matches.length) return Response.json({ error: 'Match not found' }, { status: 404 });
        
        const match = matches[0];
        // Validate access
        if (match.user1_id !== user.id && match.user2_id !== user.id) {
             return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        
        const [myProfiles, otherProfiles, messages] = await Promise.all([
            base44.entities.UserProfile.filter({ user_id: user.id }),
            base44.entities.UserProfile.filter({ id: otherUserId }),
            base44.entities.Message.filter({ match_id: matchId }, '-created_date', 10) // Last 10 messages
        ]);

        const myProfile = myProfiles[0];
        const otherProfile = otherProfiles[0];

        // 2. Format Context
        const recentChat = messages.reverse().map(m => 
            `${m.sender_id === myProfile.id ? 'Me' : 'Them'}: ${m.content}`
        ).join('\n');

        const prompt = `
        Context: Two users on a dating app (Afrinnect).
        
        User (Me): ${myProfile.display_name}, ${myProfile.gender}, ${myProfile.current_city}. Interests: ${myProfile.interests?.join(', ')}.
        Match (Them): ${otherProfile.display_name}, ${otherProfile.gender}, ${otherProfile.current_city}. Interests: ${otherProfile.interests?.join(', ')}.
        
        Recent Conversation:
        ${recentChat || "(No messages yet)"}
        
        Task: Suggest 3 specific, context-aware reply options or conversation starters for Me.
        Rules:
        1. If conversation exists, pivot off the last topic.
        2. If no conversation, use shared interests or profile details.
        3. Be casual, engaging, and culturally relevant.
        4. Short and ready-to-send texts.
        
        Return JSON: { "suggestions": ["string", "string", "string"] }
        `;

        // 3. AI Generation
        const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    suggestions: { type: "array", items: { type: "string" } }
                }
            }
        });

        return Response.json(result);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});