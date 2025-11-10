# Template Factory V3 - Implementation Contract

**Version**: 3.0.0-final-locked  
**Status**: Ready to code from  
**Goal**: Zero project code, JSON as single source of truth

---

## 🚨 **REDLINES** (Fix Before You Write Code)

### 1. Version Handshake
Every JSON has `version`; runtime requires `runtimeVersion` range. **Hard-fail on mismatch.**

```json
{ "version": "1.0.0", "runtimeVersion": "^3.0.0" }
```

### 2. Adapter Firewall
Core runtime imports **no framework libs**. All env specifics go through adapters.

```typescript
// ❌ FORBIDDEN in @ssot-ui/runtime
import { useRouter } from 'next/navigation'

// ✅ REQUIRED
import { RouterAdapter } from './adapters'
```

### 3. Server-Owned Ordering/Filtering
Clients send intent; server computes sort/pagination. Whitelist fields in `data-contract.json`.

```json
{
  "models": {
    "post": {
      "list": {
        "filterable": ["status", "authorId"],
        "sortable": ["createdAt", "title"]
      }
    }
  }
}
```

### 4. HTML Policy Required
Refuse `format: "html"` without `sanitize.policy` in `capabilities.json`.

```json
{
  "sanitize": {
    "policy": "basic" | "strict" | "rich" | "custom"
  }
}
```

### 5. Runtime Flags
Each page declares `runtime: "server" | "client" | "edge"`. Validator blocks mixed/hybrid misuse.

```json
{
  "type": "form",
  "runtime": "client"  // ← REQUIRED, forms must be client
}
```

### 6. Error Contract
Adapters return `Result<T, {code, message, details?, retryAfter?}>`. Renderer never swallows unknowns.

```typescript
type Result<T> = 
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown; retryAfter?: number } }
```

---

## 🔧 **GAPS TO CLOSE**

### 1. Expr DSL (No JS-in-JSON)
Tiny declarative ops set for computed fields.

```json
{
  "expr": ["concat", ["field", "user.first"], " ", ["field", "user.last"]]
}
```

**Ops**: `concat`, `format`, `coalesce`, `case`, `lookup`, `slice`, `upper`, `lower`

### 2. Conditional UI
`visibleWhen` / `enabledWhen` with predicates.

```json
{
  "field": "publishButton",
  "visibleWhen": { "field": "status", "op": "eq", "value": "draft" }
}
```

**Ops**: `eq`, `ne`, `in`, `exists`, `roleAny`

### 3. Layouts & Slots
Page layout with named slots.

```json
{
  "layout": {
    "type": "standard",
    "slots": ["toolbar", "content", "aside"]
  }
}
```

### 4. Theme Modes
Dark mode with token deltas.

```json
{
  "modes": ["light", "dark"],
  "colors": {
    "primary": { "light": "#0066cc", "dark": "#66b3ff" }
  }
}
```

### 5. Telemetry Off by Default
Explicit opt-in, events schema'd and scrubbed.

```json
{
  "telemetry": {
    "enabled": false  // Default
  }
}
```

---

## 📦 **MVP CUT** (What to Support First)

### Pages
- List
- Detail
- Form

### Core JSON
1. `template.json`
2. `models.json` (auto-generated)
3. `mappings.json`
4. `data-contract.json`
5. `capabilities.json` (sanitize policy)
6. `theme.json` (tokens)
7. `i18n.json` (basic messages)

### Adapters
- **DataAdapter**: Prisma
- **UIAdapter**: shadcn
- **RouterAdapter**: Next.js
- **AuthAdapter**: NextAuth
- **FormatAdapter**: Intl + DOMPurify

### Features
- Pagination (cursor)
- Basic filters/sorts (whitelisted)
- Relations include
- Guards (roles)
- SEO (title/canonical)
- Light/dark tokens

---

## 📋 **MINIMAL SCHEMAS**

### template.json

```typescript
{
  version: string                    // "1.0.0"
  runtimeVersion: string             // "^3.0.0"
  pages: Array<
    | ListPage
    | DetailPage
    | FormPage
  >
}

interface ListPage {
  type: "list"
  route: string                      // "/posts"
  runtime: "server" | "client"
  model: string
  relations?: string[]
  filters?: FilterDef[]
  sort?: SortDef[]
  pagination?: PaginationDef
  seo?: SEODef
  layout?: LayoutDef
  visibleWhen?: PredicateDef
}

interface DetailPage {
  type: "detail"
  route: string                      // "/posts/:slug"
  runtime: "server" | "client"
  model: string
  idParam?: string                   // "slug"
  relations?: string[]
  fields: FieldDef[]
  seo?: SEODef
  layout?: LayoutDef
  visibleWhen?: PredicateDef
}

interface FormPage {
  type: "form"
  route: string                      // "/posts/new"
  runtime: "client"                  // Always client
  model: string
  mode: "create" | "edit"
  fields: FormFieldDef[]
  success?: { redirect: string }
  layout?: LayoutDef
  visibleWhen?: PredicateDef
}
```

### data-contract.json

```typescript
{
  models: {
    [modelName: string]: {
      list: {
        pagination: {
          type: "cursor"
          maxPageSize: number        // 100
        }
        filterable: string[]         // ["status", "authorId"]
        sortable: string[]           // ["createdAt", "title"]
        defaultSort: Array<{ field: string; dir: "asc" | "desc" }>
      }
      mutations: {
        create: boolean
        update: boolean
        delete: boolean
      }
    }
  }
}
```

### capabilities.json

```typescript
{
  ui: string[]                       // ["Avatar", "Badge", "DataTable", "Form"]
  sanitize: {
    policy: "basic" | "strict" | "rich" | "custom"
  }
  security: {
    enforceGuards: boolean           // true
  }
}
```

---

## 🎯 **RUNTIME INVARIANTS**

1. **Fast-fail validator** with path-specific errors + suggestions from `mappings.json`

2. **Auto client boundary** only when needed (forms/widgets). Everything else server by default.

3. **Guard first, fetch second**: Auth checks before data calls.

4. **A11y baked-in**: Roles, focus mgmt, live region singleton, reduced-motion.

5. **Hot reload**: JSON file changes → invalidate loader cache → replan → rerender.

---

## ⚡ **PERFORMANCE BUDGETS**

### SSR
- Default `revalidate: 60` for lists
- Detail can be `force-dynamic` or ISR

### Client
- List of 100 rows **< 16.7ms/frame**
- Virtualize opt-in via `list.virtualize: true` + `estimatedRowHeight`

### Bundle
- Core runtime **≤ 100-120kb gzipped**
- Adapters tree-shake

---

## ✅ **ACCEPTANCE CHECKLIST** (MVP)

- [ ] **Validator**: All 7 JSON types, semver gate, discriminated unions, deep-path checks
- [ ] **Pages**: List/detail/form render from JSON only (no generated files)
- [ ] **Data**: Cursor pagination + sorted/filtered queries from whitelist only
- [ ] **Guards**: Deny-by-default; unauthorized routes redirect via AuthAdapter
- [ ] **HTML**: Sanitized per capabilities.json; refuses if policy missing
- [ ] **SEO/i18n/theme**: Applied from JSON; dark mode tokens live
- [ ] **Tests**: Golden JSON fixtures + mock adapters; snapshot DOM; adapter error paths; RSC/client boundary tests

---

## 🛠️ **CLI YOU ACTUALLY NEED**

```bash
# Validate all JSON files
ssot validate <dir>
# Output: Path-based errors + suggestions

# Show resolved plan
ssot plan <dir> --out plan.json
# Output: Resolved routes/data/guards

# Dev server with hot reload
ssot serve <dir>
# Output: Dev server + hot JSON reload + diagnostics overlay
```

---

## 🎨 **FINAL POLISH** (Nice, Not Blocking)

- **Converter**: V2 TS → V3 JSON (infer mappings, normalize fields)
- **Marketplace**: Publish `@ssot-templates/*` as plain JSON packages
- **Mock adapters**: For tests/demos; zero external deps
- **Dev overlay**: Show guard decisions, data shapes, render timings

---

## 🚀 **DO-THIS-NOW LIST**

### 1. Ship `@ssot-ui/schemas`
- Zod schemas for all 7 JSON types
- JSON Schema exports for IDE autocomplete
- `validate` / `plan` / `serve` CLI

### 2. Build `@ssot-ui/loader`
- Validate step (Zod + version checks)
- Normalize step (aliases, defaults, deep paths)
- Plan step (routes, data, guards)
- Diagnostics & suggestions

### 3. Implement Runtime
- Next Router adapter (list/detail)
- shadcn UI adapter (table, card, form)
- Add forms

### 4. Lock Contracts
- Error contract (`Result<T>`)
- Sanitize policy enforcement

### 5. Add Testing
- Golden fixtures
- Mock adapters
- Wire to CI

---

## 📝 **FINAL CONTRACT**

This keeps:
- ✅ Business logic in JSON
- ✅ Adapter boundaries enforced
- ✅ "Write once, reuse everywhere"
- ✅ Zero project code exposure

**Status**: ✅ **Locked. Ready to implement.**

**Next**: Begin Week 1 🚀

