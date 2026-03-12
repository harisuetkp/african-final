import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Comprehensive analytics tracking with batching support
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    // Support both single event and batch events
    const events = Array.isArray(body) ? body : [body];
    const results = [];

    for (const event of events) {
      const { eventType, userId, properties = {}, timestamp } = event;

      if (!eventType) {
        results.push({ success: false, error: 'Event type required' });
        continue;
      }

      // Enrich with standard metadata
      const enrichedProperties = {
        ...properties,
        client_timestamp: timestamp || new Date().toISOString(),
        user_agent: req.headers.get('user-agent')?.substring(0, 200),
        referer: req.headers.get('referer')
      };

      // Create analytics entry
      await base44.asServiceRole.entities.ProfileAnalytics.create({
        user_profile_id: userId || 'anonymous',
        event_type: eventType,
        event_data: enrichedProperties,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      });

      // Update aggregate counters for specific events
      if (userId && userId !== 'anonymous') {
        try {
          switch (eventType) {
            case 'profile_view':
              // Increment daily views
              const todayDate = new Date().toISOString().split('T')[0];
              const existingAnalytics = await base44.asServiceRole.entities.ProfileAnalytics.filter({
                user_profile_id: properties.viewed_profile_id,
                date: todayDate,
                event_type: 'daily_aggregate'
              });
              
              if (existingAnalytics.length > 0) {
                await base44.asServiceRole.entities.ProfileAnalytics.update(existingAnalytics[0].id, {
                  views_count: (existingAnalytics[0].views_count || 0) + 1
                });
              }
              break;
              
            case 'like_sent':
              // Track likes for analytics
              break;
              
            case 'match_created':
              // Track matches
              break;
              
            case 'message_sent':
              // Track messages
              break;
          }
        } catch (e) {
          console.error('Aggregate update failed:', e);
        }
      }

      results.push({ success: true, eventType });
    }

    return Response.json({ 
      success: true, 
      processed: results.length,
      results 
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});