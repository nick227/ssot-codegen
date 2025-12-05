# UI Development Roadmap - Dating App

**Strategy**: SDK-Driven, Server-Side Computation, Compatibility-First

---

## 🎯 Core Principle

**The compatibility engine is the product differentiator. UI must expose it prominently.**

**Compatibility computation is server-side only. UI displays results from SDK.**

---

## 📡 Architecture

**See COMPONENT_ARCHITECTURE.md for complete architecture details.**

**Data Flow**: Backend/Worker → Backend/API → SDK (Generated) → Domain Hooks → Page Components → UI Components

**Key Rule**: Server computes compatibility, sorts discovery queue. Client displays scores, adjusts priorities (triggers server recomputation). UI never computes compatibility, only displays SDK results.

---

## 🔄 Core User Flows

### 1. Discovery Flow (Server-Sorted)
- Swipe left/right, View compatibility breakdown, Adjust dimension priorities
- See "Why this match?" before swiping
- Server computes compatibility and sorts queue
- UI displays server-sorted queue

### 2. Match Flow (Server-Computed Compatibility)
- View match, See compatibility breakdown, Start conversation
- Compatibility score + mini breakdown visible (from server)

### 3. Messaging Flow (Behavior-Tracked)
- Send message (tracked), View thread, Read receipts
- Messages contribute to dimensions (via events)

### 4. Profile Flow (Dimension-Centric)
- Edit profile, View dimensions, Adjust priorities, Complete quizzes
- "Your Dimensions" always visible, quiz nudging
- Server recomputes compatibility when priorities change

### 5. Quiz Flow (Dimension-Shaping)
- Take quiz, View results, Like/dislike results (tracked)
- Quizzes shape dimensions, affect matches
- Server processes events, updates dimensions, recomputes compatibility

---

## 🧩 Component Library

### Tier 1: Foundation Components
- Layout: MobileLayout, MobileHeader, BottomNavigation, Container, Stack
- UI: Button, Card, Avatar, Badge, Modal, Input, Select, Slider, Skeleton, ButtonGroup
- Feedback: Toast, Alert, LoadingSpinner, EmptyState

### Tier 2: Domain Components (Server-Driven)

#### Compatibility Components (HIGH PRIORITY)
- **CompatibilityPill**: Small compatibility score badge (0-100 from server), color coding. Variants: small, medium, large
- **CompatibilityBreakdown**: Dimension breakdown panel (scores from server), weights, categories. Variants: compact, detailed, explanatory
- **WhyMatchPanel**: "Why this match?" explanation (top 3 dimensions from server), distance, quiz overlap. Variants: micro-modal, panel
- **DimensionPriorityEditor**: Priority weight editor with sliders. Updates priorities → Invalidates queries → Server recomputes
- **DimensionBadges**: Visual dimension indicators (top N from server). Variants: horizontal, vertical

#### Profile Components
- **ProfileCard**: Profile preview card with compatibility pill (server), dimension badges (server). Variants: compact, detailed, match, discovery
- **ProfileHeader**: Profile header with photo carousel, compatibility score (if viewing other user)
- **ProfileSection**: Profile detail section (About, Interests, Lifestyle, Dimensions)

#### Discovery Components
- **DiscoveryCardStack**: Swipeable card stack from server-sorted queue, compatibility pill visible
- **DiscoveryListView**: List view alternative from server-sorted queue
- **DiscoveryViewToggle**: Toggle between swipe/list modes
- **DiscoveryFilters**: Filter panel with age, distance, gender, quick dimension priority tweak (triggers server recomputation)

#### Match Components
- **MatchCard**: Match preview card with compatibility pill (server), last message preview, unread count
- **MatchList**: Scrollable list of matches, sort by compatibility option

#### Message Components
- **MessageBubble**: Individual message (sent/received), content, timestamp, read receipt
- **MessageInput**: Message composer, tracks message_sent events
- **MessageThread**: Conversation thread, real-time via WebSocket, tracks match_view events

#### Quiz Components
- **QuizCard**: Quiz preview card, shows "Strengthens X dimension"
- **QuizQuestion**: Question component with renderer registry (multiple choice, Likert, slider, ranking, text input, matrix), tracks quiz_open, quiz_take events
- **QuizResults**: Quiz results display, dimension breakdown, like/dislike actions, tracks quiz_like, quiz_dislike events
- **QuizNudge**: Inline quiz suggestion ("Improve matches by answering X more questions")

---

## 📊 Data Contracts (UI DTOs)

**See COMPONENT_ARCHITECTURE.md for complete UI DTO definitions.**

Key DTOs: ProfileSummary, CompatibilityBreakdown, MatchSummary, QuizQuestionUI

---

## 🎯 Development Phases

### Phase 1: Foundation + SDK Setup (Week 1)
- SDK Integration: Set up `createSDK()` factory, SDK provider/context, `useSDK()` hook, `useEmitBehaviorEvent()` hook
- Foundation Components: Card, Button, Avatar, Modal, Input, Slider, Skeleton, ButtonGroup
- Deliverable: SDK ready, component library ready

### Phase 2: Profile + Onboarding (Week 2)
- Hooks: `useProfileSummary(userId)`, `useUserDimensions(userId)`
- Components: ProfileCard, ProfileHeader, ProfileSection, PhotoUpload
- Pages: ProfilePage (self), ProfileViewPage (other user)
- MVP Onboarding: Create profile, answer seed quiz, see first matches with compatibility visible
- Deliverable: Users can create profiles and see basic compatibility (server-computed)

### Phase 3: Discovery + Basic Compatibility (Week 3)
- Hooks: `useDiscoveryFeed(filters, priorities)` (server-sorted), `useCompatibility(userId, otherUserId)` (server-computed)
- Components: CompatibilityPill, CompatibilityBreakdown, WhyMatchPanel, DiscoveryCardStack, DiscoveryListView, DiscoveryViewToggle, SwipeIndicator, DiscoveryFilters
- Pages: DiscoveryPage
- Deliverable: Users can discover with compatibility visible (server-computed)

### Phase 4: Matches + Messaging (Week 4)
- Hooks: `useMatches(userId)` (server-sorted), `useMessageThread(matchId)` (HTTP + WebSocket), `useSendMessage(matchId)`
- Components: MatchCard, MatchList, MessageBubble, MessageInput, MessageThread, MessageList
- Pages: MatchesPage, MessagesPage
- Deliverable: Users can view matches and message (real-time via WebSocket)

### Phase 5: Quiz System (Week 5)
- Hooks: `useQuizzes()`, `useQuiz(quizId)`, quiz submission hook
- Components: QuizCard, QuizQuestion (with renderer registry), QuizResults, QuizNudge
- Pages: QuizPage
- Deliverable: Users can take quizzes that shape dimensions (events tracked, server recomputes)

### Phase 6: Dimension Priority + Advanced Compatibility (Week 6)
- Hooks: `useDimensionPriorities(userId)`, `useUpdateDimensionPriority(dimensionId, weight)` (invalidates discovery/compatibility queries)
- Components: DimensionPriorityEditor (triggers server recomputation), CompatibilityBreakdown (detailed), DimensionBadges, WhyMatchPanel (enhanced), YourDimensionsPanel
- Pages: DiscoveryFilters (with dimension priority tweak), Dimension-Driven Discovery
- Deliverable: Users can control priorities (triggers server recomputation), see full compatibility

### Phase 7: Polish + Advanced Features (Week 7)
- Insight pages/panels, Advanced animations, Performance optimizations (see PERFORMANCE_GUIDELINES.md), Accessibility enhancements
- Deliverable: Polished, production-ready UI

---

## 🔄 State Management

### Global State (Zustand)
- User auth, activeMatchId, discoveryViewMode
- Use for: Data shared across multiple pages, UI preferences

### Server State (React Query)
- Discovery (server-sorted queue), Compatibility (server-computed), Matches (server-sorted), Messages (HTTP + WebSocket), Profile, Quizzes, Dimensions
- Use for: All API data, caching, background refetching

### Local State (useState)
- Form editing, modals, filters, ephemeral UI toggles
- Use for: Component-specific state, form inputs, UI toggles

---

## 🎯 Optimistic Updates

### Swipes
- Optimistic: Remove card from stack immediately
- Sync with server, rollback on error (refetch discovery queue)

### Messages
- Optimistic: Show message as "sending"
- Replace temp with real message on success, mark as failed on error

### Dimension Priority Updates
- Update priority on server
- Invalidate queries (server recomputes compatibility)
- UI displays new results

---

## 🎨 Event Emission

**Single Hook**: `useEmitBehaviorEvent()` - One hook for all behavior events.

**See COMPONENT_ARCHITECTURE.md for complete event emission table.**

---

## ♿ Accessibility & Gestures

### Non-Gesture Path (CRITICAL)
- Always provide explicit Like/Dislike buttons, even when swipe is available

### Gesture Zones
- Swipe zone: Card body only (not buttons, not header)
- Tap zones: Buttons, "Why match?" link, profile photo
- Scroll zone: List container (not cards)

### ARIA Patterns
- ProfileCard: role="article", aria-label with name, age, compatibility score
- Buttons: aria-label with action and target name

### Undo Last Swipe
- Toast shows for 3 seconds after swipe
- Action: Reverts swipe, restores card to stack

---

## 🧪 Testing Strategy

### E2E Tests (UI + SDK + API)
**UI Contract**: Call hook → Invalidate queries → Display new data

1. **Changing priorities → discovery feed adjusts**
   - UI: Call `useUpdateDimensionPriority` hook
   - SDK: Invalidates `['discovery']` query
   - API: Server recomputes compatibility
   - UI: Discovery feed refreshes with new order

2. **Completing quiz → compatibility scores update**
   - UI: Complete quiz via hook
   - SDK: Emits `quiz_take` event
   - API: Server processes event, updates dimensions, recomputes compatibility
   - UI: Invalidate `['compatibility']` queries, display new scores

**UI Responsibility**:
- Call right hook when priorities change
- Invalidate right queries (`['discovery']`, `['compatibility']`)
- Visually update once new data arrives
- **Math is not UI invariant** - only "UI reacts when data changes"

### Visual/Snapshot Tests
- CompatibilityBreakdown: Color coding, dimension ordering (from server), weight visualization
- QuizQuestion Types: Each question type renderer, answer validation, progress indicator

### Component Tests
- ProfileCard: All variants render correctly, compatibility pill visibility (displays server score), action buttons, event emission
- CompatibilityBreakdown: Different dimension counts (from server), missing data, explanatory mode
- QuizQuestion renderers: Each question type, validation, answer submission

---

## 📐 Dimension-Driven Discovery

### Filter by Dimension
- Standard filters: Age range, distance, gender preferences
- Dimension filter: Select dimension, minimum score slider
- Triggers server recomputation

### Sort by Dimension
- Options: Compatibility, Distance, Individual dimensions (e.g., Family Values, Music Interest)
- Server handles sorting

---

## 🎯 Success Metrics

### Compatibility Exposure
- Target: Compatibility visible on 100% of discovery cards
- Measure: A/B test with/without compatibility badges

### Dimension Engagement
- Target: 30%+ of users adjust dimension priorities
- Measure: Analytics on DimensionPriorityEditor usage

### Quiz Completion
- Target: 50%+ of users complete at least one quiz
- Measure: Quiz completion rate

### Behavior Event Coverage
- Target: 100% of tracked interactions emit events
- Measure: Event coverage audit

---

## ✅ Key Architectural Decisions

1. **Server-Side Computation**: Compatibility computed on server, never client
2. **SDK-Driven**: All data from SDK, never raw fetch
3. **Hook Abstraction**: Pages use hooks, not direct SDK calls
4. **UI DTOs**: Explicit contracts between SDK and components
5. **Real-Time**: WebSocket for messages, optional for matches
6. **Event Tracking**: Single `useEmitBehaviorEvent()` hook
7. **Priority Changes**: Trigger server recomputation, UI invalidates queries

---

**This roadmap ensures compatibility is server-computed, UI displays results, and priorities trigger server recomputation.**
