import React from 'react';
import { Shield, CheckCircle, ShieldCheck } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SafetyBadge({ profile, size = "default" }) {
  if (!profile) return null;

  const isVerified = profile.verification_status?.photo_verified;
  const safetyScore = profile.ai_safety_score || 0;
  const violationCount = profile.violation_count || 0;

  // Calculate trust level
  const getTrustLevel = () => {
    if (violationCount > 2) return 'low';
    if (safetyScore >= 80 && isVerified) return 'high';
    if (safetyScore >= 60 || isVerified) return 'medium';
    return 'neutral';
  };

  const trustLevel = getTrustLevel();

  const badgeConfig = {
    high: {
      text: 'Verified & Safe',
      icon: ShieldCheck,
      className: 'bg-green-100 text-green-800 border-green-200',
      tooltip: 'This user is verified and has a clean safety record'
    },
    medium: {
      text: 'Safe User',
      icon: CheckCircle,
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      tooltip: 'This user meets our safety standards'
    },
    low: {
      text: 'Use Caution',
      icon: Shield,
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      tooltip: 'This user has received reports - please be cautious'
    },
    neutral: null
  };

  const config = badgeConfig[trustLevel];
  if (!config) return null;

  const Icon = config.icon;
  const isSmall = size === "small";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${config.className} flex items-center gap-1 ${isSmall ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}
          >
            <Icon size={isSmall ? 12 : 14} />
            <span>{config.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{config.tooltip}</p>
          {safetyScore > 0 && (
            <p className="text-xs text-gray-400 mt-1">Safety Score: {safetyScore}/100</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}