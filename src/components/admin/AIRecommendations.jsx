import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, AlertTriangle, CheckCircle, Ban, Flag } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function AIRecommendations({ 
  item, 
  type, // 'message', 'report', 'verification', 'pattern'
  onAction 
}) {
  // Generate AI recommendation based on item type
  const getRecommendation = () => {
    if (type === 'message' && item.is_flagged) {
      const severity = item.ai_severity || 'medium';
      
      if (severity === 'high') {
        return {
          action: 'delete',
          confidence: 95,
          reason: 'Contains explicit threats or harassment',
          icon: Ban,
          color: 'red',
          label: 'Immediate Deletion Recommended'
        };
      } else if (severity === 'medium') {
        return {
          action: 'warn',
          confidence: 75,
          reason: 'Borderline inappropriate content',
          icon: AlertTriangle,
          color: 'amber',
          label: 'Warning Recommended'
        };
      } else {
        return {
          action: 'clear',
          confidence: 60,
          reason: 'Likely false positive',
          icon: CheckCircle,
          color: 'green',
          label: 'Clear Flag Recommended'
        };
      }
    }

    if (type === 'verification') {
      const confidence = item.ai_confidence_score || 0;
      
      if (confidence >= 85) {
        return {
          action: 'approve',
          confidence,
          reason: 'High confidence match - photos appear authentic',
          icon: CheckCircle,
          color: 'green',
          label: 'Auto-Approval Recommended'
        };
      } else if (confidence < 50) {
        return {
          action: 'reject',
          confidence,
          reason: 'Photos do not match or appear manipulated',
          icon: Ban,
          color: 'red',
          label: 'Rejection Recommended'
        };
      } else {
        return {
          action: 'manual',
          confidence,
          reason: 'Uncertain - human review needed',
          icon: AlertTriangle,
          color: 'amber',
          label: 'Manual Review Required'
        };
      }
    }

    if (type === 'report') {
      const severity = item.severity || 'low';
      
      if (severity === 'critical') {
        return {
          action: 'ban',
          confidence: 90,
          reason: 'Multiple violations or serious offense',
          icon: Ban,
          color: 'red',
          label: 'Account Ban Recommended'
        };
      } else if (severity === 'high') {
        return {
          action: 'suspend',
          confidence: 80,
          reason: 'Significant violation requiring investigation',
          icon: AlertTriangle,
          color: 'amber',
          label: 'Temporary Suspension Recommended'
        };
      } else {
        return {
          action: 'warning',
          confidence: 70,
          reason: 'First offense - warning appropriate',
          icon: Flag,
          color: 'yellow',
          label: 'Issue Warning'
        };
      }
    }

    if (type === 'pattern') {
      const severity = item.severity || 0;
      
      if (severity >= 8) {
        return {
          action: 'immediate',
          confidence: 95,
          reason: 'High-risk behavior pattern detected',
          icon: Ban,
          color: 'red',
          label: 'Immediate Action Required'
        };
      } else if (severity >= 6) {
        return {
          action: 'monitor',
          confidence: 80,
          reason: 'Concerning pattern - needs monitoring',
          icon: AlertTriangle,
          color: 'amber',
          label: 'Close Monitoring Recommended'
        };
      }
    }

    return null;
  };

  const recommendation = getRecommendation();
  
  if (!recommendation) return null;

  const Icon = recommendation.icon;
  const colorMap = {
    red: 'bg-red-50 border-red-200 text-red-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    green: 'bg-green-50 border-green-200 text-green-900'
  };

  return (
    <Card className={`${colorMap[recommendation.color]} border`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg">
            <Sparkles size={20} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} />
              <h4 className="font-semibold text-sm">{recommendation.label}</h4>
              <Badge className="ml-auto bg-white/50">
                {recommendation.confidence}% Confidence
              </Badge>
            </div>
            <p className="text-xs mb-3">{recommendation.reason}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => onAction(recommendation.action)}
                size="sm"
                className={`${
                  recommendation.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                  recommendation.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Apply Recommendation
              </Button>
              <Button
                onClick={() => onAction('ignore')}
                size="sm"
                variant="outline"
              >
                Ignore
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}