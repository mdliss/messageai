/**
 * firebase initialization and configuration
 * 
 * this file sets up firebase services with offline persistence enabled
 * for seamless offline/online functionality
 * 
 * timestamp: initialization
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, enableIndexedDbPersistence, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// timestamp: loading firebase config from environment variables
console.log('[firebase] timestamp:', new Date().toISOString(), '- loading firebase configuration');
console.log('[firebase] api key exists:', !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY);
console.log('[firebase] project id:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

// timestamp: initializing firebase app (singleton pattern to prevent multiple initializations)
console.log('[firebase] timestamp:', new Date().toISOString(), '- initializing firebase app');

let app;
let auth;
let db;
let rtdb;
let storage;

try {
  // check if firebase app is already initialized
  if (getApps().length === 0) {
    console.log('[firebase] timestamp:', new Date().toISOString(), '- creating new firebase app instance');
    app = initializeApp(firebaseConfig);
  } else {
    console.log('[firebase] timestamp:', new Date().toISOString(), '- using existing firebase app instance');
    app = getApp();
  }

  // timestamp: initializing firebase auth with react native persistence
  console.log('[firebase] timestamp:', new Date().toISOString(), '- initializing firebase auth with asyncstorage persistence');
  
  // use initializeAuth for React Native with AsyncStorage persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // if auth already initialized, get existing instance
    console.log('[firebase] timestamp:', new Date().toISOString(), '- auth already initialized, using existing instance');
    auth = getAuth(app);
  }

  // timestamp: initializing firestore with offline persistence
  console.log('[firebase] timestamp:', new Date().toISOString(), '- initializing firestore with offline persistence');
  
  if (Platform.OS === 'web') {
    // web platform: use indexed db persistence
    console.log('[firebase] timestamp:', new Date().toISOString(), '- web platform detected, using indexeddb persistence');
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } else {
    // react native: use experimental force long polling for better mobile support
    console.log('[firebase] timestamp:', new Date().toISOString(), '- react native platform detected, using long polling');
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  }

  console.log('[firebase] timestamp:', new Date().toISOString(), '- firestore offline persistence enabled successfully');

  // timestamp: initializing realtime database for typing indicators and presence
  console.log('[firebase] timestamp:', new Date().toISOString(), '- initializing realtime database for typing and presence');
  rtdb = getDatabase(app);
  console.log('[firebase] timestamp:', new Date().toISOString(), '- realtime database initialized successfully');

  // timestamp: initializing cloud storage for image uploads
  console.log('[firebase] timestamp:', new Date().toISOString(), '- initializing cloud storage for images');
  storage = getStorage(app);
  console.log('[firebase] timestamp:', new Date().toISOString(), '- cloud storage initialized successfully');

  // timestamp: all firebase services initialized successfully
  console.log('[firebase] timestamp:', new Date().toISOString(), '- all firebase services initialized successfully');
  console.log('[firebase] auth:', !!auth);
  console.log('[firebase] firestore:', !!db);
  console.log('[firebase] realtime database:', !!rtdb);
  console.log('[firebase] storage:', !!storage);

} catch (error) {
  console.error('[firebase] timestamp:', new Date().toISOString(), '- error initializing firebase:');
  console.error('[firebase] error code:', error.code);
  console.error('[firebase] error message:', error.message);
  console.error('[firebase] full error:', error);
  throw error;
}

// export firebase services for use throughout the app
export { auth, db, rtdb, storage };

