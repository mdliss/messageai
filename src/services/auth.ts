/**
 * firebase authentication service
 * handles user signup, signin, signout, and profile management
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { User } from '../types';

/**
 * extract display name from email (part before @)
 * example: alice@example.com -> alice
 */
function getDisplayNameFromEmail(email: string): string {
  const namePart = email.split('@')[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

/**
 * create user profile document in firestore
 * called after successful signup or first time google signin
 */
async function createUserProfile(
  user: FirebaseUser,
  displayName?: string
): Promise<void> {
  console.log('[auth] timestamp:', new Date().toISOString(), '- creating user profile in firestore');
  console.log('[auth] user id:', user.uid);
  console.log('[auth] email:', user.email);
  console.log('[auth] display name:', displayName || user.displayName || getDisplayNameFromEmail(user.email!));

  const userProfile: User = {
    uid: user.uid,
    email: user.email!,
    displayName: displayName || user.displayName || getDisplayNameFromEmail(user.email!),
    photoURL: user.photoURL || null,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    fcmTokens: [],
  };

  try {
    await setDoc(doc(firestore, 'users', user.uid), userProfile);
    console.log('[auth] timestamp:', new Date().toISOString(), '- user profile created successfully');
  } catch (error) {
    console.error('[auth] timestamp:', new Date().toISOString(), '- error creating user profile:', error);
    throw error;
  }
}

/**
 * update user's last active timestamp
 * called on app open or significant user action
 */
export async function updateLastActive(uid: string): Promise<void> {
  console.log('[auth] timestamp:', new Date().toISOString(), '- updating last active for user:', uid);
  
  try {
    await updateDoc(doc(firestore, 'users', uid), {
      lastActiveAt: new Date().toISOString(),
    });
    console.log('[auth] timestamp:', new Date().toISOString(), '- last active updated successfully');
  } catch (error) {
    console.error('[auth] timestamp:', new Date().toISOString(), '- error updating last active:', error);
  }
}

/**
 * sign up with email and password
 * creates firebase auth user and firestore user profile
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<FirebaseUser> {
  console.log('[auth] timestamp:', new Date().toISOString(), '- signing up with email:', email);
  console.log('[auth] display name provided:', !!displayName);

  try {
    // create firebase auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('[auth] timestamp:', new Date().toISOString(), '- firebase auth user created:', user.uid);

    // update firebase auth profile with display name
    const finalDisplayName = displayName || getDisplayNameFromEmail(email);
    await firebaseUpdateProfile(user, {
      displayName: finalDisplayName,
    });
    
    console.log('[auth] timestamp:', new Date().toISOString(), '- firebase auth profile updated with display name');

    // create firestore user profile document
    await createUserProfile(user, finalDisplayName);
    
    console.log('[auth] timestamp:', new Date().toISOString(), '- signup completed successfully');
    
    return user;
  } catch (error: any) {
    console.error('[auth] timestamp:', new Date().toISOString(), '- signup error:', error.code, error.message);
    throw error;
  }
}

/**
 * sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  console.log('[auth] timestamp:', new Date().toISOString(), '- signing in with email:', email);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('[auth] timestamp:', new Date().toISOString(), '- signin successful:', user.uid);
    
    // update last active timestamp
    await updateLastActive(user.uid);
    
    return user;
  } catch (error: any) {
    console.error('[auth] timestamp:', new Date().toISOString(), '- signin error:', error.code, error.message);
    throw error;
  }
}

/**
 * sign in with google
 * creates user profile if first time signin
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  console.log('[auth] timestamp:', new Date().toISOString(), '- initiating google signin');

  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    console.log('[auth] timestamp:', new Date().toISOString(), '- google signin successful:', user.uid);
    
    // check if this is first time signin (user profile doesn't exist)
    // for now, we'll always create/update the profile
    await createUserProfile(user, user.displayName || undefined);
    
    return user;
  } catch (error: any) {
    console.error('[auth] timestamp:', new Date().toISOString(), '- google signin error:', error.code, error.message);
    throw error;
  }
}

/**
 * sign out current user
 */
export async function signOut(): Promise<void> {
  console.log('[auth] timestamp:', new Date().toISOString(), '- signing out');

  try {
    await firebaseSignOut(auth);
    console.log('[auth] timestamp:', new Date().toISOString(), '- signout successful');
  } catch (error: any) {
    console.error('[auth] timestamp:', new Date().toISOString(), '- signout error:', error.code, error.message);
    throw error;
  }
}

/**
 * update user profile (display name and photo url)
 */
export async function updateProfile(
  displayName?: string,
  photoURL?: string
): Promise<void> {
  console.log('[auth] timestamp:', new Date().toISOString(), '- updating profile');
  console.log('[auth] new display name:', displayName);
  console.log('[auth] new photo url:', photoURL);

  const user = auth.currentUser;
  if (!user) {
    throw new Error('no user is currently signed in');
  }

  try {
    // update firebase auth profile
    const updates: { displayName?: string; photoURL?: string } = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (photoURL !== undefined) updates.photoURL = photoURL;
    
    await firebaseUpdateProfile(user, updates);
    console.log('[auth] timestamp:', new Date().toISOString(), '- firebase auth profile updated');

    // update firestore user profile
    const firestoreUpdates: Partial<User> = {};
    if (displayName !== undefined) firestoreUpdates.displayName = displayName;
    if (photoURL !== undefined) firestoreUpdates.photoURL = photoURL;
    
    await updateDoc(doc(firestore, 'users', user.uid), firestoreUpdates);
    console.log('[auth] timestamp:', new Date().toISOString(), '- firestore profile updated');
    
    console.log('[auth] timestamp:', new Date().toISOString(), '- profile update completed successfully');
  } catch (error: any) {
    console.error('[auth] timestamp:', new Date().toISOString(), '- profile update error:', error.code, error.message);
    throw error;
  }
}

