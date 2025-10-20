/**
 * register screen
 * allows users to create new account with email/password
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';

export default function RegisterScreen() {
  const { signUp, loading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  console.log('[register] timestamp:', new Date().toISOString(), '- register screen rendered');

  /**
   * validate email format
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * handle registration
   */
  const handleSignUp = async () => {
    console.log('[register] timestamp:', new Date().toISOString(), '- signup button pressed');
    console.log('[register] email:', email);
    console.log('[register] display name provided:', !!displayName.trim());

    // validate display name (optional but if provided must not be empty)
    if (displayName.trim() && displayName.trim().length < 2) {
      Alert.alert('validation error', 'display name must be at least 2 characters');
      return;
    }

    // validate email
    if (!email.trim()) {
      Alert.alert('validation error', 'please enter your email');
      return;
    }

    if (!isValidEmail(email.trim())) {
      Alert.alert('validation error', 'please enter a valid email address');
      return;
    }

    // validate password
    if (!password) {
      Alert.alert('validation error', 'please enter a password');
      return;
    }

    if (password.length < 8) {
      Alert.alert('validation error', 'password must be at least 8 characters long');
      return;
    }

    // validate password confirmation
    if (password !== confirmPassword) {
      Alert.alert('validation error', 'passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      await signUp(
        email.trim(),
        password,
        displayName.trim() || undefined // pass undefined if display name is empty
      );
      console.log('[register] timestamp:', new Date().toISOString(), '- signup successful');
      // navigation handled by auth state change in app/_layout.tsx
    } catch (error: any) {
      console.error('[register] timestamp:', new Date().toISOString(), '- signup error:', error);
      
      // show user friendly error messages
      let errorMessage = 'failed to create account. please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'this email is already registered. please sign in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'invalid email address. please check and try again.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'password is too weak. please use a stronger password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'network error. please check your internet connection.';
      }
      
      Alert.alert('signup failed', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>create account</Text>
          <Text style={styles.subtitle}>sign up to get started</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>display name (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="your name"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoComplete="name"
              editable={!submitting && !loading}
            />
            <Text style={styles.helperText}>
              if not provided, we will use your email prefix
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!submitting && !loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>password</Text>
            <TextInput
              style={styles.input}
              placeholder="at least 8 characters"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!submitting && !loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="re enter your password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              editable={!submitting && !loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.signUpButton, (submitting || loading) && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={submitting || loading}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpButtonText}>sign up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity disabled={submitting || loading}>
                <Text style={styles.loginLink}>sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  signUpButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

