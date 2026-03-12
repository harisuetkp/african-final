import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Mic, Image, Languages, AlertTriangle, MoreVertical, Flag, Sparkles, Shield, Ban, Video, Gift, Wand2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutoResizeTextarea } from "@/components/ui/autosize-textarea";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import IceBreakerPrompts from '@/components/chat/IceBreakerPrompts';
import AIConversationStarters from '@/components/chat/AIConversationStarters';
import AIConversationHelper from '@/components/chat/AIConversationHelper';
import { AnimatePresence } from 'framer-motion';
import TypingIndicator from '@/components/shared/TypingIndicator';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { useOptimisticUpdate } from '@/components/shared/useOptimisticUpdate';
import { sanitizeText, validateInput, rateLimiter, blockLinks, containsHarmfulContent } from '@/components/shared/InputSanitizer';
import { useInfinitePagination } from '@/components/shared/useInfinitePagination';
import { ChatSkeleton } from '@/components/shared/SkeletonLoader';
import SafetyCheckSetup from '@/components/safety/SafetyCheckSetup';
import VirtualList from '@/components/shared/VirtualList';
import OptimizedImage from '@/components/shared/OptimizedImage';
import { usePerformanceMonitor } from '@/components/shared/usePerformanceMonitor';
import { useRealtimeMessages } from '@/components/chat/useRealtimeMessages';
import TierGate, { hasAccess } from '@/components/shared/TierGate';
import MessageLimitPaywall from '@/components/paywall/MessageLimitPaywall';

import ReadReceipts from '@/components/chat/ReadReceipts';
import PremiumTypingIndicator from '@/components/chat/PremiumTypingIndicator';

export default function Chat() {
  usePerformanceMonitor('Chat');
  
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('matchId');
  
  const [myProfile, setMyProfile] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [recording, setRecording] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [translateLang, setTranslateLang] = useState('en');
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showIceBreakers, setShowIceBreakers] = useState(false);
  const [showAIStarters, setShowAIStarters] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuestionGame, setShowQuestionGame] = useState(false);
  const [showVirtualGifts, setShowVirtualGifts] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showMessageLimitPaywall, setShowMessageLimitPaywall] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [translatingId, setTranslatingId] = useState(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const queryClient = useQueryClient();

  // Real-time WebSocket connection
  const { 
    isConnected, 
    otherUserTyping, 
    sendTypingIndicator, 
    notifyNewMessage,
    sendReadReceipt 
  } = useRealtimeMessages(matchId, myProfile?.id, !!myProfile && !!matchId);

  // Screenshot detection note: Web browsers cannot reliably detect screenshots.
  // Native mobile apps can handle this, but web apps cannot.

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
          setMyProfile(profiles[0]);
        }
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    fetchProfiles();
  }, []);

  // Fetch match and other user's profile
  const { data: match } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      try {
        const matches = await base44.entities.Match.filter({ id: matchId });
        if (matches.length > 0) {
          const m = matches[0];
          const otherId = m.user1_id === myProfile?.id ? m.user2_id : m.user1_id;
          const otherProfiles = await base44.entities.UserProfile.filter({ id: otherId });
          if (otherProfiles.length > 0) {
            setOtherProfile(otherProfiles[0]);
          }
          return m;
        }
        return null;
      } catch (error) {
        console.error('Failed to fetch match:', error);
        return null;
      }
    },
    enabled: !!matchId && !!myProfile,
    staleTime: 120000,
    retry: 1,
    retryDelay: 5000
  });

  // Fetch messages with infinite scroll - OPTIMIZED
  const { 
    items: rawMessages, 
    loadMore: loadMoreMessages, 
    hasMore: hasMoreMessages,
    isLoadingMore: isLoadingMoreMessages,
    isLoading: messagesLoading 
  } = useInfinitePagination('Message', { match_id: matchId }, {
    pageSize: 30,
    sortBy: '-created_date',
    enabled: !!matchId,
    refetchInterval: false, // Disable auto-refetch, rely on WebSocket
    retry: 1,
    retryDelay: 5000,
    staleTime: 300000 // 5 minutes
  });

  // Remove duplicates by ID
  const messages = React.useMemo(() => {
    const seen = new Set();
    return rawMessages.filter(msg => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
  }, [rawMessages]);

  // Scroll to bottom - optimized
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]); // Only trigger on message count change

  // Mark messages as read - optimized with batch update
  useEffect(() => {
    if (messages.length > 0 && myProfile) {
      const unreadMessages = messages.filter(m => m.receiver_id === myProfile.id && !m.is_read);
      if (unreadMessages.length > 0) {
        // Batch update to reduce API calls
        Promise.all(
          unreadMessages.map(m => 
            base44.entities.Message.update(m.id, {
              is_read: true,
              read_at: new Date().toISOString()
            }).catch(err => console.error('Failed to mark message as read:', err))
          )
        ).catch(err => console.error('Failed to batch update messages:', err));
      }
    }
  }, [messages.length, myProfile?.id]); // Only trigger on relevant changes

  // Send message with optimistic update
  const sendMessageMutation = useOptimisticUpdate(
    ['messages', matchId],
    async ({ content, type = 'text', mediaUrl = null }) => {
      // Client-side validation for better UX
      if (!validateInput.length(content, 1, 5000) && !mediaUrl) {
        throw new Error('Message must be between 1 and 5000 characters');
      }
      
      // Call secure backend function
      const response = await base44.functions.invoke('sendMessage', {
        matchId,
        content,
        type,
        mediaUrl
      });

      // Handle backend errors
      if (response.data.error) {
        if (response.data.error === 'upgrade_required') {
          localStorage.setItem('message_limit_hit', 'true');
          throw new Error('upgrade_required');
        }
        throw new Error(response.data.error);
      }

      const message = response.data;

      // Notify via WebSocket for immediate local echo
      notifyNewMessage(message);
      
      return message;
    }
  );

  // Handle message errors and success
  useEffect(() => {
    if (sendMessageMutation.isError) {
      const error = sendMessageMutation.error;
      if (error.message === 'upgrade_required') {
        setShowMessageLimitPaywall(true);
      } else if (error.message.includes('too quickly')) {
        alert('⏱️ Please slow down - you can send up to 20 messages per minute.');
      } else {
        alert(error.message);
      }
      // Remove all optimistic messages on error
      queryClient.setQueryData(['messages', matchId], (old = []) => 
        old.filter(m => !m.__optimistic)
      );
    }
    if (sendMessageMutation.isSuccess) {
      // Remove optimistic messages and refetch real data
      queryClient.setQueryData(['messages', matchId], (old = []) => 
        old.filter(m => !m.__optimistic)
      );
      queryClient.invalidateQueries(['messages', matchId]);
    }
  }, [sendMessageMutation.isSuccess, sendMessageMutation.isError, matchId, queryClient]);



  // Image mutation
  const sendImageMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await sendMessageMutation.mutateAsync({ content: 'Image', type: 'image', mediaUrl: file_url });
    },
    onError: () => {
      alert('Failed to upload image');
    }
  });

  // Translation mutation
  const translateMessageMutation = useMutation({
    mutationFn: async ({ messageId, targetLang }) => {
      setTranslatingId(messageId);
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const translated = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate this message to ${targetLang}: "${message.content}". Return only the translation.`,
        response_json_schema: {
          type: "object",
          properties: {
            translation: { type: "string" }
          }
        }
      });

      await base44.entities.MessageTranslation.create({
        message_id: messageId,
        original_language: 'unknown',
        translated_text: { [targetLang]: translated.translation }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', matchId]);
    },
    onSettled: () => {
      setTranslatingId(null);
    }
  });

  // Report mutation
  const reportMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Report.create({
        reporter_id: myProfile.id,
        reported_id: otherProfile.id,
        report_type: 'harassment',
        description: reportReason,
        status: 'pending'
      });
    },
    onSuccess: () => {
      setShowReport(false);
      setReportReason('');
      alert('Report submitted. Our team will review it.');
    }
  });

  // Block user mutation
  const blockMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.UserProfile.update(myProfile.id, {
        blocked_users: [...(myProfile.blocked_users || []), otherProfile.id]
      });
      await base44.entities.Match.update(match.id, { status: 'blocked' });
    },
    onSuccess: () => {
      window.location.href = createPageUrl('Matches');
    }
  });

  const handleVideoCall = () => {
    // Video calls coming soon - show placeholder
    setShowVideoCall(true);
  };

  const handleVirtualGifts = () => {
    const tier = myProfile?.subscription_tier;
    if (tier === 'elite' || tier === 'vip') {
      setShowVirtualGifts(true);
    } else {
      setUpgradeFeature('Virtual Gifts');
      setShowUpgradePrompt(true);
    }
  };

  const handleSend = () => {
    if (!messageText.trim()) return;

    // Prevent duplicate sends
    if (sendMessageMutation.isPending) return;

    // Clear input immediately for better UX
    const textToSend = messageText.trim();
    setMessageText('');

    // Create optimistic message with unique temp ID
    const optimisticMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      match_id: matchId,
      sender_id: myProfile.id,
      receiver_id: otherProfile.id,
      content: textToSend,
      message_type: 'text',
      is_read: false,
      created_date: new Date().toISOString(),
      __optimistic: true
    };

    // Update messages immediately (optimistic)
    queryClient.setQueryData(['messages', matchId], (old = []) => [...old, optimisticMessage]);

    sendMessageMutation.mutate({ 
      content: textToSend
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      sendImageMutation.mutate(file);
    }
  };

  // Typing indicator handler
  const handleTyping = () => {
    sendTypingIndicator(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  };

  const generateSmartReply = async () => {
    const lastMessage = messages.find(m => m.sender_id === otherProfile.id);
    if (!lastMessage) return;

    setIsGeneratingReply(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `
          Generate 3 short, flirty or engaging reply options to this message: "${lastMessage.content}".
          Context: Dating app chat. Keep it casual and fun.
          Return strictly valid JSON: { "options": ["option1", "option2", "option3"] }
        `,
        response_json_schema: {
          type: "object",
          properties: {
            options: { type: "array", items: { type: "string" } }
          }
        }
      });
      
      if (res.options && res.options.length > 0) {
        setMessageText(res.options[0]);
      }
    } catch (e) {
      console.error("Smart reply failed", e);
      alert("Could not generate a reply at this time. Please try again.");
    } finally {
      setIsGeneratingReply(false);
    }
  };

  if (!otherProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b px-4 py-3">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32" />
        </header>
        <ChatSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Native App Bar */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-100/50 px-4 py-3 flex items-center justify-between sticky top-0 z-10" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Matches')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <Avatar>
            <AvatarImage src={otherProfile.primary_photo || otherProfile.photos?.[0]} />
            <AvatarFallback>{otherProfile.display_name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{otherProfile.display_name}</h2>
            <p className="text-xs text-gray-500">Active now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleVideoCall}
            className="text-purple-600 hover:bg-purple-50"
            title="Video Call (Elite/VIP)"
          >
            <Video size={20} />
          </Button>
          <Link to={createPageUrl(`VirtualGifts?profileId=${otherProfile.id}`)}>
            <Button
              variant="ghost"
              size="icon"
              className="text-pink-600 hover:bg-pink-50"
              title="Send Gift (Elite/VIP)"
            >
              <Gift size={20} />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link to={createPageUrl(`SafetyCheckSetup?matchId=${matchId}`)}>
                <Shield size={16} className="mr-2" />
                Set Up Safety Check
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={createPageUrl(`Report?userId=${otherProfile.id}`)}>
                <Flag size={16} className="mr-2" />
                Report User
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowBlockConfirm(true)} 
              className="text-red-600"
            >
              <Ban size={16} className="mr-2" />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
          </div>
          </header>

      {/* Messages - optimized rendering */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" id="messages-container">
        {hasMoreMessages && !isLoadingMoreMessages && (
          <div className="text-center py-2">
            <button
              onClick={loadMoreMessages}
              className="text-sm text-purple-600 hover:underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {isLoadingMoreMessages && (
          <div className="text-center py-2">
            <div className="animate-spin inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full" />
          </div>
        )}

        {messages.length === 0 && !messagesLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Start a Conversation!</h3>
            <p className="text-gray-500 text-sm mb-4">
              Say hello to {otherProfile.display_name}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAIStarters(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles size={16} className="mr-2" />
                AI Suggestions
              </Button>
              <Button
                onClick={() => setShowIceBreakers(true)}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                Ice Breakers
              </Button>
            </div>
          </div>
        )}
        
        {messages.map(msg => {
          const isMine = msg.sender_id === myProfile?.id;
          const isOptimistic = msg.__optimistic;

          return (
            <div 
              key={msg.id} 
              className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${isOptimistic ? 'opacity-60' : ''}`}
            >
              {/* Other user's avatar */}
              {!isMine && (
                <img 
                  src={otherProfile?.primary_photo || otherProfile?.photos?.[0]} 
                  alt="" 
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              )}
              
              <div className={`max-w-xs md:max-w-md ${
                isMine 
                  ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-900'
              } rounded-2xl ${isMine ? 'rounded-br-md' : 'rounded-bl-md'} px-4 py-2.5 shadow-sm`}>
                {msg.message_type === 'voice_note' ? (
                  <audio controls src={msg.media_url} className="w-full" preload="metadata" />
                ) : msg.message_type === 'image' ? (
                  <OptimizedImage src={msg.media_url} alt="Shared" className="rounded-lg max-w-full" />
                ) : (
                  <p className="text-sm break-words">{msg.content}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-xs ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                    {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {isMine && (
                    <ReadReceipts 
                      message={msg} 
                      isPremium={myProfile?.subscription_tier === 'premium' || myProfile?.subscription_tier === 'elite' || myProfile?.subscription_tier === 'vip'}
                    />
                  )}
                </div>
              </div>

              {/* My avatar */}
              {isMine && (
                <img 
                  src={myProfile?.primary_photo || myProfile?.photos?.[0]} 
                  alt="" 
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              )}
            </div>
          );
        })}

        {/* Premium Typing Indicator */}
        <PremiumTypingIndicator 
          isTyping={otherUserTyping}
          displayName={otherProfile.display_name}
          isPremium={myProfile?.subscription_tier === 'premium' || myProfile?.subscription_tier === 'elite' || myProfile?.subscription_tier === 'vip'}
        />

        <div ref={messagesEndRef} />
      </div>

      {/* AI Conversation Helper - Only show if no messages yet or conversation is stale */}
      {myProfile && otherProfile && messages.length < 5 && (
        <AIConversationHelper
          matchId={matchId}
          myProfileId={myProfile.id}
          theirProfile={otherProfile}
          lastMessage={messages.find(m => m.sender_id === otherProfile?.id)?.content}
          onSelectMessage={(msg) => setMessageText(msg)}
          isNewMatch={messages.length === 0}
        />
      )}

      {/* Input - Native Keyboard Optimized */}
      <div className="bg-white border-t border-gray-100" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))', padding: '12px 16px' }}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={generateSmartReply}
            disabled={isGeneratingReply}
            title="Magic Reply"
            className={isGeneratingReply ? "animate-pulse" : ""}
          >
            <Wand2 size={20} className="text-amber-500" />
          </Button>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            onClick={(e) => { e.target.value = null; }}
            className="hidden"
            id="image-input"
          />
          <label htmlFor="image-input">
            <Button variant="ghost" size="icon" asChild disabled={sendImageMutation.isPending}>
              <span>
                {sendImageMutation.isPending ? (
                  <Loader2 className="animate-spin text-purple-600" size={20} />
                ) : (
                  <Image size={20} />
                )}
              </span>
            </Button>
          </label>
          


          <AutoResizeTextarea
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 py-3"
            minHeight={44}
            maxHeight={120}
          />

          <Button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              handleSend();
            }}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 h-11 w-11 p-0 rounded-full touch-manipulation transition-all active:scale-95"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please describe why you're reporting {otherProfile.display_name}
            </p>
            <Textarea
              placeholder="Describe the issue..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
            />
            <Button
              onClick={() => reportMutation.mutate()}
              disabled={!reportReason || reportMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {reportMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </DialogContent>
        </Dialog>

        {/* Ice Breaker Prompts */}
        <AnimatePresence>
        {showIceBreakers && (
          <IceBreakerPrompts
            onSelectQuestion={(q) => setMessageText(q)}
            onClose={() => setShowIceBreakers(false)}
          />
        )}
        </AnimatePresence>

        {/* AI Conversation Starters */}
        <AnimatePresence>
        {showAIStarters && myProfile && otherProfile && (
          <AIConversationStarters
            myProfile={myProfile}
            otherProfile={otherProfile}
            matchId={matchId}
            onSelectQuestion={(q) => setMessageText(q)}
            onClose={() => setShowAIStarters(false)}
          />
        )}
        </AnimatePresence>

        {/* Virtual Gifts Modal */}
        {showVirtualGifts && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowVirtualGifts(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Send a Virtual Gift 🎁</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {['🌹', '💎', '🍫', '🎂', '💐', '🎁', '⭐', '💝', '👑'].map((gift, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sendMessageMutation.mutate({ content: `Sent you a gift ${gift}`, type: 'text' });
                      setShowVirtualGifts(false);
                    }}
                    className="p-6 text-4xl bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:scale-110 transition"
                  >
                    {gift}
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={() => setShowVirtualGifts(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Message Limit Paywall */}
        <AnimatePresence>
          {showMessageLimitPaywall && (
            <MessageLimitPaywall onClose={() => setShowMessageLimitPaywall(false)} />
          )}
        </AnimatePresence>

        {/* Upgrade Prompt Modal */}
        {showUpgradePrompt && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowUpgradePrompt(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-amber-100 flex items-center justify-center">
                  <Sparkles size={40} className="text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{upgradeFeature} are Exclusive!</h2>
                <p className="text-gray-600 mb-6">
                  Upgrade to Elite or VIP to unlock {upgradeFeature.toLowerCase()} and connect in new ways!
                </p>
                <div className="space-y-3">
                  <Link to={createPageUrl('PricingPlans')}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700">
                      Upgrade Now
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => setShowUpgradePrompt(false)} className="w-full">
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Block User Confirmation */}
        <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Block {otherProfile?.display_name}?</AlertDialogTitle>
              <AlertDialogDescription>
                They won't be able to see your profile or contact you. This action can be undone later from Settings → Blocked Users.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => blockMutation.mutate()}
                disabled={blockMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {blockMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Blocking...
                  </>
                ) : (
                  'Block User'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        </div>
        );
        }