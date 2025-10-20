/**
 * user picker screen
 * allows user to select another user to start a conversation with
 */

import { useAuth } from '@/src/hooks/useAuth';
import { firestore } from '@/src/services/firebase';
import { createConversation } from '@/src/services/firestore';
import { User } from '@/src/types';
import { router, Stack } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UserPickerScreen() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);

  console.log('[userpicker] timestamp:', new Date().toISOString(), '- screen rendered');

  useEffect(() => {
    async function fetchUsers() {
      if (!currentUser) return;

      console.log('[userpicker] timestamp:', new Date().toISOString(), '- fetching all users');
      setLoading(true);

      try {
        const usersRef = collection(firestore, 'users');
        const snapshot = await getDocs(usersRef);

        const allUsers: User[] = [];
        snapshot.forEach((doc) => {
          const userData = doc.data() as User;
          // exclude current user
          if (userData.uid !== currentUser.uid) {
            allUsers.push(userData);
          }
        });

        console.log('[userpicker] timestamp:', new Date().toISOString(), '- fetched', allUsers.length, 'users');
        setUsers(allUsers);
      } catch (error) {
        console.error('[userpicker] timestamp:', new Date().toISOString(), '- error fetching users:', error);
        Alert.alert('error', 'failed to load users. please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [currentUser]);

  const handleUserSelect = async (selectedUser: User) => {
    if (!currentUser) return;

    console.log('[userpicker] timestamp:', new Date().toISOString(), '- user selected:', selectedUser.uid);
    setCreating(true);

    try {
      // create conversation with the selected user
      const conversationId = await createConversation(
        currentUser.uid,
        [currentUser.uid, selectedUser.uid],
        false, // not a group chat
        null // no title for one-on-one
      );

      console.log('[userpicker] timestamp:', new Date().toISOString(), '- conversation created:', conversationId);

      // navigate to the chat screen
      router.replace(`/conversation/${conversationId}`);
    } catch (error) {
      console.error('[userpicker] timestamp:', new Date().toISOString(), '- error creating conversation:', error);
      Alert.alert('error', 'failed to create conversation. please try again.');
      setCreating(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
      disabled={creating}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.photoURL ? (
          <Image
            source={{ uri: item.photoURL }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {item.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{item.displayName}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>

      {creating && (
        <ActivityIndicator size="small" color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'new message',
          headerBackTitle: 'back',
        }}
      />

      <View style={styles.container}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>loading users...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>no other users found</Text>
            <Text style={styles.emptySubtext}>
              invite friends to start chatting!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>
                select a user to start chatting
              </Text>
            </View>

            <FlatList
              data={users}
              keyExtractor={(item) => item.uid}
              renderItem={renderUserItem}
              contentContainerStyle={styles.listContent}
            />
          </>
        )}
      </View>
    </>
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
    padding: 20,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
});

