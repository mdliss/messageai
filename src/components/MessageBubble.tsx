/**
 * MessageBubble component
 * displays individual message with styling based on sender/receiver
 * includes timestamp, status indicators, and sender name
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string;
  showSenderName?: boolean;
  isRead?: boolean;
}

export default function MessageBubble({
  message,
  isOwnMessage,
  senderName,
  showSenderName = false,
  isRead = false,
}: MessageBubbleProps) {
  console.log('[MessageBubble] timestamp:', new Date().toISOString(), '- rendering message:', message.mid);
  console.log('[MessageBubble] isOwnMessage:', isOwnMessage, '- isRead:', isRead);

  // format timestamp
  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // format as date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // get status indicator for own messages
  const getStatusIndicator = (): string => {
    if (!isOwnMessage) return '';
    
    if (isRead) return '✓✓'; // double check (blue in actual UI)
    if (message.status === 'delivered') return '✓✓'; // double check (gray)
    if (message.status === 'sent') return '✓'; // single check
    return ''; // sending
  };

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      {/* sender name for group messages */}
      {showSenderName && !isOwnMessage && senderName && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}

      {/* message bubble */}
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble
      ]}>
        {/* message text */}
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.body}
        </Text>

        {/* timestamp and status indicator */}
        <View style={styles.metaRow}>
          <Text style={[
            styles.timestamp,
            isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
          ]}>
            {formatTimestamp(message.createdAt)}
          </Text>
          
          {isOwnMessage && (
            <Text style={[
              styles.statusIndicator,
              isRead ? styles.readIndicator : styles.unreadIndicator
            ]}>
              {getStatusIndicator()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    marginLeft: 12,
    fontWeight: '500',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#E8E8E8',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
    marginRight: 4,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#666',
  },
  statusIndicator: {
    fontSize: 12,
    fontWeight: '600',
  },
  readIndicator: {
    color: '#4FC3F7', // light blue for read
  },
  unreadIndicator: {
    color: 'rgba(255, 255, 255, 0.7)', // white for unread
  },
});

