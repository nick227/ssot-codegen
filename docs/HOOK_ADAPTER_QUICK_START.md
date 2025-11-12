# Hook Adapter Quick Start

**Goal:** Get started with hook adapters in 2 minutes.

---

## 🚀 Quick Start

### 1. Generate Hook Adapters

Hook adapters are automatically generated:

```bash
npx ssot-gen ui
```

**Output:**
```
hooks/
├── conversation-adapter.ts
├── message-adapter.ts
├── registry.ts
└── index.ts
```

---

### 2. Use in Components

**Simple Pattern (Recommended):**

```typescript
import { useConversationModel } from '@/hooks/conversation-adapter'

function MyComponent() {
  const { data, isLoading, error } = useConversationModel({ take: 20 })
  
  if (isLoading) return <Spinner />
  if (error) return <Error message={error.message} />
  
  return <div>{data?.map(item => <Card key={item.id} data={item} />)}</div>
}
```

**That's it!** One import, one line, consistent API.

---

## 📚 Common Patterns

### List Component

```typescript
import { useConversationModel } from '@/hooks/conversation-adapter'

export function ConversationList() {
  const { data, isLoading } = useConversationModel({ take: 20 })
  
  return (
    <div>
      {isLoading && <Spinner />}
      {data?.map(conv => <Card key={conv.id} data={conv} />)}
    </div>
  )
}
```

---

### Detail Component

```typescript
import { conversationHooks } from '@/hooks/conversation-adapter'

export function ConversationDetail({ id }: { id: string }) {
  const { data, isPending } = conversationHooks.get(id)
  
  if (isPending) return <Spinner />
  return <div>{data?.title}</div>
}
```

---

### Form Component

```typescript
import { conversationHooks } from '@/hooks/conversation-adapter'

export function ConversationForm({ id }: { id?: string }) {
  const { mutate: create } = conversationHooks.create
  const { mutate: update } = conversationHooks.update
  
  const handleSubmit = (data: any) => {
    id ? update({ id, data }) : create(data)
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

---

### Component Props

```typescript
import { conversationAdapter } from '@/hooks/conversation-adapter'

<DataTable hook={conversationAdapter} />
```

---

## 🎯 Key Benefits

- ✅ **One line** - `useConversationModel({ take: 20 })`
- ✅ **Consistent** - Same API everywhere
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Auto-complete** - IDE support
- ✅ **Lightweight** - Zero overhead

---

## 📖 Full Documentation

See `HOOK_ADAPTER_STRATEGY.md` for complete documentation.

