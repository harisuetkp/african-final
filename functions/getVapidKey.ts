// Returns VAPID public key for Firebase Cloud Messaging
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    const vapidKey = Deno.env.get("VAPID_KEY");
    
    if (!vapidKey) {
      console.warn('VAPID_KEY environment variable not set');
      return Response.json(
        { error: 'VAPID_KEY not configured', vapid_key: null },
        { 
          status: 200, // Return 200 so app doesn't break
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    return Response.json(
      { vapid_key: vapidKey },
      { 
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  } catch (error) {
    console.error('getVapidKey error:', error);
    return Response.json(
      { error: error.message, vapid_key: null },
      { 
        status: 200, // Return 200 so app doesn't break
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
});