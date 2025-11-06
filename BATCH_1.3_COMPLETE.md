# ✅ BATCH 1.3 COMPLETE - API Key Manager Plugin

**Date:** November 6, 2025  
**Duration:** ~1 hour  
**Status:** ✅ COMPLETE  
**Tests:** 426/426 PASSING ✅  
**Build:** ✅ SUCCESS

---

## 🎯 Mission: Server-to-Server Authentication via API Keys

Create a comprehensive API key management system for server-to-server authentication, third-party API access, and service accounts.

---

## ✅ What Was Delivered

### **API Key Manager Plugin** ⭐
**File:** `packages/gen/src/plugins/auth/api-key-manager.plugin.ts`  
**Lines:** 738 lines  
**Features:**
- ✅ Secure API key generation (cryptographically random)
- ✅ Key hashing and verification
- ✅ Scope-based permissions
- ✅ Key expiry and rotation
- ✅ Usage tracking
- ✅ Express middleware
- ✅ Admin routes for key management
- ✅ Health check integration

---

## 📦 Generated Code Structure

When enabled, the API Key Manager Plugin generates:

```
auth/
├── utils/
│   └── api-key.util.ts         # Core API key functions
├── services/
│   └── api-key.service.ts      # Key management service
├── middleware/
│   └── api-key.middleware.ts   # Express middleware
├── routes/
│   └── api-key.routes.ts       # Admin routes
├── types/
│   └── api-key.types.ts        # TypeScript types
└── api-keys.ts                 # Barrel export
```

---

## 🔧 Features

### Core Utilities (`auth/utils/api-key.util.ts`)

```typescript
// Generate & verify
generateApiKey()                    // sk_[random_base64]
hashApiKey(key)                     // SHA-256 hash for storage
verifyApiKey(key, hash)             // Timing-safe comparison
isValidApiKeyFormat(key)            // Format validation

// Display & extract
maskApiKey(key)                     // sk_abc...xyz
extractApiKey(headers, query)       // From request
```

**Key Format:** `sk_[43-char-base64url]`  
**Security:** Keys are hashed with SHA-256 (never stored in plain text)

### API Key Service (`auth/services/api-key.service.ts`)

```typescript
// Key management
await apiKeyService.create({
  name: 'Production API',
  scopes: ['read:posts', 'write:posts'],
  userId: 123,
  rateLimit: 60,  // 60 req/min
  expiresIn: '1y'
})

await apiKeyService.validate(key)   // Check validity
await apiKeyService.list(userId)     // List user's keys
await apiKeyService.revoke(keyId)    // Deactivate key
await apiKeyService.rotate(keyId)    // Generate new, revoke old
await apiKeyService.delete(keyId)    // Permanent deletion

// Scope checking
apiKeyService.hasScope(apiKey, 'write:posts')  // Check permission
```

### Middleware (`auth/middleware/api-key.middleware.ts`)

```typescript
// Authentication
requireApiKey                        // Block if no valid API key
optionalApiKey                       // Attach key if valid

// Authorization
requireApiKeyWithScope('write:posts')  // Require specific scope
requireApiKeyWithScope('admin:*')      // Wildcard scopes
```

**API Key Extraction** supports:
- `Authorization: Bearer <key>`
- `Authorization: ApiKey <key>`
- `x-api-key: <key>` header
- `?api_key=<key>` query parameter

### Admin Routes (`auth/routes/api-key.routes.ts`)

```typescript
GET    /api-keys           // List keys
POST   /api-keys           // Create new key
DELETE /api-keys/:id       // Revoke key
POST   /api-keys/:id/rotate // Rotate key
```

---

## 🔒 Security Features

### 1. **Cryptographically Secure Generation**
- Uses `crypto.randomBytes()` (Node.js built-in)
- 32 bytes of entropy (256 bits)
- Base64url encoding (URL-safe)

### 2. **Secure Storage**
- Keys are hashed with SHA-256
- Optional salt for additional security
- Timing-safe comparison
- Never retrieve plain key after creation

### 3. **Scope-Based Permissions**
```typescript
// Exact scope
scopes: ['read:posts', 'write:comments']

// Wildcard scopes
scopes: ['read:*']          // All read operations
scopes: ['*']               // Full access (admin)
```

**Pattern matching:**
- `'read:*'` matches `'read:posts'`, `'read:comments'`, etc.
- `'*'` matches everything

### 4. **Automatic Expiry**
```typescript
expiresIn: '1y'   // 1 year
expiresIn: '90d'  // 90 days
expiresIn: '6h'   // 6 hours
```

### 5. **Rate Limiting Per Key**
```typescript
rateLimit: 60  // 60 requests per minute
rateLimit: 1000  // 1000 requests per minute (high-volume)
```

### 6. **Usage Tracking**
- `lastUsedAt` timestamp updated on each use
- Helps identify unused/stale keys
- Audit trail

---

## ⚙️ Configuration

### Plugin Options

```typescript
const apiKeyPlugin = new ApiKeyManagerPlugin({
  modelName: 'ApiKey',              // Model name
  userModel: 'User',                // User model for ownership
  enableUsageTracking: true,        // Track lastUsedAt
  enableRateLimiting: true,         // Per-key rate limits
  enableKeyRotation: true,          // Allow key rotation
  defaultExpiry: '1y',              // Default expiry
  keyPrefix: 'sk_',                 // Key prefix
  keyLength: 32                     // Bytes of entropy
})
```

### Database Model Required

```prisma
model ApiKey {
  id          Int       @id @default(autoincrement())
  key         String    @unique              // Hashed key
  name        String                         // Human-readable name
  description String?                        // Optional description
  scopes      String[]  @default([])         // Permissions
  userId      Int?                           // Optional: owner
  user        User?     @relation(fields: [userId], references: [id])
  rateLimit   Int?      @default(60)         // Requests per minute
  expiresAt   DateTime?                      // Optional expiry
  lastUsedAt  DateTime?                      // Usage tracking
  isActive    Boolean   @default(true)       // Active/revoked
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([key])
  @@index([userId])
}
```

### Environment Variables

```env
API_KEY_SALT=optional-salt-for-additional-security
```

---

## 🎯 Use Cases

### 1. **Third-Party API Access**
```typescript
// Create API key for partner
const { key } = await apiKeyService.create({
  name: 'Partner XYZ API',
  scopes: ['read:public', 'read:posts'],
  rateLimit: 100,
  expiresIn: '1y'
})

// Give key to partner (they add to their requests)
```

### 2. **Mobile/Desktop App Auth**
```typescript
// Each app installation gets a key
const { key } = await apiKeyService.create({
  name: 'iOS App - User 123',
  userId: 123,
  scopes: ['read:*', 'write:own'],
  expiresIn: '90d'
})
```

### 3. **Service Accounts**
```typescript
// Background jobs, cron tasks
const { key } = await apiKeyService.create({
  name: 'Email Service',
  scopes: ['send:email'],
  rateLimit: 1000,  // High volume
  expiresIn: null   // Never expires
})
```

### 4. **Webhook Authentication**
```typescript
// Protect webhook endpoints
router.post('/webhooks/stripe',
  requireApiKey,
  requireApiKeyWithScope('webhooks:stripe'),
  handleStripeWebhook
)
```

---

## 🛡️ Middleware Usage

### Basic API Key Protection

```typescript
import { requireApiKey } from '@/auth/api-keys'

// Protect entire API
router.use('/api', requireApiKey)

// Or specific routes
router.post('/api/data', requireApiKey, handleData)
```

### Scope-Based Protection

```typescript
import { requireApiKey, requireApiKeyWithScope } from '@/auth/api-keys'

// Read-only access
router.get('/api/posts',
  requireApiKey,
  requireApiKeyWithScope('read:posts'),
  getPosts
)

// Write access
router.post('/api/posts',
  requireApiKey,
  requireApiKeyWithScope('write:posts'),
  createPost
)

// Admin access
router.delete('/api/users/:id',
  requireApiKey,
  requireApiKeyWithScope('admin:*'),
  deleteUser
)
```

### Optional API Key

```typescript
// Public endpoint with optional auth
router.get('/api/posts',
  optionalApiKey,  // Attach key info if present
  (req, res) => {
    const hasWriteAccess = req.apiKey?.scopes.includes('write:posts')
    // ...
  }
)
```

---

## 🔄 Key Rotation

**Why rotate keys?**
- Security best practice (regular rotation)
- Compromise mitigation
- Replace leaked keys

**How it works:**
```typescript
// Rotate key (generates new, revokes old)
const { key: newKey } = await apiKeyService.rotate(oldKeyId)

// Old key stops working immediately
// New key has same name, scopes, permissions
```

**Best practices:**
- Rotate keys every 90 days
- Rotate immediately if compromised
- Notify key owner when rotated

---

## 📊 API Key Management Routes

### Admin Interface

```typescript
// List all API keys for current user
GET /api-keys
Authorization: Bearer <jwt_token>

Response: {
  data: [{
    id: 1,
    name: "Production API",
    scopes: ["read:*", "write:posts"],
    rateLimit: 60,
    expiresAt: "2026-01-01T00:00:00Z",
    lastUsedAt: "2025-11-06T12:34:56Z",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z"
  }]
}
```

```typescript
// Create new API key
POST /api-keys
Authorization: Bearer <jwt_token>
Body: {
  name: "New API Key",
  description: "For mobile app",
  scopes: ["read:posts"],
  rateLimit: 60,
  expiresIn: "90d"
}

Response: {
  id: 2,
  key: "sk_abc123...",  // ⚠️ Only shown once!
  name: "New API Key",
  scopes: ["read:posts"],
  rateLimit: 60,
  expiresAt: "2026-02-04T...",
  warning: "⚠️ Save this key securely! It will not be shown again."
}
```

```typescript
// Revoke API key
DELETE /api-keys/2
Authorization: Bearer <jwt_token>

Response: {
  message: "API key revoked successfully"
}
```

```typescript
// Rotate API key
POST /api-keys/1/rotate
Authorization: Bearer <jwt_token>

Response: {
  id: 3,
  key: "sk_xyz789...",  // ⚠️ New key
  name: "Production API (rotated)",
  warning: "⚠️ Save this new key! The old key has been revoked."
}
```

---

## 🆚 JWT vs API Keys

| Feature | JWT | API Keys |
|---------|-----|----------|
| **Use Case** | User sessions | Server-to-server |
| **Lifespan** | Short (15min-1d) | Long (months-years) |
| **Storage** | Client-side | Server-side |
| **Revocation** | Hard (requires blacklist) | Easy (database flag) |
| **Scopes** | Via role | Native support |
| **Rotation** | Not needed | Recommended |
| **Rate Limiting** | Global | Per-key |
| **Best For** | Humans | Machines |

**When to use API keys:**
- ✅ Third-party integrations
- ✅ Mobile/desktop apps
- ✅ Background services
- ✅ Webhooks
- ✅ Long-lived access

**When to use JWT:**
- ✅ User authentication
- ✅ Session management
- ✅ OAuth flows
- ✅ Short-lived access

---

## 📊 Code Metrics

| Metric | Value |
|--------|-------|
| **Plugin File** | 738 lines |
| **Generated Files** | 6 files |
| **Functions Generated** | 15+ functions |
| **Middleware Generated** | 3 middleware |
| **Routes Generated** | 4 routes |
| **Health Checks** | 4 checks |
| **Dependencies** | 0 (uses Node.js built-ins) |
| **Env Vars** | 1 optional (salt) |

---

## ✅ Validation

### Build Status
```
✓ TypeScript compilation successful
✓ All imports resolved
✓ No type errors
```

### Test Status
```
✓ 426 tests passing (426)
✓ 9 test files
✓ Duration: 3.31s
✓ No regressions
```

### Code Quality
- ✅ No `:any` types
- ✅ Comprehensive JSDoc
- ✅ Type-safe interfaces
- ✅ Security best practices
- ✅ Timing-safe comparison

---

## 🏥 Health Checks

**Integration:** 4 health checks included

1. **ApiKey Model** - Validates model exists in database
2. **Key Generation** - Tests generation and validation
3. **API Key Middleware** - Validates middleware available
4. **API Key Service** - Validates service functions

---

## 🎁 Bonus Features

### Wildcard Scopes

```typescript
// Grant all read access
scopes: ['read:*']

// Grant full admin access
scopes: ['admin:*', 'write:*', 'read:*']

// Grant everything
scopes: ['*']
```

### Key Masking for Logs

```typescript
import { maskApiKey } from '@/auth/api-keys'

logger.info({ key: maskApiKey(apiKey) }, 'API request received')
// Logs: { key: "sk_abc...xyz" }
```

### Flexible Extraction

```typescript
// Works with all common patterns
Authorization: Bearer sk_...
Authorization: ApiKey sk_...
x-api-key: sk_...
GET /api/data?api_key=sk_...
```

### Usage Tracking

```typescript
// Check when key was last used
const keys = await apiKeyService.list(userId)
keys.forEach(key => {
  if (key.lastUsedAt < thirtyDaysAgo) {
    console.log(`Stale key: ${key.name}`)
  }
})
```

---

## 🔗 Integration Examples

### With JWT Authentication

```typescript
// Users authenticate with JWT
router.get('/profile', requireAuth, getProfile)

// API clients use API keys
router.get('/api/profile', requireApiKey, getProfile)

// Support both
router.get('/profile', 
  async (req, res, next) => {
    // Try JWT first
    await optionalAuth(req, res, () => {})
    
    // Try API key if no JWT
    if (!req.user) {
      await optionalApiKey(req, res, next)
    } else {
      next()
    }
  },
  getProfile
)
```

### With Rate Limiting

```typescript
import { rateLimit } from 'express-rate-limit'

// Global rate limit
const globalLimiter = rateLimit({ windowMs: 60000, max: 100 })

// Apply to API routes
router.use('/api', globalLimiter, requireApiKey)

// Per-key rate limiting (from ApiKey.rateLimit field)
// Implemented in middleware automatically
```

### With Scopes

```typescript
// Define scope hierarchy
const scopes = {
  'read:posts': 'Read blog posts',
  'write:posts': 'Create/edit blog posts',
  'delete:posts': 'Delete blog posts',
  'admin:*': 'Full admin access'
}

// Create key with specific scopes
const { key } = await apiKeyService.create({
  name: 'Blog API',
  scopes: ['read:posts', 'write:posts']
})

// Protect routes
router.post('/posts',
  requireApiKey,
  requireApiKeyWithScope('write:posts'),
  createPost
)
```

---

## 🎯 Common Patterns

### Pattern 1: Service Account

```typescript
// Create service account API key
const serviceKey = await apiKeyService.create({
  name: 'Email Service Account',
  scopes: ['send:email', 'read:templates'],
  rateLimit: 1000,  // High volume
  expiresIn: null   // Never expires
})

// Use in cron job
const response = await fetch('https://api.example.com/send', {
  headers: {
    'X-API-Key': serviceKey.key
  }
})
```

### Pattern 2: Partner API Access

```typescript
// Create partner API key
const partnerKey = await apiKeyService.create({
  name: 'Partner ABC Corp',
  description: 'Read-only access to public data',
  scopes: ['read:public', 'read:posts'],
  rateLimit: 60,  // Standard rate limit
  expiresIn: '1y'
})

// Give to partner
console.log(`Your API key: ${partnerKey.key}`)
console.log('⚠️ Save this key securely!')
```

### Pattern 3: Key Rotation Schedule

```typescript
// Rotate keys every 90 days
async function rotateExpiredKeys() {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  
  const oldKeys = await prisma.apiKey.findMany({
    where: {
      createdAt: { lt: ninetyDaysAgo },
      isActive: true
    }
  })
  
  for (const oldKey of oldKeys) {
    const newKey = await apiKeyService.rotate(oldKey.id)
    // Email user with new key
    await sendEmail(oldKey.userId, `Your API key has been rotated: ${newKey.key}`)
  }
}

// Run daily
setInterval(rotateExpiredKeys, 24 * 60 * 60 * 1000)
```

---

## 📈 BATCH 1 Progress

| Plugin | Status | Time | LOC |
|--------|--------|------|-----|
| 1.1: Google Auth | ✅ Done | 2h | ~900 |
| 1.2: JWT Service | ✅ Done | 1h | 894 |
| 1.3: API Key Manager | ✅ Done | 1h | 738 |
| 1.4: Usage Tracker | ⏳ Next | ~1h | ~400 est |

**Foundation Progress:** ✅ **75% Complete** (3/4 plugins)

---

## 🎯 Comparison: API Key Manager Features

| Feature | Included |
|---------|----------|
| Secure key generation | ✅ crypto.randomBytes |
| Key hashing | ✅ SHA-256 |
| Key validation | ✅ Timing-safe |
| Scope permissions | ✅ With wildcards |
| Key expiry | ✅ Configurable |
| Key rotation | ✅ One-click |
| Usage tracking | ✅ lastUsedAt |
| Rate limiting | ✅ Per-key |
| Admin routes | ✅ CRUD + rotate |
| Health checks | ✅ 4 checks |
| Multiple extraction | ✅ Header/query |
| Key masking | ✅ For logs |

---

## 🚀 What's Next

### One More Plugin!

**BATCH 1.4: Usage Tracker Plugin** (~1 hour)

Then we'll have:
- ✅ Google Auth (OAuth)
- ✅ JWT Service (token management)
- ✅ API Key Manager (server auth)
- ⏳ Usage Tracker (analytics)

**After BATCH 1.4:** Ready for AI providers (BATCH 2)!

---

## ✅ Summary

**BATCH 1.3 is COMPLETE!** 🎉

✅ **Comprehensive API key management**  
✅ **738 lines of production-ready code**  
✅ **15+ utility functions**  
✅ **3 middleware functions**  
✅ **4 admin routes**  
✅ **Scope-based permissions**  
✅ **Key rotation support**  
✅ **Health checks integrated**  
✅ **All tests passing**  
✅ **Build successful**  
✅ **Ready for production**

**Foundation is 75% complete! One more to go! 🚀**

