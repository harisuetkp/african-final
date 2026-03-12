import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Database, Key, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const SCHEMAS = [
  {
    name: "User (Built-in)",
    fields: "id, created_date, full_name, email, role (admin/user)",
    required: "Built-in — auto-created",
    rls: "Admin: full access. User: own record only."
  },
  {
    name: "UserProfile",
    fields: `user_id (string, unique, indexed), stripe_customer_id, display_name, ethnicity (african/african_descent/non_african_interested), birth_date (date), gender (man/woman/non_binary/other, indexed), looking_for (array), photos (array), primary_photo, bio, country_of_origin (indexed), current_country (indexed), current_state (indexed), current_city, tribe_ethnicity, languages (array), preferred_language (en/fr), religion (christianity/islam/traditional_african/judaism/buddhism/hindu/spiritual/agnostic/atheist/other/prefer_not_say, indexed), education (high_school/some_college/bachelors/masters/doctorate/trade_school/other), profession, relationship_goal (dating/serious_relationship/marriage/friendship_community/networking, indexed), height_cm, lifestyle {smoking, drinking, fitness, diet, children}, cultural_values (array), interests (array), prompts (array of {question, answer}), verification_status {email_verified, phone_verified, photo_verified}, is_premium (indexed), subscription_tier (free/premium/elite/vip, indexed), premium_until, is_founding_member (indexed), founding_member_granted_at, founding_member_trial_ends_at, founding_member_source (global_toggle/invite_code/manual_admin), founding_member_code_used, founding_member_eligible, founding_trial_consumed, founding_member_converted, founding_member_converted_at, profile_boost_active, boost_expires_at, incognito_mode, total_matches_count, is_active (indexed), last_active (indexed), location {lat, lng}, filters {age_min, age_max, distance_km, countries_of_origin, states, religions, relationship_goals}, blocked_users (array), daily_likes_count, daily_likes_reset_date, login_streak, last_login_date, ai_safety_score, verification_selfie_url, tutorial_completed, badges (array), violation_count, warning_count, is_banned (indexed), is_suspended (indexed), suspension_expires_at, suspension_reason, ban_reason, has_matched_before, push_token, phone_number, device_ids (array), device_info (array of {device_id, device_name, last_login}), is_test_user (indexed), purchased_boosts, purchased_super_likes, purchased_24hr_unlock, purchased_24hr_unlock_expires, monthly_gifts_remaining, monthly_gifts_reset_date, priority_dm_enabled`,
    required: "user_id, display_name, gender, looking_for, country_of_origin, current_country",
    rls: "read=all, update=own+admin, delete=own, write=own"
  },
  {
    name: "LegalAcceptance",
    fields: "user_id, terms_accepted (bool), privacy_accepted (bool), guidelines_accepted (bool), accepted_at (datetime), ip_address",
    required: "user_id, terms_accepted, privacy_accepted, guidelines_accepted",
    rls: "Default"
  },
  {
    name: "DeletedAccount",
    fields: "user_email, user_id, display_name, deletion_reason, deleted_at (datetime)",
    required: "user_email, deleted_at",
    rls: "admin only"
  },
  {
    name: "Like",
    fields: "liker_id (indexed), liked_id (indexed), liker_user_id (indexed), liked_user_id (indexed), is_super_like (bool), is_seen (bool, indexed), is_priority (bool, indexed), priority_boost_expires (datetime)",
    required: "liker_id, liked_id",
    rls: "read=own, create=own, update=own, delete=own"
  },
  {
    name: "Pass",
    fields: "passer_id (indexed), passed_id (indexed), passer_user_id (indexed), is_rewindable (bool)",
    required: "passer_id, passed_id",
    rls: "read/create/delete=own"
  },
  {
    name: "Match",
    fields: "user1_id (indexed), user2_id (indexed), user1_user_id (indexed), user2_user_id (indexed), user1_liked (bool), user2_liked (bool), is_match (bool, indexed), matched_at (datetime), expires_at (datetime, indexed), is_expired (bool, indexed), last_chance_sent (bool), compatibility_score, compatibility_reasons (array), is_super_like (bool), status (active/unmatched/blocked/expired, indexed), has_nudged (bool), typing_user_id, first_message_sent (bool), first_message_sent_by, first_message_sent_at (datetime)",
    required: "user1_id, user2_id",
    rls: "read/update=own (either user), create=user, delete=admin"
  },
  {
    name: "MatchScore",
    fields: "user1_id, user2_id, total_score, cultural_compatibility, values_alignment, location_proximity, preference_match, match_reasons (array), last_calculated (datetime)",
    required: "user1_id, user2_id, total_score",
    rls: "read=own+admin, create/update/delete=admin"
  },
  {
    name: "DailyMatch",
    fields: "user_profile_id, suggested_profile_id, match_score, match_reasons (array), date, status (pending/viewed/liked/passed), expires_at (datetime)",
    required: "user_profile_id, suggested_profile_id, match_score, date",
    rls: "Default"
  },
  {
    name: "MatchFeedback",
    fields: "user_id (indexed), target_profile_id (indexed), action_type (like/pass/unmatch/block, indexed), feedback_reasons (array), custom_feedback, match_id, time_spent_on_profile_ms, photos_viewed_count, bio_expanded (bool)",
    required: "user_id, target_profile_id, action_type",
    rls: "Default"
  },
  {
    name: "UserMLProfile",
    fields: "user_id (unique, indexed), preference_weights {cultural_background, religion, interests, location, education, lifestyle, relationship_goal, age_proximity}, liked_patterns {countries, religions, interests, professions, age_range}, passed_patterns {countries, religions, interests}, engagement_stats {avg_time_on_liked, avg_time_on_passed, total_likes, total_passes, total_matches, total_conversations, avg_messages_per_match}, last_model_update (datetime)",
    required: "user_id",
    rls: "Default"
  },
  {
    name: "Message",
    fields: "match_id (indexed), sender_id (indexed), receiver_id (indexed), sender_user_id (indexed), receiver_user_id (indexed), sequence_number (indexed), idempotency_key (unique, indexed), content, message_type (text/voice_note/image/ice_breaker/gif), media_url, is_read (bool, indexed), read_at (datetime), is_deleted (bool), is_flagged (bool, indexed), is_translated (bool), like_note",
    required: "match_id, sender_id, receiver_id, content, message_type",
    rls: "read/create/update/delete=own (sender or receiver)"
  },
  {
    name: "MessageTranslation",
    fields: "message_id, original_language, translated_text (object), translation_requested_by (array)",
    required: "message_id, original_language",
    rls: "Default"
  },
  {
    name: "ScamAnalysis",
    fields: "message_id, sender_id, risk_score, scam_type (money_request/crypto/phishing/romance_scam/off_platform/harassment/none), ai_analysis {is_suspicious, confidence, reasons}, action_taken (none/flagged/hidden/blocked_user)",
    required: "message_id, risk_score",
    rls: "admin only"
  },
  {
    name: "IceBreaker",
    fields: "question, cultural_context (african_general/diaspora/traditional/modern/universal), category (values/lifestyle/culture/fun/deep), is_active (bool)",
    required: "question, cultural_context, category",
    rls: "Default"
  },
  {
    name: "ChatGame",
    fields: "match_id, question, user1_answer, user2_answer, is_completed (bool)",
    required: "match_id, question",
    rls: "Default"
  },
  {
    name: "Notification",
    fields: "user_profile_id (indexed), user_id (indexed), type (match/like/message/admin_message/super_like, indexed), title, message, from_profile_id, link_to, is_read (bool, indexed), is_admin (bool)",
    required: "user_profile_id, type, title, message",
    rls: "read/update/delete=own"
  },
  {
    name: "ScreenshotAlert",
    fields: "user_profile_id, screenshot_of_profile_id, screenshot_location (profile/chat/photo), alert_sent (bool)",
    required: "user_profile_id, screenshot_of_profile_id, screenshot_location",
    rls: "Default"
  },
  {
    name: "Subscription",
    fields: "user_profile_id (indexed), plan_type (free/premium_monthly/premium_quarterly/premium_yearly/elite_monthly/elite_quarterly/vip_monthly/vip_6months, indexed), status (active/cancelled/expired/paused, indexed), start_date, end_date (indexed), payment_provider (stripe/apple/google/manual), external_id (indexed), amount_paid, currency, boosts_remaining, super_likes_remaining, auto_renew (bool), regional_pricing (bool)",
    required: "user_profile_id, plan_type, status",
    rls: "read=own+admin, create=user, update/delete=admin"
  },
  {
    name: "InAppPurchase",
    fields: "user_profile_id (indexed), item_type (boost/super_likes/rewind/spotlight/24hr_unlock, indexed), item_quantity, amount_usd, payment_provider (stripe/apple/google), transaction_id, status (pending/completed/failed/refunded, indexed)",
    required: "user_profile_id, item_type, item_quantity, amount_usd",
    rls: "read=own+admin, create=user, update/delete=admin"
  },
  {
    name: "Receipt",
    fields: "transaction_id, user_profile_id, subscription_id, plan_name, billing_period, amount_paid, currency, regional_discount (bool), payment_provider, customer_email, customer_name, purchase_date, subscription_start_date, subscription_end_date, receipt_sent (bool)",
    required: "transaction_id, user_profile_id, amount_paid, purchase_date",
    rls: "Default"
  },
  {
    name: "TierConfiguration",
    fields: "tier_id (free/premium/elite/vip, unique, indexed), display_name, description, color, icon, is_popular (bool), limits {daily_likes, daily_messages, daily_rewinds, daily_super_likes, monthly_boosts}, features (array of {key, label, enabled, tooltip}), pricing {monthly, quarterly, yearly, currency}, sort_order, is_active (bool)",
    required: "tier_id, display_name, limits",
    rls: "read=all, create/update/delete=admin"
  },
  {
    name: "PricingPlan",
    fields: "plan_id, name, tier (free/premium/elite/vip), billing_period (monthly/quarterly/yearly/6months), price_usd, regional_discounts (object), features (array), is_active (bool), is_featured (bool)",
    required: "plan_id, name, tier, billing_period, price_usd",
    rls: "Default"
  },
  {
    name: "Promotion",
    fields: "promo_code, promo_type (discount/free_trial/free_boost/free_super_likes), discount_percentage, trial_days, free_boosts, free_super_likes, valid_from, valid_until, max_uses, current_uses, is_active (bool), target_audience (all/new_users/churned_users/free_users)",
    required: "promo_code, promo_type",
    rls: "Default"
  },
  {
    name: "Story",
    fields: "user_profile_id (indexed), media_url, media_type (photo/video), caption, views (array), expires_at (datetime, indexed), is_expired (bool, indexed)",
    required: "user_profile_id, media_url, media_type",
    rls: "create/read/update=all, delete=own+admin"
  },
  {
    name: "StoryComment",
    fields: "story_id, user_profile_id, content",
    required: "story_id, user_profile_id, content",
    rls: "Default"
  },
  {
    name: "ProfileView",
    fields: "viewer_profile_id (indexed), viewed_profile_id (indexed), view_date (datetime, indexed), view_source (discovery/match/search/profile_link)",
    required: "viewer_profile_id, viewed_profile_id",
    rls: "Default"
  },
  {
    name: "ProfileBoost",
    fields: "user_profile_id, boost_type (1_hour/3_hours/24_hours), started_at, expires_at, is_active (bool), views_gained, likes_gained",
    required: "user_profile_id, boost_type, started_at, expires_at",
    rls: "create=own, read=own+admin, update/delete=admin"
  },
  {
    name: "ProfileAnalytics",
    fields: "user_profile_id (indexed), event_type (indexed), event_data (object), date (indexed), timestamp (datetime), views_count, likes_received, matches_count, messages_sent, response_rate, profile_completion",
    required: "user_profile_id",
    rls: "Default"
  },
  {
    name: "ProfileSuggestion",
    fields: "user_id (indexed), suggestion_type (photo/bio/interests/prompts/verification/activity, indexed), title, description, priority, potential_impact (low/medium/high), action_link, is_dismissed (bool, indexed), is_completed (bool, indexed)",
    required: "user_id, suggestion_type, title, description",
    rls: "Default"
  },
  {
    name: "PhotoEngagement",
    fields: "profile_id, photo_url, viewer_profile_id, action (view/like/pass), photo_index",
    required: "profile_id, photo_url, viewer_profile_id, action",
    rls: "Default"
  },
  {
    name: "PhotoModeration",
    fields: "user_profile_id, photo_url, moderation_status (pending/approved/rejected), ai_analysis (object), rejection_reasons (array), reviewed_by",
    required: "user_profile_id, photo_url",
    rls: "Default"
  },
  {
    name: "VideoCall",
    fields: "match_id (indexed), caller_profile_id (indexed), caller_user_id (indexed), receiver_profile_id (indexed), receiver_user_id (indexed), status (initiated/ringing/connecting/connected/reconnecting/ended/missed/declined/busy/failed, indexed), call_type (video/audio), start_time, answered_time, end_time, duration_seconds, room_id (indexed), call_quality (excellent/good/fair/poor), end_reason (completed/timeout/declined/busy/blocked/network_error/user_left/backgrounded), caller_ice_candidates (array), receiver_ice_candidates (array), caller_sdp (object), receiver_sdp (object), network_stats {avg_bitrate, packet_loss, latency_ms, reconnect_count}, reported (bool), blocked_during_call (bool)",
    required: "match_id, caller_profile_id, receiver_profile_id",
    rls: "read/update=own (caller or receiver), create=caller, delete=admin"
  },
  {
    name: "DatePlan",
    fields: "match_id, suggested_by (ai/user), venue_name, venue_address, date_type (dinner/coffee/activity/cultural_event/virtual), proposed_datetime, status (proposed/accepted/declined/completed), budget_estimate, booking_link",
    required: "match_id, venue_name",
    rls: "create/read/update/delete=own+admin"
  },
  {
    name: "DateFeedback",
    fields: "match_id, reviewer_profile_id, reviewed_profile_id, rating (1-5), met_in_person (bool), would_date_again (bool), safety_concerns (bool), feedback_notes",
    required: "match_id, reviewer_profile_id, reviewed_profile_id, rating",
    rls: "Default"
  },
  {
    name: "LiveLocation",
    fields: "match_id, sharer_profile_id, location {lat, lng}, duration_minutes, expires_at, is_active (bool)",
    required: "match_id, sharer_profile_id, location, expires_at",
    rls: "Default"
  },
  {
    name: "Report",
    fields: "reporter_id (indexed), reported_id (indexed), report_type (fake_profile/harassment/inappropriate_content/scam/underage/spam/hate_speech/other, indexed), description, evidence_urls (array), message_id, status (pending/under_review/resolved/dismissed, indexed), moderator_notes, action_taken (none/warning/temporary_ban/permanent_ban/content_removed), resolved_by, resolved_at",
    required: "reporter_id, reported_id, report_type, description",
    rls: "create=user, read/update/delete=admin"
  },
  {
    name: "ModerationAction",
    fields: "user_profile_id, moderator_id, action_type (warning/content_removed/temporary_mute/temporary_ban/permanent_ban), reason, related_report_id, duration_hours, expires_at, is_active (bool)",
    required: "user_profile_id, moderator_id, action_type, reason",
    rls: "Default"
  },
  {
    name: "ModerationRule",
    fields: "rule_type (blocked_keyword/spam_pattern/inappropriate_content/rate_limit), pattern, action (flag/auto_delete/shadow_ban/notify_admin), severity (low/medium/high/critical), is_active (bool), created_by",
    required: "rule_type, pattern, action, severity",
    rls: "admin only"
  },
  {
    name: "FakeProfileDetection",
    fields: "user_profile_id, risk_score, risk_factors (array), ai_analysis (object), status (safe/suspicious/flagged/banned), reviewed_by_human (bool), last_checked (datetime)",
    required: "user_profile_id, risk_score, status",
    rls: "Default"
  },
  {
    name: "SafetyCheck",
    fields: "user_profile_id (indexed), date_location, meeting_with_profile_id (indexed), emergency_contact_name, emergency_contact_phone, check_in_time (indexed), status (active/checked_in/alert_triggered/completed, indexed), panic_location {lat, lng}, moderator_notes",
    required: "user_profile_id, meeting_with_profile_id",
    rls: "create/read/update/delete=own+admin"
  },
  {
    name: "BackgroundCheck",
    fields: "user_profile_id, check_type (basic/comprehensive), status (pending/processing/completed/failed), result (clear/flagged/inconclusive), completed_at, amount_paid, report_url",
    required: "user_profile_id, check_type",
    rls: "Default"
  },
  {
    name: "VerificationRequest",
    fields: "user_profile_id (indexed), verification_type (photo/id/elite/vip, indexed), submitted_photo_url, submitted_id_url, status (pending/approved/rejected, indexed), reviewed_by, rejection_reason, ai_confidence_score",
    required: "user_profile_id, verification_type, status",
    rls: "Default"
  },
  {
    name: "PhoneVerification",
    fields: "user_id, phone_number, verification_code, is_verified (bool), expires_at, attempts",
    required: "user_id, phone_number",
    rls: "Default"
  },
  {
    name: "Event",
    fields: "title, description, event_type (cultural_festival/meetup/speed_dating/networking/concert/food_festival/art_exhibition/community_gathering/afrobeat_party/dance_party/cultural_night/music_festival, indexed), image_url, start_date (indexed), end_date, location_name, location_address, city (indexed), state (indexed), country (indexed), is_virtual (bool), virtual_link, organizer_id (indexed), attendees (array), max_attendees, is_featured (indexed), tags (array), price, currency",
    required: "title, description, event_type, start_date, city, country",
    rls: "read=all, update/delete/write=organizer+admin"
  },
  {
    name: "VIPEvent",
    fields: "title, description, event_type (speed_dating/mixer/workshop/exclusive_party/webinar, indexed), scheduled_at (indexed), duration_minutes, max_participants, current_participants, cover_image_url, host_name, host_image_url, meeting_link, tier_required (elite/vip, indexed), status (upcoming/live/completed/cancelled, indexed), tags (array)",
    required: "title, event_type, scheduled_at",
    rls: "read=all, create/update/delete=admin"
  },
  {
    name: "VIPEventRegistration",
    fields: "event_id (indexed), user_profile_id (indexed), user_id (indexed), status (registered/attended/no_show/cancelled, indexed), reminder_sent (bool), feedback_rating, feedback_text",
    required: "event_id, user_profile_id",
    rls: "read/update=own+admin, create=own, delete=admin"
  },
  {
    name: "SpeedDatingSession",
    fields: "event_id (indexed), round_number, user1_profile_id (indexed), user2_profile_id (indexed), user1_interested (bool), user2_interested (bool), is_match (bool, indexed), room_id, started_at, ended_at, duration_seconds",
    required: "event_id, round_number, user1_profile_id, user2_profile_id",
    rls: "read=own+admin, create/update/delete=admin"
  },
  {
    name: "FounderInviteCode",
    fields: "code (unique, indexed), max_redemptions, current_redemptions, is_active (bool, indexed), expires_at, trial_days, created_by, notes",
    required: "code",
    rls: "read=all, create/update/delete=admin"
  },
  {
    name: "FounderCodeRedemption",
    fields: "code_id (indexed), code (indexed), user_id (indexed), user_email, device_id (indexed), ip_address",
    required: "code_id, user_id",
    rls: "read=admin, create=user, update/delete=admin"
  },
  {
    name: "Ambassador",
    fields: "user_id (indexed), handle (unique, indexed), display_name, email (indexed), phone, country, bio, social_links {instagram, tiktok, youtube, twitter, linkedin, website}, profile_image_url, status (pending/active/suspended/terminated, indexed), tier (bronze/silver/gold/platinum, indexed), referral_code (unique, indexed), referral_link, qr_code_url, commission_plan_id (indexed), payout_method (paypal/bank_transfer/mobile_money/crypto), payout_details (object), payout_threshold, tax_form_status (not_submitted/pending_review/approved/rejected), terms_accepted (bool), terms_accepted_at, notes, stats {total_clicks, total_signups, total_activations, total_subscribers, total_revenue_generated, total_commissions_earned, total_commissions_paid}, fraud_flags (array), suspended_reason, suspended_at",
    required: "handle, email, referral_code",
    rls: "read/update=own+admin, create/delete=admin"
  },
  {
    name: "AmbassadorCommissionPlan",
    fields: "name, plan_type (cpa/revenue_share/recurring_share/hybrid, indexed), cpa_amount, revenue_share_pct, recurring_share_pct, recurring_months, activation_bonus, signup_bonus, milestone_rules (array of {type, threshold, bonus_amount}), tier_multipliers {bronze, silver, gold, platinum}, is_default (indexed), is_active (indexed), effective_from, effective_until",
    required: "name, plan_type",
    rls: "read=all, create/update/delete=admin"
  },
  {
    name: "AmbassadorReferral",
    fields: "ambassador_id (indexed), user_id (unique, indexed), user_profile_id (indexed), attribution_source (link/code/manual), referral_code_used, first_click_at, attributed_at, attribution_expires_at, referral_history (array), status (pending/signed_up/activated/subscribed/churned, indexed), is_founding_member (bool), founding_trial_ends_at, signup_at, activated_at, first_subscription_at, total_revenue, total_commissions, device_id, ip_address, fraud_flags (array), is_suspicious (bool, indexed)",
    required: "ambassador_id, user_id",
    rls: "read/update/delete=admin, create=user"
  },
  {
    name: "AmbassadorReferralEvent",
    fields: "ambassador_id (indexed), user_id (indexed), referral_id (indexed), event_type (click/signup/activate/subscribe/renew/upgrade/downgrade/cancel/refund/chargeback, indexed), metadata (object), revenue_amount, currency, subscription_id, device_id, ip_address, user_agent",
    required: "ambassador_id, event_type",
    rls: "read/update/delete=admin, create=user"
  },
  {
    name: "AmbassadorCommission",
    fields: "ambassador_id (indexed), referral_id (indexed), user_id, subscription_id, event_id, commission_type (signup_bonus/activation_bonus/cpa/revenue_share/recurring_share/milestone_bonus/campaign_bonus, indexed), amount, currency, tier_multiplier, original_amount, status (pending/approved/paid/reversed/cancelled, indexed), hold_until, approved_at, paid_at, payout_id (indexed), reversal_reason, notes",
    required: "ambassador_id, commission_type, amount",
    rls: "admin only"
  },
  {
    name: "AmbassadorPayout",
    fields: "ambassador_id (indexed), period_start, period_end, total_amount, currency, commission_count, commission_ids (array), status (pending/processing/paid/failed/cancelled, indexed), payout_method (paypal/bank_transfer/mobile_money/crypto), payout_details (object), transaction_id, paid_at, failed_reason, notes",
    required: "ambassador_id, total_amount",
    rls: "admin only"
  },
  {
    name: "AmbassadorCampaign",
    fields: "name, description, campaign_type (bonus_multiplier/flat_bonus/challenge/milestone_race, indexed), bonus_multiplier, flat_bonus_amount, challenge_rules {goal_type, goal_amount, reward_type, reward_value}, eligible_tiers (array), eligible_ambassador_ids (array), starts_at (indexed), ends_at (indexed), is_active (indexed), leaderboard (array of {ambassador_id, score, rank})",
    required: "name, campaign_type, starts_at, ends_at",
    rls: "read=all, create/update/delete=admin"
  },
  {
    name: "AmbassadorContentAsset",
    fields: "name, description, asset_type (image/video/script/hook/brand_guide/banner/story_template, indexed), file_url, thumbnail_url, content_text, campaign_id, tags (array), download_count, is_active (bool)",
    required: "name, asset_type",
    rls: "read=all, create/update/delete=admin"
  },
  {
    name: "SystemSettings",
    fields: "key (unique, indexed), value (object), description, updated_by",
    required: "key, value",
    rls: "read=all, create/update/delete=admin"
  },
  {
    name: "FeatureFlag",
    fields: "feature_name, display_name, description, is_enabled (bool), enabled_for_premium (bool), rollout_percentage",
    required: "feature_name, display_name",
    rls: "read=all, create/update/delete=admin"
  },
  {
    name: "AdminAuditLog",
    fields: "admin_user_id, admin_email, action_type (user_ban/user_delete/user_unban/report_resolved/subscription_cancelled/admin_granted/admin_revoked/message_sent/user_edited/verification_approved/verification_rejected), target_user_id, details (object), ip_address, user_agent",
    required: "admin_user_id, admin_email, action_type",
    rls: "admin only"
  },
  {
    name: "BroadcastMessage",
    fields: "created_by, title, body, target_audience (all/premium/free/active/inactive/custom), custom_filter (object), send_at, status (draft/scheduled/sending/sent/failed), sent_count, open_count",
    required: "created_by, title, body, target_audience",
    rls: "Default"
  },
  {
    name: "ABTest",
    fields: "user_id, test_name, variant, assigned_at, test_type (pricing/paywall_copy/cta_placement/feature), variant_a (object), variant_b (object), traffic_split, metrics {variant_a_conversions, variant_a_views, variant_b_conversions, variant_b_views}, is_active (bool), winner (variant_a/variant_b/no_winner), started_at, ended_at",
    required: "user_id, test_name, variant",
    rls: "Default"
  },
  {
    name: "Advertisement",
    fields: "title, description, image_url, link_url, placement (discovery/matches/events/profile), target_audience (all/free_users/premium_users/specific_country), target_country, is_active (bool), impressions, clicks, start_date, end_date",
    required: "title, image_url, link_url, placement, target_audience",
    rls: "read=all, create/update/delete=admin"
  },
  {
    name: "ErrorLog",
    fields: "message, stack, component_stack, type (error/unhandled_rejection/boundary/console_error), url, user_id, user_email, browser, os, device, breadcrumbs (array), status (new/investigating/resolved/ignored), severity (low/medium/high/critical), ai_analysis {diagnosis, fix_suggestion, severity_assessment}, resolved_by, resolved_at",
    required: "message, type, url",
    rls: "Default"
  },
  {
    name: "Community",
    fields: "name, description, category (interests/location/culture/profession/lifestyle), icon, cover_image, members (array), is_featured (bool)",
    required: "name, description, category, icon",
    rls: "read=all, create/update/delete=admin"
  },
  {
    name: "Referral",
    fields: "referrer_id, referred_id, referred_email, status (pending/completed/failed), reward_given (bool), reward_claimed (bool)",
    required: "referrer_id, referred_email",
    rls: "create/read=own, update/delete=admin"
  },
  {
    name: "LanguageExchange",
    fields: "user_profile_id, teaching_languages (array), learning_languages (array), proficiency_level (beginner/intermediate/advanced/native), available_for_exchange (bool)",
    required: "user_profile_id",
    rls: "Default"
  },
  {
    name: "SuccessStory",
    fields: "user1_profile_id, user2_profile_id, couple_photo_url, story_text, match_date, relationship_status (dating/engaged/married), is_featured (bool), is_approved (bool), likes_count",
    required: "user1_profile_id, story_text",
    rls: "Default"
  },
  {
    name: "SuccessStoryContest",
    fields: "user1_id, user2_id, story_title, story_text, photos (array), contest_month, votes, status (pending/approved/winner/rejected), prize_awarded",
    required: "user1_id, story_title, story_text",
    rls: "Default"
  },
  {
    name: "ContestPeriod",
    fields: "month, theme, prizes {first, second, third}, is_active (bool)",
    required: "month, prizes",
    rls: "read=all, create/update/delete=admin"
  },
  {
    name: "VirtualGift",
    fields: "sender_profile_id, receiver_profile_id, match_id, gift_type, gift_emoji, message, cost, status (sent/received/viewed)",
    required: "sender_profile_id, receiver_profile_id, gift_type, gift_emoji",
    rls: "create=own, read=own+admin, update/delete=admin"
  },
  {
    name: "CompatibilityQuiz",
    fields: "title, description, image_url, questions (array of {question_text, options}), compatibility_types (array of {type_name, description}), is_active (bool)",
    required: "title, description, questions, compatibility_types",
    rls: "Default"
  },
  {
    name: "QuizResult",
    fields: "quiz_id, user_profile_id, answers (array), compatibility_score (object), result_type",
    required: "quiz_id, user_profile_id, answers, compatibility_score, result_type",
    rls: "create/read/update/delete=own"
  },
  {
    name: "WeddingVendor",
    fields: "name, category (17 options including Venue/Caterer/Photographer/Decorator/Planner etc.), location, state, country (USA/Canada), phone, email, website, description, image_url, is_featured (bool), contact_person, specialties (array)",
    required: "name, category, location, country, email",
    rls: "Default"
  },
  {
    name: "Vendor",
    fields: "name, category (15 options including Food & Catering/Photography/Event Planning etc.), location, state, country (USA/Canada), phone, email, website, description, image_url, is_featured (bool), contact_person, specialties (array)",
    required: "name, category, location, country, email",
    rls: "Default"
  },
  {
    name: "SupportTicket",
    fields: "user_id (indexed), user_email, category (technical/account/billing/safety/feature_request/other, indexed), priority (low/medium/high/urgent, indexed), subject, description, status (open/in_progress/waiting/resolved/closed, indexed), assigned_to (indexed), resolution_notes, attachments (array)",
    required: "user_id, user_email, category, subject, description",
    rls: "Default"
  },
  {
    name: "Dispute",
    fields: "user_email (indexed), user_profile_id (indexed), dispute_type (ban_appeal/rate_limit_appeal/false_positive/suspension_appeal, indexed), reason, original_ban_reason, status (pending/under_review/approved/rejected, indexed), admin_response, reviewed_by, reviewed_at, evidence_urls (array)",
    required: "user_email, dispute_type, reason",
    rls: "create=user, read=own+admin, update/delete=admin"
  },
  {
    name: "WaitlistEntry",
    fields: "email, full_name, location, reason, status (pending/invited/joined), ip_address",
    required: "email",
    rls: "Default"
  },
  {
    name: "UserRecommendation",
    fields: "user_id, type (feature/event/match_tip/safety_alert), title, description, action_link, is_dismissed (bool), priority (low/medium/high), trigger_reason",
    required: "user_id, type, title, description",
    rls: "Default"
  }
];

const SECRETS = [
  { name: "STRIPE_PUBLISHABLE_KEY", source: "Stripe Dashboard → Developers → API Keys", url: "https://dashboard.stripe.com/apikeys" },
  { name: "STRIPE_SECRET_KEY", source: "Stripe Dashboard → Developers → API Keys", url: "https://dashboard.stripe.com/apikeys" },
  { name: "GOOGLE_ANALYTICS_ID", source: "Google Analytics → Admin → Data Streams", url: "https://analytics.google.com" },
  { name: "google_oauth_client_secret", source: "Google Cloud Console → APIs → Credentials → OAuth 2.0", url: "https://console.cloud.google.com/apis/credentials" },
  { name: "VAPID_KEY", source: "Firebase Console → Project Settings → Cloud Messaging → Web Push certificates", url: "https://console.firebase.google.com" },
  { name: "FCM_SERVER_KEY", source: "Firebase Console → Project Settings → Cloud Messaging → Server Key", url: "https://console.firebase.google.com" },
  { name: "FIREBASE_AUTH_DOMAIN", source: "Firebase Console → Project Settings → General → Your apps", url: "https://console.firebase.google.com" },
  { name: "FIREBASE_PROJECT_ID", source: "Firebase Console → Project Settings → General", url: "https://console.firebase.google.com" },
  { name: "FIREBASE_API_KEY", source: "Firebase Console → Project Settings → General → Your apps", url: "https://console.firebase.google.com" },
  { name: "GOOGLE_MAPS_API_KEY", source: "Google Cloud Console → APIs → Credentials", url: "https://console.cloud.google.com/apis/credentials" },
];

export default function MigrationDocument() {
  const contentRef = useRef(null);

  const downloadAsText = () => {
    let text = "=".repeat(80) + "\n";
    text += "AFRINNECT - COMPLETE MIGRATION DOCUMENT\n";
    text += "Generated: " + new Date().toISOString() + "\n";
    text += "=".repeat(80) + "\n\n";

    text += "TABLE OF CONTENTS\n";
    text += "-".repeat(40) + "\n";
    text += "1. API Keys & Credentials\n";
    text += "2. Database Schemas (All " + SCHEMAS.length + " Entities)\n\n";

    // Section 1: Secrets
    text += "=".repeat(80) + "\n";
    text += "SECTION 1: API KEYS & CREDENTIALS\n";
    text += "=".repeat(80) + "\n\n";
    text += "NOTE: Actual secret values are stored encrypted in Base44.\n";
    text += "Retrieve them from their original provider dashboards listed below.\n\n";

    SECRETS.forEach(s => {
      text += `Secret: ${s.name}\n`;
      text += `Source: ${s.source}\n`;
      text += `URL: ${s.url}\n\n`;
    });

    // Section 2: Schemas
    text += "\n" + "=".repeat(80) + "\n";
    text += "SECTION 2: DATABASE SCHEMAS (" + SCHEMAS.length + " ENTITIES)\n";
    text += "=".repeat(80) + "\n\n";
    text += "Every entity also has built-in fields: id, created_date, updated_date, created_by\n\n";

    SCHEMAS.forEach((s, i) => {
      text += "-".repeat(80) + "\n";
      text += `${i + 1}. ${s.name}\n`;
      text += "-".repeat(80) + "\n";
      text += `Fields: ${s.fields}\n\n`;
      text += `Required: ${s.required}\n`;
      text += `RLS (Row Level Security): ${s.rls}\n\n`;
    });

    text += "\n" + "=".repeat(80) + "\n";
    text += "END OF DOCUMENT\n";
    text += "=".repeat(80) + "\n";

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Afrinnect_Migration_Document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Migration Document</h1>
              <p className="text-sm text-gray-500">{SCHEMAS.length} entities + credentials</p>
            </div>
          </div>
          <Button onClick={downloadAsText} className="bg-purple-600 hover:bg-purple-700 gap-2">
            <Download size={18} />
            Download .txt
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8" ref={contentRef}>
        {/* Secrets Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Key className="text-amber-600" size={24} />
            <h2 className="text-2xl font-bold">API Keys & Credentials</h2>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-amber-800 text-sm">⚠️ Actual values are encrypted in Base44. Retrieve them from provider dashboards below.</p>
          </div>
          <div className="space-y-2">
            {SECRETS.map(s => (
              <div key={s.name} className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <code className="text-sm font-mono font-bold text-purple-700">{s.name}</code>
                  <p className="text-xs text-gray-500 mt-1">{s.source}</p>
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline whitespace-nowrap">
                  Open Dashboard →
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Schemas Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Database className="text-purple-600" size={24} />
            <h2 className="text-2xl font-bold">Database Schemas ({SCHEMAS.length} Entities)</h2>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">Every entity has built-in fields: <code>id, created_date, updated_date, created_by</code></p>
          </div>
          <div className="space-y-4">
            {SCHEMAS.map((s, i) => (
              <div key={s.name} className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">{i + 1}</span>
                  <h3 className="font-bold text-gray-900">{s.name}</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Fields</p>
                    <p className="text-sm text-gray-700 font-mono leading-relaxed break-all">{s.fields}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Required</p>
                      <p className="text-sm text-red-700 font-mono">{s.required}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <Shield size={12} /> Row Level Security
                      </p>
                      <p className="text-sm text-green-700 font-mono">{s.rls}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}