import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Headphones } from 'lucide-react';

export default function PrioritySupportBadge({ userTier }) {
  if (!userTier || userTier === 'free') return null;
  
  const tierLabels = {
    premium: 'Priority Support',
    elite: 'VIP Support',
    vip: 'Concierge Support'
  };
  
  const tierColors = {
    premium: 'bg-blue-100 text-blue-800',
    elite: 'bg-purple-100 text-purple-800',
    vip: 'bg-amber-100 text-amber-800'
  };
  
  return (
    <Badge className={`${tierColors[userTier]} gap-1`}>
      <Headphones size={12} />
      {tierLabels[userTier]}
    </Badge>
  );
}