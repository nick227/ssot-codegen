# 🎯 V3 ULTRA-SIMPLIFIED PLAN (MVP-First)

## Executive Summary

**Your feedback is brilliant.** We've been over-engineering. This document presents a **radically simplified MVP** that can be delivered in **1-2 weeks** instead of 10 weeks.

**Philosophy**: Ship fast, iterate based on real usage, add complexity only when needed.

---

## 🔴 What We're Cutting (For v1)

### **From 7 JSON Files → 2 JSON Files**

| File | Status | Reason |
|------|--------|--------|
| models.json | ✅ **Keep** | Auto-generated from Prisma |
| app.json | ✅ **Keep** | EVERYTHING else goes here |
| ~~template.json~~ | ❌ **Fold into app.json** | Unnecessary separation |
| ~~data-contract.json~~ | ❌ **Drop** | Prisma is the contract |
| ~~capabilities.json~~ | ❌ **Fold into app.json** | Just flags |
| ~~mappings.json~~ | ❌ **Drop** | Infer from models |
| ~~theme.json~~ | ❌ **Drop** | Use Tailwind |
| ~~i18n.json~~ | ❌ **Drop** | Defer to M2 |

**Result**: 7 → 2 files (70% reduction!)

---

### **From Universal Endpoint → 2 Endpoints**

| Endpoint | Purpose | Shape |
|----------|---------|-------|
| `/api/data` | CRUD operations | `{ action: "Track.findMany", params: {...} }` |
| `/api/action` | Custom actions + webhooks | `{ action: "sendEmail", params: {...} }` |

**Why**: Clearer separation, simpler payload shapes

---

### **From Adapter Matrix → Opinionated Defaults**

| Choice | V1 Default | Defer To |
|--------|-----------|----------|
| Database | ✅ Prisma (PostgreSQL) | Never (core) |
| Auth | ✅ NextAuth (Email link only) | M1 (add providers) |
| Files | ✅ Local filesystem | M2 (add S3) |
| Routing | ✅ Next.js App Router | Never (core) |
| Format | ✅ Built-in JS | M2 (add Intl) |

**No choices = faster scaffolding!**

---

### **From 60+ Expression Operations → 3 Primitives**

| Primitive | Purpose | Example |
|-----------|---------|---------|
| `computed(op, args)` | Calculate values | `computed("multiply", [field("price"), value(1.1)])` |
| `when(cond, then, else)` | Conditional logic | `when(eq(field("role"), "admin"), true, false)` |
| `perm(check)` | Permissions | `perm("owner")` or `perm("admin")` |

**Operations** (10 total):
- Math: `add`, `subtract`, `multiply`, `divide`
- Logic: `eq`, `gt`, `lt`, `and`, `or`
- Special: `field`, `value`

**Defer to M1/M2**: String ops, date ops, array ops, advanced logic

---

### **From Plugin Picker → Presets**

| V3 Original | V3 Simplified |
|-------------|---------------|
| ❌ Checkbox matrix: Auth (5 providers), Files (S3/Local/Azure), Payments (Stripe/PayPal), Email (5 services), SMS, etc. | ✅ 3 presets only |

**Presets**:

1. **`--preset media`**
   - Models: User, Track, Playlist
   - Example: SoundCloud clone
   - Features: File uploads (local), basic auth

2. **`--preset marketplace`**
   - Models: User, Product, Order
   - Example: E-commerce
   - Features: Stripe payments, inventory

3. **`--preset saas`**
   - Models: Org, User, Subscription
   - Example: SaaS app
   - Features: Stripe subscriptions, multi-tenant

**Custom**: Just paste your schema (no preset)

---

## ✅ What We're Keeping (Simplified)

### **The Core MVP**

```
Prisma Schema (with annotations)
        ↓
    npm run generate
        ↓
┌──────────────┬────────────────┐
↓              ↓                ↓
Prisma Client  models.json    app.json
↓              ↓                ↓
Database     Metadata      UI Config
```

**Scaffolding Result** (~10 files total):
```
my-app/
├── prisma/
│   └── schema.prisma          # WITH annotations
├── templates/
│   ├── models.json            # Auto-generated
│   └── app.json               # All config
├── app/
│   ├── layout.tsx
│   ├── [[...slug]]/page.tsx  # Dev + prod (no static routes in M0)
│   └── api/
│       ├── data/route.ts      # CRUD endpoint
│       └── action/route.ts    # Custom actions
├── lib/adapters/index.ts      # Hardcoded defaults
├── package.json
└── next.config.mjs
```

---

## 📋 Milestone Plan (MVP-First)

### **M0: Minimal Viable Platform** (1-2 weeks) 🎯 **START HERE**

**Goal**: One model, basic CRUD, email auth, local data

**What You Can Do**:
- ✅ Define Prisma schema (1 model: Track)
- ✅ Run `npx create-ssot-app`
- ✅ Get working app with list/detail/form pages
- ✅ Email-only authentication
- ✅ Local SQLite database
- ✅ No file uploads yet

**Scope**:
- ✅ 1-2 models maximum
- ✅ Basic CRUD (findMany, findOne, create, update, delete)
- ✅ Simple expressions: `field()`, `value()`, `eq()`
- ✅ Default permissions: owner-or-admin
- ✅ Convention-based routing: `/{model}`, `/{model}/{id}`

**Deliverables**:
1. CLI: `create-ssot-app` (simplified)
2. Runtime: List/Detail/Form renderers (basic)
3. API: `/api/data` endpoint
4. Auth: NextAuth (email link only)
5. Permissions: Built-in owner-or-admin
6. Docs: Quick start guide

**Files**:
- models.json (auto)
- app.json (minimal)

**Timeline**: 1-2 weeks

---

### **M1: Production-Ready** (2-3 weeks)

**Goal**: Multi-model, relations, pagination, better permissions

**Adds**:
- ✅ Multiple models with relations
- ✅ Pagination (cursor-based)
- ✅ Filtering & sorting
- ✅ Field-level permissions
- ✅ More expressions: `when()`, `computed()`
- ✅ Google/GitHub auth providers

**Timeline**: +2-3 weeks

---

### **M2: Feature-Complete** (2-3 weeks)

**Goal**: Stripe, file uploads, advanced features

**Adds**:
- ✅ Stripe integration (preset)
- ✅ File uploads (S3 preset)
- ✅ Advanced expressions (string, date, array ops)
- ✅ `/__ssot` live editor
- ✅ i18n support

**Timeline**: +2-3 weeks

---

## 🎯 M0 Implementation Details

### **1. Prisma Schema with Annotations**

```prisma
model Track {
  id          String   @id @default(cuid())
  
  /// @ui:text(label="Track Title", placeholder="Enter track name")
  title       String
  
  /// @ui:textarea(label="Description")
  description String?
  
  /// @ui:url(label="Audio URL")
  audioUrl    String
  
  /// @ui:number(label="Plays", readOnly=true)
  plays       Int      @default(0)
  
  uploadedBy  String
  uploader    User     @relation(fields: [uploadedBy], references: [id])
  
  createdAt   DateTime @default(now())
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      String   @default("user")  // "user", "admin"
  
  tracks    Track[]
  
  createdAt DateTime @default(now())
}
```

**Annotations Extract to**:
```json
// Auto-generates into app.json
{
  "fields": {
    "Track.title": {
      "type": "text",
      "label": "Track Title",
      "placeholder": "Enter track name"
    }
  }
}
```

---

### **2. app.json Structure (EVERYTHING)**

```json
{
  "app": {
    "name": "SoundCloud Clone",
    "version": "1.0.0"
  },
  
  "features": {
    "auth": true,
    "uploads": false,    // M0: Not yet
    "payments": false    // M0: Not yet
  },
  
  "auth": {
    "providers": ["email"],  // M0: Email only
    "signInPath": "/auth/signin"
  },
  
  "permissions": "owner-or-admin",  // M0: Built-in default
  
  "pages": {
    "Track": {
      "list": {
        "enabled": true,
        "path": "/tracks",
        "columns": ["title", "uploader.name", "plays", "createdAt"]
      },
      "detail": {
        "enabled": true,
        "path": "/tracks/{id}",
        "fields": ["title", "description", "uploader.name", "plays", "createdAt"]
      },
      "form": {
        "enabled": true,
        "createPath": "/tracks/new",
        "editPath": "/tracks/{id}/edit",
        "fields": ["title", "description", "audioUrl"]
      }
    }
  },
  
  "expressions": {
    "Track.canEdit": {
      "type": "perm",
      "check": "owner"
    }
  }
}
```

**That's it!** Everything in one file.

---

### **3. Convention-Based Routing (No mappings.json)**

**Conventions**:
```
/{model}              → List page
/{model}/new          → Create form
/{model}/{id}         → Detail page
/{model}/{id}/edit    → Edit form
```

**Auto-generated routes**:
- `/tracks` → Track list
- `/tracks/new` → Upload track form
- `/tracks/123` → Track detail
- `/tracks/123/edit` → Edit track form
- `/users` → User list
- `/users/456` → User profile

**No configuration needed!**

---

### **4. Built-In Permissions (No policies.json)**

**Convention**: "owner-or-admin"

```typescript
// lib/default-policy.ts (built-in)

export const defaultPolicy = {
  read: (model, context) => {
    // Public reads if model has "isPublic" field
    if (hasField(model, 'isPublic')) {
      return { isPublic: true }
    }
    // Otherwise, all authenticated users can read
    return {}
  },
  
  write: (model, context) => {
    // Admin can write anything
    if (context.user.roles.includes('admin')) {
      return {}
    }
    
    // Owner can write if model has "uploadedBy" or "userId" field
    if (hasField(model, 'uploadedBy')) {
      return { uploadedBy: context.user.id }
    }
    if (hasField(model, 'userId')) {
      return { userId: context.user.id }
    }
    
    // Otherwise deny
    throw new Error('Permission denied')
  }
}
```

**Override in app.json** (optional):
```json
{
  "permissions": {
    "Track": {
      "read": "public-or-owner",
      "write": "owner-only"
    }
  }
}
```

---

### **5. Simple Expressions (3 Primitives Only)**

**M0 Expression API**:

```typescript
// Computed field
{
  "computed": {
    "op": "multiply",
    "args": [
      { "field": "price" },
      { "value": 1.1 }
    ]
  }
}

// Conditional
{
  "when": {
    "condition": { "op": "eq", "left": { "field": "role" }, "right": { "value": "admin" } },
    "then": { "value": true },
    "else": { "value": false }
  }
}

// Permission
{
  "perm": "owner"  // or "admin"
}
```

**Supported Operations** (10 only):
- `add`, `subtract`, `multiply`, `divide`
- `eq`, `gt`, `lt`
- `and`, `or`
- `field`, `value`

**That's it!** Defer advanced ops to M1/M2.

---

## 📊 Comparison: V3 Original vs Ultra-Simplified

| Aspect | V3 Original | V3 Ultra-Simplified | Reduction |
|--------|-------------|---------------------|-----------|
| **JSON Files** | 7 files | 2 files | **70% fewer** |
| **Adapters** | 6+ adapters to choose | 3 hardcoded defaults | **No choices** |
| **Plugins** | 10+ plugins to configure | 0 in M0, 1 in M1 (Stripe) | **Zero complexity** |
| **Expressions** | 60+ operations | 10 operations | **83% simpler** |
| **Auth Providers** | 5+ providers | Email only (M0) | **No setup** |
| **Routing** | mappings.json | Convention-based | **Auto-inferred** |
| **Permissions** | policies.json | Built-in owner-or-admin | **Zero config** |
| **CLI Prompts** | 10+ questions | 2 questions | **80% fewer** |
| **Timeline** | 10 weeks | 1-2 weeks (M0) | **5-10x faster** |

---

## 🚀 M0 Detailed Scope (1-2 Weeks)

### **Week 1**:

**Days 1-2: CLI Scaffolding**
- ✅ `create-ssot-app` command
- ✅ Two prompts only:
  1. "Paste Prisma schema or file path"
  2. "Scaffold example models? (Y/n)" (uses --preset media)
- ✅ Generate project structure
- ✅ Generate models.json from Prisma
- ✅ Generate minimal app.json

**Days 3-4: Runtime Core**
- ✅ List page renderer (simple table)
- ✅ Detail page renderer (field display)
- ✅ Form renderer (create/edit)
- ✅ Simple expressions (field, value, eq only)

**Days 5: API + Auth**
- ✅ `/api/data` endpoint with hardcoded defaults
- ✅ NextAuth (email link only)
- ✅ Built-in owner-or-admin policy

---

### **Week 2**:

**Days 6-7: Polish**
- ✅ Fix bugs from week 1
- ✅ Basic styling (Tailwind)
- ✅ Error handling

**Days 8-9: Testing**
- ✅ E2E test (create app, run dev server)
- ✅ Manual testing
- ✅ Documentation

**Day 10: Release**
- ✅ Publish to npm
- ✅ Write blog post
- ✅ Share on X/Reddit

---

## 📁 M0 File Structure (MINIMAL)

```
my-app/
├── prisma/
│   └── schema.prisma          # Developer writes this
├── templates/
│   ├── models.json            # Auto-generated
│   └── app.json               # Auto-generated (overridable)
├── app/
│   ├── layout.tsx             # Minimal
│   ├── [[...slug]]/page.tsx  # Catch-all (dev + prod)
│   └── api/
│       ├── data/route.ts      # CRUD endpoint
│       └── auth/[...nextauth]/route.ts
├── lib/
│   └── adapters.ts            # Hardcoded defaults
├── tailwind.config.ts         # Standard Tailwind
├── package.json
└── tsconfig.json
```

**Total**: ~10 files  
**Manual**: 1 file (schema.prisma)  
**Auto**: 9 files

---

## 🎯 CLI Experience (SIMPLIFIED)

### **The Full Flow**:

```bash
$ npx create-ssot-app my-app

Welcome to SSOT App Generator!

? Paste your Prisma schema (or file path):
  [User pastes schema or presses Enter for example]

? Scaffold example models? (Y/n): Y

? Use preset: (Use arrow keys)
❯ media (Track, Playlist, User)
  marketplace (Product, Order, User)  
  saas (Org, User, Subscription)
  custom (use my schema)

? Add Stripe now? (y/N): N

✅ Creating project...
✅ Installing dependencies...
✅ Generating models.json...
✅ Generating app.json...
✅ Setting up NextAuth (email)...

🎉 Done!

  cd my-app
  npm run dev

Open http://localhost:3000
```

**That's it!** 4 prompts (was 10+), 30 seconds total.

---

## 🎯 app.json Structure (COMPLETE)

```json
{
  "name": "My App",
  "version": "1.0.0",
  
  "features": {
    "auth": true,
    "uploads": false,
    "payments": false
  },
  
  "auth": {
    "providers": ["email"],
    "adminEmail": "admin@example.com"
  },
  
  "permissions": "owner-or-admin",
  
  "pages": {
    "Track": {
      "list": true,
      "detail": true,
      "form": true
    }
  },
  
  "routing": "convention",
  
  "ui": {
    "theme": "default",
    "layout": "sidebar"
  }
}
```

**Most fields optional** (sane defaults). Can be even simpler:

```json
{
  "name": "My App",
  "permissions": "owner-or-admin"
}
```

Everything else inferred!

---

## 🎯 What Gets Inferred (ZERO CONFIG)

### **From Prisma Schema**:

1. **Models** → Pages automatically created
2. **Fields** → Form fields, table columns
3. **Relations** → Auto-included, clickable links
4. **`isPublic` field** → Auto-filter for public reads
5. **`uploadedBy` field** → Auto-filter for owner writes
6. **`userId` field** → Auto-filter for user data
7. **`role` field** → Auto-permission system
8. **`@unique`** → Form validation
9. **`@default`** → Form defaults
10. **`DateTime`** → Date formatting

### **From Conventions**:

1. **Routes**: `/{model}`, `/{model}/{id}`, `/{model}/new`, `/{model}/{id}/edit`
2. **Permissions**: owner-or-admin (if `uploadedBy` exists)
3. **Public filter**: `isPublic = true` (if field exists)
4. **Field types**: Prisma type → UI component
   - `String` → Text input
   - `Int` → Number input
   - `Boolean` → Checkbox
   - `DateTime` → Date picker
   - Relation → Select/autocomplete

**Result**: 90% of apps need ZERO configuration!

---

## 🔒 Security (SIMPLIFIED BUT SAFE)

### **Built-In Defaults**:

```typescript
// Baked into the runtime (not configurable in M0)

const SECURITY_DEFAULTS = {
  // Authentication
  requireAuth: true,  // All pages require login
  
  // Row-level security
  readFilter: (model, user) => {
    if (user.role === 'admin') return {}  // Admins see all
    if (hasField(model, 'isPublic')) return { isPublic: true }  // Public filter
    if (hasField(model, 'uploadedBy')) return { uploadedBy: user.id }  // Owner filter
    return {}
  },
  
  writeFilter: (model, user) => {
    if (user.role === 'admin') return {}  // Admins write all
    if (hasField(model, 'uploadedBy')) return { uploadedBy: user.id }  // Owner writes own
    throw new Error('Permission denied')  // Deny by default
  },
  
  // Field-level security
  denyFields: ['role', 'permissions', 'passwordHash'],  // Never writable
  
  // Query budget
  maxTake: 100,
  maxIncludeDepth: 2,
  
  // Rate limits
  global: { max: 1000, window: '1m' },
  write: { max: 100, window: '1m' }
}
```

**No configuration needed** - Safe by default!

---

## 📋 M0 Deliverables Checklist

### **Package: create-ssot-app** (2-3 days)
- [ ] Simplified CLI (2 prompts)
- [ ] Preset schemas (media, marketplace, saas)
- [ ] Project scaffolding
- [ ] Hardcoded adapters (Prisma + NextAuth + Local)

### **Package: @ssot-ui/runtime** (3-4 days)
- [ ] ListPageRenderer (basic table)
- [ ] DetailPageRenderer (field display)
- [ ] FormRenderer (create/edit forms)
- [ ] Simple expression evaluation (10 ops)

### **Package: @ssot-ui/generator** (2-3 days)
- [ ] Prisma → models.json
- [ ] Prisma annotations → app.json
- [ ] Convention-based route generation

### **Package: @ssot-ui/security** (2-3 days)
- [ ] Built-in owner-or-admin policy
- [ ] Row-level filters
- [ ] Field deny list
- [ ] Query budget (maxTake, maxDepth)

### **Integration** (2-3 days)
- [ ] `/api/data` endpoint with security
- [ ] NextAuth setup (email only)
- [ ] E2E test
- [ ] Documentation

**Total**: ~10-12 days = **2 weeks**

---

## 🎯 Success Criteria (M0)

### **Developer Can**:
1. ✅ Run `npx create-ssot-app` (30 seconds)
2. ✅ Paste Prisma schema (or use preset)
3. ✅ Run `npm run dev` (1 minute)
4. ✅ See working list/detail/form pages (instant)
5. ✅ Sign in with email link (working)
6. ✅ Create/edit/delete records (with owner checks)
7. ✅ Deploy to Vercel (2 minutes)

**Total**: ~5 minutes from idea to deployed app!

### **What Works**:
- ✅ Authentication (email link)
- ✅ List page (table with columns)
- ✅ Detail page (show all fields)
- ✅ Create form (all writable fields)
- ✅ Edit form (owner-or-admin only)
- ✅ Delete (owner-or-admin only)
- ✅ Relations (clickable links)

### **What Doesn't Work Yet (OK for M0)**:
- ❌ File uploads (defer to M2)
- ❌ Payments (defer to M2)
- ❌ Advanced expressions (defer to M1)
- ❌ i18n (defer to M2)
- ❌ Custom themes (defer to M2)
- ❌ Multiple auth providers (defer to M1)

---

## 💡 Why This Approach is Better

### **V3 Original Plan**:
```
10 weeks → Complete platform with everything
Risk: Over-engineered, never ships, loses momentum
```

### **V3 Ultra-Simplified (M0)**:
```
2 weeks → Minimal but WORKING platform
    ↓
Ship to users, get feedback
    ↓
M1 (2-3 weeks): Add based on feedback
    ↓
M2 (2-3 weeks): Polish + advanced features
    ↓
Total: 6-8 weeks, but SHIPPED after week 2!
```

**Benefits**:
- ✅ Real user feedback early
- ✅ Validate approach before investing months
- ✅ Can pivot based on usage
- ✅ Momentum from early win
- ✅ Simpler codebase (easier to maintain)

---

## 🚀 Immediate Next Steps

### **Option A: Pivot to M0** ✅ **RECOMMENDED**
- Pause Phase 1.5 (policy engine is good enough)
- Focus on M0 (2 weeks to shipped product)
- Iterate based on feedback

### **Option B: Continue Phase 1.5**
- Finish all security layers (3 more weeks)
- Then build M0
- Longer timeline, more polish upfront

### **Option C: Hybrid**
- Finish policy engine (already done!)
- Skip expression sandbox for M0 (use basic evaluator)
- Build M0 with current tools
- Add advanced security in M1

---

## 🎯 My Recommendation

**Go with Option A: Pivot to Ultra-Simplified M0**

**Why**:
1. **Ship in 2 weeks** vs 10 weeks
2. **Real user feedback** > Perfect architecture
3. **Validate approach** before months of work
4. **Policy engine is already built** (good enough for M0)
5. **Simpler is better** (2 files vs 7 files)

**What We Keep** from Phase 1.5:
- ✅ Policy Engine (already built)
- ✅ Basic expressions (already built)
- ✅ Adapters (already built)

**What We Defer**:
- ⏸️ Expression sandbox (M1)
- ⏸️ Validation layer (M1)
- ⏸️ Schema drift protection (M1)
- ⏸️ Advanced security (M1)

**Timeline**:
```
Week 1-2: M0 (minimal platform)
Week 3-5: M1 (production-ready)
Week 6-8: M2 (feature-complete)
────────────────────────────────
Total: 6-8 weeks, but SHIPPED after week 2!
```

---

## 💬 Decision Required

**Should we pivot to the ultra-simplified M0 approach?**

**A.** ✅ YES - Pivot to M0 (ship in 2 weeks)  
**B.** ❌ NO - Continue Phase 1.5 (10-week timeline)  
**C.** 💭 HYBRID - Use what's built, simplify the rest  

**Your call?**
