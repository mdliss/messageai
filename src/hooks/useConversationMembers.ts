/**
 * useConversationMembers hook
 * subscribes to conversation members with real-time updates
 * handles loading, error states, and automatic cleanup
 * crucial for accurate read receipts
 */

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { ConversationMember } from '../types';

export function useConversationMembers(conversationId: string | undefined) {
  const [members, setMembers] = useState<ConversationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // if no conversation id, don't subscribe
    if (!conversationId) {
      console.log('[useConversationMembers] timestamp:', new Date().toISOString(), '- no conversation id, skipping subscription');
      setLoading(false);
      return;
    }

    console.log('[useConversationMembers] timestamp:', new Date().toISOString(), '- setting up members subscription for conversation:', conversationId);
    setLoading(true);
    setError(null);

    // subscribe to members subcollection
    const membersRef = collection(firestore, 'conversations', conversationId, 'members');

    const unsubscribe = onSnapshot(
      membersRef,
      (snapshot) => {
        console.log('[useConversationMembers] timestamp:', new Date().toISOString(), '- members snapshot received, size:', snapshot.size);
        console.log('[useConversationMembers] snapshot metadata - fromCache:', snapshot.metadata.fromCache, '- hasPendingWrites:', snapshot.metadata.hasPendingWrites);

        const fetchedMembers: ConversationMember[] = [];
        snapshot.forEach((doc) => {
          const memberData = doc.data() as ConversationMember;
          fetchedMembers.push(memberData);
          console.log('[useConversationMembers] member:', memberData.uid, '- lastSeenAt:', memberData.lastSeenAt);
        });

        console.log('[useConversationMembers] timestamp:', new Date().toISOString(), '- processed', fetchedMembers.length, 'members');
        setMembers(fetchedMembers);
        setLoading(false);
      },
      (err) => {
        console.error('[useConversationMembers] timestamp:', new Date().toISOString(), '- error in subscription:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // cleanup function: unsubscribe when component unmounts or conversationId changes
    return () => {
      console.log('[useConversationMembers] timestamp:', new Date().toISOString(), '- cleaning up members subscription for conversation:', conversationId);
      unsubscribe();
    };
  }, [conversationId]);

  return { members, loading, error };
}


