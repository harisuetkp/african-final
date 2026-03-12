import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useRealtimeMessages(matchId, myProfileId, enabled = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const typingStateRef = useRef(null);
  const queryClient = useQueryClient();

  // Use Base44's entity subscriptions for real-time updates
  useEffect(() => {
    if (!enabled || !matchId || !myProfileId) return;

    setIsConnected(true);

    // Subscribe to new messages in this match
    const unsubscribeMessages = base44.entities.Message.subscribe((event) => {
      if (event.data?.match_id === matchId) {
        if (event.type === 'create' && event.data.sender_id !== myProfileId) {
          // New message from other user
          queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
        } else if (event.type === 'update') {
          // Message updated (read receipt)
          queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
        }
      }
    });

    // Subscribe to typing indicators via a lightweight entity
    // We'll use Match entity updates for typing status
    const unsubscribeMatch = base44.entities.Match.subscribe((event) => {
      if (event.data?.id === matchId && event.type === 'update') {
        const typingUser = event.data.typing_user_id;
        if (typingUser && typingUser !== myProfileId) {
          setOtherUserTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false);
          }, 3000);
        } else if (!typingUser) {
          setOtherUserTyping(false);
        }
      }
    });

    return () => {
      setIsConnected(false);
      unsubscribeMessages();
      unsubscribeMatch();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId, myProfileId, enabled, queryClient]);

  // Debounced typing indicator
  const sendTypingIndicator = useCallback(async (isTyping) => {
    if (!matchId || !myProfileId) return;
    
    // Debounce typing updates
    if (typingStateRef.current === isTyping) return;
    typingStateRef.current = isTyping;

    try {
      await base44.entities.Match.update(matchId, {
        typing_user_id: isTyping ? myProfileId : null
      });
    } catch (e) {
      // Silently fail typing indicators
      console.debug('Typing indicator update failed:', e);
    }
  }, [matchId, myProfileId]);

  // No-op for WebSocket compatibility - messages are created directly
  const notifyNewMessage = useCallback((message) => {
    // Messages are created via sendMessage function
    // Real-time updates happen via entity subscription
    queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
  }, [matchId, queryClient]);

  // Send read receipt by updating messages
  const sendReadReceipt = useCallback(async (messageId) => {
    if (!messageId) return;
    try {
      await base44.entities.Message.update(messageId, {
        is_read: true,
        read_at: new Date().toISOString()
      });
    } catch (e) {
      console.debug('Read receipt failed:', e);
    }
  }, []);

  return {
    isConnected,
    otherUserTyping,
    sendTypingIndicator,
    notifyNewMessage,
    sendReadReceipt
  };
}