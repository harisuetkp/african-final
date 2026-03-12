import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// SECURE: Upload photos to PRIVATE storage with signed URLs
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. Validate File Type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        return Response.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 });
    }

    // 2. Validate File Size (e.g. 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return Response.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    // Upload to PRIVATE storage (requires signed URLs to access)
    const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ 
      file 
    });

    // Generate initial signed URL (expires in 1 hour)
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 3600 // 1 hour
    });

    return Response.json({ 
      file_uri,      // Private reference - store in DB
      signed_url,    // Temporary access URL
      expires_at: new Date(Date.now() + 3600000).toISOString()
    });

  } catch (error) {
    console.error('Private photo upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});