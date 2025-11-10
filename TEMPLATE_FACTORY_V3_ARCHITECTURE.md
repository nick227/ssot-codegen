# ✅ Template Factory V3 - JSON-First Architecture Complete

**Status**: Architecture designed, documented, ready for implementation  
**Paradigm**: Runtime rendering from JSON (not code generation)  
**Code Reduction**: 99% (JSON only, zero generated code)

---

## 🎯 **WHAT CHANGED**

### **From V2 → V3**

**V2 Approach** (Declarative code generation):
- TypeScript config → Factory → Generated TypeScript files
- 85% code reduction vs imperative
- Still generates/maintains files
- Next.js coupled

**V3 Approach** (JSON runtime rendering):
- JSON config → Runtime renderer → Live rendering
- 99% code reduction (no code at all!)
- Zero generated files
- Fully vendor-agnostic

### **The Core Insight**

**Question**: Why generate unique code for every template when most web apps are variations of the same patterns?

**Answer**: Runtime renderer that reads JSON configuration, exactly like how:
- Prisma reads schema.prisma and provides DB access
- Storybook reads .stories files and renders components
- Jest reads jest.config and runs tests

**Templates become data, not code.**

---

## 📋 **THE ARCHITECTURE**

### **1. JSON Contracts** (7 Files - Single Source of Truth)

| File | Purpose | Owned By | Generated? |
|------|---------|----------|------------|
| **template.json** | UI structure (pages, components, routes) | Product/UX | Manual |
| **models.json** | Schema surface (entities, fields, relations) | Backend | Auto |
| **mappings.json** | Field aliases (template → schema) | Integration | Manual |
| **capabilities.json** | Available features (UI, data, security) | Platform | Manual |
| **data-contract.json** | Query/mutation signatures | API | Manual |
| **theme.json** | Design tokens | Design | Manual |
| **i18n.json** | Translations per locale | L10n | Manual |

**Separation of concerns**: Each file has one responsibility, versioned independently.

### **2. Loader Pipeline** (Validate → Normalize → Plan)

**Step 1: Validation**
- Zod schema validation on all JSON
- Discriminated unions for page types (list/detail/form/custom)
- Version compatibility checks
- Path-specific error messages with fuzzy-match suggestions

**Step 2: Normalization**
- Resolve model/field aliases from mappings.json
- Apply defaults (pagination, runtime, SEO)
- Validate deep paths (post.author.name)
- Type-check field compatibility

**Step 3: Planning**
- Derive routes from page definitions
- Aggregate data requirements (minimize N+1)
- Insert guards at route boundaries
- Plan rendering order (RSC → client boundaries)

### **3. Adapter Layer** (Vendor Agnostic)

**DataAdapter**: Database abstraction
- Implementations: Prisma, Supabase, tRPC, GraphQL, REST
- Operations: list, detail, create, update, delete, search
- Handles relation hydration, pagination, filtering

**UIAdapter**: Component library abstraction
- Implementations: shadcn/ui, MUI, Chakra, Radix
- Components: Avatar, Badge, Button, Card, DataTable, Form, Modal
- Applies theme.json tokens to target library

**AuthAdapter**: Authentication abstraction
- Implementations: NextAuth, Clerk, Supabase, Auth0
- Operations: checkRole, checkPermission, getCurrentUser, redirectToLogin

**RouterAdapter**: Routing abstraction
- Implementations: Next.js, Remix, TanStack Router, React Router
- Operations: Link component, useParams, useNavigate, redirect

**FormatAdapter**: i18n and sanitization
- Operations: formatDate, formatNumber, formatCurrency, sanitizeHTML
- Consumes i18n.json for locale-specific rules
- Uses DOMPurify with policies from capabilities.json

### **4. Runtime Renderer** (Zero Code Generation)

**What it is**: Prebuilt React component package (`@ssot-ui/runtime`)

**What it does**:
- Reads JSON configuration (static or fetched)
- Routes requests to appropriate page renderer
- Calls DataAdapter for data operations
- Renders using UIAdapter components
- Enforces guards via AuthAdapter
- Handles RSC/client boundaries automatically
- Provides accessibility, pagination, sorting, filters, search

**Integration**: Single mount point in catch-all route (`[[...slug]]/page.tsx`)

**Project structure**:
```
my-app/
├── templates/          ← All JSON
│   ├── blog.json
│   ├── mappings.json
│   └── theme.json
├── app/
│   └── [[...slug]]/    ← Single file
│       └── page.tsx    ← Mounts TemplateRuntime
└── adapters/           ← Adapter config
    ├── data.ts
    └── ui.ts
```

**Hot reload**: JSON changes = instant updates (no rebuild)

### **5. Optional Codegen** (Export Layer)

**When needed**:
- Debugging (files easier than runtime)
- Customization (prefer TypeScript edits)
- Platform constraints (requires files)
- Performance (pre-generated faster for huge apps)

**Features**:
- Idempotent writes (MD5 hashing)
- Safe modes (skip/overwrite/merge/prompt)
- Automatic backups
- Dry-run and diff reports
- Format enforcement (Prettier/ESLint)
- Import deduplication
- RSC boundary awareness
- Generates loading/error boundaries

**CLI**: `npx ssot-ui export blog.json --output src/app --dry-run`

---

## 📊 **BENEFITS QUANTIFIED**

### **Code Exposure**

| Metric | V1 | V2 | V3 |
|--------|----|----|-----|
| Lines per template | 700-1,200 | 100-150 | 0 (JSON) |
| Files to maintain | 10-20 | 10-20 | 0 (runtime) |
| Merge conflicts | High | Medium | None |
| Build time | 30-60s | 30-60s | 0s (runtime) |

### **Development Workflow**

| Task | V1 | V2 | V3 |
|------|----|----|-----|
| Add new page | Write generator → Generate → Compile → Test (10 min) | Update config → Generate → Test (5 min) | Edit JSON → Hot reload (30s) |
| Change layout | Modify generator → Regenerate → Fix conflicts (15 min) | Update config → Regenerate (5 min) | Edit JSON → Instant (10s) |
| Update theme | Find/replace in generated files (20 min) | Regenerate with new theme (5 min) | Edit theme.json → Instant (10s) |

### **Team Productivity**

| Role | V1 | V2 | V3 |
|------|----|----|-----|
| Product Manager | Can't touch (needs dev) | Can't touch (needs dev) | ✅ Edits template.json |
| Designer | Can't touch (needs dev) | Can't touch (needs dev) | ✅ Edits theme.json |
| L10n Team | Find/replace in files | Find/replace in files | ✅ Edits i18n.json |
| Developer | Writes/maintains generators | Writes config, maintains files | ✅ Configures adapters |

### **Vendor Lock-In**

| Aspect | V1 | V2 | V3 |
|--------|----|----|-----|
| UI Framework | React only | React only | Any (via UIAdapter) |
| Router | Next.js only | Next.js only | Any (via RouterAdapter) |
| Database | Prisma only | Prisma only | Any (via DataAdapter) |
| Auth | Hardcoded | Hardcoded | Any (via AuthAdapter) |
| **Migration effort** | Complete rewrite | Partial rewrite | Swap adapter (1 day) |

---

## 🛡️ **GUARDRAILS**

### **Security**

1. **HTML Sanitization**: All `format: "html"` goes through DOMPurify with policies from capabilities.json
2. **No Client Ordering**: Server controls sort/pagination to prevent enumeration attacks
3. **Cursor Pagination**: Opaque cursors prevent offset manipulation
4. **Field Permissions**: DataAdapter enforces read/write per field
5. **Route Guards**: AuthAdapter checks roles/permissions before render

### **Accessibility**

1. **ARIA Patterns**: All interactive elements have proper roles/labels
2. **Keyboard Navigation**: Tab order, focus management, shortcuts
3. **Screen Readers**: Live regions for dynamic updates
4. **Color Contrast**: WCAG AA validation
5. **Reduced Motion**: Respects user preference

### **Performance**

1. **N+1 Prevention**: DataAdapter aggregates includes
2. **Cursor Pagination**: Efficient for large datasets
3. **Virtualization**: Auto-enabled for 1000+ items
4. **Memoization**: Component subtrees memoized
5. **Code Splitting**: Lazy-load admin/heavy features

### **Validation**

1. **Schema Validation**: Zod schemas for all JSON
2. **Version Checking**: Template version vs runtime version
3. **Deep Path Validation**: Every field reference verified against models.json
4. **Type Checking**: Format compatibility (can't format string as date)
5. **Fuzzy Matching**: Suggestions for typos

---

## 🎯 **IMPLEMENTATION ROADMAP**

### **MVP (6 Weeks)**

**Week 1: JSON Schemas**
- Define 7 Zod schemas
- Export JSON Schema for IDE autocomplete
- Discriminated unions for pages
- Path-specific error messages

**Week 2: Loader Pipeline**
- Validation step
- Normalization (aliases, defaults, deep paths)
- Planning (routes, data, guards)
- Diagnostic tracing

**Week 3: Core Adapters**
- DataAdapter interface + PrismaAdapter
- UIAdapter interface + ShadcnAdapter
- AuthAdapter interface + NextAuthAdapter
- RouterAdapter interface + NextRouterAdapter
- FormatAdapter

**Week 4: Runtime Renderer (List/Detail)**
- Config loader with caching
- List page renderer (pagination, sort, filter)
- Detail page renderer (relations)
- Loading/error boundaries
- RSC/client detection

**Week 5: Forms**
- Form renderer with react-hook-form + Zod
- Field widget registry
- Mutation handling via DataAdapter
- Success/error states

**Week 6: Guards, SEO, Polish**
- AuthAdapter integration
- SEO metadata injection
- Theme token application
- i18n support
- Performance optimization
- Documentation

### **Post-MVP**

**Month 2**: Optional codegen, mobile support (React Native)  
**Month 3**: Visual editor, template marketplace  
**Month 4**: Advanced features (webhooks, real-time, collaborative)

### **Migration from V2**

**Phase 1**: Build V3 in parallel, V2 stays  
**Phase 2**: Offer dual mode (runtime default, codegen optional)  
**Phase 3**: Convert templates to JSON  
**Phase 4**: Deprecate V2

**Timeline**: 2-3 months, no breaking changes

---

## ⚠️ **CRITICAL PITFALLS**

1. **Intl.Collator for ordering**: Use byte-wise compare for keys
2. **Bypassing adapters**: All data via DataAdapter, never direct fetch
3. **Business logic in JSON strings**: Use declared operators, not eval
4. **Client-supplied ordering**: Server validates/controls all sorting
5. **Skipping validation**: Always validate with Zod first
6. **Hardcoded dependencies**: Use adapters for all framework-specific code
7. **Missing version checks**: Validate compatibility, provide migrations
8. **Unsafe HTML**: Always sanitize with DOMPurify
9. **N+1 queries**: Aggregate includes in DataAdapter
10. **Missing accessibility**: Include ARIA by default

---

## 🎓 **KEY INSIGHTS**

### **Why Runtime Over Codegen**

Most web apps are variations of same patterns (list, detail, form). Runtime renderer that reads recipes (JSON) beats generating unique code for each meal.

**Trade-off**: +100kb bundle, -10,000 lines of generated code. Net: massive win.

### **Why Adapters**

Framework churn is constant (React 18→19, Next 13→15). Adapters insulate templates from breaking changes.

**Trade-off**: Abstraction overhead, unlimited flexibility.

### **Why JSON Over TypeScript**

TypeScript = developers only. JSON = universal (any language, any tool, any system).

**Trade-off**: Lose compile-time checks, gain runtime flexibility + accessibility.

### **Why Seven JSON Files**

Separation of concerns by role:
- template.json → Product/UX
- models.json → Backend (auto)
- mappings.json → Integration
- capabilities.json → Platform
- data-contract.json → API
- theme.json → Design
- i18n.json → L10n

Each independently versioned, owned, maintained.

---

## 🚀 **END STATE**

### **For Developers**
- Zero code templates (JSON only)
- Vendor freedom (swap adapters anytime)
- Hot reload (instant updates)
- Type-safe (JSON Schema in IDE)
- Testable (mock adapters)

### **For Teams**
- Non-technical editing (JSON)
- Visual editors (future GUI)
- Template marketplace (npm packages)
- Instant rebranding (theme.json)
- Clear audit trail (JSON diffs)

### **For Platforms**
- Multi-platform (web + mobile, same JSON)
- White-label ready (per-tenant themes)
- SaaS enabling (per-tenant UIs from JSON)
- Templates as data (database, not codebase)

---

## 📦 **PACKAGE STRUCTURE**

### **Core**
- `@ssot-ui/runtime` - Runtime renderer
- `@ssot-ui/schemas` - Zod schemas + JSON Schema
- `@ssot-ui/loader` - Validation/normalization/planning

### **Adapters**
- `@ssot-ui/adapter-data-{prisma,supabase,trpc,graphql,rest}`
- `@ssot-ui/adapter-ui-{shadcn,mui,chakra,radix}`
- `@ssot-ui/adapter-auth-{nextauth,clerk,supabase,auth0}`
- `@ssot-ui/adapter-router-{next,remix,tanstack,react-router}`

### **Templates**
- `@ssot-templates/{blog,admin,ecommerce,crm}`

### **Optional**
- `@ssot-ui/codegen` - File export
- `@ssot-ui/dev-tools` - Dev UI
- `@ssot-ui/cli` - CLI tools

---

## 📝 **SUMMARY**

**Problem**: Code generation = maintenance burden + vendor lock + slow iteration

**Solution**: JSON-first runtime rendering + adapter abstraction

**Result**:
- ✅ **99% less code** (JSON, no files)
- ✅ **Instant hot reload** (no build)
- ✅ **Vendor agnostic** (adapters)
- ✅ **Non-technical friendly** (JSON vs TS)
- ✅ **Zero maintenance** (no generated files)
- ✅ **Maximum flexibility** (runtime + optional codegen)

---

**Status**: ✅ Architecture Complete  
**Documentation**: Complete (860 lines, 90% text)  
**Implementation**: Ready to begin  
**Timeline**: 6 weeks MVP, 3 months full production

**Next Step**: Begin Week 1 (JSON Schemas) 🚀

