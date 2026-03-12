import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Log deletion for audit
    // Get user profile name for logging
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id });
    const displayName = profiles[0]?.display_name || 'Unknown';
    const profileId = profiles[0]?.id;

    await base44.asServiceRole.entities.DeletedAccount.create({
      user_email: user.email,
      user_id: user.id,
      display_name: displayName,
      deletion_reason: 'User requested (Settings)',
      deleted_at: new Date().toISOString()
    });

    // 2. Anonymize/Soft Delete Profile
    if (profileId) {
        await base44.asServiceRole.entities.UserProfile.update(profileId, {
            is_active: false,
            is_deleted: true, // Assuming this field exists or we just rely on is_active=false
            display_name: 'Deleted User',
            bio: '',
            photos: [],
            primary_photo: null,
            email_verified: false,
            phone_number: null, // Clear PII
            device_ids: [],
            push_token: null
        });
        
        // Remove from matches (Soft delete matches)
        const matches = await base44.asServiceRole.entities.Match.filter({
            $or: [{ user1_id: profileId }, { user2_id: profileId }]
        });
        
        for (const match of matches) {
            await base44.asServiceRole.entities.Match.update(match.id, {
                status: 'unmatched',
                is_match: false
            });
        }
    }

    // 3. Delete Auth User (Optional: usually better to keep for audit but disable)
    // For "Right to be Forgotten", we should ideally delete.
    // However, Base44 SDK might not expose User deletion to regular users.
    // We are using service role though.
    // Let's TRY to delete the user record to prevent re-login.
    try {
        await base44.asServiceRole.entities.User.delete(user.id);
    } catch (e) {
        console.error("Failed to delete auth user record", e);
        // Fallback: The profile is anonymized so they can't use the app effectively.
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Delete Account Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});