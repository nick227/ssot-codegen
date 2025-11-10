# @ssot-ui/schemas

**JSON schemas and Zod validators for SSOT UI templates.**

Version: 3.0.0

---

## 📦 **Installation**

```bash
npm install @ssot-ui/schemas
```

---

## 🎯 **Purpose**

Provides type-safe validation for all 7 core JSON contracts in the SSOT UI system:

1. **template.json** - UI structure (pages, components, routes)
2. **data-contract.json** - Query/mutation signatures, whitelists
3. **capabilities.json** - Available features, security policies
4. **mappings.json** - Field aliases (template → schema)
5. **models.json** - Parsed schema surface (auto-generated)
6. **theme.json** - Design tokens
7. **i18n.json** - Translations

---

## 🔍 **Usage**

### **Programmatic Validation**

```typescript
import { validateTemplate, validateDataContract } from '@ssot-ui/schemas'

const result = validateTemplate(myTemplateJSON)

if (!result.valid) {
  console.error('Validation errors:', result.errors)
} else {
  console.log('Template is valid!')
}
```

### **CLI**

```bash
# Validate all JSON files
npx ssot validate ./templates

# Show resolved plan
npx ssot plan ./templates --out plan.json

# Dev server (coming soon)
npx ssot serve ./templates
```

---

## 📋 **JSON Schema (IDE Autocomplete)**

Add to your JSON files for IDE autocomplete:

```json
{
  "$schema": "https://ssot-ui.dev/schemas/v3/template.json",
  "version": "1.0.0",
  "runtimeVersion": "^3.0.0",
  "name": "my-template",
  "pages": [ ... ]
}
```

**Local development**:

```json
{
  "$schema": "./node_modules/@ssot-ui/schemas/json-schema/template.json"
}
```

---

## 🚨 **Version Handshake** (Redline)

Every template declares required runtime version:

```json
{
  "version": "1.0.0",
  "runtimeVersion": "^3.0.0"
}
```

Runtime **hard-fails** on major version mismatch:
- Template requires v4.x → Runtime is v3.x = ❌ **ERROR**
- Template requires v3.2.x → Runtime is v3.1.x = ⚠️ **WARNING**

---

## 📚 **Schemas Reference**

### **template.json**
Defines pages (list, detail, form, custom) with discriminated unions.

**Page types**: list, detail, form, custom  
**Required fields**: type, route, runtime, model  
**Runtime modes**: server, client, edge

### **data-contract.json**
Whitelists for filterable/sortable fields per model.

**Pagination**: cursor (default) or offset  
**Max page size**: 100 (default)  
**Filterable fields**: Array with allowed operators  
**Sortable fields**: Array of field names

### **capabilities.json**
Available UI components and security policies.

**UI components**: Avatar, Badge, DataTable, Form, etc.  
**Sanitize policy**: basic, strict, rich, custom  
**Security**: enforceGuards (default: true)

### **mappings.json**
User-defined aliases.

**Model mappings**: `{ "post": "BlogPost" }`  
**Field mappings**: `{ "post.title": "blogPost.heading" }`

### **models.json**
Auto-generated from Prisma schema.

**Models**: Array of model definitions  
**Fields**: Type, relations, validation  
**Enums**: Available enum values

### **theme.json**
Design tokens with light/dark mode support.

**Colors**: Semantic scales (primary, neutral, success, error)  
**Spacing**: Consistent scale  
**Typography**: Font families, sizes, weights  
**Modes**: Light/dark with token deltas

### **i18n.json**
Translations per locale.

**Plural rules**: simple or icu  
**Locales**: Array of locale configurations  
**Messages**: Keyed translations

---

## ✅ **Validation Features**

### **Path-Specific Errors**

```
❌ Invalid template.json
  At pages[2].displayFields[1].field:
    Field "post.excerpt" not found
    
  Available fields: title, content, summary, slug
  
  Did you mean: "post.summary"?
```

### **Fuzzy Matching**

Suggestions for typos and close matches.

### **Cross-Schema Validation**

Validates field paths against models.json, checks sanitize policies, verifies filterable fields exist.

### **Rule Validation**

Beyond schema structure:
- HTML fields require sanitize policy
- Forms must use runtime: "client"
- Default locale must exist in locales array

---

## 🧪 **Testing**

```bash
npm test
```

Includes comprehensive tests for:
- All 7 schemas
- Version compatibility
- Discriminated unions
- Cross-schema validation
- Error messages

---

## 📄 **License**

MIT

