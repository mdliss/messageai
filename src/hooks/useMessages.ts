/**
 * useMessages hook
 * subscribes to messages in a conversation with real-time updates
 * handles loading, error states, and automatic cleanup
 */

import { useEffect, useState } from 'react';
import { Message } from '../types';
import { subscribeToMessages } from '../services/firestore';

export function useMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // if no conversation id, don't subscribe
    if (!conversationId) {
      console.log('[useMessages] timestamp:', new Date().toISOString(), '- no conversation id, skipping subscription');
      setLoading(false);
      return;
    }

    console.log('[useMessages] timestamp:', new Date().toISOString(), '- setting up message subscription for conversation:', conversationId);
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToMessages(
      conversationId,
      (fetchedMessages) => {
        console.log('[useMessages] timestamp:', new Date().toISOString(), '- received', fetchedMessages.length, 'messages');
        setMessages(fetchedMessages);
        setLoading(false);
      },
      (err) => {
        console.error('[useMessages] timestamp:', new Date().toISOString(), '- error in subscription:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // cleanup function: unsubscribe when component unmounts or conversationId changes
    return () => {
      console.log('[useMessages] timestamp:', new Date().toISOString(), '- cleaning up message subscription for conversation:', conversationId);
      unsubscribe();
    };
  }, [conversationId]);

  return { messages, loading, error };
}

