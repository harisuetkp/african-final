import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Loader2, Wand2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AIConversationStarters({ myProfile, otherProfile, matchId, onSelectQuestion, onClose }) {
  const [suggestions, setSuggestions] = useState([]);
  const [generating, setGenerating] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      setGenerating(true);
      
      const response = await base44.functions.invoke('getChatSuggestions', {
        matchId: matchId
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data.suggestions || [];
    },
    onSuccess: (data) => {
      setSuggestions(data);
      setGenerating(false);
    },
    onError: () => {
      setGenerating(false);
      alert('Failed to generate suggestions. Try again!');
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wand2 size={24} className="text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">AI Conversation Starters</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>

            <p className="text-gray-600 mb-4 text-sm">
              Get AI-powered personalized questions based on your profiles
            </p>

            {suggestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Sparkles size={32} className="text-purple-600" />
                </div>
                <h4 className="text-lg font-bold mb-2">Get Smart Suggestions</h4>
                <p className="text-gray-600 mb-6">
                  AI will analyze both profiles and suggest personalized conversation starters
                </p>
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} className="mr-2" />
                      Generate Suggestions
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  <AnimatePresence>
                    {suggestions.map((question, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card 
                          className="hover:shadow-md transition-shadow cursor-pointer group border-purple-100"
                          onClick={() => {
                            onSelectQuestion(question);
                            onClose();
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-gray-800 group-hover:text-purple-600 transition-colors">
                                {question}
                              </p>
                              <Send size={16} className="text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0 mt-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <Button
                  onClick={() => {
                    setSuggestions([]);
                    generateMutation.mutate();
                  }}
                  variant="outline"
                  className="w-full"
                  disabled={generating}
                >
                  <Sparkles size={16} className="mr-2" />
                  Generate New Suggestions
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}