/**
 * chat screen (placeholder for pr #4)
 * will display messages and allow sending in pr #4
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  console.log('[conversation] timestamp:', new Date().toISOString(), '- screen rendered for conversation:', id);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'chat',
          headerBackTitle: 'back',
        }}
      />

      <View style={styles.container}>
        <Text style={styles.placeholderText}>
          chat screen coming in pr #4
        </Text>
        <Text style={styles.conversationIdText}>
          conversation id: {id}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  conversationIdText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

