# RLS + WebSocket Integration Guide

**Version**: 2.0  
**Date**: November 12, 2025  
**Status**: Integrated  

---

## Overview

Row-Level Security (RLS) policies apply **consistently** to both HTTP and WebSocket transports.

**Key Principle**: Same security rules, different transports.

---

## Architecture

```
Schema Annotations
    ↓
@@policy("read", rule: "isOwner || isPublic")
    ↓
┌─────────────────────────────────────┐
│       RLS Plugin Generator          │
│  Generates: middleware/rls.ts       │
└─────────┬───────────────────────────┘
          │
          ├─────────────────────────────┐
          │                             │
          ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│  HTTP Routes     │        │  WS Gateway      │
│                  │        │                  │
│ applyRLS(...)    │        │ canSubscribe()   │
│ checkPermissions │        │ filterBroadcast()│
└──────────────────┘        └──────────────────┘
          │                             │
          └─────────────────────────────┘
                      │
                      ▼
              Shared RLS Logic
```

---

## Schema Configuration

```prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  authorId  String
  published Boolean  @default(false)
  
  /// @@policy("read", rule: "published || isOwner")
  /// @@policy("write", rule: "isOwner")
  /// @@policy("delete", rule: "isOwner || isAdmin")
  /// @@realtime(subscribe: ["list", "item"], broadcast: ["created", "updated"])
}
```

**Result**: Policies apply to both HTTP API and WebSocket subscriptions.

---

## Generated RLS Middleware

```typescript
// generated/src/middleware/rls.ts

/**
 * Apply RLS policies to database queries
 */
export function applyRLS(model: string, user: User, where: any): any {
  // Admin bypass
  if (user.role === 'admin') return where
  
  switch (model) {
    case 'Post':
      // Policy: "published || isOwner"
      return {
        ...where,
        OR: [
          { published: true },
          { authorId: user.id }
        ]
      }
    
    default:
      return where
  }
}

/**
 * Check if user can perform operation on data
 */
export function checkPermissions(
  model: string,
  user: User,
  operation: 'read' | 'write' | 'delete',
  data: any
): boolean {
  // Admin bypass
  if (user.role === 'admin') return true
  
  switch (model) {
    case 'Post':
      if (operation === 'read') {
        // Policy: "published || isOwner"
        return data.published || data.authorId === user.id
      }
      if (operation === 'write' || operation === 'delete') {
        // Policy: "isOwner"
        return data.authorId === user.id
      }
      break
  }
  
  return false
}

/**
 * Filter fields based on permissions
 */
export function filterFields(
  model: string,
  data: any,
  user: User,
  operation: 'read' | 'write'
): any {
  // Field-level permissions would filter here
  // Example: Hide email unless isOwner
  return data
}
```

---

## HTTP Integration

```typescript
// generated/src/routes/post.ts

import { applyRLS, checkPermissions } from '../middleware/rls.js'

router.get('/api/posts', async (req, res) => {
  const user = req.user  // From auth middleware
  
  // Apply RLS to query
  const where = applyRLS('Post', user, req.query.where || {})
  
  const posts = await prisma.post.findMany({ where })
  
  res.json({ items: posts, total: posts.length })
})

router.get('/api/posts/:id', async (req, res) => {
  const user = req.user
  
  const post = await prisma.post.findUnique({
    where: { id: req.params.id }
  })
  
  // Check read permission
  if (!checkPermissions('Post', user, 'read', post)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  
  res.json(post)
})
```

---

## WebSocket Integration

```typescript
// generated/src/websockets/channels.ts

import { applyRLS, checkPermissions, filterFields } from '../middleware/rls.js'

/**
 * Check if user can subscribe to channel
 */
export async function canSubscribe(user: any, channel: string): Promise<boolean> {
  const [model, operation, id] = channel.split(':')
  
  // Apply RLS logic
  if (operation === 'list') {
    // Can subscribe if user can read at least one record
    return hasReadAccess(user, model)
  }
  
  if (operation === 'item' && id) {
    // Can subscribe if user can read this specific item
    const item = await fetchItem(model, id)
    return item ? checkPermissions(model, user, 'read', item) : false
  }
  
  return false
}

/**
 * Filter broadcast data based on RLS
 */
export function filterBroadcastData(model: string, data: any, user: any): any | null {
  // Check read permission
  if (!checkPermissions(model, user, 'read', data)) {
    return null  // Don't send to this user
  }
  
  // Apply field-level filtering
  return filterFields(model, data, user, 'read')
}
```

---

## Broadcast with RLS

```typescript
// generated/src/routes/post.ts

router.post('/api/posts', async (req, res) => {
  const post = await prisma.post.create({ data: req.body })
  
  // Broadcast to WebSocket clients (with RLS filtering)
  wsGateway.broadcastWithRLS('Post:created', post)
  
  res.json(post)
})
```

**`broadcastWithRLS` implementation**:

```typescript
// generated/src/websockets/gateway.ts

broadcastWithRLS(channel: string, data: any): void {
  const [model] = channel.split(':')
  
  for (const client of this.clients.values()) {
    if (client.subscriptions.has(channel)) {
      // Filter data based on user's permissions
      const filtered = filterBroadcastData(model, data, client.user)
      
      if (filtered) {
        this.send(client, {
          type: 'update',
          channel,
          data: filtered
        })
      }
    }
  }
}
```

---

## Permission Rules

### Built-In Rules

| Rule | Meaning | Example |
|------|---------|---------|
| `true` | Public (anyone) | Public posts |
| `authenticated` | Logged-in users | User profiles |
| `isOwner` | Resource owner | Edit own posts |
| `isAdmin` | Admin role | Delete any post |

---

### Expression Rules

```prisma
/// @@policy("read", rule: "published || isOwner")
/// @@policy("read", rule: "isPublic || (isOwner && !archived)")
/// @@policy("write", rule: "isOwner && !locked")
```

**Evaluation**: Uses `@ssot-ui/expressions` engine

---

### Field-Level Policies

```prisma
model User {
  id       String @id
  email    String
  phone    String
  role     String
  
  /// @@policy("read", rule: "isAdmin", fields: ["email", "phone"])
  /// @@policy("read", rule: "true", fields: ["id", "role"])
}
```

**Result**:
- Admins see: `{ id, email, phone, role }`
- Others see: `{ id, role }`

---

## Security Guarantees

### 1. Fail-Closed
Default deny if no policy or policy fails:

```typescript
if (!checkPermissions(model, user, 'read', data)) {
  return null  // Deny access
}
```

---

### 2. Same Logic for HTTP and WS

```typescript
// HTTP route
const canRead = checkPermissions('Post', user, 'read', post)

// WebSocket broadcast
const filtered = filterBroadcastData('Post', post, user)

// Both use same checkPermissions() function!
```

---

### 3. Query-Level + Row-Level

```typescript
// Query-level (reduces DB queries)
const where = applyRLS('Post', user, {})
// WHERE (published = true OR authorId = 'user-123')

// Row-level (post-query check)
const canRead = checkPermissions('Post', user, 'read', post)
// Verify individual record matches policy
```

---

## Testing Security

### Test 1: HTTP Respects Policy

```bash
# As regular user
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3000/api/posts/123

# Should return 403 if not owner and not published
```

---

### Test 2: WebSocket Respects Policy

```javascript
// Connect as regular user
const ws = new WebSocket('ws://localhost:3001/ws?token=USER_TOKEN')

// Subscribe to posts
ws.send({ type: 'subscribe', channel: 'Post:list' })

// Create post as another user
// Broadcast should NOT be received (filtered by RLS)
```

---

### Test 3: Field Filtering

```bash
# As regular user, get other user's profile
curl http://localhost:3000/api/users/other-user-id

# Should NOT include email, phone (admin-only fields)
```

---

## Best Practices

### 1. Define Policies in Schema

```prisma
/// @@policy("read", rule: "published || isOwner")
```

**Not in code** (single source of truth)

---

### 2. Use Built-In Rules When Possible

```prisma
/// @@policy("read", rule: "authenticated")  // ✅ Clear
/// @@policy("read", rule: "user !== null")   // ❌ Verbose
```

---

### 3. Test Both Transports

```typescript
describe('Post security', () => {
  it('respects RLS via HTTP', async () => {
    const res = await request.get('/api/posts/123')
    expect(res.status).toBe(403)
  })
  
  it('respects RLS via WebSocket', async () => {
    ws.send({ type: 'subscribe', channel: 'Post:item:123' })
    await expectMessage({ type: 'error', error: 'Unauthorized' })
  })
})
```

---

### 4. Fail-Closed Always

```typescript
// ✅ Deny by default
if (!hasPermission) return false

// ❌ Allow by default
if (hasPermission) return true
return true  // Dangerous!
```

---

## Debugging

### Check RLS is Applied

```typescript
// Enable RLS debug logging
export const DEBUG_RLS = true

// See what filters are applied
applyRLS('Post', user, where)
// Logs: [RLS] Post query WHERE: { OR: [...] }
```

---

### Test Permissions

```typescript
import { checkPermissions } from './middleware/rls.js'

const user = { id: 'user-123', role: 'user' }
const post = { id: '1', authorId: 'other-user', published: true }

console.log(checkPermissions('Post', user, 'read', post))
// true (post is published)

console.log(checkPermissions('Post', user, 'write', post))
// false (not owner)
```

---

## Summary

| Component | RLS Integration | Status |
|-----------|----------------|--------|
| HTTP Routes | ✅ applyRLS() | Complete |
| WebSocket Gateway | ✅ canSubscribe() | Complete |
| Broadcast Filtering | ✅ filterBroadcastData() | Complete |
| Field Masking | ⏳ filterFields() | TODO |
| Expression Eval | ⏳ evaluateExpression() | TODO |

**Key Insight**: Single security layer, multiple transports.

---

**Status**: ✅ Integrated  
**Security**: Fail-closed  
**Testing**: Required  

