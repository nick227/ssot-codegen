# Template Factory V3 - Implementation Specification

**Version**: 3.0.0-final  
**Status**: Implementation-Ready  
**Target**: Zero project code, JSON as single source of truth

---

## 🚨 **TOP REDLINES** (Must Fix Before MVP)

### **1. Version Locking**

**Rule**: Lock `runtimeVersion` + `minTemplateVersion` across runtime and JSON files; reject mismatches.

**Implementation**:
```json
// Every JSON file includes:
{
  "$schema": "https://ssot-ui.dev/schemas/v3/template.json",
  "version": "1.0.0",
  "minRuntimeVersion": "3.0.0"
}
```

**Runtime validation**:
- Parse template version and minRuntimeVersion
- Compare against runtime's current version (semver)
- **Minor version mismatch**: Warning only
- **Major version mismatch**: Fail with upgrade instructions
- **Runtime too old**: Fail with "Runtime v3.2.0 required, found v3.0.0"

**Exit criteria**: Runtime refuses to load incompatible templates with clear upgrade path.

### **2. No Client-Supplied Ordering/Filters**

**Rule**: Server computes sort/pagination; whitelist filterable fields in data-contract.json.

**Implementation**:
```json
// data-contract.json
{
  "models": {
    "post": {
      "list": {
        "sortableFields": ["createdAt", "title", "publishedAt"],
        "filterableFields": {
          "status": { "op": ["eq", "in"], "enum": ["draft", "published"] },
          "authorId": { "op": ["eq"] }
        },
        "searchableFields": ["title", "content"]
      }
    }
  }
}
```

**Runtime behavior**:
- Client requests sort/filter via UI
- Runtime sends request to DataAdapter
- DataAdapter validates against whitelist
- **Invalid field**: Returns error, never queries database
- **Invalid operator**: Returns error
- Server constructs all SQL/GraphQL

**Exit criteria**: No direct client-supplied ordering reaches database; all validated server-side.

### **3. Adapter Boundaries**

**Rule**: Forbid direct framework imports in runtime core; all framework access must go through adapters.

**Implementation**:
```typescript
// ❌ FORBIDDEN in @ssot-ui/runtime:
import { useRouter } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Avatar } from '@/components/ui/avatar'

// ✅ REQUIRED:
import type { RouterAdapter } from './adapters/router'
import type { DataAdapter } from './adapters/data'
import type { UIAdapter } from './adapters/ui'

// Use only through adapter interfaces
const router = adapters.router
const data = await adapters.data.list('post', params)
const AvatarComponent = adapters.ui.Avatar
```

**Enforcement**:
- ESLint rule: `no-restricted-imports` in runtime package
- CI check: Fails if runtime imports from next/, prisma/, or component libraries
- Only adapter packages can import framework-specific code

**Exit criteria**: Runtime core has zero direct framework dependencies.

### **4. SSR/RSC Boundaries**

**Rule**: Every page in template.json must declare `runtime: "server" | "client" | "edge"`; validator blocks mixed usage.

**Implementation**:
```json
// template.json
{
  "pages": [
    {
      "type": "list",
      "path": "/posts",
      "runtime": "server",  // ← REQUIRED
      "model": "post"
    },
    {
      "type": "form",
      "path": "/posts/new",
      "runtime": "client",  // ← Forms must be client
      "model": "post"
    }
  ]
}
```

**Validation rules**:
- `runtime` field is REQUIRED (no default)
- Forms MUST be `"client"` (validator fails otherwise)
- Server pages CANNOT use client hooks (useEffect, useState)
- Client pages CANNOT use direct database access

**Runtime behavior**:
- Server pages: Auto-insert at top level (no "use client")
- Client pages: Auto-insert "use client" directive
- Edge pages: Lightweight, no Node.js APIs

**Exit criteria**: Every page has explicit runtime, validator enforces constraints.

### **5. HTML Sanitize Policy**

**Rule**: Required in capabilities.json for any `format: "html"`; runtime refuses to render without policy.

**Implementation**:
```json
// capabilities.json
{
  "sanitization": {
    "policies": {
      "strict": { "allowedTags": [], "allowedAttrs": {} },
      "basic": { 
        "allowedTags": ["b", "i", "p", "a", "ul", "ol", "li"],
        "allowedAttrs": { "a": ["href", "title"] }
      },
      "rich": {
        "allowedTags": ["h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "ul", "ol", "li", "img", "table", "code", "pre"],
        "allowedAttrs": { 
          "a": ["href", "title"],
          "img": ["src", "alt", "width", "height"]
        }
      }
    }
  }
}
```

```json
// template.json - page with HTML field
{
  "type": "detail",
  "displayFields": [
    { 
      "field": "content", 
      "format": "html",
      "sanitizePolicy": "rich"  // ← REQUIRED
    }
  ]
}
```

**Runtime behavior**:
- Validate sanitizePolicy exists in capabilities.json
- Pass HTML + policy to FormatAdapter.sanitizeHTML()
- **Missing policy**: Throw error, refuse to render
- Never render unsanitized HTML

**Exit criteria**: Runtime refuses to render HTML without explicit policy.

### **6. Error Model**

**Rule**: Standardize `{ code, message, details, retryAfter }` for adapters; renderer must not swallow unknown errors.

**Implementation**:
```typescript
// Standard error model
interface ErrorModel {
  code: string           // e.g., "UNAUTHORIZED", "NOT_FOUND", "RATE_LIMITED"
  message: string        // Human-readable message
  details?: unknown      // Additional context
  retryAfter?: number    // Seconds (for 429 errors)
}

// Adapter result type
type Result<T> = 
  | { ok: true; data: T }
  | { ok: false; error: ErrorModel }

// DataAdapter returns Result, never throws domain errors
interface DataAdapter {
  list<T>(model: string, params: ListParams): Promise<Result<ListResult<T>>>
  detail<T>(model: string, id: string): Promise<Result<T>>
  // ... etc
}
```

**Runtime behavior**:
- All adapter methods return `Result<T>`
- Transport errors (network) can throw
- Domain errors (not found, unauthorized) return `{ ok: false, error }`
- Runtime displays error UI based on `error.code`
- **Unknown error**: Display generic error + log full details
- **429 with retryAfter**: Show countdown + auto-retry

**Exit criteria**: All adapter errors follow standard model; runtime never swallows errors.

### **7. Access Control**

**Rule**: Guards declared in JSON only; no inline logic in adapters. Deny by default if AuthAdapter not present.

**Implementation**:
```json
// template.json
{
  "pages": [
    {
      "type": "list",
      "path": "/admin/posts",
      "guard": {
        "roles": ["admin", "editor"],
        "permissions": ["posts:write"]
      }
    }
  ]
}
```

**Runtime behavior**:
- Before rendering page, check `guard` in JSON
- Call `AuthAdapter.can(guard)` → boolean
- **No AuthAdapter**: Deny all guarded routes (fail-safe)
- **Unauthorized**: Redirect to `/login` via RouterAdapter
- Guards evaluated server-side (SSR) or client-side (CSR)
- **Never** execute custom JS guard logic from JSON

**Exit criteria**: All guards in JSON, deny-by-default enforced, no inline logic.

---

## 🔧 **GAPS TO CLOSE**

### **1. JSON Schema Versioning**

**Add**: `$schema` URLs + version per file; publish semver matrix in docs.

**Implementation**:
```json
{
  "$schema": "https://ssot-ui.dev/schemas/v3.0.0/template.json",
  "version": "1.0.0",
  "minRuntimeVersion": "3.0.0"
}
```

**Publish**: Semver compatibility matrix
```
Template v1.x → Runtime v3.0.x - v3.2.x ✅
Template v1.x → Runtime v4.x.x ❌ (breaking)
Template v2.x → Runtime v3.3.x+ ✅
```

### **2. Compute Without JS**

**Problem**: Need field transformations without JavaScript strings  
**Solution**: Tiny declarative expression DSL

**Implementation**:
```json
// Instead of: "compute": "firstName + ' ' + lastName"
// Use:
{
  "field": "fullName",
  "compute": {
    "op": "concat",
    "args": [
      { "field": "firstName" },
      { "literal": " " },
      { "field": "lastName" }
    ]
  }
}

// Supported operators:
// - concat: string concatenation
// - format: date/number/currency formatting
// - coalesce: first non-null value
// - case: if-then-else logic
```

**Exit criteria**: No JavaScript strings in JSON; all compute via declarative ops.

### **3. Layout System**

**Problem**: Custom layouts require TypeScript  
**Solution**: Declarative layout + slots in JSON

**Implementation**:
```json
{
  "type": "list",
  "layout": {
    "type": "split",
    "slots": {
      "header": { "component": "PageHeader" },
      "aside": { "component": "Filters" },
      "toolbar": { "component": "SearchBar" },
      "main": { "component": "PostsList" },
      "actions": { "component": "CreateButton" }
    }
  }
}
```

**Exit criteria**: Common layouts (split, tabs, wizard) declarable in JSON.

### **4. Conditional UI**

**Problem**: Show/hide logic requires TypeScript  
**Solution**: `visibleWhen` / `enabledWhen` with field predicates

**Implementation**:
```json
{
  "field": "publishButton",
  "visibleWhen": { "field": "status", "op": "eq", "value": "draft" },
  "enabledWhen": { "field": "title", "op": "exists" }
}

// Operators: eq, ne, in, gt, gte, lt, lte, exists, role
```

**Exit criteria**: Common conditional logic declarable without code.

### **5. i18n Plural Rules**

**Problem**: English-only plural logic  
**Solution**: Support ICU messages

**Implementation**:
```json
// i18n.json
{
  "pluralRules": "icu",
  "messages": {
    "en": {
      "items": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
    }
  }
}
```

**Exit criteria**: Full ICU message format support for all locales.

### **6. Theme Tokens - Dark Mode**

**Problem**: Only light mode tokens  
**Solution**: Include `modes` with token deltas

**Implementation**:
```json
// theme.json
{
  "modes": ["light", "dark"],
  "colors": {
    "primary": {
      "50": { "light": "#f0f9ff", "dark": "#0c1e2e" }
    }
  }
}
```

**Runtime**: Applies via CSS custom properties  
**Exit criteria**: Dark mode toggles tokens live, no page refresh.

### **7. Telemetry Off by Default**

**Problem**: Privacy-first default  
**Solution**: Explicit opt-in with schema'd events

**Implementation**:
```json
// capabilities.json
{
  "telemetry": {
    "enabled": false,  // Default: OFF
    "events": ["page_view", "error"],  // If enabled, whitelist events
    "scrub": ["email", "phone"]  // PII redaction
  }
}
```

**Exit criteria**: Telemetry off by default, explicit opt-in, PII scrubbed.

### **8. Testing Contracts**

**Problem**: No standard test fixtures  
**Solution**: Ship mock adapters + golden JSON

**Implementation**:
```typescript
// @ssot-ui/test-utils
export const mockDataAdapter: DataAdapter = {
  list: async () => ({ ok: true, data: { items: [], total: 0 } }),
  // ... etc
}

// Golden fixtures
export const goldenTemplates = {
  blog: require('./fixtures/blog.json'),
  admin: require('./fixtures/admin.json')
}
```

**CI**: Run renderer against golden fixtures headless, snapshot compare  
**Exit criteria**: Mock adapters + golden fixtures in CI.

---

## 🎯 **RUNTIME RENDERER INVARIANTS**

### **1. Zero Project Code**

**Invariant**: Mount `<TemplateRuntime configUrl />`, no generated pages/components required.

**Enforcement**:
- Runtime package contains ALL rendering logic
- Projects provide: JSON + adapters only
- No code generation by default
- Optional codegen for debugging only

### **2. Strict Mode**

**Invariant**: Renderer fails fast on unknown page type/prop; shows developer overlay with exact JSON path.

**Implementation**:
- Zod validation on all JSON
- Unknown keys trigger errors
- Dev overlay shows:
  - JSON path to error
  - Expected schema
  - Suggestions

### **3. Client Boundaries**

**Invariant**: Auto-insert "use client" only at component edges that need hooks.

**Implementation**:
- Server components by default
- Client directive ONLY when:
  - Page has `runtime: "client"`
  - Component uses hooks (forms, interactive)
- Never blanket "use client" on entire app

### **4. SEO**

**Invariant**: Inject metadata from JSON; no ad-hoc per-page TS needed.

**Implementation**:
```json
{
  "type": "detail",
  "seo": {
    "title": "{{post.title}}",
    "description": "{{post.excerpt}}",
    "og:image": "{{post.coverImage}}"
  }
}
```

Runtime generates Next.js `metadata` export automatically.

### **5. A11y Defaults**

**Invariant**: DataTable keyboard nav, Form ARIA, live region singleton, reduced-motion support.

**Implementation**:
- DataTable: Arrow keys, tab order, focus states
- Form: Labels, ARIA descriptions, error announcements
- Live region: Single `<div role="status">` for toasts/announcements
- Reduced motion: Respects `prefers-reduced-motion`

---

## 📜 **ADAPTER CONTRACTS** (Non-Negotiable)

### **DataAdapter**

**Returns**: Typed `Result<T, ErrorModel>`  
**Supports**: `abortSignal` for cancellation  
**Never throws**: Domain errors (only transport errors)

```typescript
interface DataAdapter {
  list<T>(
    model: string, 
    params: ListParams, 
    signal?: AbortSignal
  ): Promise<Result<ListResult<T>>>
}
```

### **UIAdapter**

**Pure presentational API**: Receives tokenized styles  
**Must not import**: router/auth/data  
**Only renders**: What it's given

```typescript
interface UIAdapter {
  Avatar: React.FC<{ src: string; alt: string; size: keyof Tokens['spacing'] }>
  // No imports from next/router, @/lib/auth, etc.
}
```

### **AuthAdapter**

**Synchronous check**: `can(guard) → boolean | Promise<boolean>`  
**Renderer short-circuits**: Unauthorized views never render

```typescript
interface AuthAdapter {
  can(guard: Guard): boolean | Promise<boolean>
  getCurrentUser(): Promise<User | null>
  redirectToLogin(): void
}
```

### **RouterAdapter**

**Declarative links only**: No imperative navigate in JSON  
**Imperative navigate**: Returns `Result<void, ErrorModel>`

```typescript
interface RouterAdapter {
  Link: React.FC<{ href: string; children: React.ReactNode }>
  navigate(path: string): Promise<Result<void, ErrorModel>>
}
```

### **FormatAdapter**

**Deterministic**: Same input → same output  
**HTML sanitize**: Pure function with policy param  
**No side effects**: Never mutates input

```typescript
interface FormatAdapter {
  formatDate(date: Date, format: string, locale: string): string
  sanitizeHTML(html: string, policy: SanitizePolicy): string  // Pure!
}
```

---

## ⚡ **PERFORMANCE & CACHING**

### **1. SSR Caching Policy**

```json
{
  "type": "list",
  "cache": {
    "revalidate": 60  // ISR: regenerate every 60s
  }
}

{
  "type": "detail",
  "cache": {
    "revalidate": false  // Static: never revalidate
  }
}
```

**Default**: List pages = 60s, Detail pages = static

### **2. Client Cache**

**Plug via DataAdapter options**:
```typescript
const dataAdapter = new PrismaDataAdapter(prisma, {
  cache: 'swr',  // or 'react-query'
  staleWhileRevalidate: true,
  dedupWindow: 2000  // 2s
})
```

### **3. Bundle Control**

**Ship runtime in chunks**:
- `@ssot-ui/runtime/core` (20kb)
- `@ssot-ui/runtime/list` (15kb lazy)
- `@ssot-ui/runtime/detail` (10kb lazy)
- `@ssot-ui/runtime/form` (25kb lazy)

**Tree-shake unused adapters**: Only import what's used

### **4. Virtualization**

**Opt-in for large lists**:
```json
{
  "type": "list",
  "virtualize": true,
  "estimatedRowHeight": 80
}
```

**Auto-enables** when `items.length > 1000`

---

## 🛠️ **DX & TOOLING**

### **1. Schemas Package**

```bash
npm install @ssot-ui/schemas
```

**Exports**: JSON Schema for IDE autocomplete  
**Usage**: Point `$schema` in JSON to published schema URL

### **2. CLI**

```bash
# Validate all JSON files
npx ssot-ui validate ./templates

# Show resolved plan
npx ssot-ui plan ./templates --out plan.json

# Dev server with hot reload
npx ssot-ui serve ./templates
```

### **3. Dev Overlay**

**Shows**:
- Guard decisions (who, what, why)
- Data shapes (models, fields, relations)
- Render timings per page
- JSON → Component mapping

**Toggle**: `Shift+Cmd+D` in dev mode

---

## 🔄 **MIGRATION PLAN TWEAKS**

### **1. V2 as Export Layer**

Keep V2 codegen as optional export behind same plan:
```bash
npx ssot-ui export ./templates --use-v2-codegen
```

**Mark deprecated** in docs, sunset in 6 months.

### **2. V2 → V3 Converter**

```bash
npx ssot-ui migrate-v2 ./templates/blog.ts --out ./templates/blog.json
```

**Infers**:
- Model mappings from config
- Field mappings from usage
- Runtime from page types

### **3. Dual-Run Canary**

**Staging test**:
- Render `/posts` via runtime
- Render `/posts` via codegen
- Compare DOM snapshots
- Alert on differences

---

## 🔒 **SECURITY & COMPLIANCE**

### **1. Field-Level ACL**

```json
// data-contract.json
{
  "models": {
    "user": {
      "fields": {
        "email": { "readRoles": ["admin"] },
        "password": { "readRoles": [] }  // Never readable
      }
    }
  }
}
```

**DataAdapter**: Filters hidden fields server-side  
**Renderer**: Never receives them

### **2. Rate Limiting**

**Adapters expose 429**:
```typescript
{
  ok: false,
  error: {
    code: "RATE_LIMITED",
    message: "Too many requests",
    retryAfter: 60
  }
}
```

**Renderer**: Backs off, surfaces toast with countdown

### **3. PII Redaction**

```json
// capabilities.json
{
  "redact": ["email", "phone"]
}
```

**Renderer**: Masks in UI by default (`j***@example.com`)

---

## ✅ **MVP ACCEPTANCE CHECKLIST**

- [ ] **JSON validation**: All 7 contracts, path-specific errors, semver enforcement
- [ ] **Pages**: List/detail/form fully functional via runtime only
- [ ] **Guards**: Deny-by-default works, unauthorized routes redirect
- [ ] **SEO/i18n/theme**: Applied from JSON, dark mode toggles live
- [ ] **Data**: List pagination + sorting + filtering from whitelists
- [ ] **A11y**: List keyboard nav, form screen-reader labels, live region
- [ ] **Perf**: List of 100 items <16.7ms frame, SSR TTFB within baseline
- [ ] **Tests**: Golden fixtures + mock adapters, snapshot compare, error paths covered

---

## 🚀 **CONCRETE NEXT STEPS** (Do Now)

### **Week 1**

1. ✅ **Publish `@ssot-ui/schemas`**
   - 7 Zod schemas with discriminated unions
   - Export JSON Schema for IDE autocomplete
   - Add CLI validator

2. ✅ **Implement `@ssot-ui/loader`**
   - Validate step (Zod + version checks)
   - Normalize step (aliases, defaults, deep paths)
   - Plan step (routes, data, guards)
   - Diagnostic output

### **Week 2**

3. ✅ **Ship minimal runtime**
   - Next Router adapter (list/detail only)
   - shadcn UI adapter (table, card, layout)
   - Mock auth adapter (always allow)
   - Prisma data adapter

4. ✅ **Add mock adapters + golden fixtures**
   - Mock data/ui/auth/router adapters
   - 3 golden templates (blog, admin, simple)
   - CI runs renderer against fixtures headless

### **Week 3**

5. ✅ **Write V2→V3 converter**
   - Reads V2 TypeScript config
   - Infers mappings from usage
   - Outputs V3 JSON

6. ✅ **Example migration (blog)**
   - Convert blog template V2 → V3
   - Document process
   - Measure: code reduction, migration time

---

## 📝 **FINAL SUMMARY**

**This specification delivers**:

✅ **Zero project code**: JSON + adapters only  
✅ **Single source of truth**: All config in portable JSON  
✅ **Safe by default**: Version locks, sanitization, guards, deny-by-default  
✅ **Fast**: SSR caching, client caching, virtualization, tree-shaking  
✅ **Portable**: True vendor agnosticism via adapters  
✅ **Testable**: Mock adapters + golden fixtures in CI  

**Status**: ✅ **Production-ready specification, locked and ready for implementation**

**Next**: Begin Week 1 implementation 🚀

