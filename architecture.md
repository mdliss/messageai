# MessageAI MVP - Architecture Document

**Project**: MessageAI - Real-Time Messaging with AI Features  
**Goal**: Build production-quality messaging infrastructure with intelligent AI capabilities  
**Persona**: Remote Team Professional  
**Timeline**: 7-day sprint with 24-hour MVP checkpoint

---

## System Architecture Diagram

```mermaid
```mermaid
graph TB
    subgraph "Mobile App - React Native + Expo"
        subgraph "Screen Layer"
            AuthScreens[Auth Screens<br/>Login/Register]
            ConvList[Conversations List<br/>Home Screen]
            ChatScreen[Chat Screen<br/>Messages + AI]
            AIAssistant[AI Assistant<br/>Dedicated Chat]
            Profile[Profile Screen]
        end

        subgraph "Components Layer"
            MessageBubble[Message Bubble<br/>Text/Image/Status]
            ConvItem[Conversation Item<br/>Preview/Unread]
            TypingInd[Typing Indicator]
            AIInsight[AI Insight Card<br/>Summaries/Actions]
        end

        subgraph "State Management"
            AuthCtx[Auth Context<br/>User State]
        end

        subgraph "Custom Hooks"
            useMessages[useMessages<br/>Real-time Listener]
            useConversations[useConversations<br/>Conversation List]
            useTyping[useTyping<br/>RTDB Listener]
            usePresence[usePresence<br/>RTDB Listener]
            useAIInsights[useAIInsights<br/>AI Features]
        end

        subgraph "Services Layer"
            AuthSvc[Auth Service<br/>Firebase Auth]
            FirestoreSvc[Firestore Service<br/>CRUD + Listeners]
            RTDBSvc[RTDB Service<br/>Typing + Presence]
            StorageSvc[Storage Service<br/>Image Upload]
            NotifSvc[Notification Service<br/>FCM Setup]
        end
    end

    subgraph "Firebase Backend"
        subgraph "Firebase Services"
            FBAuth[Firebase Auth<br/>Email/Password/Google]
            FCM[Cloud Messaging<br/>Push Notifications]
        end

        subgraph "Cloud Firestore"
            Users[(users/{uid}<br/>User Profiles)]
            Conversations[(conversations/{cid}<br/>Metadata)]
            Members[(conversations/{cid}/members/{uid}<br/>lastSeenAt)]
            Messages[(conversations/{cid}/messages/{mid}<br/>Message History)]
            Insights[(conversations/{cid}/insights/{iid}<br/>AI-Generated)]
        end

        subgraph "Realtime Database"
            Typing[(typing/{cid}/{uid}<br/>Ephemeral Boolean)]
            Presence[(presence/{uid}<br/>Online Status)]
        end

        subgraph "Cloud Storage"
            Media[(media/{cid}/{mid}/filename<br/>Images)]
        end

        subgraph "Cloud Functions"
            OnMessage[onMessageCreated<br/>Priority Detection]
            AISummarize[summarizeConversation<br/>Thread Summary]
            AIActions[extractActionItems<br/>Task Extraction]
            AIDecisions[trackDecisions<br/>Decision Logging]
            AIProactive[detectProactive<br/>Scheduling Hints]
            NotifFunc[sendMessageNotification<br/>Push to Offline Users]
        end

        subgraph "AI Integration"
            GPT4[OpenAI GPT-4<br/>LLM Processing]
        end
    end

    %% Screen to Component connections
    AuthScreens --> AuthCtx
    ConvList --> useConversations
    ChatScreen --> useMessages
    ChatScreen --> useTyping
    ChatScreen --> usePresence
    ChatScreen --> useAIInsights
    AIAssistant --> useAIInsights

    %% Component connections
    MessageBubble --> ChatScreen
    ConvItem --> ConvList
    TypingInd --> ChatScreen
    AIInsight --> ChatScreen

    %% Context to Services
    AuthCtx --> AuthSvc

    %% Hooks to Services
    useMessages --> FirestoreSvc
    useConversations --> FirestoreSvc
    useTyping --> RTDBSvc
    usePresence --> RTDBSvc
    useAIInsights --> FirestoreSvc

    %% Services to Firebase
    AuthSvc --> FBAuth
    FirestoreSvc --> Users
    FirestoreSvc --> Conversations
    FirestoreSvc --> Members
    FirestoreSvc --> Messages
    FirestoreSvc --> Insights
    RTDBSvc --> Typing
    RTDBSvc --> Presence
    StorageSvc --> Media
    NotifSvc --> FCM

    %% Real-time sync paths
    Messages -->|Real-time listener<br/>onSnapshot<br/>under 500ms| useMessages
    useMessages -->|Optimistic update<br/>under 100ms| MessageBubble
    
    Typing -->|Real-time listener<br/>onValue<br/>under 100ms| useTyping
    Presence -->|Real-time listener<br/>onValue| usePresence

    %% Cloud Function triggers
    Messages -->|onCreate trigger| OnMessage
    Messages -->|onCreate trigger| NotifFunc
    Messages -->|onCreate trigger| AIProactive
    OnMessage -->|Priority flag| Messages
    NotifFunc -->|Push| FCM

    %% AI function calls
    AISummarize -->|Retrieve last 100 messages| Messages
    AISummarize -->|LLM call| GPT4
    GPT4 -->|Insight| Insights

    AIActions -->|Retrieve messages| Messages
    AIActions -->|LLM call| GPT4

    AIDecisions -->|Pattern match + LLM| Messages
    AIDecisions -->|Store decision| Insights

    AIProactive -->|Pattern match| Messages
    AIProactive -->|Suggestion| Insights

    %% User interactions
    User([Users<br/>Mobile Devices]) -->|Interact| AuthScreens
    User -->|Interact| ConvList
    User -->|Interact| ChatScreen

    %% Styling
    classDef mobile fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef firebase fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef rtdb fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef ai fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef user fill:#fce4ec,stroke:#c2185b,stroke-width:3px

    class AuthScreens,ConvList,ChatScreen,AIAssistant,Profile,MessageBubble,ConvItem,TypingInd,AIInsight,AuthCtx,useMessages,useConversations,useTyping,usePresence,useAIInsights,AuthSvc,FirestoreSvc,RTDBSvc,StorageSvc,NotifSvc mobile
    class FBAuth,FCM,Users,Conversations,Members,Messages,Insights,Media,OnMessage,AISummarize,AIActions,AIDecisions,AIProactive,NotifFunc firebase
    class Typing,Presence rtdb
    class GPT4 ai
    class User user
```
```

---

## Messaging Architecture (MVP)

**Real-Time Sync Strategy:**

- **Optimistic UI:** Messages appear instantly (<100ms) before server confirmation
- **Firestore Offline Persistence:** All data cached locally via IndexedDB (mobile native storage)
- **Firestore listeners:** Real-time updates from other users (<500ms)
- **Automatic sync:** Firestore queues writes when offline, syncs on reconnect
- **No message loss:** Firestore handles retry and conflict resolution automatically

**Offline Handling:**

- **Send while offline:** Firestore queues writes locally
- **Receive while offline:** Messages accumulate in Firestore
- **On reconnect:** Firestore automatically syncs pending writes + fetches missed data
- **Conflict resolution:** Append-only messages (no conflicts possible)

**Why No SQLite:**

- Firestore offline persistence handles 95% of what SQLite would do
- One line of code: `enableIndexedDbPersistence(db)`
- Automatic sync, conflict resolution, and retry logic
- Less code = fewer bugs

**URL Structure:**

- Simple Expo Router file-based navigation
- `/` - Conversations list (authenticated)
- `/conversation/[id]` - Chat screen with messages
- `/ai-assistant` - Dedicated AI chat interface
- `/profile` - User settings

---

## Data Models

### Firestore Collection: `/users/{uid}`

```json
{
  "uid": "user_abc123",
  "email": "alice@example.com",
  "displayName": "Alice Johnson",
  "photoURL": "https://...",
  "createdAt": "2025-01-15T10:00:00Z",
  "lastActiveAt": "2025-01-15T14:30:00Z",
  "fcmTokens": ["token1", "token2"]
}
```

**Notes:**
- `fcmTokens` is array (users can have multiple devices)
- `lastActiveAt` updated on app open/close
- No `isOnline` here (use RTDB presence instead)

---

### Firestore Collection: `/conversations/{cid}`

```json
{
  "cid": "conv_xyz789",
  "isGroup": false,
  "title": null,
  "memberIds": ["user_abc123", "user_def456"],
  "createdBy": "user_abc123",
  "createdAt": "2025-01-15T10:00:00Z",
  
  "lastMessage": {
    "text": "Sounds good!",
    "senderId": "user_abc123",
    "type": "text",
    "createdAt": "2025-01-15T14:30:00Z"
  },
  "lastMessageAt": "2025-01-15T14:30:00Z"
}
```

**Notes:**
- `isGroup`: `true` for 3+ participants
- `title`: Custom group name (null for direct messages)
- `memberIds`: Array for security rules (array-contains queries)
- `lastMessage`: Denormalized for conversation list performance
- No `participantDetails` - resolve from `users/{uid}` at render time

**Group Chat Extension:**

```json
{
  "isGroup": true,
  "title": "Project Alpha Team",
  "groupPhotoURL": "https://...",
  "adminIds": ["user_abc123"]
}
```

---

### Firestore Subcollection: `/conversations/{cid}/members/{uid}`

```json
{
  "uid": "user_abc123",
  "joinedAt": "2025-01-15T10:00:00Z",
  "lastSeenAt": "2025-01-15T14:30:00Z",
  "muted": false
}
```

**Purpose:**
- Track per-user metadata for the conversation
- `lastSeenAt`: Compute read receipts client-side
- `muted`: User-specific notification preferences

**Read Receipt Logic (Client-Side):**
```javascript
// Message is "read" if user's lastSeenAt >= message.createdAt
const isRead = memberData.lastSeenAt >= message.createdAt;
```

**Benefit:** No per-message `readBy[]` writes = massive cost savings

---

### Firestore Subcollection: `/conversations/{cid}/messages/{mid}`

```json
{
  "mid": "msg_123abc",
  "senderId": "user_abc123",
  "type": "text",
  "body": "Can we meet tomorrow at 2pm?",
  "mediaRef": null,
  "createdAt": "2025-01-15T14:30:00Z",
  "status": "delivered",
  "priority": false
}
```

**Message Types:**
- `text`: Regular text message
- `image`: Image with `mediaRef` pointing to Storage
- `ai`: AI-generated insight (inline in chat)

**Status Values:**
- `sent`: Confirmed by server
- `delivered`: At least one recipient online (optional, can compute from presence)

**Notes:**
- No `readBy[]` array (use `members/{uid}.lastSeenAt` instead)
- No `deliveredTo[]` array (optional feature, can add later)
- `priority`: Set by AI Cloud Function for urgent messages

---

### Firestore Subcollection: `/conversations/{cid}/insights/{iid}`

```json
{
  "iid": "insight_abc123",
  "type": "summary",
  "content": "• Team agreed to move launch to Friday\n• Sarah raised API rate limit concerns\n• Decision: Use caching to mitigate",
  "metadata": {
    "bulletPoints": 3,
    "messageCount": 47
  },
  "messageIds": ["msg_1", "msg_47"],
  "triggeredBy": "user_abc123",
  "createdAt": "2025-01-15T15:00:00Z"
}
```

**AI Insight Types:**
- `summary` - Thread summarization (3 bullet points)
- `action_items` - Extracted tasks with owners
- `decision` - Logged team decisions
- `priority` - Flagged important messages (stored in message doc)
- `suggestion` - Proactive assistant recommendations

---

### Realtime Database: `/typing/{cid}/{uid}`

```json
{
  "user_abc123": true
}
```

**Purpose:** High-frequency ephemeral data (cheaper than Firestore)

**Behavior:**
- Write `true` when user starts typing (debounced 300ms)
- Write `false` on blur or 3s inactivity
- Use RTDB `onDisconnect()` to auto-cleanup

**Why RTDB not Firestore:**
- Typing indicators = high-frequency writes
- RTDB: $1/GB vs Firestore: $0.18 per 100k writes
- RTDB has lower latency (<100ms vs 200-500ms)

---

### Realtime Database: `/presence/{uid}`

```json
{
  "user_abc123": {
    "state": "online",
    "lastChanged": 1705334400000
  }
}
```

**Purpose:** Track online/offline status

**Behavior:**
- Set `state: 'online'` on app open
- Use RTDB `onDisconnect()` to set `state: 'offline'` automatically
- Update `lastChanged` timestamp

**Client-Side Display:**
- Green dot if `state === 'online'`
- Gray dot with "last seen" if `state === 'offline'`

---

### Cloud Storage: `/media/{cid}/{mid}/filename`

**Path Structure:**
```
/media/conv_xyz789/msg_123abc/image_1705334400_abc123.jpg
```

**Purpose:** Store uploaded images

**Limits:**
- Max size: 10 MB per image
- Formats: JPEG, PNG, GIF
- Compression: Optional (not MVP-critical)

**Security:** Only conversation members can read/write (Storage Rules)

---

## Firestore Offline Persistence

### Setup (One Line of Code)

```typescript
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // For React Native
});

enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open, persistence only works in one tab');
    } else if (err.code === 'unimplemented') {
      console.log('Browser doesn't support persistence');
    }
  });
```

### What It Does

- **Caches all Firestore data locally** (IndexedDB on web, native on mobile)
- **Queues writes when offline** (automatic retry on reconnect)
- **Syncs on reconnect** (fetches missed updates + sends pending writes)
- **Handles conflicts** (last-write-wins for updates, append-only for messages)

### Optimistic UI Pattern

```typescript
// 1. Write to Firestore (queues locally if offline)
await addDoc(collection(db, `conversations/${cid}/messages`), {
  senderId: currentUser.uid,
  body: messageText,
  type: 'text',
  createdAt: serverTimestamp(),
  status: 'sent'
});

// 2. Firestore listener automatically updates UI (even from cache)
onSnapshot(query(messagesRef), (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      // Message appears in UI instantly (from cache or server)
      addMessageToUI(change.doc.data());
    }
  });
});
```

**Benefits:**
- No manual sync queue needed
- No SQLite complexity
- Firestore handles everything

---

## Proposed Tech Stack

### Frontend (Mobile)
- **Framework:** React Native with Expo (SDK 51+)
- **Navigation:** Expo Router (file-based routing)
- **State Management:** React Context + useReducer
- **UI Components:** React Native Paper or custom components
- **Real-time:** Firebase SDK (Firestore listeners + RTDB)

### Backend
- **Database:** Cloud Firestore (messages, users, conversations)
- **Realtime DB:** Firebase Realtime Database (typing, presence)
- **Authentication:** Firebase Auth (email/password + Google)
- **Functions:** Cloud Functions (Node.js 18)
- **Storage:** Cloud Storage (images)
- **Push Notifications:** Firebase Cloud Messaging (FCM)

### AI Layer
- **LLM Provider:** OpenAI GPT-4
- **Agent Framework:** Direct API calls (no LangChain/Vercel AI SDK needed for MVP)
- **Function Calling:** Tool use for conversation retrieval

### Deployment
- **Testing:** Expo Go (quick iterations)
- **Production:** TestFlight (iOS) or APK (Android)

**Why This Stack:**
- You already have Firestore set up ✅
- React Native is your experience ✅
- Firebase handles offline, real-time, auth out-of-box ✅
- Cloud Functions keep API keys secure ✅

---

## Project File Structure

```
messageai/
├── app/                          # Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── index.tsx            # Conversations list
│   │   ├── ai-assistant.tsx     # AI chat
│   │   └── profile.tsx
│   ├── conversation/
│   │   └── [id].tsx             # Chat screen
│   └── _layout.tsx
│
├── src/
│   ├── components/
│   │   ├── MessageBubble.tsx
│   │   ├── ConversationItem.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── AIInsightCard.tsx
│   │   └── PresenceIndicator.tsx
│   │
│   ├── services/
│   │   ├── firebase.ts          # Firebase init + offline persistence
│   │   ├── auth.ts              # Auth operations
│   │   ├── firestore.ts         # Message CRUD + listeners
│   │   ├── rtdb.ts              # Typing + presence (RTDB)
│   │   ├── storage.ts           # Image upload
│   │   └── notifications.ts     # FCM setup
│   │
│   ├── hooks/
│   │   ├── useMessages.ts       # Real-time message listener
│   │   ├── useConversations.ts  # Conversation list
│   │   ├── useTyping.ts         # RTDB typing listener
│   │   ├── usePresence.ts       # RTDB presence listener
│   │   └── useAIInsights.ts     # AI features
│   │
│   ├── context/
│   │   └── AuthContext.tsx
│   │
│   ├── utils/
│   │   ├── dateHelpers.ts
│   │   └── constants.ts
│   │
│   └── types/
│       └── index.ts             # TypeScript interfaces
│
├── functions/                    # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── ai/
│   │   │   ├── summarize.ts
│   │   │   ├── actionItems.ts
│   │   │   ├── priority.ts
│   │   │   ├── decisions.ts
│   │   │   └── proactive.ts
│   │   └── notifications/
│   │       └── sendMessage.ts
│   ├── package.json
│   └── tsconfig.json
│
├── assets/                       # Images, fonts
├── .env
├── .env.example
├── .gitignore
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
├── firebase.json
├── firestore.rules
├── storage.rules
├── database.rules.json           # RTDB rules
├── .firebaserc
└── README.md
```

---

## Real-Time Synchronization Strategy

### Message Send Flow (Optimistic UI)

1. **User taps "Send":**
   - Call `addDoc()` to Firestore
   - Firestore queues write locally if offline
   - Returns immediately (doesn't wait for server)

2. **Firestore listener fires:**
   - `onSnapshot` detects new document (from local cache first)
   - Message appears in UI instantly (<100ms)
   - Shows "clock" icon while pending

3. **Server confirms:**
   - Firestore syncs write to server (when online)
   - Listener fires again with server timestamp
   - Update UI: clock icon → checkmark

4. **Recipients receive:**
   - Their Firestore listeners fire
   - Message appears in their UI
   - Update conversation's `lastMessage`

5. **Read receipts:**
   - When user opens conversation: Update `members/{uid}.lastSeenAt`
   - Sender computes read status client-side
   - Update UI: single checkmark → blue double checkmark

**No Manual Sync Queue Needed:** Firestore handles everything automatically.

---

## Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function authed() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return authed() && request.auth.uid == uid;
    }
    
    function isMember(cid) {
      return authed() && 
             request.auth.uid in get(/databases/$(database)/documents/conversations/$(cid)).data.memberIds;
    }
    
    function validMessage() {
      let data = request.resource.data;
      return data.senderId == request.auth.uid &&
             data.type in ['text', 'image', 'ai'] &&
             data.body is string &&
             data.createdAt is timestamp;
    }
    
    // Users collection
    match /users/{uid} {
      allow read: if authed();
      allow create, update: if isOwner(uid);
      allow delete: if false;
    }
    
    // Conversations collection
    match /conversations/{cid} {
      allow read: if authed() && isMember(cid);
      allow create: if authed() && 
                    request.auth.uid in request.resource.data.memberIds &&
                    request.resource.data.createdBy == request.auth.uid;
      allow update: if authed() && isMember(cid);
      allow delete: if false; // Conversations can't be deleted in MVP
      
      // Members subcollection
      match /members/{uid} {
        allow read: if authed() && isMember(cid);
        allow write: if authed() && isMember(cid) && isOwner(uid);
      }
      
      // Messages subcollection
      match /messages/{mid} {
        allow read: if authed() && isMember(cid);
        allow create: if authed() && isMember(cid) && validMessage();
        allow update: if false; // Messages are immutable (can add priority flag via CF)
        allow delete: if false; // No message deletion in MVP
      }
      
      // AI Insights subcollection
      match /insights/{iid} {
        allow read: if authed() && isMember(cid);
        allow write: if false; // Only Cloud Functions can write
      }
    }
  }
}
```

---

### Cloud Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function authed() {
      return request.auth != null;
    }
    
    function isMember(cid) {
      return request.auth.uid in 
        firestore.get(/databases/(default)/documents/conversations/$(cid)).data.memberIds;
    }
    
    function validImage() {
      return request.resource.size < 10 * 1024 * 1024 && // 10 MB limit
             request.resource.contentType.matches('image/.*');
    }
    
    match /media/{cid}/{mid}/{filename} {
      allow read: if authed() && isMember(cid);
      allow write: if authed() && isMember(cid) && validImage();
      allow delete: if false; // No deletion in MVP
    }
  }
}
```

---

### Realtime Database Security Rules

```json
{
  "rules": {
    "typing": {
      "$cid": {
        "$uid": {
          ".read": "auth != null",
          ".write": "auth != null && auth.uid == $uid"
        }
      }
    },
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

---

## Performance Targets

- **Message send latency:** <100ms (optimistic UI from cache)
- **Message delivery:** <500ms (online recipients via listener)
- **App cold start:** <2 seconds
- **Conversation list load:** <1 second (Firestore cached query)
- **Chat history load:** <500ms (50 messages from cache)
- **Typing indicator:** <100ms (RTDB)
- **Presence update:** <200ms (RTDB)
- **AI feature response:** <3 seconds (Cloud Function + LLM)
- **Offline sync:** <5 seconds on reconnect (Firestore automatic)
- **Push notification:** <10 seconds (FCM delivery)

---

## Performance Optimizations

### Firestore Query Scoping

```typescript
// Conversation list: Only fetch user's conversations
const conversationsRef = query(
  collection(db, 'conversations'),
  where('memberIds', 'array-contains', currentUser.uid),
  orderBy('lastMessageAt', 'desc'),
  limit(20) // Pagination
);

// Messages: Fetch 50 at a time
const messagesRef = query(
  collection(db, `conversations/${cid}/messages`),
  orderBy('createdAt', 'desc'),
  limit(50)
);
```

### FlatList Windowing (React Native)

```typescript
<FlatList
  data={messages}
  renderItem={renderMessage}
  windowSize={21} // Render 21 items at a time
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  removeClippedSubviews={true}
/>
```

### Unsubscribe Listeners

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(messagesRef, handleSnapshot);
  
  return () => {
    unsubscribe(); // Clean up on unmount
  };
}, [cid]);
```

### Image Optimization

- Resize images before upload (max 1920px width)
- Use Expo ImagePicker with `quality: 0.8`
- Progressive JPEG encoding

---

## Known Limitations & Trade-offs

1. **Firestore offline persistence:** Works great, but multiple tabs can conflict (mobile = no issue)
2. **Basic media support:** Images only (no video/audio in MVP)
3. **Simple search:** Keyword-based initially (no semantic search)
4. **No end-to-end encryption:** Messages stored in plaintext
5. **No message editing:** Edit/delete out of scope for MVP
6. **No voice messages:** Text and images only
7. **Desktop support:** Mobile-first (web version later)
8. **AI rate limits:** Free tier has token limits (monitor usage)

---

## Success Metrics for MVP Checkpoint

1. **Two users can chat in real-time** across different devices
2. **Messages appear instantly** with optimistic UI (<100ms)
3. **Offline scenario works:** Send while offline → receive on reconnect
4. **App lifecycle handling:** Background/foreground/force-quit preserves state
5. **Read receipts computed** correctly from `lastSeenAt`
6. **Group chat works** with 3+ participants
7. **Typing indicators show** within 100ms (RTDB)
8. **Push notifications fire** (at least in foreground)

---

## Risk Mitigation

**Biggest Risk:** Firestore costs exploding with too many reads  
**Mitigation:** Aggressive listener scoping; pagination; monitor Firebase console daily

**Second Risk:** RTDB typing/presence not cleaning up properly  
**Mitigation:** Use `onDisconnect()` carefully; test on physical device

**Third Risk:** Push notifications not working on physical devices  
**Mitigation:** Test on real iOS/Android hardware early; simulators unreliable

**Fourth Risk:** AI features taking too long to build  
**Mitigation:** Start with summarization (simplest); reuse RAG pipeline for others

**Fifth Risk:** Offline sync edge cases  
**Mitigation:** Trust Firestore offline persistence; test airplane mode scenarios thoroughly