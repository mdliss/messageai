/**
 * useAuth hook
 * provides access to auth context
 * throws error if used outside AuthProvider
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AuthContextValue } from '../types';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider. wrap your app with <AuthProvider>');
  }

  return context;
}

