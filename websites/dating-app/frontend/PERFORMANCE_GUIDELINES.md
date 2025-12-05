# Performance Guidelines - Dating App Frontend

**Focus**: React-specific optimizations, memory efficiency, data structure choices

---

## 🎯 Core Principle

**UI displays server-computed data. No client-side algorithmic computation.**

All complex calculations (compatibility, sorting, aggregation) happen on the server. UI optimizations focus on rendering, memory, and data access patterns.

---

## ⚡ React Performance Optimizations

### Component Memoization

**Memoize expensive components** to prevent unnecessary re-renders:

- **ProfileCard**: Memoize with `React.memo()` - prevents re-renders when parent updates
- **CompatibilityPill**: Memoize - score changes infrequently
- **DimensionBadges**: Memoize - badges array stable
- **MatchCard**: Memoize - prevents re-renders when list updates

**Pattern**: Use `React.memo()` for components that receive stable props but render frequently.

### Hook Optimization

**Memoize expensive computations** in hooks:

- **useDiscoveryFeed**: Use `useMemo()` for queue mapping - avoid re-computing DTOs on every render
- **useCompatibility**: Cache breakdown computation - server data stable, avoid re-processing
- **useEmitBehaviorEvent**: Debounce rapid events - prevent excessive API calls

**Pattern**: Use `useMemo()` for derived data, `useCallback()` for stable function references.

### List Rendering

**Virtualize long lists** to reduce DOM nodes:

- **DiscoveryCardStack**: Virtualize if >50 cards - only render visible cards
- **MatchList**: Use `React.memo()` on MatchCard - prevent re-renders when list updates
- **MessageThread**: Virtualize long threads - only render visible messages

**Pattern**: Use `react-window` or `react-virtualized` for lists >50 items.

### State Management Optimization

**Optimize state management** to reduce re-renders:

- **React Query**: Use `staleTime` and `cacheTime` appropriately - reduce refetch frequency
- **Zustand**: Use selectors - prevent unnecessary re-renders when unrelated state changes
- **Local State**: Keep minimal - prefer derived state from queries

**Pattern**: Use selectors to subscribe only to needed state slices.

---

## 🔄 Event Emission Optimization

### Batching

**Batch rapid events** to reduce API calls:

- **useEmitBehaviorEvent**: Batch rapid events (e.g., swipe actions) - send in single request
- **Debounce**: Profile view events - don't emit on every scroll, only on visibility change

**Pattern**: Use `debounce` or `throttle` for rapid events, batch when possible.

### Debouncing

**Debounce user interactions** to prevent excessive events:

- **Swipe Actions**: Debounce rapid swipes - prevent duplicate events
- **Filter Changes**: Debounce filter updates - prevent excessive API calls
- **Priority Changes**: Debounce slider updates - batch updates

**Pattern**: Use `lodash.debounce` or `useDebouncedCallback` for user interactions.

---

## 📊 Data Structure Choices

### Discovery Queue

**Structure**: Array (server-sorted) - O(1) access by index, O(n) search (acceptable for small lists)

**Optimization**: Use Map for O(1) lookup by userId if needed for deduplication

**Pattern**: Trust server-sorted order, use array for sequential access.

### Compatibility Breakdown

**Structure**: Object/Map keyed by dimensionId - O(1) lookup for specific dimension

**Optimization**: Pre-sort dimensions array once, don't re-sort on every render

**Pattern**: Use Map for O(1) lookups, array for ordered display.

### Dimension Priorities

**Structure**: Map keyed by dimensionId - O(1) lookup, O(1) update

**Optimization**: Use Map instead of array.find() - avoid O(n) scans

**Pattern**: Use Map for keyed lookups, convert to array only for rendering.

### Message Thread

**Structure**: Array (chronological) - O(1) append, O(n) search (acceptable)

**Optimization**: Use Map for O(1) lookup by messageId if needed for deduplication

**Pattern**: Use array for chronological order, Map for deduplication.

---

## 💾 Memory Efficiency

### Avoid Unnecessary Allocations

**Reuse objects** when possible:

- **DTO Mapping**: Reuse objects when possible - don't create new objects on every render
- **Event Meta**: Reuse meta objects - create once, reference multiple times
- **Filter Objects**: Memoize filter objects - prevent new object creation on every render

**Pattern**: Use `useMemo()` for object creation, reuse stable references.

### Cleanup

**Cleanup resources** to prevent memory leaks:

- **WebSocket Subscriptions**: Cleanup on unmount - prevent memory leaks
- **React Query Cache**: Use `cacheTime` appropriately - prevent unbounded cache growth
- **Event Listeners**: Remove listeners on unmount - prevent memory leaks

**Pattern**: Use `useEffect` cleanup functions for subscriptions and listeners.

### Image Optimization

**Optimize image loading** to reduce memory usage:

- **Profile Photos**: Lazy load images - only load visible cards
- **Photo Carousel**: Preload next/prev images - smooth transitions
- **Thumbnails**: Use smaller images for lists - reduce memory usage

**Pattern**: Use `loading="lazy"` for images, preload critical images.

---

## 🔀 Control Flow Simplification

### Conditional Rendering

**Simplify conditionals** for better performance:

- **Early Returns**: Use early returns in components - reduce nesting
- **Ternary Chains**: Avoid deep ternaries - use if/else or switch for clarity
- **Null Checks**: Use optional chaining - simplify null checks

**Pattern**: Use early returns, avoid deep nesting.

### Hook Dependencies

**Minimize dependencies** to reduce effect runs:

- **useMemo/useCallback**: Minimize dependencies - only include what's actually used
- **Effect Dependencies**: Be explicit - avoid unnecessary effect runs

**Pattern**: Use ESLint `exhaustive-deps` rule, be explicit about dependencies.

### Error Boundaries

**Handle errors gracefully** to prevent cascading failures:

- **Component-Level**: Wrap major sections - prevent cascading failures
- **Hook-Level**: Handle errors in hooks - don't let errors propagate to components

**Pattern**: Use error boundaries for component errors, try/catch for hook errors.

---

## 🔄 Data Flow Optimization

### Reduce Transformations

**Minimize data transformations**:

- **Server → SDK**: Server returns DTOs directly - no transformation needed
- **SDK → Hooks**: Hooks map to UI DTOs once - memoize mapping
- **Hooks → Components**: Pass DTOs directly - no additional transformation

**Pattern**: Transform once at hook level, memoize result.

### Avoid Redundant Traversals

**Trust server-computed data**:

- **Discovery Queue**: Server pre-sorts - don't sort again in UI
- **Compatibility Breakdown**: Server pre-computes - don't compute again in UI
- **Dimension Scores**: Server aggregates - don't aggregate again in UI

**Pattern**: Trust server data, don't recompute in UI.

### Cache Invalidation Strategy

**Precise invalidation** to reduce refetches:

- **Precise Invalidation**: Invalidate only affected queries - don't invalidate all queries
- **Optimistic Updates**: Update cache optimistically - reduce refetch frequency
- **Background Refetch**: Use `refetchOnWindowFocus: false` - prevent unnecessary refetches

**Pattern**: Use precise query keys, invalidate only affected queries.

---

## 📊 Algorithmic Complexity (UI Only)

### O(1) Operations (Preferred)

- **Lookup by ID**: Use Map/object keyed by ID
- **Array Access**: Direct index access (server-sorted arrays)
- **Cache Lookup**: React Query cache lookup

### O(n) Operations (Acceptable for Small n)

- **List Rendering**: n < 50 items - acceptable
- **Filter/Search**: Server handles - UI just displays results
- **DTO Mapping**: Single pass - acceptable

### O(n²) Operations (Avoid)

- **Nested Loops**: Avoid - use Map for O(1) lookups
- **Repeated Searches**: Cache results - don't search repeatedly
- **Redundant Sorting**: Server sorts - don't sort again

---

## ✅ Performance Checklist

### Memory
- ✅ Memoize expensive components
- ✅ Reuse objects when possible
- ✅ Cleanup subscriptions/listeners
- ✅ Use appropriate cache times
- ✅ Lazy load images

### Performance
- ✅ Virtualize long lists
- ✅ Debounce rapid events
- ✅ Batch event emissions
- ✅ Minimize hook dependencies
- ✅ Use Map for O(1) lookups

### Data Flow
- ✅ Trust server-sorted data
- ✅ Memoize DTO mappings
- ✅ Precise cache invalidation
- ✅ Avoid redundant transformations
- ✅ Single-pass data processing

---

## 🎯 Implementation Priorities

### High Priority
1. **Memoize ProfileCard, CompatibilityPill, DimensionBadges**
2. **Debounce useEmitBehaviorEvent**
3. **Use Map for dimension priorities lookup**

### Medium Priority
1. **Virtualize long lists** (DiscoveryCardStack, MessageThread)
2. **Batch rapid event emissions**
3. **Optimize React Query cache times**

### Low Priority
1. **Image lazy loading**
2. **Preload critical images**
3. **Advanced virtualization**

---

**These optimizations focus on UI performance (React, rendering, memory) without algorithmic complexity. Backend algorithms remain in BACKEND_COMPUTATION.md.**

