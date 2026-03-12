import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function IceBreakerPrompts({ onSelectQuestion, onClose }) {
  const { data: iceBreakers = [] } = useQuery({
    queryKey: ['ice-breakers'],
    queryFn: () => base44.entities.IceBreaker.filter({ is_active: true })
  });

  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'culture', 'values', 'lifestyle', 'fun', 'deep'];

  const filteredQuestions = selectedCategory === 'all' 
    ? iceBreakers 
    : iceBreakers.filter(q => q.category === selectedCategory);

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
                <Sparkles size={24} className="text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">Ice Breakers</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>

            <p className="text-gray-600 mb-4 text-sm">
              Break the ice with culturally relevant conversation starters
            </p>

            {/* Category Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map(cat => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className={`cursor-pointer capitalize ${
                    selectedCategory === cat ? 'bg-purple-600' : ''
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>

            {/* Questions List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredQuestions.map((question, idx) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card 
                      className="hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => {
                        onSelectQuestion(question.question);
                        onClose();
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-gray-800 group-hover:text-purple-600 transition-colors">
                            {question.question}
                          </p>
                          <Send size={16} className="text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0 mt-1" />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {question.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.cultural_context.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}