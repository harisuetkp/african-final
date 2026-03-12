import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// AI-powered profile optimization suggestions
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const userId = body.userId;

        // Get user's profile
        const profiles = await base44.entities.UserProfile.filter({ user_id: userId || user.id });
        const myProfile = profiles[0];
        
        if (!myProfile) {
            return Response.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Get engagement stats
        const [likesReceived, matches, profileViews] = await Promise.all([
            base44.asServiceRole.entities.Like.filter({ liked_id: myProfile.id }),
            base44.asServiceRole.entities.Match.filter({ 
                $or: [{ user1_id: myProfile.id }, { user2_id: myProfile.id }],
                is_match: true 
            }),
            base44.asServiceRole.entities.ProfileView.filter({ viewed_profile_id: myProfile.id })
        ]);

        // Calculate conversion rate
        const viewToLikeRate = profileViews.length > 0 ? (likesReceived.length / profileViews.length) * 100 : 0;
        const likeToMatchRate = likesReceived.length > 0 ? (matches.length / likesReceived.length) * 100 : 0;

        // Get successful profiles for comparison (profiles with high engagement)
        const successfulProfiles = await base44.asServiceRole.entities.UserProfile.filter({
            gender: myProfile.gender,
            is_active: true,
            id: { $ne: myProfile.id }
        }, '-last_active', 50);

        // Analyze what successful profiles have
        const successfulTraits = analyzeSuccessfulProfiles(successfulProfiles);

        // Generate suggestions
        const suggestions = await generateSuggestions(base44, myProfile, {
            viewToLikeRate,
            likeToMatchRate,
            likesReceived: likesReceived.length,
            matches: matches.length,
            profileViews: profileViews.length,
            successfulTraits
        });

        // Clear old suggestions and save new ones
        const oldSuggestions = await base44.asServiceRole.entities.ProfileSuggestion.filter({ 
            user_id: myProfile.id,
            is_dismissed: false,
            is_completed: false
        });
        
        for (const old of oldSuggestions) {
            await base44.asServiceRole.entities.ProfileSuggestion.delete(old.id);
        }

        // Save new suggestions
        for (const suggestion of suggestions) {
            await base44.asServiceRole.entities.ProfileSuggestion.create({
                user_id: myProfile.id,
                ...suggestion
            });
        }

        return Response.json({ 
            success: true, 
            suggestions,
            stats: {
                viewToLikeRate: viewToLikeRate.toFixed(1),
                likeToMatchRate: likeToMatchRate.toFixed(1),
                totalViews: profileViews.length,
                totalLikes: likesReceived.length,
                totalMatches: matches.length
            }
        });

    } catch (error) {
        console.error('Profile optimizer error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function analyzeSuccessfulProfiles(profiles) {
    const traits = {
        avgPhotoCount: 0,
        avgBioLength: 0,
        avgInterestsCount: 0,
        hasVideoProfile: 0,
        hasVoiceIntro: 0,
        isVerified: 0,
        hasPrompts: 0,
        commonInterests: {},
        commonProfessions: {}
    };

    if (profiles.length === 0) return traits;

    for (const p of profiles) {
        traits.avgPhotoCount += (p.photos?.length || 0);
        traits.avgBioLength += (p.bio?.length || 0);
        traits.avgInterestsCount += (p.interests?.length || 0);
        if (p.video_profile_url) traits.hasVideoProfile++;
        if (p.voice_intro_url) traits.hasVoiceIntro++;
        if (p.verification_status?.photo_verified) traits.isVerified++;
        if (p.prompts?.length > 0) traits.hasPrompts++;
        
        for (const interest of (p.interests || [])) {
            traits.commonInterests[interest] = (traits.commonInterests[interest] || 0) + 1;
        }
        if (p.profession) {
            traits.commonProfessions[p.profession] = (traits.commonProfessions[p.profession] || 0) + 1;
        }
    }

    traits.avgPhotoCount = Math.round(traits.avgPhotoCount / profiles.length);
    traits.avgBioLength = Math.round(traits.avgBioLength / profiles.length);
    traits.avgInterestsCount = Math.round(traits.avgInterestsCount / profiles.length);
    traits.hasVideoProfile = (traits.hasVideoProfile / profiles.length) * 100;
    traits.hasVoiceIntro = (traits.hasVoiceIntro / profiles.length) * 100;
    traits.isVerified = (traits.isVerified / profiles.length) * 100;
    traits.hasPrompts = (traits.hasPrompts / profiles.length) * 100;

    return traits;
}

async function generateSuggestions(base44, profile, stats) {
    const suggestions = [];

    // Photo suggestions
    const photoCount = profile.photos?.length || 0;
    if (photoCount < 3) {
        suggestions.push({
            suggestion_type: 'photo',
            title: 'Add more photos',
            description: `You have ${photoCount} photo${photoCount !== 1 ? 's' : ''}. Profiles with 4+ photos get 2x more matches. Add photos showing your personality, hobbies, and lifestyle.`,
            priority: 9,
            potential_impact: 'high',
            action_link: 'EditProfile'
        });
    } else if (photoCount < stats.successfulTraits.avgPhotoCount) {
        suggestions.push({
            suggestion_type: 'photo',
            title: 'Add variety to your photos',
            description: `Top profiles have ${stats.successfulTraits.avgPhotoCount} photos on average. Consider adding photos from travel, cultural events, or with friends.`,
            priority: 6,
            potential_impact: 'medium',
            action_link: 'EditProfile'
        });
    }

    // Bio suggestions
    const bioLength = profile.bio?.length || 0;
    if (bioLength < 50) {
        suggestions.push({
            suggestion_type: 'bio',
            title: 'Write a compelling bio',
            description: 'Your bio is too short! Share your story, cultural background, and what makes you unique. Profiles with detailed bios get 60% more engagement.',
            priority: 10,
            potential_impact: 'high',
            action_link: 'EditProfile'
        });
    } else if (bioLength < stats.successfulTraits.avgBioLength * 0.5) {
        suggestions.push({
            suggestion_type: 'bio',
            title: 'Expand your bio',
            description: 'Your bio is shorter than average. Consider mentioning your cultural heritage, career aspirations, or what you are looking for in a partner.',
            priority: 7,
            potential_impact: 'medium',
            action_link: 'EditProfile'
        });
    }

    // Interest suggestions
    const interestCount = profile.interests?.length || 0;
    if (interestCount < 3) {
        suggestions.push({
            suggestion_type: 'interests',
            title: 'Add more interests',
            description: 'Add at least 5 interests to help find people with shared passions. This significantly improves your match quality.',
            priority: 8,
            potential_impact: 'high',
            action_link: 'EditProfile'
        });
    }

    // Verification suggestion
    if (!profile.verification_status?.photo_verified) {
        suggestions.push({
            suggestion_type: 'verification',
            title: 'Verify your profile',
            description: 'Verified profiles get 3x more matches! It shows you are real and builds trust with potential matches.',
            priority: 9,
            potential_impact: 'high',
            action_link: 'VerifyPhoto'
        });
    }

    // Video profile suggestion
    if (!profile.video_profile_url && stats.successfulTraits.hasVideoProfile > 30) {
        suggestions.push({
            suggestion_type: 'bio',
            title: 'Add a video introduction',
            description: 'Video profiles are becoming popular! They help you stand out and show your personality better than photos alone.',
            priority: 5,
            potential_impact: 'medium',
            action_link: 'EditProfile'
        });
    }

    // Prompts suggestion
    if (!profile.prompts || profile.prompts.length === 0) {
        suggestions.push({
            suggestion_type: 'prompts',
            title: 'Answer profile prompts',
            description: 'Profile prompts are great conversation starters! Answer 2-3 prompts to give matches something to talk about.',
            priority: 6,
            potential_impact: 'medium',
            action_link: 'EditProfile'
        });
    }

    // Activity suggestion
    if (stats.likeToMatchRate < 10 && stats.likesReceived > 10) {
        suggestions.push({
            suggestion_type: 'activity',
            title: 'Be more active in discovery',
            description: 'You are getting likes but not matching. Spend more time exploring profiles - your perfect match might be waiting!',
            priority: 7,
            potential_impact: 'medium',
            action_link: 'Home'
        });
    }

    // Use AI for personalized cultural suggestions
    if (profile.country_of_origin) {
        try {
            const aiSuggestion = await base44.integrations.Core.InvokeLLM({
                prompt: `Generate ONE specific, actionable profile improvement suggestion for someone from ${profile.country_of_origin} on a dating app focused on African diaspora connections. 
                
Current bio: "${profile.bio || 'No bio yet'}"
Current interests: ${(profile.interests || []).join(', ') || 'None listed'}

The suggestion should be culturally relevant and help them attract more compatible matches. Focus on highlighting their heritage in an authentic way.

Respond in JSON format: {"title": "short title", "description": "2-3 sentence actionable suggestion"}`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        description: { type: 'string' }
                    }
                }
            });

            if (aiSuggestion.title) {
                suggestions.push({
                    suggestion_type: 'bio',
                    title: aiSuggestion.title,
                    description: aiSuggestion.description,
                    priority: 6,
                    potential_impact: 'medium',
                    action_link: 'EditProfile'
                });
            }
        } catch (e) {
            console.error('AI suggestion failed:', e);
        }
    }

    // Sort by priority
    suggestions.sort((a, b) => b.priority - a.priority);

    return suggestions.slice(0, 5); // Return top 5 suggestions
}