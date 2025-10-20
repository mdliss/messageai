/**
 * hook to subscribe to user presence status
 * uses rtdb for real-time presence updates
 */

import { useEffect, useState } from 'react';
import { subscribeToPresence } from '../services/rtdb';

export interface PresenceStatus {
  online: boolean;
  lastSeen: number | null;
}

/**
 * subscribes to real-time presence status for a user
 * returns presence status: { online: boolean, lastSeen: number | null }
 */
export function usePresence(userId: string | null | undefined): PresenceStatus {
  const [presence, setPresence] = useState<PresenceStatus>({
    online: false,
    lastSeen: null,
  });

  useEffect(() => {
    console.log('[usePresence] timestamp:', new Date().toISOString(), '- mounting hook');
    console.log('[usePresence] userId:', userId);

    // if no userId provided, don't subscribe
    if (!userId) {
      console.log('[usePresence] timestamp:', new Date().toISOString(), '- no userId, skipping subscription');
      return;
    }

    console.log('[usePresence] timestamp:', new Date().toISOString(), '- subscribing to presence for user:', userId);

    // subscribe to presence updates
    const unsubscribe = subscribeToPresence(
      userId,
      (presenceData) => {
        console.log('[usePresence] timestamp:', new Date().toISOString(), '- presence update received');
        console.log('[usePresence] online:', presenceData.online);
        console.log('[usePresence] lastSeen:', presenceData.lastSeen);
        setPresence(presenceData);
      },
      (error) => {
        console.error('[usePresence] timestamp:', new Date().toISOString(), '- error:', error);
      }
    );

    // cleanup on unmount
    return () => {
      console.log('[usePresence] timestamp:', new Date().toISOString(), '- unmounting hook, cleaning up');
      unsubscribe();
    };
  }, [userId]);

  return presence;
}


