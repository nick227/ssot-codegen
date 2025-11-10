# Blog Template - JSON Example

**Version**: 1.0.0  
**Runtime**: 3.0.0+  
**Type**: JSON-First Runtime Template

---

## 📄 **Files**

- `template.json` - UI structure (3 pages: list, detail, form)
- `data-contract.json` - Query/mutation whitelists
- `capabilities.json` - UI components, security policies
- `mappings.json` - Field aliases (empty for this example)
- `models.json` - Parsed schema surface
- `theme.json` - Design tokens with light/dark modes
- `i18n.json` - English translations

---

## ✅ **Validation**

```bash
cd examples/json-templates/blog
npx ssot validate .
```

Expected output:
```
✅ template.json
✅ data-contract.json
✅ capabilities.json
✅ mappings.json
✅ models.json
✅ theme.json
✅ i18n.json
✅ Cross-schema validation passed

✅ All validations passed!
```

---

## 📋 **Plan Output**

```bash
npx ssot plan . --out plan.json
```

Shows:
- 3 routes (/,  /posts/[slug], /admin/posts/new)
- 1 model (post)
- 1 guard (/admin/*)
- Data requirements (list, detail, create operations)

---

## 🎯 **Demonstrates**

### **Redlines**
✅ Version handshake (`runtimeVersion: "^3.0.0"`)  
✅ HTML sanitization (`format: "html"` with `sanitizePolicy: "rich"`)  
✅ Runtime flags (explicit `runtime` on every page)  
✅ Server-owned filtering (whitelisted in data-contract.json)

### **Features**
✅ List page with cursor pagination  
✅ Detail page with relations (author, comments)  
✅ Form page (client runtime enforced)  
✅ Route guards (/admin/*)  
✅ SEO metadata  
✅ Light/dark theme tokens

---

## 🚀 **Usage** (When Runtime is Built)

```typescript
import { TemplateRuntime } from '@ssot-ui/runtime'
import blogTemplate from './template.json'

export default function App() {
  return <TemplateRuntime config={blogTemplate} />
}
```

**That's it!** Zero generated code, entire blog in JSON.

---

**Total Code**: 0 lines of TypeScript (JSON configuration only)  
**Status**: ✅ Valid, ready for runtime rendering

