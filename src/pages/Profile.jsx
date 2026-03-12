import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Settings, Edit2, Camera, Shield, Star, Crown, MapPin,
  Briefcase, GraduationCap, Book, Languages, Heart, ChevronRight,
  LogOut, HelpCircle, Bell, Lock, Eye, Award, Sparkles, BarChart, IdCard, RotateCcw, Users, Zap, MessageCircle, MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import BoostProfileButton from '@/components/profile/BoostProfileButton';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import VerificationBadge from '@/components/shared/VerificationBadge';
import CountryFlag from '@/components/shared/CountryFlag';
import AfricanPattern from '@/components/shared/AfricanPattern';
import FoundingMemberBadge from '@/components/profile/FoundingMemberBadge';
import FoundingMemberStatus from '@/components/subscription/FoundingMemberStatus';
import MobilePhotoGallery from '@/components/shared/MobilePhotoGallery';
import StreakBadge from '@/components/shared/StreakBadge';
import SocialProofBanner from '@/components/shared/SocialProofBanner';
import SpotifySection from '@/components/profile/SpotifySection';
import ProfileBadges from '@/components/profile/ProfileBadges';
import NotificationBell from '@/components/shared/NotificationBell';

import ProfileSuggestions from '@/components/matching/ProfileSuggestions';
import { Share2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function Profile() {
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id');
  
  const [myProfile, setMyProfile] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeMatch, setActiveMatch] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
          if (profiles.length > 0) {
            setMyProfile(profiles[0]);
            setIsOwnProfile(!profileId || profileId === profiles[0].id);
          }
        }
      } catch (e) {
        console.log('Not logged in');
        if (!profileId) {
          base44.auth.redirectToLogin(createPageUrl('Landing'));
        }
      }
    };
    fetchMyProfile();
  }, [profileId]);

  // Fetch profile to view
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', profileId || myProfile?.id],
    queryFn: async () => {
      const id = profileId || myProfile?.id;
      if (!id) return null;
      const profiles = await base44.entities.UserProfile.filter({ id });
      return profiles[0];
    },
    enabled: !!profileId || !!myProfile
  });

  // Check for existing match with this user
  useEffect(() => {
    const checkMatch = async () => {
      if (!myProfile || !profile || isOwnProfile) return;
      
      const matches = await base44.entities.Match.filter({
        $or: [
          { user1_id: myProfile.id, user2_id: profile.id, is_match: true },
          { user1_id: profile.id, user2_id: myProfile.id, is_match: true }
        ]
      });
      
      if (matches.length > 0) {
        setActiveMatch(matches[0]);
      }
    };
    checkMatch();
  }, [myProfile, profile, isOwnProfile]);

  const { data: featureFlags = [] } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => base44.entities.FeatureFlag.list(),
    staleTime: 300000
  });

  const isFeatureEnabled = (featureName) => {
    const flag = featureFlags.find(f => f.feature_name === featureName);
    if (!flag) return false;
    if (flag.is_enabled) return true;
    if (flag.enabled_for_premium && profile?.is_premium) return true;
    return false;
  };

  // Fetch social proof data using useQuery to prevent rate limiting
  const { data: socialProofData = { views: 0, likes: 0, percentile: 0 } } = useQuery({
    queryKey: ['social-proof', profile?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [views, likes] = await Promise.all([
        base44.entities.ProfileView.filter({
          viewed_profile_id: profile.id,
          created_date: { $gte: today }
        }),
        base44.entities.Like.filter({
          liked_id: profile.id,
          created_date: { $gte: weekAgo }
        })
      ]);

      return {
        views: views.length,
        likes: likes.length,
        percentile: profile.profile_performance_percentile || 50
      };
    },
    enabled: !!profile?.id && isOwnProfile,
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  });

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.display_name,
      profile.bio,
      profile.photos?.length > 0,
      profile.birth_date,
      profile.country_of_origin,
      profile.current_city,
      profile.profession,
      profile.education,
      profile.religion,
      profile.relationship_goal,
      profile.interests?.length > 0,
      profile.cultural_values?.length > 0,
      profile.languages?.length > 0
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const handleLogout = async () => {
    await base44.auth.logout(createPageUrl('Landing'));
  };

  const handleShareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.display_name}'s Profile`,
          text: `Check out ${profile?.display_name} on Afrinnect!`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share failed');
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      alert(t('admin.home.linkCopied'));
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  const photo = profile?.primary_photo || profile?.photos?.[0] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400';
  const age = calculateAge(profile?.birth_date);
  const completion = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 relative pb-24">
      <AfricanPattern className="text-purple-600" opacity={0.03} />

      {/* Header */}
      <header className="relative">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-br from-purple-600 via-purple-700 to-amber-600 relative overflow-hidden">
          <AfricanPattern className="text-white" opacity={0.1} />
        </div>

        {/* Profile Photo */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-16">
          <div className="relative">
            <img
              src={photo}
              alt={profile?.display_name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl bg-white"
            />
            {isOwnProfile && (
              <Link to={createPageUrl('EditProfile')}>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition">
                  <Camera size={18} className="text-white" />
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Header Actions */}
        {isOwnProfile && (
          <div className="absolute top-4 right-4 flex gap-2">
            <NotificationBell className="bg-white/20 backdrop-blur text-white hover:bg-white/30" />
            <Link to={createPageUrl('Settings')}>
              <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur text-white hover:bg-white/30">
                <Settings size={20} />
              </Button>
            </Link>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-20">
        {/* Name & Basic Info */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile?.display_name}{age && `, ${age}`}
            </h1>
            <VerificationBadge verification={profile?.verification_status} />
          </div>
          
          <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
            <CountryFlag country={profile?.country_of_origin} size="small" />
            {profile?.tribe_ethnicity && (
              <span>• {profile.tribe_ethnicity}</span>
            )}
          </div>

          <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-1">
            <MapPin size={14} />
            <span>{profile?.current_city}, {profile?.current_country}</span>
          </div>

          <Badge className={`mt-2 text-white ${
            profile?.subscription_tier === 'vip' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 border-0' :
            profile?.subscription_tier === 'elite' ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 border-0' :
            profile?.subscription_tier === 'premium' ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-0' :
            'bg-gray-500 border-0'
          }`}>
            {profile?.subscription_tier === 'vip' ? <Crown size={12} className="mr-1" /> :
             profile?.subscription_tier === 'elite' ? <Zap size={12} className="mr-1" /> :
             profile?.subscription_tier === 'premium' ? <Star size={12} className="mr-1" /> :
             null}
            {profile?.subscription_tier === 'free' || !profile?.subscription_tier ? 'Free Member' : 
             profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1) + ' Member'}
          </Badge>

          {isOwnProfile && profile?.login_streak >= 3 && (
            <div className="mt-3">
              <StreakBadge streak={profile.login_streak} />
            </div>
          )}

          {profile?.is_founding_member && (
            <div className="mt-3">
              <FoundingMemberBadge profile={profile} size="default" />
            </div>
          )}

          {profile?.badges && profile.badges.length > 0 && !profile?.is_founding_member && (
            <div className="mt-3">
              <ProfileBadges badges={profile.badges} />
            </div>
          )}

          {!isOwnProfile && (
            <div className="flex flex-col gap-2 mt-3">
              {activeMatch && (
                <Link to={createPageUrl(`Chat?matchId=${activeMatch.id}`)} className="w-full">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md">
                    <MessageCircle size={18} className="mr-2" />
                    Message {profile.display_name.split(' ')[0]}
                  </Button>
                </Link>
              )}
              <div className="flex gap-2 justify-center">
                <Button onClick={handleShareProfile} variant="outline" size="sm">
                  <Share2 size={14} className="mr-2" />
                  {t('admin.home.shareProfile')}
                </Button>
                <Link to={createPageUrl(`Report?userId=${profile.id}`)}>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                    <AlertTriangle size={14} className="mr-2" />
                    {t('chat.report')}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Social Proof Banner (Own profile only) */}
        {isOwnProfile && (socialProofData.views > 0 || socialProofData.likes > 0) && (
          <div className="mb-6">
            <SocialProofBanner 
              viewsToday={socialProofData.views}
              likesThisWeek={socialProofData.likes}
              percentile={socialProofData.percentile}
            />
          </div>
        )}

        {/* Profile Completion (Own profile only) */}
        {isOwnProfile && completion < 100 && (
          <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{t('admin.home.profileCompletion')}</span>
                <span className="text-sm font-bold text-purple-600">{completion}%</span>
              </div>
              <Progress value={completion} className="h-2 mb-3" />
              <p className="text-xs text-gray-500">
                {t('profile.completeProfile')}
              </p>
              <Link to={createPageUrl('EditProfile')}>
                <Button size="sm" className="mt-3 w-full bg-purple-600 hover:bg-purple-700">
                  {t('admin.home.completeProfileBtn')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Founding Member Status Card (Own profile only) */}
        {isOwnProfile && profile?.is_founding_member && (
          <div className="mb-6">
            <FoundingMemberStatus profile={profile} />
          </div>
        )}

        {/* AI Profile Suggestions (Own profile only) */}
        {isOwnProfile && profile && (
          <div className="mb-6">
            <ProfileSuggestions userProfile={profile} />
          </div>
        )}

        {/* Spotify/IG Section */}
        <SpotifySection profile={profile} />

        {/* Bio */}
        {profile?.bio && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <p className="text-gray-700 italic text-center">"{profile.bio}"</p>
            </CardContent>
          </Card>
        )}



        {/* Photo Gallery */}
        {profile?.photos?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3 px-1">Photos</h3>
            <MobilePhotoGallery photos={profile.photos} />
          </div>
        )}

        {/* Mutual Interests (For Other Profiles) */}
        {!isOwnProfile && myProfile && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3 px-1">You Both Like</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests?.filter(i => myProfile.interests?.includes(i)).map((interest, idx) => (
                <Badge key={idx} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 py-1.5 px-3">
                  <Sparkles size={12} className="mr-1" />
                  {interest}
                </Badge>
              ))}
              {profile.interests?.filter(i => myProfile.interests?.includes(i)).length === 0 && (
                <p className="text-sm text-gray-500 italic">No common interests yet. Be the first to introduce something new!</p>
              )}
            </div>
          </div>
        )}



        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {profile?.profession && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Briefcase size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('profile.work')}</p>
                  <p className="text-sm font-medium text-gray-800">{profile.profession}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {profile?.education && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <GraduationCap size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('profile.education')}</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">{profile.education?.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {profile?.religion && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Book size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('profile.religion')}</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">{profile.religion?.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {profile?.relationship_goal && (
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Heart size={16} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('profile.lookingFor')}</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">{profile.relationship_goal?.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Languages */}
        {(profile?.languages?.length > 0 || isOwnProfile) && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Languages size={16} className="text-purple-600" />
                Languages
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {profile?.languages?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-gray-100">
                      {lang}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Link to={createPageUrl('EditProfile')}>
                  <Button variant="ghost" size="sm" className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-200">
                    + Add Languages
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Interests */}
        {(profile?.interests?.length > 0 || isOwnProfile) && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles size={16} className="text-amber-600" />
                Interests
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {profile?.interests?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-700">
                      {interest}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Link to={createPageUrl('EditProfile')}>
                  <Button variant="ghost" size="sm" className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-200">
                    + Add Interests
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cultural Values */}
        {(profile?.cultural_values?.length > 0 || isOwnProfile) && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award size={16} className="text-green-600" />
                Cultural Values
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {profile?.cultural_values?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.cultural_values.map((value, idx) => (
                    <Badge key={idx} variant="outline" className="border-amber-300 text-amber-700">
                      {value}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Link to={createPageUrl('EditProfile')}>
                  <Button variant="ghost" size="sm" className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-200">
                    + Add Cultural Values
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prompts */}
        {profile?.prompts?.length > 0 && (
          <div className="space-y-3 mb-6">
            {profile.prompts.map((prompt, idx) => (
              <Card key={idx} className="bg-gradient-to-br from-purple-50 to-amber-50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-purple-700 mb-2">{prompt.question}</p>
                  <p className="text-gray-700">{prompt.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Action Buttons - SIMPLIFIED */}
        {isOwnProfile && (
          <div className="space-y-3 mt-8">
            {/* Primary Action */}
            <Link to={createPageUrl('EditProfile')}>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 h-14" size="lg">
                <Edit2 size={20} className="mr-2" />
                {t('profile.editProfile')}
              </Button>
            </Link>

            {/* Secondary Actions in Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-12" size="lg">
                  More Options
                  <ChevronRight size={18} className="ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-sm" align="center">
                {!profile?.verification_status?.photo_verified && (
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('VerifyPhoto')} className="flex items-center">
                      <Shield size={16} className="mr-2 text-green-600" />
                      {t('profile.verifyPhoto')}
                    </Link>
                  </DropdownMenuItem>
                )}
                {profile?.is_premium && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Analytics')} className="flex items-center">
                        <BarChart size={16} className="mr-2 text-blue-600" />
                        {t('profile.viewAnalytics')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('ProfileOptimization')} className="flex items-center">
                        <Sparkles size={16} className="mr-2 text-purple-600" />
                        {t('profile.optimizeProfile')}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('SuccessStories')} className="flex items-center">
                    <Heart size={16} className="mr-2 text-pink-600" />
                    Success Stories
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('SafetyCheckMonitor')} className="flex items-center">
                    <Shield size={16} className="mr-2 text-green-600" />
                    Safety Check
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <BoostProfileButton 
              userProfile={profile} 
              onBoostSuccess={() => window.location.reload()}
            />

            <Link to={createPageUrl('PricingPlans')}>
              <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 h-14" size="lg">
                <Crown size={20} className="mr-2" />
                {profile?.subscription_tier && profile?.subscription_tier !== 'free' 
                  ? t('admin.home.managePlan') 
                  : t('profile.upgradePremium')}
              </Button>
            </Link>

            <Separator className="my-4" />

            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut size={18} className="mr-2" />
              {t('profile.logout')}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}