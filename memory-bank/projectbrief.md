# MessageAI Project Brief

## Project Overview

**Name:** MessageAI  
**Type:** Real-Time Messaging App with AI Features  
**Platform:** Mobile (React Native + Expo)  
**Timeline:** 7-day sprint (MVP in 24 hours)  
**Status:** PR #3 Complete, PR #4 Next

---

## Mission Statement

build a production-quality messaging app for remote teams that combines instant communication with intelligent ai features to solve common remote work problems: thread overwhelm, decision archaeology, priority overload, and coordination friction.

---

## Target User

**Persona:** Remote Team Professional (Sarah, Software Engineer)

**scenario:**
- wakes up to 200+ unread messages
- needs to catch up on overnight discussions
- must identify urgent requests and action items
- wants to know what decisions were made

**current pain points:**
- scrolling through long threads takes 30+ minutes
- important messages buried in noise
- action items mentioned in chat get forgotten
- past decisions hard to find
- scheduling meetings takes 10+ messages back and forth

**how messageai solves this:**
1. tap "summarize" → 3 bullet point summary (30 seconds not 30 minutes)
2. action items automatically extracted with owners
3. urgent messages auto-flagged with priority indicator
4. decisions automatically logged with context
5. proactive assistant detects scheduling needs and offers help

---

## Product Strategy

### Phase 1: MVP - Solid Messaging Foundation (Current)

**goal:** build production-quality real-time messaging  
**timeline:** 9 prs over 3-4 days  
**features:**
- authentication (email/password + google)
- one-on-one messaging
- group chat (3+ users)
- offline support with automatic sync
- read receipts (computed from lastseenAt)
- typing indicators (rtdb)
- online/offline presence (rtdb)
- image sharing
- push notifications

**completed:**
- ✅ pr #1: project setup + firebase configuration
- ✅ pr #2: authentication system
- ✅ pr #3: conversation list screen

**next:**
- 🔄 pr #4: chat screen with real-time messages
- 📋 pr #5: typing indicators (rtdb)
- 📋 pr #6: presence and online status (rtdb)
- 📋 pr #7: group chat support
- 📋 pr #8: image sharing
- 📋 pr #9: push notifications

### Phase 2: AI Features Layer

**goal:** add intelligence on top of solid messaging  
**timeline:** 5 prs over 2-3 days  
**features:**
1. thread summarization (3 bullet points)
2. action item extraction (tasks with owners)
3. priority message detection (auto-flag urgent)
4. decision tracking (auto-log team agreements)
5. proactive assistant (scheduling coordination help)

### Phase 3: Polish & Deploy

**goal:** production-ready app with demo  
**timeline:** 2 prs over 1-2 days  
**deliverables:**
- security rules deployed
- testflight/apk build
- demo video (5-7 minutes)
- persona brainlift document
- social media post

---

## Technical Architecture

### Frontend
- react native + expo sdk 54
- typescript strict mode (no any types)
- expo router (file-based navigation)
- react native paper (ui components)

### Backend
- firebase auth (email/password + google)
- cloud firestore (messages, conversations, users)
- firebase realtime database (typing, presence)
- cloud storage (images)
- firebase cloud messaging (push notifications)
- cloud functions (ai features)

### AI Integration
- openai gpt-4 or claude
- called from cloud functions
- <3 second response time target

---

## Success Criteria

### MVP Checkpoint (24 hours)
- [x] two users can exchange messages in real-time
- [x] messages appear instantly with optimistic ui
- [x] offline scenario works (send/receive on reconnect)
- [ ] read receipts computed correctly
- [ ] group chat works (3+ users)
- [ ] typing indicators show within 100ms
- [ ] push notifications fire

### Final Submission (7 days)
- all 9 mvp prs complete
- all 5 ai features implemented
- supports 5+ concurrent users without degradation
- zero message loss in offline/online transitions
- ai responses generate within 3 seconds
- publicly accessible (testflight/apk/expo go)
- demo video shows all features
- comprehensive documentation

---

## Key Differentiators

### vs Slack/Teams
- simpler and more focused
- better mobile experience
- ai that actually helps (not just search)

### vs WhatsApp/Telegram
- designed for work conversations
- automatic task tracking and decision logging
- proactive assistant for coordination

### vs Notion/Linear
- real-time chat interface
- automatic structure extraction from unstructured conversations
- instant messaging, not async docs

---

## Core Principles

### 1. simplicity first (kiss)
- always choose simplest solution
- never add layers to fix layers
- direct over indirect always
- delete code rather than add workarounds

### 2. don't repeat yourself (dry)
- single source of truth
- extract repeated code into reusable components
- centralized configuration
- use composition over duplication

### 3. performance obsession
- messages appear instantly (<100ms)
- real-time delivery (<500ms)
- smooth scrolling always
- no lag or jank

### 4. offline-first
- app works without internet
- messages queue automatically
- firestore handles sync
- no user intervention needed

### 5. ai that helps, doesn't interrupt
- ai features are opt-in (tap to use)
- no intrusive suggestions
- only proactive when high confidence
- always dismissible

---

## Risk Mitigation

### Risk: Firestore costs exploding
**mitigation:** aggressive query scoping, pagination, monitor daily

### Risk: RTDB typing/presence not cleaning up
**mitigation:** use onDisconnect() carefully, test on physical device

### Risk: Push notifications failing on devices
**mitigation:** test early on real iOS/Android hardware

### Risk: AI features taking too long to build
**mitigation:** start with simplest (summarization), reuse patterns

### Risk: Offline sync edge cases
**mitigation:** trust firestore offline persistence, test airplane mode

---

## Development Standards

### code quality
- typescript strict mode (no any types)
- comprehensive logging with timestamps
- user-friendly error messages
- loading states for all async operations
- proper cleanup (unsubscribe listeners)

### testing approach
- test on physical devices (not just simulators)
- test offline scenarios thoroughly
- test app lifecycle (background/foreground/force-quit)
- test with multiple concurrent users

### git workflow
- commit after each pr completion
- descriptive commit messages
- no sensitive data in repository

---

## Current Status

**date:** january 2025  
**completed:** 3 of 9 mvp prs  
**next:** pr #4 - chat screen with real-time messages  
**blockers:** firebase credentials needed, composite index required

---

## Resources

### documentation
- /Users/max/messageai/architecture.md - full system architecture
- /Users/max/messageai/PRD.md - product requirements
- /Users/max/messageai/tasks.md - detailed task breakdown
- /Users/max/messageai/README.md - setup instructions

### key files
- src/services/firebase.ts - firebase initialization
- src/services/auth.ts - authentication operations
- src/services/firestore.ts - conversation + message crud
- src/context/AuthContext.tsx - auth state management
- src/types/index.ts - typescript interfaces

---

## Contact & Support

**project owner:** max  
**project path:** /Users/max/messageai  
**development environment:** macos 24.6.0, zsh shell

