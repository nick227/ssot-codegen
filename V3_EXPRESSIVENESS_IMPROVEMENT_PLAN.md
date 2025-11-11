# 🎯 V3 Expressiveness Improvement Plan

**Goal**: Make V3 70-80% declarative for complex apps while enforcing DRY, SRP, and model-driven development

**Principles**:
- ✅ **DRY**: Single source of truth, reusable evaluators
- ✅ **SRP**: Each component has one job
- ✅ **Model-Driven**: JSON schema drives everything

---

## 📊 **GAP ANALYSIS**

### **Current Expressiveness**: 40%
### **Target Expressiveness**: 75-80%
### **Gaps to Close**: 35-40%

---

## 🎯 **ARCHITECTURE: MODEL-DRIVEN EVALUATION SYSTEM**

### **Core Principle: Everything is an Expression**

**Single Responsibility**:
```typescript
// ONE evaluator handles ALL expression types
ExpressionEvaluator
  ├─ evaluateFieldAccess()     // {{user.name}}
  ├─ evaluateOperation()       // add(x, y)
  ├─ evaluateCondition()       // eq(x, y)
  ├─ evaluateAggregation()     // count(items)
  └─ evaluatePermission()      // hasRole('admin')
```

**DRY**: All components use same evaluator
```typescript
// DataTable, Form, DetailPage all use:
const value = evaluate(expr, context)

// NO duplication of evaluation logic!
```

---

## 🏗️ **ARCHITECTURE LAYERS** (SRP)

```
┌─────────────────────────────────────────┐
│         JSON Contracts (Models)         │
│  template.json, data-contract.json      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Expression Schema (Validation)     │
│  ExprSchema validates all expressions   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    Expression Evaluator (Computation)   │
│  Single evaluator for all expr types    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    Context Provider (State Management)  │
│  Single context for data/user/session   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Renderers (UI Components)          │
│  Consume evaluated expressions          │
└─────────────────────────────────────────┘
```

**Each layer has ONE job** ✅

---

## 📦 **NEW PACKAGES** (SRP)

### **Package 1: `@ssot-ui/expressions`** (NEW)

**Single Responsibility**: Parse and evaluate expressions

```typescript
// packages/ui-expressions/src/index.ts

export interface ExpressionContext {
  data: Record<string, any>         // Current item/form data
  user: { id: string; roles: string[] }  // Current user
  params: Record<string, string>    // Route params
  globals: Record<string, any>      // Global state
}

export interface Expression {
  type: 'field' | 'operation' | 'condition' | 'aggregation' | 'permission'
  // Type-specific properties
}

// ONE evaluator for everything
export class ExpressionEvaluator {
  evaluate(expr: Expression, context: ExpressionContext): any
}

// DRY: Operations defined once
const OPERATIONS = {
  // Math
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  
  // String
  concat: (...args) => args.join(''),
  upper: (s) => s.toUpperCase(),
  
  // Date
  formatDate: (d, fmt) => format(d, fmt),
  yearsAgo: (d) => differenceInYears(new Date(), d),
  
  // Logical
  and: (...args) => args.every(Boolean),
  or: (...args) => args.some(Boolean),
  not: (v) => !v,
  
  // Comparison
  eq: (a, b) => a === b,
  gt: (a, b) => a > b,
  lt: (a, b) => a < b,
  in: (v, arr) => arr.includes(v),
  
  // Array
  count: (arr) => arr.length,
  sum: (arr, field?) => field ? arr.reduce((s, i) => s + i[field], 0) : arr.reduce((a, b) => a + b, 0),
  filter: (arr, pred) => arr.filter(pred),
  map: (arr, fn) => arr.map(fn),
  
  // Permission
  hasRole: (role, ctx) => ctx.user.roles.includes(role),
  isOwner: (ownerId, ctx) => ctx.user.id === ownerId
}
```

**Benefits**:
- ✅ DRY: Operations defined once
- ✅ SRP: Only handles expressions
- ✅ Extensible: Easy to add operations
- ✅ Type-safe: Full TypeScript support

---

### **Package 2: `@ssot-ui/schemas` Updates** (ENHANCE)

**Add Expression Schemas**:

```typescript
// packages/ui-schemas/src/schemas/expressions.ts

import { z } from 'zod'

// Base expression
export const ExpressionSchema: z.ZodType<Expression> = z.lazy(() =>
  z.union([
    FieldAccessSchema,
    OperationSchema,
    LiteralSchema
  ])
)

// Field access: field('user.name')
export const FieldAccessSchema = z.object({
  type: z.literal('field'),
  path: z.string()  // 'user.name', 'items.*.price'
})

// Operation: add(field('price'), 10)
export const OperationSchema = z.object({
  type: z.literal('operation'),
  op: z.string(),  // 'add', 'multiply', 'concat', etc.
  args: z.array(ExpressionSchema)
})

// Literal: "hello", 42, true
export const LiteralSchema = z.object({
  type: z.literal('literal'),
  value: z.unknown()
})

// Condition: eq(field('status'), 'draft')
export const ConditionSchema = z.object({
  type: z.literal('condition'),
  op: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'exists']),
  left: ExpressionSchema,
  right: ExpressionSchema
})

// Permission: hasRole('admin')
export const PermissionSchema = z.object({
  type: z.literal('permission'),
  check: z.enum(['hasRole', 'hasPermission', 'isOwner']),
  args: z.array(z.string())
})
```

**Benefits**:
- ✅ DRY: One schema for all expressions
- ✅ Validation: Catches errors at JSON load
- ✅ Type-safe: Generated TypeScript types

---

### **Package 3: `@ssot-ui/runtime` Updates** (ENHANCE)

**Add Expression Support to Renderers**:

```typescript
// packages/ui-runtime/src/hooks/use-expression.ts

import { evaluate } from '@ssot-ui/expressions'

/**
 * DRY: Single hook for all expression evaluation
 * SRP: Only evaluates expressions, doesn't render
 */
export function useExpression(expr: Expression | undefined, context: ExpressionContext) {
  return useMemo(() => {
    if (!expr) return undefined
    return evaluate(expr, context)
  }, [expr, context])
}

// Usage in ALL components:
const value = useExpression(field.expr, context)
const isVisible = useExpression(field.visibleWhen, context)
const isEnabled = useExpression(field.enabledWhen, context)
```

**Benefits**:
- ✅ DRY: All components use same hook
- ✅ SRP: Hook only evaluates, doesn't render
- ✅ Performance: Memoized by default

---

## 🎯 **IMPLEMENTATION PLAN**

### **Phase 1: Foundation** (Week 1: 12-15 hours)

#### **1.1: Create `@ssot-ui/expressions` Package** (6-8 hours)

**Files**:
```
packages/ui-expressions/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Public API
│   ├── types.ts                    # Expression types
│   ├── evaluator.ts                # Core evaluator
│   ├── operations/                 # DRY: operations in one place
│   │   ├── math.ts                 # add, multiply, divide
│   │   ├── string.ts               # concat, upper, lower
│   │   ├── date.ts                 # formatDate, yearsAgo
│   │   ├── logical.ts              # and, or, not
│   │   ├── comparison.ts           # eq, gt, lt, in
│   │   ├── array.ts                # count, sum, filter, map
│   │   └── permission.ts           # hasRole, isOwner
│   ├── context.ts                  # Context management
│   └── __tests__/
│       ├── evaluator.test.ts       # Core tests
│       └── operations.test.ts      # Operation tests
└── README.md
```

**Key Implementation**:

```typescript
// packages/ui-expressions/src/evaluator.ts

import { OPERATIONS } from './operations'

export class ExpressionEvaluator {
  constructor(private operations = OPERATIONS) {}
  
  evaluate(expr: Expression, context: ExpressionContext): any {
    switch (expr.type) {
      case 'literal':
        return expr.value
      
      case 'field':
        return this.evaluateFieldAccess(expr.path, context)
      
      case 'operation':
        return this.evaluateOperation(expr, context)
      
      case 'condition':
        return this.evaluateCondition(expr, context)
      
      case 'permission':
        return this.evaluatePermission(expr, context)
      
      default:
        throw new Error(`Unknown expression type: ${(expr as any).type}`)
    }
  }
  
  private evaluateFieldAccess(path: string, context: ExpressionContext): any {
    // DRY: Single implementation for all field access
    const parts = path.split('.')
    let value = context.data
    
    for (const part of parts) {
      if (value == null) return null
      value = value[part]
    }
    
    return value
  }
  
  private evaluateOperation(expr: OperationExpression, context: ExpressionContext): any {
    // DRY: Reuse operation registry
    const operation = this.operations[expr.op]
    if (!operation) {
      throw new Error(`Unknown operation: ${expr.op}`)
    }
    
    // Evaluate arguments first
    const args = expr.args.map(arg => this.evaluate(arg, context))
    
    // Execute operation
    return operation(...args, context)
  }
  
  private evaluateCondition(expr: ConditionExpression, context: ExpressionContext): boolean {
    const left = this.evaluate(expr.left, context)
    const right = this.evaluate(expr.right, context)
    
    // DRY: Reuse comparison operations
    const comparator = this.operations[expr.op]
    return comparator(left, right)
  }
  
  private evaluatePermission(expr: PermissionExpression, context: ExpressionContext): boolean {
    // DRY: Reuse permission operations
    const checker = this.operations[expr.check]
    return checker(...expr.args, context)
  }
}

// Singleton instance (DRY)
export const evaluator = new ExpressionEvaluator()

// Convenience function
export function evaluate(expr: Expression, context: ExpressionContext): any {
  return evaluator.evaluate(expr, context)
}
```

**Tests** (DRY: Test each operation once):
```typescript
// packages/ui-expressions/src/__tests__/operations.test.ts

describe('Math Operations', () => {
  test('add', () => {
    expect(evaluate({
      type: 'operation',
      op: 'add',
      args: [
        { type: 'literal', value: 5 },
        { type: 'literal', value: 3 }
      ]
    }, {})).toBe(8)
  })
  
  test('multiply with field access', () => {
    expect(evaluate({
      type: 'operation',
      op: 'multiply',
      args: [
        { type: 'field', path: 'price' },
        { type: 'field', path: 'quantity' }
      ]
    }, {
      data: { price: 10, quantity: 3 },
      user: { id: '1', roles: [] },
      params: {},
      globals: {}
    })).toBe(30)
  })
})

describe('Permission Operations', () => {
  test('hasRole', () => {
    expect(evaluate({
      type: 'permission',
      check: 'hasRole',
      args: ['admin']
    }, {
      data: {},
      user: { id: '1', roles: ['admin', 'user'] },
      params: {},
      globals: {}
    })).toBe(true)
  })
})
```

**Exit Criteria**:
- ✅ All operations tested
- ✅ Field access works (including deep paths)
- ✅ Nested expressions work
- ✅ Type-safe
- ✅ Performance: <1ms per evaluation

---

#### **1.2: Update `@ssot-ui/schemas`** (3-4 hours)

**Add Expression Schemas**:

```typescript
// packages/ui-schemas/src/schemas/expressions.ts

// ... (schemas from above)

// Export for use in other schemas
export {
  ExpressionSchema,
  FieldAccessSchema,
  OperationSchema,
  ConditionSchema,
  PermissionSchema
}
```

**Update Template Schema**:

```typescript
// packages/ui-schemas/src/schemas/template.ts

import { ExpressionSchema, ConditionSchema } from './expressions.js'

export const FieldDefSchema = z.object({
  field: z.string(),
  label: z.string(),
  format: z.enum(['text', 'date', 'html', 'markdown', 'json', 'richtext']).optional(),
  
  // NEW: Computed fields
  computed: ExpressionSchema.optional(),
  
  // NEW: Conditional visibility
  visibleWhen: ConditionSchema.optional(),
  enabledWhen: ConditionSchema.optional(),
  
  // NEW: Field-level permissions
  readRoles: z.array(z.string()).optional(),
  writeRoles: z.array(z.string()).optional(),
  readPermission: PermissionSchema.optional(),
  writePermission: PermissionSchema.optional()
})
```

**Exit Criteria**:
- ✅ Expression schemas validate correctly
- ✅ Template schema includes expressions
- ✅ JSON Schema generated for IDE autocomplete

---

#### **1.3: Create `use-expression` Hook** (2-3 hours)

```typescript
// packages/ui-runtime/src/hooks/use-expression.ts

import { evaluate, type Expression, type ExpressionContext } from '@ssot-ui/expressions'
import { useMemo } from 'react'

/**
 * DRY: Single hook for ALL expression evaluation
 * SRP: Only evaluates, doesn't render
 */
export function useExpression(
  expr: Expression | undefined,
  context: ExpressionContext
): any {
  return useMemo(() => {
    if (!expr) return undefined
    
    try {
      return evaluate(expr, context)
    } catch (error) {
      console.error('Expression evaluation failed:', error)
      return undefined
    }
  }, [expr, context])
}

/**
 * DRY: Single hook for conditional visibility
 */
export function useConditionalVisibility(
  visibleWhen: Expression | undefined,
  context: ExpressionContext
): boolean {
  const result = useExpression(visibleWhen, context)
  return result === undefined ? true : Boolean(result)
}

/**
 * DRY: Single hook for conditional enabled state
 */
export function useConditionalEnabled(
  enabledWhen: Expression | undefined,
  context: ExpressionContext
): boolean {
  const result = useExpression(enabledWhen, context)
  return result === undefined ? true : Boolean(result)
}
```

**Exit Criteria**:
- ✅ Hook memoizes correctly
- ✅ Error handling works
- ✅ Tests pass

---

### **Phase 2: Computed Fields** (Week 2: 8-10 hours)

#### **2.1: Update Renderers to Support Computed Fields** (4-5 hours)

**Update Detail Page Renderer**:

```typescript
// packages/ui-runtime/src/renderers/detail-page-renderer.tsx

import { useExpression } from '../hooks/use-expression.js'

export function DetailPageRenderer(props: DetailPageRendererProps) {
  const { page, plan, adapters, locale } = props
  
  // ... (existing data fetching)
  
  // Build context (DRY: single context for all expressions)
  const context: ExpressionContext = useMemo(() => ({
    data: item,
    user: { id: session?.user?.id || '', roles: session?.user?.roles || [] },
    params: routeParams,
    globals: {}
  }), [item, session, routeParams])
  
  return (
    <div>
      {page.fields.map(field => (
        <FieldRenderer
          key={field.field}
          field={field}
          context={context}
          adapters={adapters}
        />
      ))}
    </div>
  )
}

// NEW: Single field renderer for all field types
function FieldRenderer({ field, context, adapters }: FieldRendererProps) {
  // DRY: Use same hook for all computed values
  const value = useExpression(
    field.computed || { type: 'field', path: field.field },
    context
  )
  
  // DRY: Use same hook for visibility
  const isVisible = useConditionalVisibility(field.visibleWhen, context)
  
  if (!isVisible) return null
  
  // Format and render
  const formatted = adapters.format.formatValue(value, field.format)
  
  return (
    <div className="field">
      <label>{field.label}</label>
      <div>{formatted}</div>
    </div>
  )
}
```

**Update List Page Renderer**:

```typescript
// packages/ui-runtime/src/renderers/list-page-renderer.tsx

export function ListPageRenderer(props: ListPageRendererProps) {
  // ... (existing code)
  
  // NEW: Generate columns from template.json fields
  const columns = useMemo(() => {
    return page.fields.map(field => ({
      key: field.field,
      header: field.label,
      // NEW: Use expression for cell value
      cell: (item) => {
        const context: ExpressionContext = {
          data: item,
          user: { id: session?.user?.id || '', roles: session?.user?.roles || [] },
          params: {},
          globals: {}
        }
        
        const value = evaluate(
          field.computed || { type: 'field', path: field.field },
          context
        )
        
        return adapters.format.formatValue(value, field.format)
      }
    }))
  }, [page.fields, adapters, session])
  
  return <DataTable data={items} columns={columns} ... />
}
```

**Exit Criteria**:
- ✅ Computed fields work in detail pages
- ✅ Computed fields work in list pages
- ✅ Computed fields work in forms
- ✅ Error handling for invalid expressions

---

#### **2.2: Example JSON Configurations** (1-2 hours)

**Blog Example with Computed Fields**:

```json
// examples/json-templates/blog/template.json

{
  "pages": [
    {
      "type": "detail",
      "route": "/posts/[slug]",
      "model": "post",
      "fields": [
        {
          "field": "title",
          "label": "Title"
        },
        {
          "field": "authorName",
          "label": "Author",
          "computed": {
            "type": "operation",
            "op": "concat",
            "args": [
              { "type": "field", "path": "author.firstName" },
              { "type": "literal", "value": " " },
              { "type": "field", "path": "author.lastName" }
            ]
          }
        },
        {
          "field": "timeAgo",
          "label": "Published",
          "computed": {
            "type": "operation",
            "op": "timeAgo",
            "args": [
              { "type": "field", "path": "createdAt" }
            ]
          }
        },
        {
          "field": "status",
          "label": "Status",
          "computed": {
            "type": "operation",
            "op": "if",
            "args": [
              {
                "type": "condition",
                "op": "eq",
                "left": { "type": "field", "path": "published" },
                "right": { "type": "literal", "value": true }
              },
              { "type": "literal", "value": "Live" },
              { "type": "literal", "value": "Draft" }
            ]
          }
        }
      ]
    }
  ]
}
```

**E-Commerce Example with Computed Fields**:

```json
{
  "fields": [
    {
      "field": "total",
      "label": "Total Price",
      "computed": {
        "type": "operation",
        "op": "multiply",
        "args": [
          { "type": "field", "path": "price" },
          { "type": "field", "path": "quantity" }
        ]
      }
    },
    {
      "field": "discount",
      "label": "Discount (10%)",
      "computed": {
        "type": "operation",
        "op": "multiply",
        "args": [
          { "type": "field", "path": "price" },
          { "type": "literal", "value": 0.10 }
        ]
      }
    },
    {
      "field": "finalPrice",
      "label": "Final Price",
      "computed": {
        "type": "operation",
        "op": "subtract",
        "args": [
          { "type": "field", "path": "price" },
          {
            "type": "operation",
            "op": "multiply",
            "args": [
              { "type": "field", "path": "price" },
              { "type": "literal", "value": 0.10 }
            ]
          }
        ]
      }
    }
  ]
}
```

---

### **Phase 3: Conditional UI** (Week 2: 6-8 hours)

#### **3.1: Implement Conditional Visibility** (3-4 hours)

**Update All Renderers**:

```typescript
// DRY: Single wrapper component for conditional rendering
function ConditionalField({
  field,
  context,
  children
}: {
  field: FieldDef,
  context: ExpressionContext,
  children: React.ReactNode
}) {
  const isVisible = useConditionalVisibility(field.visibleWhen, context)
  const isEnabled = useConditionalEnabled(field.enabledWhen, context)
  
  if (!isVisible) return null
  
  return (
    <div className={isEnabled ? '' : 'opacity-50 pointer-events-none'}>
      {children}
    </div>
  )
}

// Usage in all renderers (DRY):
<ConditionalField field={field} context={context}>
  <FieldRenderer field={field} context={context} />
</ConditionalField>
```

**Example JSON**:

```json
{
  "fields": [
    {
      "field": "publishedAt",
      "label": "Published Date",
      "visibleWhen": {
        "type": "condition",
        "op": "eq",
        "left": { "type": "field", "path": "published" },
        "right": { "type": "literal", "value": true }
      }
    },
    {
      "field": "draftNotes",
      "label": "Draft Notes",
      "visibleWhen": {
        "type": "condition",
        "op": "eq",
        "left": { "type": "field", "path": "published" },
        "right": { "type": "literal", "value": false }
      }
    },
    {
      "field": "deleteButton",
      "label": "Delete",
      "enabledWhen": {
        "type": "permission",
        "check": "hasRole",
        "args": ["admin"]
      }
    }
  ]
}
```

---

### **Phase 4: Field-Level Permissions** (Week 3: 4-6 hours)

#### **4.1: Implement Permission Checks** (2-3 hours)

**Add Permission Hook**:

```typescript
// packages/ui-runtime/src/hooks/use-field-permissions.ts

export function useFieldPermissions(
  field: FieldDef,
  context: ExpressionContext
): {
  canRead: boolean
  canWrite: boolean
} {
  const canRead = useMemo(() => {
    // Role-based
    if (field.readRoles) {
      return field.readRoles.some(role => context.user.roles.includes(role))
    }
    
    // Expression-based
    if (field.readPermission) {
      return Boolean(evaluate(field.readPermission, context))
    }
    
    // Default: can read
    return true
  }, [field, context])
  
  const canWrite = useMemo(() => {
    // Role-based
    if (field.writeRoles) {
      return field.writeRoles.some(role => context.user.roles.includes(role))
    }
    
    // Expression-based
    if (field.writePermission) {
      return Boolean(evaluate(field.writePermission, context))
    }
    
    // Default: can write
    return true
  }, [field, context])
  
  return { canRead, canWrite }
}
```

**Update Field Renderer**:

```typescript
function FieldRenderer({ field, context, mode }: FieldRendererProps) {
  const { canRead, canWrite } = useFieldPermissions(field, context)
  
  // Hide field if can't read
  if (!canRead) return null
  
  // Render as read-only if can't write
  if (mode === 'edit' && !canWrite) {
    return <ReadOnlyField field={field} context={context} />
  }
  
  return <EditableField field={field} context={context} />
}
```

**Example JSON**:

```json
{
  "fields": [
    {
      "field": "email",
      "label": "Email",
      "readRoles": ["admin", "owner"],
      "writeRoles": ["admin"]
    },
    {
      "field": "salary",
      "label": "Salary",
      "readRoles": ["admin", "hr"],
      "writeRoles": ["admin"]
    },
    {
      "field": "status",
      "label": "Status",
      "writePermission": {
        "type": "operation",
        "op": "or",
        "args": [
          {
            "type": "permission",
            "check": "hasRole",
            "args": ["admin"]
          },
          {
            "type": "permission",
            "check": "isOwner",
            "args": []
          }
        ]
      }
    }
  ]
}
```

---

### **Phase 5: Advanced Filters** (Week 3: 4-6 hours)

#### **5.1: Filter Groups (AND/OR Logic)** (3-4 hours)

**Update Filter Schema**:

```typescript
// packages/ui-schemas/src/schemas/filters.ts

export const FilterGroupSchema: z.ZodType<FilterGroup> = z.lazy(() =>
  z.object({
    type: z.literal('group'),
    operator: z.enum(['AND', 'OR']),
    filters: z.array(z.union([
      SimpleFilterSchema,
      FilterGroupSchema  // Recursive!
    ]))
  })
)

export const FilterConfigSchema = z.union([
  SimpleFilterSchema,
  FilterGroupSchema
])
```

**Example JSON**:

```json
{
  "filters": {
    "type": "group",
    "operator": "OR",
    "filters": [
      {
        "type": "group",
        "operator": "AND",
        "filters": [
          { "field": "status", "op": "eq", "value": "published" },
          { "field": "featured", "op": "eq", "value": true }
        ]
      },
      {
        "field": "authorId",
        "op": "eq",
        "value": "{{currentUserId}}"
      }
    ]
  }
}
```

---

## 📊 **IMPLEMENTATION SUMMARY**

### **Week 1: Foundation** (12-15 hours)
- ✅ Create `@ssot-ui/expressions` package
- ✅ Update schemas with expression support
- ✅ Create `use-expression` hook
- ✅ Write comprehensive tests

**Output**: Expression evaluation engine working

---

### **Week 2: Computed Fields & Conditional UI** (14-18 hours)
- ✅ Update all renderers for computed fields
- ✅ Implement conditional visibility/enabled
- ✅ Create example JSON configs
- ✅ Write integration tests

**Output**: Computed fields and conditional UI working in all components

---

### **Week 3: Permissions & Filters** (8-12 hours)
- ✅ Implement field-level permissions
- ✅ Add filter groups (AND/OR logic)
- ✅ Update adapters to handle complex filters
- ✅ Create example JSON configs

**Output**: Fine-grained permissions and advanced filtering

---

## 📊 **DRY/SRP ENFORCEMENT**

### **DRY Wins** ✅:

1. **Single Expression Evaluator**
   - All components use same evaluator
   - Operations defined once
   - No duplication across renderers

2. **Single Context Hook**
   - All expression evaluation uses `useExpression`
   - Consistent context across all components

3. **Single Permission Checker**
   - All permission checks use `useFieldPermissions`
   - No duplication of permission logic

4. **Single Conditional Renderer**
   - All conditional UI uses `ConditionalField`
   - Consistent behavior everywhere

---

### **SRP Compliance** ✅:

1. **`@ssot-ui/expressions`**
   - **Only** parses and evaluates expressions
   - Doesn't know about React or rendering

2. **`use-expression` Hook**
   - **Only** evaluates expressions in React context
   - Doesn't render anything

3. **`FieldRenderer`**
   - **Only** renders fields
   - Delegates evaluation to hooks
   - Delegates formatting to adapters

4. **`ConditionalField`**
   - **Only** handles visibility/enabled state
   - Delegates rendering to children

---

## 📊 **EXPRESSIVENESS IMPROVEMENT**

### **Before**:
| Feature | Support | % |
|---------|---------|---|
| Computed Fields | ❌ No | 0% |
| Conditional UI | ❌ No | 0% |
| Field Permissions | ❌ No | 0% |
| Advanced Filters | ❌ No | 0% |
| **Overall** | **Limited** | **40%** |

### **After**:
| Feature | Support | % |
|---------|---------|---|
| Computed Fields | ✅ Full | 100% |
| Conditional UI | ✅ Full | 100% |
| Field Permissions | ✅ Full | 100% |
| Advanced Filters | ✅ Full | 100% |
| **Overall** | **Excellent** | **75-80%** |

---

## 🎯 **EXAMPLE: E-COMMERCE WITH EXPRESSIONS**

**Before** (40% JSON):
```json
{
  "field": "price",
  "label": "Price"
}
// Need custom code for:
// - Discount calculation
// - Total price
// - Hide price for non-members
// - Disable edit for non-admins
```

**After** (80% JSON):
```json
{
  "fields": [
    {
      "field": "price",
      "label": "Price",
      "writeRoles": ["admin"],
      "visibleWhen": {
        "type": "permission",
        "check": "hasRole",
        "args": ["member"]
      }
    },
    {
      "field": "discount",
      "label": "Discount",
      "computed": {
        "type": "operation",
        "op": "multiply",
        "args": [
          { "type": "field", "path": "price" },
          { "type": "literal", "value": 0.10 }
        ]
      }
    },
    {
      "field": "total",
      "label": "Total",
      "computed": {
        "type": "operation",
        "op": "subtract",
        "args": [
          { "type": "field", "path": "price" },
          { "type": "field", "path": "discount" }
        ]
      }
    }
  ]
}
// Only need custom code for:
// - Complex workflows
// - Payment processing
```

---

## 🎯 **SUCCESS METRICS**

### **Code Reduction**:
- Before: ~500 lines per template
- After: ~100 lines per template + JSON
- **Reduction**: 80%

### **Expressiveness**:
- Before: 40% JSON, 60% code
- After: 75% JSON, 25% code
- **Improvement**: +35%

### **Maintainability**:
- Before: Changes require code edits
- After: Changes are JSON only (most cases)
- **Improvement**: 3x faster iterations

---

## 📋 **ACCEPTANCE CRITERIA**

### **Phase 1 (Foundation)**:
- [ ] Expression evaluator handles all operation types
- [ ] Schemas validate expression JSON
- [ ] Hook memoizes correctly
- [ ] 100+ tests passing
- [ ] <1ms per evaluation

### **Phase 2 (Computed Fields)**:
- [ ] Computed fields work in list pages
- [ ] Computed fields work in detail pages
- [ ] Computed fields work in forms
- [ ] Nested expressions work
- [ ] Error handling works

### **Phase 3 (Conditional UI)**:
- [ ] `visibleWhen` hides/shows fields
- [ ] `enabledWhen` enables/disables fields
- [ ] Works in all renderers
- [ ] Performance: no re-render loops

### **Phase 4 (Permissions)**:
- [ ] Field-level read permissions work
- [ ] Field-level write permissions work
- [ ] Expression-based permissions work
- [ ] Server-side filtering of hidden fields

### **Phase 5 (Filters)**:
- [ ] Filter groups (AND/OR) work
- [ ] Nested filter groups work
- [ ] Server adapter handles complex filters
- [ ] Performance: efficient queries

---

## 🚀 **NEXT STEPS**

1. **Review this plan** - Any concerns?
2. **Start Phase 1** - Create expression engine
3. **Iterative delivery** - Ship each phase independently
4. **Test rigorously** - 100+ tests minimum
5. **Document heavily** - Examples for every feature

**Total Effort**: 34-45 hours (4-6 weeks)  
**Impact**: **40% → 75-80%** expressiveness improvement

---

**Ready to start with Phase 1 (Expression Engine)?**
