import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, MapPin, BookOpen, Users, Star, Briefcase, Languages } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const reasonIcons = {
  cultural: Users,
  location: MapPin,
  interests: Heart,
  religion: BookOpen,
  career: Briefcase,
  language: Languages,
  default: Star
};

export default function MatchExplanation({ score, reasons = [], breakdown = {}, confidence = 'learning', compact = false }) {
  const getIcon = (reason) => {
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes('from') || lowerReason.includes('heritage')) return reasonIcons.cultural;
    if (lowerReason.includes('city') || lowerReason.includes('state') || lowerReason.includes('in ')) return reasonIcons.location;
    if (lowerReason.includes('interest') || lowerReason.includes('shared')) return reasonIcons.interests;
    if (lowerReason.includes('faith') || lowerReason.includes('religion')) return reasonIcons.religion;
    if (lowerReason.includes('career') || lowerReason.includes('profession')) return reasonIcons.career;
    if (lowerReason.includes('language')) return reasonIcons.language;
    return reasonIcons.default;
  };

  const confidenceColors = {
    learning: 'text-amber-500',
    moderate: 'text-blue-500',
    good: 'text-green-500',
    excellent: 'text-purple-500'
  };

  const confidenceLabels = {
    learning: 'Learning your preferences',
    moderate: 'Getting to know you',
    good: 'Well-tuned for you',
    excellent: 'Highly personalized'
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-3 py-1.5 rounded-full">
          <Sparkles size={14} className="text-purple-600" />
          <span className="text-sm font-semibold text-purple-700">{score}% Match</span>
        </div>
        {reasons.length > 0 && (
          <span className="text-xs text-gray-500 truncate max-w-[150px]">
            {reasons[0]}
          </span>
        )}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100"
    >
      {/* Score Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">AI Compatibility Score</h4>
            <p className={`text-xs ${confidenceColors[confidence]}`}>
              {confidenceLabels[confidence]}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {score}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <Progress value={score} className="h-2 bg-purple-100" />
      </div>

      {/* Match Reasons */}
      {reasons.length > 0 && (
        <div className="space-y-2 mb-4">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Why you match</h5>
          <div className="flex flex-wrap gap-2">
            {reasons.map((reason, idx) => {
              const Icon = getIcon(reason);
              return (
                <Badge 
                  key={idx}
                  variant="outline" 
                  className="bg-white border-purple-200 text-purple-700 py-1.5 px-3"
                >
                  <Icon size={12} className="mr-1.5" />
                  {reason}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <div className="pt-3 border-t border-purple-100">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Compatibility breakdown</h5>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${Math.min(value * 5, 100)}%` }}
                    />
                  </div>
                  <span className="text-gray-500 w-6 text-right">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}