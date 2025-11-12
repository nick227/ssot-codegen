# Schema Annotations Guide

**Version**: 2.0  
**Date**: November 12, 2025  
**Status**: Implemented  

---

## Overview

Schema annotations extend Prisma schema with SSOT-specific features using `@@annotation()` syntax in model documentation.

---

## Supported Annotations

### 1. `@@service` - External Service Integration

Integrate external services (storage, payments, AI, etc.) with models.

**Syntax**:
```prisma
@@service("ProviderName", key: "value", ...)
```

**Example**:
```prisma
model Image {
  id        String   @id @default(uuid())
  filename  String
  url       String
  createdAt DateTime @default(now())
  
  /// @@service("Cloudinary", folder: "uploads", quality: "auto")
}
```

**Supported Providers**:
- **Storage**: Cloudinary, S3, R2
- **Payments**: Stripe, PayPal
- **Email**: SendGrid, Mailgun
- **AI**: OpenAI, Claude, Gemini
- **Voice**: Deepgram, ElevenLabs

**Generated**: Plugin integration code, upload endpoints, service methods

---

### 2. `@@auth` - Authentication Strategy

Define authentication requirements for model access.

**Syntax**:
```prisma
@@auth("Strategy", option: "value", ...)
```

**Example**:
```prisma
model User {
  id       String   @id @default(uuid())
  email    String   @unique
  password String
  
  /// @@auth("JWT", expiry: "7d", refresh: true)
}
```

**Supported Strategies**:
- **JWT**: JSON Web Tokens
- **Bearer**: Bearer token authentication
- **OAuth2**: OAuth 2.0 flow
- **NextAuth**: NextAuth.js integration
- **Basic**: HTTP Basic Auth

**Generated**: Auth middleware, token validation, login/logout routes

---

### 3. `@@policy` - Row-Level Security

Define access control policies for data operations.

**Syntax**:
```prisma
@@policy("operation", rule: "expression", fields: ["field1", "field2"])
```

**Operations**: `read`, `write`, `delete`, `*` (all)

**Example**:
```prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  authorId  String
  published Boolean  @default(false)
  
  author    User     @relation(fields: [authorId], references: [id])
  
  /// @@policy("read", rule: "published || isOwner")
  /// @@policy("write", rule: "isOwner")
  /// @@policy("delete", rule: "isOwner || isAdmin")
}
```

**Rule Expressions**:
- `isOwner` - User owns the record
- `isAdmin` - User has admin role
- `isPublic` - Record is public
- `authenticated` - Any logged-in user
- Boolean fields: `published`, `active`, etc.
- Combinations: `published && (isOwner || isAdmin)`

**Field-Level Policies**:
```prisma
/// @@policy("read", rule: "isAdmin", fields: ["email", "phone"])
```
Only admins can read `email` and `phone` fields.

**Generated**: RLS middleware, permission checks, field filtering

---

### 4. `@@realtime` - WebSocket Support

Enable real-time updates for models via WebSocket.

**Syntax**:
```prisma
@@realtime(subscribe: ["list", "item"], broadcast: ["created", "updated", "deleted"])
```

**Example**:
```prisma
model Message {
  id        String   @id @default(uuid())
  text      String
  roomId    String
  senderId  String
  createdAt DateTime @default(now())
  
  /// @@realtime(
  ///   subscribe: ["list", "item"],
  ///   broadcast: ["created", "updated", "deleted"],
  ///   permissions: { list: "authenticated", item: "isParticipant" }
  /// )
}
```

**Subscribe Options**:
- `list` - Subscribe to all records
- `item` - Subscribe to specific record by ID

**Broadcast Options**:
- `created` - Broadcast when record created
- `updated` - Broadcast when record updated
- `deleted` - Broadcast when record deleted

**Permissions**:
- `list` - Who can subscribe to list updates
- `item` - Who can subscribe to item updates

**Generated**: WebSocket channels, pub/sub logic, real-time client

---

### 5. `@@search` - Full-Text Search

Configure full-text search for models.

**Syntax**:
```prisma
@@search(fields: ["field1", "field2"], weights: [2, 1], engine: "native")
```

**Example**:
```prisma
model Article {
  id      String   @id @default(uuid())
  title   String
  content String
  tags    String[]
  
  /// @@search(
  ///   fields: ["title", "content", "tags"],
  ///   weights: [3, 2, 1],
  ///   engine: "native"
  /// )
}
```

**Fields**: Which fields to search (array)  
**Weights**: Relevance weights (higher = more important)  
**Engine**: `native` (PostgreSQL), `elasticsearch`, `typesense`

**Generated**: Search endpoints, indexing logic, relevance scoring

---

## Complete Example

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  avatarUrl     String?
  role          String    @default("user")
  posts         Post[]
  messages      Message[]
  
  /// @@auth("JWT", expiry: "7d", refresh: true)
  /// @@policy("read", rule: "isOwner || isAdmin", fields: ["email"])
  /// @@search(fields: ["name", "email"], weights: [2, 1])
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  authorId  String
  published Boolean  @default(false)
  images    Image[]
  
  author    User     @relation(fields: [authorId], references: [id])
  
  /// @@policy("read", rule: "published || isOwner")
  /// @@policy("write", rule: "isOwner")
  /// @@policy("delete", rule: "isOwner")
  /// @@search(fields: ["title", "content"], weights: [3, 1])
}

model Image {
  id        String   @id @default(uuid())
  filename  String
  url       String
  postId    String
  
  post      Post     @relation(fields: [postId], references: [id])
  
  /// @@service("Cloudinary", folder: "posts", quality: "auto")
}

model Message {
  id        String   @id @default(uuid())
  text      String
  senderId  String
  roomId    String
  createdAt DateTime @default(now())
  
  sender    User     @relation(fields: [senderId], references: [id])
  
  /// @@realtime(
  ///   subscribe: ["list", "item"],
  ///   broadcast: ["created", "updated", "deleted"]
  /// )
  /// @@policy("read", rule: "isRoomMember")
  /// @@policy("write", rule: "isOwner")
}
```

---

## Validation Rules

### @@service
- ✅ Provider name required
- ⚠️ Unknown providers warn but proceed
- ✅ Config values type-checked

### @@auth
- ✅ Strategy name required
- ⚠️ Unknown strategies warn but proceed
- ✅ Options validated per strategy

### @@policy
- ✅ Operation must be: `read`, `write`, `delete`, `*`
- ✅ Rule expression required
- ✅ Fields must exist in model
- ⚠️ Invalid expressions warn at generation time

### @@realtime
- ✅ At least `subscribe` or `broadcast` required
- ✅ Subscribe must be: `["list"]` or `["item"]` or both
- ✅ Broadcast must be: `["created"]`, `["updated"]`, `["deleted"]` or any combination
- ✅ Permissions validated

### @@search
- ✅ Fields array required
- ✅ Fields must exist in model
- ✅ Weights array length must match fields length
- ✅ Engine must be: `native`, `elasticsearch`, `typesense`

---

## Error Messages

**Invalid Annotation**:
```
[Post] @@policy missing rule
[Image] @@service missing provider
[Article] @@search references unknown field: description
```

**Fix**: Ensure all required parameters present and field names correct.

---

## Advanced: Custom Annotations

To add your own annotations:

1. Define type in `packages/gen/src/dmmf-parser/annotations/types.ts`
2. Add parser in `packages/gen/src/dmmf-parser/annotations/parser.ts`
3. Add validator in `packages/gen/src/dmmf-parser/annotations/validator.ts`
4. Create generator/plugin to handle it

---

## Migration Guide

### From Hardcoded to Annotations

**Before** (config):
```typescript
// ssot.config.ts
export default {
  websockets: {
    models: {
      'Message': { subscribe: ['list'], broadcast: ['created'] }
    }
  }
}
```

**After** (schema):
```prisma
model Message {
  id String @id
  text String
  
  /// @@realtime(subscribe: ["list"], broadcast: ["created"])
}
```

**Benefits**:
- Single source of truth (schema)
- Version controlled with schema
- Type-safe and validated
- Auto-detected by generator

---

## Troubleshooting

**Annotation not recognized?**
- Ensure it's in model documentation (`///` not `//`)
- Check syntax: `@@annotation(args)`
- Validate parentheses and quotes

**Validation errors?**
- Check field names exist
- Verify provider/strategy names
- Review parameter types

**Not generating code?**
- Run `pnpm ssot generate` after schema changes
- Check console for warnings
- Verify plugin is enabled

---

**Status**: ✅ Implemented  
**Next**: Integrate with generators and plugins  

