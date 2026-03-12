import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { communityId, content, messageType, mediaUrl } = await req.json();

    if (!content && !mediaUrl) {
        return Response.json({ error: 'Content required' }, { status: 400 });
    }

    // 1. Get User Profile & Check Tier
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (profiles.length === 0) return Response.json({ error: 'Profile not found' }, { status: 404 });
    const profile = profiles[0];

    // Enforce Premium for Community Chat
    const allowedTiers = ['premium', 'elite', 'vip'];
    if (!allowedTiers.includes(profile.subscription_tier)) {
        return Response.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    // Enforce Elite/VIP for Media
    if (mediaUrl || (messageType !== 'text' && messageType !== 'ice_breaker')) {
        const mediaTiers = ['elite', 'vip'];
        if (!mediaTiers.includes(profile.subscription_tier)) {
             return Response.json({ error: 'Media sharing requires Elite or VIP subscription' }, { status: 403 });
        }
    }

    // 2. AI Moderation (Text only)
    if (messageType === 'text' && content) {
        try {
            const moderationResult = await base44.integrations.Core.InvokeLLM({
                prompt: `Is this message appropriate for a friendly community chat? 
                Ignore minor slang, but flag hate speech, severe harassment, or explicit sexual content.
                Message: "${content}"
                
                Reply ONLY with "yes" or "no".`,
            });
            
            if (moderationResult && moderationResult.toLowerCase().includes('no')) {
                return Response.json({ error: 'Message flagged as inappropriate' }, { status: 400 });
            }
        } catch (e) {
            console.error("AI Moderation failed", e);
            // Fail open or closed? Let's fail open for reliability but log it
        }
    }

    // 3. Create Message
    // We use service role to ensure it bypasses any potential RLS that requires a "Match" entity
    await base44.asServiceRole.entities.Message.create({
        match_id: `community_${communityId}`,
        sender_id: profile.id,
        receiver_id: communityId, // Using communityId as receiver
        content: content || '',
        message_type: messageType || 'text',
        media_url: mediaUrl,
        is_read: true // Public messages are effectively read
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Send Community Message Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});