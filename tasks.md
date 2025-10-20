# MessageAI MVP - Development Task List

## PR #1: Project Setup & Firebase Configuration

**Branch:** `setup/initial-config`  
**Goal:** Initialize React Native + Expo project with Firebase configured

### Tasks:

- [ ] **1.1: Initialize Expo Project**
  - Files to create: `package.json`, `app.json`, `tsconfig.json`
  - Run: `npx create-expo-app@latest messageai --template blank-typescript`
  - Verify dev server runs: `npx expo start`
  - Test on device/simulator

- [ ] **1.2: Install Core Dependencies**
  - Files to update: `package.json`
  - Install messaging dependencies:
    ```bash
    npx expo install expo-router expo-image-picker
    npx expo install firebase expo-notifications
    npx expo install react-native-paper react-native-safe-area-context
    ```

- [ ] **1.3: Configure Expo Router**
  - Files to update: `app.json` (add `expo-router` scheme)
  - Files to create: `app/_layout.tsx`, `app/index.tsx`
  - Set up file-based routing structure

- [ ] **1.4: Set Up Firebase Project**
  - Create Firebase project in console: "messageai-prod"
  - Enable Authentication (Email/Password + Google provider)
  - Create Cloud Firestore database (start in test mode)
  - Create Realtime Database (start in test mode)
  - Enable Cloud Storage
  - Enable Cloud Messaging (FCM)
  - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

- [ ] **1.5: Configure Environment Variables**
  - Files to create: `.env`, `.env.example`
  - Add Firebase config keys:
    ```
    EXPO_PUBLIC_FIREBASE_API_KEY=
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
    EXPO_PUBLIC_FIREBASE_APP_ID=
    EXPO_PUBLIC_FIREBASE_DATABASE_URL=
    ```

- [ ] **1.6: Create Firebase Service File**
  - Files to create: `src/services/firebase.ts`
  - Initialize Firebase app with config
  - Enable Firestore offline persistence:
    ```typescript
    import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
    
    const db = initializeFirestore(app, {
      experimentalForceLongPolling: true, // For React Native
    });
    
    enableIndexedDbPersistence(db);
    ```
  - Export `auth`, `db` (Firestore), `rtdb` (Realtime Database), `storage`, `messaging`
  - Add connection test (console.log on successful init)

- [ ] **1.7: Configure Git & .gitignore**
  - Files to create/update: `.gitignore`
  - Add: `.env`, `node_modules/`, `.expo/`, `dist/`, `ios/`, `android/`
  - Commit initial setup

- [ ] **1.8: Create README with Setup Instructions**
  - Files to create: `README.md`
  - Include: Prerequisites, setup steps, env variables, run commands
  - Add: Project structure overview

**PR Checklist:**

- [ ] Expo dev server runs successfully
- [ ] Firebase initializes without errors
- [ ] Firestore offline persistence enabled
- [ ] Can view app on iOS simulator OR Android emulator OR physical device
- [ ] `.env` is in `.gitignore`
- [ ] README has clear setup instructions

---

## PR #2: Authentication System

**Branch:** `feature/authentication`  
**Goal:** Complete user authentication with email/password and Google login

### Tasks:

- [ ] **2.1: Create Auth Context**
  - Files to create: `src/context/AuthContext.tsx`
  - Provide: `currentUser`, `loading`, `signUp()`, `signIn()`, `signInWithGoogle()`, `signOut()`
  - Use Firebase `onAuthStateChanged` listener
  - Store user profile in Firestore `/users/{uid}` on signup

- [ ] **2.2: Create Auth Service**
  - Files to create: `src/services/auth.ts`
  - Functions:
    - `signUpWithEmail(email, password, displayName)`
    - `signInWithEmail(email, password)`
    - `signInWithGoogle()` (using Firebase Google provider)
    - `signOut()`
    - `updateProfile(displayName, photoURL)`
  - Display name logic: Google name OR email prefix

- [ ] **2.3: Create useAuth Hook**
  - Files to create: `src/hooks/useAuth.ts`
  - Return auth context values
  - Throw error if used outside AuthProvider

- [ ] **2.4: Build Login Screen**
  - Files to create: `app/(auth)/login.tsx`
  - Form fields: email, password
  - "Sign In" button
  - "Sign in with Google" button (with Google logo)
  - Link to register screen
  - Error handling (show alert)

- [ ] **2.5: Build Register Screen**
  - Files to create: `app/(auth)/register.tsx`
  - Form fields: display name, email, password, confirm password
  - "Sign Up" button
  - Password validation (min 8 chars)
  - Link to login screen
  - Error handling

- [ ] **2.6: Create Protected Route Logic**
  - Files to update: `app/_layout.tsx`
  - Wrap app with AuthProvider
  - Redirect to login if not authenticated
  - Show loading spinner during auth check

- [ ] **2.7: Create User Profile Screen**
  - Files to create: `app/(tabs)/profile.tsx`
  - Display: user name, email, photo
  - "Edit Profile" button (optional)
  - "Logout" button
  - Confirm logout with alert

- [ ] **2.8: Test Authentication Flow**
  - Create new account with email/password
  - Login with existing account
  - Test Google Sign-In (requires physical device or setup)
  - Test logout
  - Verify session persists on app restart

**PR Checklist:**

- [ ] Can create new account with email/password
- [ ] Display name auto-generated from email prefix
- [ ] Can login with existing credentials
- [ ] Can logout successfully
- [ ] Auth state persists on app restart
- [ ] Google Sign-In works (test on physical device if possible)
- [ ] Error messages display for invalid credentials
- [ ] User document created in Firestore `/users/{uid}`

---

## PR #3: Conversation List Screen

**Branch:** `feature/conversation-list`  
**Goal:** Display list of conversations with last message preview

### Tasks:

- [ ] **3.1: Create Firestore Service for Conversations**
  - Files to create: `src/services/firestore.ts`
  - Function: `getUserConversations(userId)` - Query Firestore with `array-contains`
  - Function: `subscribeToConversations(userId, callback)` - Real-time listener
  - Function: `createConversation(memberIds, isGroup, title)` - Create new conversation

- [ ] **3.2: Create useConversations Hook**
  - Files to create: `src/hooks/useConversations.ts`
  - Subscribe to Firestore on mount (with cleanup)
  - Query: `where('memberIds', 'array-contains', uid)`
  - Return: `conversations` array, `loading`, `error`

- [ ] **3.3: Build Conversation Item Component**
  - Files to create: `src/components/ConversationItem.tsx`
  - Resolve participant names/photos from `/users/{uid}` (fetch on render)
  - Display: participant photo, name, last message preview, timestamp
  - Show unread count badge (compute from `members/{uid}.lastSeenAt`)
  - Tap to navigate to chat screen

- [ ] **3.4: Compute Unread Count**
  - Function: `getUnreadCount(cid, uid)` in `firestore.ts`
  - Fetch `conversations/{cid}/members/{uid}` document
  - Query messages where `createdAt > lastSeenAt`
  - Count results
  - Return number

- [ ] **3.5: Build Conversations List Screen**
  - Files to create: `app/(tabs)/index.tsx`
  - FlatList of ConversationItem components
  - Pull-to-refresh
  - Empty state: "No conversations yet"
  - Floating action button: "New Message" (navigate to user picker)

- [ ] **3.6: Handle Conversation Creation**
  - Function: `createConversation(memberIds, isGroup, title)` in `firestore.ts`
  - Create conversation doc in Firestore `/conversations/{cid}`
  - Create member docs: `/conversations/{cid}/members/{uid}` for each member
  - Navigate to chat screen after creation

- [ ] **3.7: Implement User Picker (Simple)**
  - Files to create: `app/user-picker.tsx`
  - List all users (query Firestore `/users`)
  - Tap user → create conversation → navigate to chat

**PR Checklist:**

- [ ] Conversation list displays correctly
- [ ] Last message preview shows
- [ ] Unread count badge appears (computed from `lastSeenAt`)
- [ ] Can tap conversation to open chat
- [ ] Can create new conversation with user picker
- [ ] Empty state shows when no conversations
- [ ] Real-time listener updates list when new message arrives

---

## PR #4: Chat Screen with Real-Time Messages

**Branch:** `feature/chat-screen`  
**Goal:** Display messages in real-time with send functionality

### Tasks:

- [ ] **4.1: Create Firestore Service for Messages**
  - Files to update: `src/services/firestore.ts`
  - Function: `sendMessage(cid, message)` - Write to Firestore (optimistic)
  - Function: `subscribeToMessages(cid, callback)` - Real-time listener
  - Function: `updateLastSeenAt(cid, uid)` - Update member's `lastSeenAt`

- [ ] **4.2: Create useMessages Hook**
  - Files to create: `src/hooks/useMessages.ts`
  - Subscribe to Firestore messages on mount
  - Query: `orderBy('createdAt', 'desc').limit(50)` (pagination)
  - Listen to local cache first (instant UI)
  - Return: `messages`, `sendMessage()`, `loading`

- [ ] **4.3: Build Message Bubble Component**
  - Files to create: `src/components/MessageBubble.tsx`
  - Props: `message`, `isOwnMessage`, `isRead`
  - Display: sender name (if not own), text, timestamp
  - Different styles for own vs other messages (right-aligned vs left-aligned)
  - Status indicators: checkmark (sent), blue double checkmark (read)

- [ ] **4.4: Build Chat Screen**
  - Files to create: `app/conversation/[id].tsx`
  - Use `useLocalSearchParams()` to get conversation ID
  - FlatList of MessageBubble components (inverted for chat UX)
  - Text input at bottom with "Send" button
  - Load more messages on scroll (pagination)
  - Update `lastSeenAt` on mount (mark as read)

- [ ] **4.5: Implement Optimistic UI Updates**
  - On send:
    1. Call Firestore `addDoc()` (returns immediately)
    2. Message appears in UI from local cache (<100ms)
    3. Show checkmark icon (pending server confirmation)
    4. Firestore syncs to server in background
    5. Listener fires again when server confirms (update UI)

- [ ] **4.6: Compute Read Status Client-Side**
  - Fetch `conversations/{cid}/members/{uid}` for all members
  - For each message: `isRead = member.lastSeenAt >= message.createdAt`
  - Update UI: Single checkmark (sent) → Blue double checkmark (read)

**PR Checklist:**

- [ ] Can send text messages
- [ ] Messages appear instantly (optimistic UI from cache)
- [ ] Messages from other user appear in real-time
- [ ] Message status indicators work (sent → read)
- [ ] Chat scrolls to bottom on new message
- [ ] Pagination loads older messages
- [ ] `lastSeenAt` updates when conversation opened

---

## PR #5: RTDB Typing Indicators

**Branch:** `feature/typing-indicators`  
**Goal:** Show typing indicators using Realtime Database

### Tasks:

- [ ] **5.1: Create RTDB Service**
  - Files to create: `src/services/rtdb.ts`
  - Function: `setTyping(cid, uid, isTyping)` - Write to `/typing/{cid}/{uid}`
  - Function: `subscribeToTyping(cid, callback)` - Listen to `/typing/{cid}`
  - Use `onDisconnect()` to auto-cleanup typing state

- [ ] **5.2: Create useTyping Hook**
  - Files to create: `src/hooks/useTyping.ts`
  - Track text input changes (debounced 300ms)
  - Call `setTyping(cid, uid, true)` when user types
  - Call `setTyping(cid, uid, false)` on blur or 3s inactivity
  - Subscribe to RTDB for other users' typing status
  - Return: `typingUsers` array (exclude current user)

- [ ] **5.3: Build Typing Indicator Component**
  - Files to create: `src/components/TypingIndicator.tsx`
  - Display: "Alice is typing..." (1 user)
  - Display: "Alice, Bob are typing..." (2+ users)
  - Animated dots (...)

- [ ] **5.4: Integrate into Chat Screen**
  - Files to update: `app/conversation/[id].tsx`
  - Add useTyping hook
  - Render TypingIndicator component above text input
  - Update typing status on text input change

**PR Checklist:**

- [ ] Typing indicator appears within 100ms
- [ ] Typing indicator disappears after 3s inactivity
- [ ] Works with multiple users typing simultaneously
- [ ] Uses RTDB (not Firestore)
- [ ] `onDisconnect()` cleanup works (no stale indicators)

---

## PR #6: RTDB Presence & Online Status

**Branch:** `feature/presence`  
**Goal:** Show who's online/offline using Realtime Database

### Tasks:

- [ ] **6.1: Create Presence Service**
  - Files to update: `src/services/rtdb.ts`
  - Function: `setUserOnline(uid)` - Write to `/presence/{uid}` with `state: 'online'`
  - Function: `setUserOffline(uid)` - Write with `state: 'offline'`
  - Use RTDB `onDisconnect()` to auto-set offline

- [ ] **6.2: Integrate Presence into App Lifecycle**
  - Files to update: `src/context/AuthContext.tsx`
  - On login: Call `setUserOnline()`
  - On app state change (background/foreground): Update presence
  - On logout: Call `setUserOffline()`

- [ ] **6.3: Create usePresence Hook**
  - Files to create: `src/hooks/usePresence.ts`
  - Subscribe to `/presence/{uid}` for specific user
  - Return: `isOnline`, `lastSeen`

- [ ] **6.4: Display Presence in Conversation List**
  - Files to update: `src/components/ConversationItem.tsx`
  - Add green dot for online, gray dot for offline
  - Show "last seen" timestamp for offline users

- [ ] **6.5: Display Presence in Chat Screen**
  - Files to update: `app/conversation/[id].tsx`
  - Show presence in header (next to user name)
  - Update in real-time

**PR Checklist:**

- [ ] Online status shows green dot
- [ ] Offline status shows gray dot with "last seen"
- [ ] Presence updates within 200ms
- [ ] Auto-sets offline when app closes (onDisconnect works)
- [ ] Uses RTDB (not Firestore)

---

## PR #7: Group Chat Support

**Branch:** `feature/group-chat`  
**Goal:** Support conversations with 3+ participants

### Tasks:

- [ ] **7.1: Update Conversation Creation for Groups**
  - Files to update: `src/services/firestore.ts`
  - Function: `createGroupConversation(memberIds, groupName)`
  - Set `isGroup: true`
  - Store all member IDs in `memberIds` array

- [ ] **7.2: Update Message Display for Groups**
  - Files to update: `src/components/MessageBubble.tsx`
  - Show sender name for all messages (not just others)
  - Show sender avatar

- [ ] **7.3: Update Read Receipts for Groups**
  - Files to update: `src/components/MessageBubble.tsx`
  - Compute read count: Count members where `lastSeenAt >= message.createdAt`
  - Show count: "Read by 3 of 5"
  - Optional: Tap to see who read (modal)

- [ ] **7.4: Update Typing Indicators for Groups**
  - Files to update: `src/components/TypingIndicator.tsx`
  - Handle multiple users typing: "Alice, Bob, Carol are typing..."

- [ ] **7.5: Create Group Creation Screen**
  - Files to create: `app/create-group.tsx`
  - Multi-select user picker
  - Group name input
  - "Create Group" button

- [ ] **7.6: Update Conversation List for Groups**
  - Files to update: `src/components/ConversationItem.tsx`
  - Display group name OR auto-generate: "Alice, Bob, +2"
  - Show group icon/avatar

**PR Checklist:**

- [ ] Can create group with 3+ users
- [ ] All participants receive messages in real-time
- [ ] Sender name shows for each message
- [ ] Read receipts show count (computed from `lastSeenAt`)
- [ ] Typing indicators work for multiple users

---

## PR #8: Image Sharing

**Branch:** `feature/images`  
**Goal:** Send and receive images

### Tasks:

- [ ] **8.1: Set Up Firebase Storage Service**
  - Files to create: `src/services/storage.ts`
  - Function: `uploadImage(uri, cid, mid)` - Upload to Storage
  - Function: `getDownloadURL(path)` - Get public URL
  - Path structure: `/media/{cid}/{mid}/image_{timestamp}.jpg`

- [ ] **8.2: Add Image Picker to Chat Screen**
  - Files to update: `app/conversation/[id].tsx`
  - Add image picker button (camera icon)
  - Use `expo-image-picker` to select from gallery
  - Use `expo-image-picker` to capture new photo

- [ ] **8.3: Implement Image Upload Flow**
  - On image select:
    1. Generate message ID
    2. Upload to Storage at `/media/{cid}/{mid}/filename`
    3. Get download URL
    4. Send message with `type: 'image'`, `mediaRef: downloadURL`

- [ ] **8.4: Update Message Bubble for Images**
  - Files to update: `src/components/MessageBubble.tsx`
  - Render image if `type === 'image'`
  - Show loading placeholder during upload
  - Tap to view full-screen (modal)

- [ ] **8.5: Handle Offline Image Uploads**
  - If offline when selecting image:
    - Firestore queues the message write
    - Storage upload queues automatically
    - Both sync when reconnected

**PR Checklist:**

- [ ] Can select image from gallery
- [ ] Can capture new photo with camera
- [ ] Image uploads to Storage
- [ ] Image displays for recipient
- [ ] Image upload shows progress indicator
- [ ] Tap image to view full-screen
- [ ] Offline images queue and upload on reconnect

---

## PR #9: Push Notifications

**Branch:** `feature/push-notifications`  
**Goal:** Receive notifications for new messages

### Tasks:

- [ ] **9.1: Set Up Expo Notifications**
  - Files to create: `src/services/notifications.ts`
  - Request notification permissions
  - Get FCM token
  - Store token in Firestore `/users/{uid}.fcmTokens[]` (array)

- [ ] **9.2: Create Cloud Function for Notifications**
  - Files to create: `functions/src/notifications/sendMessage.ts`
  - Trigger: `onCreate` for `/conversations/{cid}/messages/{mid}`
  - Get recipient FCM tokens (exclude sender)
  - Query `/users/{uid}` for each member
  - Filter out sender's tokens
  - Send notification via FCM:
    ```javascript
    await admin.messaging().sendMulticast({
      tokens: recipientTokens,
      notification: {
        title: senderName,
        body: messageText
      },
      data: {
        conversationId: cid,
        messageId: mid
      }
    });
    ```

- [ ] **9.3: Handle Foreground Notifications**
  - Files to update: `src/services/notifications.ts`
  - Listen to `onNotificationReceived`
  - Show in-app banner (optional: don't show if already in that conversation)

- [ ] **9.4: Handle Notification Tap**
  - Files to update: `src/services/notifications.ts`
  - Listen to `onNotificationPress`
  - Navigate to conversation screen with conversation ID from data payload

- [ ] **9.5: Deploy Cloud Function**
  - Run: `firebase deploy --only functions:sendMessageNotification`
  - Test with 2 devices

**PR Checklist:**

- [ ] Foreground notifications show banner
- [ ] Background notifications appear in system tray
- [ ] Tapping notification opens correct conversation
- [ ] Notifications work on physical device (iOS/Android)
- [ ] FCM tokens stored as array (multi-device support)

---

## CHECKPOINT: MVP Complete

**At this point, all core messaging features should work:**

### MVP Requirements:

- [ ] User authentication (email/password + Google)
- [ ] One-on-one messaging
- [ ] Real-time message delivery (Firestore listeners)
- [ ] Optimistic UI updates (local cache)
- [ ] Message persistence (Firestore offline persistence)
- [ ] Read receipts (computed from `lastSeenAt`)
- [ ] Typing indicators (RTDB)
- [ ] Online/offline presence (RTDB)
- [ ] Group chat (3+ users)
- [ ] Image sharing
- [ ] Push notifications (foreground + background)

### Testing Before Proceeding:

- [ ] Test with 2 devices: Send messages, verify real-time sync
- [ ] Test offline: Send 5 messages offline, reconnect, verify all send
- [ ] Test app lifecycle: Force-quit, reopen, verify messages persist
- [ ] Test group chat: 3 users sending simultaneously
- [ ] Test images: Send image, verify recipient sees it
- [ ] Test push: Background the app, send message, verify notification
- [ ] Test typing: User A types → User B sees indicator within 100ms
- [ ] Test presence: User A closes app → User B sees offline within 5s

**If any MVP requirement is broken, STOP and fix before proceeding to AI features.**

---

## PR #10: Security Rules

**Branch:** `feature/security-rules`  
**Goal:** Lock down Firestore, Storage, and RTDB with production rules

### Tasks:

- [ ] **10.1: Create Firestore Security Rules**
  - Files to create: `firestore.rules`
  - Copy rules from architecture.md
  - Restrict writes to conversation members
  - Validate message schema
  - Prevent message updates/deletes

- [ ] **10.2: Create Storage Security Rules**
  - Files to create: `storage.rules`
  - Copy rules from architecture.md
  - Restrict uploads to conversation members
  - Validate image size (< 10 MB) and type

- [ ] **10.3: Create RTDB Security Rules**
  - Files to create: `database.rules.json`
  - Copy rules from architecture.md
  - Restrict typing/presence writes to owner

- [ ] **10.4: Deploy All Rules**
  - Run: `firebase deploy --only firestore:rules`
  - Run: `firebase deploy --only storage:rules`
  - Run: `firebase deploy --only database`

- [ ] **10.5: Test Rules**
  - Try to write message as non-member (should fail)
  - Try to upload image to wrong conversation (should fail)
  - Try to set other user's typing state (should fail)

**PR Checklist:**

- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] RTDB rules deployed
- [ ] All rules tested and working
- [ ] No unauthorized access possible

---

## PR #11: AI Feature 1 - Thread Summarization

**Branch:** `feature/ai-summarization`  
**Goal:** Summarize long conversations in 3 bullet points

### Tasks:

- [ ] **11.1: Set Up Cloud Functions for AI**
  - Files to create: `functions/src/ai/summarize.ts`
  - Install Anthropic SDK: `npm install @anthropic-ai/sdk`
  - Store API key in `.env` file (functions/.env)

- [ ] **11.2: Implement Message Retrieval**
  - Function: `getConversationMessages(cid, limit = 100)`
  - Query Firestore for last N messages
  - Format as conversation transcript:
    ```
    Alice: Can we meet tomorrow at 2pm?
    Bob: I have a conflict at 2pm
    Alice: How about 3pm?
    Bob: That works!
    ```

- [ ] **11.3: Create Summarization Cloud Function**
  - Files to update: `functions/src/ai/summarize.ts`
  - HTTPS callable function: `summarizeConversation({ conversationId })`
  - Retrieve messages
  - Call Claude API:
    ```typescript
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Summarize this team conversation in 3 concise bullet points:\n\n${transcript}`
      }]
    });
    ```
  - Store result in `/conversations/{cid}/insights/{iid}`

- [ ] **11.4: Build AI Insight Card Component**
  - Files to create: `src/components/AIInsightCard.tsx`
  - Display: Icon, title, content, timestamp
  - Dismissible (swipe or X button)
  - Different styles for different insight types

- [ ] **11.5: Add Summarize Button to Chat Screen**
  - Files to update: `app/conversation/[id].tsx`
  - Add button in header: "Summarize"
  - On tap: Call Cloud Function via `httpsCallable()`
  - Show loading state
  - Display result as AIInsightCard

- [ ] **11.6: Create useAIInsights Hook**
  - Files to create: `src/hooks/useAIInsights.ts`
  - Function: `summarize(cid)` - calls Cloud Function
  - Subscribe to `/conversations/{cid}/insights` subcollection
  - Return: `insights`, `loading`, `error`

**PR Checklist:**

- [ ] "Summarize" button appears in chat screen
- [ ] Tapping button generates summary within 3 seconds
- [ ] Summary displays as card in chat
- [ ] Summary is accurate and actionable (3 bullet points)
- [ ] Works for conversations with 50+ messages
- [ ] AI Insight persists (stored in Firestore)

---

## PR #12: AI Feature 2 - Action Item Extraction

**Branch:** `feature/ai-action-items`  
**Goal:** Extract tasks with owners from conversation

### Tasks:

- [ ] **12.1: Create Action Items Cloud Function**
  - Files to create: `functions/src/ai/actionItems.ts`
  - HTTPS callable function: `extractActionItems({ conversationId })`
  - Retrieve messages (reuse from summarization)
  - Call Claude API:
    ```typescript
    const prompt = `Extract action items from this conversation. 
    Format each as: "Owner: Task (deadline if mentioned)"
    
    ${transcript}`;
    ```

- [ ] **12.2: Store Action Items as AI Insight**
  - Type: `action_items`
  - Content: Formatted list of tasks
  - Metadata: `{ actionItemCount: N }`

- [ ] **12.3: Add "Action Items" Button to Chat Screen**
  - Files to update: `app/conversation/[id].tsx`
  - Button in header or as chat action
  - On tap: Call Cloud Function, display result

- [ ] **12.4: Update AI Insight Card for Action Items**
  - Files to update: `src/components/AIInsightCard.tsx`
  - Render action items as bulleted list
  - Highlight owners (bold text)

**PR Checklist:**

- [ ] "Action Items" button works
- [ ] Extracts tasks with owners accurately
- [ ] Captures deadlines when mentioned
- [ ] Displays as formatted list
- [ ] Generates within 3 seconds

---

## PR #13: AI Feature 3 - Priority Message Detection

**Branch:** `feature/ai-priority`  
**Goal:** Automatically flag urgent messages

### Tasks:

- [ ] **13.1: Create Priority Detection Cloud Function**
  - Files to create: `functions/src/ai/priority.ts`
  - Trigger: `onCreate` for `/conversations/{cid}/messages/{mid}`
  - Pattern matching:
    ```typescript
    const urgentKeywords = ['urgent', 'ASAP', 'critical', 'emergency', 'deadline'];
    const isUrgent = urgentKeywords.some(kw => 
      messageText.toLowerCase().includes(kw)
    );
    ```
  - If urgent: Update message doc with `priority: true`

- [ ] **13.2: Optional LLM Classification**
  - For ambiguous cases, call Claude API
  - Prompt: "Is this message urgent? Respond with YES or NO"
  - Only for messages that don't match keywords

- [ ] **13.3: Update Message Bubble for Priority**
  - Files to update: `src/components/MessageBubble.tsx`
  - If `message.priority === true`: Add red flag icon or bold border

- [ ] **13.4: Deploy Cloud Function**
  - Run: `firebase deploy --only functions:detectPriority`
  - Test with urgent message

**PR Checklist:**

- [ ] Urgent messages automatically flagged
- [ ] Priority indicator shows visually (red flag)
- [ ] Low false positive rate (< 10%)
- [ ] Runs within 500ms (doesn't slow delivery)

---

## PR #14: AI Feature 4 - Decision Tracking

**Branch:** `feature/ai-decisions`  
**Goal:** Log team decisions automatically

### Tasks:

- [ ] **14.1: Create Decision Detection Cloud Function**
  - Files to create: `functions/src/ai/decisions.ts`
  - Trigger: `onCreate` for messages
  - Pattern matching:
    ```typescript
    const decisionPatterns = [
      /let's go with/i,
      /we'll use/i,
      /decided/i,
      /approved/i,
      /agreed/i
    ];
    ```

- [ ] **14.2: LLM Extraction**
  - Call Claude API to extract decision details
  - Prompt: "What was decided in this message? Provide a 1-sentence summary."

- [ ] **14.3: Store Decisions as AI Insights**
  - Type: `decision`
  - Content: "Use PostgreSQL instead of MongoDB"
  - Metadata: `{ approvedBy: [...], timestamp }`

- [ ] **14.4: Create Decisions Screen**
  - Files to create: `app/(tabs)/decisions.tsx`
  - List all decisions across conversations
  - Grouped by date
  - Search functionality

- [ ] **14.5: Display Decisions in Tab Bar**
  - Files to update: `app/(tabs)/_layout.tsx`
  - Add "Decisions" tab with icon

**PR Checklist:**

- [ ] Decisions automatically logged
- [ ] Decisions screen shows all logged decisions
- [ ] Decisions are searchable
- [ ] Low false positives (< 15%)

---

## PR #15: AI Feature 5 - Proactive Assistant

**Branch:** `feature/proactive-assistant`  
**Goal:** Detect scheduling needs and offer help

### Tasks:

- [ ] **15.1: Create Proactive Detection Cloud Function**
  - Files to create: `functions/src/ai/proactive.ts`
  - Trigger: `onCreate` for messages
  - Pattern matching:
    ```typescript
    const schedulingPatterns = [
      /when (can|should|are) (we|you|everyone)/i,
      /schedule|meeting|call|sync/i,
      /available|free time/i,
      /(what|which) time works/i
    ];
    ```

- [ ] **15.2: Generate Proactive Suggestion**
  - Create AI Insight with type='suggestion'
  - Content: "Would you like me to help find a time that works for everyone?"
  - Metadata: `{ action: 'schedule_meeting' }`

- [ ] **15.3: Display Suggestion in Chat**
  - Files to update: `src/components/AIInsightCard.tsx`
  - Show as interactive card with "Yes" and "Dismiss" buttons

- [ ] **15.4: Implement Scheduling Assistant (Simple)**
  - On "Yes":
    - Call Cloud Function: `suggestMeetingTimes({ conversationId })`
    - Extract available times from conversation context
    - Use Claude to suggest 2-3 time slots
    - Display as AI message

**PR Checklist:**

- [ ] Detects scheduling language accurately (80%+)
- [ ] Suggestion appears as dismissible card
- [ ] "Yes" button triggers scheduling assistant
- [ ] Suggestions are helpful and relevant
- [ ] Low false positives (< 10%)

---

## PR #16: Testing, Polish & Bug Fixes

**Branch:** `fix/final-polish`  
**Goal:** Comprehensive testing and UI polish

### Tasks:

- [ ] **16.1: Multi-User Testing**
  - Test with 3-5 concurrent users
  - All sending messages simultaneously
  - Check for race conditions
  - Verify no message loss or duplication

- [ ] **16.2: Offline Scenario Testing**
  - User A offline, User B sends 10 messages
  - User A comes online → verify all 10 received
  - User A sends 5 messages offline → verify all send on reconnect

- [ ] **16.3: App Lifecycle Testing**
  - Send message, force-quit, reopen → message sent
  - Background app, receive message, foreground → notification shows
  - Switch between conversations rapidly → no UI glitches

- [ ] **16.4: AI Features Testing**
  - Test each AI feature with edge cases:
    - Summarization: Empty conversation, 500+ messages
    - Action items: Conversation with no tasks
    - Priority: Non-urgent messages (verify no false positives)
    - Decisions: Ambiguous language
    - Proactive: Non-scheduling conversations

- [ ] **16.5: Error Handling**
  - Add try/catch to all service functions
  - Display user-friendly error messages
  - Handle API failures gracefully (AI features)
  - Handle network errors (Firestore)

- [ ] **16.6: UI Polish**
  - Consistent spacing and colors
  - Loading states for all async operations
  - Empty states for all screens
  - Smooth animations and transitions

- [ ] **16.7: Performance Optimization**
  - Minimize Firestore reads (aggressive caching)
  - Debounce typing indicators (RTDB)
  - Optimize image uploads (compress before upload)
  - Lazy load conversation list (pagination)

- [ ] **16.8: Accessibility**
  - Add accessibility labels to buttons
  - Test with VoiceOver/TalkBack
  - Ensure sufficient color contrast

**PR Checklist:**

- [ ] All MVP requirements passing
- [ ] All 5 AI features working
- [ ] No console errors
- [ ] Smooth performance on test devices
- [ ] Error messages are helpful
- [ ] UI feels polished

---

## PR #17: Deployment & Documentation

**Branch:** `deploy/production`  
**Goal:** Deploy to production and create demo

### Tasks:

- [ ] **17.1: Deploy Cloud Functions**
  - Run: `firebase deploy --only functions`
  - Verify all functions deployed successfully
  - Test each function with HTTP request or trigger

- [ ] **17.2: Verify Security Rules**
  - Ensure Firestore, Storage, and RTDB rules are deployed
  - Test with unauthenticated user (should fail)

- [ ] **17.3: Build Production App**
  - iOS: `eas build --platform ios`
  - Android: `eas build --platform android`
  - OR use Expo Go for quick testing

- [ ] **17.4: Create TestFlight Build (iOS)**
  - Submit to TestFlight
  - Add testers (your email)
  - Generate public link

- [ ] **17.5: Create APK (Android)**
  - Download APK from EAS build
  - Upload to Google Drive or GitHub Releases
  - Generate shareable link

- [ ] **17.6: Update README**
  - Files to update: `README.md`
  - Add: Live demo links (TestFlight, APK, or Expo Go)
  - Add: Video demo link
  - Add: Setup instructions
  - Add: Feature list
  - Add: Tech stack
  - Add: Architecture diagram

- [ ] **17.7: Create Demo Video (5-7 minutes)**
  - Script:
    1. Intro: Project overview (30s)
    2. MVP Demo: Real-time messaging, offline, group chat, images (2 min)
    3. AI Features: Summarization, action items, priority, decisions (2.5 min)
    4. Proactive Assistant: Scheduling detection (1 min)
    5. Conclusion: Tech stack, challenges, learnings (1 min)
  - Record with 2 devices side-by-side
  - Show real-time sync clearly
  - Upload to YouTube/Loom

- [ ] **17.8: Create Persona Brainlift Document**
  - Files to create: `PERSONA.md`
  - 1-page explanation:
    - Chosen persona: Remote Team Professional
    - Their pain points (thread overwhelm, decision archaeology, etc.)
    - How each AI feature solves a problem
    - Key technical decisions and trade-offs

- [ ] **17.9: Final Testing on Production**
  - Install from TestFlight/APK
  - Test all features on production Firebase
  - Verify Cloud Functions work
  - Test with 2-3 friends

**PR Checklist:**

- [ ] App deployed and accessible
- [ ] TestFlight link OR APK link OR Expo Go link
- [ ] Demo video uploaded (5-7 minutes)
- [ ] README has all required information
- [ ] PERSONA.md created
- [ ] All features work in production

---

## Final Submission Checklist

### Required Deliverables:

- [ ] **1. GitHub Repository**
  - Public repo with all code
  - Comprehensive README
  - PERSONA.md document
  - architecture.md, PRD.md, tasks.md

- [ ] **2. Demo Video (5-7 minutes)**
  - Shows real-time messaging (2 devices)
  - Shows group chat with 3+ users
  - Shows offline scenario
  - Shows app lifecycle handling
  - Shows all 5 required AI features
  - Shows Proactive Assistant

- [ ] **3. Deployed Application**
  - iOS: TestFlight link
  - Android: APK download link
  - OR: Expo Go link with QR code

- [ ] **4. Persona Brainlift Document**
  - 1-page explanation of persona and AI features

- [ ] **5. Social Post**
  - Posted on Twitter/LinkedIn
  - Tagged @GauntletAI
  - Includes demo video or screenshots
  - Brief description of project

---

## MVP Completion Checklist

### Core Messaging:

- [ ] User authentication (email/password + Google)
- [ ] One-on-one messaging
- [ ] Real-time message delivery (<500ms via Firestore listeners)
- [ ] Optimistic UI updates (<100ms from local cache)
- [ ] Message persistence (Firestore offline persistence)
- [ ] Read receipts (computed from `lastSeenAt`)
- [ ] Typing indicators (RTDB, <100ms)
- [ ] Online/offline presence (RTDB, <200ms)
- [ ] Group chat (3+ users)
- [ ] Image sharing
- [ ] Push notifications (foreground + background)
- [ ] Security rules (Firestore, Storage, RTDB)

### AI Features:

- [ ] Thread summarization (3 bullet points)
- [ ] Action item extraction (tasks with owners)
- [ ] Priority message detection (auto-flag urgent)
- [ ] Decision tracking (auto-log decisions)
- [ ] Proactive Assistant (scheduling detection)

### Performance Targets:

- [ ] Message send latency: <100ms (optimistic UI)
- [ ] Message delivery: <500ms (online recipients)
- [ ] App cold start: <2 seconds
- [ ] Typing indicator: <100ms (RTDB)
- [ ] AI feature response: <3 seconds

### Testing Scenarios:

- [ ] 2 users chatting in real-time
- [ ] Offline send/receive works (Firestore queues automatically)
- [ ] App force-quit preserves state (offline persistence)
- [ ] Group chat with 3+ users
- [ ] All AI features generate accurate results
- [ ] RTDB typing/presence updates in <200ms