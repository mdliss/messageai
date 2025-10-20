/**
 * useconversations hook
 * subscribes to user's conversations in real-time
 */

import { useEffect, useState } from 'react';
import { subscribeToConversations } from '../services/firestore';
import { Conversation } from '../types';
import { useAuth } from './useAuth';

export function useConversations() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  console.log('[useconversations] timestamp:', new Date().toISOString(), '- hook initialized');
  console.log('[useconversations] current user:', currentUser?.uid);

  useEffect(() => {
    if (!currentUser) {
      console.log('[useconversations] timestamp:', new Date().toISOString(), '- no current user, skipping subscription');
      setConversations([]);
      setLoading(false);
      return;
    }

    console.log('[useconversations] timestamp:', new Date().toISOString(), '- setting up conversations listener');
    setLoading(true);

    const unsubscribe = subscribeToConversations(
      currentUser.uid,
      (newConversations) => {
        console.log('[useconversations] timestamp:', new Date().toISOString(), '- received', newConversations.length, 'conversations');
        setConversations(newConversations);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useconversations] timestamp:', new Date().toISOString(), '- error:', err);
        setError(err);
        setLoading(false);
      }
    );

    // cleanup function
    return () => {
      console.log('[useconversations] timestamp:', new Date().toISOString(), '- cleaning up conversations listener');
      unsubscribe();
    };
  }, [currentUser]);

  return { conversations, loading, error };
}

