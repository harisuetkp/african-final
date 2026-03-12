import React, { useState } from 'react';
import { useDebounce } from '@/components/shared/useDebounce';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { base44 } from '@/api/base44Client';

const ALL_COUNTRIES = [
  // Africa
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Ethiopia', 'Egypt', 'Morocco',
  'Tanzania', 'Uganda', 'DR Congo', 'Cameroon', 'Ivory Coast', 'Senegal',
  'Zimbabwe', 'Rwanda', 'Angola', 'Mali', 'Burkina Faso', 'Niger', 'Guinea',
  'Algeria', 'Tunisia', 'Libya', 'Botswana', 'Namibia', 'Zambia', 'Malawi',
  // Americas
  'USA', 'Canada', 'Brazil', 'Mexico', 'Jamaica', 'Haiti', 'Colombia', 'Argentina',
  'Dominican Republic', 'Trinidad and Tobago', 'Venezuela', 'Peru', 'Chile', 'Ecuador',
  // Europe
  'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Belgium',
  'Portugal', 'Sweden', 'Switzerland', 'Ireland', 'Poland', 'Norway', 'Denmark', 'Austria',
  // Middle East
  'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Turkey', 'Lebanon', 'Jordan', 'Oman',
  // Asia
  'India', 'China', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Philippines',
  // Oceania
  'Australia', 'New Zealand'
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
];

const RELIGIONS = [
  { value: 'christianity', label: 'Christianity' },
  { value: 'islam', label: 'Islam' },
  { value: 'traditional_african', label: 'Traditional African' },
  { value: 'spiritual', label: 'Spiritual' },
  { value: 'agnostic', label: 'Agnostic' },
  { value: 'prefer_not_say', label: 'Any' }
];

const RELATIONSHIP_GOALS = [
  { value: 'dating', label: 'Dating' },
  { value: 'serious_relationship', label: 'Serious Relationship' },
  { value: 'marriage', label: 'Marriage' },
  { value: 'friendship', label: 'Friendship' }
];

const EDUCATION_LEVELS = [
  { value: 'high_school', label: 'High School' },
  { value: 'some_college', label: 'Some College' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate' }
];

const LANGUAGES = [
  'English', 'French', 'Arabic', 'Swahili', 'Yoruba', 
  'Igbo', 'Hausa', 'Amharic', 'Zulu', 'Portuguese', 'Spanish',
  'Lingala', 'Wolof', 'Somali', 'Berber', 'Oromo'
];

const CULTURAL_VALUES = [
  'Family-Oriented', 'Community-Focused', 'Respect for Elders', 'Spirituality', 
  'Hospitality', 'Resilience', 'Tradition', 'Innovation', 'Generosity',
  'Polygamy', 'Monogamy', 'Prefer Not Say'
];

const INTERESTS = [
  'Music', 'Dance', 'Art', 'Cuisine', 'Travel', 'Sports', 'Reading', 
  'Movies', 'Nature', 'Technology', 'Fashion', 'History', 'Politics',
  'Volunteering', 'Photography', 'Gaming', 'Fitness', 'Writing', 'Animals'
];

const PREFERRED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' }
];

export default function FilterDrawer({ filters, onFiltersChange, isPremium = false, userTier = 'free' }) {
  const [localFilters, setLocalFilters] = useState(filters || {
    age_min: 18,
    age_max: 50,
    distance_km: 100,
    countries_of_origin: [],
    states: [],
    religions: [],
    relationship_goals: [],
    education_levels: [],
    cultural_values: [],
    interests: [],
    preferred_language: '',
    verified_only: false
  });

  const [isOpen, setIsOpen] = useState(false);
  const debouncedFilters = useDebounce(localFilters, 500);

  // Apply debounced filters automatically
  React.useEffect(() => {
    if (JSON.stringify(debouncedFilters) !== JSON.stringify(filters)) {
      onFiltersChange(debouncedFilters);
    }
  }, [debouncedFilters, filters, onFiltersChange]);

  const updateFilter = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key, item) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key]?.includes(item)
        ? prev[key].filter(i => i !== item)
        : [...(prev[key] || []), item]
    }));
  };

  const applyFilters = async () => {
    onFiltersChange(localFilters);
    
    // Save filters to user profile
    try {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        await base44.entities.UserProfile.update(profiles[0].id, {
          filters: localFilters
        });
      }
    } catch (e) {
      console.log('Failed to save filters');
    }
    
    setIsOpen(false);
  };

  const resetFilters = () => {
    const defaultFilters = {
      age_min: 18,
      age_max: 50,
      distance_km: 100,
      countries_of_origin: [],
      states: [],
      religions: [],
      relationship_goals: [],
      education_levels: [],
      cultural_values: [],
      interests: [],
      preferred_language: '',
      verified_only: false
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeFiltersCount = [
    localFilters.countries_of_origin?.length > 0,
    localFilters.states?.length > 0,
    localFilters.religions?.length > 0,
    localFilters.relationship_goals?.length > 0,
    localFilters.education_levels?.length > 0,
    localFilters.cultural_values?.length > 0,
    localFilters.interests?.length > 0,
    localFilters.preferred_language !== '',
    localFilters.age_min !== 18 || localFilters.age_max !== 50,
    localFilters.distance_km !== 100,
    localFilters.verified_only
  ].filter(Boolean).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative gap-2">
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-purple-600 text-white text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Filters</SheetTitle>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-gray-500">
              <RotateCcw size={16} className="mr-1" />
              Reset
            </Button>
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-180px)] px-6 py-4">
          <div className="space-y-8">
            {/* Age Range */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-4 block">
                Age Range: {localFilters.age_min} - {localFilters.age_max}
              </Label>
              <div className="pt-2 px-2">
                <Slider
                  min={18}
                  max={70}
                  step={1}
                  value={[localFilters.age_min, localFilters.age_max]}
                  onValueChange={([min, max]) => {
                    updateFilter('age_min', min);
                    updateFilter('age_max', max);
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* Distance */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-4 block">
                Distance: {localFilters.distance_km === 500 ? 'Global' : `${localFilters.distance_km} km`}
              </Label>
              <div className="pt-2 px-2">
                <Slider
                  min={10}
                  max={500}
                  step={10}
                  value={[localFilters.distance_km]}
                  onValueChange={([val]) => updateFilter('distance_km', val)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Countries of Origin */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Heritage Country
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {ALL_COUNTRIES.map(country => (
                  <Badge
                    key={country}
                    variant={localFilters.countries_of_origin?.includes(country) ? "default" : "outline"}
                    className={`cursor-pointer transition ${
                      localFilters.countries_of_origin?.includes(country)
                        ? 'bg-purple-600 text-white'
                        : 'hover:bg-purple-50'
                    } ${!isPremium ? 'opacity-50' : ''}`}
                    onClick={() => {
                      if (!isPremium) {
                        alert('Upgrade to Premium to filter by heritage country');
                        return;
                      }
                      toggleArrayItem('countries_of_origin', country);
                    }}
                  >
                    {country}
                  </Badge>
                ))}
              </div>
            </div>

            {/* US States */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                US State
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {US_STATES.map(state => (
                  <Badge
                    key={state}
                    variant={localFilters.states?.includes(state) ? "default" : "outline"}
                    className={`cursor-pointer transition ${
                      localFilters.states?.includes(state)
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-blue-50'
                    } ${!isPremium ? 'opacity-50' : ''}`}
                    onClick={() => {
                      if (!isPremium) {
                        alert('Upgrade to Premium to filter by US state');
                        return;
                      }
                      toggleArrayItem('states', state);
                    }}
                  >
                    {state}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Relationship Goals */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Looking For
              </Label>
              <div className="space-y-2">
                {RELATIONSHIP_GOALS.map(goal => (
                  <div key={goal.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={goal.value}
                      checked={localFilters.relationship_goals?.includes(goal.value)}
                      onCheckedChange={() => toggleArrayItem('relationship_goals', goal.value)}
                    />
                    <label htmlFor={goal.value} className="text-sm cursor-pointer">
                      {goal.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Religion */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Religion
              </Label>
              <div className="space-y-2">
                {RELIGIONS.map(religion => (
                  <div key={religion.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={religion.value}
                      checked={localFilters.religions?.includes(religion.value)}
                      onCheckedChange={() => toggleArrayItem('religions', religion.value)}
                    />
                    <label htmlFor={religion.value} className="text-sm cursor-pointer">
                      {religion.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Education Level
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              <div className="space-y-2">
                {EDUCATION_LEVELS.map(edu => (
                  <div key={edu.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={edu.value}
                      checked={localFilters.education_levels?.includes(edu.value)}
                      onCheckedChange={() => isPremium && toggleArrayItem('education_levels', edu.value)}
                      disabled={!isPremium}
                    />
                    <label htmlFor={edu.value} className={`text-sm cursor-pointer ${!isPremium ? 'opacity-50' : ''}`}>
                      {edu.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Height Range */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-4 block">
                Height: {localFilters.height_min || 140} - {localFilters.height_max || 220} cm
              </Label>
              <div className="pt-2 px-2">
                <Slider
                  min={140}
                  max={220}
                  step={5}
                  value={[localFilters.height_min || 140, localFilters.height_max || 220]}
                  onValueChange={([min, max]) => {
                    updateFilter('height_min', min);
                    updateFilter('height_max', max);
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* Languages */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Languages Spoken
              </Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <Badge
                    key={lang}
                    variant={localFilters.languages?.includes(lang) ? "default" : "outline"}
                    className={`cursor-pointer transition ${
                      localFilters.languages?.includes(lang)
                        ? 'bg-purple-600 text-white'
                        : 'hover:bg-purple-50'
                    }`}
                    onClick={() => toggleArrayItem('languages', lang)}
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Lifestyle */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">Lifestyle</Label>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Smoking</Label>
                  <div className="flex flex-wrap gap-2">
                    {['never', 'sometimes', 'regularly'].map(option => (
                      <Badge
                        key={option}
                        variant={localFilters.smoking?.includes(option) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem('smoking', option)}
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Drinking</Label>
                  <div className="flex flex-wrap gap-2">
                    {['never', 'socially', 'regularly'].map(option => (
                      <Badge
                        key={option}
                        variant={localFilters.drinking?.includes(option) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem('drinking', option)}
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Fitness</Label>
                  <div className="flex flex-wrap gap-2">
                    {['never', 'sometimes', 'active', 'very_active'].map(option => (
                      <Badge
                        key={option}
                        variant={localFilters.fitness?.includes(option) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem('fitness', option)}
                      >
                        {option.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cultural Values */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Cultural Values
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {CULTURAL_VALUES.map(value => (
                  <Badge
                    key={value}
                    variant={localFilters.cultural_values?.includes(value) ? "default" : "outline"}
                    className={`cursor-pointer transition ${
                      localFilters.cultural_values?.includes(value)
                        ? 'bg-purple-600 text-white'
                        : 'hover:bg-purple-50'
                    } ${!isPremium ? 'opacity-50' : ''}`}
                    onClick={() => {
                      if (!isPremium) {
                        alert('Upgrade to Premium to filter by cultural values');
                        return;
                      }
                      toggleArrayItem('cultural_values', value);
                    }}
                  >
                    {value}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Interests
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {INTERESTS.map(interest => (
                  <Badge
                    key={interest}
                    variant={localFilters.interests?.includes(interest) ? "default" : "outline"}
                    className={`cursor-pointer transition ${
                      localFilters.interests?.includes(interest)
                        ? 'bg-purple-600 text-white'
                        : 'hover:bg-purple-50'
                    } ${!isPremium ? 'opacity-50' : ''}`}
                    onClick={() => {
                      if (!isPremium) {
                        alert('Upgrade to Premium to filter by interests');
                        return;
                      }
                      toggleArrayItem('interests', interest);
                    }}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                Preferred Language
                {!isPremium && <span className="text-amber-600 text-xs ml-2">Premium</span>}
              </Label>
              <div className="flex flex-wrap gap-2">
                {PREFERRED_LANGUAGES.map(lang => (
                  <Badge
                    key={lang.value}
                    variant={localFilters.preferred_language === lang.value ? "default" : "outline"}
                    className={`cursor-pointer transition ${
                      localFilters.preferred_language === lang.value
                        ? 'bg-purple-600 text-white'
                        : 'hover:bg-purple-50'
                    } ${!isPremium ? 'opacity-50' : ''}`}
                    onClick={() => {
                      if (!isPremium) {
                        alert('Upgrade to Premium to filter by preferred language');
                        return;
                      }
                      updateFilter('preferred_language', localFilters.preferred_language === lang.value ? '' : lang.value);
                    }}
                  >
                    {lang.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Verified Only */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Verified Profiles Only</Label>
                  <p className="text-xs text-gray-500 mt-1">Show only photo-verified users</p>
                </div>
                <Checkbox
                  checked={localFilters.verified_only}
                  onCheckedChange={(checked) => updateFilter('verified_only', checked)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <Button 
            onClick={applyFilters}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}