Deno.serve(async (req) => {
  try {
    const gaId = Deno.env.get('GOOGLE_ANALYTICS_ID');
    
    if (!gaId) {
      return Response.json({ ga_id: null });
    }

    return Response.json({ ga_id: gaId });
  } catch (error) {
    return Response.json({ ga_id: null });
  }
});