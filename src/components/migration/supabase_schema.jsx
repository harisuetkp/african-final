-- =====================================================
-- AFRINNECT SUPABASE MIGRATION
-- Generated from Base44 Entity Schemas
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS & PROFILES
-- =====================================================

-- User Profile (main user data)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    
    user_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT,
    display_name TEXT NOT NULL,
    ethnicity TEXT CHECK (ethnicity IN ('african', 'african_descent', 'non_african_interested')),
    birth_date DATE,
    gender TEXT CHECK (gender IN ('man', 'woman', 'non_binary', 'other')),
    looking_for TEXT[],
    photos TEXT[],
    primary_photo TEXT,
    bio TEXT,
    country_of_origin TEXT,
    current_country TEXT NOT NULL,
    current_state TEXT,
    current_city TEXT,
    tribe_ethnicity TEXT,
    languages TEXT[],
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'fr')),
    religion TEXT CHECK (religion IN ('christianity', 'islam', 'traditional_african', 'judaism', 'buddhism', 'hindu', 'spiritual', 'agnostic', 'atheist', 'other', 'prefer_not_say')),
    education TEXT CHECK (education IN ('high_school', 'some_college', 'bachelors', 'masters', 'doctorate', 'trade_school', 'other')),
    profession TEXT,
    relationship_goal TEXT CHECK (relationship_goal IN ('dating', 'serious_relationship', 'marriage', 'friendship_community', 'networking')),
    height_cm NUMERIC,
    lifestyle JSONB DEFAULT '{}',
    cultural_values TEXT[],
    interests TEXT[],
    prompts JSONB DEFAULT '[]',
    verification_status JSONB DEFAULT '{"email_verified": false, "phone_verified": false, "photo_verified": false, "id_verified": false}',
    
    -- Subscription
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'elite', 'vip')),
    premium_until DATE,
    
    -- Founding Member
    is_founding_member BOOLEAN DEFAULT FALSE,
    founding_member_granted_at TIMESTAMPTZ,
    founding_member_trial_ends_at TIMESTAMPTZ,
    founding_member_source TEXT CHECK (founding_member_source IN ('global_toggle', 'invite_code', 'manual_admin')),
    founding_member_code_used TEXT,
    founding_member_eligible BOOLEAN DEFAULT TRUE,
    founding_trial_consumed BOOLEAN DEFAULT FALSE,
    founding_member_converted BOOLEAN DEFAULT FALSE,
    founding_member_converted_at TIMESTAMPTZ,
    
    -- Boost & Discovery
    profile_boost_active BOOLEAN DEFAULT FALSE,
    boost_expires_at TIMESTAMPTZ,
    discovery_mode TEXT CHECK (discovery_mode IN ('local', 'global')),
    incognito_mode BOOLEAN DEFAULT FALSE,
    
    -- Activity
    is_active BOOLEAN DEFAULT TRUE,
    last_active TIMESTAMPTZ,
    location JSONB,
    filters JSONB DEFAULT '{}',
    blocked_users TEXT[] DEFAULT '{}',
    hidden_from TEXT[] DEFAULT '{}',
    
    -- Daily Limits
    daily_likes_count INTEGER DEFAULT 0,
    daily_likes_reset_date DATE,
    
    -- Streaks & Badges
    login_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    streak_badges TEXT[],
    profile_performance_percentile NUMERIC,
    ai_safety_score NUMERIC,
    verification_selfie_url TEXT,
    tutorial_completed BOOLEAN DEFAULT FALSE,
    badges TEXT[] DEFAULT '{}',
    
    -- Social
    spotify_top_artists TEXT[],
    spotify_top_song TEXT,
    instagram_handle TEXT,
    communities TEXT[] DEFAULT '{}',
    
    -- Moderation
    violation_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_expires_at TIMESTAMPTZ,
    suspension_reason TEXT,
    ban_reason TEXT,
    
    -- Other
    has_matched_before BOOLEAN DEFAULT FALSE,
    push_token TEXT,
    video_profile_url TEXT,
    voice_intro_url TEXT,
    phone_number TEXT,
    device_ids TEXT[] DEFAULT '{}',
    device_info JSONB DEFAULT '[]',
    is_test_user BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_user_profiles_country_of_origin ON user_profiles(country_of_origin);
CREATE INDEX idx_user_profiles_current_country ON user_profiles(current_country);
CREATE INDEX idx_user_profiles_current_state ON user_profiles(current_state);
CREATE INDEX idx_user_profiles_religion ON user_profiles(religion);
CREATE INDEX idx_user_profiles_relationship_goal ON user_profiles(relationship_goal);
CREATE INDEX idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_is_premium ON user_profiles(is_premium);
CREATE INDEX idx_user_profiles_is_founding_member ON user_profiles(is_founding_member);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX idx_user_profiles_last_active ON user_profiles(last_active);
CREATE INDEX idx_user_profiles_is_banned ON user_profiles(is_banned);
CREATE INDEX idx_user_profiles_is_suspended ON user_profiles(is_suspended);
CREATE INDEX idx_user_profiles_is_test_user ON user_profiles(is_test_user);

-- =====================================================
-- 2. MATCHING & INTERACTIONS
-- =====================================================

-- Likes
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    liker_id TEXT NOT NULL,
    liked_id TEXT NOT NULL,
    liker_user_id TEXT NOT NULL,
    liked_user_id TEXT NOT NULL,
    is_super_like BOOLEAN DEFAULT FALSE,
    is_seen BOOLEAN DEFAULT FALSE,
    is_priority BOOLEAN DEFAULT FALSE,
    priority_boost_expires TIMESTAMPTZ,
    
    UNIQUE(liker_id, liked_id)
);

CREATE INDEX idx_likes_liker_id ON likes(liker_id);
CREATE INDEX idx_likes_liked_id ON likes(liked_id);
CREATE INDEX idx_likes_liker_user_id ON likes(liker_user_id);
CREATE INDEX idx_likes_liked_user_id ON likes(liked_user_id);
CREATE INDEX idx_likes_is_seen ON likes(is_seen);
CREATE INDEX idx_likes_is_priority ON likes(is_priority);

-- Passes
CREATE TABLE passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    passer_id TEXT NOT NULL,
    passed_id TEXT NOT NULL,
    passer_user_id TEXT NOT NULL,
    is_rewindable BOOLEAN DEFAULT TRUE,
    
    UNIQUE(passer_id, passed_id)
);

CREATE INDEX idx_passes_passer_id ON passes(passer_id);
CREATE INDEX idx_passes_passed_id ON passes(passed_id);
CREATE INDEX idx_passes_passer_user_id ON passes(passer_user_id);

-- Matches
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    user1_user_id TEXT NOT NULL,
    user2_user_id TEXT NOT NULL,
    user1_liked BOOLEAN DEFAULT FALSE,
    user2_liked BOOLEAN DEFAULT FALSE,
    is_match BOOLEAN DEFAULT FALSE,
    matched_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_expired BOOLEAN DEFAULT FALSE,
    last_chance_sent BOOLEAN DEFAULT FALSE,
    compatibility_score NUMERIC,
    compatibility_reasons TEXT[],
    is_super_like BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unmatched', 'blocked', 'expired')),
    has_nudged BOOLEAN DEFAULT FALSE,
    typing_user_id TEXT,
    first_message_sent BOOLEAN DEFAULT FALSE,
    first_message_sent_by TEXT,
    first_message_sent_at TIMESTAMPTZ
);

CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
CREATE INDEX idx_matches_user1_user_id ON matches(user1_user_id);
CREATE INDEX idx_matches_user2_user_id ON matches(user2_user_id);
CREATE INDEX idx_matches_is_match ON matches(is_match);
CREATE INDEX idx_matches_expires_at ON matches(expires_at);
CREATE INDEX idx_matches_is_expired ON matches(is_expired);
CREATE INDEX idx_matches_status ON matches(status);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    match_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    sender_user_id TEXT NOT NULL,
    receiver_user_id TEXT NOT NULL,
    sequence_number INTEGER,
    idempotency_key TEXT UNIQUE,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'voice_note', 'image', 'ice_breaker', 'gif')),
    media_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    is_translated BOOLEAN DEFAULT FALSE,
    like_note TEXT
);

CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_sender_user_id ON messages(sender_user_id);
CREATE INDEX idx_messages_receiver_user_id ON messages(receiver_user_id);
CREATE INDEX idx_messages_sequence_number ON messages(sequence_number);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_is_flagged ON messages(is_flagged);

-- =====================================================
-- 3. VIDEO CALLS
-- =====================================================

CREATE TABLE video_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    match_id TEXT NOT NULL,
    caller_profile_id TEXT NOT NULL,
    caller_user_id TEXT NOT NULL,
    receiver_profile_id TEXT NOT NULL,
    receiver_user_id TEXT NOT NULL,
    status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'connecting', 'connected', 'reconnecting', 'ended', 'missed', 'declined', 'busy', 'failed')),
    call_type TEXT DEFAULT 'video' CHECK (call_type IN ('video', 'audio')),
    start_time TIMESTAMPTZ,
    answered_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    room_id TEXT,
    call_quality TEXT CHECK (call_quality IN ('excellent', 'good', 'fair', 'poor')),
    end_reason TEXT CHECK (end_reason IN ('completed', 'timeout', 'declined', 'busy', 'blocked', 'network_error', 'user_left', 'backgrounded')),
    caller_ice_candidates JSONB DEFAULT '[]',
    receiver_ice_candidates JSONB DEFAULT '[]',
    caller_sdp JSONB,
    receiver_sdp JSONB,
    network_stats JSONB,
    reported BOOLEAN DEFAULT FALSE,
    blocked_during_call BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_video_calls_match_id ON video_calls(match_id);
CREATE INDEX idx_video_calls_caller_profile_id ON video_calls(caller_profile_id);
CREATE INDEX idx_video_calls_caller_user_id ON video_calls(caller_user_id);
CREATE INDEX idx_video_calls_receiver_profile_id ON video_calls(receiver_profile_id);
CREATE INDEX idx_video_calls_receiver_user_id ON video_calls(receiver_user_id);
CREATE INDEX idx_video_calls_status ON video_calls(status);
CREATE INDEX idx_video_calls_room_id ON video_calls(room_id);

-- =====================================================
-- 4. SUBSCRIPTIONS & PAYMENTS
-- =====================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium_monthly', 'premium_quarterly', 'premium_yearly', 'elite_monthly', 'elite_quarterly', 'vip_monthly', 'vip_6months')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    payment_provider TEXT CHECK (payment_provider IN ('stripe', 'apple', 'google', 'manual')),
    external_id TEXT,
    amount_paid NUMERIC,
    currency TEXT,
    boosts_remaining INTEGER,
    super_likes_remaining INTEGER,
    auto_renew BOOLEAN DEFAULT TRUE,
    regional_pricing BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_subscriptions_user_profile_id ON subscriptions(user_profile_id);
CREATE INDEX idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscriptions_external_id ON subscriptions(external_id);

-- Pricing Plans
CREATE TABLE pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    plan_id TEXT UNIQUE,
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'elite', 'vip')),
    billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'yearly', '6months')),
    price_usd NUMERIC NOT NULL,
    regional_discounts JSONB,
    features TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE
);

-- Receipts
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    transaction_id TEXT NOT NULL,
    user_profile_id TEXT NOT NULL,
    subscription_id TEXT,
    plan_name TEXT,
    billing_period TEXT,
    amount_paid NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    regional_discount BOOLEAN DEFAULT FALSE,
    payment_provider TEXT,
    customer_email TEXT,
    customer_name TEXT,
    purchase_date TIMESTAMPTZ NOT NULL,
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    receipt_sent BOOLEAN DEFAULT FALSE
);

-- In-App Purchases
CREATE TABLE in_app_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('boost', 'super_likes', 'rewind', 'spotlight')),
    item_quantity INTEGER NOT NULL,
    amount_usd NUMERIC NOT NULL,
    payment_provider TEXT CHECK (payment_provider IN ('stripe', 'apple', 'google')),
    transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- =====================================================
-- 5. NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('match', 'like', 'message', 'admin_message', 'super_like')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    from_profile_id TEXT,
    link_to TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_notifications_user_profile_id ON notifications(user_profile_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- 6. REPORTS & MODERATION
-- =====================================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    reporter_id TEXT NOT NULL,
    reported_id TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('fake_profile', 'harassment', 'inappropriate_content', 'scam', 'underage', 'spam', 'hate_speech', 'other')),
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    message_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    moderator_notes TEXT,
    action_taken TEXT CHECK (action_taken IN ('none', 'warning', 'temporary_ban', 'permanent_ban', 'content_removed')),
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_id ON reports(reported_id);
CREATE INDEX idx_reports_report_type ON reports(report_type);
CREATE INDEX idx_reports_status ON reports(status);

-- Moderation Actions
CREATE TABLE moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'content_removed', 'temporary_mute', 'temporary_ban', 'permanent_ban')),
    reason TEXT NOT NULL,
    related_report_id TEXT,
    duration_hours INTEGER,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Moderation Rules
CREATE TABLE moderation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    rule_type TEXT NOT NULL CHECK (rule_type IN ('blocked_keyword', 'spam_pattern', 'inappropriate_content', 'rate_limit')),
    pattern TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('flag', 'auto_delete', 'shadow_ban', 'notify_admin')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT
);

-- Fake Profile Detection
CREATE TABLE fake_profile_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    risk_score NUMERIC NOT NULL,
    risk_factors TEXT[],
    ai_analysis JSONB,
    status TEXT DEFAULT 'safe' CHECK (status IN ('safe', 'suspicious', 'flagged', 'banned')),
    reviewed_by_human BOOLEAN DEFAULT FALSE,
    last_checked TIMESTAMPTZ
);

-- Scam Analysis
CREATE TABLE scam_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    message_id TEXT NOT NULL,
    sender_id TEXT,
    risk_score NUMERIC NOT NULL,
    scam_type TEXT DEFAULT 'none' CHECK (scam_type IN ('money_request', 'crypto', 'phishing', 'romance_scam', 'off_platform', 'harassment', 'none')),
    ai_analysis JSONB,
    action_taken TEXT DEFAULT 'none' CHECK (action_taken IN ('none', 'flagged', 'hidden', 'blocked_user'))
);

-- =====================================================
-- 7. VERIFICATION
-- =====================================================

CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('photo', 'id', 'elite', 'vip')),
    submitted_photo_url TEXT,
    submitted_id_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT,
    rejection_reason TEXT,
    ai_confidence_score NUMERIC
);

CREATE INDEX idx_verification_requests_user_profile_id ON verification_requests(user_profile_id);
CREATE INDEX idx_verification_requests_verification_type ON verification_requests(verification_type);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);

-- Photo Moderation
CREATE TABLE photo_moderations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    ai_analysis JSONB,
    rejection_reasons TEXT[],
    reviewed_by TEXT
);

-- Phone Verification
CREATE TABLE phone_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    verification_code TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0
);

-- =====================================================
-- 8. EVENTS
-- =====================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('cultural_festival', 'meetup', 'speed_dating', 'networking', 'concert', 'food_festival', 'art_exhibition', 'community_gathering', 'afrobeat_party', 'dance_party', 'cultural_night', 'music_festival')),
    image_url TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location_name TEXT,
    location_address TEXT,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL,
    is_virtual BOOLEAN DEFAULT FALSE,
    virtual_link TEXT,
    organizer_id TEXT,
    attendees TEXT[] DEFAULT '{}',
    max_attendees INTEGER,
    is_featured BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    price NUMERIC DEFAULT 0,
    currency TEXT
);

CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_state ON events(state);
CREATE INDEX idx_events_country ON events(country);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_is_featured ON events(is_featured);

-- Video Events
CREATE TABLE video_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('speed_dating', 'mixer', 'game_night', 'happy_hour')),
    start_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    max_participants INTEGER NOT NULL,
    participants TEXT[] DEFAULT '{}',
    video_room_id TEXT,
    is_premium_only BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'ended'))
);

-- =====================================================
-- 9. STORIES
-- =====================================================

CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
    caption TEXT,
    views TEXT[] DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL,
    is_expired BOOLEAN DEFAULT FALSE
);

CREATE TABLE story_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    story_id TEXT NOT NULL,
    user_profile_id TEXT NOT NULL,
    content TEXT NOT NULL
);

-- =====================================================
-- 10. COMMUNITIES
-- =====================================================

CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('interests', 'location', 'culture', 'profession', 'lifestyle')),
    icon TEXT NOT NULL,
    cover_image TEXT,
    members TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- 11. ANALYTICS & TRACKING
-- =====================================================

CREATE TABLE profile_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    event_type TEXT,
    event_data JSONB,
    date DATE,
    timestamp TIMESTAMPTZ,
    views_count INTEGER DEFAULT 0,
    likes_received INTEGER DEFAULT 0,
    matches_count INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    response_rate NUMERIC,
    profile_completion NUMERIC
);

CREATE INDEX idx_profile_analytics_user_profile_id ON profile_analytics(user_profile_id);
CREATE INDEX idx_profile_analytics_event_type ON profile_analytics(event_type);
CREATE INDEX idx_profile_analytics_date ON profile_analytics(date);

-- Profile Views
CREATE TABLE profile_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    viewer_profile_id TEXT NOT NULL,
    viewed_profile_id TEXT NOT NULL,
    view_date TIMESTAMPTZ,
    view_source TEXT CHECK (view_source IN ('discovery', 'match', 'search', 'profile_link'))
);

CREATE INDEX idx_profile_views_viewer_profile_id ON profile_views(viewer_profile_id);
CREATE INDEX idx_profile_views_viewed_profile_id ON profile_views(viewed_profile_id);
CREATE INDEX idx_profile_views_view_date ON profile_views(view_date);

-- Photo Engagement
CREATE TABLE photo_engagements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    profile_id TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    viewer_profile_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'like', 'pass')),
    photo_index INTEGER
);

-- =====================================================
-- 12. ML & RECOMMENDATIONS
-- =====================================================

CREATE TABLE user_ml_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id TEXT UNIQUE NOT NULL,
    preference_weights JSONB DEFAULT '{"cultural_background": 1.0, "religion": 1.0, "interests": 1.0, "location": 1.0, "education": 1.0, "lifestyle": 1.0, "relationship_goal": 1.0, "age_proximity": 1.0}',
    liked_patterns JSONB DEFAULT '{"countries": [], "religions": [], "interests": [], "professions": [], "age_range": {}}',
    passed_patterns JSONB DEFAULT '{"countries": [], "religions": [], "interests": []}',
    engagement_stats JSONB DEFAULT '{}',
    last_model_update TIMESTAMPTZ
);

CREATE INDEX idx_user_ml_profiles_user_id ON user_ml_profiles(user_id);

-- Match Scores
CREATE TABLE match_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    total_score NUMERIC NOT NULL,
    cultural_compatibility NUMERIC,
    values_alignment NUMERIC,
    location_proximity NUMERIC,
    preference_match NUMERIC,
    match_reasons TEXT[],
    last_calculated TIMESTAMPTZ
);

-- Match Feedback
CREATE TABLE match_feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id TEXT NOT NULL,
    target_profile_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('like', 'pass', 'unmatch', 'block')),
    feedback_reasons TEXT[],
    custom_feedback TEXT,
    match_id TEXT,
    time_spent_on_profile_ms INTEGER,
    photos_viewed_count INTEGER,
    bio_expanded BOOLEAN
);

CREATE INDEX idx_match_feedbacks_user_id ON match_feedbacks(user_id);
CREATE INDEX idx_match_feedbacks_target_profile_id ON match_feedbacks(target_profile_id);
CREATE INDEX idx_match_feedbacks_action_type ON match_feedbacks(action_type);

-- Daily Matches
CREATE TABLE daily_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    suggested_profile_id TEXT NOT NULL,
    match_score NUMERIC NOT NULL,
    match_reasons TEXT[],
    date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'liked', 'passed')),
    expires_at TIMESTAMPTZ
);

-- Profile Suggestions
CREATE TABLE profile_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id TEXT NOT NULL,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('photo', 'bio', 'interests', 'prompts', 'verification', 'activity')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority INTEGER,
    potential_impact TEXT CHECK (potential_impact IN ('low', 'medium', 'high')),
    action_link TEXT,
    is_dismissed BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_profile_suggestions_user_id ON profile_suggestions(user_id);
CREATE INDEX idx_profile_suggestions_suggestion_type ON profile_suggestions(suggestion_type);
CREATE INDEX idx_profile_suggestions_is_dismissed ON profile_suggestions(is_dismissed);
CREATE INDEX idx_profile_suggestions_is_completed ON profile_suggestions(is_completed);

-- User Recommendations
CREATE TABLE user_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('feature', 'event', 'match_tip', 'safety_alert')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    action_link TEXT,
    is_dismissed BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    trigger_reason TEXT
);

-- =====================================================
-- 13. SAFETY
-- =====================================================

CREATE TABLE safety_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    date_location TEXT,
    meeting_with_profile_id TEXT NOT NULL,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    check_in_time TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'checked_in', 'alert_triggered', 'completed')),
    panic_location JSONB,
    moderator_notes TEXT
);

CREATE INDEX idx_safety_checks_user_profile_id ON safety_checks(user_profile_id);
CREATE INDEX idx_safety_checks_meeting_with_profile_id ON safety_checks(meeting_with_profile_id);
CREATE INDEX idx_safety_checks_check_in_time ON safety_checks(check_in_time);
CREATE INDEX idx_safety_checks_status ON safety_checks(status);

-- Screenshot Alerts
CREATE TABLE screenshot_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    screenshot_of_profile_id TEXT NOT NULL,
    screenshot_location TEXT NOT NULL CHECK (screenshot_location IN ('profile', 'chat', 'photo')),
    alert_sent BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- 14. VIRTUAL GIFTS
-- =====================================================

CREATE TABLE virtual_gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    sender_profile_id TEXT NOT NULL,
    receiver_profile_id TEXT NOT NULL,
    match_id TEXT,
    gift_type TEXT NOT NULL,
    gift_emoji TEXT NOT NULL,
    message TEXT,
    cost NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'received', 'viewed'))
);

-- =====================================================
-- 15. AMBASSADOR PROGRAM
-- =====================================================

CREATE TABLE ambassadors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id TEXT,
    handle TEXT UNIQUE NOT NULL,
    display_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    bio TEXT,
    social_links JSONB,
    profile_image_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    referral_code TEXT UNIQUE NOT NULL,
    referral_link TEXT,
    qr_code_url TEXT,
    commission_plan_id TEXT,
    payout_method TEXT CHECK (payout_method IN ('paypal', 'bank_transfer', 'mobile_money', 'crypto')),
    payout_details JSONB,
    payout_threshold NUMERIC DEFAULT 50,
    tax_form_status TEXT DEFAULT 'not_submitted' CHECK (tax_form_status IN ('not_submitted', 'pending_review', 'approved', 'rejected')),
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMPTZ,
    notes TEXT,
    stats JSONB DEFAULT '{"total_clicks": 0, "total_signups": 0, "total_activations": 0, "total_subscribers": 0, "total_revenue_generated": 0, "total_commissions_earned": 0, "total_commissions_paid": 0}',
    fraud_flags TEXT[],
    suspended_reason TEXT,
    suspended_at TIMESTAMPTZ
);

CREATE INDEX idx_ambassadors_user_id ON ambassadors(user_id);
CREATE INDEX idx_ambassadors_handle ON ambassadors(handle);
CREATE INDEX idx_ambassadors_email ON ambassadors(email);
CREATE INDEX idx_ambassadors_status ON ambassadors(status);
CREATE INDEX idx_ambassadors_tier ON ambassadors(tier);
CREATE INDEX idx_ambassadors_referral_code ON ambassadors(referral_code);
CREATE INDEX idx_ambassadors_commission_plan_id ON ambassadors(commission_plan_id);

-- Ambassador Referrals
CREATE TABLE ambassador_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    ambassador_id TEXT NOT NULL,
    user_id TEXT UNIQUE NOT NULL,
    user_profile_id TEXT,
    attribution_source TEXT CHECK (attribution_source IN ('link', 'code', 'manual')),
    referral_code_used TEXT,
    first_click_at TIMESTAMPTZ,
    attributed_at TIMESTAMPTZ,
    attribution_expires_at TIMESTAMPTZ,
    referral_history JSONB DEFAULT '[]',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'activated', 'subscribed', 'churned')),
    is_founding_member BOOLEAN DEFAULT FALSE,
    founding_trial_ends_at TIMESTAMPTZ,
    signup_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    first_subscription_at TIMESTAMPTZ,
    total_revenue NUMERIC DEFAULT 0,
    total_commissions NUMERIC DEFAULT 0,
    device_id TEXT,
    ip_address TEXT,
    fraud_flags TEXT[],
    is_suspicious BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_ambassador_referrals_ambassador_id ON ambassador_referrals(ambassador_id);
CREATE INDEX idx_ambassador_referrals_user_id ON ambassador_referrals(user_id);
CREATE INDEX idx_ambassador_referrals_user_profile_id ON ambassador_referrals(user_profile_id);
CREATE INDEX idx_ambassador_referrals_status ON ambassador_referrals(status);
CREATE INDEX idx_ambassador_referrals_is_suspicious ON ambassador_referrals(is_suspicious);

-- Ambassador Commissions
CREATE TABLE ambassador_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    ambassador_id TEXT NOT NULL,
    referral_id TEXT,
    user_id TEXT,
    subscription_id TEXT,
    event_id TEXT,
    commission_type TEXT NOT NULL CHECK (commission_type IN ('signup_bonus', 'activation_bonus', 'cpa', 'revenue_share', 'recurring_share', 'milestone_bonus', 'campaign_bonus')),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    tier_multiplier NUMERIC DEFAULT 1,
    original_amount NUMERIC,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'reversed', 'cancelled')),
    hold_until TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    payout_id TEXT,
    reversal_reason TEXT,
    notes TEXT
);

CREATE INDEX idx_ambassador_commissions_ambassador_id ON ambassador_commissions(ambassador_id);
CREATE INDEX idx_ambassador_commissions_referral_id ON ambassador_commissions(referral_id);
CREATE INDEX idx_ambassador_commissions_commission_type ON ambassador_commissions(commission_type);
CREATE INDEX idx_ambassador_commissions_status ON ambassador_commissions(status);
CREATE INDEX idx_ambassador_commissions_payout_id ON ambassador_commissions(payout_id);

-- Ambassador Commission Plans
CREATE TABLE ambassador_commission_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    name TEXT NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('cpa', 'revenue_share', 'recurring_share', 'hybrid')),
    cpa_amount NUMERIC,
    revenue_share_pct NUMERIC,
    recurring_share_pct NUMERIC,
    recurring_months INTEGER DEFAULT 6,
    activation_bonus NUMERIC DEFAULT 0,
    signup_bonus NUMERIC DEFAULT 0,
    milestone_rules JSONB DEFAULT '[]',
    tier_multipliers JSONB DEFAULT '{"bronze": 1, "silver": 1.1, "gold": 1.25, "platinum": 1.5}',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMPTZ,
    effective_until TIMESTAMPTZ
);

CREATE INDEX idx_ambassador_commission_plans_plan_type ON ambassador_commission_plans(plan_type);
CREATE INDEX idx_ambassador_commission_plans_is_default ON ambassador_commission_plans(is_default);
CREATE INDEX idx_ambassador_commission_plans_is_active ON ambassador_commission_plans(is_active);

-- Ambassador Payouts
CREATE TABLE ambassador_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    ambassador_id TEXT NOT NULL,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    total_amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    commission_count INTEGER,
    commission_ids TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
    payout_method TEXT CHECK (payout_method IN ('paypal', 'bank_transfer', 'mobile_money', 'crypto')),
    payout_details JSONB,
    transaction_id TEXT,
    paid_at TIMESTAMPTZ,
    failed_reason TEXT,
    notes TEXT
);

CREATE INDEX idx_ambassador_payouts_ambassador_id ON ambassador_payouts(ambassador_id);
CREATE INDEX idx_ambassador_payouts_status ON ambassador_payouts(status);

-- Ambassador Campaigns
CREATE TABLE ambassador_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT NOT NULL CHECK (campaign_type IN ('bonus_multiplier', 'flat_bonus', 'challenge', 'milestone_race')),
    bonus_multiplier NUMERIC,
    flat_bonus_amount NUMERIC,
    challenge_rules JSONB,
    eligible_tiers TEXT[],
    eligible_ambassador_ids TEXT[],
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    leaderboard JSONB DEFAULT '[]'
);

CREATE INDEX idx_ambassador_campaigns_campaign_type ON ambassador_campaigns(campaign_type);
CREATE INDEX idx_ambassador_campaigns_starts_at ON ambassador_campaigns(starts_at);
CREATE INDEX idx_ambassador_campaigns_ends_at ON ambassador_campaigns(ends_at);
CREATE INDEX idx_ambassador_campaigns_is_active ON ambassador_campaigns(is_active);

-- Ambassador Referral Events
CREATE TABLE ambassador_referral_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    ambassador_id TEXT NOT NULL,
    user_id TEXT,
    referral_id TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('click', 'signup', 'activate', 'subscribe', 'renew', 'upgrade', 'downgrade', 'cancel', 'refund', 'chargeback')),
    metadata JSONB,
    revenue_amount NUMERIC,
    currency TEXT DEFAULT 'USD',
    subscription_id TEXT,
    device_id TEXT,
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX idx_ambassador_referral_events_ambassador_id ON ambassador_referral_events(ambassador_id);
CREATE INDEX idx_ambassador_referral_events_user_id ON ambassador_referral_events(user_id);
CREATE INDEX idx_ambassador_referral_events_referral_id ON ambassador_referral_events(referral_id);
CREATE INDEX idx_ambassador_referral_events_event_type ON ambassador_referral_events(event_type);

-- Ambassador Content Assets
CREATE TABLE ambassador_content_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    name TEXT NOT NULL,
    description TEXT,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'script', 'hook', 'brand_guide', 'banner', 'story_template')),
    file_url TEXT,
    thumbnail_url TEXT,
    content_text TEXT,
    campaign_id TEXT,
    tags TEXT[],
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_ambassador_content_assets_asset_type ON ambassador_content_assets(asset_type);

-- =====================================================
-- 16. FOUNDER PROGRAM
-- =====================================================

CREATE TABLE founder_invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    code TEXT UNIQUE NOT NULL,
    max_redemptions INTEGER DEFAULT 100,
    current_redemptions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    trial_days INTEGER DEFAULT 183,
    created_by TEXT,
    notes TEXT
);

CREATE INDEX idx_founder_invite_codes_code ON founder_invite_codes(code);
CREATE INDEX idx_founder_invite_codes_is_active ON founder_invite_codes(is_active);

CREATE TABLE founder_code_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    code_id TEXT NOT NULL,
    code TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_email TEXT,
    device_id TEXT,
    ip_address TEXT
);

CREATE INDEX idx_founder_code_redemptions_code_id ON founder_code_redemptions(code_id);
CREATE INDEX idx_founder_code_redemptions_code ON founder_code_redemptions(code);
CREATE INDEX idx_founder_code_redemptions_user_id ON founder_code_redemptions(user_id);
CREATE INDEX idx_founder_code_redemptions_device_id ON founder_code_redemptions(device_id);

-- =====================================================
-- 17. SUPPORT & DISPUTES
-- =====================================================

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('technical', 'account', 'billing', 'safety', 'feature_request', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
    assigned_to TEXT,
    resolution_notes TEXT,
    attachments TEXT[]
);

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_email TEXT NOT NULL,
    user_profile_id TEXT,
    dispute_type TEXT NOT NULL CHECK (dispute_type IN ('ban_appeal', 'rate_limit_appeal', 'false_positive', 'suspension_appeal')),
    reason TEXT NOT NULL,
    original_ban_reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    admin_response TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    evidence_urls TEXT[]
);

CREATE INDEX idx_disputes_user_email ON disputes(user_email);
CREATE INDEX idx_disputes_user_profile_id ON disputes(user_profile_id);
CREATE INDEX idx_disputes_dispute_type ON disputes(dispute_type);
CREATE INDEX idx_disputes_status ON disputes(status);

-- =====================================================
-- 18. ADMIN & SYSTEM
-- =====================================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by TEXT
);

CREATE INDEX idx_system_settings_key ON system_settings(key);

CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    admin_user_id TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('user_ban', 'user_delete', 'user_unban', 'report_resolved', 'subscription_cancelled', 'admin_granted', 'admin_revoked', 'message_sent', 'user_edited', 'verification_approved', 'verification_rejected')),
    target_user_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT
);

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    feature_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    enabled_for_premium BOOLEAN DEFAULT FALSE,
    rollout_percentage NUMERIC DEFAULT 0
);

CREATE TABLE broadcast_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_by TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'premium', 'free', 'active', 'inactive', 'custom')),
    custom_filter JSONB,
    send_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0
);

-- =====================================================
-- 19. MISC
-- =====================================================

-- Legal Acceptance
CREATE TABLE legal_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id TEXT NOT NULL,
    terms_accepted BOOLEAN NOT NULL,
    privacy_accepted BOOLEAN NOT NULL,
    guidelines_accepted BOOLEAN NOT NULL,
    accepted_at TIMESTAMPTZ,
    ip_address TEXT
);

-- Deleted Accounts
CREATE TABLE deleted_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_email TEXT NOT NULL,
    user_id TEXT,
    display_name TEXT,
    deletion_reason TEXT,
    deleted_at TIMESTAMPTZ NOT NULL
);

-- Waitlist
CREATE TABLE waitlist_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    email TEXT NOT NULL,
    full_name TEXT,
    location TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'joined')),
    ip_address TEXT
);

-- Error Logs
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    message TEXT NOT NULL,
    stack TEXT,
    component_stack TEXT,
    type TEXT NOT NULL CHECK (type IN ('error', 'unhandled_rejection', 'boundary', 'console_error')),
    url TEXT NOT NULL,
    user_id TEXT,
    user_email TEXT,
    browser TEXT,
    os TEXT,
    device TEXT,
    breadcrumbs JSONB DEFAULT '[]',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'ignored')),
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ai_analysis JSONB,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ
);

-- Referrals (User to User)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    referrer_id TEXT NOT NULL,
    referred_id TEXT,
    referred_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    reward_given BOOLEAN DEFAULT FALSE,
    reward_claimed BOOLEAN DEFAULT FALSE
);

-- Promotions
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    promo_code TEXT NOT NULL,
    promo_type TEXT NOT NULL CHECK (promo_type IN ('discount', 'free_trial', 'free_boost', 'free_super_likes')),
    discount_percentage NUMERIC,
    trial_days INTEGER,
    free_boosts INTEGER,
    free_super_likes INTEGER,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'new_users', 'churned_users', 'free_users'))
);

-- Advertisements
CREATE TABLE advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT NOT NULL,
    placement TEXT NOT NULL CHECK (placement IN ('discovery', 'matches', 'events', 'profile')),
    target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'free_users', 'premium_users', 'specific_country')),
    target_country TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
);

-- A/B Tests
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_id TEXT NOT NULL,
    test_name TEXT NOT NULL,
    variant TEXT NOT NULL,
    assigned_at TIMESTAMPTZ,
    test_type TEXT CHECK (test_type IN ('pricing', 'paywall_copy', 'cta_placement', 'feature')),
    variant_a JSONB,
    variant_b JSONB,
    traffic_split NUMERIC DEFAULT 50,
    metrics JSONB DEFAULT '{"variant_a_conversions": 0, "variant_a_views": 0, "variant_b_conversions": 0, "variant_b_views": 0}',
    is_active BOOLEAN DEFAULT TRUE,
    winner TEXT CHECK (winner IN ('variant_a', 'variant_b', 'no_winner')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- Message Translations
CREATE TABLE message_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    message_id TEXT NOT NULL,
    original_language TEXT NOT NULL,
    translated_text JSONB,
    translation_requested_by TEXT[]
);

-- Ice Breakers
CREATE TABLE ice_breakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    question TEXT NOT NULL,
    cultural_context TEXT NOT NULL CHECK (cultural_context IN ('african_general', 'diaspora', 'traditional', 'modern', 'universal')),
    category TEXT NOT NULL CHECK (category IN ('values', 'lifestyle', 'culture', 'fun', 'deep')),
    is_active BOOLEAN DEFAULT TRUE
);

-- Profile Boosts
CREATE TABLE profile_boosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    boost_type TEXT NOT NULL CHECK (boost_type IN ('1_hour', '3_hours', '24_hours')),
    started_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    views_gained INTEGER DEFAULT 0,
    likes_gained INTEGER DEFAULT 0
);

-- Video Profiles
CREATE TABLE video_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_active BOOLEAN DEFAULT TRUE
);

-- Voice Messages
CREATE TABLE voice_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    match_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    duration_seconds INTEGER,
    is_played BOOLEAN DEFAULT FALSE,
    transcript TEXT
);

-- Date Plans
CREATE TABLE date_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_profile TEXT,
    
    match_id TEXT NOT NULL,
    suggested_by TEXT CHECK (suggested_by IN ('ai', 'user')),
    venue_name TEXT NOT NULL,
    venue_address TEXT,
    date_type TEXT CHECK (date_type IN ('dinner', 'coffee', 'activity', 'cultural_event', 'virtual')),
    proposed_datetime TIMESTAMPTZ,
    status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'declined', 'completed')),
    budget_estimate NUMERIC,
    booking_link TEXT
);

-- Date Feedback
CREATE TABLE date_feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    match_id TEXT NOT NULL,
    reviewer_profile_id TEXT NOT NULL,
    reviewed_profile_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    met_in_person BOOLEAN,
    would_date_again BOOLEAN,
    safety_concerns BOOLEAN DEFAULT FALSE,
    feedback_notes TEXT
);

-- Chat Games
CREATE TABLE chat_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    match_id TEXT NOT NULL,
    question TEXT NOT NULL,
    user1_answer TEXT,
    user2_answer TEXT,
    is_completed BOOLEAN DEFAULT FALSE
);

-- Live Locations
CREATE TABLE live_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    match_id TEXT NOT NULL,
    sharer_profile_id TEXT NOT NULL,
    location JSONB NOT NULL,
    duration_minutes INTEGER,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Success Stories
CREATE TABLE success_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user1_profile_id TEXT NOT NULL,
    user2_profile_id TEXT,
    couple_photo_url TEXT,
    story_text TEXT NOT NULL,
    match_date DATE,
    relationship_status TEXT CHECK (relationship_status IN ('dating', 'engaged', 'married')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0
);

-- Success Story Contests
CREATE TABLE success_story_contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user1_id TEXT NOT NULL,
    user2_id TEXT,
    story_title TEXT NOT NULL,
    story_text TEXT NOT NULL,
    photos TEXT[],
    contest_month TEXT,
    votes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'winner', 'rejected')),
    prize_awarded TEXT
);

-- Contest Periods
CREATE TABLE contest_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    month TEXT NOT NULL,
    theme TEXT DEFAULT 'Love Stories',
    prizes JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Background Checks
CREATE TABLE background_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    check_type TEXT NOT NULL CHECK (check_type IN ('basic', 'comprehensive')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result TEXT CHECK (result IN ('clear', 'flagged', 'inconclusive')),
    completed_at TIMESTAMPTZ,
    amount_paid NUMERIC,
    report_url TEXT
);

-- Language Exchange
CREATE TABLE language_exchanges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    user_profile_id TEXT NOT NULL,
    teaching_languages TEXT[],
    learning_languages TEXT[],
    proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'native')),
    available_for_exchange BOOLEAN DEFAULT TRUE
);

-- Compatibility Quizzes
CREATE TABLE compatibility_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    questions JSONB NOT NULL,
    compatibility_types JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Quiz Results
CREATE TABLE quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    quiz_id TEXT NOT NULL,
    user_profile_id TEXT NOT NULL,
    answers JSONB NOT NULL,
    compatibility_score JSONB NOT NULL,
    result_type TEXT NOT NULL
);

-- Vendors
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Food & Catering', 'Photography & Video', 'Event Planning', 'Venue', 'Music & Entertainment', 'Beauty & Styling', 'Fashion & Attire', 'Decor & Flowers', 'Transportation', 'Rentals & Equipment', 'Professional Services', 'Health & Wellness', 'Education & Training', 'Home Services', 'Other')),
    location TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL CHECK (country IN ('USA', 'Canada')),
    phone TEXT,
    email TEXT NOT NULL,
    website TEXT,
    description TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    contact_person TEXT,
    specialties TEXT[]
);

-- Wedding Vendors
CREATE TABLE wedding_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Venue', 'Caterer', 'Photographer', 'Decorator', 'Planner', 'Music/DJ', 'Attire', 'Tailor', 'Makeup Artist', 'Hair Stylist', 'Officiant', 'Rentals', 'Baker', 'Florist', 'Henna Artist', 'Traditional Dancers', 'Other')),
    location TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL CHECK (country IN ('USA', 'Canada')),
    phone TEXT,
    email TEXT NOT NULL,
    website TEXT,
    description TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    contact_person TEXT,
    specialties TEXT[]
);

-- =====================================================
-- 20. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_plans ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies (you'll need to customize based on your auth setup)

-- User Profiles: Users can read all, but only update their own
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Likes: Users can see their own likes (sent and received)
CREATE POLICY "Users can view own likes" ON likes FOR SELECT USING (auth.uid()::text = liker_user_id OR auth.uid()::text = liked_user_id);
CREATE POLICY "Users can create likes" ON likes FOR INSERT WITH CHECK (auth.uid()::text = liker_user_id);

-- Messages: Users can see messages in their matches
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid()::text = sender_user_id OR auth.uid()::text = receiver_user_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid()::text = sender_user_id);

-- Matches: Users can see their own matches
CREATE POLICY "Users can view own matches" ON matches FOR SELECT USING (auth.uid()::text = user1_user_id OR auth.uid()::text = user2_user_id);

-- =====================================================
-- 21. FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_calls_updated_at BEFORE UPDATE ON video_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- To use this:
-- 1. Create a new Supabase project
-- 2. Go to SQL Editor
-- 3. Paste this entire file
-- 4. Run it
-- 5. Your database schema is ready!