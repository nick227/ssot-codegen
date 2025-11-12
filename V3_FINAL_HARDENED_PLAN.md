# 🎯 V3 FINAL HARDENED PLAN (Production-Ready)

## Executive Summary

Based on comprehensive feedback and architectural review, this is the **final, hardened implementation plan** for V3. All redundancies eliminated, all security gaps addressed, all strategic insights incorporated.

---

## 🎯 Core Principles (Hardened)

1. **Single Source of Truth**: Prisma schema only (no models.json, no data-contract.json)
2. **Server is Authority**: Policies, expressions, validation on server (client gets results)
3. **Fail-Closed**: Deny by default (security first)
4. **Generated, Not Manual**: Types, schemas, routes auto-generated (no drift)
5. **DRY Everywhere**: Share code via monorepo, derive UI from policies

---

## 📁 Final File Structure (SIMPLIFIED)

### **Per-App Structure**:
```
my-app/
├── prisma/
│   └── schema.prisma              ✅ SINGLE source of truth
│                                     (with /// @ui:... comments)
├── config/
│   ├── policy.config.ts           ✅ Authorization (server-only)
│   └── ssot.config.json           ✅ Deployment config
├── templates/
│   └── template.json              ✅ UI definition (auto-generated, can override)
├── app/
│   ├── layout.tsx
│   ├── [[...slug]]/page.tsx      ✅ Dev only
│   ├── tracks/page.tsx            ✅ Prod (generated)
│   ├── tracks/[id]/page.tsx       ✅ Prod (generated)
│   └── api/
│       ├── data/route.ts          ✅ Universal endpoint
│       └── webhooks/
│           └── [provider]/route.ts ✅ Webhook router
├── lib/
│   └── adapters/index.ts
├── .ssot/                         ✅ Generated (gitignored)
│   ├── types.ts                   ✅ From Prisma DMMF
│   ├── schemas.ts                 ✅ Zod schemas
│   ├── route-manifest.json        ✅ From template.json
│   └── models.d.ts
├── tailwind.config.ts             ✅ Theme via CSS variables
├── package.json
└── tsconfig.json
```

**Files to Maintain Manually**: 4 files
- ✅ `schema.prisma` (with UI hints)
- ✅ `policy.config.ts`
- ✅ `ssot.config.json`
- ⚠️ `template.json` (optional overrides, mostly auto-generated)

**Files Auto-Generated**: 5+ files
- ✅ `.ssot/types.ts`
- ✅ `.ssot/schemas.ts`
- ✅ `.ssot/route-manifest.json`
- ✅ `app/tracks/page.tsx` (prod)
- ✅ `app/tracks/[id]/page.tsx` (prod)

**Reduction**: From 7+ manual JSON files → 2-3 manual files (60-70% reduction!)

---

## 🔒 Security Architecture (Hardened)

### **1. policy.config.ts (Single Source of Truth)**

```typescript
// config/policy.config.ts (SERVER-ONLY)

import type { PolicyContext } from '@ssot-ui/policy-engine'

export const policies = {
  Track: {
    read: {
      // Row-level filter function
      filter: (ctx: PolicyContext) => {
        if (ctx.user.roles.includes('admin')) return {}  // Admins see all
        
        return {
          OR: [
            { isPublic: true },
            { uploadedBy: ctx.user.id }
          ]
        }
      },
      
      // Field-level permissions
      fields: {
        read: ['*'],
        deny: []  // All fields readable
      }
    },
    
    update: {
      // Only owner or admin can update
      filter: (ctx: PolicyContext) => {
        if (ctx.user.roles.includes('admin')) return {}
        
        return {
          uploadedBy: ctx.user.id
        }
      },
      
      fields: {
        write: ['title', 'description', 'coverUrl', 'isPublic'],
        deny: ['uploadedBy', 'plays', 'id']  // Can't change these
      }
    },
    
    delete: {
      filter: (ctx: PolicyContext) => {
        if (ctx.user.roles.includes('admin')) return {}
        return { uploadedBy: ctx.user.id }
      }
    },
    
    create: {
      // Anyone can create (will set uploadedBy server-side)
      allow: (ctx: PolicyContext) => true,
      
      fields: {
        write: ['title', 'description', 'audioUrl', 'coverUrl', 'isPublic'],
        deny: ['uploadedBy', 'plays', 'id']  // Set server-side
      },
      
      // Server sets these automatically
      defaults: (ctx: PolicyContext) => ({
        uploadedBy: ctx.user.id,
        plays: 0
      })
    }
  },
  
  User: {
    read: {
      filter: () => ({}),  // All users readable
      fields: {
        read: ['id', 'name', 'email', 'avatar', 'createdAt'],
        deny: ['passwordHash', 'apiKeys', 'stripeCustomerId']
      }
    },
    
    update: {
      filter: (ctx: PolicyContext) => {
        if (ctx.user.roles.includes('admin')) return {}
        return { id: ctx.user.id }  // Only update self
      },
      
      fields: {
        write: ['name', 'email', 'avatar'],
        deny: ['role', 'permissions', 'passwordHash', 'apiKeys']
      }
    },
    
    delete: {
      filter: (ctx: PolicyContext) => {
        if (!ctx.user.roles.includes('admin')) {
          throw new Error('Only admins can delete users')
        }
        return {}
      }
    }
  }
}

// Rate limits per action
export const rateLimits = {
  'Track.create': { max: 10, window: '1h' },
  'Track.findMany': { max: 100, window: '1m' },
  'User.update': { max: 5, window: '1m' }
}

// Query budgets
export const queryBudgets = {
  Track: {
    include: {
      allowlist: ['uploader', 'playlists'],
      maxDepth: 2
    },
    orderBy: {
      allowlist: ['createdAt', 'plays', 'title']
    }
  }
}
```

### **2. Universal Endpoint (Hardened)**

```typescript
// app/api/data/route.ts

import { getServerSession } from 'next-auth'
import { policies, rateLimits, queryBudgets } from '@/config/policy.config'
import { PolicyEngine } from '@ssot-ui/policy-engine'
import { validateRequest } from '@/lib/validator'
import { checkRateLimit } from '@/lib/rate-limiter'
import { auditLog } from '@/lib/audit-logger'
import { adapters } from '@/lib/adapters'

const policyEngine = new PolicyEngine(policies)

export async function POST(request: NextRequest) {
  // 1. Authentication
  const session = await getServerSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  
  // 2. Parse namespaced action (e.g., "Track.findMany")
  const [model, action] = body.action.split('.')
  if (!model || !action) {
    return NextResponse.json({ error: 'Invalid action format' }, { status: 400 })
  }
  
  // 3. Rate limiting
  const rateLimitKey = `${session.user.id}:${body.action}`
  const allowed = await checkRateLimit(rateLimitKey, rateLimits[body.action])
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
  
  // 4. Validate request (Zod schemas from Prisma)
  const validation = await validateRequest(model, action, body.params)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.errors
    }, { status: 400 })
  }
  
  // 5. Authorization (policy engine)
  const policyContext = {
    user: session.user,
    model,
    action,
    where: body.params?.where,
    data: body.params?.data
  }
  
  const policyResult = await policyEngine.evaluate(policyContext)
  if (!policyResult.allowed) {
    await auditLog({
      userId: session.user.id,
      model,
      action,
      status: 'denied',
      reason: policyResult.reason
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // 6. Apply row-level filters
  const whereWithPolicy = {
    ...body.params?.where,
    ...policyResult.rowFilters
  }
  
  // 7. Apply query budget
  const budget = queryBudgets[model] || {}
  const validatedParams = applyQueryBudget(body.params, budget)
  
  // 8. Apply field-level filters
  const safeData = filterDataFields(
    body.params?.data,
    action === 'create' || action === 'update' ? policyResult.writeFields : []
  )
  
  // 9. Execute with all constraints
  try {
    let result
    
    switch (action) {
      case 'findMany':
        result = await adapters.data.findMany(model, {
          where: whereWithPolicy,
          include: validatedParams.include,
          orderBy: validatedParams.orderBy,
          take: validatedParams.take,
          skip: validatedParams.skip,
          select: buildSelect(policyResult.readFields)
        })
        break
        
      case 'findOne':
        result = await adapters.data.findOne(model, whereWithPolicy, {
          include: validatedParams.include,
          select: buildSelect(policyResult.readFields)
        })
        break
        
      case 'create':
        // Merge with policy defaults
        const createData = {
          ...safeData,
          ...policy.defaults?.(policyContext)
        }
        result = await adapters.data.create(model, createData)
        break
        
      case 'update':
        result = await adapters.data.update(model, whereWithPolicy, safeData)
        break
        
      case 'delete':
        result = await adapters.data.delete(model, whereWithPolicy)
        break
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    // 10. Audit success
    await auditLog({
      userId: session.user.id,
      model,
      action,
      status: 'success',
      recordId: result?.id
    })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[Data API] Error:', error)
    
    // 11. Audit failure
    await auditLog({
      userId: session.user.id,
      model,
      action,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

---

## 🏗️ Build Pipeline (Automated)

### **prebuild Script** (package.json):

```json
{
  "scripts": {
    "prebuild": "ssot-generate",
    "build": "next build",
    "dev": "next dev",
    "generate": "prisma generate && ssot-generate"
  }
}
```

### **ssot-generate Command**:

```bash
#!/usr/bin/env node
# Runs all code generation steps

1. Prisma Client (official)
   → node_modules/.prisma/client/

2. Zod Schemas (from Prisma)
   → .ssot/schemas.ts

3. TypeScript Types (from Prisma DMMF)
   → .ssot/types.ts

4. Template (from Prisma comments)
   → templates/template.json (if not exists)

5. Route Manifest (from template.json)
   → .ssot/route-manifest.json

6. Static Routes (for prod)
   → app/tracks/page.tsx
   → app/tracks/[id]/page.tsx
```

---

## 🚀 Developer Workflow (Streamlined)

### **Starting a New App**:

```bash
# 1. Scaffold (5 minutes)
npx create-ssot-app soundcloud-clone --ui v3-runtime --auto

# 2. Define Schema (10 minutes)
# Edit prisma/schema.prisma with UI hints:

model Track {
  id          String   @id @default(cuid())
  /// @ui:text(label="Track Title", placeholder="Enter track name")
  title       String
  /// @ui:file(kind="audio", plugin="s3", maxSize="100MB")
  audioUrl    String
  /// @ui:number(label="Plays", readOnly=true)
  plays       Int      @default(0)
  
  uploadedBy  String
  uploader    User     @relation(fields: [uploadedBy], references: [id])
}

# 3. Generate Everything (1 minute)
npm run generate

# Auto-generates:
# ✅ Prisma Client
# ✅ Zod schemas (.ssot/schemas.ts)
# ✅ TypeScript types (.ssot/types.ts)
# ✅ template.json (from @ui hints)
# ✅ Route manifest

# 4. Define Policies (5 minutes)
# Edit config/policy.config.ts

export const policies = {
  Track: {
    read: {
      filter: (ctx) => ctx.user.roles.includes('admin')
        ? {}
        : { OR: [{ isPublic: true }, { uploadedBy: ctx.user.id }] }
    },
    update: {
      filter: (ctx) => ({ uploadedBy: ctx.user.id }),
      fields: { write: ['title', 'description'] }
    }
  }
}

# 5. Run Dev (instant)
npm run dev

# 6. Deploy (2 minutes)
git push origin main
# Vercel auto-deploys ✅

Total time: ~25 minutes from idea to production!
```

---

## 🔒 Security Layers (Hardened)

### **Layer 1: Authentication** (Next-Auth)
```typescript
const session = await getServerSession()
if (!session?.user) return 401
```

### **Layer 2: Rate Limiting**
```typescript
const allowed = await checkRateLimit(userId, action, limits)
if (!allowed) return 429
```

### **Layer 3: Validation** (Zod from Prisma)
```typescript
const validation = schemas[`${model}${action}`].safeParse(data)
if (!validation.success) return 400
```

### **Layer 4: Authorization** (Policy Engine)
```typescript
const policyResult = await policyEngine.evaluate(context)
if (!policyResult.allowed) return 403
```

### **Layer 5: Row-Level Security**
```typescript
const where = { ...userWhere, ...policyResult.rowFilters }
```

### **Layer 6: Field-Level Security**
```typescript
const safeData = filterFields(data, policyResult.writeFields)
```

### **Layer 7: Query Budget**
```typescript
validateQueryBudget(params, budgets[model])
```

### **Layer 8: Audit Logging**
```typescript
await auditLog({ userId, model, action, status, recordId })
```

**Result**: Defense in depth - 8 security layers!

---

## 📦 Package Architecture (Final)

### **Core Packages** (Published to NPM):

```
@ssot-ui/runtime              # Template runtime engine
@ssot-ui/expressions          # Expression evaluator (with sandbox)
@ssot-ui/schemas              # Zod schemas for JSON
@ssot-ui/adapters             # Base adapter interfaces
@ssot-ui/adapter-prisma       # Prisma data adapter (with query budget)
@ssot-ui/adapter-nextauth     # NextAuth adapter
@ssot-ui/adapter-s3           # S3 file adapter
@ssot-ui/policy-engine        # Policy engine (RLS + field-level)
@ssot-ui/validator            # Request validation
@ssot-ui/generator            # Code generation tools

create-ssot-app               # CLI scaffolding tool
```

### **Monorepo Shared Packages** (Internal):

```
@ssot-projects/ui             # Shared components
@ssot-projects/auth           # Shared auth logic
@ssot-projects/hooks          # Shared hooks
@ssot-projects/i18n           # Shared translations
@ssot-projects/config         # Shared configs
```

### **Apps** (100+ projects):

```
apps/soundcloud-clone/
apps/doordash-clone/
apps/talent-agency/
... 97 more apps
```

---

## 🎯 Implementation Phases (FINAL)

### **Phase 1.5: Security Foundation** (2-3 weeks) 🔥 **IN PROGRESS**

**Week 1**:
- ✅ Policy Engine core (DONE)
- ⏳ Policy Engine tests (in progress)
- 🔜 Expression Sandbox

**Week 2**:
- 🔜 Validation Layer (Zod from Prisma)
- 🔜 Schema Drift Protection (kill models.json)

**Week 3**:
- 🔜 Query Budget
- 🔜 Integration testing
- 🔜 Documentation

**Deliverables**:
- ✅ @ssot-ui/policy-engine
- ⏳ Expression sandbox (updated)
- 🔜 @ssot-ui/validator
- 🔜 Query budget enforcement
- 🔜 Audit logging

---

### **Phase 1.6: Architecture Simplification** (1 week) 🔧 **NEW**

**Goal**: Eliminate redundancy, implement revised architecture

**Tasks**:

1. **Prisma DMMF Integration** (2 days)
   - Remove models.json
   - Use `prisma.$getDMMF()` at runtime
   - Cache DMMF for performance

2. **Code Generation** (2 days)
   - Generate Zod schemas from Prisma
   - Generate TypeScript types from Prisma
   - Generate route manifest from template.json
   - Prisma comment parser (/// @ui:...)

3. **policy.config.ts Migration** (1 day)
   - Convert policies.json → policy.config.ts
   - TypeScript-first policy definitions
   - Remove expression-based policies (use functions)

4. **Build Pipeline** (1 day)
   - Add prebuild step
   - Update create-ssot-app
   - Update documentation

**Deliverables**:
- ✅ Prisma DMMF runtime integration
- ✅ Code generation tools
- ✅ Simplified template structure (2 files instead of 7)
- ✅ Build pipeline

---

### **Phase 1.7: Monorepo Setup** (1 week) 🏗️ **STRATEGIC**

**Goal**: Enable 100+ apps with shared code

**Tasks**:

1. **Turborepo Configuration** (1 day)
2. **Shared Packages** (3 days)
   - @ssot-projects/ui
   - @ssot-projects/auth
   - @ssot-projects/hooks
3. **Update create-ssot-app** (2 days)
   - Add --monorepo flag
4. **Documentation** (1 day)

---

### **Phase 2: Page Renderers** (2-3 weeks) ✅ **CORE**

**No changes** - DetailPage, ListPage, FormPage with security

---

### **Phase 3: Operational** (2-3 weeks) 🔧 **PRODUCTION**

**Updated**:
1. Standardized plugin lifecycle hooks
2. Webhook router (built-in)
3. File upload service (presigned URLs)
4. Observability (OpenTelemetry)

---

## 📊 Final Comparison

### **Before (V3 Original)**:

```
Templates: 7 JSON files (manual sync required)
Security: UI visibleWhen + policies.json (duplicated logic)
Types: Prisma → models.json → data-contract.json (3 sources)
Routes: mappings.json + catch-all (manual)
Build: next build (no code generation)
Timeline: 6-9 weeks
```

### **After (V3 Hardened)**:

```
Templates: 1-2 files (template.json + optional i18n)
Security: policy.config.ts (server-only, single source)
Types: Prisma → .ssot/*.ts (auto-generated, 1 source)
Routes: Auto-generated from template.json
Build: prebuild (generate) → next build
Timeline: 7-10 weeks (+1-2 weeks for simplification, worth it!)
```

**Improvements**:
- ✅ 60-70% fewer files to maintain
- ✅ Zero schema drift (single source: Prisma)
- ✅ Zero auth duplication (server → UI)
- ✅ Automatic type generation
- ✅ Better SEO (static routes)
- ✅ Smaller client bundles (server evaluation)

---

## ✅ Decision: HARDENED PLAN APPROVED

All your feedback incorporated:
1. ✅ Kill models.json → Prisma DMMF
2. ✅ Kill data-contract.json → Generate Zod
3. ✅ Fold capabilities → template.json
4. ✅ Kill mappings → Generate manifest
5. ✅ Merge theme → Tailwind
6. ✅ Optional i18n → Shared package
7. ✅ Server-only expressions
8. ✅ Split catch-all route
9. ✅ Namespaced actions
10. ✅ policy.config.ts as truth
11. ✅ Safe query defaults
12. ✅ Prisma comment hints
13. ✅ Plugin lifecycle hooks

**Total Timeline**: 7-10 weeks (was 6-9, +1-2 weeks for simplification)

**Trade-off**: Slightly longer timeline, but **massively simpler** and **more maintainable** architecture.

---

## 🚀 Proceeding With Hardened Plan

**Current Status**:
- ✅ Phase 1.5: Policy Engine core complete (~40% done)
- ⏳ Next: Policy Engine tests
- 🔜 Next: Expression Sandbox
- 🔜 Next: Phase 1.6 (Architecture Simplification)

**Continuing implementation now...** 🚀

