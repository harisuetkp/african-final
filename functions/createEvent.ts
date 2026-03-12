import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
        title, description, event_type, image_url, start_date, end_date,
        is_virtual, virtual_link, location_name, location_address, city, country,
        max_attendees, price, currency, tags, is_featured
    } = await req.json();

    // 0. Input Validation (Security)
    if (!title || title.length > 100) return Response.json({ error: 'Title too long (max 100)' }, { status: 400 });
    if (description && description.length > 2000) return Response.json({ error: 'Description too long (max 2000)' }, { status: 400 });
    if (price && parseFloat(price) < 0) return Response.json({ error: 'Price cannot be negative' }, { status: 400 });
    if (new Date(start_date) < new Date()) return Response.json({ error: 'Event must be in the future' }, { status: 400 });

    // 1. Validate User Eligibility
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (profiles.length === 0) return Response.json({ error: 'Profile not found' }, { status: 404 });
    const profile = profiles[0];

    // Check Elite or VIP
    const isEliteOrUp = ['elite', 'vip'].includes(profile.subscription_tier);

    if (!isEliteOrUp) {
        return Response.json({ error: 'Event creation is restricted to Elite and VIP members.' }, { status: 403 });
    }

    // 2. Validate "Featured" Status (VIP Only)
    const allowedFeatured = is_featured && profile.subscription_tier === 'vip';

    // 3. Create Event
    const event = await base44.entities.Event.create({
        title,
        description,
        event_type,
        image_url,
        start_date,
        end_date,
        is_virtual,
        virtual_link,
        location_name,
        location_address,
        city,
        country,
        organizer_id: profile.id,
        attendees: [profile.id], // Organizer automatically attends
        max_attendees: max_attendees ? parseInt(max_attendees) : null,
        price: parseFloat(price) || 0,
        currency: currency || 'USD',
        tags: tags || [],
        is_featured: allowedFeatured
    });

    // 4. Notify Organizer
    await base44.asServiceRole.entities.Notification.create({
        user_profile_id: profile.id,
        type: 'system',
        title: 'Event Published! 🎉',
        message: `Your event "${title}" is live.`,
        link_to: `EventDetails?id=${event.id}`
    });

    return Response.json({ success: true, event_id: event.id });

  } catch (error) {
    console.error('Create Event Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});