import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { match_id, receiver_profile_id, gift_type, gift_emoji, message } = await req.json();

    // Get sender profile
    const senderProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (senderProfiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }
    const senderProfile = senderProfiles[0];

    // 1. Validate Match (Optional - if provided, check it. If not, try to find one)
    let validMatchId = match_id;

    if (!validMatchId) {
      // Try to find an existing match
      const existingMatches = await base44.entities.Match.filter({ 
        $or: [
          { user1_id: senderProfile.id, user2_id: receiver_profile_id },
          { user1_id: receiver_profile_id, user2_id: senderProfile.id }
        ]
      });
      if (existingMatches.length > 0) {
        validMatchId = existingMatches[0].id;
      }
    }

    // If still no match ID, we can still send the gift (it acts as a super-like/request)
    // But we need to handle the message creation carefully (might fail if message requires match_id)
    
    // Create virtual gift record
    const gift = await base44.asServiceRole.entities.VirtualGift.create({
      sender_profile_id: senderProfile.id,
      receiver_profile_id,
      match_id: validMatchId || 'pending', // Use placeholder if no match yet
      gift_type,
      gift_emoji,
      message: message || '',
      cost: 0,
      status: 'sent'
    });

    // Send notification to receiver
    await base44.asServiceRole.entities.Notification.create({
      user_profile_id: receiver_profile_id,
      type: 'message',
      title: `${senderProfile.display_name} sent you a gift!`,
      message: `You received ${gift_emoji}`,
      from_profile_id: senderProfile.id
    });

    // Create message in chat only if match exists
    if (validMatchId && validMatchId !== 'pending') {
      await base44.asServiceRole.entities.Message.create({
        match_id: validMatchId,
        sender_id: senderProfile.id,
        receiver_id: receiver_profile_id,
        content: `Sent you a gift ${gift_emoji}${message ? ': ' + message : ''}`,
        message_type: 'text'
      });
    }

    return Response.json({ 
      success: true, 
      gift 
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});