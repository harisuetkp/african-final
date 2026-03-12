import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { centerUrl, leftUrl, rightUrl } = await req.json();

    if (!centerUrl || !leftUrl || !rightUrl) {
      return Response.json({ error: 'Missing verification images' }, { status: 400 });
    }

    // Get user profile for reference photo
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }
    const profile = profiles[0];

    // AI Analysis
    // We send: Reference (Profile Photo), Center, Left, Right
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert identity verification AI. Compare 3 video frames against a Reference Profile Photo.

INPUTS:
1. Reference Photo: User's primary profile photo (Likely professional, good lighting, makeup, maybe filtered).
2. Center Frame: Webcam/Phone capture (Raw, likely poor lighting, no makeup, lens distortion).
3. Left Frame: Head turned left.
4. Right Frame: Head turned right.

VERIFICATION RULES (Lenient on Quality, Strict on Anatomy):
1. IDENTITY MATCH: Focus on BONE STRUCTURE (jawline, cheekbones, eye spacing, nose shape, ear placement). 
   - IGNORE: Skin texture, blemishes, makeup, facial hair length, hair style/color changes, lighting differences, and camera quality.
   - EXPECT: The "Reference" to look more polished/attractive than the "Frames". This is normal.
   - REJECT ONLY IF: Facial geometry is fundamentally different (e.g., different person).

2. LIVENESS CHECK:
   - "Center": Looking roughly forward.
   - "Left" & "Right": Head turned noticeably (doesn't need to be 90° profile, just turned).
   - Must be 3 distinct moments (not identical duplicates).

STRICTNESS:
- Identity: MODERATE. Prioritize geometric matches over superficial ones.
- Poses: LENIENT. Any noticeable turn is accepted.
- Quality: LENIENT. Accept blur/grain/shadows if face is visible.

RESPONSE FORMAT (JSON):
{
  "is_match": boolean, (true if likely the same person AND poses are valid)
  "confidence": number, (0-100, be generous for poor lighting)
  "poses_valid": {
    "center": boolean,
    "left": boolean,
    "right": boolean
  },
  "identity_valid": boolean,
  "reason": "Brief, helpful feedback for the user"
}`,
      file_urls: [profile.primary_photo, centerUrl, leftUrl, rightUrl],
      response_json_schema: {
        type: "object",
        properties: {
          is_match: { type: "boolean" },
          confidence: { type: "number" },
          poses_valid: {
            type: "object",
            properties: {
              center: { type: "boolean" },
              left: { type: "boolean" },
              right: { type: "boolean" }
            }
          },
          identity_valid: { type: "boolean" },
          reason: { type: "string" }
        }
      }
    });

    // Lowered threshold to account for webcam quality issues
    const isVerified = result.is_match && result.confidence >= 65;

    if (isVerified) {
      // Success - Update profile
      await base44.entities.UserProfile.update(profile.id, {
        verification_status: {
          ...profile.verification_status,
          photo_verified: true
        },
        verification_selfie_url: centerUrl, // Store the center frame as the verification proof
        ai_safety_score: Math.max(profile.ai_safety_score || 0, result.confidence)
      });
    }

    return Response.json({ ...result, verified: isVerified });

  } catch (error) {
    console.error('Video verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});