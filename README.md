# MessageAI - Real Time Messaging with AI Features

production quality messaging infrastructure with intelligent ai capabilities for remote team professionals.

## overview

messageai is a real time messaging application built with react native and expo that leverages firebase for backend services and implements advanced ai features for team collaboration.

### key features

**core messaging (mvp)**
- user authentication with email/password and google sign in
- one on one messaging with real time delivery
- group chat support for 3+ participants
- offline support with automatic sync
- read receipts computed from last seen timestamps
- typing indicators using firebase realtime database
- online/offline presence tracking
- image sharing with firebase cloud storage
- push notifications for new messages

**ai features (full product)**
- thread summarization in 3 bullet points
- automatic action item extraction with owners
- priority message detection for urgent items
- decision tracking and logging
- proactive assistant for scheduling coordination

## tech stack

- **frontend**: react native with expo sdk 54
- **navigation**: expo router (file based routing)
- **backend**: firebase
  - cloud firestore (messages, users, conversations)
  - realtime database (typing, presence)
  - authentication (email/password + google)
  - cloud storage (images)
  - cloud messaging (push notifications)
- **ui components**: react native paper
- **state management**: react context + usereducer
- **ai integration**: openai gpt 4 or claude via cloud functions

## prerequisites

before you begin, ensure you have:

- **node.js** (v18 or later) - [download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **expo go app** on your mobile device:
  - [ios app store](https://apps.apple.com/app/expo-go/id982107779)
  - [google play store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **firebase account** - [create one here](https://firebase.google.com/)
- **git** for version control

### optional for native development

- **xcode** (for ios development on mac)
- **android studio** (for android development)

## setup instructions

### 1. clone the repository

```bash
git clone https://github.com/yourusername/messageai.git
cd messageai
```

### 2. install dependencies

```bash
npm install
```

this will install all required packages including:
- firebase sdk for backend services
- expo router for navigation
- react native paper for ui components
- expo notifications for push notifications
- expo image picker for image sharing

### 3. configure firebase

#### create firebase project

1. go to [firebase console](https://console.firebase.google.com/)
2. click "add project" and name it "messageai prod"
3. follow the setup wizard

#### enable firebase services

1. **authentication**:
   - go to authentication > sign in method
   - enable "email/password" provider
   - enable "google" provider

2. **cloud firestore**:
   - go to firestore database
   - click "create database"
   - start in test mode (we'll add security rules later)
   - choose a location closest to your users

3. **realtime database**:
   - go to realtime database
   - click "create database"
   - start in test mode

4. **cloud storage**:
   - go to storage
   - click "get started"
   - start in test mode

5. **cloud messaging (fcm)**:
   - go to project settings > cloud messaging
   - fcm is automatically enabled

#### get firebase configuration

1. in firebase console, go to project settings (gear icon)
2. scroll down to "your apps"
3. click the web icon (</>) to add a web app
4. register your app with a nickname (e.g., "messageai web")
5. copy the firebase configuration object

### 4. environment variables

1. create a `.env` file in the root directory (it's already in .gitignore)
2. copy the contents from `.env.example`
3. fill in your firebase configuration values:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
```

**important**: never commit your `.env` file to version control. it contains sensitive credentials.

### 5. run the development server

```bash
npx expo start
```

this will start the expo development server and show a qr code in your terminal.

### 6. open the app on your device

**option a: use expo go (recommended for quick testing)**
1. open the expo go app on your phone
2. scan the qr code from your terminal
3. the app will load on your device

**option b: use ios simulator (mac only)**
```bash
npx expo start --ios
```

**option c: use android emulator**
```bash
npx expo start --android
```

## project structure

```
messageai/
├── app/                          # expo router screens
│   ├── (auth)/                   # authentication screens
│   ├── (tabs)/                   # main tab navigation
│   ├── conversation/             # chat screens
│   └── _layout.tsx               # root layout with navigation
│
├── src/
│   ├── components/               # reusable ui components
│   ├── services/
│   │   └── firebase.ts          # firebase initialization with offline persistence
│   ├── hooks/                    # custom react hooks
│   ├── context/                  # react context providers
│   ├── utils/                    # helper functions
│   └── types/                    # typescript type definitions
│
├── assets/                       # images, fonts, icons
├── .env                          # environment variables (not in git)
├── .env.example                  # template for environment variables
├── app.json                      # expo configuration
├── package.json                  # dependencies
├── tsconfig.json                 # typescript configuration
└── README.md                     # this file
```

## firebase offline persistence

this app uses firestore offline persistence for seamless offline/online functionality:

- all messages are cached locally
- messages persist across app restarts
- can send messages while offline (queued automatically)
- automatic sync when connection is restored
- no message loss or duplication

implementation in `src/services/firebase.ts`:
```typescript
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // for react native
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
```

## architecture highlights

### real time synchronization

- **optimistic ui**: messages appear instantly (< 100ms from local cache)
- **firestore listeners**: real time updates from other users (< 500ms)
- **automatic sync**: firestore queues writes when offline, syncs on reconnect

### typing indicators and presence

- uses firebase realtime database (not firestore) for performance
- typing indicators update in < 100ms
- presence updates within 200ms
- `onDisconnect()` handlers for automatic cleanup

### read receipts

- no per message write cost
- computed client side from `lastSeenAt` timestamp
- single write per conversation view
- works for both 1 on 1 and group chats

## development workflow

### starting development

```bash
npm start
```

### running on specific platform

```bash
npm run ios      # ios simulator
npm run android  # android emulator
npm run web      # web browser
```

### linting

```bash
npm run lint
```

## testing the setup

after completing the setup, verify:

1. **expo dev server runs**: no errors in terminal
2. **app loads on device**: can view the app via expo go
3. **firebase initializes**: check console logs for firebase initialization messages
4. **no console errors**: terminal and app should be error free

example console output on successful firebase initialization:
```
[firebase] timestamp: 2025-01-15t10:00:00.000z - loading firebase configuration
[firebase] api key exists: true
[firebase] project id: messageai-prod
[firebase] timestamp: 2025-01-15t10:00:00.001z - initializing firebase app
[firebase] timestamp: 2025-01-15t10:00:00.002z - all firebase services initialized successfully
```

## troubleshooting

### common issues

**issue**: firebase initialization fails
- **solution**: verify all environment variables are set correctly in `.env`
- check that firebase project exists and services are enabled

**issue**: app doesn't load on expo go
- **solution**: ensure phone and computer are on same wifi network
- try restarting expo dev server
- clear expo go cache

**issue**: offline persistence not working
- **solution**: verify firestore is initialized with `experimentalForceLongPolling: true`
- check that firebase config is correct

**issue**: module not found errors
- **solution**: run `npm install` to ensure all dependencies are installed
- clear node modules and reinstall: `rm -rf node_modules && npm install`

## next steps

after completing pr #1 setup:

1. **pr #2**: implement authentication system
2. **pr #3**: build conversation list screen
3. **pr #4**: create chat screen with real time messages
4. **pr #5**: add typing indicators with rtdb
5. **pr #6**: implement presence and online status
6. **pr #7**: add group chat support
7. **pr #8**: enable image sharing
8. **pr #9**: set up push notifications

see `tasks.md` for complete development roadmap.

## documentation

- **architecture.md**: complete system architecture and data models
- **PRD.md**: product requirements and feature specifications
- **tasks.md**: detailed task breakdown for all prs

## performance targets

- message send latency: < 100ms (optimistic ui)
- message delivery: < 500ms (online recipients)
- app cold start: < 2 seconds
- typing indicator: < 100ms (rtdb)
- presence update: < 200ms (rtdb)
- ai feature response: < 3 seconds

## contributing

this project follows:
- **kiss principle**: keep it simple, stupid
- **dry principle**: don't repeat yourself
- **typescript strict mode**: no any types
- **comprehensive logging**: log everything for debugging

## license

private project for gauntlet ai submission.

## support

for issues or questions:
1. check troubleshooting section above
2. review firebase documentation
3. check expo documentation

## acknowledgments

built with:
- [expo](https://expo.dev/)
- [firebase](https://firebase.google.com/)
- [react native](https://reactnative.dev/)
- [react native paper](https://reactnativepaper.com/)

---

**status**: pr #1 complete - project setup and firebase configuration ✅

ready for pr #2: authentication system implementation
