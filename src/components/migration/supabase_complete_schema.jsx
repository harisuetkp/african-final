-- =============================================
-- AFRINNECT SUPABASE DATABASE SCHEMA
-- Complete migration from Base44
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CUSTOM TYPES (ENUMS)
-- =============================================

CREATE TYPE ethnicity_type AS ENUM ('african', 'african_descent', 'non_african_interested');
CREATE TYPE gender_type AS ENUM ('man', 'woman', 'non_binary', 'other');
CREATE TYPE language_pref AS ENUM ('en', 'fr');
CREATE TYPE religion_type AS ENUM ('christianity', 'islam', 'traditional_african', 'judaism', 'buddhism', 'hindu', 'spiritual', 'agnostic', 'atheist', 'other', 'prefer_not_say');
CREATE TYPE education_type AS ENUM ('high_school', 'some_college', 'bachelors', 'masters', 'doctorate', 'trade_school', 'other');
CREATE TYPE relationship_goal_type AS ENUM ('dating', 'serious_relationship', 'marriage', 'friendship_community', 'networking');
CREATE TYPE subscription_tier_type AS ENUM ('free', 'premium', 'elite', 'vip');
CREATE TYPE founding_source_type AS ENUM ('global_toggle', 'invite_code', 'manual_admin');
CREATE TYPE lifestyle_option AS ENUM ('never', 'sometimes', 'regularly', 'socially', 'active', 'very_active');
CREATE TYPE diet_type AS ENUM ('no_preference', 'halal', 'kosher', 'vegetarian', 'vegan');
CREATE TYPE children_status AS ENUM ('have_want_more', 'have_dont_want_more', 'dont_have_want', 'dont_have_dont_want', 'undecided');
CREATE TYPE match_status_type AS ENUM ('active', 'unmatched', 'blocked', 'expired');
CREATE TYPE message_type AS ENUM ('text', 'voice_note', 'image', 'ice_breaker', 'gif');
CREATE TYPE notification_type AS ENUM ('match', 'like', 'message', 'admin_message', 'super_like');
CREATE TYPE subscription_plan_type AS ENUM ('free', 'premium_monthly', 'premium_quarterly', 'premium_yearly', 'elite_monthly', 'elite_quarterly', 'vip_monthly', 'vip_6months');
CREATE TYPE subscription_status_type AS ENUM ('active', 'cancelled', 'expired', 'paused');
CREATE TYPE payment_provider_type AS ENUM ('stripe', 'apple', 'google', 'manual');

-- =============================================
-- USER PROFILES TABLE
-- =============================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    display_name TEXT NOT NULL,
    ethnicity ethnicity_type,
    birth_date DATE,
    gender gender_type NOT NULL,
    looking_for TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    primary_photo TEXT,
    bio TEXT,
    country_of_origin TEXT NOT NULL,
    current_country TEXT NOT NULL,
    current_state TEXT,
    current_city TEXT,
    tribe_ethnicity TEXT,
    languages TEXT[] DEFAULT '{}',
    preferred_language language_pref DEFAULT 'en',
    religion religion_type,
    education education_type,
    profession TEXT,
    relationship_goal relationship_goal_type,
    height_cm NUMERIC,
    
    -- Lifestyle (JSONB for flexibility)
    lifestyle JSONB DEFAULT '{}',
    
    -- Arrays
    cultural_values TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    prompts JSONB DEFAULT '[]',
    blocked_users UUID[] DEFAULT '{}',
    badges TEXT[] DEFAULT '{}',
    device_ids TEXT[] DEFAULT '{}',
    device_info JSONB DEFAULT '[]',
    
    -- Verification
    verification_status JSONB DEFAULT '{"email_verified": false, "phone_verified": false, "photo_verified": false}',
    verification_selfie_url TEXT,
    
    -- Subscription
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_tier subscription_tier_type DEFAULT 'free',
    premium_until DATE,
    
    -- Founding Member
    is_founding_member BOOLEAN DEFAULT FALSE,
    founding_member_granted_at TIMESTAMPTZ,
    founding_member_trial_ends_at TIMESTAMPTZ,
    founding_member_source founding_source_type,
    founding_member_code_used TEXT,
    founding_member_eligible BOOLEAN DEFAULT TRUE,
    founding_trial_consumed BOOLEAN DEFAULT FALSE,
    founding_member_converted BOOLEAN DEFAULT FALSE,
    founding_member_converted_at TIMESTAMPTZ,
    
    -- Boost
    profile_boost_active BOOLEAN DEFAULT FALSE,
    boost_expires_at TIMESTAMPTZ,
    
    -- Activity
    is_active BOOLEAN DEFAULT TRUE,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    location JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    
    -- Daily limits
    daily_likes_count INTEGER DEFAULT 0,
    daily_likes_reset_date DATE,
    
    -- Streaks
    login_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    
    -- Safety
    ai_safety_score NUMERIC,
    violation_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_expires_at TIMESTAMPTZ,
    suspension_reason TEXT,
    ban_reason TEXT,
    
    -- Misc
    tutorial_completed BOOLEAN DEFAULT FALSE,
    has_matched_before BOOLEAN DEFAULT FALSE,
    push_token TEXT,
    phone_number TEXT,
    is_test_user BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_gender ON user_profiles(gender);
CREATE INDEX idx_user_profiles_country_of_origin ON user_profiles(country_of_origin);
CREATE INDEX idx_user_profiles_current_country ON user_profiles(current_country);
CREATE INDEX idx_user_profiles_current_state ON user_profiles(current_state);
CREATE INDEX idx_user_profiles_religion ON user_profiles(religion);
CREATE INDEX idx_user_profiles_relationship_goal ON user_profiles(relationship_goal);
CREATE INDEX idx_user_profiles_is_premium ON user_profiles(is_premium);
CREATE INDEX idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_is_founding_member ON user_profiles(is_founding_member);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX idx_user_profiles_last_active ON user_profiles(last_active);
CREATE INDEX idx_user_profiles_is_banned ON user_profiles(is_banned);
CREATE INDEX idx_user_profiles_is_suspended ON user_profiles(is_suspended);
CREATE INDEX idx_user_profiles_is_test_user ON user_profiles(is_test_user);

-- =============================================
-- LIKES TABLE
-- =============================================

CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    liker_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    liked_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    liker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_super_like BOOLEAN DEFAULT FALSE,
    is_seen BOOLEAN DEFAULT FALSE,
    is_priority BOOLEAN DEFAULT FALSE,
    priority_boost_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(liker_id, liked_id)
);

CREATE INDEX idx_likes_liker_id ON likes(liker_id);
CREATE INDEX idx_likes_liked_id ON likes(liked_id);
CREATE INDEX idx_likes_liker_user_id ON likes(liker_user_id);
CREATE INDEX idx_likes_liked_user_id ON likes(liked_user_id);
CREATE INDEX idx_likes_is_seen ON likes(is_seen);
CREATE INDEX idx_likes_is_priority ON likes(is_priority);

-- =============================================
-- PASSES TABLE
-- =============================================

CREATE TABLE passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    passed_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    passer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_rewindable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(passer_id, passed_id)
);

CREATE INDEX idx_passes_passer_id ON passes(passer_id);
CREATE INDEX idx_passes_passed_id ON passes(passed_id);
CREATE INDEX idx_passes_passer_user_id ON passes(passer_user_id);

-- =============================================
-- MATCHES TABLE
-- =============================================

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user1_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user1_liked BOOLEAN DEFAULT FALSE,
    user2_liked BOOLEAN DEFAULT FALSE,
    is_match BOOLEAN DEFAULT FALSE,
    matched_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_expired BOOLEAN DEFAULT FALSE,
    last_chance_sent BOOLEAN DEFAULT FALSE,
    compatibility_score NUMERIC,
    compatibility_reasons TEXT[] DEFAULT '{}',
    is_super_like BOOLEAN DEFAULT FALSE,
    status match_status_type DEFAULT 'active',
    has_nudged BOOLEAN DEFAULT FALSE,
    typing_user_id UUID,
    first_message_sent BOOLEAN DEFAULT FALSE,
    first_message_sent_by UUID,
    first_message_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
CREATE INDEX idx_matches_user1_user_id ON matches(user1_user_id);
CREATE INDEX idx_matches_user2_user_id ON matches(user2_user_id);
CREATE INDEX idx_matches_is_match ON matches(is_match);
CREATE INDEX idx_matches_expires_at ON matches(expires_at);
CREATE INDEX idx_matches_is_expired ON matches(is_expired);
CREATE INDEX idx_matches_status ON matches(status);

-- =============================================
-- MESSAGES TABLE
-- =============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sequence_number INTEGER,
    idempotency_key TEXT UNIQUE,
    content TEXT NOT NULL,
    message_type message_type NOT NULL,
    media_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_flagged BOOLEAN DEFAULT FALSE,
    is_translated BOOLEAN DEFAULT FALSE,
    like_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_sender_user_id ON messages(sender_user_id);
CREATE INDEX idx_messages_receiver_user_id ON messages(receiver_user_id);
CREATE INDEX idx_messages_sequence_number ON messages(sequence_number);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_is_flagged ON messages(is_flagged);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    from_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    link_to TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_profile_id ON notifications(user_profile_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_type subscription_plan_type NOT NULL,
    status subscription_status_type NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    payment_provider payment_provider_type,
    external_id TEXT,
    amount_paid NUMERIC,
    currency TEXT DEFAULT 'USD',
    boosts_remaining INTEGER DEFAULT 0,
    super_likes_remaining INTEGER DEFAULT 0,
    auto_renew BOOLEAN DEFAULT TRUE,
    regional_pricing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_profile_id ON subscriptions(user_profile_id);
CREATE INDEX idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscriptions_external_id ON subscriptions(external_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS
CREATE POLICY "Anyone can read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON user_profiles FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Likes RLS
CREATE POLICY "Users can read their likes" ON likes FOR SELECT USING (auth.uid() = liker_user_id OR auth.uid() = liked_user_id);
CREATE POLICY "Users can create likes" ON likes FOR INSERT WITH CHECK (auth.uid() = liker_user_id);
CREATE POLICY "Users can update their likes" ON likes FOR UPDATE USING (auth.uid() = liker_user_id OR auth.uid() = liked_user_id);
CREATE POLICY "Users can delete their likes" ON likes FOR DELETE USING (auth.uid() = liker_user_id);

-- Passes RLS
CREATE POLICY "Users can read own passes" ON passes FOR SELECT USING (auth.uid() = passer_user_id);
CREATE POLICY "Users can create passes" ON passes FOR INSERT WITH CHECK (auth.uid() = passer_user_id);
CREATE POLICY "Users can delete own passes" ON passes FOR DELETE USING (auth.uid() = passer_user_id);

-- Matches RLS
CREATE POLICY "Users can read their matches" ON matches FOR SELECT USING (auth.uid() = user1_user_id OR auth.uid() = user2_user_id);
CREATE POLICY "Authenticated users can create matches" ON matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their matches" ON matches FOR UPDATE USING (auth.uid() = user1_user_id OR auth.uid() = user2_user_id);

-- Messages RLS
CREATE POLICY "Users can read their messages" ON messages FOR SELECT USING (auth.uid() = sender_user_id OR auth.uid() = receiver_user_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_user_id);
CREATE POLICY "Users can update their messages" ON messages FOR UPDATE USING (auth.uid() = sender_user_id);
CREATE POLICY "Users can delete their messages" ON messages FOR DELETE USING (auth.uid() = sender_user_id);

-- Notifications RLS
CREATE POLICY "Users can read their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions RLS
CREATE POLICY "Users can read their subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = (SELECT user_id FROM user_profiles WHERE id = user_profile_id));

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_likes_updated_at BEFORE UPDATE ON likes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Run these in Supabase Dashboard > Storage
-- CREATE BUCKET: photos (public)
-- CREATE BUCKET: verification (private)
-- CREATE BUCKET: voice-notes (private)

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;