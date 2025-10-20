# MessageAI MVP - Product Requirements Document

**Project**: MessageAI - Real-Time Collaborative Messaging with AI  
**Goal**: Build production-quality messaging with AI features for Remote Team Professionals

**Note**: Focus on core messaging infrastructure first (MVP), then add all AI features for full product.

---

## User Stories

### Primary User: Remote Team Professional (MVP Priority)

- As a remote worker, I want to **create an account and log in** so that my messages are private and associated with my identity
- As a remote worker, I want to **send text messages instantly** so that I can communicate with my team in real-time
- As a remote worker, I want to **see my messages even when offline** so that I don't lose context when my wifi drops
- As a remote worker, I want to **know if my message was delivered and read** so that I understand if my teammate saw it
- As a remote worker, I want to **see when someone is typing** so that I don't interrupt their thought
- As a remote worker, I want to **know if my teammate is online** so that I know if they'll respond quickly
- As a remote worker, I want to **create group chats** so that my whole team can discuss together
- As a remote worker, I want to **send images** so that I can share screenshots or diagrams
- As a remote worker, I want to **get notified of new messages** so that I don't miss important updates

**Note:** Complete all messaging user stories before starting AI features.

### Secondary User: Remote Team Professional (AI Features)

- As a remote worker, I want to **summarize long threads** so that I can catch up in 30 seconds instead of 30 minutes
- As a remote worker, I want to **extract action items automatically** so that tasks don't fall through the cracks
- As a remote worker, I want to **have urgent messages flagged** so that I don't miss critical items
- As a remote worker, I want to **track decisions automatically** so that I have a record of what was agreed
- As a remote worker, I want to **get scheduling suggestions** when coordination is needed

---

## Key Features for MVP

### 1. Authentication System

**Must Have:**

- User registration via email/password (Firebase Auth)
- Google social login (Firebase Auth)
- User login/logout
- Persistent user sessions across app restarts
- User display names and profile photos

**Display Name Logic:**

- Use Google display name if signing in via Google
- Use email prefix (before @) if signing in via email/password
- Allow users to update display name in profile

**Success Criteria:**

- Users can create accounts and sessions persist across app restarts
- Each user has a unique identifier, display name, and optional photo
- Logout works and clears session

---

### 2. One-on-One Messaging

**Must Have:**

- Start conversation with another user
- Send text messages
- Real-time message delivery (<500ms when online)
- Message history loads when opening conversation
- Messages display with sender name, avatar, timestamp
- Message status indicators: sending → sent
- Optimistic UI updates (message appears instantly before server confirmation)

**Message Flow:**

1. User taps "Send"
2. Message appears instantly in UI (from Firestore local cache)
3. Firestore queues write to server
4. Server confirms → status updates to "sent"

**Success Criteria:**

- Message appears in sender's UI within 100ms of tapping "Send"
- Message arrives at recipient's device within 500ms (when online)
- Status indicators update correctly
- Message history loads smoothly (50 messages in <500ms)

---

### 3. Offline Support & Persistence

**Must Have:**

- All messages cached locally via Firestore offline persistence
- Messages persist across app restarts
- Can view chat history when offline
- Can compose messages when offline (queue for sending)
- Automatic sync when reconnecting
- Messages never get lost (Firestore handles retry)

**Offline Behavior:**

- Sending while offline: Message shows "sending" status, queues in Firestore
- Receiving while offline: Messages accumulate in Firestore
- On reconnect: Firestore automatically syncs pending sends + fetches missed messages
- Conflict resolution: Not needed (messages are append-only)

**Success Criteria:**

- User goes offline → can still read all past messages
- User sends message offline → it queues and sends on reconnect
- User receives 10 messages while offline → sees all on reconnect
- App force-quit mid-send → message still sends on reopen

**Implementation:**

```typescript
// One line enables offline persistence
enableIndexedDbPersistence(db);
```

---

### 4. Read Receipts (Simplified)

**Must Have:**

- Sender sees when message is read (blue double checkmark)
- Read status computed client-side from `lastSeenAt` timestamp
- Messages automatically marked as read when user opens conversation
- Works in both one-on-one and group chats

**How It Works:**

- Each user has `conversations/{cid}/members/{uid}` document with `lastSeenAt` timestamp
- When user opens conversation: Update their `lastSeenAt` to current time
- Client-side: Message is "read" if `message.createdAt <= member.lastSeenAt`
- UI: Single checkmark (sent) → Blue double checkmark (read)

**Group Chat Read Receipts:**

- Show count: "Read by 3 of 5"
- Tap to see who read it (optional enhancement)

**Success Criteria:**

- Checkmarks update in real-time (<500ms)
- Read status updates when user opens conversation
- Works reliably across multiple devices
- No per-message write cost (single `lastSeenAt` update per conversation view)

---

### 5. Typing Indicators (RTDB)

**Must Have:**

- "Alice is typing..." appears when other user types
- Disappears after 3 seconds of inactivity
- Only shows in active conversation
- Multiple people typing: "Alice, Bob are typing..."
- Uses Realtime Database (not Firestore) for performance

**Implementation:**

- Write to `/typing/{cid}/{uid}` in RTDB when user types (debounced 300ms)
- Auto-cleanup with `onDisconnect()` handler
- Listen to RTDB changes for real-time updates

**Success Criteria:**

- Typing indicator appears within 100ms
- Disappears automatically after inactivity
- No performance issues (RTDB handles high-frequency writes)
- No stale indicators (onDisconnect cleanup works)

---

### 6. Online/Offline Presence (RTDB)

**Must Have:**

- Green dot when user is online
- Gray dot when offline
- "Last seen" timestamp for offline users
- Updates within 5 seconds of status change
- Shows in both conversation list and chat screen
- Uses Realtime Database (not Firestore) for reliability

**Implementation:**

- Write to `/presence/{uid}` in RTDB on app open/close
- Use `onDisconnect()` to automatically set offline
- Listen to RTDB changes for real-time updates

**Success Criteria:**

- Presence updates in real-time
- Offline status sets automatically when app closes
- No stale presence (onDisconnect works reliably)

---

### 7. Group Chat

**Must Have:**

- Create group with 3+ participants
- All participants see messages from everyone
- Group has a name (user-defined or auto-generated)
- Sender name/avatar shown for each message
- Message delivery tracking
- Read receipts show count

**Group Chat Name:**

- User can set custom name
- Auto-generate if not set: "Alice, Bob, +2 others"

**Success Criteria:**

- Can create group with 3+ users
- All participants receive messages in real-time
- Group chat feels identical to one-on-one (just more participants)

---

### 8. Image Sharing

**Must Have:**

- Select image from camera roll
- Capture new photo with camera
- Image uploads to Firebase Storage
- Image displays inline in message bubble
- Tap to view full-screen
- Image shows loading state during upload

**Success Criteria:**

- Image uploads within 5 seconds (on good connection)
- Image displays correctly for all recipients
- Offline images queue and upload on reconnect

---

### 9. Push Notifications

**Must Have:**

- Foreground notifications (show banner while app is open)
- Background notifications (alert when app is closed/backgrounded)
- Notification shows sender name and message preview
- Tapping notification opens that conversation
- Works on both iOS and Android

**MVP Compromise:**

- Foreground notifications (easy) are required
- Background notifications (requires FCM setup + testing) are best-effort
- If background push fails, document as known issue

**Success Criteria:**

- Foreground notifications work 100% reliably
- Background notifications work (test on physical device)
- Tapping notification navigates to correct conversation

---

## AI Features (Full Product)

### Required AI Features (All 5 Must Be Implemented)

#### 1. Thread Summarization

**User Story:**
As a remote worker, I want to tap "Summarize thread" and see a 3-bullet summary so that I can catch up on long conversations quickly.

**Implementation:**

- User taps "Summarize" button in conversation
- Cloud Function retrieves last 100 messages
- Calls Claude API with prompt: "Summarize this conversation in 3 concise bullet points"
- Returns summary and stores as AI Insight
- Displays in chat as special card

**Example Output:**

```
• Team agreed to move product launch to Friday
• Sarah raised concerns about API rate limits under load
• Decision: Implement caching layer to mitigate (Alex volunteered)
```

**Success Criteria:**

- Summary generates within 3 seconds
- Summaries are accurate and actionable
- Works for conversations with 50-500 messages

---

#### 2. Action Item Extraction

**User Story:**
As a remote worker, I want to see all action items with owners so that I don't forget who's responsible for what.

**Implementation:**

- User taps "Show action items" button
- Cloud Function retrieves messages
- Calls Claude with prompt: "Extract action items with owners and deadlines"
- Returns structured list
- Displays as bulleted list card

**Example Output:**

```
Action Items:
• Alex: Fix authentication bug (by EOD)
• Jamie: Review PR #234
• Sam: Update deployment docs (by Friday)
• Sarah: Schedule Q2 planning sync
```

**Success Criteria:**

- Extracts action items accurately
- Identifies owners when mentioned
- Captures deadlines if specified
- Generates within 3 seconds

---

#### 3. Priority Message Detection

**User Story:**
As a remote worker, I want urgent messages automatically flagged so that I don't miss time-sensitive requests.

**Implementation:**

- Cloud Function trigger on every new message (onCreate)
- Pattern matching + LLM classification
- Check for: "urgent", "ASAP", "deadline", questions directed at user
- Set `priority: true` flag on message doc
- Send push notification even if user muted conversation

**Detection Patterns:**

- Keywords: urgent, ASAP, emergency, critical, deadline
- Questions: "Can you...?", "Did you...?", "When will...?"
- Direct mentions: "@Alice can you review?"
- Dates: "needs to be done by EOD", "due tomorrow"

**Success Criteria:**

- Detects priority with 80%+ accuracy
- Low false positive rate (< 10%)
- Runs within 500ms (doesn't slow message delivery)
- Clear visual indicator (red flag or bold border)

---

#### 4. Decision Tracking

**User Story:**
As a remote worker, I want a log of all team decisions so that I have a single source of truth.

**Implementation:**

- Cloud Function monitors messages for decision language
- Pattern matching: "let's go with", "approved", "decided", "we'll use"
- LLM extracts: What was decided? When? Who approved?
- Stores as AI Insight with type='decision'
- Dedicated "Decisions" tab shows all logged decisions

**Example Logged Decision:**

```
Decision (Jan 15, 2025):
"Use PostgreSQL instead of MongoDB for primary database"

Context: After discussing scalability and team familiarity, 
the team chose PostgreSQL. Alice and Bob approved.

Related messages: [links to 3 messages]
```

**Success Criteria:**

- Detects 70%+ of actual decisions
- Low false positives
- Decisions are searchable and linkable

---

#### 5. Proactive Assistant (Advanced Feature)

**User Story:**
As a remote worker, when someone asks "when can we meet?", I want the AI to offer to help coordinate schedules.

**Implementation:**

**Pattern Detection:**

```javascript
const schedulingPatterns = [
  /when (can|should|are) (we|you|everyone)/i,
  /schedule|meeting|call|sync/i,
  /available|free time|calendar/i,
  /(what|which) time works/i
];
```

**Proactive Flow:**

1. User A: "When can we all sync on the API redesign?"
2. AI detects scheduling language
3. AI creates Insight with suggestion: "Would you like me to help find a time that works for everyone?"
4. User A taps "Yes"
5. AI suggests: "Based on recent messages, here are times that might work: Tuesday 2-3pm, Wednesday 10-11am"

**Success Criteria:**

- Detects scheduling needs with 80%+ accuracy
- Suggestions are relevant and helpful
- Doesn't interrupt flow (shows as dismissible card)
- Low false positive rate

---

## Out of Scope for MVP

### Features NOT Included:

- Voice messages or calls
- Video calls
- Message reactions (👍, ❤️)
- Message editing or deletion
- Message forwarding
- @ mentions with notifications
- Channels or threaded replies
- File sharing (PDFs, docs)
- Location sharing
- Poll creation
- Message pinning
- Multi-device sync (same account on multiple devices)
- Desktop or web client
- End-to-end encryption
- Self-destructing messages

### AI Features NOT Included:

- Real-time translation
- Auto-reply suggestions
- Sentiment analysis
- Meeting notes generation
- Email integration
- Calendar integration
- CRM integration

---

## Testing Scenarios

### Core Messaging Tests:

1. **Two-device real-time:** Open app on 2 devices, send messages, verify instant delivery
2. **Offline send:** Turn off wifi, send message, turn on wifi, verify it sends
3. **Offline receive:** Device A offline, Device B sends 5 messages, Device A comes online → sees all 5
4. **App lifecycle:** Send message, force-quit app, reopen → message is there
5. **Rapid-fire:** Send 20 messages quickly → all sync without loss or duplication
6. **Group chat:** 3 users in group, all send messages simultaneously → all see everything
7. **Read receipts:** User A sends message, User B opens conversation → User A sees blue checkmarks
8. **Typing indicator:** User A types → User B sees "Alice is typing..." (RTDB)
9. **Presence:** User A opens app → User B sees green dot; User A closes app → User B sees gray dot (RTDB)
10. **Images:** Send image → recipient sees it inline; tap → full-screen view

### AI Feature Tests:

11. **Summarization:** 50-message thread → tap "Summarize" → see 3-bullet summary within 3s
12. **Action items:** Conversation mentions tasks → tap "Action items" → see list with owners
13. **Priority detection:** Send "URGENT: Deploy is broken" → message flagged as priority
14. **Decision tracking:** Message says "let's go with Option B" → logged as decision
15. **Proactive assistant:** Ask "when can we meet?" → AI suggests helping with scheduling

---

## Success Metrics for MVP Checkpoint

1. **Two users can exchange messages** in real-time across different devices
2. **Messages appear instantly** with optimistic UI (<100ms local, <500ms remote)
3. **Offline scenario works:** Send 3 messages offline → reconnect → all 3 send successfully
4. **App lifecycle:** Force-quit mid-conversation → reopen → all messages present
5. **Group chat works:** 3 users sending messages simultaneously without loss
6. **Read receipts compute** correctly from `lastSeenAt`
7. **Typing indicators** appear within 100ms (RTDB)
8. **Presence updates** within 200ms (RTDB)
9. **Push notifications fire** (at minimum: foreground notifications)

---

## Success Metrics for Final Submission

### Messaging Infrastructure:

- All MVP requirements passing ✓
- Supports 5+ concurrent users without degradation
- Messages sync reliably (<500ms) even on 3G
- Zero message loss in offline/online transitions
- Read receipts work 100% reliably
- Typing/presence use RTDB (fast + cheap)

### AI Features:

- All 5 required AI features implemented and working
- Proactive Assistant detects scheduling needs accurately
- AI responses generate within 3 seconds
- AI features feel helpful (not gimmicky)

### Deployment:

- Publicly accessible via TestFlight/APK/Expo Go
- 5 users tested simultaneously without issues
- Demo video shows all features clearly
- README has complete setup instructions

---

## Known Limitations & Trade-offs

1. **Firestore offline persistence:** Works great, but multiple tabs can conflict (mobile = no issue)
2. **Basic image support:** No video, no file sharing
3. **No message editing:** Can't edit or delete sent messages
4. **No multi-device:** Same account can't be logged in on 2 devices simultaneously
5. **AI rate limits:** Free tier token limits may restrict heavy usage
6. **No end-to-end encryption:** Messages stored in plaintext on Firebase
7. **Mobile only:** Not optimized for tablets or desktop
8. **Read receipts approximation:** Based on `lastSeenAt` (not per-message precision)

---

## Risk Mitigation

**Biggest Risk:** Firestore costs exploding  
**Mitigation:** Aggressive query scoping; pagination; monitor Firebase console daily

**Second Risk:** RTDB typing/presence not cleaning up  
**Mitigation:** Use `onDisconnect()` carefully; test on physical device

**Third Risk:** Push notifications failing on physical devices  
**Mitigation:** Test early on real iOS/Android hardware; FCM setup can be tricky

**Fourth Risk:** AI features taking longer than expected  
**Mitigation:** Prioritize summarization first; reuse RAG pipeline for others

**Fifth Risk:** Offline sync edge cases  
**Mitigation:** Trust Firestore offline persistence; test airplane mode scenarios thoroughly