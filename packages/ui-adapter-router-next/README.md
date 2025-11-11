# @ssot-ui/adapter-router-next

**Next.js router adapter for SSOT UI runtime.**

Version: 3.0.0

---

## 📦 **Installation**

```bash
npm install @ssot-ui/adapter-router-next next
```

---

## 🎯 **Usage**

```typescript
import { NextRouterAdapter } from '@ssot-ui/adapter-router-next'
import { TemplateRuntime } from '@ssot-ui/runtime'

export default function App() {
  return (
    <TemplateRuntime
      config={templateConfig}
      adapters={{
        router: NextRouterAdapter,
        // ... other adapters
      }}
    />
  )
}
```

---

## ⚡ **Features**

- Wraps Next.js App Router
- Link component with prefetch
- useParams/useSearchParams
- navigate() with Result<void>
- Client and server redirect
- Active route checking

---

## 📄 **License**

MIT

