import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const QUESTIONS = [
  "What's your dream vacation destination?",
  "If you could have dinner with anyone, who would it be?",
  "What's your hidden talent?",
  "Best concert you've ever been to?",
  "Coffee or tea?",
  "Morning person or night owl?",
  "What's on your bucket list?",
  "Favorite childhood memory?"
];

export default function QuestionGame({ matchId, myProfileId, onAnswerSubmit }) {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    await onAnswerSubmit({
      question: selectedQuestion,
      answer: answer.trim()
    });
    
    setAnswer('');
    setSelectedQuestion(null);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-amber-50 border-purple-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="text-purple-600" size={20} />
          <h3 className="font-semibold text-gray-900">Question Game</h3>
        </div>

        {!selectedQuestion ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">Pick a question to answer!</p>
            <div className="grid grid-cols-1 gap-2">
              {QUESTIONS.slice(0, 3).map((q, idx) => (
                <Button
                  key={idx}
                  onClick={() => setSelectedQuestion(q)}
                  variant="outline"
                  className="text-left h-auto py-2 px-3 text-sm hover:bg-purple-100"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-sm font-medium text-purple-700">{selectedQuestion}</p>
            <Input
              placeholder="Your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} size="sm" className="flex-1">
                Send Answer
              </Button>
              <Button onClick={() => setSelectedQuestion(null)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}