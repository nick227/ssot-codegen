# @ssot-ui/adapters

**Vendor-agnostic adapter interfaces for SSOT UI runtime.**

Version: 3.0.0

---

## 📦 **Installation**

```bash
npm install @ssot-ui/adapters
```

---

## 🎯 **Purpose**

Provides 5 core adapter interfaces that decouple templates from specific implementations:

1. **DataAdapter** - Database abstraction (Prisma, Supabase, tRPC, GraphQL, REST)
2. **UIAdapter** - Component library abstraction (shadcn, MUI, Chakra, Radix)
3. **AuthAdapter** - Authentication abstraction (NextAuth, Clerk, Supabase, Auth0)
4. **RouterAdapter** - Routing abstraction (Next.js, Remix, TanStack, React Router)
5. **FormatAdapter** - i18n and sanitization abstraction

**Key principle**: Templates use adapters, never direct framework imports.

---

## 🔌 **Adapter Contracts**

### **DataAdapter**

**REDLINE**: All data operations through this interface only.

```typescript
interface DataAdapter {
  list<T>(model: string, params: ListParams): Promise<Result<ListResult<T>>>
  detail<T>(model: string, id: string, options?): Promise<Result<T>>
  create<T>(model: string, data, options?): Promise<Result<T>>
  update<T>(model: string, id, data, options?): Promise<Result<T>>
  delete(model: string, id, options?): Promise<Result<void>>
  search<T>(model: string, params): Promise<Result<ListResult<T>>>
}
```

**Contract**:
- Returns `Result<T, ErrorModel>` (never throws domain errors)
- Supports `AbortSignal` for cancellation
- Filters hidden fields server-side (field-level ACL)
- Validates against whitelists (filterable/sortable from data-contract.json)

### **UIAdapter**

**REDLINE**: Pure presentational, no router/auth/data imports.

```typescript
interface UIAdapter {
  Avatar: ComponentType<AvatarProps>
  Badge: ComponentType<BadgeProps>
  Button: ComponentType<ButtonProps>
  Card: ComponentType<CardProps>
  Input: ComponentType<InputProps>
  Select: ComponentType<SelectProps>
  Checkbox: ComponentType<CheckboxProps>
  Textarea: ComponentType<TextareaProps>
  DataTable: ComponentType<DataTableProps>
  Form: ComponentType<FormProps>
  Modal: ComponentType<ModalProps>
  Toast: ComponentType<ToastProps>
  Skeleton: ComponentType<SkeletonProps>
  Spinner: ComponentType<SpinnerProps>
}
```

**Contract**:
- Receives tokenized styles from theme.json
- Components are pure (no side effects)
- Must not import router/auth/data modules

### **AuthAdapter**

**REDLINE**: Guards in JSON only, deny-by-default.

```typescript
interface AuthAdapter {
  can(guard: Guard): boolean | Promise<boolean>
  getCurrentUser(): Promise<User | null>
  redirectToLogin(returnUrl?): void
  hasRole(role: string): boolean | Promise<boolean>
  hasPermission(permission: string): boolean | Promise<boolean>
}
```

**Contract**:
- `can()` short-circuits unauthorized views
- No AuthAdapter = deny all guarded routes
- No inline logic from JSON

### **RouterAdapter**

**REDLINE**: Declarative links in JSON, navigate returns Result.

```typescript
interface RouterAdapter {
  Link: ComponentType<LinkProps>
  useParams(): RouteParams
  useSearchParams(): SearchParams
  useNavigate(): (path, options?) => Promise<Result<void>>
  redirect(path, statusCode?): void
  usePathname(): string
  isActive(path): boolean
}
```

**Contract**:
- Declarative `Link` component
- Imperative `navigate()` returns `Result<void>`
- Framework-agnostic

### **FormatAdapter**

**REDLINE**: Deterministic, pure sanitization.

```typescript
interface FormatAdapter {
  formatDate(date, format, locale?): string
  formatNumber(value, options?): string
  formatCurrency(amount, currency, locale?): string
  sanitizeHTML(html, policy): string  // PURE FUNCTION
  truncate(text, length, suffix?): string
  formatRelative(date, locale?): string
  pluralize(count, singular, plural, locale?): string
}
```

**Contract**:
- Deterministic (same input → same output)
- HTML sanitize uses policy from capabilities.json
- No side effects

---

## 🚨 **Adapter Firewall** (REDLINE)

**Runtime core MUST NOT import**:
- ❌ `next/navigation`
- ❌ `@prisma/client`
- ❌ `@/components/ui/*`
- ❌ `next-auth`
- ❌ Any framework-specific code

**All framework access via adapters** ✅

**Enforced by**: ESLint rule in runtime package

---

## 📦 **Error Model** (Standardized)

All adapters use:

```typescript
interface ErrorModel {
  code: string          // "UNAUTHORIZED", "NOT_FOUND", "RATE_LIMITED"
  message: string       // Human-readable
  details?: unknown     // Additional context
  retryAfter?: number   // Seconds (for 429)
}

type Result<T> = 
  | { ok: true; data: T }
  | { ok: false; error: ErrorModel }
```

**Renderer behavior**:
- `ok: true` → Render data
- `ok: false` → Show error UI based on `code`
- `retryAfter` → Auto-retry with countdown
- Unknown errors → Display generic error + log

---

## 🔧 **Helper Functions**

### **Data Helpers**

```typescript
import { validateFilter, validateSort } from '@ssot-ui/adapters/data'

const isValid = validateFilter(filter, whitelist)
const canSort = validateSort(sort, whitelist)
```

### **Auth Helpers**

```typescript
import { checkGuard, getUserRoles } from '@ssot-ui/adapters/auth'

const allowed = checkGuard(user, guard)
const roles = getUserRoles(user)
```

### **Router Helpers**

```typescript
import { buildRoute, parseRouteParams, matchesRoute } from '@ssot-ui/adapters/router'

const path = buildRoute('/posts/[id]', { id: '123' }) // → '/posts/123'
const params = parseRouteParams('/posts/[id]/comments/[commentId]') // → ['id', 'commentId']
```

### **Format Helpers**

```typescript
import { getSanitizePolicy, parseDate } from '@ssot-ui/adapters/format'

const policy = getSanitizePolicy('rich')
const date = parseDate('2025-01-01T00:00:00Z')
```

---

## 📚 **Implementation Packages** (Coming Soon)

Reference implementations:

- `@ssot-ui/adapter-data-prisma` - Prisma data adapter
- `@ssot-ui/adapter-ui-shadcn` - shadcn/ui adapter  
- `@ssot-ui/adapter-auth-nextauth` - NextAuth adapter
- `@ssot-ui/adapter-router-next` - Next.js router adapter
- `@ssot-ui/adapter-format-intl` - Intl + DOMPurify adapter

---

## 🎯 **Usage** (When Implementations Exist)

```typescript
import type { DataAdapter, UIAdapter, AuthAdapter } from '@ssot-ui/adapters'
import { PrismaDataAdapter } from '@ssot-ui/adapter-data-prisma'
import { ShadcnUIAdapter } from '@ssot-ui/adapter-ui-shadcn'
import { NextAuthAdapter } from '@ssot-ui/adapter-auth-nextauth'

const adapters = {
  data: new PrismaDataAdapter(prisma),
  ui: new ShadcnUIAdapter(),
  auth: new NextAuthAdapter()
}

// Pass to runtime
<TemplateRuntime config={json} adapters={adapters} />
```

---

## 📄 **License**

MIT

