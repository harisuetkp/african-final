import React from 'react';
import { Shield, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

export default function TrustScoreIndicator({ profile, showScore = false }) {
  if (!profile) return null;

  const safetyScore = profile.ai_safety_score || 70; // Default moderate score
  const violations = profile.violation_count || 0;
  const isVerified = profile.verification_status?.photo_verified;

  // Calculate trust level
  let trustLevel = 'medium';
  let color = 'blue';
  let Icon = Shield;
  let message = 'Standard safety checks passed';

  if (violations > 2) {
    trustLevel = 'low';
    color = 'amber';
    Icon = AlertTriangle;
    message = 'Some reports received - use caution';
  } else if (safetyScore >= 85 && isVerified) {
    trustLevel = 'high';
    color = 'green';
    Icon = ShieldCheck;
    message = 'Verified & excellent safety record';
  } else if (safetyScore >= 70 && isVerified) {
    trustLevel = 'high';
    color = 'green';
    Icon = ShieldCheck;
    message = 'Verified with good safety record';
  }

  if (!showScore && trustLevel === 'medium') return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-${color}-100 text-${color}-800 text-xs font-medium cursor-help`}>
            <Icon size={12} />
            {showScore && <span>{safetyScore}% Safe</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-semibold">{message}</p>
            <Progress value={safetyScore} className="h-1 w-32" />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Safety Score: {safetyScore}/100</span>
            </div>
            {violations > 0 && (
              <p className="text-amber-600 mt-1">⚠️ {violations} report(s) received</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}