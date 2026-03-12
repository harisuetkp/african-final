import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Check, Crown, Star, Heart, MessageCircle, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function ProgressToTrial({ 
  completedActions = [],
  totalRequired = 5,
  className = "" 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const actions = [
    { id: 'profile_photo', label: 'Add profile photo', icon: User, completed: completedActions.includes('profile_photo') },
    { id: 'bio', label: 'Write your bio', icon: User, completed: completedActions.includes('bio') },
    { id: 'first_like', label: 'Like someone', icon: Heart, completed: completedActions.includes('first_like') },
    { id: 'view_profiles', label: 'View 5 profiles', icon: Star, completed: completedActions.includes('view_profiles') },
    { id: 'send_message', label: 'Send a message', icon: MessageCircle, completed: completedActions.includes('send_message') },
  ];

  const completedCount = actions.filter(a => a.completed).length;
  const progress = (completedCount / totalRequired) * 100;
  const isComplete = completedCount >= totalRequired;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-amber-50 to-purple-50 rounded-xl border border-amber-200/50 overflow-hidden ${className}`}
    >
      {/* Compact Header - Always Visible */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center gap-3 hover:bg-white/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
          <Gift size={18} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">Free Trial</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              {completedCount}/{totalRequired}
            </span>
          </div>
          <Progress value={progress} className="h-1.5 bg-gray-200 mt-1.5" />
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-amber-100">
              {/* Action checklist - Compact */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.id}
                      className={`flex items-center gap-2 p-1.5 rounded-lg text-xs ${
                        action.completed 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-white/50 text-gray-500'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        action.completed ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {action.completed ? (
                          <Check size={10} className="text-white" />
                        ) : (
                          <Icon size={8} className="text-gray-400" />
                        )}
                      </div>
                      <span className={action.completed ? 'line-through' : ''}>
                        {action.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              {isComplete ? (
                <Link to={createPageUrl('PricingPlans')}>
                  <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                    <Crown size={14} className="mr-1" />
                    Claim Free Trial!
                  </Button>
                </Link>
              ) : (
                <p className="text-center text-xs text-gray-500">
                  {totalRequired - completedCount} more to unlock premium
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}