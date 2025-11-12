# @ssot-ui/policy-engine

Policy engine for row-level security (RLS) and field-level permissions.

## Features

- ✅ **Row-Level Security (RLS)**: Automatically filters queries based on user permissions
- ✅ **Field-Level Permissions**: Control which fields users can read/write
- ✅ **Expression-Based**: Uses `@ssot-ui/expressions` for flexible policy rules
- ✅ **Type-Safe**: Full TypeScript support with Zod validation
- ✅ **Fail-Closed**: Denies access by default if no policy matches

## Installation

```bash
npm install @ssot-ui/policy-engine
```

## Usage

### 1. Define Policies

Create a `policies.json` file:

```json
{
  "policies": [
    {
      "model": "Track",
      "action": "read",
      "allow": {
        "type": "operation",
        "op": "or",
        "args": [
          {
            "type": "condition",
            "op": "eq",
            "left": { "type": "field", "path": "isPublic" },
            "right": { "type": "literal", "value": true }
          },
          {
            "type": "condition",
            "op": "eq",
            "left": { "type": "field", "path": "uploadedBy" },
            "right": { "type": "field", "path": "user.id" }
          }
        ]
      }
    }
  ]
}
```

### 2. Create Policy Engine

```typescript
import { PolicyEngine } from '@ssot-ui/policy-engine'
import policies from './policies.json'

const policyEngine = new PolicyEngine(policies)
```

### 3. Check Access

```typescript
const allowed = await policyEngine.checkAccess({
  user: session.user,
  model: 'Track',
  action: 'read'
})

if (!allowed) {
  return res.status(403).json({ error: 'Forbidden' })
}
```

### 4. Apply Row Filters

```typescript
const whereWithPolicy = policyEngine.applyRowFilters({
  model: 'Track',
  action: 'read',
  where: { isPublic: true },
  user: session.user
})

// whereWithPolicy = {
//   AND: [
//     { isPublic: true },
//     { OR: [{ isPublic: true }, { uploadedBy: 'user-123' }] }
//   ]
// }

const tracks = await prisma.track.findMany({
  where: whereWithPolicy
})
```

### 5. Get Allowed Fields

```typescript
const fields = policyEngine.getAllowedFields({
  model: 'Track',
  action: 'update',
  user: session.user
})

// fields = {
//   read: ['id', 'title', 'description', 'audioUrl'],
//   write: ['title', 'description']
// }

// Filter data to only allowed fields
import { filterDataFields } from '@ssot-ui/policy-engine'

const safeData = filterDataFields(requestData, fields.write)
```

## Policy Structure

### PolicyRule

```typescript
interface PolicyRule {
  model: string                    // Model name (e.g., "Track")
  action: 'create' | 'read' | 'update' | 'delete'
  allow: Expression                // Expression that evaluates to boolean
  fields?: {
    read?: string[]                // Fields allowed for reading
    write?: string[]               // Fields allowed for writing
    deny?: string[]                // Fields explicitly denied
  }
}
```

### Common Patterns

#### Allow if Owner

```json
{
  "model": "Track",
  "action": "update",
  "allow": {
    "type": "condition",
    "op": "eq",
    "left": { "type": "field", "path": "uploadedBy" },
    "right": { "type": "field", "path": "user.id" }
  }
}
```

#### Allow if Admin

```json
{
  "model": "User",
  "action": "delete",
  "allow": {
    "type": "permission",
    "check": "hasRole",
    "args": ["admin"]
  }
}
```

#### Allow if Public OR Owner

```json
{
  "model": "Track",
  "action": "read",
  "allow": {
    "type": "operation",
    "op": "or",
    "args": [
      {
        "type": "condition",
        "op": "eq",
        "left": { "type": "field", "path": "isPublic" },
        "right": { "type": "literal", "value": true }
      },
      {
        "type": "condition",
        "op": "eq",
        "left": { "type": "field", "path": "uploadedBy" },
        "right": { "type": "field", "path": "user.id" }
      }
    ]
  }
}
```

## API

### PolicyEngine

#### `constructor(policies: Policies)`

Create a new policy engine with the given policies.

#### `checkAccess(context: PolicyContext): Promise<boolean>`

Check if an action is allowed.

#### `evaluate(context: PolicyContext): Promise<PolicyResult>`

Evaluate policies and return detailed result.

#### `applyRowFilters(options): any`

Apply row-level filters to a query.

#### `getAllowedFields(options): AllowedFields`

Get allowed read/write fields.

## Security

### Fail-Closed by Default

If no policy matches, access is **denied**. This is safer than allowing by default.

### Field-Level Deny

The `deny` list takes precedence over `read`/`write` lists:

```json
{
  "fields": {
    "write": ["*"],
    "deny": ["role", "permissions"]
  }
}
```

Result: Can write all fields **except** `role` and `permissions`.

### Row-Level Security

Policies automatically generate WHERE conditions:

```typescript
// Policy: "uploadedBy = user.id"
// Result: WHERE uploadedBy = 'user-123'
```

This ensures users can only access their own data.

## Examples

See `examples/policies.json` for complete policy examples.

## License

MIT

