# 🔍 Expression Strategy Review

**Question**: Is the current expression helper strategy ideal?

**Short Answer**: **No, there are 5 critical issues** that will cause problems in production.

---

## 🔴 **CRITICAL ISSUES**

### **Issue #1: Context Instability (Breaks Memoization)** 🔥

**Problem**:
```typescript
// Current approach - creates NEW object every render
const context = buildExpressionContext(data, user)
const value = useExpression(expr, context)
```

**Why It's Bad**:
- `buildExpressionContext` creates a **new object** every render
- `useMemo` uses **reference equality** for dependencies
- Context changes → memoization useless → re-evaluates EVERY render
- **Performance: O(n) evaluations instead of O(1)**

**Proof**:
```typescript
// packages/ui-runtime/src/hooks/use-expression.ts
export function buildExpressionContext(...) {
  return {  // NEW object every call!
    data,
    user: user || { id: '', roles: [] },  // NEW object!
    params: params || {},                  // NEW object!
    globals: globals || {}                 // NEW object!
  }
}

// In useMemo:
useMemo(() => {
  evaluate(expr, context)  // Context is NEW every render!
}, [expr, context])  // Context always changes → always re-evaluates
```

**Real Impact**:
- Form with 10 fields + expressions = **10 evaluations per keystroke**
- List page with 20 items + computed columns = **20 evaluations per scroll**
- **Memoization is completely useless!**

---

### **Issue #2: No Context Provider (Prop Drilling)** 🔥

**Problem**:
```typescript
// Every component needs to build context manually
function MyField({ field, data, user, params, globals }) {
  const context = buildExpressionContext(data, user, params, globals)
  const value = useExpression(field.computed, context)
}

// Prop drilling nightmare:
<Page user={user} params={params}>
  <Section user={user} params={params}>
    <Field user={user} params={params} />
  </Section>
</Page>
```

**Why It's Bad**:
- Every component needs `data`, `user`, `params`, `globals` props
- Deep component trees = prop drilling hell
- Repetitive boilerplate in every component
- **Violates DRY**

**Better Approach**:
```typescript
// Should use React Context
<ExpressionContextProvider value={context}>
  <Page>
    <Section>
      <Field />  {/* Automatically has context */}
    </Section>
  </Page>
</ExpressionContextProvider>
```

---

### **Issue #3: Type Safety Lost (Returns `any`)** 🟡

**Problem**:
```typescript
// packages/ui-runtime/src/hooks/use-expression.ts
export function useExpression(
  expr: Expression | undefined,
  context: ExpressionContext
): any {  // <-- Returns ANY!
```

**Why It's Bad**:
```typescript
// No type checking
const value = useExpression(field.computed, context)
// value is `any` - could be string, number, object, array, undefined
// TypeScript can't help us

// Leads to runtime errors:
const total = value.toFixed(2)  // Crashes if value is not a number!
```

**Better Approach**:
```typescript
// Generic hook with type inference
export function useExpression<T = unknown>(
  expr: Expression | undefined,
  context: ExpressionContext
): T | undefined

// Usage:
const total = useExpression<number>(field.computed, context)
// Now TypeScript knows it's a number!
```

---

### **Issue #4: Silent Failures (Console.error Only)** 🟡

**Problem**:
```typescript
// packages/ui-runtime/src/hooks/use-expression.ts
try {
  return evaluate(expr, context)
} catch (error) {
  console.error('[useExpression] Evaluation failed:', error)
  return undefined  // Silent failure!
}
```

**Why It's Bad**:
- User sees **blank field** instead of error
- No way for parent component to handle error
- No way to show error boundary
- Production bugs are invisible

**Example**:
```typescript
// Expression has typo: "pric" instead of "price"
{
  "computed": {
    "op": "multiply",
    "args": [{"field": "pric"}, {"value": 1.1}]  // Typo!
  }
}

// User sees: (blank)
// Developer sees: Nothing (unless they check console)
// Should see: "Field 'pric' not found. Did you mean 'price'?"
```

**Better Approach**:
```typescript
export function useExpression(expr, context, options?: {
  onError?: (error: Error) => void
  fallback?: any
  throwOnError?: boolean
}) {
  try {
    return evaluate(expr, context)
  } catch (error) {
    if (options?.throwOnError) throw error
    if (options?.onError) options.onError(error)
    return options?.fallback
  }
}
```

---

### **Issue #5: No Expression Caching (Redundant Parsing)** 🟡

**Problem**:
```typescript
// Same expression evaluated in 100 rows
const rows = items.map(item => ({
  ...item,
  discount: useExpression(
    { type: 'operation', op: 'multiply', args: [...] },  // Same expr!
    { data: item, user, params, globals }
  )
}))
```

**Why It's Bad**:
- Expression object is **parsed/validated** every time
- Evaluator walks AST every time
- Could cache compiled expression

**Better Approach**:
```typescript
// Compile expression once, evaluate many times
const compiledExpr = useCompiledExpression(expr)

const rows = items.map(item => 
  evaluateCompiled(compiledExpr, { data: item, user, params, globals })
)
```

---

## 🟢 **WHAT'S GOOD**

### **✅ Good: DRY Architecture**
- Single evaluator for all expression types
- Operations defined once
- No duplication

### **✅ Good: SRP Compliance**
- Each file has one job
- Clear separation of concerns

### **✅ Good: Comprehensive Operations**
- 60+ operations cover most use cases
- Well-tested (106 tests)

### **✅ Good: Type-Safe Expressions**
- Zod schemas validate JSON
- TypeScript types for all expressions

---

## 🎯 **RECOMMENDED FIXES**

### **Priority 1: Fix Context Stability** (CRITICAL)

**Problem**: Context recreated every render breaks memoization

**Solution**: Use React Context + stable refs

```typescript
// packages/ui-runtime/src/context/expression-context.tsx

import { createContext, useContext, useMemo } from 'react'

interface ExpressionContextValue {
  data: Record<string, any>
  user: { id: string; roles: string[]; permissions?: string[] }
  params: Record<string, string>
  globals: Record<string, any>
}

const ExpressionContext = createContext<ExpressionContextValue | null>(null)

// Provider with memoization
export function ExpressionContextProvider({
  data,
  user,
  params = {},
  globals = {},
  children
}: {
  data: Record<string, any>
  user?: { id: string; roles: string[]; permissions?: string[] } | null
  params?: Record<string, string>
  globals?: Record<string, any>
  children: React.ReactNode
}) {
  // Memoize context value to prevent re-renders
  const value = useMemo(
    () => ({
      data,
      user: user || { id: '', roles: [], permissions: [] },
      params,
      globals
    }),
    [data, user, params, globals]  // Only recreate if values change
  )
  
  return (
    <ExpressionContext.Provider value={value}>
      {children}
    </ExpressionContext.Provider>
  )
}

// Hook that uses context
export function useExpressionContext(): ExpressionContextValue {
  const context = useContext(ExpressionContext)
  if (!context) {
    throw new Error('useExpressionContext must be used within ExpressionContextProvider')
  }
  return context
}

// Updated useExpression (no context parameter needed!)
export function useExpression(expr: Expression | undefined): any {
  const context = useExpressionContext()  // Get from React Context
  
  return useMemo(() => {
    if (!expr) return undefined
    try {
      return evaluate(expr, context)
    } catch (error) {
      console.error('[useExpression] Evaluation failed:', error)
      return undefined
    }
  }, [expr, context])  // Context is now stable!
}
```

**Usage**:
```typescript
// At page level (once)
<ExpressionContextProvider data={item} user={session.user} params={routeParams}>
  <DetailPage>
    <Field1 />  {/* No props needed! */}
    <Field2 />
    <Field3 />
  </DetailPage>
</ExpressionContextProvider>

// In Field components
function Field({ field }: { field: FieldDef }) {
  // No context building needed!
  const value = useExpression(field.computed)
  const isVisible = useConditionalVisibility(field.visibleWhen)
  
  if (!isVisible) return null
  return <div>{value}</div>
}
```

**Benefits**:
- ✅ No prop drilling
- ✅ Memoization actually works
- ✅ DRY (context built once)
- ✅ Performance: O(1) evaluations

---

### **Priority 2: Add Type Safety** (HIGH)

**Solution**: Generic hook with type inference

```typescript
// packages/ui-runtime/src/hooks/use-expression.ts

export function useExpression<T = unknown>(
  expr: Expression | undefined
): T | undefined {
  const context = useExpressionContext()
  
  return useMemo(() => {
    if (!expr) return undefined
    try {
      return evaluate(expr, context) as T
    } catch (error) {
      console.error('[useExpression] Evaluation failed:', error)
      return undefined
    }
  }, [expr, context])
}

// Usage with type safety
const total = useExpression<number>(field.computed)
//    ^? number | undefined

const name = useExpression<string>(field.computed)
//    ^? string | undefined

const items = useExpression<Array<any>>(field.computed)
//    ^? Array<any> | undefined
```

---

### **Priority 3: Better Error Handling** (MEDIUM)

**Solution**: Error callbacks + fallbacks

```typescript
export interface UseExpressionOptions<T> {
  fallback?: T
  onError?: (error: Error) => void
  throwOnError?: boolean
}

export function useExpression<T = unknown>(
  expr: Expression | undefined,
  options?: UseExpressionOptions<T>
): T | undefined {
  const context = useExpressionContext()
  
  return useMemo(() => {
    if (!expr) return options?.fallback
    
    try {
      return evaluate(expr, context) as T
    } catch (error) {
      const err = error as Error
      
      // Throw if requested
      if (options?.throwOnError) throw err
      
      // Call error handler
      if (options?.onError) options.onError(err)
      
      // Return fallback
      return options?.fallback
    }
  }, [expr, context, options])
}

// Usage
const value = useExpression<number>(field.computed, {
  fallback: 0,
  onError: (err) => toast.error(`Field error: ${err.message}`),
  throwOnError: isDev  // Throw in dev, fallback in prod
})
```

---

### **Priority 4: Add Expression Context Provider** (HIGH)

**Already covered in Priority 1**

---

### **Priority 5: Add Expression Compilation Cache** (LOW)

**Solution**: Compile expressions once

```typescript
// For future optimization (not critical now)
const compiledExpressionCache = new WeakMap<Expression, CompiledExpression>()

export function useCompiledExpression(expr: Expression | undefined) {
  return useMemo(() => {
    if (!expr) return null
    
    let compiled = compiledExpressionCache.get(expr)
    if (!compiled) {
      compiled = compileExpression(expr)
      compiledExpressionCache.set(expr, compiled)
    }
    return compiled
  }, [expr])
}
```

---

## 📊 **IMPACT ANALYSIS**

### **Current Strategy Issues**:

| Issue | Severity | Impact | Effort to Fix |
|-------|----------|--------|---------------|
| **Context Instability** | 🔴 CRITICAL | Breaks memoization | 2-3 hours |
| **No Context Provider** | 🔴 CRITICAL | Prop drilling | 2-3 hours |
| **Type Safety Lost** | 🟡 HIGH | Runtime errors | 1 hour |
| **Silent Failures** | 🟡 HIGH | Bad UX | 1 hour |
| **No Expression Cache** | 🟢 LOW | Minor perf | 3-4 hours |

**Total Fix Time**: ~6-8 hours

---

## 🎯 **RECOMMENDED CHANGES**

### **Immediate (Before Phase 2)**:

1. **Add `ExpressionContextProvider`** (2-3 hours)
   - Fixes context stability
   - Eliminates prop drilling
   - Enables memoization

2. **Add Type Generics** (1 hour)
   - `useExpression<T>`
   - Better TypeScript support

3. **Add Error Options** (1 hour)
   - `fallback`, `onError`, `throwOnError`
   - Better error handling

**Total**: 4-5 hours

### **Later (Phase 3+)**:

4. **Add Expression Compilation Cache** (3-4 hours)
   - Performance optimization
   - Not critical for MVP

---

## 💡 **ANSWER TO YOUR QUESTION**

**Is the current strategy ideal?**

**No**, but it's **80% good**. The core architecture (DRY, SRP, operations) is excellent.

**Critical Issues**:
1. 🔴 Context instability breaks memoization
2. 🔴 No React Context (prop drilling)
3. 🟡 Type safety lost (returns `any`)
4. 🟡 Silent error handling

**Recommended Action**:
- ✅ Fix **Issues #1 and #2** (ExpressionContextProvider) **before Phase 2**
- ✅ Fix **Issues #3 and #4** (type safety + errors) **before Phase 2**
- ⏸️ Issue #5 (caching) can wait

**Time**: ~5 hours to fix all critical issues

**Result**: Near-perfect strategy for production 🎯

---

## 🚀 **UPDATED PHASE 2 PLAN**

### **Week 2A: Fix Expression Strategy** (4-5 hours)
1. Add `ExpressionContextProvider`
2. Update `useExpression` to use context
3. Add type generics
4. Add error options
5. Update tests

### **Week 2B: Integrate Into Renderers** (10-13 hours)
6. Update DetailPageRenderer
7. Update ListPageRenderer
8. Update FormPageRenderer
9. Create examples
10. Integration tests

**Total Week 2**: 14-18 hours (as planned, but better quality)

---

**Want me to implement the fixes now before continuing with Phase 2?**

