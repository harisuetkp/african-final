import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// DECRYPTION: Decrypt messages for authorized users only
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message_id, encrypted_content } = await req.json();

    if (!message_id || !encrypted_content) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Verify user has access to this message
    const messages = await base44.entities.Message.filter({ id: message_id });
    if (messages.length === 0) {
      return Response.json({ error: 'Message not found' }, { status: 404 });
    }

    const message = messages[0];
    const myProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    const myProfile = myProfiles[0];

    // Check if user is sender or receiver
    if (message.sender_id !== myProfile.id && message.receiver_id !== myProfile.id) {
      return Response.json({ error: 'Forbidden: Not your message' }, { status: 403 });
    }

    const ENCRYPTION_KEY = Deno.env.get('MESSAGE_ENCRYPTION_KEY');
    
    if (!ENCRYPTION_KEY) {
      // Not encrypted, return as-is
      return Response.json({ 
        decrypted_content: encrypted_content,
        is_encrypted: false 
      });
    }

    // Decode base64
    const combined = Uint8Array.from(atob(encrypted_content), c => c.charCodeAt(0));

    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Convert key to CryptoKey
    const keyData = new TextEncoder().encode(ENCRYPTION_KEY.substring(0, 32));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedData
    );

    const decryptedContent = new TextDecoder().decode(decryptedData);

    return Response.json({ 
      decrypted_content: decryptedContent,
      is_encrypted: true
    });

  } catch (error) {
    console.error('Message decryption error:', error);
    return Response.json({ error: 'Decryption failed' }, { status: 500 });
  }
});