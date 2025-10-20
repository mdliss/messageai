/**
 * chat screen - full implementation with real-time messaging
 * displays messages, allows sending, implements optimistic UI, handles read receipts
 */

import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MessageBubble from '../../src/components/MessageBubble';
import TypingIndicator from '../../src/components/TypingIndicator';
import { useAuth } from '../../src/hooks/useAuth';
import { useConversationMembers } from '../../src/hooks/useConversationMembers';
import { useMessages } from '../../src/hooks/useMessages';
import { usePresence } from '../../src/hooks/usePresence';
import { useTyping } from '../../src/hooks/useTyping';
import { firestore } from '../../src/services/firebase';
import {
  getConversation,
  sendMessage,
  updateLastSeenAt,
} from '../../src/services/firestore';
import { clearTyping, setTyping } from '../../src/services/rtdb';
import { Conversation, Message, User } from '../../src/types';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { messages, loading: messagesLoading, error: messagesError } = useMessages(id);
  const { members, loading: membersLoading } = useConversationMembers(id);
  const { typingUserIds } = useTyping(id, currentUser?.uid);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [conversationLoading, setConversationLoading] = useState(true);
  
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUserNames, setTypingUserNames] = useState<string[]>([]);

  // subscribe to other user's presence
  const presence = usePresence(otherUserId);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  console.log('[conversation] timestamp:', new Date().toISOString(), '- screen rendered for conversation:', id);
  console.log('[conversation] current user:', currentUser?.uid);
  console.log('[conversation] messages count:', messages.length);

  // fetch conversation details on mount
  useEffect(() => {
    if (!id || !currentUser) return;

    console.log('[conversation] timestamp:', new Date().toISOString(), '- fetching conversation details');

    const fetchConversationDetails = async () => {
      try {
        setConversationLoading(true);

        // fetch conversation
        const conv = await getConversation(id);
        if (!conv) {
          console.error('[conversation] timestamp:', new Date().toISOString(), '- conversation not found');
          Alert.alert('error', 'conversation not found');
          return;
        }
        setConversation(conv);
        console.log('[conversation] timestamp:', new Date().toISOString(), '- conversation loaded:', conv.cid);

        // fetch other user's details for 1-on-1 chat
        if (!conv.isGroup) {
          const foundOtherUserId = conv.memberIds.find((uid) => uid !== currentUser.uid);
          if (foundOtherUserId) {
            setOtherUserId(foundOtherUserId); // store for presence subscription
            const userDoc = await getDoc(doc(firestore, 'users', foundOtherUserId));
            if (userDoc.exists()) {
              setOtherUser({ ...userDoc.data(), uid: userDoc.id } as User);
              console.log('[conversation] timestamp:', new Date().toISOString(), '- other user loaded:', foundOtherUserId);
            }
          }
        }

        setConversationLoading(false);
      } catch (error: any) {
        console.error('[conversation] timestamp:', new Date().toISOString(), '- error fetching conversation:', error);
        Alert.alert('error', 'failed to load conversation');
        setConversationLoading(false);
      }
    };

    fetchConversationDetails();
  }, [id, currentUser]);

  // update lastSeenAt on mount for read receipts
  useEffect(() => {
    if (!id || !currentUser) return;

    console.log('[conversation] timestamp:', new Date().toISOString(), '- updating lastSeenAt on mount');

    const updateLastSeen = async () => {
      try {
        await updateLastSeenAt(id, currentUser.uid);
        console.log('[conversation] timestamp:', new Date().toISOString(), '- lastSeenAt updated successfully');
      } catch (error: any) {
        console.error('[conversation] timestamp:', new Date().toISOString(), '- error updating lastSeenAt:', error);
      }
    };

    updateLastSeen();
  }, [id, currentUser]);

  // fetch user names for typing users
  useEffect(() => {
    if (typingUserIds.length === 0) {
      setTypingUserNames([]);
      return;
    }

    console.log('[conversation] timestamp:', new Date().toISOString(), '- fetching names for typing users:', typingUserIds);

    const fetchTypingUserNames = async () => {
      try {
        const names: string[] = [];

        for (const userId of typingUserIds) {
          // check if it's the other user in 1-on-1 chat
          if (otherUser && userId === otherUser.uid) {
            names.push(otherUser.displayName);
          } else {
            // fetch user from firestore
            const userDoc = await getDoc(doc(firestore, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              names.push(userData.displayName);
            }
          }
        }

        console.log('[conversation] timestamp:', new Date().toISOString(), '- fetched typing user names:', names);
        setTypingUserNames(names);
      } catch (error: any) {
        console.error('[conversation] timestamp:', new Date().toISOString(), '- error fetching typing user names:', error);
      }
    };

    fetchTypingUserNames();
  }, [typingUserIds, otherUser]);

  // clear typing status on unmount
  useEffect(() => {
    return () => {
      if (id && currentUser) {
        console.log('[conversation] timestamp:', new Date().toISOString(), '- clearing typing status on unmount');
        
        // clear timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        
        // clear typing indicator
        clearTyping(id, currentUser.uid).catch((error) => {
          console.error('[conversation] timestamp:', new Date().toISOString(), '- error clearing typing on unmount:', error);
        });
      }
    };
  }, [id, currentUser]);

  // clear typing status when screen loses focus or app goes to background
  useFocusEffect(
    useCallback(() => {
      console.log('[conversation] timestamp:', new Date().toISOString(), '- screen gained focus');
      
      // update lastSeenAt when returning to screen
      if (id && currentUser) {
        updateLastSeenAt(id, currentUser.uid).catch((error) => {
          console.error('[conversation] timestamp:', new Date().toISOString(), '- error updating lastSeenAt on focus:', error);
        });
      }
      
      return () => {
        console.log('[conversation] timestamp:', new Date().toISOString(), '- screen lost focus, clearing typing');
        
        // clear typing when screen loses focus
        if (id && currentUser) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
          
          clearTyping(id, currentUser.uid).catch((error) => {
            console.error('[conversation] timestamp:', new Date().toISOString(), '- error clearing typing on blur:', error);
          });
        }
      };
    }, [id, currentUser])
  );

  // handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[conversation] timestamp:', new Date().toISOString(), '- app state changed to:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // clear typing when app goes to background
        if (id && currentUser) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
          
          clearTyping(id, currentUser.uid).catch((error) => {
            console.error('[conversation] timestamp:', new Date().toISOString(), '- error clearing typing on background:', error);
          });
        }
      }
      
      if (nextAppState === 'active') {
        // update lastSeenAt when app comes back to foreground
        if (id && currentUser) {
          updateLastSeenAt(id, currentUser.uid).catch((error) => {
            console.error('[conversation] timestamp:', new Date().toISOString(), '- error updating lastSeenAt on active:', error);
          });
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [id, currentUser]);

  // handle text input change with debounced typing indicator
  const handleTextChange = (text: string) => {
    setInputText(text);

    if (!id || !currentUser) return;

    // clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.trim().length > 0) {
      // set typing to true
      setTyping(id, currentUser.uid, true).catch((error) => {
        console.error('[conversation] timestamp:', new Date().toISOString(), '- error setting typing status:', error);
      });

      // set timeout to clear typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(id, currentUser.uid, false).catch((error) => {
          console.error('[conversation] timestamp:', new Date().toISOString(), '- error clearing typing status:', error);
        });
      }, 3000);
    } else {
      // clear typing if input is empty
      clearTyping(id, currentUser.uid).catch((error) => {
        console.error('[conversation] timestamp:', new Date().toISOString(), '- error clearing typing status:', error);
      });
    }
  };

  // handle send message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !id || !currentUser) {
      console.log('[conversation] timestamp:', new Date().toISOString(), '- cannot send: empty message or missing data');
      return;
    }

    console.log('[conversation] timestamp:', new Date().toISOString(), '- sending message, length:', inputText.length);

    const messageText = inputText.trim();
    setInputText(''); // clear input immediately for responsive UI
    setSending(true);

    // clear typing indicator immediately on send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    clearTyping(id, currentUser.uid).catch((error) => {
      console.error('[conversation] timestamp:', new Date().toISOString(), '- error clearing typing on send:', error);
    });

    try {
      await sendMessage(id, currentUser.uid, messageText);
      console.log('[conversation] timestamp:', new Date().toISOString(), '- message sent successfully');
      
      // update lastSeenAt after sending message
      await updateLastSeenAt(id, currentUser.uid);
      
      setSending(false);
    } catch (error: any) {
      console.error('[conversation] timestamp:', new Date().toISOString(), '- error sending message:', error);
      Alert.alert('error', 'failed to send message. please try again.');
      setInputText(messageText); // restore message text on error
      setSending(false);
    }
  };

  // compute read status for each message
  const isMessageRead = (message: Message): boolean => {
    if (message.senderId !== currentUser?.uid) return false; // only show status for own messages

    // check if all other members have seen this message
    const otherMembers = members.filter((m) => m.uid !== currentUser.uid);
    console.log('[conversation] isMessageRead for message:', message.mid, '- total members:', members.length, '- other members:', otherMembers.length);
    if (otherMembers.length === 0) {
      console.log('[conversation] isMessageRead - no other members found for message:', message.mid);
      return false;
    }

    const allRead = otherMembers.every((member) => {
      const memberLastSeen = new Date(member.lastSeenAt).getTime();
      const messageCreated = new Date(message.createdAt).getTime();
      const isRead = memberLastSeen >= messageCreated;
      console.log('[conversation] checking read status - member:', member.uid, '- lastSeen:', member.lastSeenAt, '- messageCreated:', message.createdAt, '- isRead:', isRead);
      return isRead;
    });

    console.log('[conversation] message:', message.mid, '- allRead:', allRead);
    return allRead;
  };

  // get sender name for group messages
  const getSenderName = (senderId: string): string | undefined => {
    if (senderId === currentUser?.uid) return 'you';
    if (otherUser && senderId === otherUser.uid) return otherUser.displayName;
    return undefined;
  };

  // render message item
  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUser?.uid;
    const isRead = isMessageRead(item);
    const senderName = getSenderName(item.senderId);

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        senderName={senderName}
        showSenderName={conversation?.isGroup}
        isRead={isRead}
      />
    );
  };

  // determine header title
  const getHeaderTitle = (): string => {
    if (conversation?.isGroup) return conversation.title || 'group chat';
    if (otherUser) return otherUser.displayName;
    return 'chat';
  };

  // format last seen time
  const formatLastSeen = (timestamp: number | null): string => {
    if (!timestamp) return 'offline';
    
    try {
      const now = Date.now();
      const diffMs = now - timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'last seen just now';
      if (diffMins < 60) return `last seen ${diffMins}m ago`;
      if (diffHours < 24) return `last seen ${diffHours}h ago`;
      if (diffDays < 7) return `last seen ${diffDays}d ago`;
      
      return 'offline';
    } catch (error) {
      console.error('[conversation] error formatting last seen:', error);
      return 'offline';
    }
  };

  // get presence subtitle for header
  const getPresenceSubtitle = (): string => {
    if (conversation?.isGroup) return '';
    if (!otherUserId) return '';
    
    if (presence.online) {
      return 'online';
    } else if (presence.lastSeen) {
      return formatLastSeen(presence.lastSeen);
    }
    return 'offline';
  };

  // render loading state
  if (conversationLoading || messagesLoading || membersLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'loading...' }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>loading messages...</Text>
        </View>
      </>
    );
  }

  // render error state
  if (messagesError) {
    return (
      <>
        <Stack.Screen options={{ title: 'error' }} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>failed to load messages</Text>
          <Text style={styles.errorSubtext}>{messagesError}</Text>
        </View>
      </>
    );
  }

  // render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>no messages yet</Text>
      <Text style={styles.emptySubtext}>start the conversation!</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: getHeaderTitle(),
          headerBackTitle: 'back',
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: '600',
          },
          // show presence subtitle for 1-on-1 chats
          ...((!conversation?.isGroup && otherUserId) && {
            headerTitle: () => (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#000' }}>
                  {getHeaderTitle()}
                </Text>
                <Text style={{ fontSize: 12, color: presence.online ? '#4CD964' : '#999', marginTop: 2 }}>
                  {getPresenceSubtitle()}
                </Text>
              </View>
            ),
          }),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* messages list - inverted for chat UI */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.mid}
          inverted
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={() => {
            // auto-scroll to bottom when new messages arrive
            if (messages.length > 0) {
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }
          }}
        />

        {/* typing indicator */}
        <TypingIndicator typingUserNames={typingUserNames} />

        {/* input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="type a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={handleTextChange}
            multiline
            maxLength={5000}
            editable={!sending}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendButtonText}>send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  messagesList: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

