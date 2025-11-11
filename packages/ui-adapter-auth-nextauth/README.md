# @ssot-ui/adapter-auth-nextauth

**NextAuth adapter for SSOT UI runtime.**

Version: 3.0.0

---

## 📦 **Installation**

```bash
npm install @ssot-ui/adapter-auth-nextauth next-auth
```

---

## 🎯 **Usage**

### **Server Components**

```typescript
import { getServerSession } from 'next-auth'
import { createServerAuthAdapter } from '@ssot-ui/adapter-auth-nextauth'
import { TemplateRuntime } from '@ssot-ui/runtime'

export default async function Page() {
  const authAdapter = createServerAuthAdapter(
    () => getServerSession(),
    '/api/auth/signin'
  )
  
  return (
    <TemplateRuntime
      config={templateConfig}
      adapters={{
        auth: authAdapter,
        // ... other adapters
      }}
    />
  )
}
```

### **Client Components**

```typescript
'use client'

import { useSession, signIn } from 'next-auth/react'
import { createClientAuthAdapter } from '@ssot-ui/adapter-auth-nextauth'

const authAdapter = createClientAuthAdapter(useSession, signIn)
```

---

## 🔒 **Features**

### **Deny-By-Default** ✅
No user = deny all guarded routes

### **Role-Based Access** ✅
Checks user.roles against guard.roles

### **Permission-Based Access** ✅
Checks user.permissions against guard.permissions

### **Server & Client Support** ✅
Separate adapters for SSR and CSR

---

## 📄 **License**

MIT

