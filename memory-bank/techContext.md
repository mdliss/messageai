# Technical Context

## Tech Stack

### Frontend
- **Framework:** React Native with Expo SDK 54
- **Language:** TypeScript (strict mode, no any types)
- **Navigation:** Expo Router (file-based routing)
- **UI Library:** React Native Paper + custom components
- **State Management:** React Context + custom hooks

### Backend
- **Database:** Cloud Firestore (messages, users, conversations)
- **Realtime DB:** Firebase Realtime Database (typing indicators, presence)
- **Authentication:** Firebase Auth (email/password + Google OAuth)
- **Storage:** Cloud Storage (image uploads)
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Functions:** Cloud Functions for Firebase (Node.js 18)

### AI Layer (Post-MVP)
- **LLM Provider:** OpenAI GPT-4 or Claude
- **Integration:** Direct API calls from Cloud Functions

---

## Project Structure

```
messageai/
├── app/                          # expo router screens
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx            ✅ completed
│   │   └── register.tsx         ✅ completed
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx            ✅ conversation list
│   │   ├── profile.tsx          ✅ completed
│   │   └── explore.tsx
│   ├── conversation/
│   │   └── [id].tsx             🔄 placeholder for pr #4
│   ├── user-picker.tsx          ✅ completed
│   └── _layout.tsx              ✅ authprovider wrapper
│
├── src/
│   ├── services/
│   │   ├── firebase.ts          ✅ initialization + offline persistence
│   │   ├── auth.ts              ✅ auth crud operations
│   │   ├── firestore.ts         ✅ conversation + message crud
│   │   ├── rtdb.ts              📋 todo: typing + presence
│   │   ├── storage.ts           📋 todo: image uploads
│   │   └── notifications.ts     📋 todo: fcm setup
│   │
│   ├── hooks/
│   │   ├── useAuth.ts           ✅ completed
│   │   ├── useConversations.ts  ✅ completed
│   │   ├── useMessages.ts       📋 todo: pr #4
│   │   ├── useTyping.ts         📋 todo: pr #5
│   │   ├── usePresence.ts       📋 todo: pr #6
│   │   └── useAIInsights.ts     📋 todo: ai features
│   │
│   ├── components/
│   │   ├── ConversationItem.tsx ✅ completed
│   │   ├── MessageBubble.tsx    📋 todo: pr #4
│   │   ├── TypingIndicator.tsx  📋 todo: pr #5
│   │   └── AIInsightCard.tsx    📋 todo: ai features
│   │
│   ├── context/
│   │   └── AuthContext.tsx      ✅ completed
│   │
│   ├── types/
│   │   └── index.ts             ✅ user, message, conversation types
│   │
│   └── utils/
│       ├── dateHelpers.ts       📋 todo: if needed
│       └── constants.ts         📋 todo: if needed
│
├── functions/                    📋 todo: cloud functions
├── .env                         🚨 needs firebase credentials
├── .env.example                 ✅ completed
├── package.json                 ✅ all deps installed
├── tsconfig.json                ✅ strict mode enabled
└── README.md                    ✅ comprehensive docs
```

---

## Firebase Configuration

### services initialized (src/services/firebase.ts)
```typescript
export const auth = getAuth(app);
export const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true  // for react native
});
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
```

### offline persistence enabled
```typescript
enableIndexedDbPersistence(firestore)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.log('Browser doesn\'t support persistence');
    }
  });
```

### environment variables (in .env)
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_DATABASE_URL=
```

---

## Data Models

### firestore structure

#### /users/{uid}
```typescript
{
  uid: string;
  email: string;
  displayName: string;  // from google or email prefix
  photoURL: string | null;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  fcmTokens: string[];  // for push notifications
}
```

#### /conversations/{cid}
```typescript
{
  cid: string;
  isGroup: boolean;
  title: string | null;  // for group chats
  memberIds: string[];   // for security + queries
  createdBy: string;     // uid
  createdAt: Timestamp;
  lastMessage: {
    text: string;
    senderId: string;
    type: 'text' | 'image' | 'ai';
    createdAt: Timestamp;
  } | null;
  lastMessageAt: Timestamp;  // for sorting
}
```

#### /conversations/{cid}/members/{uid}
```typescript
{
  uid: string;
  joinedAt: Timestamp;
  lastSeenAt: Timestamp;  // for read receipts
  muted: boolean;
}
```

#### /conversations/{cid}/messages/{mid}
```typescript
{
  mid: string;
  senderId: string;
  type: 'text' | 'image' | 'ai';
  body: string;
  mediaRef: string | null;  // storage path for images
  createdAt: Timestamp;
  status: 'sent' | 'delivered';
  priority: boolean;  // set by ai cloud function
}
```

### realtime database structure

#### /typing/{cid}/{uid}
```typescript
{
  "user_abc123": true  // boolean
}
```

#### /presence/{uid}
```typescript
{
  "user_abc123": {
    "state": "online" | "offline",
    "lastChanged": number  // unix timestamp
  }
}
```

### cloud storage structure
```
/media/{cid}/{mid}/image_{timestamp}_{random}.jpg
```

---

## Key Technical Decisions

### why firestore offline persistence instead of sqlite?
- firestore handles 95% of what sqlite would do
- automatic sync, conflict resolution, retry logic
- one line of code to enable
- less code = fewer bugs

### why rtdb for typing/presence instead of firestore?
- high-frequency writes (typing indicators)
- rtdb: $1/gb vs firestore: $0.18 per 100k writes
- rtdb has lower latency (<100ms vs 200-500ms)
- rtdb onDisconnect() for auto-cleanup

### why no per-message read receipts?
- expensive: N writes per message per reader
- computed client-side from lastSeenAt timestamp
- single write per conversation view
- massive cost savings at scale

### why optimistic ui?
- messages appear instantly (<100ms) from local cache
- firestore queues writes when offline
- automatic retry and sync on reconnect
- better ux than waiting for server

---

## Dependencies Installed

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-router": "~4.0.0",
    "firebase": "^12.4.0",
    "react-native": "0.76.0",
    "react-native-paper": "^5.12.5",
    "expo-notifications": "~0.30.0",
    "expo-image-picker": "~16.0.3",
    "@react-native-async-storage/async-storage": "^2.1.0"
  }
}
```

---

## Performance Targets

- **message send latency:** <100ms (optimistic ui from cache)
- **message delivery:** <500ms (online recipients via listener)
- **typing indicator:** <100ms (rtdb)
- **presence update:** <200ms (rtdb)
- **app cold start:** <2 seconds
- **conversation list load:** <1 second (from cache)
- **chat history load:** <500ms (50 messages from cache)
- **ai feature response:** <3 seconds (cloud function + llm)

---

## Common Commands

### development
```bash
# start expo dev server
npx expo start

# start with cache cleared
npx expo start -c

# install dependencies
npm install

# check for linting errors
npx eslint .
```

### firebase
```bash
# deploy firestore indexes
firebase deploy --only firestore:indexes

# deploy firestore rules
firebase deploy --only firestore:rules

# deploy cloud functions
firebase deploy --only functions
```

### git
```bash
# commit changes
git add .
git commit -m "message"

# view status
git status

# view unstaged changes
git diff
```

---

## Known Issues & Workarounds

### composite index required for conversations query
**Issue:** Query with array-contains + orderBy needs composite index  
**Solution:** Firebase shows error link to create index, or deploy via firestore.indexes.json

### google sign-in on mobile
**Issue:** Requires google sign-in sdk for native mobile  
**Workaround:** Email/password works everywhere, google signin works on web

### firebase credentials needed
**Issue:** .env may have placeholder values  
**Solution:** Create firebase project and add actual credentials to .env

