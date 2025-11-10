# UI Generation - Ready to Build Summary

## ✅ ALL CONTRACTS LOCKED (v1.0.0)

The following are **FROZEN** - no changes without major version bump:

### 1. SDK Hook Contract
📄 **See**: `docs/SDK_HOOK_CONTRACT_LOCKED.md`

```typescript
useList(resource, params)  → { data, total, isLoading, error, refetch }
useGet(resource, { id })   → { data, isLoading, error }
useCreate(resource)        → { mutate, isPending, error }
useUpdate(resource)        → { mutate, isPending, error }
useDelete(resource)        → { mutate, isPending, error }
```

**Wire formats locked**:
- Sort: `Array<{ field: string; dir: 'asc'|'desc' }>`
- Filters: `Array<{ field: string; op: FilterOp; value: any }>`
- Search: `{ query: string; fields?: string[] }`
- Errors: `{ code: string; message: string; details?: unknown }`
- Dates: Always ISO 8601 strings (UTC)

---

### 2. Theme Tokens (ssot-tokens@1)
📄 **See**: `docs/THEME_TOKENS_V1.md`

Single JSON source compiles to:
- Tailwind extend config (web)
- JavaScript tokens (React Native)

**Identical token names** across platforms required.

---

### 3. Design System Choices
- **Web**: Headless-first + Tailwind (works with shadcn/ui)
- **Mobile**: RN primitives + tokens (Expo compatible)
- **Routing**: Next.js App Router (web), Expo Router (mobile)

---

### 4. File Ownership Strategy
- Ownership comments in every generated file
- Prompt before overwrite on regeneration
- Safe blocks for user customizations
- Never silently overwrite

---

## 📋 BUILD SEQUENCE (Ready to Start)

### **WEEK 0: Foundation** ⚡ START HERE
**Deliverable**: Theme token system

Tasks:
1. Create @ssot-ui/tokens package
2. Define tokens.json (colors, spacing, typography, etc.)
3. Build compiler: JSON → Tailwind config
4. Build compiler: JSON → RN tokens
5. Test: Identical names across platforms
6. Publish: @ssot-ui/tokens@1.0.0

**Exit**: Token system published, documented, tested

---

### **WEEKS 1-2: @ssot-ui/data-table** 🏆
📄 **API Spec**: `docs/DATA_TABLE_API_SPEC.md`

**MVP Scope** (ship first):
- Column rendering with custom cells
- Hook integration (SDK contract)
- Single + multi-column sorting with visual order
- Pagination (page numbers)
- Loading/error/empty states
- Basic accessibility

**Full Feature** (v1.1+):
- Filters (text, enum, boolean, date, number ranges)
- Search with debounce
- Virtualization at >1000 rows
- CSV export (client/server modes)
- Full WCAG 2.1 AA compliance

**Definition of Done**:
- 20+ tests
- 5 Storybook examples
- Bundle <60kb gzipped
- README with examples
- Error messages with solutions
- Works with 2-second mocked latency

---

### **WEEKS 3-4: @ssot-ui/form-builder** 📝
**Scope**:
- Zod schema → form fields
- Widgets: text, number, boolean, date, enum, relation (async select)
- Validation: zodResolver + async server errors
- Layouts: 1-col, 2-col, sections
- File uploads: Pluggable adapter
- Rich text: Lazy loaded with sanitization

**Definition of Done**:
- 20+ tests
- 4 Storybook stories
- Works with all Prisma types
- Relations use getOptions hook
- Server errors map to fields

---

### **WEEK 5: @ssot-ui/crud-screens** 🔗
**Scope**:
- Compose data-table + form-builder
- Four screens: List, Detail, Create, Edit
- Props-based (not codegen)
- Explicit state components
- Next.js routing

**Definition of Done**:
- 10 tests
- Demo page
- Next.js integration docs

---

### **PHASE 1 EXIT GATE** 🚦
All three packages must be:
- Published to npm
- Tested (>80% coverage)
- Documented (README + Storybook)
- Accessible (axe passing)
- Performant (<60kb, <5min first render)

---

### **WEEKS 6-7: Template System** 🎨
**Deliverables**:
- template.json format defined
- Template compiler engine
- Mapping resolver with auto-detection
- Interactive CLI: `pnpm ssot ui init <template>`
- Validation with actionable diffs

---

### **WEEK 8: Blog Template** 📰
**Deliverables**:
- PostList, PostDetail, PostCreate, PostEdit screens
- UserProfile, CommentSection components
- SEO metadata generation
- XSS sanitization
- Auth integration (optional)
- Example project deployable to Vercel

---

### **PHASE 2 EXIT GATE** 🚦
Blog template must:
- Work with 2 different schemas
- Auto-detect ≥90% of fields
- Generate TypeScript error-free code
- Deploy to Vercel in <5 minutes
- Lighthouse score >90

---

### **WEEKS 9-12: Admin Panel** 🔧
**Deliverables**:
- Field mapping library (hint layer only)
- Schema analyzer
- SmartTable/SmartDetail components
- Dynamic routing
- Read-only by default
- Write mode opt-in (v2)

---

### **PHASE 3 EXIT GATE** 🚦
Admin panel must:
- Discover 100% of models
- Zero crashes on unknown types
- Render 1000 items in <2s
- Hide security fields automatically
- Work via `pnpm ssot dev --admin`

---

## 🎯 Immediate Action Items

### Before Any Coding

**1. Lock SDK Contract** ✅ DONE
- Document exact types
- Create adapter interface
- Write contract tests

**2. Define Theme Tokens** ✅ DONE  
- Create tokens.json
- Document compilation process
- Version as @1

**3. Create Data Table API Spec** ✅ DONE
- Define all props
- Document behavior
- Specify acceptance criteria

### First Implementation (Week 0)

**Start**: Theme tokens package
**Goal**: Publish @ssot-ui/tokens@1.0.0

**Checklist**:
- [ ] Create package structure
- [ ] Define tokens.json (complete palette)
- [ ] Build Tailwind compiler
- [ ] Build RN tokens compiler  
- [ ] Verify name consistency
- [ ] Write tests (compilation works)
- [ ] Write README
- [ ] Publish to npm

**Time**: 2-3 days

---

## 💡 Key Principles (Remember During Build)

1. **Generated code looks hand-written** (standard React, not framework code)
2. **Explicit over implicit** (visible config, no magic)
3. **Escape hatches everywhere** (can replace any component)
4. **Helpful errors** (problem + solution + docs)
5. **Safe by default** (read-only admin, sanitize content, no silent overwrites)

---

## 📊 Success Metrics to Hit

**Phase 1**: 
- Time to first render: <5 min ✅
- Bundle size: <60kb ✅
- A11y: 100% axe pass ✅
- Test coverage: >80% ✅

**Phase 2**:
- Auto-detection: ≥90% fields ✅
- Generation time: <10 min ✅
- Vercel deploy: <5 min ✅
- Lighthouse: >90 ✅

**Phase 3**:
- Model discovery: 100% ✅
- Render speed: <2s for 1000 items ✅
- Mapper accuracy: >80% ✅

---

## 🚀 The Vision

**Input**: Prisma schema
**Output**: Full-stack app with backend + frontend

**Example**:
```prisma
model BlogPost {
  id      Int     @id
  heading String
  body    String
  writer  User    @relation(...)
}
```

**Run**:
```bash
pnpm ssot generate           # Backend API + SDK
pnpm ssot ui init blog       # Configure mappings
pnpm ssot generate --ui      # Frontend UI
npm run dev                  # Full app running!
```

**Time**: 10 minutes from schema to production app

**Result**: Complete blog with:
- ✅ REST API
- ✅ TypeScript SDK
- ✅ React hooks
- ✅ List/detail/create/edit screens
- ✅ SEO optimized
- ✅ Accessible
- ✅ Type-safe
- ✅ Customizable

---

## 🎯 READY TO BUILD

All contracts are locked.  
All gaps are filled.  
All risks are identified.  
All exit criteria are defined.

**Next step**: Implement theme tokens (Week 0)  
**Then**: Build @ssot-ui/data-table (Weeks 1-2)

The plan is **executable, measured, and production-ready**. 🚀

