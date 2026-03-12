import React from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function CompatibilityScore({ score, reasons }) {
  const getColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-purple-600';
    return 'text-amber-600';
  };

  const getBarColor = (score) => {
    if (score >= 85) return 'bg-green-600';
    if (score >= 70) return 'bg-purple-600';
    return 'bg-amber-600';
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-amber-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            <span className="font-semibold text-sm">Compatibility</span>
          </div>
          <span className={`text-2xl font-bold ${getColor(score)}`}>
            {score}%
          </span>
        </div>
        
        <Progress 
          value={score} 
          className="h-2 mb-3" 
        />

        {reasons && reasons.length > 0 && (
          <div className="space-y-1">
            {reasons.slice(0, 3).map((reason, idx) => (
              <p key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="text-purple-600">•</span>
                {reason}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}