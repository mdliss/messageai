/**
 * chat screen - full implementation with real-time messaging
 * displays messages, allows sending, implements optimistic UI, handles read receipts
 */

import { Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { useAuth } from '../../src/hooks/useAuth';
import { useMessages } from '../../src/hooks/useMessages';
import { firestore } from '../../src/services/firebase';
import {
    getConversation,
    getConversationMembers,
    sendMessage,
    updateLastSeenAt,
} from '../../src/services/firestore';
import { Conversation, ConversationMember, Message, User } from '../../src/types';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { messages, loading: messagesLoading, error: messagesError } = useMessages(id);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [members, setMembers] = useState<ConversationMember[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [conversationLoading, setConversationLoading] = useState(true);
  
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  console.log('[conversation] timestamp:', new Date().toISOString(), '- screen rendered for conversation:', id);
  console.log('[conversation] current user:', currentUser?.uid);
  console.log('[conversation] messages count:', messages.length);

  // fetch conversation details and members on mount
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

        // fetch members for read receipts
        const fetchedMembers = await getConversationMembers(id);
        setMembers(fetchedMembers);
        console.log('[conversation] timestamp:', new Date().toISOString(), '- members loaded:', fetchedMembers.length);

        // fetch other user's details for 1-on-1 chat
        if (!conv.isGroup) {
          const otherUserId = conv.memberIds.find((uid) => uid !== currentUser.uid);
          if (otherUserId) {
            const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
            if (userDoc.exists()) {
              setOtherUser({ ...userDoc.data(), uid: userDoc.id } as User);
              console.log('[conversation] timestamp:', new Date().toISOString(), '- other user loaded:', otherUserId);
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
    if (otherMembers.length === 0) return false;

    const allRead = otherMembers.every((member) => {
      const memberLastSeen = new Date(member.lastSeenAt).getTime();
      const messageCreated = new Date(message.createdAt).getTime();
      return memberLastSeen >= messageCreated;
    });

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

  // render loading state
  if (conversationLoading || messagesLoading) {
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

        {/* input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="type a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
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

