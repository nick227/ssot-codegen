# @ssot-ui/loader

**Validates, normalizes, and plans SSOT UI templates.**

Version: 3.0.0

---

## 📦 **Installation**

```bash
npm install @ssot-ui/loader
```

---

## 🎯 **Purpose**

Three-step pipeline for processing JSON templates:

1. **Validate** - Zod schema validation + cross-schema checks
2. **Normalize** - Resolve aliases, apply defaults, validate deep paths
3. **Plan** - Derive routes, data requirements, guards, rendering order

---

## 🔍 **Usage**

```typescript
import { loadTemplate } from '@ssot-ui/loader'

const result = await loadTemplate({
  template: /* template.json */,
  dataContract: /* data-contract.json */,
  capabilities: /* capabilities.json */,
  mappings: /* mappings.json */,
  models: /* models.json */,
  theme: /* theme.json */,
  i18n: /* i18n.json */,
  runtimeVersion: '3.0.0'
})

if (result.ok) {
  console.log('✅ Template loaded!')
  console.log('Routes:', result.plan.routes)
  console.log('Data requirements:', result.plan.data)
  console.log('Guards:', result.plan.guards)
} else {
  console.error('❌ Validation failed:', result.errors)
}
```

---

## ⚡ **What It Does**

### **Step 1: Validation**
- Validates all 7 JSON files against Zod schemas
- Checks version compatibility (REDLINE: hard-fail on major mismatch)
- Cross-schema validation (field paths, models, HTML policies)
- Path-specific errors with fuzzy-match suggestions

### **Step 2: Normalization**
- Resolves model/field aliases through mappings.json
- Applies sensible defaults (pagination, SEO, layout)
- Validates deep field paths (post.author.name)
- Computes field resolution confidence scores

### **Step 3: Planning**
- Derives route definitions with params
- Aggregates data requirements per model
- Prevents N+1 by consolidating relation includes
- Groups pages by runtime (server/client/edge)
- Extracts guard definitions

---

## 📋 **Execution Plan Output**

```typescript
interface ExecutionPlan {
  routes: RouteDefinition[]        // All routes with metadata
  data: DataRequirement[]          // Per-model data needs
  guards: Guard[]                  // Route-level access control
  
  serverPages: string[]            // Rendered server-side
  clientPages: string[]            // With "use client"
  edgePages: string[]              // Edge runtime
  
  normalizedTemplate: NormalizedTemplate
}
```

---

## 🚨 **REDLINES ENFORCED**

### **1. Version Handshake**
Hard-fails if template requires incompatible runtime version:
```
❌ INCOMPATIBLE: Runtime v3.0.0 does not satisfy template requirement "^4.0.0"
💡 Upgrade runtime: npm install @ssot-ui/runtime@^4.0.0
```

### **2. HTML Sanitization**
Warns if `format: "html"` without `sanitizePolicy`:
```
⚠️  Field "content" uses format "html" but has no sanitizePolicy
💡 Add sanitizePolicy: "basic" | "strict" | "rich"
```

### **3. Field Path Validation**
Validates every field reference against models:
```
❌ Field "post.excerpt" not found
Available: title, content, summary, slug
Did you mean: "post.summary"?
```

---

## ⚡ **Performance**

Typical load time: **< 50ms** for medium template

Diagnostics included:
- Validation time
- Normalization time  
- Planning time
- Total time
- Stats (pages, models, guards, relations)

---

## 🧪 **Testing**

```bash
npm test
```

Includes tests for:
- Successful loading
- Validation failures
- Version mismatches
- Default application
- Data aggregation
- Diagnostics

---

## 📄 **License**

MIT

