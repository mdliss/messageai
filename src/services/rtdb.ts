/**
 * realtime database service for ephemeral data
 * handles typing indicators and presence status
 */

import {
    onDisconnect,
    onValue,
    ref,
    remove,
    serverTimestamp,
    set,
} from 'firebase/database';
import { rtdb } from './firebase';

/**
 * set typing status for a user in a conversation
 * writes to /typing/{conversationId}/{userId}
 * automatically cleans up on disconnect
 */
export async function setTyping(
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  console.log('[rtdb] timestamp:', new Date().toISOString(), '- setting typing status');
  console.log('[rtdb] conversation:', conversationId);
  console.log('[rtdb] user:', userId);
  console.log('[rtdb] isTyping:', isTyping);

  try {
    const typingRef = ref(rtdb, `typing/${conversationId}/${userId}`);

    if (isTyping) {
      // set typing status with timestamp
      await set(typingRef, {
        typing: true,
        timestamp: serverTimestamp(),
      });

      // setup auto-cleanup on disconnect
      onDisconnect(typingRef).remove();

      console.log('[rtdb] timestamp:', new Date().toISOString(), '- typing status set to true');
    } else {
      // remove typing status
      await remove(typingRef);
      console.log('[rtdb] timestamp:', new Date().toISOString(), '- typing status removed');
    }
  } catch (error) {
    console.error('[rtdb] timestamp:', new Date().toISOString(), '- error setting typing status:', error);
    throw error;
  }
}

/**
 * subscribe to typing indicators for a conversation
 * listens to /typing/{conversationId}
 * returns array of user ids who are currently typing
 */
export function subscribeToTyping(
  conversationId: string,
  currentUserId: string,
  callback: (typingUserIds: string[]) => void,
  onError?: (error: Error) => void
): () => void {
  console.log('[rtdb] timestamp:', new Date().toISOString(), '- subscribing to typing indicators');
  console.log('[rtdb] conversation:', conversationId);
  console.log('[rtdb] current user:', currentUserId);

  const typingRef = ref(rtdb, `typing/${conversationId}`);

  const unsubscribe = onValue(
    typingRef,
    (snapshot) => {
      console.log('[rtdb] timestamp:', new Date().toISOString(), '- typing snapshot received');

      const typingData = snapshot.val();
      const typingUserIds: string[] = [];

      if (typingData) {
        // extract user ids who are typing (exclude current user)
        Object.keys(typingData).forEach((userId) => {
          if (userId !== currentUserId && typingData[userId]?.typing) {
            typingUserIds.push(userId);
          }
        });
      }

      console.log('[rtdb] timestamp:', new Date().toISOString(), '- typing users:', typingUserIds.length);
      callback(typingUserIds);
    },
    (error) => {
      console.error('[rtdb] timestamp:', new Date().toISOString(), '- error in typing listener:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  );

  console.log('[rtdb] timestamp:', new Date().toISOString(), '- typing listener attached');

  // return cleanup function
  return () => {
    console.log('[rtdb] timestamp:', new Date().toISOString(), '- unsubscribing from typing indicators');
    unsubscribe();
  };
}

/**
 * clear typing status for a user in a conversation
 * utility function for cleanup
 */
export async function clearTyping(
  conversationId: string,
  userId: string
): Promise<void> {
  console.log('[rtdb] timestamp:', new Date().toISOString(), '- clearing typing status');
  console.log('[rtdb] conversation:', conversationId);
  console.log('[rtdb] user:', userId);

  try {
    const typingRef = ref(rtdb, `typing/${conversationId}/${userId}`);
    await remove(typingRef);
    console.log('[rtdb] timestamp:', new Date().toISOString(), '- typing status cleared');
  } catch (error) {
    console.error('[rtdb] timestamp:', new Date().toISOString(), '- error clearing typing status:', error);
    throw error;
  }
}

/**
 * set user as online
 * writes to /presence/{userId}
 * automatically sets offline on disconnect
 */
export async function setUserOnline(userId: string): Promise<void> {
  console.log('[rtdb] timestamp:', new Date().toISOString(), '- setting user online');
  console.log('[rtdb] user:', userId);

  try {
    const presenceRef = ref(rtdb, `presence/${userId}`);

    // set online status with timestamp
    await set(presenceRef, {
      online: true,
      lastSeen: serverTimestamp(),
    });

    // setup auto-cleanup on disconnect
    // when user disconnects, set online to false and update lastSeen
    onDisconnect(presenceRef).set({
      online: false,
      lastSeen: serverTimestamp(),
    });

    console.log('[rtdb] timestamp:', new Date().toISOString(), '- user set to online with disconnect handler');
  } catch (error) {
    console.error('[rtdb] timestamp:', new Date().toISOString(), '- error setting user online:', error);
    throw error;
  }
}

/**
 * set user as offline
 * writes to /presence/{userId}
 */
export async function setUserOffline(userId: string): Promise<void> {
  console.log('[rtdb] timestamp:', new Date().toISOString(), '- setting user offline');
  console.log('[rtdb] user:', userId);

  try {
    const presenceRef = ref(rtdb, `presence/${userId}`);

    // set offline status with timestamp
    await set(presenceRef, {
      online: false,
      lastSeen: serverTimestamp(),
    });

    console.log('[rtdb] timestamp:', new Date().toISOString(), '- user set to offline');
  } catch (error) {
    console.error('[rtdb] timestamp:', new Date().toISOString(), '- error setting user offline:', error);
    throw error;
  }
}

/**
 * subscribe to presence status for a user
 * listens to /presence/{userId}
 * returns presence data: { online: boolean, lastSeen: number }
 */
export function subscribeToPresence(
  userId: string,
  callback: (presence: { online: boolean; lastSeen: number | null }) => void,
  onError?: (error: Error) => void
): () => void {
  console.log('[rtdb] timestamp:', new Date().toISOString(), '- subscribing to presence');
  console.log('[rtdb] user:', userId);

  const presenceRef = ref(rtdb, `presence/${userId}`);

  const unsubscribe = onValue(
    presenceRef,
    (snapshot) => {
      console.log('[rtdb] timestamp:', new Date().toISOString(), '- presence snapshot received');

      const presenceData = snapshot.val();

      if (presenceData) {
        const presence = {
          online: presenceData.online || false,
          lastSeen: presenceData.lastSeen || null,
        };
        console.log('[rtdb] timestamp:', new Date().toISOString(), '- user presence:', presence.online ? 'online' : 'offline');
        callback(presence);
      } else {
        // no presence data means user has never been online
        console.log('[rtdb] timestamp:', new Date().toISOString(), '- no presence data, assuming offline');
        callback({ online: false, lastSeen: null });
      }
    },
    (error) => {
      console.error('[rtdb] timestamp:', new Date().toISOString(), '- error in presence listener:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  );

  console.log('[rtdb] timestamp:', new Date().toISOString(), '- presence listener attached');

  // return cleanup function
  return () => {
    console.log('[rtdb] timestamp:', new Date().toISOString(), '- unsubscribing from presence');
    unsubscribe();
  };
}

