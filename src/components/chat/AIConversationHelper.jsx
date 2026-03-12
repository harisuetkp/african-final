import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle, Lightbulb, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';

export default function AIConversationHelper({ 
  matchId, 
  myProfileId, 
  theirProfile,
  lastMessage,
  onSelectMessage,
  isNewMatch = false 
}) {
  const [icebreakers, setIcebreakers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [responseSuggestions, setResponseSuggestions] = useState([]);
  const [isExpanded, setIsExpanded] = useState(isNewMatch);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(isNewMatch ? 'icebreakers' : 'topics');
  const [commonGround, setCommonGround] = useState(null);

  useEffect(() => {
    if (isNewMatch && theirProfile?.id) {
      fetchIcebreakers();
    }
  }, [isNewMatch, theirProfile?.id]);

  const fetchIcebreakers = async () => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('conversationAI', {
        action: 'get_icebreakers',
        payload: {
          myProfileId,
          theirProfileId: theirProfile.id
        }
      });

      if (response.data.icebreakers) {
        setIcebreakers(response.data.icebreakers);
        setCommonGround(response.data.commonGround);
      }
    } catch (error) {
      console.error('Failed to fetch icebreakers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopics = async () => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('conversationAI', {
        action: 'get_conversation_topics',
        payload: {
          matchId,
          myProfileId
        }
      });

      if (response.data.topics) {
        setTopics(response.data.topics);
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResponseSuggestions = async () => {
    if (!lastMessage) return;
    
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('conversationAI', {
        action: 'get_response_suggestions',
        payload: {
          matchId,
          lastMessage,
          myProfileId
        }
      });

      if (response.data.suggestions) {
        setResponseSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch response suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'icebreakers' && icebreakers.length === 0) {
      fetchIcebreakers();
    } else if (tab === 'topics' && topics.length === 0) {
      fetchTopics();
    } else if (tab === 'responses' && responseSuggestions.length === 0) {
      fetchResponseSuggestions();
    }
  };

  const handleSelectMessage = (message) => {
    onSelectMessage?.(message);
    setIsExpanded(false);
  };

  const typeColors = {
    playful: 'bg-pink-100 text-pink-700',
    thoughtful: 'bg-blue-100 text-blue-700',
    cultural: 'bg-amber-100 text-amber-700',
    interest: 'bg-green-100 text-green-700',
    compliment: 'bg-purple-100 text-purple-700'
  };

  return (
    <div className="border-t bg-gradient-to-r from-purple-50 to-pink-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-purple-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <span className="text-sm font-medium text-purple-700">AI Conversation Helper</span>
          {isNewMatch && icebreakers.length === 0 && (
            <Badge className="bg-purple-600 text-white text-xs">New!</Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-purple-600" />
        ) : (
          <ChevronUp size={16} className="text-purple-600" />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">
              {/* Tabs */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleTabChange('icebreakers')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'icebreakers'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-purple-100'
                  }`}
                >
                  <MessageCircle size={14} className="inline mr-1" />
                  Icebreakers
                </button>
                <button
                  onClick={() => handleTabChange('topics')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'topics'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-purple-100'
                  }`}
                >
                  <Lightbulb size={14} className="inline mr-1" />
                  Topics
                </button>
                {lastMessage && (
                  <button
                    onClick={() => handleTabChange('responses')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'responses'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-purple-100'
                    }`}
                  >
                    <Send size={14} className="inline mr-1" />
                    Replies
                  </button>
                )}
              </div>

              {/* Common Ground Badge */}
              {commonGround && activeTab === 'icebreakers' && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {commonGround.sharedInterests?.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      🎯 {commonGround.sharedInterests.length} shared interests
                    </Badge>
                  )}
                  {commonGround.sameCountry && (
                    <Badge variant="outline" className="text-xs">
                      🌍 Same heritage
                    </Badge>
                  )}
                  {commonGround.sameCity && (
                    <Badge variant="outline" className="text-xs">
                      📍 Same city
                    </Badge>
                  )}
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-gray-600">Thinking...</span>
                </div>
              )}

              {/* Icebreakers Tab */}
              {activeTab === 'icebreakers' && !isLoading && (
                <div className="space-y-2">
                  {icebreakers.length === 0 ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={fetchIcebreakers}
                    >
                      <Sparkles size={14} className="mr-2" />
                      Generate personalized icebreakers
                    </Button>
                  ) : (
                    icebreakers.map((ib, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectMessage(ib.message)}
                        className="w-full text-left p-3 bg-white rounded-lg border hover:border-purple-300 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-700">{ib.message}</p>
                          <Send size={14} className="text-gray-400 group-hover:text-purple-600 shrink-0 mt-0.5" />
                        </div>
                        {ib.type && (
                          <Badge className={`mt-2 text-xs ${typeColors[ib.type] || 'bg-gray-100 text-gray-600'}`}>
                            {ib.type}
                          </Badge>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Topics Tab */}
              {activeTab === 'topics' && !isLoading && (
                <div className="space-y-2">
                  {topics.length === 0 ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={fetchTopics}
                    >
                      <Lightbulb size={14} className="mr-2" />
                      Suggest conversation topics
                    </Button>
                  ) : (
                    topics.map((topic, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectMessage(topic.opening_question)}
                        className="w-full text-left p-3 bg-white rounded-lg border hover:border-purple-300 hover:shadow-sm transition-all"
                      >
                        <p className="font-medium text-gray-900 text-sm">{topic.topic}</p>
                        <p className="text-xs text-gray-500 mt-1">{topic.why_relevant}</p>
                        <p className="text-sm text-purple-600 mt-2 italic">"{topic.opening_question}"</p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Responses Tab */}
              {activeTab === 'responses' && !isLoading && (
                <div className="space-y-2">
                  {responseSuggestions.length === 0 ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={fetchResponseSuggestions}
                    >
                      <Send size={14} className="mr-2" />
                      Suggest responses
                    </Button>
                  ) : (
                    responseSuggestions.map((response, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectMessage(response)}
                        className="w-full text-left p-3 bg-white rounded-lg border hover:border-purple-300 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-700">{response}</p>
                          <Send size={14} className="text-gray-400 group-hover:text-purple-600 shrink-0 mt-0.5" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}