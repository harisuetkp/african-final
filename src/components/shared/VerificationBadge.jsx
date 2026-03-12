import React from 'react';
import { Shield, CheckCircle, Camera, FileCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function VerificationBadge({ verification, size = "default" }) {
  if (!verification) return null;

  const { photo_verified, id_verified } = verification;
  const iconSize = size === "small" ? 14 : 18;

  if (!photo_verified && !id_verified) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {photo_verified && (
          <Tooltip>
            <TooltipTrigger>
              <div className="bg-blue-500 rounded-full p-1">
                <Camera size={iconSize} className="text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Photo Verified</p>
            </TooltipContent>
          </Tooltip>
        )}
        {id_verified && (
          <Tooltip>
            <TooltipTrigger>
              <div className="bg-emerald-500 rounded-full p-1">
                <Shield size={iconSize} className="text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>ID Verified</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}