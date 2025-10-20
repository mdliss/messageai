/**
 * authentication context provider
 * manages auth state and provides auth functions throughout the app
 */

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';
import { User, AuthContextValue } from '../types';
import * as authService from '../services/auth';

// create auth context with default undefined value
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * auth provider component
 * wraps app and provides auth state to all children
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  console.log('[authcontext] timestamp:', new Date().toISOString(), '- auth provider mounted');

  useEffect(() => {
    console.log('[authcontext] timestamp:', new Date().toISOString(), '- setting up onAuthStateChanged listener');

    // subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[authcontext] timestamp:', new Date().toISOString(), '- auth state changed');
      console.log('[authcontext] user:', user ? user.uid : 'null');

      setCurrentUser(user);

      // fetch user profile from firestore if user exists
      if (user) {
        try {
          console.log('[authcontext] timestamp:', new Date().toISOString(), '- fetching user profile from firestore');
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const profile = userDocSnap.data() as User;
            setUserProfile(profile);
            console.log('[authcontext] timestamp:', new Date().toISOString(), '- user profile loaded:', profile.displayName);
          } else {
            console.warn('[authcontext] timestamp:', new Date().toISOString(), '- user profile not found in firestore');
            setUserProfile(null);
          }
        } catch (error) {
          console.error('[authcontext] timestamp:', new Date().toISOString(), '- error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    // cleanup subscription on unmount
    return () => {
      console.log('[authcontext] timestamp:', new Date().toISOString(), '- cleaning up onAuthStateChanged listener');
      unsubscribe();
    };
  }, []);

  /**
   * sign up with email and password
   */
  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    console.log('[authcontext] timestamp:', new Date().toISOString(), '- signup requested');
    setLoading(true);
    try {
      await authService.signUpWithEmail(email, password, displayName);
      console.log('[authcontext] timestamp:', new Date().toISOString(), '- signup completed');
    } catch (error) {
      console.error('[authcontext] timestamp:', new Date().toISOString(), '- signup failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('[authcontext] timestamp:', new Date().toISOString(), '- signin requested');
    setLoading(true);
    try {
      await authService.signInWithEmail(email, password);
      console.log('[authcontext] timestamp:', new Date().toISOString(), '- signin completed');
    } catch (error) {
      console.error('[authcontext] timestamp:', new Date().toISOString(), '- signin failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * sign in with google
   */
  const signInWithGoogle = async (): Promise<void> => {
    console.log('[authcontext] timestamp:', new Date().toISOString(), '- google signin requested');
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      console.log('[authcontext] timestamp:', new Date().toISOString(), '- google signin completed');
    } catch (error) {
      console.error('[authcontext] timestamp:', new Date().toISOString(), '- google signin failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * sign out current user
   */
  const signOut = async (): Promise<void> => {
    console.log('[authcontext] timestamp:', new Date().toISOString(), '- signout requested');
    setLoading(true);
    try {
      await authService.signOut();
      console.log('[authcontext] timestamp:', new Date().toISOString(), '- signout completed');
    } catch (error) {
      console.error('[authcontext] timestamp:', new Date().toISOString(), '- signout failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextValue = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

