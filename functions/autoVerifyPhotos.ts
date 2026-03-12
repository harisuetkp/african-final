import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function can be called by automation system or admin manually
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (e) {
      // Called by automation system without user context - allowed
    }
    
    let retryCount = 0;
    const maxRetries = 3;
    
    const executeWithRetry = async (fn) => {
      while (retryCount < maxRetries) {
        try {
          return await fn();
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) throw error;
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    };
    
    // Get all pending verification requests
    const pendingVerifications = await base44.asServiceRole.entities.VerificationRequest.filter({
      status: 'pending',
      verification_type: { $in: ['photo', 'id'] }
    });

    const results = [];

    for (const verification of pendingVerifications) {
      // Get user profile
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({
        id: verification.user_profile_id
      });

      if (profiles.length === 0) continue;
      const profile = profiles[0];

      // AI verification for photo verification
      if (verification.verification_type === 'photo') {
        const aiAnalysis = await executeWithRetry(() => 
          base44.integrations.Core.InvokeLLM({
          prompt: `You are a photo verification AI. Analyze if this selfie matches the profile photos. 
          Profile photos: ${profile.photos?.join(', ') || 'None'}
          Verification selfie: ${verification.submitted_photo_url}
          
          Check for:
          1. Same person (facial features match)
          2. Live photo (not a screenshot or fake)
          3. Clear visibility (not blurry, well-lit)
          4. Appropriate pose (no inappropriate content)
          
          Return confidence score 0-100 and detailed reason.`,
          response_json_schema: {
            type: "object",
            properties: {
              is_verified: { type: "boolean" },
              confidence_score: { type: "number" },
              reason: { type: "string" },
              flags: { type: "array", items: { type: "string" } }
            }
          },
          file_urls: [verification.submitted_photo_url, ...(profile.photos || []).slice(0, 2)]
        }));

        // Auto-approve if high confidence (85+)
        if (aiAnalysis.confidence_score >= 85 && aiAnalysis.is_verified) {
          await base44.asServiceRole.entities.VerificationRequest.update(verification.id, {
            status: 'approved',
            reviewed_by: 'AI_AUTO',
            ai_confidence_score: aiAnalysis.confidence_score
          });

          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            verification_status: {
              ...profile.verification_status,
              photo_verified: true
            }
          });

          // Add verified badge
          const badges = profile.badges || [];
          if (!badges.includes('verified')) {
            await base44.asServiceRole.entities.UserProfile.update(profile.id, {
              badges: [...badges, 'verified']
            });
          }

          results.push({ id: verification.id, status: 'auto_approved', confidence: aiAnalysis.confidence_score });
        } 
        // Auto-reject if very low confidence (< 50)
        else if (aiAnalysis.confidence_score < 50 && !aiAnalysis.is_verified) {
          await base44.asServiceRole.entities.VerificationRequest.update(verification.id, {
            status: 'rejected',
            reviewed_by: 'AI_AUTO',
            rejection_reason: aiAnalysis.reason,
            ai_confidence_score: aiAnalysis.confidence_score
          });

          results.push({ id: verification.id, status: 'auto_rejected', confidence: aiAnalysis.confidence_score });
        }
        // Flag for manual review (50-85)
        else {
          await base44.asServiceRole.entities.VerificationRequest.update(verification.id, {
            ai_confidence_score: aiAnalysis.confidence_score
          });

          // Create admin notification for manual review
          await base44.asServiceRole.entities.Notification.create({
            user_profile_id: 'admin',
            type: 'admin_message',
            title: 'Verification Requires Manual Review',
            message: `User ${profile.display_name} - Confidence: ${aiAnalysis.confidence_score}%. Reason: ${aiAnalysis.reason}`,
            is_admin: true
          });

          results.push({ id: verification.id, status: 'flagged_for_review', confidence: aiAnalysis.confidence_score });
        }
      }

      // AI verification for ID documents
      if (verification.verification_type === 'id') {
        const aiAnalysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Verify this ID document. Check for:
          1. Valid government-issued ID (passport, driver's license, national ID)
          2. Clear photo and text (not blurry)
          3. Not expired
          4. No signs of tampering or forgery
          5. Face matches profile photo: ${profile.primary_photo}
          
          Return confidence score 0-100 and detailed assessment.`,
          response_json_schema: {
            type: "object",
            properties: {
              is_valid: { type: "boolean" },
              confidence_score: { type: "number" },
              document_type: { type: "string" },
              issues_found: { type: "array", items: { type: "string" } },
              recommendation: { type: "string" }
            }
          },
          file_urls: [verification.submitted_id_url, profile.primary_photo]
        });

        // Auto-approve if high confidence (90+)
        if (aiAnalysis.confidence_score >= 90 && aiAnalysis.is_valid) {
          await base44.asServiceRole.entities.VerificationRequest.update(verification.id, {
            status: 'approved',
            reviewed_by: 'AI_AUTO',
            ai_confidence_score: aiAnalysis.confidence_score
          });

          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            verification_status: {
              ...profile.verification_status,
              id_verified: true
            }
          });

          results.push({ id: verification.id, status: 'auto_approved', confidence: aiAnalysis.confidence_score });
        }
        // Always flag ID for manual review if confidence < 90 (stricter for legal IDs)
        else {
          await base44.asServiceRole.entities.VerificationRequest.update(verification.id, {
            ai_confidence_score: aiAnalysis.confidence_score
          });

          await base44.asServiceRole.entities.Notification.create({
            user_profile_id: 'admin',
            type: 'admin_message',
            title: 'ID Verification Requires Manual Review',
            message: `User ${profile.display_name} - ${aiAnalysis.document_type} - Issues: ${aiAnalysis.issues_found.join(', ')}`,
            is_admin: true
          });

          results.push({ id: verification.id, status: 'flagged_for_review', confidence: aiAnalysis.confidence_score });
        }
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});