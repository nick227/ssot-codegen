# @ssot-ui/adapter-ui-internal

**UI adapter wrapping existing @ssot-ui components.**

Version: 3.0.0

---

## 📦 **Installation**

```bash
npm install @ssot-ui/adapter-ui-internal
```

---

## 🎯 **Usage**

```typescript
import { InternalUIAdapter } from '@ssot-ui/adapter-ui-internal'
import { TemplateRuntime } from '@ssot-ui/runtime'

export default function App() {
  return (
    <TemplateRuntime
      config={templateConfig}
      adapters={{
        ui: InternalUIAdapter,
        // ... other adapters
      }}
    />
  )
}
```

---

## 📦 **Components Wrapped**

### **From @ssot-ui/shared**
- Avatar
- Badge
- Button
- Card

### **From @ssot-ui/data-table**
- DataTable

### **Simple Implementations**
- Input
- Select
- Checkbox
- Textarea
- Form
- Modal
- Toast
- Skeleton
- Spinner

---

## ✅ **Benefits**

- Reuses existing battle-tested components
- Consistent with @ssot-ui ecosystem
- Small bundle size (~50kb)
- Tailwind CSS compatible

---

## 📄 **License**

MIT

