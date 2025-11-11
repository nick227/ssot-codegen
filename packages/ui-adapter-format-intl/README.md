# @ssot-ui/adapter-format-intl

**Intl + DOMPurify format adapter for SSOT UI runtime.**

Version: 3.0.0

---

## 📦 **Installation**

```bash
npm install @ssot-ui/adapter-format-intl
```

---

## 🎯 **Usage**

```typescript
import { IntlFormatAdapter } from '@ssot-ui/adapter-format-intl'
import { TemplateRuntime } from '@ssot-ui/runtime'

const formatAdapter = new IntlFormatAdapter('en-US')

export default function App() {
  return (
    <TemplateRuntime
      config={templateConfig}
      adapters={{
        format: formatAdapter,
        // ... other adapters
      }}
    />
  )
}
```

---

## ⚡ **Features**

### **Date Formatting** ✅
Uses Intl.DateTimeFormat for locale-aware dates:
- short, medium, long, full
- relative ("2 hours ago")
- iso (ISO 8601)

### **Number Formatting** ✅
Uses Intl.NumberFormat for locale-aware numbers

### **Currency Formatting** ✅
Uses Intl.NumberFormat with currency style

### **HTML Sanitization** ✅
Uses DOMPurify with policies from capabilities.json:
- strict (no HTML)
- basic (safe tags only)
- rich (full HTML with restrictions)

### **Deterministic** ✅
Same input always produces same output

### **Pure Functions** ✅
No side effects, no mutations

---

## 🔒 **Security**

HTML sanitization policies enforced:
- XSS protection via DOMPurify
- Configurable allowed tags/attributes
- Server-side sanitization

---

## 📄 **License**

MIT

