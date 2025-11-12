# 🚀 M0 Implementation Plan - Practical MVP (2 Weeks)

## Goal

Ship a **working, practical platform** in 2 weeks that developers can use immediately.

**Philosophy**: Simple, opinionated, convention-based. Add complexity only when proven necessary.

---

## 📋 Week 1: Core Platform

### **Day 1-2: File Structure Simplification**

**Task**: Consolidate 7 files → 2 files

**Old Structure**:
```
templates/
├── models.json
├── template.json
├── data-contract.json
├── capabilities.json
├── mappings.json
├── theme.json
└── i18n.json
```

**New Structure**:
```
templates/
├── models.json    # Auto-generated from Prisma
└── app.json       # Everything else
```

**app.json Structure**:
```json
{
  "name": "My App",
  "version": "1.0.0",
  "features": {
    "auth": true
  },
  "permissions": "owner-or-admin",
  "pages": {
    "Track": {
      "list": true,
      "detail": true,
      "form": true
    }
  }
}
```

**Deliverables**:
- [ ] Design app.json schema
- [ ] Create Zod validation
- [ ] Update create-ssot-app to generate app.json
- [ ] Migration guide (old → new)

---

### **Day 3-4: Simple Security Layer**

**Task**: Build practical security (~65 lines total)

**Deliverables**:

1. **Simple Policy** (~30 lines)
```typescript
// lib/security.ts
export function applySecurityFilter(
  model: string,
  action: 'read' | 'write',
  user: User,
  where: any = {}
) {
  // Admin can access everything
  if (user.role === 'admin') return where
  
  // For reads: public OR owner
  if (action === 'read') {
    const filters = []
    if (hasField(model, 'isPublic')) filters.push({ isPublic: true })
    if (hasField(model, 'uploadedBy')) filters.push({ uploadedBy: user.id })
    
    if (filters.length === 0) return where
    if (filters.length === 1) return { ...where, ...filters[0] }
    return { ...where, OR: filters }
  }
  
  // For writes: owner only
  if (action === 'write') {
    if (hasField(model, 'uploadedBy')) {
      return { ...where, uploadedBy: user.id }
    }
    throw new Error('Permission denied')
  }
  
  return where
}
```

2. **Field Deny List** (~5 lines)
```typescript
const DENY_FIELDS = ['role', 'permissions', 'passwordHash', 'apiKey']

export function sanitizeData(data: any): any {
  const safe = { ...data }
  DENY_FIELDS.forEach(field => delete safe[field])
  return safe
}
```

3. **Rate Limiting** (~10 lines, use library)
```typescript
import { Ratelimit } from '@upstash/ratelimit'

const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1m')
})
```

4. **Query Defaults** (~20 lines)
```typescript
export function applySafeDefaults(params: any) {
  return {
    ...params,
    take: Math.min(params.take || 50, 1000),
    include: limitIncludeDepth(params.include, 3)
  }
}
```

**Files to Create**:
- [ ] lib/security.ts
- [ ] lib/__tests__/security.test.ts

---

### **Day 5: Simple Expressions**

**Task**: Reduce from 60+ operations to 10 essential operations

**Operations** (M0):
1. **Math**: `add`, `subtract`, `multiply`, `divide`
2. **Comparison**: `eq`, `gt`, `lt`
3. **Logic**: `and`, `or`
4. **Access**: `field`, `value`

**Defer to M1**:
- String operations
- Date operations
- Array operations
- Advanced logic

**Deliverables**:
- [ ] Update operations/index.ts (export only 10 ops)
- [ ] Update tests (remove advanced op tests)
- [ ] Documentation (simple expression guide)

---

## 📋 Week 2: Renderers + Polish

### **Day 6-7: Page Renderers**

**Task**: Build List, Detail, Form renderers (basic)

**1. ListPageRenderer**:
```tsx
// Basic table with columns
function ListPageRenderer({ model, config }) {
  const [data, setData] = useState([])
  
  useEffect(() => {
    fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({
        action: `${model}.findMany`,
        params: { take: 50 }
      })
    }).then(r => r.json()).then(setData)
  }, [model])
  
  return (
    <table>
      {config.columns.map(col => (
        <th key={col}>{col}</th>
      ))}
      {data.map(item => (
        <tr key={item.id}>
          {config.columns.map(col => (
            <td key={col}>{item[col]}</td>
          ))}
        </tr>
      ))}
    </table>
  )
}
```

**2. DetailPageRenderer**:
```tsx
// Field display
function DetailPageRenderer({ model, id, config }) {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({
        action: `${model}.findOne`,
        params: { where: { id } }
      })
    }).then(r => r.json()).then(setData)
  }, [model, id])
  
  return (
    <div>
      {config.fields.map(field => (
        <div key={field}>
          <label>{field}</label>
          <div>{data?.[field]}</div>
        </div>
      ))}
    </div>
  )
}
```

**3. FormRenderer**:
```tsx
// Create/Edit form
function FormRenderer({ model, id, config }) {
  const [data, setData] = useState({})
  
  const handleSubmit = async () => {
    await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({
        action: id ? `${model}.update` : `${model}.create`,
        params: id ? { where: { id }, data } : { data }
      })
    })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {config.fields.map(field => (
        <input
          key={field}
          value={data[field] || ''}
          onChange={e => setData({...data, [field]: e.target.value})}
        />
      ))}
      <button type="submit">Save</button>
    </form>
  )
}
```

**Deliverables**:
- [ ] packages/ui-runtime/src/renderers/list-page.tsx
- [ ] packages/ui-runtime/src/renderers/detail-page.tsx
- [ ] packages/ui-runtime/src/renderers/form-page.tsx
- [ ] Tests for each renderer

---

### **Day 8: CLI Simplification**

**Task**: Reduce to 2 prompts

**New CLI Flow**:
```bash
$ npx create-ssot-app my-app

? Preset: (Use arrow keys)
❯ media (Track, Playlist, User)
  marketplace (Product, Order, User)
  saas (Org, User, Subscription)
  custom (paste your schema)

? Add Stripe? (y/N): n

✅ Done! Run: cd my-app && npm run dev
```

**Deliverables**:
- [ ] Update packages/create-ssot-app/src/cli.ts
- [ ] Create preset schemas (media, marketplace, saas)
- [ ] Remove complex prompts (adapters, plugins, etc.)
- [ ] Update to generate app.json (not 7 files)

---

### **Day 9: Integration + Testing**

**Task**: Wire everything together and test

**Deliverables**:
- [ ] Update /api/data/route.ts with simple security
- [ ] Convention-based routing (/{model}, /{model}/{id})
- [ ] E2E test (create app → run dev → CRUD operations)
- [ ] Fix bugs discovered in testing

---

### **Day 10: Documentation + Ship**

**Task**: Document and publish

**Deliverables**:
- [ ] M0 Quick Start Guide
- [ ] Security documentation (what's protected, what isn't)
- [ ] Troubleshooting guide
- [ ] Publish to npm (if ready)

---

## 🎯 M0 Success Criteria

### **Developer Can**:
1. ✅ Run `npx create-ssot-app my-app`
2. ✅ Select preset or paste schema
3. ✅ Run `npm run dev`
4. ✅ See working list/detail/form pages
5. ✅ Sign in with email
6. ✅ Create/edit/delete records (with owner checks)
7. ✅ Deploy to Vercel (zero config)

**Total Time**: ~5 minutes from idea to working app

### **What Works**:
- ✅ Basic CRUD (list, detail, create, edit, delete)
- ✅ Email authentication (NextAuth)
- ✅ Owner-or-admin permissions (automatic)
- ✅ Rate limiting (API protection)
- ✅ Relations (basic display)
- ✅ Convention-based routes

### **What Doesn't Work** (OK for M0):
- ❌ File uploads (defer to M1)
- ❌ Payments (defer to M1)
- ❌ Advanced expressions (defer to M1)
- ❌ Custom permissions (defer to M1)
- ❌ i18n (defer to M2)
- ❌ Themes (defer to M2)

---

## 📊 Effort Comparison

| Task | Original (Phase 1.5) | M0 (Practical) | Savings |
|------|---------------------|----------------|---------|
| **Security** | 3 weeks (1000+ lines) | 4 days (~65 lines) | **75% faster** |
| **File Structure** | 7 JSON files | 2 JSON files | **70% simpler** |
| **Expressions** | 60+ operations | 10 operations | **83% simpler** |
| **CLI** | 10+ prompts | 2 prompts | **80% simpler** |
| **Total Timeline** | 10 weeks | 2 weeks | **80% faster** |

---

## 🚀 Immediate Next Steps

**Starting M0 Implementation Now**:

1. ✅ Design app.json structure (consolidate 6 files)
2. ✅ Create simple security layer (lib/security.ts)
3. ✅ Update CLI (2 prompts only)
4. ✅ Build basic renderers
5. ✅ Wire together with /api/data endpoint

**Timeline**: 2 weeks to shipped product!

---

**Proceeding with M0 implementation...** 🚀

