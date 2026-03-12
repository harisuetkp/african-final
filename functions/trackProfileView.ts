import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { viewed_profile_id, view_source } = await req.json();
    
    if (!viewed_profile_id) {
      return Response.json({ error: 'viewed_profile_id required' }, { status: 400 });
    }

    // Get viewer's profile
    const viewerProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (!viewerProfiles.length) {
      return Response.json({ error: 'Viewer profile not found' }, { status: 404 });
    }
    
    const viewerProfile = viewerProfiles[0];
    
    // Don't log self-views
    if (viewerProfile.id === viewed_profile_id) {
      return Response.json({ success: true, skipped: true });
    }

    // Check for recent view to prevent spam (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentViews = await base44.entities.ProfileView.filter({
      viewer_profile_id: viewerProfile.id,
      viewed_profile_id: viewed_profile_id,
      created_date: { $gte: oneHourAgo }
    });

    if (recentViews.length > 0) {
      return Response.json({ success: true, skipped: true, reason: 'recent_view' });
    }

    // Create view record
    await base44.entities.ProfileView.create({
      viewer_profile_id: viewerProfile.id,
      viewed_profile_id: viewed_profile_id,
      view_date: new Date().toISOString(),
      view_source: view_source || 'discovery'
    });

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});