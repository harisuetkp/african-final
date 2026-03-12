import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Helper to calculate distance (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
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

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = Date.now();
        
        // Try to use KV for rate limiting, but don't fail if unavailable
        let kv;
        try {
            kv = await Deno.openKv();
            const rateKey = ["discovery_rate", user.id];
            const rateData = await kv.get(rateKey);
            
            const windowMs = 60000;
            const maxRequests = 20;
            
            let requests = [];
            if (rateData.value) {
                requests = rateData.value.filter(time => now - time < windowMs);
            }
            
            if (requests.length >= maxRequests) {
                return Response.json({ error: 'Rate limit exceeded. Please slow down.' }, { status: 429 });
            }
            
            requests.push(now);
            await kv.set(rateKey, requests, { expireIn: 60000 });
        } catch (kvError) {
            console.log('KV unavailable, skipping rate limit:', kvError.message);
        }

        const { filters = {}, mode = 'global', limit = 20, myProfileId, cursor } = await req.json();

        // 1. Get My Profile
        let myProfile;
        if (myProfileId) {
             const p = await base44.entities.UserProfile.filter({ id: myProfileId });
             myProfile = p[0];
        }
        if (!myProfile) {
             const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
             myProfile = profiles[0];
        }
        if (!myProfile) return Response.json({ profiles: [], nextCursor: null });

        // 2. Get excludes (with optional KV caching)
        let excludeIds = new Set();
        
        try {
            if (kv) {
                const excludeCacheKey = ["excludes", myProfile.id];
                const cachedExcludes = await kv.get(excludeCacheKey);
                if (cachedExcludes.value && (now - cachedExcludes.value.timestamp) < 300000) {
                    excludeIds = new Set(cachedExcludes.value.ids);
                } else {
                    const [passes, likes] = await Promise.all([
                        base44.entities.Pass.filter({ passer_id: myProfile.id }, '-created_date', 500),
                        base44.entities.Like.filter({ liker_id: myProfile.id }, '-created_date', 500)
                    ]);
                    
                    excludeIds = new Set([
                        myProfile.id, 
                        ...passes.map(p => p.passed_id), 
                        ...likes.map(l => l.liked_id),
                        ...(myProfile.blocked_users || [])
                    ]);
                    
                    await kv.set(excludeCacheKey, {
                        ids: Array.from(excludeIds),
                        timestamp: now
                    }, { expireIn: 300000 });
                }
            } else {
                // No KV, fetch directly
                const [passes, likes] = await Promise.all([
                    base44.entities.Pass.filter({ passer_id: myProfile.id }, '-created_date', 500),
                    base44.entities.Like.filter({ liker_id: myProfile.id }, '-created_date', 500)
                ]);
                
                excludeIds = new Set([
                    myProfile.id, 
                    ...passes.map(p => p.passed_id), 
                    ...likes.map(l => l.liked_id),
                    ...(myProfile.blocked_users || [])
                ]);
            }
        } catch (cacheError) {
            console.log('Cache error, fetching fresh:', cacheError.message);
            const [passes, likes] = await Promise.all([
                base44.entities.Pass.filter({ passer_id: myProfile.id }, '-created_date', 500),
                base44.entities.Like.filter({ liker_id: myProfile.id }, '-created_date', 500)
            ]);
            
            excludeIds = new Set([
                myProfile.id, 
                ...passes.map(p => p.passed_id), 
                ...likes.map(l => l.liked_id),
                ...(myProfile.blocked_users || [])
            ]);
        }

        // 3. Build Database Query
        let query = { 
            is_active: true,
            is_deleted: { $ne: true }, 
            id: { $nin: Array.from(excludeIds) },
            blocked_users: { $ne: myProfile.id },
            current_country: { $in: ['USA', 'United States', 'Canada', 'United States of America', 'US'] }
        };

        // Cursor-based pagination
        if (cursor) {
            query.id = { ...query.id, $gt: cursor };
        }

        // Gender Preference
        if (myProfile.looking_for && myProfile.looking_for.length > 0) {
            query.gender = { $in: myProfile.looking_for };
        }

        // Age Filter
        const today = new Date();
        if (filters.age_min) {
            const maxBirthDate = new Date(today.getFullYear() - filters.age_min, today.getMonth(), today.getDate()).toISOString().split('T')[0];
            query.birth_date = { ...query.birth_date, $lte: maxBirthDate };
        }
        if (filters.age_max) {
            const minBirthDate = new Date(today.getFullYear() - filters.age_max - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
            query.birth_date = { ...query.birth_date, $gte: minBirthDate };
        }

        // Simple Filters
        if (filters.religion) query.religion = filters.religion;
        if (filters.education) query.education = filters.education;
        if (filters.preferred_language) query.preferred_language = filters.preferred_language;
        
        // Array Filters
        if (filters.relationship_goals?.length > 0) query.relationship_goal = { $in: filters.relationship_goals };
        if (filters.countries_of_origin?.length > 0) query.country_of_origin = { $in: filters.countries_of_origin };
        if (filters.states?.length > 0) query.current_state = { $in: filters.states };

        // 4. Fetch Candidates with limit + 1 for cursor
        const fetchLimit = limit + 1;
        const candidates = await base44.entities.UserProfile.filter(query, '-last_active', fetchLimit);

        // Determine next cursor
        let nextCursor = null;
        if (candidates.length > limit) {
            nextCursor = candidates[limit - 1].id;
            candidates.pop();
        }

        // 5. Get ML profile (with optional caching)
        let mlProfile = {
            preference_weights: {
                cultural_background: 1.0, religion: 1.0, interests: 1.0, location: 1.0,
                education: 1.0, lifestyle: 1.0, relationship_goal: 1.0, age_proximity: 1.0
            },
            liked_patterns: { countries: [], religions: [], interests: [] }
        };
        
        try {
            if (kv) {
                const mlCacheKey = ["ml_profile", myProfile.id];
                const cachedML = await kv.get(mlCacheKey);
                if (cachedML.value && (now - cachedML.value.timestamp) < 600000) {
                    mlProfile = cachedML.value.data;
                } else {
                    const mlProfiles = await base44.asServiceRole.entities.UserMLProfile.filter({ user_id: myProfile.id });
                    if (mlProfiles[0]) mlProfile = mlProfiles[0];
                    
                    await kv.set(mlCacheKey, { data: mlProfile, timestamp: now }, { expireIn: 600000 });
                }
            } else {
                const mlProfiles = await base44.asServiceRole.entities.UserMLProfile.filter({ user_id: myProfile.id });
                if (mlProfiles[0]) mlProfile = mlProfiles[0];
            }
        } catch (mlError) {
            console.log('ML profile fetch skipped:', mlError.message);
        }
        
        const weights = mlProfile.preference_weights || {};
        const likedPatterns = mlProfile.liked_patterns || {};

        // 6. Score & Rank profiles
        let results = candidates.map(p => {
             let score = 0;
             const reasons = [];
             const breakdown = {};

             // Cultural Background (25 points)
             let culturalScore = 0;
             if (myProfile.country_of_origin === p.country_of_origin) {
                 culturalScore += 15;
                 reasons.push(`Both from ${p.country_of_origin}`);
             }
             if (myProfile.tribe_ethnicity && p.tribe_ethnicity && myProfile.tribe_ethnicity === p.tribe_ethnicity) {
                 culturalScore += 10;
                 reasons.push(`Shared heritage: ${p.tribe_ethnicity}`);
             }
             if (likedPatterns.countries?.includes(p.country_of_origin)) {
                 culturalScore += 5;
             }
             breakdown.cultural = culturalScore;
             score += culturalScore * (weights.cultural_background || 1.0);

             // Religion (15 points)
             let religionScore = 0;
             if (myProfile.religion === p.religion) {
                 religionScore = 15;
                 reasons.push(`Shared faith: ${formatEnum(p.religion)}`);
             }
             if (likedPatterns.religions?.includes(p.religion)) {
                 religionScore += 3;
             }
             breakdown.religion = religionScore;
             score += religionScore * (weights.religion || 1.0);

             // Shared Interests (20 points)
             let interestScore = 0;
             const sharedInterests = myProfile.interests?.filter(i => p.interests?.includes(i)) || [];
             interestScore = Math.min(sharedInterests.length * 4, 20);
             if (sharedInterests.length > 0) {
                 reasons.push(`${sharedInterests.length} shared interests: ${sharedInterests.slice(0, 2).join(', ')}`);
             }
             const boostedInterests = sharedInterests.filter(i => likedPatterns.interests?.includes(i));
             interestScore += boostedInterests.length * 2;
             breakdown.interests = interestScore;
             score += interestScore * (weights.interests || 1.0);

             // Location (10 points)
             let locationScore = 0;
             if (myProfile.current_city === p.current_city) {
                 locationScore = 10;
                 reasons.push(`Both in ${p.current_city}`);
             } else if (myProfile.current_state === p.current_state) {
                 locationScore = 5;
             }
             breakdown.location = locationScore;
             score += locationScore * (weights.location || 1.0);

             // Relationship Goal (15 points)
             let goalScore = 0;
             if (myProfile.relationship_goal === p.relationship_goal) {
                 goalScore = 15;
                 reasons.push(`Both seeking ${formatEnum(p.relationship_goal)}`);
             }
             breakdown.relationship_goal = goalScore;
             score += goalScore * (weights.relationship_goal || 1.0);

             // Lifestyle (10 points)
             let lifestyleScore = 0;
             if (myProfile.lifestyle && p.lifestyle) {
                 if (myProfile.lifestyle.smoking === p.lifestyle.smoking) lifestyleScore += 2;
                 if (myProfile.lifestyle.drinking === p.lifestyle.drinking) lifestyleScore += 2;
                 if (myProfile.lifestyle.fitness === p.lifestyle.fitness) lifestyleScore += 3;
                 if (myProfile.lifestyle.diet === p.lifestyle.diet) lifestyleScore += 3;
             }
             if (lifestyleScore >= 6) reasons.push('Compatible lifestyle');
             breakdown.lifestyle = lifestyleScore;
             score += lifestyleScore * (weights.lifestyle || 1.0);

             // Languages (bonus)
             const sharedLanguages = myProfile.languages?.filter(l => p.languages?.includes(l)) || [];
             if (sharedLanguages.length > 1) {
                 score += sharedLanguages.length * 2;
                 reasons.push(`${sharedLanguages.length} shared languages`);
             }

             // Age Proximity
             let ageScore = 0;
             if (myProfile.birth_date && p.birth_date) {
                 const myAge = calculateAge(myProfile.birth_date);
                 const theirAge = calculateAge(p.birth_date);
                 const ageDiff = Math.abs(myAge - theirAge);
                 if (ageDiff <= 3) ageScore = 5;
                 else if (ageDiff <= 5) ageScore = 3;
                 else if (ageDiff <= 10) ageScore = 1;
             }
             breakdown.age = ageScore;
             score += ageScore * (weights.age_proximity || 1.0);

             // Tier Priority
             if (p.subscription_tier === 'vip') score += 50;
             if (p.subscription_tier === 'elite') score += 30;

             // Boost Logic
             if (p.profile_boost_active && p.boost_expires_at) {
                 const expiry = new Date(p.boost_expires_at);
                 if (expiry > new Date()) {
                     score += 500;
                 }
             }

             // Calculate Distance
             let distance = null;
             if (myProfile.location?.lat && p.location?.lat) {
                 distance = calculateDistance(myProfile.location.lat, myProfile.location.lng, p.location.lat, p.location.lng);
             }

             const normalizedScore = Math.min(Math.round(score), 100);

             return { 
                 ...p, 
                 matchScore: normalizedScore, 
                 matchReasons: reasons.slice(0, 4),
                 matchBreakdown: breakdown,
                 distance 
             };
        });

        // 7. Complex Filtering
        results = results.filter(p => {
            if (mode === 'local' && filters.distance_km && p.distance !== null) {
                if (p.distance > filters.distance_km) return false;
            }
            if (filters.verified_only && !p.verification_status?.photo_verified) return false;
            if (p.incognito_mode) return false;
            return true;
        });

        // 8. Sort
        if (mode === 'local') {
             results.sort((a, b) => (a.distance || 99999) - (b.distance || 99999));
        } else {
             results.sort((a, b) => b.matchScore - a.matchScore);
        }

        return Response.json({ 
            profiles: results.slice(0, limit),
            nextCursor
        });

    } catch (error) {
        console.error('Discovery error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});