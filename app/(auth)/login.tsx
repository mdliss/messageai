/**
 * login screen
 * allows users to sign in with email/password or google
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

export default function LoginScreen() {
  const { signIn, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  console.log('[login] timestamp:', new Date().toISOString(), '- login screen rendered');

  /**
   * handle email/password signin
   */
  const handleSignIn = async () => {
    console.log('[login] timestamp:', new Date().toISOString(), '- signin button pressed');
    console.log('[login] email:', email);

    // validate inputs
    if (!email.trim()) {
      Alert.alert('validation error', 'please enter your email');
      return;
    }

    if (!password) {
      Alert.alert('validation error', 'please enter your password');
      return;
    }

    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      console.log('[login] timestamp:', new Date().toISOString(), '- signin successful, navigating to home');
      // navigation handled by auth state change in app/_layout.tsx
    } catch (error: any) {
      console.error('[login] timestamp:', new Date().toISOString(), '- signin error:', error);
      
      // show user friendly error messages
      let errorMessage = 'failed to sign in. please try again.';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'invalid email or password. please check your credentials.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'no account found with this email. please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'incorrect password. please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'too many failed login attempts. please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'network error. please check your internet connection.';
      }
      
      Alert.alert('signin failed', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * handle google signin
   */
  const handleGoogleSignIn = async () => {
    console.log('[login] timestamp:', new Date().toISOString(), '- google signin button pressed');
    setSubmitting(true);

    try {
      await signInWithGoogle();
      console.log('[login] timestamp:', new Date().toISOString(), '- google signin successful');
      // navigation handled by auth state change
    } catch (error: any) {
      console.error('[login] timestamp:', new Date().toISOString(), '- google signin error:', error);
      
      let errorMessage = 'failed to sign in with google. please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'signin cancelled. please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'network error. please check your internet connection.';
      }
      
      Alert.alert('google signin failed', errorMessage);
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
          <Text style={styles.title}>welcome back</Text>
          <Text style={styles.subtitle}>sign in to continue</Text>
        </View>

        <View style={styles.formContainer}>
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
              placeholder="enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              editable={!submitting && !loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.signInButton, (submitting || loading) && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={submitting || loading}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signInButtonText}>sign in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={[styles.googleButton, (submitting || loading) && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={submitting || loading}
          >
            <Text style={styles.googleButtonText}>sign in with google</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>dont have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity disabled={submitting || loading}>
                <Text style={styles.registerLink}>sign up</Text>
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
  signInButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    height: 50,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

