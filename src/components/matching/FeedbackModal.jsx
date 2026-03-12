import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsDown, AlertCircle, MapPin, Heart, UserX, Camera, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from '@/api/base44Client';

const PASS_REASONS = [
  { id: 'not_my_type', label: 'Not my type', icon: ThumbsDown },
  { id: 'no_common_interests', label: 'No common interests', icon: Heart },
  { id: 'too_far', label: 'Too far away', icon: MapPin },
  { id: 'different_values', label: 'Different values/beliefs', icon: AlertCircle },
  { id: 'poor_photos', label: 'Unclear or few photos', icon: Camera },
  { id: 'empty_profile', label: 'Profile lacks detail', icon: MessageSquare },
  { id: 'suspicious', label: 'Seems suspicious', icon: UserX },
];

const UNMATCH_REASONS = [
  { id: 'no_response', label: 'They never responded', icon: MessageSquare },
  { id: 'conversation_died', label: 'Conversation fizzled out', icon: ThumbsDown },
  { id: 'not_compatible', label: 'Not compatible', icon: Heart },
  { id: 'uncomfortable', label: 'They made me uncomfortable', icon: AlertCircle },
  { id: 'met_someone', label: 'I met someone else', icon: UserX },
  { id: 'fake_profile', label: 'Fake or misleading profile', icon: Camera },
];

export default function FeedbackModal({ 
  open, 
  onClose, 
  profile, 
  actionType = 'pass', // 'pass' or 'unmatch'
  myProfileId,
  onSubmit 
}) {
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = actionType === 'pass' ? PASS_REASONS : UNMATCH_REASONS;

  const toggleReason = (id) => {
    setSelectedReasons(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      // Record feedback via ML engine
      await base44.functions.invoke('mlMatchingEngine', {
        action: 'record_interaction',
        payload: {
          userId: myProfileId,
          targetProfileId: profile.id,
          actionType,
          metadata: {
            reasons: selectedReasons,
            customFeedback: customFeedback || null
          }
        }
      });

      onSubmit?.(selectedReasons);
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="font-bold text-gray-900">
                {actionType === 'pass' ? 'Help us improve' : 'Why are you unmatching?'}
              </h3>
              <p className="text-sm text-gray-500">
                Your feedback helps us find better matches
              </p>
            </div>
            <button 
              onClick={handleSkip}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Profile Preview */}
          {profile && (
            <div className="flex items-center gap-3 p-4 bg-gray-50">
              <img 
                src={profile.primary_photo || profile.photos?.[0]} 
                alt={profile.display_name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-gray-900">{profile.display_name}</p>
                <p className="text-sm text-gray-500">
                  {profile.current_city}, {profile.current_state}
                </p>
              </div>
            </div>
          )}

          {/* Reasons */}
          <div className="p-4 space-y-2 max-h-[40vh] overflow-y-auto">
            <p className="text-sm text-gray-600 mb-3">
              Select all that apply (optional):
            </p>
            {reasons.map((reason) => {
              const Icon = reason.icon;
              const isSelected = selectedReasons.includes(reason.id);
              return (
                <button
                  key={reason.id}
                  onClick={() => toggleReason(reason.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Icon size={18} className={isSelected ? 'text-purple-500' : 'text-gray-400'} />
                  <span className="font-medium">{reason.label}</span>
                  {isSelected && (
                    <span className="ml-auto text-purple-500">✓</span>
                  )}
                </button>
              );
            })}

            {/* Custom feedback */}
            {selectedReasons.length > 0 && (
              <div className="pt-3">
                <Textarea
                  placeholder="Any additional feedback? (optional)"
                  value={customFeedback}
                  onChange={(e) => setCustomFeedback(e.target.value)}
                  className="resize-none h-20"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}