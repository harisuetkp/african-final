import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, AlertTriangle } from 'lucide-react';

export default function DateFeedbackReview() {
  const { data: feedbacks = [] } = useQuery({
    queryKey: ['admin-date-feedback'],
    queryFn: () => base44.entities.DateFeedback.filter({ safety_concerns: true }, '-created_date', 50)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-600" />
          Safety Concern Reports ({feedbacks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedbacks.map(feedback => (
            <div key={feedback.id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  <span className="font-semibold">{feedback.rating}/5</span>
                </div>
                <Badge variant="destructive">Safety Concern</Badge>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                Met in person: {feedback.met_in_person ? 'Yes' : 'No'}
              </p>
              {feedback.feedback_notes && (
                <p className="text-sm text-gray-700 bg-white p-2 rounded">
                  "{feedback.feedback_notes}"
                </p>
              )}
            </div>
          ))}
          {feedbacks.length === 0 && (
            <p className="text-center text-gray-500 py-8">No safety concerns reported</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}