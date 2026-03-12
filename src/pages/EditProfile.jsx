import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Camera, X, Loader2, Save, Check, Sparkles,
  MapPin, Briefcase, GraduationCap, Heart, Globe, Users, Award, Eye
} from 'lucide-react';
import ProfileCard from '@/components/profile/ProfileCard';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import AfricanPattern from '@/components/shared/AfricanPattern';
import PhotoReorderModal from '@/components/home/PhotoReorderModal';
import EditProfilePhotos from '@/components/profile/EditProfilePhotos';
import EditProfileBasicInfo from '@/components/profile/EditProfileBasicInfo';
import { compressImage, validateImageFile } from '@/components/shared/ImageCompressor';
import ImageCropper from '@/components/shared/ImageCropper';

import { useLanguage } from '@/components/i18n/LanguageContext';

const AFRICAN_COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Ethiopia', 'Egypt', 'Morocco',
  'Tanzania', 'Uganda', 'DR Congo', 'Cameroon', 'Ivory Coast', 'Senegal',
  'Zimbabwe', 'Rwanda', 'Angola', 'Mali', 'Burkina Faso', 'Niger', 'Guinea',
  'Zambia', 'Malawi', 'Somalia', 'Chad', 'Tunisia', 'Botswana', 'Namibia'
];

const ALL_COUNTRIES = [
  ...AFRICAN_COUNTRIES,
  'USA', 'United Kingdom', 'France', 'Canada', 'Germany', 'Brazil',
  'Jamaica', 'Haiti', 'Trinidad and Tobago', 'Netherlands', 'Belgium',
  'Italy', 'Spain', 'Portugal', 'Australia', 'Other'
];

const LANGUAGES = [
  'English', 'French', 'Swahili', 'Arabic', 'Yoruba', 'Hausa', 'Igbo',
  'Amharic', 'Zulu', 'Portuguese', 'Lingala', 'Wolof', 'Twi', 'Shona',
  'Somali', 'Tigrinya', 'Berber', 'Afrikaans', 'Other'
];

const INTERESTS = [
  'Travel', 'Music', 'Cooking', 'Dancing', 'Art', 'Sports', 'Reading',
  'Movies', 'Fashion', 'Technology', 'Business', 'Fitness', 'Photography',
  'Gaming', 'Nature', 'Volunteering', 'Spirituality', 'Food'
];

const CULTURAL_VALUES = [
  'Family First', 'Respect for Elders', 'Community', 'Faith', 'Education',
  'Hard Work', 'Hospitality', 'Cultural Pride', 'Tradition', 'Ubuntu',
  'Generosity', 'Resilience', 'Loyalty', 'Honor'
];

export default function EditProfile() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPhotoReorder, setShowPhotoReorder] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    birth_date: '',
    gender: '',
    photos: [],
    primary_photo: '',
    country_of_origin: '',
    current_country: '',
    current_city: '',
    tribe_ethnicity: '',
    languages: [],
    religion: '',
    education: '',
    profession: '',
    relationship_goal: '',
    height_cm: '',
    lifestyle: {},
    cultural_values: [],
    interests: [],
  });
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [measurementSystem, setMeasurementSystem] = useState('metric'); // 'metric' or 'imperial'

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    try {
      const user = await base44.auth.me();
      
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        const p = profiles[0];
        setProfile(p);
        setFormData({
          display_name: p.display_name || '',
          bio: p.bio || '',
          birth_date: p.birth_date || '',
          gender: p.gender || '',
          photos: Array.isArray(p.photos) ? p.photos : [],
          primary_photo: p.primary_photo || '',
          country_of_origin: p.country_of_origin || '',
          current_country: p.current_country || '',
          current_city: p.current_city || '',
          tribe_ethnicity: p.tribe_ethnicity || '',
          languages: Array.isArray(p.languages) ? p.languages : [],
          religion: p.religion || '',
          education: p.education || '',
          profession: p.profession || '',
          relationship_goal: p.relationship_goal || '',
          height_cm: p.height_cm || '',
          lifestyle: p.lifestyle || {},
          cultural_values: Array.isArray(p.cultural_values) ? p.cultural_values : [],
          interests: Array.isArray(p.interests) ? p.interests : [],
          });
        
        // Set measurement system based on country
        const imperialCountries = ['United States', 'United Kingdom', 'Liberia', 'Myanmar', 'USA'];
        const system = imperialCountries.includes(p.current_country) ? 'imperial' : 'metric';
        setMeasurementSystem(system);

        // Convert cm to feet/inches if needed
        if (p.height_cm) {
          if (system === 'imperial') {
            const totalInches = p.height_cm / 2.54;
            const feet = Math.floor(totalInches / 12);
            const inches = Math.round(totalInches % 12);
            setHeightFeet(feet.toString());
            setHeightInches(inches.toString());
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Load error:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields - with fallbacks
    const saveData = {
      display_name: formData.display_name?.trim() || 'User',
      gender: formData.gender || 'man',
      birth_date: formData.birth_date || new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      country_of_origin: formData.country_of_origin || 'Nigeria',
      current_country: formData.current_country || 'USA',
      current_city: formData.current_city || 'New York',
      photos: formData.photos || [],
      primary_photo: formData.primary_photo || formData.photos?.[0] || '',
      bio: formData.bio || '',
      tribe_ethnicity: formData.tribe_ethnicity || '',
      languages: formData.languages || [],
      religion: formData.religion || '',
      education: formData.education || '',
      profession: formData.profession || '',
      relationship_goal: formData.relationship_goal || 'dating',
      height_cm: formData.height_cm || null,
      lifestyle: formData.lifestyle || {},
      cultural_values: formData.cultural_values || [],
      interests: formData.interests || [],
      looking_for: formData.looking_for || ['woman'],
      video_profile_url: formData.video_profile_url || null,
      voice_intro_url: formData.voice_intro_url || null
    };

    setSaving(true);
    try {
      // Handle Height Conversion
      if (measurementSystem === 'imperial') {
        if (heightFeet || heightInches) {
          const feet = parseInt(heightFeet) || 0;
          const inches = parseInt(heightInches) || 0;
          const totalInches = (feet * 12) + inches;
          saveData.height_cm = Math.round(totalInches * 2.54);
        }
      } else {
        // Metric is already in formData.height_cm
        saveData.height_cm = formData.height_cm ? parseInt(formData.height_cm) : null;
      }
      


      if (profile) {
        await base44.functions.invoke('updateUserProfile', saveData);
      } else {
        // Fallback creation via secure function
        const response = await base44.functions.invoke('createProfile', saveData);
        if (response.data.error) throw new Error(response.data.error);
        setProfile(response.data.profile);
      }
      window.location.href = createPageUrl('Profile');
    } catch (error) {
      console.error('Save error:', error);
      alert(t('errors.saveFailed') + error.message);
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      setImageToCrop(file);
      setShowCropper(true);
    } catch (error) {
      console.error('Validation error:', error);
      alert(error.message);
    }
  };

  const handleCropComplete = async (croppedFile) => {
    setUploading(true);
    setShowCropper(false);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
      const newPhotos = [...(formData.photos || []), file_url];
      setFormData({
        ...formData,
        photos: newPhotos,
        primary_photo: formData.primary_photo || file_url
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert(t('errors.genericUploadFailed'));
    } finally {
      setUploading(false);
      setImageToCrop(null);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      photos: newPhotos,
      primary_photo: formData.photos[index] === formData.primary_photo ? (newPhotos[0] || '') : formData.primary_photo
    });
  };

  const setPrimaryPhoto = (photo) => {
    setFormData({ ...formData, primary_photo: photo });
  };

  const toggleItem = (field, item) => {
    const current = formData[field] || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    setFormData({ ...formData, [field]: updated });
  };



  const calculateCompletion = () => {
    const fields = [
      formData.display_name,
      formData.bio,
      formData.photos?.length > 0,
      formData.birth_date,
      formData.gender,
      formData.country_of_origin,
      formData.current_country,
      formData.current_city,
      formData.profession,
      formData.education,
      formData.religion,
      formData.relationship_goal,
      formData.languages?.length > 0,
      formData.cultural_values?.length > 0,
      formData.interests?.length > 0
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-amber-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={48} />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const completion = calculateCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-amber-50/20 relative pb-24">
      <AfricanPattern className="text-purple-600" opacity={0.03} />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Profile')}>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft size={22} />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{t('editProfile.title')}</h1>
                <p className="text-xs text-gray-500">{completion}% {t('profile.profileCompletion')}</p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="hidden md:flex gap-2 mr-2">
                  <Eye size={18} />
                  {t('editProfile.preview')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-0 shadow-none">
                <div className="bg-white rounded-3xl overflow-hidden h-[600px] overflow-y-auto">
                  <ProfileCard 
                    profile={{ ...formData, id: 'preview', matchScore: 95 }} 
                    previewMode 
                    expanded
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  {t('editProfile.saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2" size={18} />
                  {t('editProfile.saveChanges')}
                </>
              )}
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={completion} className="h-1.5" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Photos Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <EditProfilePhotos
            photos={formData.photos || []}
            primaryPhoto={formData.primary_photo}
            uploading={uploading}
            onPhotoUpload={handlePhotoUpload}
            onRemovePhoto={removePhoto}
            onSetPrimary={setPrimaryPhoto}
            onReorder={() => setShowPhotoReorder(true)}
          />
        </motion.div>

        {/* Photo Reorder Modal */}
        <PhotoReorderModal
          photos={formData.photos || []}
          primaryPhoto={formData.primary_photo}
          open={showPhotoReorder}
          onClose={() => setShowPhotoReorder(false)}
          onSave={(photos, primary) => {
            setFormData({ ...formData, photos, primary_photo: primary });
          }}
        />

        {/* Image Cropper */}
        {showCropper && imageToCrop && (
          <ImageCropper
            imageFile={imageToCrop}
            onCrop={handleCropComplete}
            onCancel={() => {
              setShowCropper(false);
              setImageToCrop(null);
            }}
          />
        )}

        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <EditProfileBasicInfo
            formData={formData}
            onChange={setFormData}
          />
        </motion.div>

        {/* Location & Heritage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                  <Globe size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('editProfile.locationHeritage')}</h2>
                  <p className="text-sm text-white/80">{t('editProfile.locationSubtitle')}</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">{t('onboarding.location.heritage')}</Label>
                  <Select 
                    value={formData.country_of_origin || ''} 
                    onValueChange={(v) => setFormData({ ...formData, country_of_origin: v })}
                  >
                    <SelectTrigger className="border-2 rounded-xl">
                      <SelectValue placeholder={t('onboarding.location.selectCountry')} />
                    </SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">{t('editProfile.tribe')}</Label>
                  <Input
                    value={formData.tribe_ethnicity || ''}
                    onChange={(e) => setFormData({ ...formData, tribe_ethnicity: e.target.value })}
                    placeholder="e.g., Yoruba, Zulu, Kikuyu"
                    className="border-2 focus:border-purple-400 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">{t('onboarding.location.currentCountry')}</Label>
                  <Select 
                    value={formData.current_country || ''} 
                    onValueChange={(v) => setFormData({ ...formData, current_country: v })}
                  >
                    <SelectTrigger className="border-2 rounded-xl">
                      <SelectValue placeholder={t('onboarding.location.whereDoYouLive')} />
                    </SelectTrigger>
                    <SelectContent>
                      {['United States', 'Canada'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">{t('onboarding.location.city')}</Label>
                  <Input
                    value={formData.current_city || ''}
                    onChange={(e) => setFormData({ ...formData, current_city: e.target.value })}
                    placeholder={t('onboarding.location.yourCity')}
                    className="border-2 focus:border-purple-400 rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Work & Education */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('editProfile.workEducation')}</h2>
                  <p className="text-sm text-white/80">{t('editProfile.workSubtitle')}</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">{t('editProfile.profession')}</Label>
                  <Input
                    value={formData.profession || ''}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    placeholder={t('editProfile.whatDoYouDo')}
                    className="border-2 focus:border-purple-400 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">{t('editProfile.education')}</Label>
                  <Select 
                    value={formData.education || ''} 
                    onValueChange={(v) => setFormData({ ...formData, education: v })}
                  >
                    <SelectTrigger className="border-2 rounded-xl">
                      <SelectValue placeholder={t('editProfile.selectEducation')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="some_college">Some College</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="doctorate">Doctorate</SelectItem>
                      <SelectItem value="trade_school">Trade School</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">{t('profile.religion')}</Label>
                  <Select 
                    value={formData.religion || ''} 
                    onValueChange={(v) => setFormData({ ...formData, religion: v })}
                  >
                    <SelectTrigger className="border-2 rounded-xl">
                      <SelectValue placeholder={t('profile.religion')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="christianity">Christianity</SelectItem>
                      <SelectItem value="islam">Islam</SelectItem>
                      <SelectItem value="traditional_african">Traditional African</SelectItem>
                      <SelectItem value="spiritual">Spiritual</SelectItem>
                      <SelectItem value="agnostic">Agnostic</SelectItem>
                      <SelectItem value="atheist">Atheist</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold text-gray-700">{t('editProfile.height')}</Label>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setMeasurementSystem('imperial')}
                        className={`text-xs px-2 py-1 rounded-md transition ${measurementSystem === 'imperial' ? 'bg-white shadow text-purple-600 font-medium' : 'text-gray-500'}`}
                      >
                        {t('editProfile.ft_in')}
                      </button>
                      <button
                        onClick={() => setMeasurementSystem('metric')}
                        className={`text-xs px-2 py-1 rounded-md transition ${measurementSystem === 'metric' ? 'bg-white shadow text-purple-600 font-medium' : 'text-gray-500'}`}
                      >
                        {t('editProfile.cm_short')}
                      </button>
                    </div>
                  </div>
                  
                  {measurementSystem === 'imperial' ? (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={heightFeet}
                          onChange={(e) => setHeightFeet(e.target.value)}
                          placeholder={t('editProfile.feet')}
                          min="0"
                          max="8"
                          className="border-2 focus:border-purple-400 rounded-xl"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-center">{t('editProfile.feet')}</p>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={heightInches}
                          onChange={(e) => setHeightInches(e.target.value)}
                          placeholder={t('editProfile.inches')}
                          min="0"
                          max="11"
                          className="border-2 focus:border-purple-400 rounded-xl"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-center">{t('editProfile.inches')}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Input
                        type="number"
                        value={formData.height_cm || ''}
                        onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                        placeholder={t('editProfile.cm')}
                        min="50"
                        max="300"
                        className="border-2 focus:border-purple-400 rounded-xl"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">{t('editProfile.cm')}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Languages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                  <Globe size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('editProfile.languages')}</h2>
                  <p className="text-sm text-white/80">{t('editProfile.languagesSubtitle')}</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <Badge
                    key={lang}
                    variant={formData.languages?.includes(lang) ? "default" : "outline"}
                    className={`cursor-pointer transition-all text-sm px-4 py-2 ${
                      formData.languages?.includes(lang)
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md scale-105'
                        : 'hover:bg-amber-50 hover:border-amber-300'
                    }`}
                    onClick={() => toggleItem('languages', lang)}
                  >
                    {formData.languages?.includes(lang) && <Check size={14} className="mr-1" />}
                    {lang}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cultural Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                  <Award size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('editProfile.culturalValues')}</h2>
                  <p className="text-sm text-white/80">{t('editProfile.valuesSubtitle')}</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {CULTURAL_VALUES.map(val => (
                  <Badge
                    key={val}
                    variant={formData.cultural_values?.includes(val) ? "default" : "outline"}
                    className={`cursor-pointer transition-all text-sm px-4 py-2 ${
                      formData.cultural_values?.includes(val)
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md scale-105'
                        : 'hover:bg-purple-50 hover:border-purple-300'
                    }`}
                    onClick={() => toggleItem('cultural_values', val)}
                  >
                    {formData.cultural_values?.includes(val) && <Check size={14} className="mr-1" />}
                    {val}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6">
              <div className="flex items-center gap-3 text-white">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('editProfile.interests')}</h2>
                  <p className="text-sm text-white/80">{t('editProfile.interestsSubtitle')}</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(int => (
                  <Badge
                    key={int}
                    variant={formData.interests?.includes(int) ? "default" : "outline"}
                    className={`cursor-pointer transition-all text-sm px-4 py-2 ${
                      formData.interests?.includes(int)
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 shadow-md scale-105'
                        : 'hover:bg-teal-50 hover:border-teal-300'
                    }`}
                    onClick={() => toggleItem('interests', int)}
                  >
                    {formData.interests?.includes(int) && <Check size={14} className="mr-1" />}
                    {int}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>



        {/* Save Button (Bottom) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="flex justify-center pt-4 pb-8"
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white px-12 py-6 text-lg rounded-full shadow-2xl hover:shadow-xl transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin mr-2" size={24} />
                {t('editProfile.savingProfile')}
              </>
            ) : (
              <>
                <Save className="mr-2" size={24} />
                {t('editProfile.saveAll')}
              </>
            )}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}