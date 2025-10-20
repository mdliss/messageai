/**
 * conversations list screen (home)
 * displays all user's conversations with real-time updates
 */

import { ConversationItem } from '@/src/components/ConversationItem';
import { useConversations } from '@/src/hooks/useConversations';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ConversationsListScreen() {
  const { conversations, loading, error } = useConversations();
  const [refreshing, setRefreshing] = useState(false);

  console.log('[conversationslist] timestamp:', new Date().toISOString(), '- screen rendered');
  console.log('[conversationslist] conversations count:', conversations.length);
  console.log('[conversationslist] loading:', loading);

  const handleRefresh = async () => {
    console.log('[conversationslist] timestamp:', new Date().toISOString(), '- refresh triggered');
    setRefreshing(true);
    // firestore listener automatically refreshes, just wait a moment
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNewMessage = () => {
    console.log('[conversationslist] timestamp:', new Date().toISOString(), '- navigating to user picker');
    router.push('/user-picker');
  };

  // loading state
  if (loading && conversations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>loading conversations...</Text>
      </View>
    );
  }

  // error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>error loading conversations</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // empty state
  if (conversations.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>messages</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>no conversations yet</Text>
          <Text style={styles.emptySubtext}>
            tap the + button below to start chatting!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.fab}
          onPress={handleNewMessage}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // conversations list
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.cid}
        renderItem={({ item }) => <ConversationItem conversation={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewMessage}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  headerContainer: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  listContent: {
    flexGrow: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
    lineHeight: 36,
  },
});
