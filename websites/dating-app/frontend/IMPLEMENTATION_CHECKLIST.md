# Front-End Implementation Checklist

**High-level implementation steps for the dating app frontend**

---

## Phase 1: Foundation & SDK Setup

### SDK Integration
- [x] Set up SDK factory (`createSDK()`)
- [x] Create SDK provider and context
- [x] Implement `useSDK()` hook
- [ ] Configure WebSocket transport for real-time

### Foundation Components
- [x] `Card` (all variants)
- [x] `Button` (all variants)
- [x] `Input` (all variants)
- [x] `MediaLoader` (carousel, gallery, single)
- [x] `Badge` and `BadgeGroup`
- [x] `Slider` (priority, quiz)
- [x] `ProgressBar`
- [x] `ButtonGroup` (tabs, actions)

### Layout Components
- [x] `MobileLayout` with safe areas
- [x] `MobileHeader` with back button support
- [x] `BottomNavigation` (5 tabs)
- [x] `CardStack` (swipeable)
- [x] `ListView` (virtualized)

**Deliverable**: SDK ready, foundation components render correctly

---

## Phase 2: Profile & Onboarding

### Hooks
- [x] `useProfileSummary(userId)`
- [x] `useUserDimensions(userId)`
- [x] `useEmitBehaviorEvent()` (single hook for all events)

### Components
- [x] `Card` (dimension variant)
- [x] `MediaLoader` (carousel)
- [x] `InfoCard` (quiz nudge)

### Pages
- [x] `ProfilePage` (self) - Edit mode, dimensions grid, priority sliders
- [x] `ProfileViewPage` (other user) - Photo carousel, compatibility badge, breakdown (integrated into ProfilePage)

### MVP Onboarding Flow
- [ ] Create profile form
- [ ] Seed quiz completion
- [ ] Display first matches with compatibility visible

**Deliverable**: Users can create profiles and see basic compatibility

---

## Phase 3: Discovery & Compatibility

### Hooks
- [x] `useDiscoveryFeed(filters, priorities)` - Server-sorted queue
- [x] `useCompatibility(userId, otherUserId)` - Server-computed breakdown

### Components
- [x] `CompatibilityBadge` (small, medium, large variants)
- [x] `CompatibilityBreakdown` (compact, detailed, explanatory variants)
- [ ] `InfoPanel` (micro-modal, panel variants)
- [ ] `ViewToggle` (swipe/list)
- [ ] `FilterPanel` (bottom sheet)

### Pages
- [x] `DiscoveryPage` - Card stack with swipe, compatibility badges, filters

**Deliverable**: Users can discover with compatibility visible

---

## Phase 4: Matches & Messaging

### Hooks
- [x] `useMatches(userId)` - Server-sorted matches
- [x] `useMessageThread(matchId)` - HTTP + WebSocket
- [x] `useSendMessage(matchId)`

### Components
- [x] `Bubble` (sent/received variants) - Integrated in MessagesPage
- [x] `MessageThread` container - Integrated in MessagesPage
- [x] `Input` (message variant)

### Pages
- [x] `MatchesPage` - Match list with compatibility, message previews
- [x] `MessagesPage` - Thread list and conversation view

**Deliverable**: Users can view matches and message (real-time)

---

## Phase 5: Quiz System

### Hooks
- [x] `useQuizzes()` ✅ **DONE**
- [x] `useQuiz(quizId)` ✅ **DONE**
- [x] Quiz submission hook ✅ **DONE**

### Components
- [x] `Input` (quiz variant with type registry) ✅ **DONE**
- [x] `Card` (result variant) ✅ **DONE**
- [x] Question type renderers (multiple choice, Likert, slider, ranking, text, matrix) ✅ **DONE**

### Pages
- [x] `QuizPage` - Question flow, progress bar, results display ✅ **DONE**
- [x] `QuizListPage` - Quiz list with completion status ✅ **DONE**

**Deliverable**: Users can take quizzes that shape dimensions ✅ **COMPLETE**

---

## Phase 6: Dimension Priorities & Advanced Compatibility

### Hooks
- [ ] `useDimensionPriorities(userId)`
- [ ] `useUpdateDimensionPriority(dimensionId, weight)` - Invalidates queries

### Components
- [ ] `Slider` (priority variant with real-time feedback)
- [ ] `CompatibilityBreakdown` (detailed variant)
- [ ] `InfoPanel` (enhanced)

### Integration
- [ ] Priority changes trigger server recomputation
- [ ] Discovery feed updates when priorities change
- [ ] Compatibility scores refresh automatically

**Deliverable**: Users can control priorities and see full compatibility

---

## Phase 7: Polish & Optimization

### Performance
- [ ] Memoize expensive components (`Card`, `CompatibilityBadge`, `BadgeGroup`)
- [ ] Virtualize long lists (`ListView`, `MessageThread`)
- [ ] Debounce event emissions (`useEmitBehaviorEvent`)
- [ ] Optimize React Query cache times

### Accessibility
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation support
- [ ] Screen reader testing
- [ ] Button alternatives for swipe gestures

### Polish
- [x] Loading states (skeletons, spinners) ✅ **DONE**
- [x] Empty states (all pages) ✅ **DONE**
- [ ] Error boundaries
- [ ] Smooth animations and transitions

**Deliverable**: Polished, production-ready UI

---

## Cross-Cutting Concerns

### Event Tracking
- [x] Implement `useEmitBehaviorEvent()` hook ✅ **DONE**
- [x] Emit events for all tracked interactions (profile_view, profile_like, quiz_take, etc.) ✅ **DONE**
- [ ] Batch rapid events where appropriate

### State Management
- [ ] Set up Zustand for global state (auth, activeMatchId, viewMode)
- [x] Configure React Query for server state ✅ **DONE**
- [x] Implement optimistic updates (swipes, messages, priorities) ✅ **DONE** (basic)

### Real-Time
- [ ] WebSocket connection management
- [ ] Message thread real-time updates
- [ ] Optional match subscription

### Testing
- [ ] E2E tests for priority changes → discovery feed updates
- [ ] E2E tests for quiz completion → compatibility updates
- [ ] Component tests for compatibility UI
- [ ] Visual/snapshot tests for question types

---

## Quick Reference

**Key Hooks**: `useDiscoveryFeed`, `useCompatibility`, `useMatches`, `useMessageThread`, `useEmitBehaviorEvent`

**Key Components**: `Card`, `Button`, `Input`, `MediaLoader`, `CompatibilityBadge`, `CompatibilityBreakdown`

**Key Pages**: Discovery, Matches, Messages, Profile (Self), Profile (Other), Quiz

**Architecture**: SDK → Hooks → Pages → Components

---

**See individual page documents (`PAGES_*.md`) and `COMPONENTS.md` for detailed specifications.**

