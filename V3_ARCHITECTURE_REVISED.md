# 🎯 V3 Architecture - REVISED (Optimized & Simplified)

## Executive Summary

**Your analysis is spot-on.** The current architecture has redundancy and drift issues. This document presents a **radically simplified** V3 that eliminates duplication and makes the system more maintainable.

---

## 🔴 Current Problems (You Identified)

### **Redundancy Hot Spots**:

| Issue | Current | Problem |
|-------|---------|---------|
| **Schema Drift** | Prisma + models.json | Maintaining two sources of truth |
| **Type Duplication** | Prisma → data-contract.json → client types | Three representations of same data |
| **Routing Redundancy** | mappings.json + catch-all | Two routing systems |
| **Auth Duplication** | UI `visibleWhen` + server policies | Logic repeated client/server |
| **Config Sprawl** | 7 JSON files in templates/ | Too many files to maintain |

### **Current templates/ Structure** (TOO COMPLEX):
```
templates/
├── models.json              ❌ Redundant (derive from Prisma)
├── template.json            ✅ Keep (but simplify)
├── data-contract.json       ❌ Redundant (generate from Prisma)
├── capabilities.json        ❌ Redundant (fold into template.json)
├── mappings.json            ❌ Redundant (derive from template.json)
├── theme.json               ❌ Redundant (use Tailwind config)
└── i18n.json                ⚠️  Optional (use shared package)
```

**Result**: 7 files → Too many to keep in sync!

---

## ✅ Revised Architecture (SIMPLIFIED)

### **New templates/ Structure** (MINIMAL):
```
templates/
├── template.json            ✅ ONLY source of UI configuration
└── i18n.json                ⚠️  OPTIONAL (only if overriding defaults)
```

### **New config/ Structure** (SERVER-ONLY):
```
config/
├── policy.config.ts         ✅ Authorization (single source of truth)
└── ssot.config.json         ✅ Deployment configuration
```

### **Generated at Build Time** (NO MANUAL MAINTENANCE):
```
.ssot/
├── types.ts                 ✅ Generated from Prisma
├── schemas.ts               ✅ Generated Zod schemas
├── route-manifest.json      ✅ Generated from template.json
└── models.d.ts              ✅ Generated Prisma DMMF types
```

**Result**: 2 files to maintain (was 7!)

---

## 📋 Detailed Changes

### **1. Kill models.json** ✅ **APPROVED**

**Current (Redundant)**:
```
Prisma schema → prisma generate → Prisma Client
              → prisma-to-models → models.json
```

**Revised (DRY)**:
```typescript
// Derive at runtime from Prisma DMMF
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const dmmf = await prisma.$getDMMF()

// Use DMMF directly in runtime
const models = dmmf.datamodel.models
```

**Benefits**:
- ✅ No drift (single source of truth)
- ✅ Always up-to-date
- ✅ One less file to maintain

---

### **2. Kill data-contract.json** ✅ **APPROVED**

**Current (Redundant)**:
```
Prisma schema → data-contract.json → Manual sync
```

**Revised (Generated)**:
```typescript
// Generate Zod schemas from Prisma at build time
// .ssot/schemas.ts (auto-generated)

import { z } from 'zod'

export const TrackCreateSchema = z.object({
  title: z.string().min(1).max(200),
  duration: z.number().int().min(0),
  audioUrl: z.string().url(),
  // ... auto-generated from Prisma
})

export const TrackUpdateSchema = TrackCreateSchema.partial()
```

**Build Step**:
```json
// package.json
{
  "scripts": {
    "prebuild": "prisma-to-zod && ssot-generate-types",
    "build": "next build"
  }
}
```

**Benefits**:
- ✅ Type-safe (Prisma → Zod → TypeScript)
- ✅ No drift (auto-generated)
- ✅ Server validates with generated schemas

---

### **3. Fold capabilities.json into template.json** ✅ **APPROVED**

**Current (Separate File)**:
```json
// capabilities.json
{
  "features": {
    "auth": true,
    "uploads": true,
    "payments": true
  }
}
```

**Revised (Merged)**:
```json
// template.json (root level)
{
  "capabilities": {
    "auth": true,
    "uploads": true,
    "payments": true
  },
  "pages": [...]
}
```

**Benefits**:
- ✅ One less file
- ✅ Everything in one place

---

### **4. Kill mappings.json** ✅ **APPROVED**

**Current (Manual Routing)**:
```json
// mappings.json
{
  "routes": [
    { "path": "/tracks", "page": "track-list" },
    { "path": "/tracks/:id", "page": "track-detail" }
  ]
}
```

**Revised (Derived from template.json)**:
```typescript
// Build time: Generate route manifest
// .ssot/route-manifest.json (auto-generated)

{
  "routes": [
    {
      "path": "/tracks",
      "pageId": "track-list",
      "component": "ListPageRenderer"
    },
    {
      "path": "/tracks/[id]",
      "pageId": "track-detail",
      "component": "DetailPageRenderer"
    }
  ]
}
```

**Dev Mode**: Use `[[...slug]]` catch-all  
**Prod Mode**: Generate static routes for SEO

**Benefits**:
- ✅ No drift (derived from template.json)
- ✅ Better SEO (static routes in prod)
- ✅ Better code-splitting

---

### **5. Merge theme.json into Tailwind** ✅ **APPROVED**

**Current (Separate Theme)**:
```json
// theme.json
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#8B5CF6"
  }
}
```

**Revised (Tailwind Config)**:
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)'
      }
    }
  }
}

// globals.css
:root {
  --color-primary: #3B82F6;
  --color-secondary: #8B5CF6;
}
```

**Benefits**:
- ✅ Standard Tailwind workflow
- ✅ CSS variable flexibility
- ✅ No custom JSON format

---

### **6. Make i18n.json Optional** ✅ **APPROVED**

**Current (Per-App)**:
```json
// i18n.json (every app)
{
  "en": {
    "common.save": "Save",
    "common.cancel": "Cancel"
  }
}
```

**Revised (Shared Package)**:
```typescript
// @ssot-projects/i18n (shared)
export const translations = {
  en: {
    'common.save': 'Save',
    'common.cancel': 'Cancel'
  }
}

// Apps only override if needed
// app/i18n.overrides.json (optional)
{
  "en": {
    "custom.message": "Custom message"
  }
}
```

**Benefits**:
- ✅ Shared translations across 100+ apps
- ✅ Only override when needed
- ✅ Proper ICU message support

---

### **7. Server-Only Expression Evaluation** ✅ **APPROVED**

**Current (Client-Side)**:
```tsx
'use client'

// ❌ Expressions evaluated on client (leaks logic)
const isVisible = useExpression(field.visibleWhen, context)
```

**Revised (Server-Side)**:
```tsx
// Server Component
async function Page({ params }) {
  const session = await getServerSession()
  const item = await prisma.track.findUnique({ where: { id: params.id } })
  
  // ✅ Evaluate on server
  const resolvedPage = await resolvePageWithExpressions(
    template.pages.find(p => p.id === 'track-detail'),
    { data: item, user: session.user }
  )
  
  // ✅ Send resolved props to client (no logic leaked)
  return <ClientPage page={resolvedPage} />
}
```

**Benefits**:
- ✅ Security (logic stays on server)
- ✅ Smaller client bundle
- ✅ Enables server-side caching

---

### **8. Split Catch-All Route** ✅ **APPROVED**

**Current (All Dynamic)**:
```
app/[[...slug]]/page.tsx  ❌ Catch-all for everything
```

**Revised (Hybrid)**:
```
Dev:
  app/[[...slug]]/page.tsx  ✅ Catch-all for fast iteration

Prod (generated at build):
  app/tracks/page.tsx       ✅ Static route (SEO, code-split)
  app/tracks/[id]/page.tsx  ✅ Dynamic route (SEO, code-split)
  app/[[...slug]]/page.tsx  ✅ Fallback only
```

**Build Step**:
```typescript
// next.config.mjs
export default {
  // Generate static routes from template.json
  async generateStaticParams() {
    const template = await loadTemplate()
    return template.pages.map(page => ({
      slug: page.path.split('/').filter(Boolean)
    }))
  }
}
```

**Benefits**:
- ✅ Better SEO (proper routes)
- ✅ Better code-splitting
- ✅ Faster dev (still use catch-all)

---

### **9. Namespaced Actions** ✅ **APPROVED**

**Current (Unstructured)**:
```json
{
  "action": "findMany",
  "model": "Track"
}
```

**Revised (Namespaced)**:
```json
{
  "action": "Track.findMany",
  "params": {
    "where": { "isPublic": true },
    "include": { "uploader": true }
  }
}
```

**Benefits**:
- ✅ Better metrics (track "Track.findMany" calls)
- ✅ Action-specific allowlists
- ✅ Clearer logging

---

### **10. policy.config.ts (Single Source of Truth)** ✅ **APPROVED**

**Current (Duplicated)**:
```json
// template.json (UI hint)
{
  "visibleWhen": { "op": "eq", "left": {"field": "uploadedBy"}, "right": {"field": "user.id"} }
}

// policies.json (Server enforcement)
{
  "allow": { "op": "eq", "left": {"field": "uploadedBy"}, "right": {"field": "user.id"} }
}
```

**Revised (Server is Truth)**:
```typescript
// config/policy.config.ts (SERVER-ONLY)

export const policies = {
  Track: {
    read: {
      allow: (ctx, where) => {
        if (ctx.user.roles.includes('admin')) return where
        return {
          ...where,
          OR: [
            { isPublic: true },
            { uploadedBy: ctx.user.id }
          ]
        }
      },
      fields: {
        read: ['*'],
        deny: []
      }
    },
    update: {
      allow: (ctx, where) => ({
        ...where,
        uploadedBy: ctx.user.id
      }),
      fields: {
        write: ['title', 'description', 'coverUrl'],
        deny: ['uploadedBy', 'plays']
      }
    }
  }
}
```

**UI (Derived from Policy)**:
```typescript
// Server generates UI hints from policy
const uiHints = derivePolicyHints(policies.Track.update, session.user)

// Send to client:
{
  "canEdit": true,  // Derived from policy
  "editableFields": ["title", "description", "coverUrl"]
}
```

**Benefits**:
- ✅ No duplication (server is source of truth)
- ✅ UI hints derived from policy
- ✅ Type-safe (TypeScript, not JSON)

---

### **11. Safe Defaults (Query Budget)** ✅ **APPROVED**

**Built-In Defaults**:
```typescript
// config/query-budget.ts

export const queryBudget = {
  pagination: {
    defaultTake: 50,
    maxTake: 1000
  },
  include: {
    maxDepth: 3,
    allowlist: {
      Track: ['uploader', 'playlists'],
      User: ['tracks', 'playlists']
    }
  },
  orderBy: {
    allowlist: {
      Track: ['createdAt', 'plays', 'title'],
      User: ['createdAt', 'name']
    }
  }
}
```

**Benefits**:
- ✅ Prevent N+1 queries
- ✅ Prevent DOS attacks
- ✅ Enforced by default

---

### **12. Prisma Comment Hints** ✅ **APPROVED**

**Current (Manual template.json)**:
```json
{
  "field": "title",
  "label": "Track Title",
  "type": "text",
  "required": true
}
```

**Revised (Prisma Comments)**:
```prisma
model Track {
  id          String   @id @default(cuid())
  /// @ui:text(label="Track Title", placeholder="Enter track name")
  title       String
  /// @ui:file(kind="audio", plugin="s3", maxSize="100MB")
  audioUrl    String
  /// @ui:file(kind="image", plugin="s3", maxSize="5MB")
  coverUrl    String?
}
```

**Build Step**:
```typescript
// Parse Prisma comments → Generate template.json
const template = generateTemplateFromPrisma(schema)
```

**Benefits**:
- ✅ Single source of truth (Prisma schema)
- ✅ Less template.json to write
- ✅ Auto-generated intelligent defaults

---

### **13. Plugin Lifecycle Hooks** ✅ **APPROVED**

**Standardized Hooks**:
```typescript
// plugins/stripe/index.ts

export const stripePlugin: Plugin = {
  name: 'stripe',
  
  beforeAction: async (ctx, action) => {
    // Called before any action
  },
  
  afterCommit: async (ctx, action, result) => {
    // Called after successful action
  },
  
  onWebhook: async (event) => {
    // Handle webhook events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event)
        break
    }
  },
  
  onRetry: async (ctx, error, attempt) => {
    // Handle retry logic
  }
}
```

**Webhook Router** (Built-In):
```typescript
// app/api/webhooks/[provider]/route.ts (generated)

export async function POST(request: Request, { params }) {
  const provider = params.provider // 'stripe', 'twilio', etc.
  const plugin = plugins[provider]
  
  // 1. Verify signature
  const isValid = await plugin.verifySignature(request)
  if (!isValid) return Response.json({ error: 'Invalid signature' }, { status: 400 })
  
  // 2. Check idempotency
  const event = await request.json()
  const processed = await checkIdempotency(event.id)
  if (processed) return Response.json({ received: true })
  
  // 3. Call plugin webhook handler
  await plugin.onWebhook(event)
  
  // 4. Mark as processed
  await markProcessed(event.id)
  
  return Response.json({ received: true })
}
```

**Benefits**:
- ✅ Standardized plugin API
- ✅ Built-in webhook handling
- ✅ Idempotency + retries out of the box

---

## 📊 Comparison: Before vs After

### **Files to Maintain**:

| Before | After | Reduction |
|--------|-------|-----------|
| **templates/** | | |
| models.json | ❌ Removed (derive from Prisma) | |
| template.json | ✅ Keep (simplified) | |
| data-contract.json | ❌ Removed (generate from Prisma) | |
| capabilities.json | ❌ Merged into template.json | |
| mappings.json | ❌ Removed (derive from template) | |
| theme.json | ❌ Moved to Tailwind | |
| i18n.json | ⚠️ Optional (shared package) | |
| **config/** | | |
| - | ✅ policy.config.ts (new) | |
| - | ✅ ssot.config.json (new) | |
| **Total** | 7 files | 2-3 files | **60-70% fewer** |

### **Redundancy Eliminated**:

| Redundancy | Before | After |
|------------|--------|-------|
| **Schema drift** | Prisma + models.json | Prisma only (DMMF at runtime) |
| **Type duplication** | Prisma → data-contract → client | Prisma → generated Zod/TS |
| **Auth duplication** | UI visibleWhen + server policies | Server policy.config.ts (UI derived) |
| **Routing duplication** | mappings.json + catch-all | Route manifest (generated) |
| **Config sprawl** | 7 JSON files | 2 config files |

---

## 🚀 Revised Implementation Plan

### **Phase 1.5: Security Foundation** (2-3 weeks) - **IN PROGRESS**

**Changes from original plan**:
1. ✅ Policy Engine → **Use policy.config.ts** (TypeScript, not JSON)
2. ✅ Expression Sandbox → **Server-only evaluation**
3. ✅ Validation Layer → **Generate from Prisma** (not data-contract.json)
4. ✅ Schema Drift → **Use Prisma DMMF** (kill models.json)
5. ✅ Query Budget → **Built-in defaults**

### **Phase 1.6: Architecture Simplification** (NEW - 1 week)

**Goal**: Implement the revised architecture

**Tasks**:
1. **Kill Redundant Files** (1 day)
   - Remove models.json (use Prisma DMMF)
   - Remove data-contract.json (generate Zod from Prisma)
   - Merge capabilities.json into template.json
   - Remove mappings.json (generate route manifest)

2. **Build Pipeline** (2 days)
   - Add prebuild step (generate types, schemas, route manifest)
   - Update create-ssot-app to use new structure
   - Add Prisma comment parser

3. **policy.config.ts** (2 days)
   - Replace policies.json with TypeScript config
   - Add row filter functions
   - Add field allowlist functions

4. **Server-Only Expressions** (1 day)
   - Evaluate expressions on server
   - Send resolved props to client
   - Remove client-side expression evaluation

**Total**: 1 week

### **Phase 2: Page Renderers** (2-3 weeks) - **UNCHANGED**

Detail, List, Form renderers

### **Phase 3: Operational** (2-3 weeks) - **UPDATED**

Add standardized plugin hooks, webhook router, file upload service

---

## 🎯 Updated Timeline

```
✅ Phase 1.5: Security       (Week 1-3, in progress)
🆕 Phase 1.6: Simplification (Week 4, NEW)
   Phase 2:   Renderers      (Week 5-7)
   Phase 3:   Operational    (Week 8-10)
──────────────────────────────────────────────
Total:                        10 weeks
```

---

## 📝 Migration Path (Existing V3 Projects)

For projects already using V3 with the old structure:

```bash
# Run migration tool
npx @ssot-ui/migrate v3-simplify

# What it does:
1. Removes models.json (switches to DMMF)
2. Generates Zod schemas from Prisma
3. Merges capabilities.json into template.json
4. Generates route manifest from template.json
5. Converts policies.json to policy.config.ts
6. Updates imports/references

# Result: Simplified structure with no breaking changes
```

---

## ✅ Your Feedback: INCORPORATED

Every point you raised has been addressed:

| Your Point | Status | Change |
|------------|--------|--------|
| Kill models.json | ✅ Approved | Use Prisma DMMF at runtime |
| Kill data-contract.json | ✅ Approved | Generate Zod from Prisma |
| Fold capabilities.json | ✅ Approved | Merge into template.json root |
| Kill mappings.json | ✅ Approved | Generate route manifest |
| Merge theme.json | ✅ Approved | Use Tailwind + CSS variables |
| Optional i18n.json | ✅ Approved | Shared @ssot-projects/i18n |
| Server-only expressions | ✅ Approved | Evaluate on server, send props |
| Split catch-all route | ✅ Approved | Generate static routes in prod |
| Namespaced actions | ✅ Approved | "Track.findMany" format |
| policy.config.ts as truth | ✅ Approved | TypeScript, derive UI hints |
| Safe query defaults | ✅ Approved | Built-in budgets |
| Prisma comment hints | ✅ Approved | /// @ui:text(...) |
| Plugin lifecycle hooks | ✅ Approved | Standardized API |

**Result**: Architecture is now **significantly simpler** and **more maintainable**.

---

## 🚀 Next Steps

**Option A**: Continue Phase 1.5 (Security) with old structure, refactor in Phase 1.6  
**Option B**: Pause Phase 1.5, implement simplified architecture first  
**Option C**: Implement both in parallel (risky)

**My Recommendation**: **Option A**
- Complete Phase 1.5 with current structure (almost done)
- Refactor to new architecture in Phase 1.6
- Less risk, cleaner migration path

**Your decision?**

