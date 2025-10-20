/**
 * profile screen
 * shows user information and logout button
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '@/src/hooks/useAuth';

export default function ProfileScreen() {
  const { currentUser, userProfile, signOut, loading } = useAuth();

  console.log('[profile] timestamp:', new Date().toISOString(), '- profile screen rendered');
  console.log('[profile] current user:', currentUser?.uid);
  console.log('[profile] user profile:', userProfile?.displayName);

  /**
   * handle logout with confirmation
   */
  const handleLogout = () => {
    console.log('[profile] timestamp:', new Date().toISOString(), '- logout button pressed');

    Alert.alert(
      'confirm logout',
      'are you sure you want to sign out?',
      [
        {
          text: 'cancel',
          style: 'cancel',
          onPress: () => console.log('[profile] logout cancelled'),
        },
        {
          text: 'sign out',
          style: 'destructive',
          onPress: async () => {
            console.log('[profile] timestamp:', new Date().toISOString(), '- logout confirmed');
            try {
              await signOut();
              console.log('[profile] timestamp:', new Date().toISOString(), '- logout successful');
              // navigation handled by auth state change in app/_layout.tsx
            } catch (error) {
              console.error('[profile] timestamp:', new Date().toISOString(), '- logout error:', error);
              Alert.alert('error', 'failed to sign out. please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>profile</Text>
        </View>

        {/* profile photo */}
        <View style={styles.photoContainer}>
          {userProfile?.photoURL ? (
            <Image
              source={{ uri: userProfile.photoURL }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Text style={styles.profilePhotoPlaceholderText}>
                {userProfile?.displayName?.charAt(0).toUpperCase() || 
                 currentUser?.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>

        {/* user info section */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>display name</Text>
            <Text style={styles.infoValue}>
              {userProfile?.displayName || currentUser?.displayName || 'not set'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>email</Text>
            <Text style={styles.infoValue}>
              {currentUser?.email || 'not available'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>user id</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
              {currentUser?.uid || 'not available'}
            </Text>
          </View>

          {userProfile?.createdAt && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>member since</Text>
                <Text style={styles.infoValue}>
                  {new Date(userProfile.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* logout button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          <Text style={styles.logoutButtonText}>sign out</Text>
        </TouchableOpacity>

        {/* app info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appInfoText}>messageai v1.0.0</Text>
          <Text style={styles.appInfoText}>real time messaging with ai features</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  headerSection: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoPlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  logoutButton: {
    height: 50,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  appInfoText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});

