import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ML-powered matching engine that learns from user behavior
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, payload } = await req.json();

        switch (action) {
            case 'get_ml_scores':
                return await getMLScores(base44, payload);
            case 'update_weights':
                return await updateUserWeights(base44, payload);
            case 'record_interaction':
                return await recordInteraction(base44, payload);
            case 'get_recommendations':
                return await getRecommendations(base44, payload);
            case 'batch_update_weights':
                // Admin only
                if (user.role !== 'admin') {
                    return Response.json({ error: 'Admin access required' }, { status: 403 });
                }
                return await batchUpdateWeights(base44, payload);
            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('ML Engine error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// Calculate ML-powered compatibility scores
async function getMLScores(base44, { myProfileId, candidateIds }) {
    // Get user's ML profile (learned preferences)
    const mlProfiles = await base44.asServiceRole.entities.UserMLProfile.filter({ user_id: myProfileId });
    let mlProfile = mlProfiles[0];
    
    // Initialize ML profile if doesn't exist
    if (!mlProfile) {
        mlProfile = await base44.asServiceRole.entities.UserMLProfile.create({
            user_id: myProfileId,
            preference_weights: {
                cultural_background: 1.0,
                religion: 1.0,
                interests: 1.0,
                location: 1.0,
                education: 1.0,
                lifestyle: 1.0,
                relationship_goal: 1.0,
                age_proximity: 1.0
            },
            liked_patterns: { countries: [], religions: [], interests: [], professions: [], age_range: {} },
            passed_patterns: { countries: [], religions: [], interests: [] },
            engagement_stats: {
                avg_time_on_liked: 0,
                avg_time_on_passed: 0,
                total_likes: 0,
                total_passes: 0,
                total_matches: 0,
                total_conversations: 0,
                avg_messages_per_match: 0
            }
        });
    }

    // Get my profile
    const myProfiles = await base44.entities.UserProfile.filter({ id: myProfileId });
    const myProfile = myProfiles[0];
    if (!myProfile) return Response.json({ scores: {} });

    // Get candidate profiles
    const candidates = await base44.entities.UserProfile.filter({ id: { $in: candidateIds } });
    
    const scores = {};
    
    for (const candidate of candidates) {
        const result = calculateMLScore(myProfile, candidate, mlProfile);
        scores[candidate.id] = result;
    }

    return Response.json({ scores });
}

// Calculate ML-enhanced compatibility score with explanations
function calculateMLScore(myProfile, candidate, mlProfile) {
    const weights = mlProfile.preference_weights || {};
    const likedPatterns = mlProfile.liked_patterns || {};
    
    let score = 0;
    const reasons = [];
    const breakdown = {};

    // 1. Cultural Background (base: 25 points, weighted)
    let culturalScore = 0;
    if (myProfile.country_of_origin === candidate.country_of_origin) {
        culturalScore += 15;
        reasons.push(`Both from ${candidate.country_of_origin}`);
    }
    if (myProfile.tribe_ethnicity && candidate.tribe_ethnicity && 
        myProfile.tribe_ethnicity === candidate.tribe_ethnicity) {
        culturalScore += 10;
        reasons.push(`Shared heritage: ${candidate.tribe_ethnicity}`);
    }
    // Boost if user historically likes this country
    if (likedPatterns.countries?.includes(candidate.country_of_origin)) {
        culturalScore += 5;
    }
    breakdown.cultural = culturalScore;
    score += culturalScore * (weights.cultural_background || 1.0);

    // 2. Religion (base: 15 points, weighted)
    let religionScore = 0;
    if (myProfile.religion === candidate.religion) {
        religionScore = 15;
        reasons.push(`Shared faith: ${formatEnum(candidate.religion)}`);
    }
    if (likedPatterns.religions?.includes(candidate.religion)) {
        religionScore += 3;
    }
    breakdown.religion = religionScore;
    score += religionScore * (weights.religion || 1.0);

    // 3. Shared Interests (base: 20 points, weighted)
    let interestScore = 0;
    const sharedInterests = myProfile.interests?.filter(i => candidate.interests?.includes(i)) || [];
    interestScore = Math.min(sharedInterests.length * 4, 20);
    if (sharedInterests.length > 0) {
        reasons.push(`${sharedInterests.length} shared interests: ${sharedInterests.slice(0, 3).join(', ')}`);
    }
    // Boost interests that user historically likes
    const boostedInterests = sharedInterests.filter(i => likedPatterns.interests?.includes(i));
    interestScore += boostedInterests.length * 2;
    breakdown.interests = interestScore;
    score += interestScore * (weights.interests || 1.0);

    // 4. Location (base: 10 points, weighted)
    let locationScore = 0;
    if (myProfile.current_city === candidate.current_city) {
        locationScore = 10;
        reasons.push(`Both in ${candidate.current_city}`);
    } else if (myProfile.current_state === candidate.current_state) {
        locationScore = 5;
        reasons.push(`Both in ${candidate.current_state}`);
    }
    breakdown.location = locationScore;
    score += locationScore * (weights.location || 1.0);

    // 5. Relationship Goal (base: 15 points, weighted)
    let goalScore = 0;
    if (myProfile.relationship_goal === candidate.relationship_goal) {
        goalScore = 15;
        reasons.push(`Both looking for ${formatEnum(candidate.relationship_goal)}`);
    }
    breakdown.relationship_goal = goalScore;
    score += goalScore * (weights.relationship_goal || 1.0);

    // 6. Lifestyle Compatibility (base: 10 points, weighted)
    let lifestyleScore = 0;
    if (myProfile.lifestyle && candidate.lifestyle) {
        if (myProfile.lifestyle.smoking === candidate.lifestyle.smoking) lifestyleScore += 2;
        if (myProfile.lifestyle.drinking === candidate.lifestyle.drinking) lifestyleScore += 2;
        if (myProfile.lifestyle.fitness === candidate.lifestyle.fitness) lifestyleScore += 3;
        if (myProfile.lifestyle.diet === candidate.lifestyle.diet) lifestyleScore += 3;
    }
    if (lifestyleScore >= 6) {
        reasons.push('Compatible lifestyle choices');
    }
    breakdown.lifestyle = lifestyleScore;
    score += lifestyleScore * (weights.lifestyle || 1.0);

    // 7. Education (base: 5 points, weighted)
    let eduScore = 0;
    if (myProfile.education === candidate.education) {
        eduScore = 5;
    }
    breakdown.education = eduScore;
    score += eduScore * (weights.education || 1.0);

    // 8. Languages (bonus)
    const sharedLanguages = myProfile.languages?.filter(l => candidate.languages?.includes(l)) || [];
    if (sharedLanguages.length > 0) {
        score += sharedLanguages.length * 2;
        if (sharedLanguages.length > 1) {
            reasons.push(`${sharedLanguages.length} shared languages`);
        }
    }

    // 9. Age Proximity (base: 5 points)
    let ageScore = 0;
    if (myProfile.birth_date && candidate.birth_date) {
        const myAge = calculateAge(myProfile.birth_date);
        const theirAge = calculateAge(candidate.birth_date);
        const ageDiff = Math.abs(myAge - theirAge);
        if (ageDiff <= 3) ageScore = 5;
        else if (ageDiff <= 5) ageScore = 3;
        else if (ageDiff <= 10) ageScore = 1;
    }
    breakdown.age = ageScore;
    score += ageScore * (weights.age_proximity || 1.0);

    // Normalize to 0-100
    const maxPossible = 100;
    const normalizedScore = Math.min(Math.round((score / maxPossible) * 100), 100);

    return {
        score: normalizedScore,
        reasons: reasons.slice(0, 4), // Top 4 reasons
        breakdown,
        confidence: calculateConfidence(mlProfile)
    };
}

// Calculate confidence based on amount of training data
function calculateConfidence(mlProfile) {
    const stats = mlProfile.engagement_stats || {};
    const totalInteractions = (stats.total_likes || 0) + (stats.total_passes || 0);
    
    if (totalInteractions < 10) return 'learning';
    if (totalInteractions < 50) return 'moderate';
    if (totalInteractions < 100) return 'good';
    return 'excellent';
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

function formatEnum(value) {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Update user weights based on their behavior
async function updateUserWeights(base44, { userId }) {
    // Get user's interaction history
    const [likes, passes, matches, feedbacks] = await Promise.all([
        base44.asServiceRole.entities.Like.filter({ liker_id: userId }, '-created_date', 200),
        base44.asServiceRole.entities.Pass.filter({ passer_id: userId }, '-created_date', 200),
        base44.asServiceRole.entities.Match.filter({ 
            $or: [{ user1_id: userId }, { user2_id: userId }],
            is_match: true 
        }),
        base44.asServiceRole.entities.MatchFeedback.filter({ user_id: userId }, '-created_date', 100)
    ]);

    // Get profiles that were liked
    const likedIds = likes.map(l => l.liked_id);
    const passedIds = passes.map(p => p.passed_id);
    
    const [likedProfiles, passedProfiles] = await Promise.all([
        likedIds.length > 0 ? base44.asServiceRole.entities.UserProfile.filter({ id: { $in: likedIds } }) : [],
        passedIds.length > 0 ? base44.asServiceRole.entities.UserProfile.filter({ id: { $in: passedIds } }) : []
    ]);

    // Analyze patterns in liked profiles
    const likedPatterns = analyzePatterns(likedProfiles);
    const passedPatterns = analyzePatterns(passedProfiles);

    // Calculate dynamic weights based on what matters for this user's likes vs passes
    const weights = calculateDynamicWeights(likedProfiles, passedProfiles, feedbacks);

    // Get messages count for matched users
    const matchIds = matches.map(m => m.id);
    let avgMessagesPerMatch = 0;
    if (matchIds.length > 0) {
        const messages = await base44.asServiceRole.entities.Message.filter({ 
            match_id: { $in: matchIds },
            sender_id: userId
        });
        avgMessagesPerMatch = messages.length / matchIds.length;
    }

    // Update or create ML profile
    const existing = await base44.asServiceRole.entities.UserMLProfile.filter({ user_id: userId });
    
    const mlData = {
        user_id: userId,
        preference_weights: weights,
        liked_patterns: likedPatterns,
        passed_patterns: passedPatterns,
        engagement_stats: {
            total_likes: likes.length,
            total_passes: passes.length,
            total_matches: matches.length,
            avg_messages_per_match: avgMessagesPerMatch
        },
        last_model_update: new Date().toISOString()
    };

    if (existing.length > 0) {
        await base44.asServiceRole.entities.UserMLProfile.update(existing[0].id, mlData);
    } else {
        await base44.asServiceRole.entities.UserMLProfile.create(mlData);
    }

    return Response.json({ success: true, weights });
}

function analyzePatterns(profiles) {
    const countries = {};
    const religions = {};
    const interests = {};
    const professions = {};
    let minAge = 100, maxAge = 0;

    for (const p of profiles) {
        if (p.country_of_origin) countries[p.country_of_origin] = (countries[p.country_of_origin] || 0) + 1;
        if (p.religion) religions[p.religion] = (religions[p.religion] || 0) + 1;
        if (p.profession) professions[p.profession] = (professions[p.profession] || 0) + 1;
        
        for (const interest of (p.interests || [])) {
            interests[interest] = (interests[interest] || 0) + 1;
        }
        
        if (p.birth_date) {
            const age = calculateAge(p.birth_date);
            minAge = Math.min(minAge, age);
            maxAge = Math.max(maxAge, age);
        }
    }

    // Return top patterns (appearing in at least 20% of profiles)
    const threshold = Math.max(1, profiles.length * 0.2);
    
    return {
        countries: Object.entries(countries).filter(([_, c]) => c >= threshold).map(([k]) => k),
        religions: Object.entries(religions).filter(([_, c]) => c >= threshold).map(([k]) => k),
        interests: Object.entries(interests).filter(([_, c]) => c >= threshold).map(([k]) => k),
        professions: Object.entries(professions).filter(([_, c]) => c >= threshold).map(([k]) => k),
        age_range: profiles.length > 0 ? { min: minAge, max: maxAge } : {}
    };
}

function calculateDynamicWeights(likedProfiles, passedProfiles, feedbacks) {
    const weights = {
        cultural_background: 1.0,
        religion: 1.0,
        interests: 1.0,
        location: 1.0,
        education: 1.0,
        lifestyle: 1.0,
        relationship_goal: 1.0,
        age_proximity: 1.0
    };

    if (likedProfiles.length < 5) return weights; // Not enough data

    // Analyze what's common in liked vs passed
    const likedCountries = new Set(likedProfiles.map(p => p.country_of_origin).filter(Boolean));
    const passedCountries = new Set(passedProfiles.map(p => p.country_of_origin).filter(Boolean));
    
    // If user consistently likes same country, increase cultural weight
    if (likedCountries.size <= 2 && likedProfiles.length > 10) {
        weights.cultural_background = 1.5;
    }

    // Analyze religion consistency
    const likedReligions = new Set(likedProfiles.map(p => p.religion).filter(Boolean));
    if (likedReligions.size === 1 && likedProfiles.length > 10) {
        weights.religion = 1.8;
    }

    // Analyze feedback reasons
    for (const fb of feedbacks) {
        if (fb.feedback_reasons?.includes('no_common_interests')) {
            weights.interests += 0.1;
        }
        if (fb.feedback_reasons?.includes('different_values')) {
            weights.cultural_background += 0.1;
            weights.religion += 0.1;
        }
        if (fb.feedback_reasons?.includes('too_far')) {
            weights.location += 0.15;
        }
    }

    // Normalize weights to prevent extreme values
    const maxWeight = Math.max(...Object.values(weights));
    if (maxWeight > 2.0) {
        for (const key in weights) {
            weights[key] = weights[key] / maxWeight * 2.0;
        }
    }

    return weights;
}

// Record a user interaction for ML learning
async function recordInteraction(base44, { userId, targetProfileId, actionType, metadata }) {
    // Create feedback record
    await base44.asServiceRole.entities.MatchFeedback.create({
        user_id: userId,
        target_profile_id: targetProfileId,
        action_type: actionType,
        feedback_reasons: metadata.reasons || [],
        time_spent_on_profile_ms: metadata.timeSpent || 0,
        photos_viewed_count: metadata.photosViewed || 0,
        bio_expanded: metadata.bioExpanded || false
    });

    // Get current stats to decide if we should update weights
    const mlProfiles = await base44.asServiceRole.entities.UserMLProfile.filter({ user_id: userId });
    const stats = mlProfiles[0]?.engagement_stats || {};
    const totalInteractions = (stats.total_likes || 0) + (stats.total_passes || 0);

    // Update weights every 10 interactions
    if (totalInteractions > 0 && totalInteractions % 10 === 0) {
        await updateUserWeights(base44, { userId });
    }

    return Response.json({ success: true });
}

// Get personalized recommendations for a user
async function getRecommendations(base44, { userId, limit = 20 }) {
    // Get user's ML profile
    const mlProfiles = await base44.asServiceRole.entities.UserMLProfile.filter({ user_id: userId });
    const mlProfile = mlProfiles[0];
    
    // Get user's regular profile
    const myProfiles = await base44.entities.UserProfile.filter({ id: userId });
    const myProfile = myProfiles[0];
    if (!myProfile) return Response.json({ profiles: [], reason: 'Profile not found' });

    // Get profiles that user hasn't interacted with
    const [likes, passes] = await Promise.all([
        base44.entities.Like.filter({ liker_id: userId }),
        base44.entities.Pass.filter({ passer_id: userId })
    ]);
    
    const excludeIds = new Set([
        userId,
        ...likes.map(l => l.liked_id),
        ...passes.map(p => p.passed_id),
        ...(myProfile.blocked_users || [])
    ]);

    // Build query based on preferences
    const query = {
        id: { $nin: Array.from(excludeIds) },
        is_active: true,
        is_banned: false,
        is_suspended: false
    };

    // Add gender preference
    if (myProfile.looking_for?.length > 0) {
        query.gender = { $in: myProfile.looking_for };
    }

    // Fetch candidates
    const candidates = await base44.entities.UserProfile.filter(query, '-last_active', limit * 3);

    // Score and rank candidates
    const scoredCandidates = [];
    for (const candidate of candidates) {
        const result = calculateMLScore(myProfile, candidate, mlProfile || {
            preference_weights: {},
            liked_patterns: {}
        });
        scoredCandidates.push({
            profile: candidate,
            ...result
        });
    }

    // Sort by score and take top N
    scoredCandidates.sort((a, b) => b.score - a.score);
    const topCandidates = scoredCandidates.slice(0, limit);

    return Response.json({
        profiles: topCandidates.map(c => ({
            ...c.profile,
            matchScore: c.score,
            matchReasons: c.reasons,
            matchBreakdown: c.breakdown
        })),
        ml_confidence: mlProfile ? calculateConfidence(mlProfile) : 'new_user'
    });
}

// Batch update weights for multiple users (for scheduled job)
async function batchUpdateWeights(base44, { userIds }) {
    const results = [];
    
    for (const userId of userIds.slice(0, 50)) { // Limit batch size
        try {
            await updateUserWeights(base44, { userId });
            results.push({ userId, success: true });
        } catch (e) {
            results.push({ userId, success: false, error: e.message });
        }
    }
    
    return Response.json({ results, processed: results.length });
}