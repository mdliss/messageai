/**
 * useTyping hook
 * subscribes to typing indicators for a conversation
 * returns array of user ids who are currently typing
 */

import { useEffect, useState } from 'react';
import { subscribeToTyping } from '../services/rtdb';

export function useTyping(conversationId: string | undefined, currentUserId: string | undefined) {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // if no conversation id or current user, don't subscribe
    if (!conversationId || !currentUserId) {
      console.log('[useTyping] timestamp:', new Date().toISOString(), '- missing conversationId or currentUserId, skipping subscription');
      return;
    }

    console.log('[useTyping] timestamp:', new Date().toISOString(), '- setting up typing subscription');
    console.log('[useTyping] conversation:', conversationId);
    console.log('[useTyping] current user:', currentUserId);

    setError(null);

    const unsubscribe = subscribeToTyping(
      conversationId,
      currentUserId,
      (userIds) => {
        console.log('[useTyping] timestamp:', new Date().toISOString(), '- received typing users:', userIds);
        setTypingUserIds(userIds);
      },
      (err) => {
        console.error('[useTyping] timestamp:', new Date().toISOString(), '- error in subscription:', err);
        setError(err.message);
      }
    );

    // cleanup function: unsubscribe when component unmounts or conversationId changes
    return () => {
      console.log('[useTyping] timestamp:', new Date().toISOString(), '- cleaning up typing subscription');
      unsubscribe();
      setTypingUserIds([]);
    };
  }, [conversationId, currentUserId]);

  return { typingUserIds, error };
}

