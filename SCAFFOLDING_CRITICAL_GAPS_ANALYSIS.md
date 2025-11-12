# 🚨 V3 Scaffolding: Critical Gaps & Risk Mitigation

## Executive Summary

The V3 vision is **architecturally sound** but has **critical production gaps** that must be addressed before Phase 2.

**The core insight**: We've focused on the "happy path" (Prisma → JSON → UI) but haven't designed the **security, policy, and operational layers** that make this production-ready.

---

## 🔴 CRITICAL BLOCKERS (Must Fix for v1)

### **1. AuthZ Gap (Mass-CRUD Attack Surface)** 🔥🔥🔥

**Risk**: Universal data API allows ANY authenticated user to read/write ANY model/field unless explicitly prevented.

**Current Code** (app/api/data/route.ts):
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, model, data, where, include } = body
  
  // ❌ NO AUTHORIZATION CHECK!
  const result = await adapters.data.findMany(model, { where, include })
  return NextResponse.json(result)
}
```

**Attack Scenario**:
```typescript
// Malicious client bypasses UI and calls API directly:
fetch('/api/data', {
  method: 'POST',
  body: JSON.stringify({
    action: 'findMany',
    model: 'User',
    where: {},  // Get ALL users!
    include: { tracks: true }  // Including private data
  })
})

// Or worse:
fetch('/api/data', {
  method: 'POST',
  body: JSON.stringify({
    action: 'update',
    model: 'User',
    where: { id: 'victim-user-id' },
    data: { role: 'admin' }  // Privilege escalation!
  })
})
```

**Solution**: Policy Engine (Server-Enforced)

```typescript
// NEW: packages/policy-engine/src/index.ts

interface PolicyRule {
  model: string
  action: 'create' | 'read' | 'update' | 'delete'
  allow: Expression  // Evaluated server-side
  fields?: {
    read?: string[]     // Allowed read fields
    write?: string[]    // Allowed write fields
  }
}

interface PolicyContext {
  user: { id: string; roles: string[] }
  session: Session
  model: string
  action: string
  where?: any
  data?: any
}

// Example policies.json:
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
          },
          {
            "type": "permission",
            "check": "hasRole",
            "args": ["admin"]
          }
        ]
      }
    },
    {
      "model": "Track",
      "action": "update",
      "allow": {
        "type": "operation",
        "op": "or",
        "args": [
          {
            "type": "condition",
            "op": "eq",
            "left": { "type": "field", "path": "uploadedBy" },
            "right": { "type": "field", "path": "user.id" }
          },
          {
            "type": "permission",
            "check": "hasRole",
            "args": ["admin"]
          }
        ]
      },
      "fields": {
        "read": ["id", "title", "audioUrl", "plays", "uploadedBy"],
        "write": ["title", "description", "isPublic"]
      }
    },
    {
      "model": "User",
      "action": "update",
      "allow": {
        "type": "condition",
        "op": "eq",
        "left": { "type": "field", "path": "id" },
        "right": { "type": "field", "path": "user.id" }
      },
      "fields": {
        "read": ["id", "name", "email", "avatar"],
        "write": ["name", "avatar"],  // ❌ NOT "role"!
        "deny": ["role", "permissions"]  // Explicit deny
      }
    }
  ]
}
```

**Updated API** (with policy enforcement):

```typescript
// app/api/data/route.ts
import { PolicyEngine } from '@ssot-ui/policy-engine'
import { getServerSession } from 'next-auth'
import policies from '@/templates/policies.json'

const policyEngine = new PolicyEngine(policies)

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { action, model, data, where, include, orderBy, pagination } = body
  
  // 1. Check if action is allowed
  const isAllowed = await policyEngine.checkAccess({
    user: session.user,
    model,
    action,
    where,
    data
  })
  
  if (!isAllowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // 2. Apply row-level filters (RLS)
  const whereWithPolicy = policyEngine.applyRowFilters({
    model,
    action,
    where,
    user: session.user
  })
  
  // 3. Apply field-level filters
  const allowedFields = policyEngine.getAllowedFields({
    model,
    action,
    user: session.user
  })
  
  // 4. Execute with constraints
  try {
    let result
    
    switch (action) {
      case 'findMany':
        result = await adapters.data.findMany(model, {
          where: whereWithPolicy,  // ✅ Policy-constrained
          include,
          orderBy,
          pagination,
          select: allowedFields.read  // ✅ Field-level security
        })
        break
      case 'findOne':
        result = await adapters.data.findOne(model, whereWithPolicy, {
          select: allowedFields.read
        })
        break
      case 'create':
        // Filter data to only allowed fields
        const createData = filterFields(data, allowedFields.write)
        result = await adapters.data.create(model, createData)
        break
      case 'update':
        // Filter data to only allowed fields
        const updateData = filterFields(data, allowedFields.write)
        result = await adapters.data.update(model, whereWithPolicy, updateData)
        break
      case 'delete':
        result = await adapters.data.delete(model, whereWithPolicy)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Data API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function filterFields(data: any, allowedFields: string[]): any {
  const filtered: any = {}
  for (const field of allowedFields) {
    if (field in data) {
      filtered[field] = data[field]
    }
  }
  return filtered
}
```

**Priority**: 🔥🔥🔥 **BLOCKER** - Without this, V3 is a security disaster

---

### **2. Schema–JSON Drift** 🔥🔥

**Risk**: Prisma schema changes → stale models.json/template.json → runtime errors

**Example**:
```prisma
// Developer renames field:
model Track {
  // duration Int  ❌ Removed
  durationMs Int   ✅ New field
}
```

**Stale template.json still references old field**:
```json
{
  "field": "duration",  // ❌ No longer exists!
  "computed": {
    "op": "formatDuration",
    "args": [{ "field": "duration" }]  // ❌ Runtime error!
  }
}
```

**Solution**: Schema Lockfile + CI Validation

```typescript
// packages/schema-validator/src/index.ts

interface SchemaLockfile {
  schemaHash: string
  generatedAt: string
  models: {
    name: string
    fields: string[]
  }[]
}

// Generated .schema-lock.json:
{
  "schemaHash": "abc123...",
  "generatedAt": "2024-01-15T10:30:00Z",
  "models": [
    {
      "name": "Track",
      "fields": ["id", "title", "duration", "plays", "uploadedBy"]
    }
  ]
}

// Validator:
function validateTemplateAgainstSchema(
  template: Template,
  models: Model[],
  lockfile: SchemaLockfile
): ValidationResult {
  const errors: string[] = []
  
  // Check if lockfile is up to date
  const currentHash = hashPrismaSchema()
  if (lockfile.schemaHash !== currentHash) {
    errors.push('Schema has changed! Run: npm run generate:templates')
  }
  
  // Validate all field references
  for (const page of template.pages) {
    for (const field of page.fields || []) {
      if (field.computed) {
        const referencedFields = extractFieldReferences(field.computed)
        for (const ref of referencedFields) {
          if (!fieldExistsInModel(ref, models)) {
            errors.push(`Field '${ref}' not found in model '${page.model}'`)
          }
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors }
}
```

**package.json scripts**:
```json
{
  "scripts": {
    "generate": "prisma generate && npm run generate:templates",
    "generate:templates": "prisma-to-models && template-generator && schema-lock",
    "validate": "schema-validator",
    "predev": "npm run validate",
    "prebuild": "npm run validate"
  }
}
```

**CI Check** (.github/workflows/ci.yml):
```yaml
- name: Validate Schema Sync
  run: |
    npm run generate:templates
    git diff --exit-code templates/ .schema-lock.json
    if [ $? -ne 0 ]; then
      echo "❌ Templates are out of sync with Prisma schema!"
      echo "Run: npm run generate:templates"
      exit 1
    fi
```

**Priority**: 🔥🔥 **HIGH** - Prevents runtime errors in production

---

### **3. Expressions as Attack Surface** 🔥🔥

**Risk**: JSON expressions evaluated on server could enable:
- Prototype pollution
- Infinite loops
- Memory exhaustion
- Secret exposure

**Example Attack**:
```json
{
  "computed": {
    "type": "operation",
    "op": "accessPrototype",  // Malicious operation
    "args": [{ "value": "__proto__" }]
  }
}
```

**Solution**: Expression Sandbox + Budget

```typescript
// packages/ui-expressions/src/sandbox.ts

interface EvaluationBudget {
  maxDepth: number          // Max expression tree depth
  maxOperations: number     // Max operations per evaluation
  timeout: number           // Max execution time (ms)
  allowedOperations: Set<string>  // Whitelist of operations
}

class SafeEvaluator {
  private budget: EvaluationBudget
  private operationCount = 0
  private depth = 0
  
  constructor(budget: EvaluationBudget = {
    maxDepth: 10,
    maxOperations: 100,
    timeout: 100,
    allowedOperations: new Set([
      'add', 'subtract', 'multiply', 'divide',
      'concat', 'formatDate', 'formatNumber',
      // ... other safe operations
    ])
  }) {
    this.budget = budget
  }
  
  evaluate(expr: Expression, context: ExpressionContext): any {
    const startTime = Date.now()
    
    try {
      return this.evaluateWithChecks(expr, context, startTime)
    } catch (error) {
      if (error instanceof BudgetExceededError) {
        throw new Error('Expression evaluation exceeded budget (possible attack)')
      }
      throw error
    }
  }
  
  private evaluateWithChecks(
    expr: Expression,
    context: ExpressionContext,
    startTime: number
  ): any {
    // 1. Check timeout
    if (Date.now() - startTime > this.budget.timeout) {
      throw new BudgetExceededError('Timeout exceeded')
    }
    
    // 2. Check depth
    this.depth++
    if (this.depth > this.budget.maxDepth) {
      throw new BudgetExceededError('Max depth exceeded')
    }
    
    // 3. Check operation count
    this.operationCount++
    if (this.operationCount > this.budget.maxOperations) {
      throw new BudgetExceededError('Max operations exceeded')
    }
    
    // 4. Validate operation is allowed
    if (expr.type === 'operation') {
      if (!this.budget.allowedOperations.has(expr.op)) {
        throw new SecurityError(`Operation '${expr.op}' not allowed`)
      }
    }
    
    // 5. Prevent access to dangerous properties
    if (expr.type === 'field') {
      if (this.isDangerousPath(expr.path)) {
        throw new SecurityError(`Field access '${expr.path}' not allowed`)
      }
    }
    
    // 6. Evaluate (normal logic)
    const result = this.evaluateExpression(expr, context)
    
    this.depth--
    return result
  }
  
  private isDangerousPath(path: string): boolean {
    const dangerous = [
      '__proto__',
      'constructor',
      'prototype',
      'process',
      'global',
      'require',
      'module'
    ]
    return dangerous.some(d => path.includes(d))
  }
  
  private evaluateExpression(expr: Expression, context: ExpressionContext): any {
    // Frozen context to prevent mutation
    const frozenContext = Object.freeze({
      ...context,
      data: Object.freeze({ ...context.data }),
      user: Object.freeze({ ...context.user })
    })
    
    // Rest of evaluation logic...
  }
}

// Usage:
const evaluator = new SafeEvaluator({
  maxDepth: 10,
  maxOperations: 100,
  timeout: 100,
  allowedOperations: new Set(['add', 'multiply', 'concat', 'formatDate'])
})

const result = evaluator.evaluate(expression, context)
```

**Additional Safeguards**:

1. **Client vs Server Expressions**:
```typescript
// Some expressions are safe for client, others must be server-only
interface Expression {
  type: string
  op?: string
  args?: Expression[]
  evaluateOn?: 'client' | 'server' | 'both'  // NEW
}

// Example:
{
  "field": "total",
  "computed": {
    "type": "operation",
    "op": "multiply",
    "args": [...],
    "evaluateOn": "client"  // ✅ Safe (no sensitive data)
  }
}

{
  "field": "canEdit",
  "computed": {
    "type": "permission",
    "check": "hasRole",
    "args": ["admin"],
    "evaluateOn": "server"  // ✅ Must be server-side!
  }
}
```

2. **Secrets Protection**:
```typescript
// NEVER expose these in context:
const context: ExpressionContext = {
  data: item,
  user: {
    id: session.user.id,
    roles: session.user.roles
    // ❌ NO: apiKeys, tokens, passwords, internal IDs
  },
  params,
  globals: {
    // ✅ OK: Public config
    siteName: 'SoundCloud Clone',
    features: ['streaming', 'playlists']
    // ❌ NO: Secrets, env vars, internal URLs
  }
}
```

**Priority**: 🔥🔥 **HIGH** - Prevents security exploits

---

### **4. Server/Client Boundary** 🔥

**Risk**: template.json + policies sent to client → exposes internal structure

**Current Code**:
```tsx
// app/[[...slug]]/page.tsx
'use client'  // ❌ All JSON goes to browser!

import template from '@/templates/template.json'
import models from '@/templates/models.json'
import policies from '@/templates/policies.json'  // ❌ Exposed!

export default function Page() {
  return (
    <TemplateRuntime
      config={{ template, models, policies }}  // ❌ Sent to client!
      adapters={adapters}
    />
  )
}
```

**What Gets Exposed**:
- All model names
- All field names (including internal ones)
- Policy rules (attacker learns authorization logic)
- API structure

**Solution**: Server-Side Template Resolution

```tsx
// app/[[...slug]]/page.tsx (Server Component!)
import { TemplateRuntime } from '@ssot-ui/runtime'
import { getServerSession } from 'next-auth'
import { resolvePageTemplate } from '@/lib/template-resolver'

export default async function Page({ params }: { params: { slug?: string[] } }) {
  const session = await getServerSession()
  const path = params.slug ? `/${params.slug.join('/')}` : '/'
  
  // ✅ Server-side: Resolve template for this specific page
  const pageConfig = await resolvePageTemplate(path, session)
  
  if (!pageConfig) {
    notFound()
  }
  
  // ✅ Only send THIS PAGE's config to client (not entire template.json)
  return (
    <TemplateRuntime
      config={{
        page: pageConfig,  // ✅ Single page, not all pages
        models: pageConfig.models,  // ✅ Only models used by this page
        basePath: ''
      }}
      session={session}
    />
  )
}

// lib/template-resolver.ts (Server-only)
export async function resolvePageTemplate(
  path: string,
  session: Session | null
): Promise<ResolvedPageConfig | null> {
  const template = await loadTemplate()  // From filesystem
  const policies = await loadPolicies()  // From filesystem
  
  // Find matching page
  const page = template.pages.find(p => matchPath(p.path, path))
  if (!page) return null
  
  // Apply policy filtering (hide fields user can't see)
  const filteredPage = applyPolicyToPage(page, policies, session)
  
  // Extract only models used by this page
  const usedModels = extractUsedModels(filteredPage)
  
  return {
    ...filteredPage,
    models: usedModels
  }
}
```

**Benefits**:
- ✅ Client only sees ONE page's config
- ✅ Policy logic stays on server
- ✅ Can use RSC for server-side data fetching
- ✅ Smaller client bundles

**Priority**: 🔥 **MEDIUM** - Security through obscurity isn't real security, but reducing attack surface is valuable

---

### **5. Validation Layers** 🔥

**Risk**: Prisma constraints ≠ Business validation

**Example**:
```prisma
model User {
  email String @unique  // ✅ DB constraint
  name  String          // ❌ No length validation!
  age   Int             // ❌ No range validation!
}
```

**Client sends**:
```json
{
  "action": "create",
  "model": "User",
  "data": {
    "email": "test@example.com",
    "name": "A",  // ❌ Too short!
    "age": -5     // ❌ Invalid!
  }
}
```

**Solution**: Zod Validation from data-contract.json

```typescript
// NEW: packages/data-contract-validator/src/index.ts

import { z } from 'zod'
import dataContract from '@/templates/data-contract.json'

// Generate Zod schemas from data-contract.json
const schemas = generateZodSchemas(dataContract)

// Example generated schema:
const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().int().min(0).max(150),
  role: z.enum(['user', 'artist', 'admin']).default('user')
})

// Usage in API:
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, model, data } = body
  
  // Validate input
  const schema = schemas[`${model}${capitalizeFirst(action)}`]
  if (!schema) {
    return NextResponse.json({ error: 'Invalid model/action' }, { status: 400 })
  }
  
  const validation = schema.safeParse(data)
  if (!validation.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: validation.error.flatten()
    }, { status: 400 })
  }
  
  // Continue with validated data
  const validatedData = validation.data
  // ...
}
```

**data-contract.json** (extended with validation rules):
```json
{
  "models": {
    "User": {
      "fields": {
        "email": {
          "type": "string",
          "validation": {
            "format": "email",
            "required": true
          }
        },
        "name": {
          "type": "string",
          "validation": {
            "minLength": 2,
            "maxLength": 100,
            "required": true
          }
        },
        "age": {
          "type": "number",
          "validation": {
            "min": 0,
            "max": 150,
            "integer": true
          }
        }
      }
    }
  }
}
```

**Priority**: 🔥 **MEDIUM-HIGH** - Prevents bad data

---

## 🟡 HIGH PRIORITY (Required for v1)

### **6. Pagination & Query Budget**

**Solution**:
```typescript
const DEFAULT_TAKE = 50
const MAX_TAKE = 1000
const MAX_INCLUDE_DEPTH = 3

function validateQuery(query: any): void {
  // Limit pagination
  if (!query.pagination) {
    query.pagination = { take: DEFAULT_TAKE }
  }
  if (query.pagination.take > MAX_TAKE) {
    throw new Error(`Take cannot exceed ${MAX_TAKE}`)
  }
  
  // Limit include depth (prevent N+1)
  const includeDepth = calculateIncludeDepth(query.include)
  if (includeDepth > MAX_INCLUDE_DEPTH) {
    throw new Error(`Include depth cannot exceed ${MAX_INCLUDE_DEPTH}`)
  }
  
  // Whitelist orderBy fields
  const allowedOrderBy = getAllowedOrderByFields(query.model)
  if (query.orderBy && !allowedOrderBy.includes(query.orderBy.field)) {
    throw new Error(`Cannot order by '${query.orderBy.field}'`)
  }
}
```

---

### **7. Stripe Webhooks (Cannot Be JSON-Only)**

**Solution**: Dedicated webhook handler

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
  
  // Handle event (idempotency key stored in DB)
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object)
      break
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object)
      break
    // ... other events
  }
  
  return new Response(JSON.stringify({ received: true }), { status: 200 })
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // Check idempotency
  const existing = await prisma.payment.findUnique({
    where: { stripeId: paymentIntent.id }
  })
  if (existing) return  // Already processed
  
  // Create payment record + fulfill order
  await prisma.$transaction([
    prisma.payment.create({
      data: {
        stripeId: paymentIntent.id,
        amount: paymentIntent.amount,
        userId: paymentIntent.metadata.userId,
        status: 'succeeded'
      }
    }),
    prisma.order.update({
      where: { id: paymentIntent.metadata.orderId },
      data: { status: 'paid' }
    })
  ])
  
  // Queue fulfillment job
  await queue.add('fulfill-order', {
    orderId: paymentIntent.metadata.orderId
  })
}
```

**Priority**: 🟡 **REQUIRED** for payment apps

---

### **8. File Upload (Presigned URLs + Validation)**

**Solution**:

```typescript
// app/api/upload/presign/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getServerSession } from 'next-auth'
import policies from '@/templates/policies.json'

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { filename, contentType, field } = await request.json()
  
  // 1. Validate contentType
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac']
  if (!allowedTypes.includes(contentType)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 })
  }
  
  // 2. Check quota (from policy)
  const userQuota = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { uploadedBytes: true, storageQuota: true }
  })
  
  if (userQuota.uploadedBytes >= userQuota.storageQuota) {
    return Response.json({ error: 'Quota exceeded' }, { status: 403 })
  }
  
  // 3. Generate presigned URL
  const key = `uploads/${session.user.id}/${Date.now()}-${filename}`
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType
  })
  
  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 })
  
  return Response.json({ url, key })
}

// app/api/upload/complete/route.ts (called after client upload)
export async function POST(request: Request) {
  const { key, size } = await request.json()
  
  // 1. Verify file actually exists in S3
  const exists = await verifyS3Object(key)
  if (!exists) {
    return Response.json({ error: 'Upload failed' }, { status: 400 })
  }
  
  // 2. Optional: AV scan
  await queue.add('scan-file', { key })
  
  // 3. Update user quota
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      uploadedBytes: { increment: size }
    }
  })
  
  return Response.json({ success: true, url: getPublicUrl(key) })
}
```

**Priority**: 🟡 **REQUIRED** for upload apps

---

## 🟢 MEDIUM PRIORITY (Should Have)

### **9. Observability**

**Solution**: OpenTelemetry integration

```typescript
// lib/telemetry.ts
import { trace } from '@opentelemetry/api'

const tracer = trace.getTracer('ssot-app')

// Usage in API:
export async function POST(request: NextRequest) {
  return tracer.startActiveSpan('data-api', async (span) => {
    span.setAttribute('model', body.model)
    span.setAttribute('action', body.action)
    
    try {
      const result = await adapters.data.findMany(...)
      span.setStatus({ code: SpanStatusCode.OK })
      return NextResponse.json(result)
    } catch (error) {
      span.recordException(error)
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw error
    } finally {
      span.end()
    }
  })
}
```

---

### **10. Audit Logging**

**Solution**:

```typescript
// lib/audit-logger.ts
interface AuditLog {
  userId: string
  model: string
  action: string
  recordId?: string
  before?: any
  after?: any
  ip: string
  timestamp: Date
}

async function logAction(log: AuditLog) {
  await prisma.auditLog.create({ data: log })
}

// Usage:
await logAction({
  userId: session.user.id,
  model: 'Track',
  action: 'update',
  recordId: '123',
  before: oldData,
  after: newData,
  ip: request.ip,
  timestamp: new Date()
})
```

---

## 📋 Revised Implementation Plan

### **Phase 1.5: Security & Policy Foundation** (2-3 weeks)

**BEFORE Phase 2 (page renderers), we MUST build**:

1. **Policy Engine** (1 week)
   - Row-level security (RLS)
   - Field-level permissions
   - Role-based access control (RBAC)
   - policies.json schema + validator

2. **Expression Sandbox** (3-4 days)
   - Budget enforcement (depth, ops, timeout)
   - Operation whitelist
   - Dangerous path protection
   - Client vs server evaluation

3. **Validation Layer** (3-4 days)
   - Zod schema generation from data-contract.json
   - Server-side validation
   - Error mapping

4. **Schema Drift Protection** (2-3 days)
   - .schema-lock.json generation
   - CI validation
   - Template validator

5. **Pagination & Query Budget** (2 days)
   - Default/max take limits
   - Include depth limits
   - OrderBy whitelist

**Total**: ~2-3 weeks (10-15 days)

---

### **Phase 2: Core Page Renderers** (2-3 weeks)

**NOW we can safely integrate**:

1. DetailPageRenderer (with policy checks)
2. ListPageRenderer (with query budget)
3. FormPageRenderer (with validation)

---

### **Phase 3: Operational Requirements** (2-3 weeks)

1. Webhook handlers (Stripe, file processing)
2. File upload flow (presigned URLs, AV scanning)
3. Observability (OTel, logging)
4. Audit logging

---

## 🎯 Decision Required

**Option A: Fix Security Gaps First** (Recommended)
- Build Phase 1.5 (policy engine, sandbox, validation)
- THEN continue to Phase 2
- Longer timeline, but production-ready

**Option B: Continue with "Happy Path"**
- Build Phase 2 (page renderers)
- Add security later
- Faster demo, but NOT production-ready

**Option C: Hybrid Approach**
- Build basic policy engine in parallel with Phase 2
- Iterate on security as we go
- Medium timeline, incremental security

---

## My Recommendation

**Go with Option A**: Fix security gaps first.

**Why**:
1. Security cannot be "bolted on" later - it must be foundational
2. The policy engine affects every API call - integrating it later would require refactoring Phase 2 work
3. Expression sandbox is critical before we expose expressions in page renderers
4. Better to launch later with security than launch early with vulnerabilities

**Your call**: Which option?

