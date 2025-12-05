# Consolidation Plan: Reduce Code Churn

**Goal**: Consolidate before adding features → 47% code reduction, faster development

---

## 🎯 What Remains (Prioritized)

### Critical Path (Must Do)
1. **Phase 6: Dimension Priorities** - Core feature
2. **MVP Onboarding Flow** - User acquisition
3. **WebSocket Transport** - Real-time messaging

### Important (Should Do)
4. **Advanced UI Components** (InfoPanel, ViewToggle, FilterPanel)
5. **Error Boundaries** - Better error handling
6. **Zustand Global State** - Better state management

### Nice to Have (Can Do Later)
7. Event batching
8. Performance optimizations (memoization, virtualization)
9. Accessibility improvements
10. Testing suite

---

## 🔧 Clean Consolidations (Do First)

### Consolidation 1: Hook Factories ⚡ **HIGHEST IMPACT**

**Problem**: 8+ hooks with 60% repeated code
**Solution**: Generic factories with declarative configs

**Files to Create**:
```
hooks/factories/
  ├── useQueryFactory.ts      # Generic query hook factory
  └── useMutationFactory.ts   # Generic mutation hook factory
```

**Files to Refactor** (8 hooks → declarative configs):
- `useProfileSummary.ts` → 5 lines (was 25)
- `useUserDimensions.ts` → 5 lines (was 25)
- `useQuizzes.ts` → 5 lines (was 25)
- `useQuiz.ts` → 8 lines (was 45)
- `useCompatibility.ts` → 8 lines (was 35)
- `useDiscoveryFeed.ts` → 10 lines (was 40)
- `useSubmitQuiz.ts` → 10 lines (was 50)
- `useSendMessage.ts` → 8 lines (was 30)

**Code Reduction**: ~400 LOC → ~150 LOC (**62% reduction**)

**Benefit**: Phase 6 hooks become trivial (just config)

---

### Consolidation 2: Page State Handler ⚡ **HIGH IMPACT**

**Problem**: Every page repeats loading/error/empty logic
**Solution**: Generic `PageStateHandler` component

**File to Create**:
```
components/layout/PageStateHandler.tsx
```

**Files to Refactor** (6 pages):
- `DiscoveryPage.tsx` → Remove 15 lines boilerplate
- `MatchesPage.tsx` → Remove 15 lines boilerplate
- `MessagesPage.tsx` → Remove 20 lines boilerplate
- `ProfilePage.tsx` → Remove 15 lines boilerplate
- `QuizPage.tsx` → Remove 15 lines boilerplate
- `QuizListPage.tsx` → Remove 10 lines boilerplate

**Code Reduction**: ~600 LOC → ~300 LOC (**50% reduction**)

**Benefit**: Consistent UX, less boilerplate

---

### Consolidation 3: Event Emitter Factory ⚡ **MEDIUM IMPACT**

**Problem**: Manual event construction everywhere
**Solution**: Declarative event definitions

**Files to Create**:
```
utils/events.ts                # Event definitions
hooks/factories/useEventEmitter.ts  # Event emitter factory
```

**Files to Refactor** (4 pages):
- `DiscoveryPage.tsx` → Use `useEventEmitter('profile_like')`
- `MatchesPage.tsx` → Use `useEventEmitter('match_view')`
- `ProfilePage.tsx` → Use `useEventEmitter('profile_view')`
- `MessagesPage.tsx` → Use `useEventEmitter('message_sent')`

**Code Reduction**: ~80 LOC → ~20 LOC (**75% reduction**)

**Benefit**: Type-safe events, no manual construction

---

### Consolidation 4: Navigation Factory ⚡ **LOW IMPACT**

**Problem**: String literals for routes
**Solution**: Type-safe route definitions

**File to Create**:
```
utils/navigation.ts            # Route definitions + hook
```

**Files to Refactor** (6 pages):
- Replace `navigate('/path')` → `nav.toPath()`

**Code Reduction**: ~30 LOC → ~10 LOC (**67% reduction**)

**Benefit**: Type-safe navigation, easy refactoring

---

## 📊 Total Consolidation Impact

| Consolidation | Code Reduction | Time Saved | Priority |
|--------------|----------------|------------|----------|
| Hook Factories | 62% (250 LOC) | 2-3 hours | **HIGH** |
| Page State Handler | 50% (300 LOC) | 1 hour | **HIGH** |
| Event Emitter | 75% (60 LOC) | 30 min | MEDIUM |
| Navigation Factory | 67% (20 LOC) | 15 min | LOW |
| **Total** | **47% (630 LOC)** | **4 hours** | |

---

## 🚀 Recommended Execution Order

### Step 1: Core Consolidations (Do First) ⚡
**Time**: 3-4 hours  
**Impact**: 47% code reduction, enables faster Phase 6

1. ✅ Create `useQueryFactory.ts` (1 hour)
2. ✅ Create `useMutationFactory.ts` (1 hour)
3. ✅ Refactor existing hooks (1 hour)
4. ✅ Create `PageStateHandler.tsx` (30 min)
5. ✅ Refactor pages (30 min)

**Result**: Codebase reduced by 47%, Phase 6 becomes trivial

---

### Step 2: Phase 6 - Dimension Priorities (After Consolidation)
**Time**: 2-3 hours (was 4-6 hours without factories)

Using hook factories:
```typescript
// hooks/useDimensionPriorities.ts - 5 lines!
export const useDimensionPriorities = createQueryHook({
  key: (userId) => ['dimension-priorities', userId],
  fetcher: async (sdk, userId) => sdk.userdimensionpriority.list({ where: { userId } }),
  staleTime: 5 * 60 * 1000,
})

// hooks/useUpdateDimensionPriority.ts - 8 lines!
export const useUpdateDimensionPriority = createMutationHook({
  mutationFn: async (sdk, userId, { dimensionId, weight }) => 
    sdk.userdimensionpriority.update({ where: { userId, dimensionId }, data: { weight } }),
  invalidateQueries: () => [['dimension-priorities'], ['compatibility'], ['discovery-feed']],
})
```

**Result**: Phase 6 complete in 2-3 hours instead of 4-6

---

### Step 3: MVP Onboarding Flow (After Consolidation)
**Time**: 2-3 hours (was 4-5 hours without factories)

Using hook factories + PageStateHandler:
- Profile creation hook → 5 lines
- Form state → PageStateHandler
- Quiz seeding → 8 lines

**Result**: Onboarding flow complete in 2-3 hours

---

### Step 4: Infrastructure (Can Do in Parallel)
**Time**: 6-8 hours

- WebSocket Transport (4-5 hours)
- Zustand Global State (1-2 hours)
- Error Boundaries (1 hour)

---

## 💡 Key Insights

### 1. **Consolidation Before Features**
- Hook factories make Phase 6 trivial (2-3 hours vs 4-6 hours)
- PageStateHandler reduces all page boilerplate
- **Do consolidation first** → saves 4+ hours later

### 2. **Declarative Over Imperative**
- Hook factories = declarative configs (5 lines vs 25 lines)
- Event emitter = declarative definitions
- **Less code, more maintainable**

### 3. **Code Churn Reduction**
- **Before**: ~1800 LOC, adding features = lots of code
- **After**: ~950 LOC, adding features = minimal code
- **47% reduction** = less to maintain, test, debug

---

## ✅ Action Plan

### This Week: Consolidation
1. ✅ Create hook factories (2 hours)
2. ✅ Create PageStateHandler (1 hour)
3. ✅ Refactor hooks/pages (1 hour)
4. ✅ **Result**: 47% code reduction, ready for Phase 6

### Next Week: Features
5. ⏳ Phase 6 - Dimension Priorities (2-3 hours)
6. ⏳ MVP Onboarding Flow (2-3 hours)
7. ⏳ WebSocket Transport (4-5 hours)

### Later: Polish
8. ⏳ Advanced UI Components
9. ⏳ Error Boundaries
10. ⏳ Performance Optimizations

---

## 📋 Quick Reference

### Remaining Work (After Consolidation)
- **Phase 6**: Dimension Priorities (2-3 hours)
- **MVP Onboarding**: Profile form + quiz seeding (2-3 hours)
- **WebSocket**: Real-time messaging (4-5 hours)
- **Advanced UI**: InfoPanel, ViewToggle, FilterPanel (3-4 hours)
- **Infrastructure**: Zustand, Error Boundaries (2-3 hours)

**Total Remaining**: ~13-18 hours (vs 20-25 hours without consolidation)

---

**Recommendation**: **Do consolidations first** (3-4 hours), then build remaining features using consolidated patterns. This reduces code churn by 47% and makes future work 2x faster.

