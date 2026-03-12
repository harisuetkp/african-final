import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Verify that profile photos match the verified identity selfie
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profile_id, profile_photo_urls } = await req.json();

    if (!profile_id || !profile_photo_urls || profile_photo_urls.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify Ownership (CRITICAL)
    const myProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (myProfiles.length === 0) return Response.json({ error: 'Profile not found' }, { status: 404 });
    
    if (myProfiles[0].id !== profile_id) {
        return Response.json({ error: 'Unauthorized: You can only verify your own photos' }, { status: 403 });
    }

    // Get user's verification selfie
    const profile = await base44.asServiceRole.entities.UserProfile.filter({ id: profile_id });
    if (profile.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const verificationSelfie = profile[0].verification_selfie_url;
    if (!verificationSelfie) {
      return Response.json({ 
        verified: false, 
        reason: 'No verification selfie found. Please complete ID verification first.' 
      });
    }

    // Use AI to compare profile photos with verification selfie
    const aiAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Compare these images to verify they are the same person:

Image 1: Verification selfie (trusted source from ID verification)
Images 2+: Profile photos uploaded by user

Task: Determine if ALL profile photos show the SAME person as the verification selfie.

Requirements:
1. Do the profile photos match the face in the verification selfie?
2. Are the profile photos clear and show the person's face?
3. Do any photos appear fake, AI-generated, or heavily filtered?
4. Are all photos of the same person?

Respond ONLY in JSON format:
{
  "all_photos_match": true/false,
  "confidence": 0-100,
  "photos_analyzed": number,
  "photos_match_count": number,
  "fake_or_filtered": true/false,
  "reasoning": "brief explanation",
  "should_approve": true/false
}`,
      file_urls: [verificationSelfie, ...profile_photo_urls],
      response_json_schema: {
        type: "object",
        properties: {
          all_photos_match: { type: "boolean" },
          confidence: { type: "number" },
          photos_analyzed: { type: "number" },
          photos_match_count: { type: "number" },
          fake_or_filtered: { type: "boolean" },
          reasoning: { type: "string" },
          should_approve: { type: "boolean" }
        }
      }
    });

    // Auto-approve if confidence is high and all photos match
    if (aiAnalysis.should_approve && aiAnalysis.confidence >= 75 && aiAnalysis.all_photos_match && !aiAnalysis.fake_or_filtered) {
      // Grant verified badge
      await base44.asServiceRole.entities.UserProfile.update(profile_id, {
        verification_status: {
          ...profile[0].verification_status,
          photo_verified: true
        }
      });

      return Response.json({
        verified: true,
        confidence: aiAnalysis.confidence,
        message: 'Profile photos verified! Verified badge granted.',
        analysis: aiAnalysis
      });
    } else {
      // Reject - photos don't match or suspicious
      return Response.json({
        verified: false,
        confidence: aiAnalysis.confidence,
        reason: aiAnalysis.reasoning,
        message: 'Profile photos do not match your verified identity. Please use real photos of yourself.',
        analysis: aiAnalysis
      });
    }
  } catch (error) {
    console.error('Photo verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});