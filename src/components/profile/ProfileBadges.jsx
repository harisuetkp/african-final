import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Flame, Sparkles, Star, TrendingUp } from 'lucide-react';

const BADGE_CONFIG = {
  recently_active: {
    label: 'Recently Active',
    icon: Flame,
    color: 'bg-orange-100 text-orange-700 border-orange-300'
  },
  popular: {
    label: 'Popular',
    icon: TrendingUp,
    color: 'bg-pink-100 text-pink-700 border-pink-300'
  },
  new_here: {
    label: 'New Here',
    icon: Sparkles,
    color: 'bg-blue-100 text-blue-700 border-blue-300'
  },
  top_pick: {
    label: 'Top Pick',
    icon: Star,
    color: 'bg-amber-100 text-amber-700 border-amber-300'
  }
};

export default function ProfileBadges({ badges = [] }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(badgeKey => {
        const config = BADGE_CONFIG[badgeKey];
        if (!config) return null;
        
        const Icon = config.icon;
        
        return (
          <Badge key={badgeKey} className={`${config.color} flex items-center gap-1`}>
            <Icon size={12} />
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
}