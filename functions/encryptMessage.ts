import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ENCRYPTION: Messages encrypted at rest (AES-256)
// NOTE: This requires a symmetric encryption key stored in secrets

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message_id, content } = await req.json();

    if (!message_id || !content) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const ENCRYPTION_KEY = Deno.env.get('MESSAGE_ENCRYPTION_KEY');
    
    if (!ENCRYPTION_KEY) {
      console.warn('MESSAGE_ENCRYPTION_KEY not set - messages stored in plaintext');
      // Fallback: Store without encryption (still recommend setting key)
      return Response.json({ 
        encrypted_content: content,
        is_encrypted: false 
      });
    }

    // Convert key to CryptoKey
    const keyData = new TextEncoder().encode(ENCRYPTION_KEY.substring(0, 32)); // Use first 32 chars
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate IV (initialization vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encodedContent = new TextEncoder().encode(content);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encodedContent
    );

    // Combine IV + encrypted data for storage
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Base64 encode for storage
    const base64Encrypted = btoa(String.fromCharCode(...combined));

    return Response.json({ 
      encrypted_content: base64Encrypted,
      is_encrypted: true
    });

  } catch (error) {
    console.error('Message encryption error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});