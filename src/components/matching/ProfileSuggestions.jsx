import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Camera, FileText, Heart, Shield, Activity, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

const suggestionIcons = {
  photo: Camera,
  bio: FileText,
  interests: Heart,
  verification: Shield,
  activity: Activity,
  prompts: FileText
};

const impactColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700'
};

export default function ProfileSuggestions({ userProfile, onRefresh }) {
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchSuggestions();
    }
  }, [userProfile?.id]);

  const fetchSuggestions = async () => {
    try {
      // First check for existing suggestions
      const existing = await base44.entities.ProfileSuggestion.filter({
        user_id: userProfile.id,
        is_dismissed: false,
        is_completed: false
      }, '-priority', 5);

      if (existing.length > 0) {
        setSuggestions(existing);
        setIsLoading(false);
        return;
      }

      // Generate new suggestions
      setIsRefreshing(true);
      const response = await base44.functions.invoke('profileOptimizer', {
        userId: userProfile.id
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions || []);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshSuggestions = async () => {
    setIsRefreshing(true);
    try {
      const response = await base44.functions.invoke('profileOptimizer', {
        userId: userProfile.id
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions || []);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to refresh suggestions:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const dismissSuggestion = async (suggestion) => {
    setDismissedIds(prev => [...prev, suggestion.suggestion_type]);
    
    // If suggestion has an ID (from database), update it
    if (suggestion.id) {
      try {
        await base44.entities.ProfileSuggestion.update(suggestion.id, { is_dismissed: true });
      } catch (e) {
        console.error('Failed to dismiss suggestion:', e);
      }
    }
  };

  const visibleSuggestions = suggestions.filter(s => !dismissedIds.includes(s.suggestion_type));

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          <span className="text-gray-600">Analyzing your profile...</span>
        </div>
      </Card>
    );
  }

  if (visibleSuggestions.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-bold text-green-800">Your profile looks great!</h3>
          <p className="text-sm text-green-600 mt-1">
            No major improvements needed right now.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={refreshSuggestions}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Check again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI Profile Insights</h3>
            <p className="text-xs text-gray-500">Personalized tips to get more matches</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={refreshSuggestions}
          disabled={isRefreshing}
        >
          {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {/* Stats Preview */}
      {stats && (
        <Card className="p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              <p className="text-xs text-gray-500">Profile Views</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.viewToLikeRate}%</p>
              <p className="text-xs text-gray-500">View → Like</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-600">{stats.likeToMatchRate}%</p>
              <p className="text-xs text-gray-500">Like → Match</p>
            </div>
          </div>
        </Card>
      )}

      {/* Suggestions */}
      <AnimatePresence>
        {visibleSuggestions.map((suggestion, idx) => {
          const Icon = suggestionIcons[suggestion.suggestion_type] || Sparkles;
          
          return (
            <motion.div
              key={suggestion.suggestion_type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    suggestion.potential_impact === 'high' ? 'bg-red-100' :
                    suggestion.potential_impact === 'medium' ? 'bg-amber-100' : 'bg-green-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      suggestion.potential_impact === 'high' ? 'text-red-600' :
                      suggestion.potential_impact === 'medium' ? 'text-amber-600' : 'text-green-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                        <Badge className={`mt-1 ${impactColors[suggestion.potential_impact]}`}>
                          {suggestion.potential_impact} impact
                        </Badge>
                      </div>
                      <button 
                        onClick={() => dismissSuggestion(suggestion)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X size={16} className="text-gray-400" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-2">{suggestion.description}</p>
                    
                    {suggestion.action_link && (
                      <Link to={createPageUrl(suggestion.action_link)}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 gap-1"
                        >
                          Take action
                          <ChevronRight size={14} />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}