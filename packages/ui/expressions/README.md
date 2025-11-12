# @ssot-ui/expressions

Expression evaluation engine for SSOT UI - enabling declarative computed fields, conditional logic, and permissions through JSON.

## Architecture Principles

- **DRY**: Single evaluator for all expression types, operations defined once
- **SRP**: Only handles expression evaluation, no rendering or storage
- **Model-Driven**: JSON expressions drive all behavior

## Installation

```bash
npm install @ssot-ui/expressions
```

## Usage

### Basic Evaluation

```typescript
import { evaluate } from '@ssot-ui/expressions'

const result = evaluate(
  {
    type: 'operation',
    op: 'add',
    args: [
      { type: 'literal', value: 5 },
      { type: 'literal', value: 3 }
    ]
  },
  {
    data: {},
    user: { id: '1', roles: [] },
    params: {},
    globals: {}
  }
)
// result → 8
```

### Field Access

```typescript
evaluate(
  {
    type: 'field',
    path: 'user.name'
  },
  {
    data: { user: { name: 'John' } },
    user: { id: '1', roles: [] },
    params: {},
    globals: {}
  }
)
// result → 'John'
```

### Computed Fields

```typescript
// fullName = firstName + ' ' + lastName
evaluate(
  {
    type: 'operation',
    op: 'concat',
    args: [
      { type: 'field', path: 'firstName' },
      { type: 'literal', value: ' ' },
      { type: 'field', path: 'lastName' }
    ]
  },
  {
    data: { firstName: 'John', lastName: 'Doe' },
    user: { id: '1', roles: [] },
    params: {},
    globals: {}
  }
)
// result → 'John Doe'
```

### Conditional Logic

```typescript
// status = published ? 'Live' : 'Draft'
evaluate(
  {
    type: 'operation',
    op: 'if',
    args: [
      {
        type: 'condition',
        op: 'eq',
        left: { type: 'field', path: 'published' },
        right: { type: 'literal', value: true }
      },
      { type: 'literal', value: 'Live' },
      { type: 'literal', value: 'Draft' }
    ]
  },
  {
    data: { published: true },
    user: { id: '1', roles: [] },
    params: {},
    globals: {}
  }
)
// result → 'Live'
```

### Permissions

```typescript
evaluate(
  {
    type: 'permission',
    check: 'hasRole',
    args: ['admin']
  },
  {
    data: {},
    user: { id: '1', roles: ['admin', 'user'] },
    params: {},
    globals: {}
  }
)
// result → true
```

## Available Operations

### Math
- `add(...numbers)` - Sum numbers
- `subtract(a, b)` - Subtract
- `multiply(...numbers)` - Multiply
- `divide(a, b)` - Divide
- `mod(a, b)` - Modulo
- `pow(base, exp)` - Power
- `abs(n)` - Absolute value
- `round(n)` - Round
- `floor(n)` - Floor
- `ceil(n)` - Ceiling
- `min(...numbers)` - Minimum
- `max(...numbers)` - Maximum

### String
- `concat(...strings)` - Concatenate
- `upper(s)` - Uppercase
- `lower(s)` - Lowercase
- `capitalize(s)` - Capitalize
- `trim(s)` - Trim whitespace
- `substring(s, start, end)` - Substring
- `replace(s, search, replacement)` - Replace
- `split(s, separator)` - Split
- `join(arr, separator)` - Join
- `contains(s, search)` - Contains
- `startsWith(s, search)` - Starts with
- `endsWith(s, search)` - Ends with
- `length(s)` - Length

### Date
- `formatDate(date, format)` - Format date
- `timeAgo(date)` - Relative time
- `yearsAgo(date)` - Years difference
- `monthsAgo(date)` - Months difference
- `daysAgo(date)` - Days difference
- `now()` - Current date/time
- `currentYear()` - Current year
- `parseDate(str)` - Parse date
- `isPast(date)` - Is in past
- `isFuture(date)` - Is in future

### Logical
- `and(...values)` - Logical AND
- `or(...values)` - Logical OR
- `not(value)` - Logical NOT
- `if(condition, then, else)` - If-then-else
- `coalesce(...values)` - First non-null
- `exists(value)` - Value exists
- `isNull(value)` - Is null
- `isEmpty(value)` - Is empty

### Comparison
- `eq(a, b)` - Equal
- `ne(a, b)` - Not equal
- `gt(a, b)` - Greater than
- `lt(a, b)` - Less than
- `gte(a, b)` - Greater than or equal
- `lte(a, b)` - Less than or equal
- `in(value, array)` - In array
- `between(value, min, max)` - Between

### Array
- `count(arr)` - Count elements
- `sum(arr, field?)` - Sum values
- `avg(arr, field?)` - Average
- `first(arr)` - First element
- `last(arr)` - Last element
- `map(arr, field)` - Map field
- `filter(arr, field, value)` - Filter
- `find(arr, field, value)` - Find
- `some(arr, field, value)` - Some match
- `every(arr, field, value)` - All match
- `slice(arr, start, end)` - Slice
- `unique(arr)` - Unique values
- `flatten(arr)` - Flatten

### Permission
- `hasRole(role, context)` - Has role
- `hasAnyRole(roles, context)` - Has any role
- `hasAllRoles(roles, context)` - Has all roles
- `hasPermission(perm, context)` - Has permission
- `isOwner(field, context)` - Is owner
- `isAuthenticated(context)` - Is authenticated
- `isAnonymous(context)` - Is anonymous

## Expression Types

### Literal
```typescript
{ type: 'literal', value: any }
```

### Field Access
```typescript
{ type: 'field', path: 'user.name' }
```

### Operation
```typescript
{
  type: 'operation',
  op: 'add',
  args: [expr1, expr2, ...]
}
```

### Condition
```typescript
{
  type: 'condition',
  op: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'exists',
  left: expr,
  right: expr
}
```

### Permission
```typescript
{
  type: 'permission',
  check: 'hasRole' | 'hasPermission' | 'isOwner',
  args: [...]
}
```

## Context

```typescript
interface ExpressionContext {
  data: Record<string, any>       // Current item/form data
  user: {
    id: string
    roles: string[]
    permissions?: string[]
  }
  params: Record<string, string>  // Route params
  globals: Record<string, any>    // Global state
}
```

## Custom Operations

```typescript
import { ExpressionEvaluator } from '@ssot-ui/expressions'

const evaluator = new ExpressionEvaluator(undefined, {
  customOperations: {
    myOp: (a, b) => a + b * 2
  }
})

evaluator.evaluate({ type: 'operation', op: 'myOp', args: [...] }, context)
```

## Performance

- **< 1ms** per evaluation for simple expressions
- **< 5ms** for complex nested expressions
- **Memoization recommended** for repeated evaluations

## License

MIT


