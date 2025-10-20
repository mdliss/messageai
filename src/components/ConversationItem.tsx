/**
 * conversation item component
 * displays conversation preview in the conversations list
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { Conversation, User } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ConversationItemProps {
  conversation: Conversation;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const { currentUser } = useAuth();
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  console.log('[conversationitem] timestamp:', new Date().toISOString(), '- rendering conversation:', conversation.cid);

  useEffect(() => {
    // fetch other participant's details (for one-on-one chats)
    async function fetchOtherUser() {
      if (!currentUser) return;

      try {
        // find the other user's id (not the current user)
        const otherUserId = conversation.memberIds.find(id => id !== currentUser.uid);
        
        if (!otherUserId) {
          console.log('[conversationitem] timestamp:', new Date().toISOString(), '- no other user found');
          setLoading(false);
          return;
        }

        console.log('[conversationitem] timestamp:', new Date().toISOString(), '- fetching user:', otherUserId);
        const userRef = doc(firestore, 'users', otherUserId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          setOtherUser(userData);
          console.log('[conversationitem] timestamp:', new Date().toISOString(), '- user fetched:', userData.displayName);
        }

        setLoading(false);
      } catch (error) {
        console.error('[conversationitem] timestamp:', new Date().toISOString(), '- error fetching user:', error);
        setLoading(false);
      }
    }

    fetchOtherUser();
  }, [conversation, currentUser]);

  const handlePress = () => {
    console.log('[conversationitem] timestamp:', new Date().toISOString(), '- navigating to conversation:', conversation.cid);
    router.push(`/conversation/${conversation.cid}`);
  };

  // format timestamp
  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return '';

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('[conversationitem] error formatting timestamp:', error);
      return '';
    }
  };

  // get display name
  const getDisplayName = (): string => {
    if (conversation.isGroup && conversation.title) {
      return conversation.title;
    }

    if (otherUser) {
      return otherUser.displayName;
    }

    return 'loading...';
  };

  // get last message preview
  const getLastMessagePreview = (): string => {
    if (!conversation.lastMessage) {
      return 'no messages yet';
    }

    const { text, senderId, type } = conversation.lastMessage;

    if (type === 'image') {
      return senderId === currentUser?.uid ? 'you sent an image' : 'sent an image';
    }

    const preview = text.length > 40 ? `${text.substring(0, 40)}...` : text;
    return senderId === currentUser?.uid ? `you: ${preview}` : preview;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {otherUser?.photoURL ? (
          <Image
            source={{ uri: otherUser.photoURL }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {getDisplayName().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {getDisplayName()}
          </Text>
          {conversation.lastMessageAt && (
            <Text style={styles.timestamp}>
              {formatTimestamp(conversation.lastMessageAt)}
            </Text>
          )}
        </View>

        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {getLastMessagePreview()}
          </Text>
          {/* unread count badge (placeholder for now) */}
          {false && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>0</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

