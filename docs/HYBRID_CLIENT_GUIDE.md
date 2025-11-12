# HybridDataClient Usage Guide

**Version**: 2.0  
**Date**: November 12, 2025  
**Package**: `@ssot/sdk-runtime`  

---

## Overview

`HybridDataClient` is a smart transport router that automatically chooses between HTTP and WebSocket based on:
- Operation type (query vs mutation)
- Subscription status
- Connection availability

**Key Benefit**: UI code stays the same whether using HTTP or WebSocket!

---

## Installation

```bash
npm install @ssot/sdk-runtime
```

**Package exports**:
```typescript
import {
  // Core interfaces
  DataClient,
  
  // Transports
  HTTPTransport,
  WebSocketTransport,
  HybridDataClient,
  
  // Types
  ListResponse,
  QueryParams,
  UpdateMessage
} from '@ssot/sdk-runtime'
```

---

## Basic Usage

### 1. Create Transports

```typescript
import { 
  BaseAPIClient,
  HTTPTransport,
  WebSocketTransport,
  HybridDataClient 
} from '@ssot/sdk-runtime'

// HTTP transport (always available)
const baseClient = new BaseAPIClient({
  baseUrl: 'http://localhost:3000'
})

const httpTransport = new HTTPTransport(baseClient, '/api/messages')

// WebSocket transport (optional)
const wsTransport = new WebSocketTransport(
  'ws://localhost:3001/ws',
  'Message',
  authToken  // Optional auth token
)

// Hybrid client (smart router)
const messageClient = new HybridDataClient(
  httpTransport,
  wsTransport  // Can be undefined for HTTP-only
)
```

---

### 2. Use in Components

```typescript
// React component
function MessagesPage() {
  const [messages, setMessages] = useState([])
  
  useEffect(() => {
    // 1. Initial fetch (HTTP)
    messageClient.list().then(result => {
      setMessages(result.items)
    })
    
    // 2. Subscribe to updates (WebSocket)
    const unsubscribe = messageClient.subscribe?.('list', update => {
      setMessages(prev => {
        switch (update.type) {
          case 'created':
            return [...prev, update.data]
          case 'updated':
            return prev.map(m => m.id === update.id ? update.data : m)
          case 'deleted':
            return prev.filter(m => m.id !== update.id)
          default:
            return prev
        }
      })
    })
    
    return unsubscribe
  }, [])
  
  return <MessageList messages={messages} />
}
```

---

## API Reference

### HybridDataClient

**Constructor**:
```typescript
new HybridDataClient<T>(
  httpTransport: HTTPTransport<T>,
  wsTransport?: WebSocketTransport<T>
)
```

---

### Query Operations

#### `list(params?): Promise<ListResponse<T>>`

Fetch list of records.

**Behavior**:
- If subscribed via WebSocket → Use WS (instant from cache)
- Otherwise → Use HTTP (reliable)

**Example**:
```typescript
const result = await client.list({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  take: 20
})

console.log(result.items)  // Array of records
console.log(result.total)  // Total count
```

---

#### `get(id): Promise<T | null>`

Fetch single record by ID.

**Behavior**:
- If subscribed to item via WebSocket → Use WS
- Otherwise → Use HTTP

**Example**:
```typescript
const message = await client.get('123')
if (message) {
  console.log(message.text)
}
```

---

### Mutation Operations

#### `create(data): Promise<T>`

Create new record.

**Behavior**: Always uses HTTP (reliability)

**Example**:
```typescript
const newMessage = await client.create({
  text: 'Hello, World!',
  senderId: userId
})
```

---

#### `update(id, data): Promise<T>`

Update existing record.

**Behavior**: Always uses HTTP

**Example**:
```typescript
const updated = await client.update('123', {
  text: 'Updated message'
})
```

---

#### `delete(id): Promise<boolean>`

Delete record.

**Behavior**: Always uses HTTP

**Example**:
```typescript
const success = await client.delete('123')
```

---

### Subscription Operations

#### `subscribe(channel, callback): Unsubscribe`

Subscribe to real-time updates.

**Behavior**: Uses WebSocket (if available)

**Channels**:
- `list` - All records
- `item:{id}` - Specific record

**Example**:
```typescript
const unsubscribe = client.subscribe('list', update => {
  console.log(update.type)  // 'created' | 'updated' | 'deleted'
  console.log(update.data)  // Record data
  console.log(update.timestamp)  // Update time
})

// Later: cleanup
unsubscribe()
```

---

#### `onUpdate(id, callback): Unsubscribe`

Subscribe to updates for specific record.

**Example**:
```typescript
const unsubscribe = client.onUpdate('123', updatedMessage => {
  console.log('Message updated:', updatedMessage)
})
```

---

#### `onDelete(id, callback): Unsubscribe`

Subscribe to deletion of specific record.

**Example**:
```typescript
const unsubscribe = client.onDelete('123', () => {
  console.log('Message deleted')
  // Navigate away or show error
})
```

---

## Advanced Patterns

### Pattern 1: HTTP-Only Mode

```typescript
// No WebSocket transport provided
const client = new HybridDataClient(httpTransport)

// Works fine, just no real-time updates
await client.list()
await client.create(data)

// Subscriptions are no-ops
client.subscribe?.('list', callback)  // Does nothing silently
```

---

### Pattern 2: WebSocket-First with Fallback

```typescript
const client = new HybridDataClient(httpTransport, wsTransport)

// Subscribing makes future queries use WebSocket
const unsubscribe = client.subscribe('list', update => {
  // Handle updates
})

// Now list() uses WebSocket (cached, instant)
await client.list()

// Cleanup
unsubscribe()

// Now list() falls back to HTTP
await client.list()
```

---

### Pattern 3: Per-Item Subscriptions

```typescript
// Subscribe to specific message
const messageId = '123'

const unsubscribe = client.subscribe(`item:${messageId}`, update => {
  if (update.type === 'updated') {
    setMessage(update.data)
  } else if (update.type === 'deleted') {
    navigate('/messages')
  }
})
```

---

### Pattern 4: Optimistic Updates

```typescript
async function createMessage(text: string) {
  // Optimistic update
  const tempId = 'temp-' + Date.now()
  const optimistic = { id: tempId, text, createdAt: new Date() }
  
  setMessages(prev => [...prev, optimistic])
  
  try {
    // Real creation via HTTP
    const created = await client.create({ text })
    
    // Replace temp with real
    setMessages(prev => prev.map(m => m.id === tempId ? created : m))
  } catch (error) {
    // Rollback on error
    setMessages(prev => prev.filter(m => m.id !== tempId))
    throw error
  }
}
```

---

## Integration with React Hooks

### Custom Hook

```typescript
function useHybridList<T>(
  client: HybridDataClient<T>,
  params?: QueryParams,
  subscribe = false
) {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    
    // Initial fetch
    client.list(params)
      .then(result => {
        setData(result.items)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err)
        setIsLoading(false)
      })
    
    // Subscribe if requested
    if (subscribe) {
      unsubscribe = client.subscribe?.('list', update => {
        setData(prev => applyUpdate(prev, update))
      })
    }
    
    return unsubscribe
  }, [client, params, subscribe])
  
  return { data, isLoading, error }
}

// Usage
const { data: messages } = useHybridList(messageClient, {}, true)
```

---

## Error Handling

```typescript
try {
  await client.create(data)
} catch (error) {
  if (error.status === 401) {
    // Unauthorized
    redirectToLogin()
  } else if (error.status === 400) {
    // Validation error
    showValidationErrors(error.details)
  } else {
    // Other error
    showError('Failed to create message')
  }
}
```

---

## Performance Tips

### 1. Reuse Client Instances

```typescript
// ❌ Bad: Creates new client every render
function Component() {
  const client = new HybridDataClient(...)  // Don't do this!
}

// ✅ Good: Single client instance
const messageClient = new HybridDataClient(...)

function Component() {
  const { data } = useHybridList(messageClient)
}
```

---

### 2. Batch Subscriptions

```typescript
// ❌ Bad: Multiple subscriptions
client.subscribe('list', callback1)
client.subscribe('list', callback2)
client.subscribe('list', callback3)

// ✅ Good: Single subscription, multiple handlers
client.subscribe('list', update => {
  callback1(update)
  callback2(update)
  callback3(update)
})
```

---

### 3. Cleanup Subscriptions

```typescript
useEffect(() => {
  const unsubscribe = client.subscribe('list', callback)
  
  // ✅ Always cleanup
  return unsubscribe
}, [])
```

---

## TypeScript Support

Full type safety:

```typescript
interface Message {
  id: string
  text: string
  senderId: string
  createdAt: Date
}

const client = new HybridDataClient<Message>(
  httpTransport,
  wsTransport
)

// Fully typed
const messages: ListResponse<Message> = await client.list()
const message: Message | null = await client.get('123')
const created: Message = await client.create({ text: 'Hello' })
```

---

## Testing

### Mock WebSocket

```typescript
const mockWs = {
  subscribe: jest.fn(() => () => {}),
  list: jest.fn(() => Promise.resolve({ items: [], total: 0 }))
} as any

const client = new HybridDataClient(httpTransport, mockWs)
```

---

## Troubleshooting

**Subscriptions not working?**
- Check WebSocket connection: `wsTransport.isConnected`
- Verify server has WebSocket gateway running
- Check browser console for WS errors

**Always using HTTP?**
- Must subscribe first for WS to be used
- Check `client.subscribe` is called before queries

**Memory leaks?**
- Always call `unsubscribe()` in cleanup
- Use React `useEffect` return function

---

## Summary

| Operation | Transport | When |
|-----------|-----------|------|
| `list()` | WS or HTTP | WS if subscribed, else HTTP |
| `get()` | WS or HTTP | WS if subscribed to item, else HTTP |
| `create()` | HTTP | Always (reliability) |
| `update()` | HTTP | Always (reliability) |
| `delete()` | HTTP | Always (reliability) |
| `subscribe()` | WS | If available, else no-op |

**Key Insight**: Mutations always HTTP, queries prefer WS when subscribed.

---

**Package**: `@ssot/sdk-runtime`  
**Export**: `{ HybridDataClient }`  
**Status**: ✅ Production Ready  

