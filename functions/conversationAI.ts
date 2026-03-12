import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// AI-powered conversation starters and suggestions
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, payload } = await req.json();

        switch (action) {
            case 'get_icebreakers':
                return await getIcebreakers(base44, payload);
            case 'get_conversation_topics':
                return await getConversationTopics(base44, payload);
            case 'get_response_suggestions':
                return await getResponseSuggestions(base44, payload);
            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Conversation AI error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// Generate personalized icebreakers for a new match
async function getIcebreakers(base44, { myProfileId, theirProfileId }) {
    // Get both profiles
    const [myProfiles, theirProfiles] = await Promise.all([
        base44.entities.UserProfile.filter({ id: myProfileId }),
        base44.entities.UserProfile.filter({ id: theirProfileId })
    ]);

    const myProfile = myProfiles[0];
    const theirProfile = theirProfiles[0];

    if (!myProfile || !theirProfile) {
        return Response.json({ error: 'Profiles not found' }, { status: 404 });
    }

    // Find common ground
    const sharedInterests = myProfile.interests?.filter(i => theirProfile.interests?.includes(i)) || [];
    const sameCountry = myProfile.country_of_origin === theirProfile.country_of_origin;
    const sameCity = myProfile.current_city === theirProfile.current_city;
    const sameReligion = myProfile.religion === theirProfile.religion;
    const sharedLanguages = myProfile.languages?.filter(l => theirProfile.languages?.includes(l)) || [];

    // Generate AI icebreakers
    const prompt = `Generate 5 unique, engaging icebreaker messages for a dating app match.

About me:
- Name: ${myProfile.display_name}
- From: ${myProfile.country_of_origin}
- Living in: ${myProfile.current_city}, ${myProfile.current_state}
- Interests: ${(myProfile.interests || []).join(', ')}
- Looking for: ${formatEnum(myProfile.relationship_goal)}
- Bio snippet: "${(myProfile.bio || '').substring(0, 100)}"

About them:
- Name: ${theirProfile.display_name}
- From: ${theirProfile.country_of_origin}
- Living in: ${theirProfile.current_city}, ${theirProfile.current_state}
- Interests: ${(theirProfile.interests || []).join(', ')}
- Profession: ${theirProfile.profession || 'Not specified'}
- Bio snippet: "${(theirProfile.bio || '').substring(0, 100)}"

Common ground:
- Shared interests: ${sharedInterests.join(', ') || 'None yet'}
- Same country of origin: ${sameCountry ? 'Yes' : 'No'}
- Same city: ${sameCity ? 'Yes' : 'No'}
- Shared languages: ${sharedLanguages.join(', ') || 'English'}

Generate icebreakers that are:
1. Personal and reference something specific about them
2. Include a question to encourage response
3. Culturally aware when relevant
4. Warm and genuine, not cheesy
5. Varying in style (playful, thoughtful, cultural, interest-based, compliment)

Return as JSON array of objects with "message" and "type" (playful/thoughtful/cultural/interest/compliment).`;

    const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
            type: 'object',
            properties: {
                icebreakers: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            type: { type: 'string' }
                        }
                    }
                }
            }
        }
    });

    return Response.json({ 
        icebreakers: response.icebreakers || [],
        commonGround: {
            sharedInterests,
            sameCountry,
            sameCity,
            sameReligion,
            sharedLanguages
        }
    });
}

// Get conversation topic suggestions for ongoing chats
async function getConversationTopics(base44, { matchId, myProfileId }) {
    // Get match and both profiles
    const matches = await base44.entities.Match.filter({ id: matchId });
    const match = matches[0];
    
    if (!match) {
        return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    const theirProfileId = match.user1_id === myProfileId ? match.user2_id : match.user1_id;
    
    const [myProfiles, theirProfiles, recentMessages] = await Promise.all([
        base44.entities.UserProfile.filter({ id: myProfileId }),
        base44.entities.UserProfile.filter({ id: theirProfileId }),
        base44.entities.Message.filter({ match_id: matchId }, '-created_date', 20)
    ]);

    const myProfile = myProfiles[0];
    const theirProfile = theirProfiles[0];

    // Extract topics already discussed from messages
    const messageContents = recentMessages.map(m => m.content).join(' ');

    const prompt = `Suggest 4 conversation topics for a couple who matched on a dating app.

Their profiles:
Person 1 (${myProfile.display_name}): ${myProfile.country_of_origin}, interests: ${(myProfile.interests || []).join(', ')}
Person 2 (${theirProfile.display_name}): ${theirProfile.country_of_origin}, interests: ${(theirProfile.interests || []).join(', ')}

Recent conversation summary: "${messageContents.substring(0, 300) || 'Just started chatting'}"

Suggest topics that:
1. Build deeper connection
2. Are culturally relevant to their backgrounds
3. Haven't been discussed yet (based on messages)
4. Progress naturally from getting-to-know-you to deeper connection

Return JSON with topics array, each having: topic, opening_question, why_relevant`;

    const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
            type: 'object',
            properties: {
                topics: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            topic: { type: 'string' },
                            opening_question: { type: 'string' },
                            why_relevant: { type: 'string' }
                        }
                    }
                }
            }
        }
    });

    return Response.json({ topics: response.topics || [] });
}

// Get smart reply suggestions based on the last message
async function getResponseSuggestions(base44, { matchId, lastMessage, myProfileId }) {
    const matches = await base44.entities.Match.filter({ id: matchId });
    const match = matches[0];
    
    if (!match) {
        return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    const theirProfileId = match.user1_id === myProfileId ? match.user2_id : match.user1_id;
    
    const [myProfiles, theirProfiles] = await Promise.all([
        base44.entities.UserProfile.filter({ id: myProfileId }),
        base44.entities.UserProfile.filter({ id: theirProfileId })
    ]);

    const myProfile = myProfiles[0];
    const theirProfile = theirProfiles[0];

    const prompt = `Generate 3 natural response options to this message on a dating app.

Context:
- You are ${myProfile.display_name}, from ${myProfile.country_of_origin}
- Chatting with ${theirProfile.display_name}, from ${theirProfile.country_of_origin}
- Your interests: ${(myProfile.interests || []).join(', ')}

Their message: "${lastMessage}"

Generate 3 response options that are:
1. Natural and conversational
2. Show interest and engagement
3. Keep the conversation flowing
4. Varying in tone (one playful, one thoughtful, one enthusiastic)

Return as JSON array of response strings.`;

    const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
            type: 'object',
            properties: {
                responses: {
                    type: 'array',
                    items: { type: 'string' }
                }
            }
        }
    });

    return Response.json({ suggestions: response.responses || [] });
}

function formatEnum(value) {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}