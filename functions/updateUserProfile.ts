import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    
    // Check if this is an admin/system call with profile_id and updates
    if (body.profile_id && body.updates) {
      // System-level update (from other functions like checkExpiredTrials)
      const { profile_id, updates } = body;
      
      // Whitelist allowed system updates
      const allowedSystemFields = [
        'is_premium', 'subscription_tier', 'premium_until',
        'is_banned', 'is_suspended', 'suspension_expires_at', 'suspension_reason', 'ban_reason',
        'violation_count', 'warning_count', 'is_active',
        'founding_member_converted', 'founding_member_converted_at'
      ];
      
      const safeUpdates = {};
      for (const key of Object.keys(updates)) {
        if (allowedSystemFields.includes(key)) {
          safeUpdates[key] = updates[key];
        }
      }
      
      if (Object.keys(safeUpdates).length > 0) {
        await base44.asServiceRole.entities.UserProfile.update(profile_id, safeUpdates);
      }
      
      return Response.json({ success: true, updated_fields: Object.keys(safeUpdates) });
    }
    
    // Regular user update flow
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
        display_name, bio, birth_date, gender, photos, primary_photo,
        country_of_origin, current_country, current_city, tribe_ethnicity,
        languages, religion, education, profession, relationship_goal,
        height_cm, lifestyle, cultural_values, interests, looking_for,
        video_profile_url, push_token
    } = body;

    // 1. Get existing profile
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
        return Response.json({ error: 'Profile not found' }, { status: 404 });
    }
    const profile = profiles[0];

    // 1.1 Security Check: Banned/Suspended users cannot update profile
    if (profile.is_banned || profile.is_suspended) {
        return Response.json({ error: 'Account is restricted' }, { status: 403 });
    }

    // 2. Allowed Updates (Strict Whitelist)
    // We explicitly EXCLUDE: is_premium, subscription_tier, is_banned, violation_count, etc.
    const updateData = {
        display_name,
        bio,
        birth_date,
        gender,
        photos,
        primary_photo,
        country_of_origin,
        current_country,
        current_city,
        tribe_ethnicity,
        languages,
        religion,
        education,
        profession,
        relationship_goal,
        height_cm,
        lifestyle,
        cultural_values,
        interests,
        looking_for,
        video_profile_url,
        push_token,
        // Helper fields
        is_active: true,
        last_active: new Date().toISOString()
    };

    // 2.1 Validate Data Types (Security)
    if (updateData.video_profile_url && !updateData.video_profile_url.startsWith('http')) {
        delete updateData.video_profile_url; // Prevent javascript: URIs
    }
    
    if (updateData.photos && !Array.isArray(updateData.photos)) {
        delete updateData.photos;
    }

    // Remove undefined/null values to avoid overwriting with nulls if not sent
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    // 3. Perform Update
    await base44.entities.UserProfile.update(profile.id, updateData);

    return Response.json({ success: true });

  } catch (error) {
    console.error('Update Profile Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});