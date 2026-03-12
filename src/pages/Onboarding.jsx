import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Camera, Loader2, Check, Heart,
  Globe, Users, Shield, Sparkles, MapPin, Crown, Gift
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import Logo from '@/components/shared/Logo';
import AfricanPattern from '@/components/shared/AfricanPattern';
import SafetyEducationModal from '@/components/safety/SafetyEducationModal';
import { useConversionTracker, CONVERSION_EVENTS } from '@/components/shared/ConversionTracker';
import { useLanguage } from '@/components/i18n/LanguageContext';
import CelebrationModal from '@/components/shared/CelebrationModal';
import FoundingMemberWelcome from '@/components/founding/FoundingMemberWelcome';

const AFRICAN_COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Ethiopia', 'Egypt', 'Morocco',
  'Tanzania', 'Uganda', 'DR Congo', 'Cameroon', 'Ivory Coast', 'Senegal',
  'Zimbabwe', 'Rwanda', 'Angola', 'Mali', 'Burkina Faso', 'Niger', 'Guinea',
  'Algeria', 'Tunisia', 'Libya', 'Somalia', 'Eritrea', 'Djibouti'
];

// RESTRICTED: Only USA and Canada for residence
const ALLOWED_RESIDENCE_COUNTRIES = ['United States', 'Canada'];

const ALL_COUNTRIES = [
  ...AFRICAN_COUNTRIES,
  'USA', 'United Kingdom', 'France', 'Canada', 'Germany', 'Brazil',
  'Jamaica', 'Haiti', 'Netherlands', 'Belgium', 'Italy', 'Spain', 'Australia', 'Other'
];

const INTERESTS = [
  'Travel', 'Music', 'Cooking', 'Dancing', 'Art', 'Sports', 'Reading',
  'Movies', 'Fashion', 'Technology', 'Business', 'Fitness', 'Photography', 'Food'
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { trackEvent } = useConversionTracker();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [showSafetyEducation, setShowSafetyEducation] = useState(false);
  const [showFoundingWelcome, setShowFoundingWelcome] = useState(false);
  const [createdProfile, setCreatedProfile] = useState(null);
  const [formData, setFormData] = useState(() => {
    // Check for referral code, founder code, and ambassador code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const founderCode = urlParams.get('founder') || urlParams.get('code');
    const ambassadorCode = urlParams.get('a') || urlParams.get('ambassador') || urlParams.get('r');
    
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
    }
    if (founderCode) {
      localStorage.setItem('founder_invite_code', founderCode);
    }
    if (ambassadorCode) {
      localStorage.setItem('ambassador_code', ambassadorCode);
    }

    // Load from localStorage if available
    const saved = localStorage.getItem('onboarding_data');
    const savedRef = localStorage.getItem('referral_code');
    const savedFounderCode = localStorage.getItem('founder_invite_code');
    const savedAmbassadorCode = localStorage.getItem('ambassador_code');
    
    return saved ? { ...JSON.parse(saved), referred_by: savedRef, founder_invite_code: savedFounderCode, ambassador_code: savedAmbassadorCode } : {
      display_name: '',
      referred_by: savedRef || '',
      founder_invite_code: savedFounderCode || '',
      ambassador_code: savedAmbassadorCode || '',
      birth_date: '',
      gender: '',
      looking_for: [],
      photos: [],
      country_of_origin: '',
      current_country: '',
      current_city: '',
      relationship_goal: '',
      interests: [],
      location: { lat: null, lng: null }
    };
  });
  const [isUploading, setIsUploading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Social proof for conversion
  const [recentSignups] = useState(() => {
    const names = ['Amara', 'Kwame', 'Fatou', 'Kofi', 'Nia', 'Adaeze', 'Jabari', 'Zuri'];
    const cities = ['Atlanta', 'Toronto', 'Houston', 'London', 'Chicago', 'Dallas', 'DMV', 'NYC'];
    return names.slice(0, 3).map((name, i) => ({
      name,
      city: cities[i],
      time: `${Math.floor(Math.random() * 5) + 1} min ago`
    }));
  });

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('onboarding_data', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Check if user already has profile
        const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
        if (profiles.length > 0) {
          navigate(createPageUrl('Home'));
        }
        } catch (e) {
        // Not logged in - redirect to login
        console.log('User not authenticated');
        base44.auth.redirectToLogin(window.location.href);
      }
    };
    checkUser();
  }, [navigate]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGender = (gender) => {
    setFormData(prev => ({
      ...prev,
      looking_for: prev.looking_for.includes(gender)
        ? prev.looking_for.filter(g => g !== gender)
        : [...prev.looking_for, gender]
    }));
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : prev.interests.length < 5 ? [...prev.interests, interest] : prev.interests
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate max size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t('errors.photoSize'));
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateField('photos', [...formData.photos, file_url]);
      if (!formData.primary_photo) {
        updateField('primary_photo', file_url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(t('errors.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const createProfileMutation = useMutation({
  mutationFn: async () => {
    // CRITICAL: Check for existing profile (prevent duplicates)
    const existingProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    if (existingProfiles.length > 0) {
      throw new Error(t('errors.existingProfile'));
    }

      // Get device fingerprint
      const deviceId = navigator.userAgent + '_' + new Date().getTime();
      
      // Check phone number uniqueness if provided
      const phoneNumber = formData.phone_number;
      if (phoneNumber) {
        const phoneCheck = await base44.entities.UserProfile.filter({ phone_number: phoneNumber });
        if (phoneCheck.length >= 2) {
          throw new Error(t('errors.phoneRegistered'));
        }
      }

      // Check account limit (strict 1 account per user_id, allows re-registration after deletion)
      const isAdmin = user?.role === 'admin' || user?.email === 'pivotngoyb@gmail.com';
      if (!isAdmin) {
        const allUserProfiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (allUserProfiles.length >= 1) {
          throw new Error("You already have an account. Please log in.");
        }
      }

      const response = await base44.functions.invoke('createProfile', {
        ...formData,
        device_id: deviceId,
        device_name: navigator.userAgent.substring(0, 50)
      });

      if (response.data.error) throw new Error(response.data.error);
      
      // Clear saved progress on success
      localStorage.removeItem('onboarding_data');
      
      const profile = response.data.profile;

      // Request push notification permission immediately
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            // Check if browser supports Firebase messaging
            const { isSupported } = await import('firebase/messaging');
            const supported = await isSupported();
            
            if (supported) {
              // Get FCM token and save it
              const { messaging } = await import('@/components/firebase/firebaseConfig');
              const { getToken } = await import('firebase/messaging');
              
              try {
                const vapidKey = await base44.functions.invoke('getVapidKey');
                const token = await getToken(messaging, { vapidKey: vapidKey.vapid_key });
                
                // Save token to profile
                await base44.functions.invoke('updateUserProfile', { push_token: token });
              } catch (tokenError) {
                console.error('Failed to get FCM token:', tokenError);
              }
            }
          }
        }
      } catch (notifError) {
        console.error('Push notification setup failed:', notifError);
      }

      return profile;
    },
    onSuccess: (profile) => {
      setCreatedProfile(profile);
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        // If founding member, show special welcome first
        if (profile?.is_founding_member) {
          setShowFoundingWelcome(true);
        } else {
          setShowSafetyEducation(true);
        }
      }, 3000);
    },
    onError: (error) => {
      // Parse and display user-friendly error messages
      let friendlyMessage = "Something went wrong. Please try again.";
      const msg = error.message || '';
      
      if (msg.includes('already exists') || msg.includes('already have')) {
        friendlyMessage = "You already have an account. Redirecting you to login...";
        setTimeout(() => navigate(createPageUrl('Home')), 2000);
      } else if (msg.includes('Phone number')) {
        friendlyMessage = "This phone number is already registered. Please use a different number.";
      } else if (msg.includes('18 years')) {
        friendlyMessage = "You must be at least 18 years old to join.";
      } else if (msg.includes('rejected')) {
        friendlyMessage = "Your profile information couldn't be verified. Please check your details and try again.";
      } else if (msg.includes('Birth date')) {
        friendlyMessage = "Please enter your date of birth to continue.";
      } else if (msg.includes('Unauthorized')) {
        friendlyMessage = "Your session has expired. Please log in again.";
        setTimeout(() => base44.auth.redirectToLogin(window.location.href), 2000);
      } else if (msg && msg !== 'null' && msg !== 'undefined') {
        friendlyMessage = msg;
      }
      
      alert(friendlyMessage);
    }
      });

  const getLocation = async () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // CRITICAL: Check if user is in USA or Canada
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            const addr = data.address || {};
            const country = addr.country;
            const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || '';
            const state = addr.state || addr.province || '';
            
            // Only allow USA and Canada (Bypass for Admin)
            const isAdmin = user?.role === 'admin' || user?.email === 'pivotngoyb@gmail.com';
            if (!isAdmin && (!country || (country !== 'United States' && country !== 'Canada' && country !== 'United States of America'))) {
              alert('Afrinnect is currently only available in the United States and Canada. You will be redirected to join our waitlist.');
              // Log them out and redirect to waitlist
              await base44.auth.logout(createPageUrl('Waitlist'));
              return;
            }

            // Auto-fill location data
            setFormData(prev => ({
              ...prev,
              location: { lat, lng },
              current_country: country === 'United States of America' ? 'United States' : country,
              current_city: city,
              current_state: state
            }));

          } catch (e) {
            console.error('Location validation failed:', e);
            // On error, don't allow - require location verification
            alert('We could not verify your location. Please ensure location services are enabled and try again.');
            setGettingLocation(false);
            return;
          }
          setGettingLocation(false);
        },
        (error) => {
          alert(t('location.enableAccess'));
          setGettingLocation(false);
        }
      );
    } else {
      alert(t('location.geoNotSupported'));
      setGettingLocation(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // Welcome
      case 1: 
        // Combined: Name + DOB + Gender + Looking For
        const nameValid = formData.display_name && formData.display_name.trim().length >= 2;
        const ageValid = formData.birth_date && calculateAge(formData.birth_date) >= 18;
        const genderValid = formData.gender && formData.looking_for.length > 0;
        return nameValid && ageValid && genderValid;
      case 2: 
        // Combined: Location + Heritage + Goal
        const locationValid = formData.country_of_origin && formData.current_country && formData.current_city;
        const geoValid = formData.location.lat && formData.location.lng;
        const goalValid = formData.relationship_goal;
        return locationValid && geoValid && goalValid;
      case 3: 
        // Combined: Photos + Interests
        return formData.photos.length >= 2 && formData.interests.length >= 3;
      default: return false;
    }
  };

  const progress = ((step) / 3) * 100;

  const steps = [
    // Step 0: Welcome
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center relative"
    >
      <Logo size="large" />
      <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">
        Your Journey Starts Here
      </h1>
      <p className="text-gray-500 text-lg mb-2">
        {t('onboarding.welcome.subtitle')}
      </p>
      
      <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 mb-6">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-sm text-green-700 font-medium">147 people signed up today</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-white rounded-xl shadow-sm">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
            <Globe size={20} className="text-purple-600" />
          </div>
          <p className="text-xs text-gray-600 font-medium">{t('onboarding.welcome.global')}</p>
        </div>
        <div className="text-center p-3 bg-white rounded-xl shadow-sm">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center">
            <Users size={20} className="text-amber-600" />
          </div>
          <p className="text-xs text-gray-600 font-medium">{t('onboarding.welcome.cultural')}</p>
        </div>
        <div className="text-center p-3 bg-white rounded-xl shadow-sm">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
            <Shield size={20} className="text-green-600" />
          </div>
          <p className="text-xs text-gray-600 font-medium">{t('onboarding.welcome.safe')}</p>
        </div>
      </div>
      
      <div className="flex justify-center gap-6 mb-6 text-sm">
        <div className="text-center">
          <p className="font-bold text-purple-600">1 min</p>
          <p className="text-gray-500 text-xs">to complete</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-purple-600">100%</p>
          <p className="text-gray-500 text-xs">free to join</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-purple-600">🇺🇸 🇨🇦</p>
          <p className="text-gray-500 text-xs">USA & Canada</p>
        </div>
      </div>

      <p className="text-xs text-gray-400">{t('onboarding.welcome.terms')}</p>

      {formData.founder_invite_code && (
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-200 rounded-full"><Crown size={20} className="text-amber-700" /></div>
            <div className="text-left">
              <p className="font-bold text-amber-800">Founding Member Code Applied!</p>
              <p className="text-xs text-amber-600 mt-1">6 months of Premium free!</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>,

    // Step 1: COMBINED - Basic Info + Gender + Looking For
    <motion.div
      key="basics-combined"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">About You</h2>
        <p className="text-gray-500 text-sm">Let's get the basics</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">{t('onboarding.basic.firstName')}</Label>
          <Input
            value={formData.display_name}
            onChange={(e) => updateField('display_name', e.target.value)}
            placeholder="Your first name"
            className="mt-1 h-11 border-2 focus:border-purple-500"
            autoFocus
          />
        </div>

        <div>
          <Label className="text-sm font-medium">{t('onboarding.basic.birthday')}</Label>
          <Input
            type="date"
            value={formData.birth_date}
            onChange={(e) => updateField('birth_date', e.target.value)}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            className="mt-1 h-11 border-2 focus:border-purple-500"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">{t('onboarding.gender.iAm')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {['man', 'woman'].map(gender => (
              <button
                key={gender}
                onClick={() => updateField('gender', gender)}
                className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                  formData.gender === gender ? 'border-purple-600 bg-purple-50' : 'border-gray-200'
                }`}
              >
                <span className="text-xl">{gender === 'man' ? '👨' : '👩'}</span>
                <span className={`font-medium ${formData.gender === gender ? 'text-purple-600' : 'text-gray-700'}`}>
                  {gender === 'man' ? 'Man' : 'Woman'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">{t('onboarding.gender.lookingFor')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {['man', 'woman'].map(gender => (
              <button
                key={gender}
                onClick={() => toggleGender(gender)}
                className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                  formData.looking_for.includes(gender) ? 'border-purple-600 bg-purple-50' : 'border-gray-200'
                }`}
              >
                <span className="text-xl">{gender === 'man' ? '👨' : '👩'}</span>
                <span className={`font-medium ${formData.looking_for.includes(gender) ? 'text-purple-600' : 'text-gray-700'}`}>
                  {gender === 'man' ? 'Men' : 'Women'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>,

    // Step 2: COMBINED - Location + Heritage + Goal
    <motion.div
      key="location-combined"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Background</h2>
        <p className="text-gray-500 text-sm">Help us find your perfect match</p>
      </div>

      <div>
        <Label className="text-sm font-medium">Heritage Country</Label>
        <Select value={formData.country_of_origin} onValueChange={(v) => updateField('country_of_origin', v)}>
          <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Select country" /></SelectTrigger>
          <SelectContent>
            {AFRICAN_COUNTRIES.map(country => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={`p-4 rounded-xl border-2 ${formData.location.lat ? 'border-green-500 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin size={20} className={formData.location.lat ? 'text-green-600' : 'text-amber-600'} />
            <div>
              {formData.location.lat ? (
                <p className="font-semibold text-sm text-green-800">{formData.current_city}, {formData.current_country}</p>
              ) : (
                <p className="font-semibold text-sm text-amber-800">Enable location to continue</p>
              )}
            </div>
          </div>
          {!formData.location.lat && (
            <Button onClick={getLocation} disabled={gettingLocation} size="sm" className="bg-amber-600 hover:bg-amber-700">
              {gettingLocation ? <Loader2 size={16} className="animate-spin" /> : 'Enable'}
            </Button>
          )}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">What are you looking for?</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'dating', emoji: '💕', label: 'Dating' },
            { value: 'serious_relationship', emoji: '❤️', label: 'Relationship' },
            { value: 'marriage', emoji: '💍', label: 'Marriage' },
            { value: 'friendship_community', emoji: '🤝', label: 'Friendship' }
          ].map(goal => (
            <button
              key={goal.value}
              onClick={() => updateField('relationship_goal', goal.value)}
              className={`p-3 rounded-xl border-2 transition text-left ${
                formData.relationship_goal === goal.value ? 'border-purple-600 bg-purple-50' : 'border-gray-200'
              }`}
            >
              <span className="text-xl mr-2">{goal.emoji}</span>
              <span className={`font-medium text-sm ${formData.relationship_goal === goal.value ? 'text-purple-600' : 'text-gray-700'}`}>
                {goal.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>,

    // Step 3: COMBINED - Photos + Interests (Final Step)
    <motion.div
      key="photos-interests"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5"
    >
      <div className="text-center">
        <span className="text-3xl">🎉</span>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Almost Done!</h2>
        <p className="text-gray-500 text-sm">Add photos & interests</p>
      </div>

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Photos ({formData.photos.length}/2 min)</Label>
          {formData.photos.length >= 2 && <span className="text-xs text-green-600 flex items-center gap-1"><Check size={12} />Ready!</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {formData.photos.map((photo, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  const newPhotos = formData.photos.filter((_, i) => i !== idx);
                  updateField('photos', newPhotos);
                  if (idx === 0 && newPhotos.length > 0) updateField('primary_photo', newPhotos[0]);
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <span className="text-white text-xs">✕</span>
              </button>
            </div>
          ))}
          {formData.photos.length < 4 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isUploading} />
              {isUploading ? <Loader2 size={24} className="text-purple-600 animate-spin" /> : <Camera size={24} className="text-gray-400" />}
            </label>
          )}
        </div>
      </div>

      {/* Interests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Interests ({formData.interests.length}/3 min)</Label>
          {formData.interests.length >= 3 && <span className="text-xs text-green-600 flex items-center gap-1"><Check size={12} />Great!</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(interest => (
            <Badge
              key={interest}
              variant={formData.interests.includes(interest) ? "default" : "outline"}
              className={`cursor-pointer py-1.5 px-3 transition ${
                formData.interests.includes(interest) ? 'bg-purple-600 text-white' : 'hover:bg-purple-50'
              }`}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      {formData.photos.length >= 2 && formData.interests.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-gradient-to-r from-purple-50 to-amber-50 rounded-xl border border-purple-200 text-center"
        >
          <p className="text-purple-800 font-medium">🎊 You're all set! Tap below to start</p>
        </motion.div>
      )}
    </motion.div>
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 relative">
      <AfricanPattern className="text-purple-600" opacity={0.03} />

      {/* Progress Bar - Enhanced with motivation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg">
        {step > 0 && (
          <div className="relative">
            <Progress value={progress} className="h-2 rounded-none" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-600">
              {Math.round(progress)}%
            </div>
          </div>
        )}
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => {
              if (step === 0) {
                if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
                  navigate(createPageUrl('Landing'));
                }
              } else {
                setStep(step - 1);
              }
            }} 
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div className="text-center">
            <span className="text-sm font-medium text-gray-700">
              {step === 0 ? 'Get Started' : `Step ${step} of 3`}
            </span>
            {step > 0 && step <= 3 && (
              <p className="text-xs text-purple-600 font-medium">
                {step === 1 && "Great start! 🎉"}
                {step === 2 && "Almost there! 🚀"}
                {step === 3 && "Final step! 🎯"}
              </p>
            )}
          </div>
          <button 
            onClick={() => {
              if (confirm('Exit onboarding? Your progress will be saved.')) {
                navigate(createPageUrl('Landing'));
              }
            }}
            className="text-sm text-gray-500 hover:text-red-600 transition px-2 py-1"
          >
            Exit
          </button>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-6 pb-32 pt-24">
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - Enhanced */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          {/* Social proof ticker */}
          {step > 0 && step < 6 && (
            <div className="mb-3 overflow-hidden">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>{recentSignups[step % 3]?.name} from {recentSignups[step % 3]?.city} just signed up</span>
              </div>
            </div>
          )}
          
          <Button
            onClick={() => {
              if (step === 3) {
                createProfileMutation.mutate();
              } else {
                setStep(step + 1);
              }
            }}
            disabled={!canProceed() || createProfileMutation.isPending}
            className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
          >
            {createProfileMutation.isPending ? (
              <Loader2 size={24} className="animate-spin" />
            ) : step === 3 ? (
              <>
                <Sparkles size={20} className="mr-2" />
                {t('onboarding.navigation.startMatching')}
              </>
            ) : (
              <>
                {t('common.continue')}
                <ArrowRight size={20} className="ml-2" />
              </>
            )}
          </Button>
          
          {/* Trust signals */}
          {step === 0 && (
            <p className="text-center text-xs text-gray-400 mt-3">
              🔒 Your data is encrypted • Takes ~2 minutes
            </p>
          )}
        </div>
      </div>

      {/* Profile Complete Celebration */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        title="Welcome to Afrinnect!"
        message="Your profile is ready. Let's find your perfect match!"
        emoji="🎉"
      />

      {/* Founding Member Welcome Modal */}
      <FoundingMemberWelcome
        isOpen={showFoundingWelcome}
        onClose={() => {
          setShowFoundingWelcome(false);
          setShowSafetyEducation(true);
        }}
        profile={createdProfile}
      />

      {/* Safety Education Modal */}
      <SafetyEducationModal
        open={showSafetyEducation}
        onClose={() => setShowSafetyEducation(false)}
        onComplete={() => {
          setShowSafetyEducation(false);
          navigate(createPageUrl('Home'));
        }}
      />
    </div>
  );
}