# Code Optimization Analysis: DRY, Modularization & Declarative Patterns

**Date**: Current  
**Focus**: Reuse efficiency, generic handlers, better modularization, declarative-driven dev

---

## 🔍 Current State Analysis

### Hook Patterns (Repeated Code)

#### Pattern 1: Standard Query Hook
**Repeated in**: `useProfileSummary`, `useUserDimensions`, `useQuizzes`, `useQuiz`, `useCompatibility`

```typescript
// Current pattern (repeated 5+ times)
export function useXxx(id: string) {
  const sdk = useSDK()
  
  return useQuery({
    queryKey: ['xxx', id],
    queryFn: async () => {
      const data = await sdk.xxx.get(id)
      // Transform data
      return transformedData
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}
```

**Issues**:
- ❌ Repeated `useSDK()` call
- ❌ Repeated `useQuery` setup
- ❌ Repeated staleTime config
- ❌ Repeated enabled logic
- ❌ Manual query key construction

#### Pattern 2: List Query Hook
**Repeated in**: `useQuizzes`, `useDiscoveryFeed`, `useMatches`

```typescript
// Current pattern (repeated 3+ times)
export function useXxxList(filters?: Filters) {
  const sdk = useSDK()
  
  return useQuery({
    queryKey: ['xxx-list', filters],
    queryFn: async () => {
      const result = await sdk.xxx.list({ where: filters })
      return result.data.map(transform)
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

**Issues**:
- ❌ Same as Pattern 1
- ❌ Repeated filter transformation
- ❌ Repeated data mapping

#### Pattern 3: Mutation Hook
**Repeated in**: `useSubmitQuiz`, `useSendMessage`, `useEmitBehaviorEvent`

```typescript
// Current pattern (repeated 3+ times)
export function useXxxMutation() {
  const sdk = useSDK()
  const queryClient = useQueryClient()
  const currentUserId = useCurrentUserId()
  
  return useMutation({
    mutationFn: async (data) => {
      return await sdk.xxx.create(data)
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['xxx'] })
    },
  })
}
```

**Issues**:
- ❌ Repeated `useSDK()`, `useQueryClient()`, `useCurrentUserId()`
- ❌ Repeated invalidation patterns
- ❌ No standardized error handling

---

### Page Patterns (Repeated Code)

#### Pattern 1: Loading/Error/Empty States
**Repeated in**: All pages

```typescript
// Current pattern (repeated 6+ times)
if (isLoading) {
  return <LoadingSkeleton />
}

if (!data) {
  return <EmptyState />
}

return <ActualContent />
```

**Issues**:
- ❌ Repeated conditional rendering
- ❌ No standardized loading/error handling
- ❌ Inconsistent empty state messages

#### Pattern 2: Event Emission
**Repeated in**: `DiscoveryPage`, `MatchesPage`, `ProfilePage`, `MessagesPage`

```typescript
// Current pattern (repeated 4+ times)
const emitEvent = useEmitBehaviorEvent()

const handleAction = () => {
  emitEvent({
    eventType: 'xxx',
    targetType: 'xxx',
    targetId: 'xxx',
    meta: { ... }
  })
}
```

**Issues**:
- ❌ Repeated hook call
- ❌ Manual event construction
- ❌ No type safety for event types

#### Pattern 3: Navigation
**Repeated in**: All pages

```typescript
// Current pattern (repeated 6+ times)
const navigate = useNavigate()

const handleClick = () => {
  navigate('/path')
}
```

**Issues**:
- ❌ Repeated hook call
- ❌ Manual path construction
- ❌ No type safety for routes

---

### Component Patterns (Repeated Code)

#### Pattern 1: Card Variants
**Repeated in**: `Card.tsx` (multiple variants)

```typescript
// Current: Large switch statement
switch (variant) {
  case 'discovery': return <DiscoveryCard />
  case 'match': return <MatchCard />
  case 'thread': return <ThreadCard />
  // ... 10+ variants
}
```

**Issues**:
- ❌ Large component file
- ❌ Hard to extend
- ❌ No composition pattern

#### Pattern 2: Button Variants
**Similar issues as Card**

---

## 🎯 Optimization Opportunities

### 1. Generic Query Hook Factory

**Create**: `hooks/factories/useQueryFactory.ts`

```typescript
// Declarative query configuration
interface QueryConfig<TData, TParams = void> {
  key: string | ((params: TParams) => string[])
  fetcher: (sdk: SDK, params: TParams) => Promise<TData>
  transformer?: (data: unknown) => TData
  staleTime?: number
  enabled?: (params: TParams) => boolean
  dependencies?: unknown[]
}

export function createQueryHook<TData, TParams = void>(
  config: QueryConfig<TData, TParams>
) {
  return function useQueryHook(params: TParams) {
    const sdk = useSDK()
    const queryKey = typeof config.key === 'function' 
      ? config.key(params) 
      : [config.key, params]
    
    return useQuery({
      queryKey,
      queryFn: async () => {
        const data = await config.fetcher(sdk, params)
        return config.transformer ? config.transformer(data) : data
      },
      staleTime: config.staleTime ?? 5 * 60 * 1000,
      enabled: config.enabled ? config.enabled(params) : true,
    })
  }
}
```

**Usage** (Declarative):
```typescript
// hooks/useProfileSummary.ts
export const useProfileSummary = createQueryHook({
  key: (userId) => ['profile', userId],
  fetcher: async (sdk, userId) => sdk.profile.get(userId),
  transformer: transformToProfileSummary,
  enabled: (userId) => !!userId,
})
```

**Benefits**:
- ✅ 80% less code per hook
- ✅ Consistent patterns
- ✅ Type-safe
- ✅ Easy to test

---

### 2. Generic Mutation Hook Factory

**Create**: `hooks/factories/useMutationFactory.ts`

```typescript
interface MutationConfig<TData, TVariables> {
  mutationFn: (sdk: SDK, userId: string, vars: TVariables) => Promise<TData>
  invalidateQueries?: (vars: TVariables) => string[]
  onSuccess?: (data: TData, vars: TVariables) => void
  onError?: (error: Error, vars: TVariables) => void
}

export function createMutationHook<TData, TVariables>(
  config: MutationConfig<TData, TVariables>
) {
  return function useMutationHook() {
    const sdk = useSDK()
    const queryClient = useQueryClient()
    const userId = useCurrentUserId()
    
    return useMutation({
      mutationFn: (vars: TVariables) => config.mutationFn(sdk, userId, vars),
      onSuccess: (data, vars) => {
        if (config.invalidateQueries) {
          config.invalidateQueries(vars).forEach(key => {
            queryClient.invalidateQueries({ queryKey: key })
          })
        }
        config.onSuccess?.(data, vars)
      },
      onError: (error, vars) => {
        config.onError?.(error, vars)
      },
    })
  }
}
```

**Usage** (Declarative):
```typescript
// hooks/useSubmitQuiz.ts
export const useSubmitQuiz = createMutationHook({
  mutationFn: async (sdk, userId, submission) => {
    // Create answers
    await Promise.all(
      submission.answers.map(a => sdk.quizanswer.create({ ...a, userId }))
    )
    // Create result
    return sdk.quizresult.create({ quizId: submission.quizId, userId })
  },
  invalidateQueries: (vars) => [
    ['quizzes'],
    ['quiz', vars.quizId],
    ['user-dimensions', userId],
  ],
})
```

**Benefits**:
- ✅ 70% less code per mutation
- ✅ Automatic invalidation
- ✅ Consistent error handling

---

### 3. Page State Handler (Declarative)

**Create**: `components/layout/PageStateHandler.tsx`

```typescript
interface PageStateConfig {
  isLoading: boolean
  isEmpty: boolean
  error?: Error | null
  loadingComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  children: React.ReactNode
}

export function PageStateHandler({
  isLoading,
  isEmpty,
  error,
  loadingComponent = <LoadingSkeleton />,
  emptyComponent = <EmptyState />,
  errorComponent = <ErrorState />,
  children,
}: PageStateConfig) {
  if (error) return <>{errorComponent}</>
  if (isLoading) return <>{loadingComponent}</>
  if (isEmpty) return <>{emptyComponent}</>
  return <>{children}</>
}
```

**Usage** (Declarative):
```typescript
// pages/DiscoveryPage.tsx
export default function DiscoveryPage() {
  const { data, isLoading } = useDiscoveryFeed(userId)
  
  return (
    <PageStateHandler
      isLoading={isLoading}
      isEmpty={!data || data.length === 0}
      emptyComponent={<EmptyState message="No profiles found" />}
    >
      <CardStack cards={data} />
    </PageStateHandler>
  )
}
```

**Benefits**:
- ✅ 60% less boilerplate
- ✅ Consistent UX
- ✅ Easy to customize

---

### 4. Event Emitter Factory (Declarative)

**Create**: `hooks/factories/useEventEmitter.ts`

```typescript
// Declarative event definitions
const EVENT_DEFINITIONS = {
  profile_view: {
    targetType: 'profile' as const,
    meta: (profile: ProfileSummary) => ({ profile_meta: profile }),
  },
  profile_like: {
    targetType: 'profile' as const,
    meta: (profile: ProfileSummary) => ({ profile_meta: profile }),
  },
  // ... all events
} as const

export function createEventEmitter<T extends keyof typeof EVENT_DEFINITIONS>(
  eventType: T
) {
  return function useEventEmitter() {
    const emitEvent = useEmitBehaviorEvent()
    
    return useCallback((targetId: string, meta?: unknown) => {
      const def = EVENT_DEFINITIONS[eventType]
      emitEvent({
        eventType,
        targetType: def.targetType,
        targetId,
        meta: meta || def.meta?.(meta),
      })
    }, [emitEvent])
  }
}
```

**Usage** (Declarative):
```typescript
// pages/DiscoveryPage.tsx
const emitProfileView = createEventEmitter('profile_view')
const emitProfileLike = createEventEmitter('profile_like')

const handleView = (profile: ProfileSummary) => {
  emitProfileView(profile.id, profile)
}
```

**Benefits**:
- ✅ Type-safe events
- ✅ No manual event construction
- ✅ Centralized event definitions

---

### 5. Route Navigation Factory (Declarative)

**Create**: `utils/navigation.ts`

```typescript
// Declarative route definitions
export const ROUTES = {
  home: '/',
  discovery: '/discovery',
  matches: '/matches',
  messages: (matchId?: string) => matchId ? `/messages?matchId=${matchId}` : '/messages',
  profile: (userId?: string) => userId ? `/profile/${userId}` : '/profile',
  quiz: (quizId: string) => `/quiz/${quizId}`,
  quizzes: '/quizzes',
} as const

export function useNavigation() {
  const navigate = useNavigate()
  
  return useMemo(() => ({
    toHome: () => navigate(ROUTES.home),
    toDiscovery: () => navigate(ROUTES.discovery),
    toMatches: () => navigate(ROUTES.matches),
    toMessages: (matchId?: string) => navigate(ROUTES.messages(matchId)),
    toProfile: (userId?: string) => navigate(ROUTES.profile(userId)),
    toQuiz: (quizId: string) => navigate(ROUTES.quiz(quizId)),
    toQuizzes: () => navigate(ROUTES.quizzes),
  }), [navigate])
}
```

**Usage** (Declarative):
```typescript
// pages/DiscoveryPage.tsx
const nav = useNavigation()

const handleClick = (profile: ProfileSummary) => {
  nav.toProfile(profile.userId)
}
```

**Benefits**:
- ✅ Type-safe routes
- ✅ No string literals
- ✅ Centralized route management

---

### 6. Component Composition Pattern

**Refactor**: `Card.tsx` → Composition-based

**Current** (Monolithic):
```typescript
// Card.tsx - 200+ lines, switch statement
```

**Optimal** (Composition):
```typescript
// components/ui/Card.tsx (Base)
export function Card({ children, className, onClick, ...props }) {
  return (
    <div className={clsx('card-base', className)} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

// components/cards/DiscoveryCard.tsx (Composed)
export function DiscoveryCard({ profile }: { profile: ProfileSummary }) {
  return (
    <Card variant="discovery" onClick={() => nav.toProfile(profile.userId)}>
      <CardMedia images={profile.photos} />
      <CardContent>
        <CardTitle>{profile.name}</CardTitle>
        <CardMeta>{profile.location}</CardMeta>
      </CardContent>
      <CardActions>
        <CompatibilityBadge score={profile.compatibilityScore} />
      </CardActions>
    </Card>
  )
}
```

**Benefits**:
- ✅ Smaller files
- ✅ Better composition
- ✅ Easier to test
- ✅ More reusable

---

## 📁 Proposed File Structure

### Current Structure
```
src/
  hooks/
    useProfileSummary.ts
    useUserDimensions.ts
    useQuizzes.ts
    useQuiz.ts
    useMatches.ts
    useCompatibility.ts
    useMessageThread.ts
    useSubmitQuiz.ts
    useEmitBehaviorEvent.ts
  pages/
    DiscoveryPage.tsx
    MatchesPage.tsx
    ProfilePage.tsx
    MessagesPage.tsx
    QuizPage.tsx
    QuizListPage.tsx
  components/
    ui/
      Card.tsx (200+ lines)
      Button.tsx
      Input.tsx
```

### Optimized Structure
```
src/
  hooks/
    factories/
      useQueryFactory.ts        # Generic query hook factory
      useMutationFactory.ts     # Generic mutation hook factory
      useEventEmitter.ts        # Event emitter factory
    queries/
      useProfileSummary.ts      # Declarative query config
      useUserDimensions.ts
      useQuizzes.ts
      useQuiz.ts
      useMatches.ts
      useCompatibility.ts
    mutations/
      useSubmitQuiz.ts          # Declarative mutation config
      useSendMessage.ts
      useEmitBehaviorEvent.ts
  pages/
    DiscoveryPage.tsx           # Uses PageStateHandler
    MatchesPage.tsx
    ProfilePage.tsx
    MessagesPage.tsx
    QuizPage.tsx
    QuizListPage.tsx
  components/
    layout/
      PageStateHandler.tsx      # Generic state handler
    cards/
      DiscoveryCard.tsx         # Composed cards
      MatchCard.tsx
      ThreadCard.tsx
    ui/
      Card.tsx                  # Base card (small)
      Button.tsx
      Input.tsx
  utils/
    navigation.ts               # Route definitions
    events.ts                   # Event definitions
    queryDefaults.ts            # Default query configs
```

---

## 📊 Code Reduction Estimates

| Area | Current LOC | Optimized LOC | Reduction |
|------|-------------|---------------|-----------|
| Hooks | ~400 | ~150 | 62% |
| Pages | ~600 | ~300 | 50% |
| Components | ~800 | ~500 | 37% |
| **Total** | **~1800** | **~950** | **47%** |

---

## 🎯 Implementation Priority

### Phase 1: Core Factories (High Impact)
1. ✅ `useQueryFactory` - Reduces hook code by 60%
2. ✅ `useMutationFactory` - Reduces mutation code by 70%
3. ✅ `PageStateHandler` - Reduces page boilerplate by 50%

### Phase 2: Declarative Patterns (Medium Impact)
4. ✅ `useEventEmitter` - Type-safe events
5. ✅ `useNavigation` - Type-safe routes
6. ✅ Event/Route definitions - Centralized config

### Phase 3: Component Refactoring (Lower Impact)
7. ✅ Card composition - Better modularity
8. ✅ Component factories - Reusable patterns

---

## ✅ Benefits Summary

### Code Reduction
- **47% less code** overall
- **62% less hook code**
- **50% less page boilerplate**

### Maintainability
- ✅ Single source of truth for patterns
- ✅ Easy to add new hooks/queries
- ✅ Consistent error handling
- ✅ Type-safe throughout

### Developer Experience
- ✅ Declarative configuration
- ✅ Less boilerplate
- ✅ Easier to test
- ✅ Better IDE support

---

## 🚀 Next Steps

1. **Create factory files** (`useQueryFactory`, `useMutationFactory`)
2. **Refactor existing hooks** to use factories
3. **Create PageStateHandler** component
4. **Refactor pages** to use PageStateHandler
5. **Create navigation/event utilities**
6. **Refactor components** to composition pattern

**Estimated effort**: 2-3 hours for factories + refactoring

