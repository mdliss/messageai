/**
 * firestore service for conversations and messages
 * handles crud operations and real-time listeners
 */

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { Conversation, ConversationMember } from '../types';
import { firestore } from './firebase';

/**
 * get user's conversations (one-time fetch)
 * query conversations where user is a member
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  console.log('[firestore] timestamp:', new Date().toISOString(), '- fetching conversations for user:', userId);

  try {
    const conversationsRef = collection(firestore, 'conversations');
    const q = query(
      conversationsRef,
      where('memberIds', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const conversations: Conversation[] = [];

    snapshot.forEach((doc) => {
      conversations.push({ ...doc.data(), cid: doc.id } as Conversation);
    });

    console.log('[firestore] timestamp:', new Date().toISOString(), '- fetched', conversations.length, 'conversations');
    return conversations;
  } catch (error) {
    console.error('[firestore] timestamp:', new Date().toISOString(), '- error fetching conversations:', error);
    throw error;
  }
}

/**
 * subscribe to user's conversations in real-time
 * sets up firestore listener that fires on any changes
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void,
  onError?: (error: Error) => void
): () => void {
  console.log('[firestore] timestamp:', new Date().toISOString(), '- subscribing to conversations for user:', userId);

  const conversationsRef = collection(firestore, 'conversations');
  const q = query(
    conversationsRef,
    where('memberIds', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc'),
    limit(20)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log('[firestore] timestamp:', new Date().toISOString(), '- conversations snapshot received, size:', snapshot.size);
      
      const conversations: Conversation[] = [];
      snapshot.forEach((doc) => {
        conversations.push({ ...doc.data(), cid: doc.id } as Conversation);
      });

      console.log('[firestore] timestamp:', new Date().toISOString(), '- processed', conversations.length, 'conversations');
      callback(conversations);
    },
    (error) => {
      console.error('[firestore] timestamp:', new Date().toISOString(), '- error in conversations listener:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  );

  console.log('[firestore] timestamp:', new Date().toISOString(), '- conversations listener attached');
  return unsubscribe;
}

/**
 * create a new conversation
 * creates conversation document and member subdocuments
 */
export async function createConversation(
  currentUserId: string,
  memberIds: string[],
  isGroup: boolean = false,
  title: string | null = null
): Promise<string> {
  console.log('[firestore] timestamp:', new Date().toISOString(), '- creating conversation');
  console.log('[firestore] creator:', currentUserId);
  console.log('[firestore] members:', memberIds);
  console.log('[firestore] is group:', isGroup);
  console.log('[firestore] title:', title);

  try {
    // create conversation document
    const conversationData: Omit<Conversation, 'cid'> = {
      isGroup,
      title,
      memberIds,
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      lastMessage: null,
      lastMessageAt: new Date().toISOString(),
    };

    const conversationsRef = collection(firestore, 'conversations');
    const conversationDoc = await addDoc(conversationsRef, conversationData);
    const conversationId = conversationDoc.id;

    console.log('[firestore] timestamp:', new Date().toISOString(), '- conversation created with id:', conversationId);

    // create member subdocuments for each participant
    const now = new Date().toISOString();
    const memberPromises = memberIds.map(async (memberId) => {
      const memberData: ConversationMember = {
        uid: memberId,
        joinedAt: now,
        lastSeenAt: now,
        muted: false,
      };

      const memberRef = doc(firestore, 'conversations', conversationId, 'members', memberId);
      await setDoc(memberRef, memberData);
      console.log('[firestore] timestamp:', new Date().toISOString(), '- created member doc for:', memberId);
    });

    await Promise.all(memberPromises);
    console.log('[firestore] timestamp:', new Date().toISOString(), '- all member docs created');

    return conversationId;
  } catch (error) {
    console.error('[firestore] timestamp:', new Date().toISOString(), '- error creating conversation:', error);
    throw error;
  }
}

/**
 * get conversation by id
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  console.log('[firestore] timestamp:', new Date().toISOString(), '- fetching conversation:', conversationId);

  try {
    const conversationRef = doc(firestore, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      console.log('[firestore] timestamp:', new Date().toISOString(), '- conversation found');
      return { ...conversationSnap.data(), cid: conversationSnap.id } as Conversation;
    } else {
      console.log('[firestore] timestamp:', new Date().toISOString(), '- conversation not found');
      return null;
    }
  } catch (error) {
    console.error('[firestore] timestamp:', new Date().toISOString(), '- error fetching conversation:', error);
    throw error;
  }
}

/**
 * update last message in conversation
 * called after sending a message
 */
export async function updateConversationLastMessage(
  conversationId: string,
  lastMessage: {
    text: string;
    senderId: string;
    type: 'text' | 'image';
    createdAt: string;
  }
): Promise<void> {
  console.log('[firestore] timestamp:', new Date().toISOString(), '- updating last message for conversation:', conversationId);

  try {
    const conversationRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage,
      lastMessageAt: lastMessage.createdAt,
    });

    console.log('[firestore] timestamp:', new Date().toISOString(), '- last message updated successfully');
  } catch (error) {
    console.error('[firestore] timestamp:', new Date().toISOString(), '- error updating last message:', error);
    throw error;
  }
}

/**
 * update user's last seen timestamp in conversation
 * used for read receipts
 */
export async function updateLastSeenAt(conversationId: string, userId: string): Promise<void> {
  console.log('[firestore] timestamp:', new Date().toISOString(), '- updating lastSeenAt for user:', userId, 'in conversation:', conversationId);

  try {
    const memberRef = doc(firestore, 'conversations', conversationId, 'members', userId);
    await updateDoc(memberRef, {
      lastSeenAt: new Date().toISOString(),
    });

    console.log('[firestore] timestamp:', new Date().toISOString(), '- lastSeenAt updated successfully');
  } catch (error) {
    console.error('[firestore] timestamp:', new Date().toISOString(), '- error updating lastSeenAt:', error);
    throw error;
  }
}

