# Component Architecture - Dating App

**Strategy**: SDK-Driven, Compatibility-First, Server-Side Computation

---

## 🎯 Core Principle

**Components must expose compatibility and dimensions prominently, not hide them.**

**Compatibility computation is server-side only. UI displays results from SDK.**

---

## 📡 Architecture Layers (Canonical)

**Backend/Worker**: Raw score normalization, dimension math, system dimension formulas

**Backend/API**: GET /discovery/queue (profiles sorted by compatibility), GET /compatibility/:userId/:otherUserId (breakdown)

**SDK (Generated)**: `api.discoveryService.getQueue()`, `api.compatibilityScore.get()`, `api.behaviorEvent.create()`

**Domain Hooks (Hand-written)**: `useDiscoveryFeed()`, `useCompatibility()`, `useEmitBehaviorEvent()`

**Page Components**: DiscoveryPage, MatchesPage, etc.

**UI Components**: ProfileCard, CompatibilityPill, etc.

**Rule**: Server computes compatibility, sorts discovery queue. Client displays scores, adjusts priorities (triggers server recomputation). UI never computes compatibility, only displays SDK results.

---

### Domain Hooks

**These are what pages actually use** - they abstract SDK calls:

- **Discovery**: `useDiscoveryFeed(filters, priorities)` → Server-sorted queue
- **Compatibility**: `useCompatibility(userId, otherUserId)` → Server-computed breakdown
- **Matches**: `useMatches(userId)` → Server-sorted matches
- **Messages**: `useMessageThread(matchId)` → Real-time messages (HTTP + WebSocket)
- **Profile**: `useProfileSummary(userId)`, `useUserDimensions(userId)`
- **Quizzes**: `useQuizzes()`, `useQuiz(quizId)`
- **Dimension Priorities**: `useDimensionPriorities(userId)`, `useUpdateDimensionPriority(dimensionId, weight)` → Invalidates discovery/compatibility queries
- **Behavior Events**: `useEmitBehaviorEvent()` → Single hook for all events

**Pattern**: Hooks encapsulate SDK calls, handle loading/error states, manage cache invalidation.

**See SDK_INTEGRATION_GUIDE.md for detailed hook implementation patterns.**

---

## 📊 UI DTOs (Data Transfer Objects)

**UI-level shapes derived from SDK types** - explicit contracts between SDK and components:

### ProfileSummary
- Fields: id, name, age, distance, primaryPhoto, compatibilityScore (0-100 from server), badges, topDimensions (top 3 from server), location, bio
- Source: `api.discoveryService.getQueue()` or `api.profile.get(id)` + `api.compatibilityScore.get()`

### CompatibilityBreakdown
- Fields: overallScore (0-100 from server), dimensions array, calculatedAt
- Dimension fields: dimensionId, label, compatibility (0-100 from server), weight (0.0-10.0), category, explanation (from server)
- Source: `api.compatibilityScore.get(userId1, userId2)` - Server-computed, never client-computed

### MatchSummary
- Fields: id, userId, profile (ProfileSummary), compatibilityScore (0-100 from server), lastMessage, unreadCount, createdAt
- Source: `api.match.list()` (server-sorted) + `api.compatibilityScore.get()`

### QuizQuestionUI
- Fields: id, quizId, type (enum), prompt, order, config (options, min/max, step, maxLength, rows), required
- Source: `api.quizQuestion.get(id)` (config from `configJson` field)

---

## 🔄 Real-Time Integration

### Messaging (WebSocket)
- Initial fetch: HTTP via `api.message.list({ where: { matchId } })`
- Real-time subscription: WebSocket via `api.message.onUpdate(matchId, callback)`
- Pattern: HTTP first (initial load), then WebSocket for updates

### Matches (Optional WebSocket)
- Subscribe to new matches via `api.match.onUpdate(userId, callback)`

---

## 🔍 Search Integration

**Search happens in hooks, not components**:
- `useMatches(userId, searchTerm)` - SDK handles search engine
- Implementation: Inside hooks, components just pass search term

---

## 🎯 Event Emission & Tracking

**Single hook pattern**: `useEmitBehaviorEvent()` - one hook, consistent usage.

### Event Emission Table

| Component/Interaction | Event Type | When Fired | Meta Required |
|----------------------|------------|------------|---------------|
| ProfileCard (on mount/visible) | `profile_view` | When card becomes visible | `profile_meta`, `compatibility_score`, `source` |
| ProfileCard (on like) | `profile_like` | On like button click | `profile_meta`, `compatibility_score` |
| ProfileCard (on dislike) | `profile_dislike` | On dislike button click | `profile_meta` |
| DiscoveryCardStack (on swipe) | `profile_like` / `profile_dislike` | After swipe completes | `profile_meta`, `discovery_position` |
| QuizCard (on open) | `quiz_open` | When quiz page/view visible | `quiz_meta`, `source` |
| QuizPage (on submit) | `quiz_take` | On quiz completion | `quiz_meta`, `quiz_result_id`, `completion_time_seconds` |
| QuizResults (on like) | `quiz_like` | On like result click | `quiz_meta`, `quiz_result_id`, `match_strength` |
| QuizResults (on dislike) | `quiz_dislike` | On dislike result click | `quiz_meta`, `quiz_result_id` |
| MessageInput (on send) | `message_sent` | On successful send | `match_id`, `message_length`, `response_time_seconds`, `is_first_message` |
| MessageThread (on view) | `match_view` | When thread becomes visible | `match_id` |

**Usage**: Components call `useEmitBehaviorEvent()` hook, emit events with required meta.

---

## 💡 Compatibility UI (Server-Driven)

**useCompatibility hook**:
- Calls `api.compatibilityScore.get(userId1, userId2)` - Server-computed compatibility
- Returns: overallScore (0-100 from server), breakdown (from server), isLoading, error
- UI Responsibility: Display server-computed scores, adjust priorities (triggers server recomputation)

---

## 🔄 Discovery Feed (Server-Sorted)

**useDiscoveryFeed hook**:
- Calls `api.discoveryService.getQueue({ filters, priorities })` - Server-sorted queue (compatibility already computed)
- Maps to UI DTOs (no computation, just mapping)
- Server Responsibility: Compute compatibility for each candidate, sort by compatibility score, apply filters, return sorted queue
- Client Responsibility: Display sorted queue (trust server order), adjust priorities (invalidates query, triggers server recomputation)

---

## 📊 Component Reusability Matrix

| Component | Discovery | Matches | Messages | Profile | Quiz | Reuse Score | Priority |
|-----------|-----------|---------|----------|---------|------|-------------|----------|
| **CompatibilityPill** | ✅ | ✅ | ❌ | ✅ | ❌ | 3/5 | **HIGH** |
| **CompatibilityBreakdown** | ✅ | ✅ | ❌ | ✅ | ✅ | 4/5 | **HIGH** |
| **WhyMatchPanel** | ✅ | ✅ | ❌ | ✅ | ❌ | 3/5 | **HIGH** |
| **ProfileCard** | ✅ | ✅ | ✅ | ✅ | ❌ | 4/5 | **HIGH** |
| **Card** | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 | **HIGH** |
| **Button** | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 | **HIGH** |
| **Avatar** | ✅ | ✅ | ✅ | ✅ | ❌ | 4/5 | **HIGH** |
| **Modal** | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 | **HIGH** |
| **DimensionBadges** | ✅ | ✅ | ❌ | ✅ | ❌ | 3/5 | **MEDIUM** |
| **DimensionPriorityEditor** | ✅ | ❌ | ❌ | ✅ | ❌ | 2/5 | **MEDIUM** |
| **QuizNudge** | ✅ | ✅ | ❌ | ✅ | ❌ | 3/5 | **MEDIUM** |

---

## 📐 Page Composition Patterns (SDK-Driven)

### Pattern 1: Discovery Page
- Uses: `useDiscoveryFeed(filters, priorities)` → Server-sorted queue
- Components: DiscoveryViewToggle, DiscoveryFilters, DiscoveryCardStack
- Key: Profiles already sorted by server, UI just displays

### Pattern 2: Matches Page
- Uses: `useMatches(userId)` → Server-sorted matches
- Components: MatchList, MatchCard (displays server-computed compatibility)

### Pattern 3: Messages Page (Real-Time)
- Uses: `useMessageThread(matchId)` → HTTP + WebSocket, `useSendMessage(matchId)`, `useEmitBehaviorEvent()`
- Components: MessageThread, MessageInput

### Pattern 4: Profile Page (Self)
- Uses: `useProfileSummary(userId)`, `useUserDimensions(userId)`, `useDimensionPriorities(userId)`, `useUpdateDimensionPriority()`
- Components: ProfileHeader, YourDimensionsPanel, DimensionPriorityEditor
- Key: Priority changes trigger server recomputation, UI invalidates queries

---

## 🎯 SDK → Hooks → Components → Pages Flow

**Backend/API** → **SDK (Generated)** → **Domain Hooks** → **Page Components** → **UI Components**

**Example**: `api.discoveryService.getQueue()` (server-sorted) → `useDiscoveryFeed()` → `DiscoveryPage` → `DiscoveryCardStack` → `ProfileCard`

---

## 🧪 Testing Strategy (UI Contract Focus)

### E2E Tests (UI + SDK + API)
**UI Contract**: Call hook → Invalidate queries → Display new data

1. **Changing priorities → discovery feed adjusts**: UI calls hook → SDK invalidates queries → API recomputes → UI displays new order
2. **Completing quiz → compatibility scores update**: UI completes quiz → SDK emits event → API processes → UI invalidates queries → UI displays new scores

**UI Responsibility**: Call right hook, invalidate right queries, visually update once new data arrives. Math is not UI invariant - only "UI reacts when data changes".

### Component Tests
- CompatibilityPill: Displays server score correctly
- CompatibilityBreakdown: Displays server breakdown correctly
- ProfileCard: Emits events correctly

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

**This architecture ensures compatibility is server-computed, UI displays results, and priorities trigger server recomputation.**
