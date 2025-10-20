import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, AuthContext } from '@/src/context/AuthContext';
import { useContext } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * protected route logic
 * redirects to login if not authenticated
 * redirects to home if authenticated and on auth screens
 */
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const authContext = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  console.log('[rootlayout] timestamp:', new Date().toISOString(), '- root layout nav rendered');
  console.log('[rootlayout] auth loading:', authContext?.loading);
  console.log('[rootlayout] current user:', !!authContext?.currentUser);
  console.log('[rootlayout] segments:', segments);

  useEffect(() => {
    if (!authContext) {
      console.error('[rootlayout] auth context is undefined');
      return;
    }

    if (authContext.loading) {
      console.log('[rootlayout] timestamp:', new Date().toISOString(), '- auth still loading, waiting...');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const isAuthenticated = !!authContext.currentUser;

    console.log('[rootlayout] timestamp:', new Date().toISOString(), '- checking navigation');
    console.log('[rootlayout] in auth group:', inAuthGroup);
    console.log('[rootlayout] is authenticated:', isAuthenticated);

    if (!isAuthenticated && !inAuthGroup) {
      // redirect to login if not authenticated and not on auth screens
      console.log('[rootlayout] timestamp:', new Date().toISOString(), '- redirecting to login');
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // redirect to home if authenticated and on auth screens
      console.log('[rootlayout] timestamp:', new Date().toISOString(), '- redirecting to home');
      router.replace('/(tabs)');
    }
  }, [authContext?.currentUser, authContext?.loading, segments]);

  // show loading spinner while checking auth state
  if (authContext?.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

/**
 * root layout with auth provider
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
