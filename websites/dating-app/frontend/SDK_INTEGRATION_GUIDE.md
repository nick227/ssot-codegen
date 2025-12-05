# SDK Integration Guide - Dating App Frontend

**Strategy**: All data access via generated SDK, never raw fetch

**Architecture**: See COMPONENT_ARCHITECTURE.md for architecture layers and data flow.

---

## 📡 SDK Setup

### 1. Initialize SDK
- Create `createSDK()` factory with baseURL and transport ('hybrid' for HTTP + WebSocket)
- Export SDK instance and type

### 2. SDK Provider
- Create React context for SDK
- Provide SDK via `SDKProvider` component
- Create `useSDK()` hook to access SDK from context

---

## 🎣 Domain Hooks Pattern

### Hook Structure
- Hook wraps SDK calls, handles loading/error states, manages cache
- Uses React Query for caching and state management
- Returns data, isLoading, error states

### Key Hooks

#### useProfileSummary
- Calls: `api.profile.get(userId)` + `api.compatibilityScore.get()` (optional)
- Maps to ProfileSummary DTO
- Cache: 5 minutes stale time

#### useDiscoveryFeed
- Calls: `api.discoveryService.getQueue({ filters, priorities })` - Server-sorted queue
- Maps to ProfileSummary[] DTOs
- Cache: 2 minutes stale time

#### useCompatibility
- Calls: `api.compatibilityScore.get(userId1, userId2)` - Server-computed
- Returns CompatibilityBreakdown DTO
- Cache: 5 minutes stale time, 15 minutes cache time

#### useMessageThread (Real-Time)
- Initial fetch: HTTP via `api.message.list({ where: { matchId } })`
- Real-time subscription: WebSocket via `api.message.onUpdate(matchId, callback)`
- Updates React Query cache on new messages

#### useEmitBehaviorEvent
- Single hook for all behavior events
- Calls: `api.behaviorEvent.create(event)`
- Handles errors gracefully

---

## 🔍 Search Integration

**Search happens in hooks, not components**:
- `useMatches(userId, searchTerm)` - SDK handles search engine internally
- Components just pass search term to hook
- Hook includes search in SDK call

---

## 🎯 Component Usage Pattern

### ProfileCard Component
- Uses: `useProfileSummary(userId)`, `useEmitBehaviorEvent()`
- Tracks profile_view on mount/visible
- Emits profile_like/profile_dislike on actions
- Displays compatibility pill (from server)

### DiscoveryPage
- Uses: `useDiscoveryFeed(filters, priorities)`, `useEmitBehaviorEvent()`
- Displays server-sorted queue
- Emits events on swipe actions

### MessagesPage
- Uses: `useMessageThread(matchId)` (HTTP + WebSocket), `useSendMessage(matchId)`, `useEmitBehaviorEvent()`
- Real-time message updates via WebSocket
- Emits message_sent events

---

## ✅ Key Patterns

1. **SDK → Hooks → Components → Pages**
2. **Hooks encapsulate SDK calls**, handle loading/error
3. **Components never call SDK directly**
4. **Real-time via WebSocket subscriptions** in hooks
5. **Search integrated in hooks**, not components
6. **Events emitted via single hook** (`useEmitBehaviorEvent`)
7. **Compatibility server-computed**, UI displays results
8. **Priority changes trigger server recomputation**, UI invalidates queries

---

**This ensures SDK is the single source of truth for all data access, and compatibility computation stays server-side.**
