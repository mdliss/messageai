/**
 * typescript type definitions for messageai
 */

import { User as FirebaseUser } from 'firebase/auth';

// user document stored in firestore /users/{uid}
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: string;
  lastActiveAt: string;
  fcmTokens: string[];
}

// auth context value type
export interface AuthContextValue {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// message types for firestore
export interface Message {
  mid: string;
  senderId: string;
  type: 'text' | 'image' | 'ai';
  body: string;
  mediaRef: string | null;
  createdAt: string;
  status: 'sent' | 'delivered';
  priority: boolean;
}

// conversation types for firestore
export interface Conversation {
  cid: string;
  isGroup: boolean;
  title: string | null;
  memberIds: string[];
  createdBy: string;
  createdAt: string;
  lastMessage: {
    text: string;
    senderId: string;
    type: 'text' | 'image' | 'ai';
    createdAt: string;
  } | null;
  lastMessageAt: string | null;
}

// conversation member metadata
export interface ConversationMember {
  uid: string;
  joinedAt: string;
  lastSeenAt: string;
  muted: boolean;
}

// ai insight types
export interface AIInsight {
  iid: string;
  type: 'summary' | 'action_items' | 'decision' | 'priority' | 'suggestion';
  content: string;
  metadata: Record<string, any>;
  messageIds: string[];
  triggeredBy: string;
  createdAt: string;
}

