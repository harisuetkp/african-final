import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Generate signed URLs for private photos on-demand
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_uri, profile_id } = await req.json();

    if (!file_uri) {
      return Response.json({ error: 'Missing file_uri' }, { status: 400 });
    }

    // Verify access: User can only access photos of:
    // 1. Their own profile
    // 2. Profiles they've matched with
    const myProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (myProfiles.length === 0) {
        return Response.json({ error: 'Profile not found' }, { status: 404 });
    }
    const myProfile = myProfiles[0];

    if (profile_id !== myProfile.id) {
      // Check if they have a match
      const matches = await base44.entities.Match.filter({
        $or: [
          { user1_id: myProfile.id, user2_id: profile_id, is_match: true },
          { user1_id: profile_id, user2_id: myProfile.id, is_match: true }
        ]
      });

      if (matches.length === 0) {
        return Response.json({ error: 'Forbidden: No access to this photo' }, { status: 403 });
      }
    }

    // Generate signed URL (expires in 1 hour)
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 3600
    });

    return Response.json({ 
      signed_url,
      expires_at: new Date(Date.now() + 3600000).toISOString()
    });

  } catch (error) {
    console.error('Signed URL generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});