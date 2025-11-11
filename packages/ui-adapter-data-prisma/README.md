# @ssot-ui/adapter-data-prisma

**Prisma data adapter for SSOT UI runtime.**

Version: 3.0.0

---

## 📦 **Installation**

```bash
npm install @ssot-ui/adapter-data-prisma @prisma/client
```

---

## 🎯 **Usage**

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaDataAdapter } from '@ssot-ui/adapter-data-prisma'
import { TemplateRuntime } from '@ssot-ui/runtime'
import dataContract from './templates/data-contract.json'

const prisma = new PrismaClient()

const dataAdapter = new PrismaDataAdapter(prisma, dataContract, {
  currentUser: { roles: ['user'] }  // Optional: for field-level ACL
})

export default function App() {
  return (
    <TemplateRuntime
      config={templateConfig}
      adapters={{
        data: dataAdapter,
        // ... other adapters
      }}
    />
  )
}
```

---

## ⚡ **Features**

### **Server-Owned Ordering** ✅
Validates all filters and sorts against data-contract.json whitelists:

```typescript
// If data-contract.json says:
{
  "models": {
    "post": {
      "list": {
        "filterable": ["status"],
        "sortable": ["createdAt"]
      }
    }
  }
}

// Then:
// ✅ filter by status - ALLOWED
// ❌ filter by email - REJECTED with error
// ✅ sort by createdAt - ALLOWED
// ❌ sort by password - REJECTED with error
```

### **Field-Level ACL** ✅
Filters fields based on user roles:

```typescript
// If data-contract.json says:
{
  "models": {
    "user": {
      "fields": {
        "email": { "readRoles": ["admin"] },
        "password": { "readRoles": [] }  // Never readable
      }
    }
  }
}

// Then for user without "admin" role:
// - email field removed from response
// - password field never included
```

### **Cursor Pagination** ✅
Efficient pagination for large datasets:

```typescript
// First page
const result = await adapter.list('post', { pageSize: 20 })

// Next page
const result2 = await adapter.list('post', {
  pageSize: 20,
  cursor: result.data.nextCursor
})
```

### **Relation Aggregation** ✅
Prevents N+1 queries by aggregating includes:

```typescript
const result = await adapter.list('post', {
  include: ['author', 'comments']
})

// Executes single query with includes, not N+1
```

### **Error Contract** ✅
Returns Result<T, ErrorModel>, never throws domain errors:

```typescript
const result = await adapter.detail('post', '123')

if (result.ok) {
  console.log('Data:', result.data)
} else {
  console.error('Error:', result.error.code, result.error.message)
}
```

---

## 🔒 **Security**

### **Whitelist Validation**
All filters and sorts validated server-side against data-contract.json.

### **Field-Level Permissions**
Hidden fields never sent to client based on user roles.

### **SQL Injection Prevention**
Uses Prisma query builder, no raw SQL from client params.

### **Query Cost Limits**
Max page size enforced from data-contract.json.

---

## 🧪 **Testing**

```bash
npm test
```

Tests cover:
- List with pagination
- Filtering (valid and invalid)
- Sorting (valid and invalid)
- Detail with relations
- Create/update/delete
- Field-level ACL
- Error handling

---

## 📄 **License**

MIT

