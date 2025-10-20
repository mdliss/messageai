# System Patterns & Architecture Decisions

## Core Architecture Patterns

### 1. Service Layer Pattern

**principle:** all firebase interactions go through service layer  
**benefit:** single source of truth, easy to test, clear separation of concerns

**structure:**
```
src/services/
  ├── firebase.ts      # initialization, exports firebase instances
  ├── auth.ts          # authentication crud operations
  ├── firestore.ts     # message/conversation crud + listeners
  ├── rtdb.ts          # typing indicators + presence (todo)
  ├── storage.ts       # image upload/download (todo)
  └── notifications.ts # fcm setup (todo)
```

**example pattern:**
```typescript
// service function
export async function createConversation(
  currentUserId: string,
  memberIds: string[],
  isGroup: boolean,
  title: string | null
): Promise<Conversation> {
  console.log(`[${new Date().toISOString()}] creating conversation...`);
  
  const conversationRef = collection(firestore, 'conversations');
  const newConversation = {
    isGroup,
    title,
    memberIds: [currentUserId, ...memberIds],
    createdBy: currentUserId,
    createdAt: serverTimestamp(),
    lastMessage: null,
    lastMessageAt: serverTimestamp()
  };
  
  const docRef = await addDoc(conversationRef, newConversation);
  return { cid: docRef.id, ...newConversation };
}
```

---

### 2. Custom Hooks Pattern

**principle:** encapsulate data fetching and subscriptions in custom hooks  
**benefit:** reusable logic, automatic cleanup, consistent api

**structure:**
```
src/hooks/
  ├── useAuth.ts           # access auth context
  ├── useConversations.ts  # subscribe to conversation list
  ├── useMessages.ts       # subscribe to messages in conversation (todo)
  ├── useTyping.ts         # typing indicators (todo)
  ├── usePresence.ts       # online/offline status (todo)
  └── useAIInsights.ts     # ai features (todo)
```

**example pattern:**
```typescript
export function useConversations() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    console.log(`[${new Date().toISOString()}] subscribing to conversations...`);
    
    const unsubscribe = subscribeToConversations(
      currentUser.uid,
      (fetchedConversations) => {
        setConversations(fetchedConversations);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log(`[${new Date().toISOString()}] unsubscribing from conversations`);
      unsubscribe();
    };
  }, [currentUser]);

  return { conversations, loading, error };
}
```

---

### 3. Context for Global State

**principle:** use react context sparingly, only for truly global state  
**benefit:** avoid prop drilling, clear data flow

**current contexts:**
- **AuthContext:** currentUser, userProfile, loading, auth methods
  - wraps entire app in app/_layout.tsx
  - provides auth state to all screens via useAuth hook

**anti-pattern to avoid:**
- don't put everything in context
- use local state when possible
- prefer custom hooks for data fetching

---

### 4. Optimistic UI Pattern

**principle:** update ui instantly from local cache, sync to server in background  
**benefit:** feels instant (<100ms), handles offline automatically

**how it works:**
```typescript
// 1. user sends message
await sendMessage(conversationId, messageText);

// 2. firestore writes to local cache first (instant)
// 3. ui updates from cache via onsnapshot listener
// 4. firestore syncs to server in background
// 5. listener fires again when server confirms
```

**implementation:**
```typescript
// send message function
export async function sendMessage(
  conversationId: string,
  message: Omit<Message, 'mid' | 'createdAt'>
): Promise<void> {
  const messagesRef = collection(
    firestore,
    `conversations/${conversationId}/messages`
  );
  
  await addDoc(messagesRef, {
    ...message,
    createdAt: serverTimestamp(),
    status: 'sent'
  });
  
  // message appears in ui instantly from local cache
  // even if offline - will sync when reconnected
}

// listener in hook
useEffect(() => {
  const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        // fired twice: once from cache (instant), once from server (confirmed)
        addMessageToUI(change.doc.data());
      }
    });
  });
  
  return () => unsubscribe();
}, []);
```

---

### 5. Read Receipt Pattern (Client-Side Computation)

**principle:** compute read status client-side from lastSeenAt timestamp  
**benefit:** no per-message writes, massive cost savings

**anti-pattern (expensive):**
```typescript
// DON'T DO THIS
{
  messageId: "msg123",
  readBy: ["user1", "user2", "user3"]  // N writes per message
}
```

**correct pattern (cheap):**
```typescript
// member document (one write per conversation view)
/conversations/{cid}/members/{uid}
{
  uid: "user123",
  lastSeenAt: Timestamp  // updated when user opens conversation
}

// compute client-side
const isRead = member.lastSeenAt >= message.createdAt;
```

**implementation:**
```typescript
// update when user opens conversation
await updateLastSeenAt(conversationId, currentUser.uid);

// compute read status for each message
messages.forEach(message => {
  const isRead = members.every(member => 
    member.lastSeenAt >= message.createdAt
  );
  
  // show appropriate icon
  message.icon = isRead ? '✓✓' : '✓';  // blue if read
});
```

---

### 6. Real-Time Database for Ephemeral Data

**principle:** use rtdb for high-frequency, ephemeral data  
**benefit:** cheaper, faster, automatic cleanup

**use rtdb for:**
- typing indicators (changes every keystroke)
- online/offline presence (changes on app lifecycle)

**use firestore for:**
- messages (persistent, need history)
- conversations (persistent, need queries)
- user profiles (persistent, need to fetch)

**typing indicator pattern:**
```typescript
// write on input change (debounced 300ms)
await set(ref(rtdb, `typing/${conversationId}/${userId}`), true);

// auto-cleanup on disconnect
onDisconnect(ref(rtdb, `typing/${conversationId}/${userId}`)).remove();

// listen for changes
onValue(ref(rtdb, `typing/${conversationId}`), (snapshot) => {
  const typingUsers = Object.keys(snapshot.val() || {});
  showTypingIndicator(typingUsers);
});
```

---

### 7. Firestore Offline Persistence

**principle:** trust firestore offline persistence, don't build custom sync  
**benefit:** less code, fewer bugs, automatic conflict resolution

**what firestore handles:**
- caches all query results locally
- queues writes when offline
- syncs automatically on reconnect
- resolves conflicts (last-write-wins)
- handles retry logic

**setup (one line):**
```typescript
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true  // for react native
});

enableIndexedDbPersistence(db);
```

---

### 8. Comprehensive Logging Pattern

**principle:** log everything with timestamps for debugging  
**benefit:** easy to trace bugs, understand flow

**pattern:**
```typescript
export async function createConversation(...) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] creating conversation with members:`, memberIds);
  
  try {
    const docRef = await addDoc(conversationRef, data);
    console.log(`[${new Date().toISOString()}] conversation created:`, docRef.id);
    return docRef;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] error creating conversation:`, error);
    throw error;
  }
}
```

---

### 9. Error Handling Pattern

**principle:** catch errors, show user-friendly messages, log details  
**benefit:** better ux, easier debugging

**pattern:**
```typescript
try {
  await signInWithEmail(email, password);
} catch (error: any) {
  let message = 'failed to sign in';
  
  // map firebase error codes to user-friendly messages
  switch (error.code) {
    case 'auth/user-not-found':
      message = 'no account found with this email';
      break;
    case 'auth/wrong-password':
      message = 'incorrect password';
      break;
    case 'auth/invalid-email':
      message = 'invalid email address';
      break;
    case 'auth/too-many-requests':
      message = 'too many failed attempts. please try again later';
      break;
    default:
      message = error.message;
  }
  
  console.error(`[${new Date().toISOString()}] sign in error:`, error);
  Alert.alert('error', message);
}
```

---

### 10. Protected Route Pattern

**principle:** redirect unauthenticated users to login, authenticated to home  
**benefit:** secure, seamless navigation

**implementation:**
```typescript
export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!currentUser && !inAuthGroup) {
      // redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (currentUser && inAuthGroup) {
      // redirect to home if authenticated
      router.replace('/(tabs)');
    }
  }, [currentUser, loading, segments]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return <Stack />;
}
```

---

## Architectural Decisions

### Why Expo Router over React Navigation?
- **file-based routing:** simpler mental model
- **automatic deep linking:** works out of the box
- **type-safe routes:** typescript support
- **less boilerplate:** no manual route config

### Why React Native Paper?
- **material design:** follows platform conventions
- **theming:** consistent styling across app
- **accessibility:** built-in a11y support
- **components:** buttons, cards, lists out of box

### Why Firebase over custom backend?
- **speed:** mvp in days, not weeks
- **offline:** built-in offline persistence
- **real-time:** onsnapshot listeners
- **auth:** email + social login included
- **scaling:** handles growth automatically
- **cost:** free tier generous for mvp

### Why TypeScript strict mode?
- **fewer bugs:** catch errors at compile time
- **better dx:** autocomplete and intellisense
- **self-documenting:** types are documentation
- **refactoring:** safe to change code

---

## Anti-Patterns to Avoid

### ❌ don't build custom sync queue
firestore offline persistence handles this automatically

### ❌ don't use firestore for typing indicators
use rtdb instead - cheaper and faster for ephemeral data

### ❌ don't write readBy arrays on messages
compute read status client-side from lastSeenAt

### ❌ don't put everything in context
use local state when possible, custom hooks for data

### ❌ don't guess firebase errors
map error codes to user-friendly messages

### ❌ don't forget cleanup
always unsubscribe listeners on unmount

### ❌ don't use any types
typescript strict mode - type everything properly

### ❌ don't create duplicate files
search codebase first, edit existing files

---

## Performance Optimizations

### query scoping
```typescript
// limit results
.limit(50)

// pagination
.startAfter(lastDoc)

// only fetch what you need
.select('displayName', 'photoURL')
```

### flatlist optimization
```typescript
<FlatList
  data={messages}
  windowSize={21}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
/>
```

### image optimization
```typescript
// compress before upload
{
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.8,  // 80% quality
  maxWidth: 1920
}
```

---

## Security Considerations

### firestore rules (todo: pr #10)
- only conversation members can read/write
- validate message schema on write
- prevent message editing/deletion

### storage rules (todo: pr #10)
- only conversation members can upload/download
- validate image type and size (<10mb)

### rtdb rules (todo: pr #10)
- users can only write their own typing/presence state
- everyone can read (for indicators)

