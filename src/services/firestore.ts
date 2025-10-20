/**
 * firestore service for conversations and messages
 * handles crud operations and real-time listeners
 */

import {
    addDoc,
    collection,
    doc,
    DocumentSnapshot,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    startAfter,
    updateDoc,
    where
} from 'firebase/firestore';
import { Conversation, ConversationMember, Message } from '../types';
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
    type: 'text' | 'image' | 'ai';
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

/**
 * send a message to a conversation
 * creates message document in conversations/{cid}/messages subcollection
 * updates conversation lastMessage and lastMessageAt
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  messageBody: string,
  messageType: 'text' | 'image' | 'ai' = 'text',
  mediaRef: string | null = null
): Promise<string> {
  console.log('[firestore] timestamp:', new Date().toISOString(), '- sending message to conversation:', conversationId);
  console.log('[firestore] sender:', senderId);
  console.log('[firestore] message type:', messageType);
  console.log('[firestore] message body length:', messageBody.length);

  try {
    const now = new Date().toISOString();
    
    // create message document
    const messageData: Omit<Message, 'mid'> = {
      senderId,
      type: messageType,
      body: messageBody,
      mediaRef,
      createdAt: now,
      status: 'sent',
      priority: false,
    };

    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
    const messageDoc = await addDoc(messagesRef, messageData);
    const messageId = messageDoc.id;

    console.log('[firestore] timestamp:', new Date().toISOString(), '- message created with id:', messageId);

    // update conversation lastMessage and lastMessageAt
    await updateConversationLastMessage(conversationId, {
      text: messageBody,
      senderId,
      type: messageType,
      createdAt: now,
    });

    console.log('[firestore] timestamp:', new Date().toISOString(), '- message sent successfully');
    return messageId;
  } catch (error) {
    console.error('[firestore] timestamp:', new Date().toISOString(), '- error sending message:', error);
    throw error;
  }
}

/**
 * get messages for a conversation (one-time fetch)
 * fetches most recent messages with optional pagination
 */
export async function getMessages(
  conversationId: string,
  messageLimit: number = 50,
  lastDoc?: DocumentSnapshot
): Promise<{ messages: Message[]; lastDoc: DocumentSnapshot | null }> {
  console.log('[firestore] timestamp:', new Date().toISOString(), '- fetching messages for conversation:', conversationId);
  console.log('[firestore] limit:', messageLimit);
  console.log('[firestore] has lastDoc:', !!lastDoc);

  try {
    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
    let q = query(
      messagesRef,
      orderBy('createdAt', 'asc'),
      limit(messageLimit)
    );

    // pagination: start after last document
    if (lastDoc) {
      q = query(
        messagesRef,
        orderBy('createdAt', 'asc'),
        startAfter(lastDoc),
        limit(messageLimit)
      );
    }

    const snapshot = await getDocs(q);
    const messages: Message[] = [];

    snapshot.forEach((doc) => {
      messages.push({ ...doc.data(), mid: doc.id } as Message);
    });

    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    console.log('[firestore] timestamp:', new Date().toISOString(), '- fetched', messages.length, 'messages');
    return { messages, lastDoc: newLastDoc };
  } catch (error) {
    console.error('[firestore] timestamp:', new Date().toISOString(), '- error fetching messages:', error);
    throw error;
  }
}

/**
 * subscribe to messages in a conversation in real-time
 * sets up firestore listener that fires on any message changes
 * optimistic ui: messages appear instantly from local cache before server confirms
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void,
  messageLimit: number = 50
): () => void {
  console.log('[firestore] timestamp:', new Date().toISOString(), '- subscribing to messages for conversation:', conversationId);
  console.log('[firestore] limit:', messageLimit);

  const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    orderBy('createdAt', 'asc'),
    limit(messageLimit)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log('[firestore] timestamp:', new Date().toISOString(), '- messages snapshot received, size:', snapshot.size);
      console.log('[firestore] snapshot metadata - fromCache:', snapshot.metadata.fromCache, '- hasPendingWrites:', snapshot.metadata.hasPendingWrites);
      
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const messageData = { ...doc.data(), mid: doc.id } as Message;
        messages.push(messageData);
      });

      console.log('[firestore] timestamp:', new Date().toISOString(), '- processed', messages.length, 'messages');
      callback(messages);
    },
    (error) => {
      console.error('[firestore] timestamp:', new Date().toISOString(), '- error in messages listener:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  );

  console.log('[firestore] timestamp:', new Date().toISOString(), '- messages listener attached');
  return unsubscribe;
}

/**
 * get conversation members (for read receipts)
 * fetches all member documents from subcollection
 */
export async function getConversationMembers(conversationId: string): Promise<ConversationMember[]> {
  console.log('[firestore] timestamp:', new Date().toISOString(), '- fetching members for conversation:', conversationId);

  try {
    const membersRef = collection(firestore, 'conversations', conversationId, 'members');
    const snapshot = await getDocs(membersRef);
    const members: ConversationMember[] = [];

    snapshot.forEach((doc) => {
      members.push(doc.data() as ConversationMember);
    });

    console.log('[firestore] timestamp:', new Date().toISOString(), '- fetched', members.length, 'members');
    return members;
  } catch (error) {
    console.error('[firestore] timestamp:', new Date().toISOString(), '- error fetching members:', error);
    throw error;
  }
}

