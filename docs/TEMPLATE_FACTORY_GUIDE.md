# Template Factory System - Architecture Guide

**Evolution**: V1 → V2 → V3 (JSON-First Runtime Architecture)

**Purpose**: Eliminate code generation entirely by rendering UI templates from JSON at runtime.

---

## 🎯 **Core Concept Shift**

**V1 (Imperative)**: 700-1200 lines of generator code per template  
**V2 (Declarative)**: 100-150 lines of TypeScript config  
**V3 (JSON-First)**: 0 lines of code, pure JSON configuration + runtime renderer

### **Why JSON-First Architecture**

The fundamental question: **Why generate code at all when you can render from JSON at runtime?**

**Traditional approach** (V1-V2):
- Write configuration → Run factory → Generate files → Compile → Deploy
- Every change requires regeneration and recompilation
- Generated code must be maintained and potentially merged with user edits
- Vendor lock-in to specific frameworks (Next.js, React)

**JSON-First approach** (V3):
- Write JSON → Mount runtime renderer → Render at runtime
- Changes to JSON = instant updates (hot reload)
- No generated code to maintain or merge
- Vendor-agnostic through adapter system
- Single mount point, infinite templates

---

## 📐 **Architecture Overview**

### **Core Principle**

**Business logic lives in portable JSON, not in generated TypeScript files.**

The system consists of:
1. **JSON Contracts** - All configuration (templates, mappings, capabilities, data, theme, i18n)
2. **Loader Pipeline** - Validates, normalizes, and plans rendering
3. **Adapter Layer** - Vendor-agnostic interfaces for data, UI, auth, routing
4. **Runtime Renderer** - Reads JSON, uses adapters, renders UI without project code
5. **Optional Codegen** - Export to files when needed (uses same JSON)

---

## 📋 **JSON Contracts** (Single Source of Truth)

### **1. template.json**
Defines the entire UI structure including pages, components, routes, SEO metadata, and security guards.

**Contents**:
- **Pages**: List, detail, form, and custom page definitions
- **Components**: Reusable UI elements with display configurations
- **Routes**: URL patterns and navigation structure
- **Guards**: Role-based access controls per route
- **SEO**: Metadata, Open Graph tags, canonical URLs
- **Features**: Enabled capabilities (forms, file upload, rich text, i18n)

**Key point**: This is NOT a configuration file for code generation—it IS the application definition consumed directly by the runtime renderer.

### **2. models.json**
Parsed schema surface exposing entities, fields, relations, and types.

**Contents**:
- **Entities**: All models from your Prisma schema
- **Fields**: Type information, validation rules, relations
- **Relations**: Eager/lazy loading strategies, cardinality
- **Enums**: Available values for enum fields

**Generated automatically** from your Prisma schema during build. Not hand-written.

### **3. mappings.json**
User-defined aliases bridging template field names to actual schema fields.

**Purpose**: Templates use generic field names (post.title, user.name). Your schema may use different names (blogPost.heading, author.fullName). Mappings resolve this gap.

**Contents**:
- **Model mappings**: Template model names → Schema model names
- **Field mappings**: Deep path mappings with dot notation support

**Validation**: Loader validates all mappings against models.json and produces actionable error messages with suggestions for mismatches.

### **4. capabilities.json**
Declares available UI primitives, features, and security policies.

**Contents**:
- **UI Components**: Which shared components are available (Avatar, Badge, DataTable, Form)
- **Data Operations**: Supported mutations and queries
- **Sanitization Policies**: HTML sanitization rules for rich text
- **File Upload**: Max sizes, allowed types, storage adapter
- **Feature Flags**: Which optional features are enabled

**Purpose**: Runtime renderer uses this to validate template requirements and configure adapters appropriately.

### **5. data-contract.json**
Query presets, mutation signatures, and pagination policies.

**Contents**:
- **List operations**: Default sort, filter options, page size limits
- **Detail operations**: Include strategies for relations
- **Mutations**: Create, update, delete signatures
- **Pagination**: Cursor vs offset, max page size, total count strategy

**Used by**: DataAdapter to construct database queries without custom code.

### **6. theme.json**
Design tokens defining the visual system.

**Contents**:
- **Colors**: Semantic color scales (primary, neutral, success, error)
- **Spacing**: Consistent spacing scale
- **Typography**: Font families, sizes, line heights, weights
- **Radii**: Border radius values
- **Shadows**: Elevation system
- **Breakpoints**: Responsive design breakpoints

**Compiled**: UIAdapter translates these tokens to the target UI framework (Tailwind CSS, Emotion, React Native).

### **7. i18n.json**
Internationalization strings and labels per locale.

**Contents**:
- **Locales**: Available languages
- **Messages**: Translated strings keyed by message ID
- **Formatting**: Date, number, currency formats per locale

**Runtime support**: Renderer uses FormatAdapter to apply locale-aware formatting.

---

## 🔄 **Loader Pipeline** (Validate → Normalize → Plan)

### **Step 1: Validation**
All JSON files are validated against strict Zod schemas before any processing occurs.

**What it validates**:
- **Schema compliance**: Every JSON file must match its contract
- **Discriminated unions**: Page types (list/detail/form/custom) have correct required fields
- **Version compatibility**: Template version matches supported runtime version
- **References**: All model and field references exist in models.json

**Error handling**: Path-specific errors with actionable suggestions.

Example error output:
```
❌ Invalid template.json
  At pages[2].displayFields[1].field:
    Field "post.excerpt" not found
    
  Available fields: title, content, summary, slug, createdAt
  
  Did you mean: "post.summary"?
  
  💡 Fix: Update field name or add mapping:
     mappings.json → { "post.excerpt": "post.summary" }
```

### **Step 2: Normalization**
Resolves aliases, applies defaults, and validates deep paths.

**Alias resolution**:
- Model names: template.json references "post" → mappings.json maps to "BlogPost"
- Field paths: "post.author.name" → "blogPost.writer.fullName"
- Computed fields: Expressions are validated and prepared for evaluation

**Default application**:
- Missing pagination config gets defaults (type: pages, size: 20)
- Omitted runtime gets inferred (forms → client, others → server)
- Empty SEO blocks get page title as fallback

**Deep path validation**:
- Each segment validated against models.json
- Relation traversal checked for existence
- Type compatibility verified (e.g., can't format number as date)

**Output**: Normalized template with all references resolved and validated.

### **Step 3: Planning**
Derives execution plan including routes, data requirements, guards, and rendering order.

**Route derivation**:
- Static routes from page definitions
- Dynamic segments identified ([slug], [id])
- Catch-all routes planned
- Breadcrumb navigation computed

**Data requirements**:
- Which models need list queries
- Which need detail queries
- Relation includes aggregated to minimize N+1
- Pagination and sorting requirements extracted

**Guard application**:
- Role checks inserted at route boundaries
- Permission validation planned
- Redirect targets for unauthorized access

**Rendering order**:
- Server components rendered first
- Client boundaries identified
- Loading and error boundaries positioned
- Suspense boundaries planned for async data

**Output**: Execution plan consumed by Runtime Renderer.

---

## 🔌 **Adapter Layer** (Vendor Agnostic)

The adapter layer provides stable TypeScript interfaces that decouple templates from specific implementations.

### **DataAdapter Interface**

**Purpose**: Abstract all data access behind a consistent interface so templates work with any backend.

**Operations**:
- **list(model, params)**: Fetch paginated/filtered/sorted lists
- **detail(model, id)**: Fetch single record with optional relations
- **create(model, data)**: Insert new record with validation
- **update(model, id, data)**: Update existing record
- **delete(model, id)**: Remove record
- **search(model, query, fields)**: Full-text search across fields

**Relation hydration**: Adapter handles include/eager loading based on data-contract.json policies to prevent N+1 queries.

**Implementations provided**:
- PrismaDataAdapter (direct Prisma client)
- SupabaseDataAdapter (Supabase client)
- TRPCDataAdapter (tRPC procedures)
- GraphQLDataAdapter (GraphQL queries)
- RESTDataAdapter (REST API calls)

**Custom adapters**: Users can implement the interface for any backend.

### **UIAdapter Interface**

**Purpose**: Abstract component library so templates render with any UI framework.

**Required components**:
- Avatar, Badge, Button, Card, Input, Select, Checkbox, Textarea
- DataTable (with sort/filter/pagination)
- Form (with validation and error display)
- Modal, Toast, Skeleton, Spinner

**Variant support**: Components accept variant, size, color props that map to the underlying library's API.

**Implementations provided**:
- ShadcnUIAdapter (shadcn/ui + Tailwind)
- MUIAdapter (Material-UI)
- ChakraUIAdapter (Chakra UI)
- RadixUIAdapter (Radix Primitives + custom styling)

**Theming**: Adapters consume theme.json and translate tokens to the target system.

### **AuthAdapter Interface**

**Purpose**: Abstract authentication and authorization checks.

**Operations**:
- **checkRole(roles)**: Verify user has one of the specified roles
- **checkPermission(permission)**: Verify user has specific permission
- **getCurrentUser()**: Get current user context
- **redirectToLogin()**: Redirect unauthorized users

**Implementations**:
- NextAuthAdapter (NextAuth.js)
- ClerkAdapter (Clerk)
- SupabaseAuthAdapter (Supabase Auth)
- Auth0Adapter (Auth0)

**Guard integration**: Runtime Renderer calls AuthAdapter before rendering guarded pages.

### **RouterAdapter Interface**

**Purpose**: Abstract routing so templates work with any router.

**Operations**:
- **Link component**: Navigation with prefetch support
- **useParams()**: Access route parameters
- **useSearchParams()**: Access query string
- **useNavigate()**: Programmatic navigation
- **redirect(path)**: Server-side redirect

**Implementations**:
- NextRouterAdapter (Next.js App Router)
- RemixRouterAdapter (Remix)
- TanStackRouterAdapter (TanStack Router)
- ReactRouterAdapter (React Router v6)

**Route generation**: Adapter translates template route definitions to framework-specific patterns.

### **FormatAdapter Interface**

**Purpose**: Locale-aware formatting and sanitization.

**Operations**:
- **formatDate(date, format, locale)**
- **formatNumber(number, locale)**
- **formatCurrency(amount, currency, locale)**
- **sanitizeHTML(html, policy)**: XSS protection for rich text
- **truncate(text, length)**: Smart text truncation

**Sanitization**: Uses DOMPurify or similar with configurable policies from capabilities.json.

**i18n integration**: Consumes i18n.json for locale-specific formatting rules.

---

## 🎬 **Runtime Renderer** (Zero Code Generation)

The runtime renderer is a prebuilt React component package that reads JSON configurations and renders complete applications without generating any project code.

### **Core Responsibilities**

**Configuration loading**: Reads and caches all JSON contracts (template, models, mappings, capabilities, data-contract, theme, i18n).

**Runtime adaptation**: Works with both Server Components (Next.js App Router) and Client Components based on runtime field in page definitions.

**Auto "use client" insertion**: When a page requires client runtime (forms, interactive features), the renderer automatically handles boundary placement.

**Route rendering**: Dynamically renders the appropriate page component based on current route, using RouterAdapter for navigation.

**Data fetching**: Calls DataAdapter operations based on page type and includes requirements, with automatic loading/error states.

**Guard enforcement**: Calls AuthAdapter before rendering guarded pages, redirects unauthorized users.

**Adaptive UI**: Uses UIAdapter to render with the project's chosen component library, applying theme tokens.

**Built-in features**:
- Accessibility (ARIA roles, keyboard navigation, focus management)
- Pagination (pages, cursor, infinite scroll)
- Sorting and filtering with persistent state
- Search with debouncing
- Loading skeletons during data fetch
- Error boundaries with retry
- Empty states with helpful messages
- Breadcrumb navigation
- SEO metadata injection

### **Integration Pattern**

Projects using runtime mode require only a single mount point—typically a catch-all route that forwards all paths to the renderer.

**Project structure**:
```
my-app/
├── templates/          ← All JSON configuration
│   ├── blog.json
│   ├── mappings.json
│   └── theme.json
├── app/
│   └── [[...slug]]/    ← Single catch-all route
│       └── page.tsx    ← Mounts TemplateRuntime
└── adapters/           ← Adapter implementations
    ├── data.ts
    ├── ui.ts
    └── auth.ts
```

**Mount point** (entire application in ~20 lines):
The page.tsx file imports the runtime renderer, provides adapters, and passes the JSON configuration. No other pages or components need to be created.

### **Runtime Modes**

**Server Component rendering**: Pages with `runtime: "server"` render on the server using direct database access through DataAdapter. Data is fetched during render, enabling static generation and ISR.

**Client Component rendering**: Pages with `runtime: "client"` render on the client with hooks for data fetching. Used for forms, dashboards, and interactive features.

**Edge rendering**: Pages with `runtime: "edge"` render at the edge with lightweight data operations. Useful for auth pages and redirects.

**Automatic boundary detection**: Renderer inserts client boundaries only where needed, keeping maximum performance with server components.

### **Hot Reload**

JSON changes trigger immediate updates without recompilation:
- Template structure changes → instant re-render
- Mapping changes → immediate field resolution update
- Theme changes → instant visual update
- No build step, no code generation, no file writes

---

## 📦 **Optional Codegen** (Export Layer)

For projects that require actual files (debugging, customization, deployment constraints), the codegen layer exports the same JSON configuration to TypeScript files.

### **When to Use Codegen**

**Debugging**: Generated files can be easier to debug than runtime rendering.

**Customization**: Some teams prefer editing TypeScript over JSON for complex logic.

**Deployment constraints**: Hosting platforms that don't support dynamic JSON loading.

**Performance optimization**: Pre-generated files can be faster for massive applications.

**Hybrid approach**: Generate base structure, customize specific pages.

### **Codegen Features**

**Idempotent writes**: Uses MD5 hashing to detect changes, only writes files that changed.

**Safe overwrite modes**:
- **skip**: Never overwrite existing files
- **overwrite**: Replace files unconditionally
- **merge**: Preserve user code in safe zone markers
- **prompt**: Ask before overwriting

**Automatic backups**: Creates timestamped backups before any destructive operation.

**Dry-run support**: Preview what would be generated without writing files.

**Diff reporting**: Shows created, modified, unchanged, and skipped files.

**Format enforcement**: Runs Prettier and ESLint on generated code, fails if unformatted.

**Import deduplication**: Uses ImportManager to eliminate duplicate imports and resolve aliases.

**RSC boundary awareness**: Automatically inserts "use client" directives where needed.

**Loading/error boundaries**: Generates co-located loading.tsx and error.tsx files.

**Route guards**: Generates middleware wrappers for protected routes.

**SEO metadata**: Generates metadata exports for Next.js pages.

### **Codegen Output Structure**

Generated files follow framework conventions (Next.js App Router structure):
```
app/
├── (blog)/
│   ├── layout.tsx              ← Generated layout with theme
│   ├── page.tsx                ← List page (server component)
│   └── posts/
│       ├── page.tsx            ← Posts list
│       ├── loading.tsx         ← Loading skeleton
│       ├── error.tsx           ← Error boundary
│       └── [slug]/
│           └── page.tsx        ← Detail page
├── admin/
│   ├── layout.tsx              ← Admin layout with guards
│   └── posts/
│       ├── new/
│       │   └── page.tsx        ← Form (client component)
│       └── [id]/
│           └── edit/
│               └── page.tsx    ← Edit form
components/
├── PostCard.tsx                ← Generated component
└── CommentSection.tsx          ← Generated component
```

### **Codegen CLI**

Export templates to files with configurable options:
```
npx ssot-ui export blog.json --output src/app [options]

Options:
  --dry-run          Preview without writing
  --diff             Show detailed diff
  --mode <mode>      skip|overwrite|merge|prompt
  --no-backup        Skip backup creation
  --no-format        Skip Prettier/ESLint
  --manifest <path>  Write manifest JSON
```

**Export manifest**: JSON file listing all generated files, their sizes, and change status for build integrations.

---

## 📝 **Benefits Comparison**

### **Code Exposure Reduction**

| Approach | Lines of Code | What You Write |
|----------|---------------|----------------|
| **V1 (Imperative)** | 700-1,200 | Generator functions with template strings |
| **V2 (Declarative)** | 100-150 | TypeScript configuration objects |
| **V3 (JSON-First)** | 0 (just JSON) | Pure JSON configuration files |

### **Development Workflow**

**V1 Workflow** (Imperative generators):
1. Write generator function (700+ lines TypeScript)
2. Run generator to create files
3. Compile TypeScript
4. Test generated output
5. Fix generator bugs
6. Regenerate files
7. Deal with merge conflicts
8. Redeploy

**V2 Workflow** (Declarative config):
1. Write TypeScript config (150 lines)
2. Run factory to generate files
3. Compile TypeScript
4. Test generated output
5. Adjust config
6. Regenerate (safer merging)
7. Redeploy

**V3 Workflow** (JSON runtime):
1. Write JSON config
2. Hot reload (instant)
3. Test immediately
4. Adjust JSON
5. See changes instantly
6. Deploy JSON only

**Time to iterate**: V1 = 5-10 minutes, V2 = 2-5 minutes, **V3 = seconds**

### **Maintenance Burden**

**V1**: Maintain generator code + generated files + handle merge conflicts  
**V2**: Maintain factory config + generated files + selective overwrites  
**V3**: Maintain JSON only, no generated files to manage

### **Vendor Lock-In**

**V1**: Deeply coupled to Next.js, React, Prisma  
**V2**: Coupled to Next.js, React; Prisma abstracted via generators  
**V3**: Fully vendor-agnostic via adapter layer—swap any component at runtime

### **Team Accessibility**

**V1**: Requires TypeScript expertise to modify generators  
**V2**: Requires TypeScript knowledge for configuration  
**V3**: JSON editable by non-developers, visual editors possible

### **Versioning and Migration**

**V1**: Code diffs are massive, hard to review  
**V2**: Config diffs are smaller, generated files still large  
**V3**: Schema migrations handle JSON changes, no code to version

---

## 🎯 **Implementation Strategy**

### **MVP Scope** (4-6 weeks)

**Week 1: JSON Schemas and Validation**
- Define all seven JSON contracts with Zod
- Export JSON Schema for IDE autocomplete
- Implement discriminated unions for page types
- Build validation with path-specific error messages
- Add fuzzy matching for field suggestions

**Week 2: Loader Pipeline**
- Build validation step with meaningful errors
- Implement normalization (aliases, defaults, deep paths)
- Create planning step (routes, data, guards, rendering order)
- Add diagnostic tracing for field resolution
- Implement schema version checking and migration warnings

**Week 3: Core Adapters**
- Define DataAdapter interface with list/detail/create/update/delete operations
- Implement PrismaDataAdapter as reference
- Define UIAdapter interface with required components
- Implement ShadcnUIAdapter as reference
- Define AuthAdapter and RouterAdapter interfaces
- Implement Next.js adapters

**Week 4: Runtime Renderer (List and Detail only)**
- Build configuration loader with caching
- Implement list page renderer with pagination
- Implement detail page renderer with relations
- Add loading skeletons and error boundaries
- Handle RSC vs client boundary detection
- Integrate DataAdapter and UIAdapter

**Week 5: Forms and Mutations**
- Extend runtime for form rendering
- Integrate react-hook-form + Zod validation
- Add mutation handling through DataAdapter
- Implement field widget registry
- Add form error handling and success states

**Week 6: Guards, SEO, and Polish**
- Integrate AuthAdapter for route guards
- Add SEO metadata injection
- Implement theme token application
- Add i18n support through FormatAdapter
- Performance optimization (memoization, virtualization)
- Comprehensive documentation

### **Post-MVP Enhancements**

**Optional Codegen**: Export JSON to files for teams that need them  
**Template Marketplace**: Ship pre-built templates as JSON packages  
**Visual Editor**: GUI for editing JSON configurations  
**Mobile Support**: React Native renderer with same JSON  
**Advanced Features**: Webhooks, real-time, collaborative editing

### **Migration from V2**

**Phase 1**: Keep V2 as optional codegen path  
**Phase 2**: Build V3 runtime in parallel  
**Phase 3**: Offer dual mode (runtime default, codegen optional)  
**Phase 4**: Migrate existing templates to JSON  
**Phase 5**: Deprecate V2 generator functions

**Timeline**: 2-3 months for full migration with no breaking changes

---

## 🛡️ **Guardrails and Security**

### **Schema Versioning**

Every JSON file includes a version field. Runtime validates compatibility and provides migration guidance for breaking changes.

**Version mismatch handling**:
- Minor version differences: Warnings only
- Major version differences: Fail with upgrade instructions
- Automatic migration scripts for common patterns

### **Strict Sanitization**

HTML format fields use server-side sanitization with policies from capabilities.json.

**Sanitization policies**:
- **strict**: No HTML tags allowed, plain text only
- **basic**: Only safe tags (b, i, p, a, ul, ol, li)
- **rich**: Extended tags for rich text (h1-h6, img, table, code)
- **custom**: User-defined allowlist

**XSS prevention**: All HTML processed through DOMPurify or equivalent before rendering.

### **Runtime Flags Enforcement**

Pages with `runtime: "server"` never receive client hooks or browser APIs. Validation catches violations before runtime.

**Server restrictions**: No useState, useEffect, window, document  
**Client restrictions**: No direct database access, no file system operations  
**Edge restrictions**: No large dependencies, streaming responses only

### **Accessibility Defaults**

**ARIA patterns**: All interactive elements have proper roles and labels  
**Keyboard navigation**: Tab order, focus states, keyboard shortcuts  
**Screen reader support**: Live regions for dynamic updates  
**Color contrast**: Automatic validation against WCAG AA standards  
**Reduced motion**: Respects prefers-reduced-motion

### **Data Security**

**No client-supplied ordering**: Server controls sort and pagination to prevent enumeration attacks  
**Cursor-based pagination**: Opaque cursors prevent offset manipulation  
**Field-level permissions**: Data adapter enforces read/write permissions per field  
**Query cost limits**: Prevents expensive queries through complexity analysis

---

## 📦 **Package Structure**

### **Core Packages**

**@ssot-ui/runtime** - Main runtime renderer  
**@ssot-ui/schemas** - Zod schemas and JSON Schema exports  
**@ssot-ui/loader** - Validation, normalization, planning pipeline

### **Adapter Packages**

**@ssot-ui/adapter-data-prisma** - Prisma data adapter  
**@ssot-ui/adapter-data-supabase** - Supabase data adapter  
**@ssot-ui/adapter-ui-shadcn** - shadcn/ui adapter  
**@ssot-ui/adapter-ui-mui** - Material-UI adapter  
**@ssot-ui/adapter-auth-nextauth** - NextAuth adapter  
**@ssot-ui/adapter-router-next** - Next.js router adapter

### **Template Packages**

**@ssot-templates/blog** - Blog template JSON  
**@ssot-templates/admin** - Admin panel JSON  
**@ssot-templates/ecommerce** - E-commerce JSON  
**@ssot-templates/crm** - CRM template JSON

### **Optional Packages**

**@ssot-ui/codegen** - Optional file export  
**@ssot-ui/dev-tools** - Development UI and debugging  
**@ssot-ui/cli** - Command-line tools

---

## 🚀 **End State Vision**

### **For Developers**

**Zero code templates**: Full applications defined in portable JSON  
**Vendor freedom**: Swap any adapter without template changes  
**Hot reload**: Instant updates, no compilation  
**Type-safe**: Full TypeScript types for JSON via JSON Schema  
**Testable**: Test templates with mock adapters  
**Versioned**: Schema migrations handle breaking changes

### **For Teams**

**Non-technical editing**: Product managers can modify JSON  
**Visual editors**: GUI tools for JSON configuration (future)  
**Template marketplace**: Pre-built templates as npm packages  
**Custom branding**: Theme JSON for instant rebranding  
**Audit trail**: JSON diffs show exactly what changed

### **For Platforms**

**Multi-platform**: Same JSON renders web (React) and mobile (React Native)  
**White-label ready**: Deploy same template with different themes  
**SaaS enabling**: Generate per-tenant UIs from JSON  
**Template as data**: Store templates in database, not codebase

---

## 📝 **Summary**

**The Problem**: Code generation creates maintenance burden, vendor lock-in, and slow iteration.

**The Solution**: JSON-first runtime rendering with adapter abstraction.

**The Result**:
- **99% less code** (JSON only, no generated files)
- **Instant hot reload** (no build step)
- **Vendor agnostic** (adapters for everything)
- **Non-technical friendly** (JSON vs TypeScript)
- **Zero maintenance burden** (no generated files)
- **Maximum flexibility** (runtime + optional codegen)

**Status**: V3 architecture designed, ready for implementation

**Next Step**: Build MVP (JSON schemas → Loader → Adapters → Runtime renderer)

---

**Implementation**: `packages/ui-runtime/` (future)  
**Schemas**: `packages/ui-schemas/` (future)  
**Documentation**: This guide + API reference + migration guide



## ⚠️ **Critical Pitfalls to Avoid**

### **1. Intl.Collator for Ordering**
**Don't**: Rely on `Intl.Collator` for ordering equality checks  
**Do**: Use byte-wise comparison for `[0-9a-z]` keys to ensure consistent sorting across locales

### **2. Bypassing Adapters**
**Don't**: Allow direct fetch calls or database access in templates  
**Do**: All data operations must go through DataAdapter interface

### **3. Business Logic in JSON Strings**
**Don't**: Serialize custom JavaScript into JSON as strings like `"compute": "firstName + ' ' + lastName"`  
**Do**: Use declared operators (`concat`, `format`, `lookup`) or server functions behind DataAdapter

### **4. Client-Supplied Ordering**
**Don't**: Accept sort/filter parameters directly from client without validation  
**Do**: Server validates and controls all ordering to prevent enumeration attacks

### **5. Skipping Validation**
**Don't**: Assume JSON is valid and process it directly  
**Do**: Always validate with Zod schemas first, provide actionable error messages

### **6. Hardcoded Framework Dependencies**
**Don't**: Reference Next.js, React, or any specific framework in core renderer  
**Do**: Use adapters for all framework-specific functionality

### **7. Missing Version Checks**
**Don't**: Load templates without checking version compatibility  
**Do**: Validate template version against runtime version, provide migration guidance

### **8. Unsafe HTML Rendering**
**Don't**: Render `format: "html"` fields without sanitization  
**Do**: Always pass through DOMPurify with appropriate policy from capabilities.json

### **9. N+1 Query Problems**
**Don't**: Load relations individually per item in lists  
**Do**: DataAdapter aggregates includes and uses batch loading

### **10. Missing Accessibility**
**Don't**: Render interactive elements without ARIA roles  
**Do**: All components include proper accessibility attributes by default

---

## 🎓 **Key Learnings**

### **Why Runtime Over Codegen**

**The insight**: Most web applications are variations of the same patterns (list, detail, form). Why generate unique code for each when you can render the pattern at runtime?

**Analogy**: Traditional code generation is like writing a custom recipe for every meal. Runtime rendering is like having a chef (renderer) who reads any recipe (JSON) and cooks it.

**Trade-off**: Runtime adds ~100kb to bundle but eliminates thousands of lines of generated code. Net savings: massive.

### **Why Adapters Over Direct Dependencies**

**The insight**: Framework churn is constant (React 18 → 19, Next.js 13 → 14 → 15). Adapters insulate templates from breaking changes.

**Analogy**: Adapters are like power adapters for international travel—same device (template) works everywhere with the right adapter.

**Trade-off**: Adapter layer adds abstraction but provides unlimited flexibility.

### **Why JSON Over TypeScript**

**The insight**: TypeScript is for developers. JSON is universal—parseable by any language, editable by any tool, versionable in any system.

**Analogy**: TypeScript is like proprietary format; JSON is like PDF—universal standard.

**Trade-off**: Lose compile-time checks but gain runtime flexibility and broader accessibility.

### **Why Seven JSON Files**

**The insight**: Separation of concerns. Each JSON file has a single purpose, owned by different roles:
- template.json → Product/UX team
- models.json → Backend team (auto-generated)
- mappings.json → Integration team
- capabilities.json → Platform team
- data-contract.json → API team
- theme.json → Design team
- i18n.json → Localization team

**Analogy**: Like microservices for configuration—each file is independently versioned and maintained.

---

## 🎯 **Decision Matrix**

### **When to Use V3 (JSON Runtime)**
✅ New projects  
✅ SaaS platforms (multi-tenant)  
✅ Rapid prototyping  
✅ Non-technical teams  
✅ Template marketplace  
✅ White-label products  
✅ Multi-platform (web + mobile)

### **When to Use Optional Codegen**
⚠️ Debugging complex issues  
⚠️ Extreme customization needs  
⚠️ Deployment platform requires files  
⚠️ Team prefers TypeScript over JSON  
⚠️ Performance-critical applications  
⚠️ Offline-first requirements

### **When to Keep V2**
❌ Legacy projects (not worth migration)  
❌ Already working production systems  
❌ Team unfamiliar with new architecture

---

**File**: `docs/TEMPLATE_FACTORY_GUIDE.md`  
**Version**: 3.0.0 (JSON-First Architecture)  
**Status**: ✅ Architecture Complete, Implementation Pending  
**Next**: Begin MVP implementation (JSON schemas + Loader + Adapters + Runtime)

