# WebSocket Integration Strategy

**Date**: November 12, 2025  
**Status**: Design Phase  
**Version**: 1.0.0  

---

## 🎯 Objectives

1. **Optional**: Only include WebSocket code if user's schema requires real-time features
2. **Transparent**: UI layer uses same hooks whether HTTP or WebSocket
3. **Unified Interface**: Common abstraction for both transport types  
4. **Hydration**: Initial data via HTTP, updates via WebSocket
5. **Two-Way**: Mutations via HTTP/WS, subscriptions via WS
6. **Idiomatic**: Follows existing SDK/adapter patterns

---

## 🏗️ Architecture Overview

### Current State (HTTP Only)

```
UI Components
    ↓ (uses hooks)
SDK Hooks (useList, useGet, useCreate, etc.)
    ↓ (calls)
BaseModelClient (list, get, create, update, delete)
    ↓ (uses)
BaseAPIClient (fetch-based HTTP)
    ↓
REST API Endpoints
```

### Target State (HTTP + WebSocket)

```
UI Components
    ↓ (uses hooks - SAME INTERFACE)
SDK Hooks (useList, useGet, useCreate, etc.)
    ↓ (calls)
DataClient <-- NEW: Transport-agnostic abstraction
    ↓ (selects transport)
    ├─> HTTPTransport (existing BaseAPIClient)
    └─> WebSocketTransport <-- NEW
            ↓
            WebSocket API Gateway
```

---

## 📋 Design Principles

### 1. **Transport Abstraction**
Create a `DataClient` interface that abstracts away transport details:

```typescript
interface DataClient<T> {
  // Query operations (can use HTTP or WS)
  list(params?: QueryParams): Promise<ListResponse<T>>
  get(id: string | number): Promise<T | null>
  
  // Mutations (typically HTTP, optionally WS)
  create(data: CreateDTO): Promise<T>
  update(id: string | number, data: UpdateDTO): Promise<T>
  delete(id: string | number): Promise<boolean>
  
  // Real-time subscriptions (WS only)
  subscribe?(channel: string, callback: (data: T) => void): () => void
  onUpdate?(id: string | number, callback: (data: T) => void): () => void
  onDelete?(id: string | number, callback: () => void): () => void
}
```

### 2. **Smart Transport Selection**
Automatically choose transport based on operation:

```typescript
class HybridDataClient<T> implements DataClient<T> {
  constructor(
    private http: HTTPTransport,
    private ws?: WebSocketTransport
  ) {}
  
  // Queries: Use WS if available + subscribed, else HTTP
  async list(params?: QueryParams) {
    if (this.ws?.isConnected && this.hasActiveSubscription('list')) {
      return this.ws.list(params) // Instant from cache
    }
    return this.http.list(params) // Fall back to HTTP
  }
  
  // Mutations: Always HTTP (reliable), broadcast via WS
  async create(data: CreateDTO) {
    const result = await this.http.create(data)
    this.ws?.broadcast('created', result) // Notify other clients
    return result
  }
  
  // Subscriptions: WS only
  subscribe(channel: string, callback: (data: T) => void) {
    if (!this.ws) {
      console.warn('WebSocket not available, subscription ignored')
      return () => {} // No-op
    }
    return this.ws.subscribe(channel, callback)
  }
}
```

### 3. **Hydration Pattern**
Initial load via HTTP, then subscribe to updates:

```typescript
function useList<T>(resource: string, params?: ListParams) {
  const client = useDataClient<T>(resource)
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // 1. Initial HTTP fetch (fast, cached)
    client.list(params).then(result => {
      setData(result.items)
      setIsLoading(false)
    })
    
    // 2. Subscribe to real-time updates (if WS available)
    const unsubscribe = client.subscribe?.(`${resource}:list`, update => {
      setData(prev => applyUpdate(prev, update))
    })
    
    return unsubscribe
  }, [resource, params])
  
  return { data, isLoading }
}
```

### 4. **Pub/Sub Channel Conventions**
Standardized channel naming for consistency:

```
{model}:list           → Broadcast to all list subscribers
{model}:item:{id}      → Updates to specific item
{model}:created        → New item created
{model}:updated:{id}   → Item updated
{model}:deleted:{id}   → Item deleted
```

**User Configuration** (in `ssot.config.ts`):

```typescript
export default {
  websockets: {
    enabled: true,
    pubsub: {
      // User defines which models need real-time
      models: {
        'Message': {
          subscribe: ['list', 'item'],    // Subscribe to these
          broadcast: ['created', 'updated', 'deleted'] // Broadcast these
        },
        'Notification': {
          subscribe: ['list'],
          broadcast: ['created']
        }
        // Models not listed = HTTP only
      },
      
      // Custom channels (optional)
      channels: {
        'chat:room:{roomId}': {
          events: ['message', 'typing', 'join', 'leave']
        }
      }
    }
  }
}
```

---

## 🔧 Implementation Plan

### Phase 1: Core Transport Abstraction (Day 1)

**Create**: `packages/sdk-runtime/src/transport/`

**Files**:
```
transport/
├── data-client.ts           # DataClient interface
├── http-transport.ts        # Wrapper around BaseAPIClient
├── websocket-transport.ts   # WebSocket implementation
├── hybrid-client.ts         # Smart routing between HTTP/WS
└── index.ts                 # Exports
```

**Key Classes**:

```typescript
// data-client.ts
export interface DataClient<T> {
  list(params?: QueryParams): Promise<ListResponse<T>>
  get(id: string | number): Promise<T | null>
  create(data: any): Promise<T>
  update(id: string | number, data: any): Promise<T>
  delete(id: string | number): Promise<boolean>
  
  // Optional real-time methods
  subscribe?(channel: string, callback: (data: T) => void): Unsubscribe
  onUpdate?(id: string | number, callback: (data: T) => void): Unsubscribe
  onDelete?(id: string | number, callback: () => void): Unsubscribe
}

type Unsubscribe = () => void

// http-transport.ts
export class HTTPTransport<T> implements DataClient<T> {
  constructor(private client: BaseAPIClient, private basePath: string) {}
  
  async list(params?: QueryParams) {
    // Existing BaseModelClient.list() logic
  }
  
  async get(id: string | number) {
    // Existing BaseModelClient.get() logic
  }
  
  // ... other CRUD methods
  
  // No subscribe methods (HTTP doesn't support)
}

// websocket-transport.ts
export class WebSocketTransport<T> implements DataClient<T> {
  private ws: WebSocket | null = null
  private cache = new Map<string, T[]>()
  private subscriptions = new Map<string, Set<Callback>>()
  
  constructor(private url: string, private model: string) {
    this.connect()
  }
  
  private connect() {
    this.ws = new WebSocket(this.url)
    this.ws.onmessage = (event) => {
      const { channel, data } = JSON.parse(event.data)
      this.notifySubscribers(channel, data)
    }
  }
  
  async list(params?: QueryParams) {
    // Return from cache if subscribed, else fetch via WS
    const cacheKey = this.getCacheKey('list', params)
    if (this.cache.has(cacheKey)) {
      return { items: this.cache.get(cacheKey)!, total: this.cache.get(cacheKey)!.length }
    }
    
    // Request via WebSocket
    return this.request('list', params)
  }
  
  subscribe(channel: string, callback: (data: T) => void): Unsubscribe {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
      // Send subscribe message
      this.send({ type: 'subscribe', channel })
    }
    
    this.subscriptions.get(channel)!.add(callback)
    
    return () => {
      const subs = this.subscriptions.get(channel)
      subs?.delete(callback)
      if (subs?.size === 0) {
        // Send unsubscribe message
        this.send({ type: 'unsubscribe', channel })
        this.subscriptions.delete(channel)
      }
    }
  }
  
  private notifySubscribers(channel: string, data: any) {
    this.subscriptions.get(channel)?.forEach(cb => cb(data))
  }
}

// hybrid-client.ts
export class HybridDataClient<T> implements DataClient<T> {
  constructor(
    private http: HTTPTransport<T>,
    private ws?: WebSocketTransport<T>
  ) {}
  
  async list(params?: QueryParams) {
    // Prefer WS if available and subscribed
    if (this.ws?.hasSubscription('list')) {
      return this.ws.list(params)
    }
    return this.http.list(params)
  }
  
  async create(data: any) {
    // Always use HTTP for mutations (reliability)
    const result = await this.http.create(data)
    
    // Broadcast via WS if available
    this.ws?.broadcast('created', result)
    
    return result
  }
  
  subscribe(channel: string, callback: (data: T) => void) {
    return this.ws?.subscribe(channel, callback) ?? (() => {})
  }
}
```

---

### Phase 2: SDK Hook Integration (Day 2)

**Update**: `packages/sdk-runtime/src/hooks/` (if exists) or generate new hooks

**Pattern**: Existing hooks already abstract the transport. We just need to:
1. Replace `BaseModelClient` with `HybridDataClient`
2. Add subscription logic to hooks

**Example Hook Update**:

```typescript
// BEFORE (HTTP only)
export function useList<T>(resource: string, params?: ListParams) {
  const client = useModelClient<T>(resource)
  const [data, setData] = useState<T[]>([])
  
  useEffect(() => {
    client.list(params).then(result => {
      setData(result.items)
    })
  }, [resource, params])
  
  return { data, isLoading }
}

// AFTER (HTTP + WS)
export function useList<T>(resource: string, params?: ListParams) {
  const client = useDataClient<T>(resource) // Returns HybridDataClient
  const [data, setData] = useState<T[]>([])
  
  useEffect(() => {
    // Initial fetch (HTTP)
    client.list(params).then(result => {
      setData(result.items)
    })
    
    // Subscribe to updates (WS if available)
    const unsubscribe = client.subscribe?.(`${resource}:list`, update => {
      setData(prev => applyListUpdate(prev, update))
    })
    
    return unsubscribe
  }, [resource, params])
  
  return { data, isLoading }
}

// Helper to apply updates efficiently
function applyListUpdate<T>(items: T[], update: Update): T[] {
  switch (update.type) {
    case 'created':
      return [...items, update.data]
    case 'updated':
      return items.map(item => 
        item.id === update.data.id ? update.data : item
      )
    case 'deleted':
      return items.filter(item => item.id !== update.id)
    default:
      return items
  }
}
```

**No Breaking Changes**: 
- Hooks maintain same signature
- UI components unchanged
- WS is progressive enhancement

---

### Phase 3: Server WebSocket Gateway (Day 3)

**Create**: `packages/gen/src/generators/websocket-gateway-generator.ts`

**Generate**: WebSocket server alongside REST API

**Files Generated**:
```
generated/
├── src/
│   ├── api/           # Existing REST routes
│   └── websockets/    # NEW
│       ├── gateway.ts           # WebSocket server setup
│       ├── channels.ts          # Channel routing
│       ├── auth-middleware.ts   # WS authentication
│       └── pubsub.ts            # Pub/sub implementation
```

**WebSocket Gateway** (`gateway.ts`):

```typescript
import { WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import { parse } from 'url'

export interface WebSocketClient {
  id: string
  user?: User
  subscriptions: Set<string>
  send: (data: any) => void
}

export class WebSocketGateway {
  private wss: WebSocketServer
  private clients = new Map<string, WebSocketClient>()
  
  constructor(private server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    })
    
    this.wss.on('connection', this.handleConnection.bind(this))
  }
  
  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    const clientId = generateId()
    const client: WebSocketClient = {
      id: clientId,
      subscriptions: new Set(),
      send: (data) => ws.send(JSON.stringify(data))
    }
    
    // Authenticate
    const token = parse(req.url, true).query.token as string
    client.user = await authenticateToken(token)
    
    this.clients.set(clientId, client)
    
    ws.on('message', (message) => this.handleMessage(client, message))
    ws.on('close', () => this.handleDisconnect(client))
  }
  
  private handleMessage(client: WebSocketClient, message: any) {
    const { type, channel, data } = JSON.parse(message.toString())
    
    switch (type) {
      case 'subscribe':
        this.subscribe(client, channel)
        break
      case 'unsubscribe':
        this.unsubscribe(client, channel)
        break
      case 'request':
        this.handleRequest(client, channel, data)
        break
    }
  }
  
  private subscribe(client: WebSocketClient, channel: string) {
    // Check permissions
    if (!canSubscribe(client.user, channel)) {
      client.send({ error: 'Unauthorized' })
      return
    }
    
    client.subscriptions.add(channel)
    client.send({ type: 'subscribed', channel })
  }
  
  broadcast(channel: string, data: any) {
    // Broadcast to all clients subscribed to channel
    for (const client of this.clients.values()) {
      if (client.subscriptions.has(channel)) {
        client.send({ channel, data })
      }
    }
  }
}
```

**Channel Router** (`channels.ts`):

```typescript
export function getChannelConfig(model: string): ChannelConfig | null {
  // Generated from ssot.config.ts
  const config = {
    'Message': {
      subscribe: ['list', 'item'],
      broadcast: ['created', 'updated', 'deleted'],
      permissions: {
        list: (user: User) => true,
        item: (user: User, itemId: string) => 
          canAccessMessage(user, itemId)
      }
    },
    'Notification': {
      subscribe: ['list'],
      broadcast: ['created'],
      permissions: {
        list: (user: User) => user.id === '{userId}' // User's own notifications
      }
    }
  }
  
  return config[model] ?? null
}

export function canSubscribe(user: User, channel: string): boolean {
  const [model, operation, id] = channel.split(':')
  const config = getChannelConfig(model)
  
  if (!config?.subscribe?.includes(operation)) {
    return false
  }
  
  const permission = config.permissions?.[operation]
  return permission ? permission(user, id) : false
}
```

**Integration with REST API**:

```typescript
// In generated route handlers
app.post('/api/messages', async (req, res) => {
  const message = await prisma.message.create({ data: req.body })
  
  // Broadcast to WebSocket clients
  wsGateway.broadcast('Message:created', message)
  wsGateway.broadcast(`Message:item:${message.id}`, message)
  
  res.json(message)
})
```

---

### Phase 4: Configuration & Code Generation (Day 4)

**User Configuration** (`ssot.config.ts`):

```typescript
export default {
  websockets: {
    enabled: true,
    port: 3001, // Separate port or same as API
    
    pubsub: {
      // Which models need real-time?
      models: {
        'Message': {
          subscribe: ['list', 'item'],
          broadcast: ['created', 'updated', 'deleted'],
          permissions: {
            list: 'authenticated', // Built-in rules
            item: 'isOwner || isAdmin'
          }
        }
      }
    }
  }
}
```

**Detection Logic** (in `create-ssot-app`):

```typescript
function detectWebSocketNeeds(schema: PrismaSchema): boolean {
  // Auto-detect if schema has models that typically need real-time:
  // - Message, Chat, Notification
  // - Any model with "realtime" in @map
  // - User explicitly configured websockets in ssot.config.ts
  
  const realtimeModels = ['Message', 'Chat', 'Notification', 'Event']
  const hasRealtimeModel = schema.models.some(m => 
    realtimeModels.includes(m.name)
  )
  
  return hasRealtimeModel || config.websockets?.enabled
}
```

**Generator Updates**:

```typescript
// packages/gen/src/generators/sdk-generator.ts
export function generateSDK(schema: ParsedSchema, config: GenConfig) {
  const files = new Map<string, string>()
  
  // Always generate HTTP client
  files.set('client/http-client.ts', generateHTTPClient(schema))
  
  // Conditionally generate WebSocket client
  if (config.websockets?.enabled) {
    files.set('client/ws-client.ts', generateWSClient(schema))
    files.set('client/hybrid-client.ts', generateHybridClient(schema))
  }
  
  // Generate model clients (use Hybrid if WS enabled)
  for (const model of schema.models) {
    const clientType = config.websockets?.enabled ? 'HybridDataClient' : 'HTTPTransport'
    files.set(`models/${model.name.toLowerCase()}.ts`, 
      generateModelClient(model, clientType)
    )
  }
  
  return files
}
```

---

### Phase 5: UI Component Integration (Day 5)

**No Changes Required!** 

Existing components use hooks like `useList`, `useGet` which now automatically:
1. Fetch initial data via HTTP (fast)
2. Subscribe to updates via WS (if available)
3. Apply updates in real-time

**Example Component** (unchanged):

```typescript
// app/admin/messages/page.tsx (UNCHANGED)
export default function MessagesPage() {
  const { data: messages, isLoading } = useList('Message')
  
  return (
    <DataTable
      data={messages}
      columns={[...]}
      loading={isLoading}
    />
  )
}
```

**What happens under the hood**:
1. `useList` calls `HybridDataClient.list()`
2. Initial fetch via HTTP (cached)
3. Subscribe to `Message:list` channel
4. When message created elsewhere → WS update → table updates automatically
5. No refetch, no polling, just works!

---

## 📦 Package Structure

```
packages/
├── sdk-runtime/
│   └── src/
│       ├── transport/              # NEW
│       │   ├── data-client.ts
│       │   ├── http-transport.ts
│       │   ├── websocket-transport.ts
│       │   └── hybrid-client.ts
│       ├── client/
│       │   ├── base-client.ts      # Existing HTTP
│       │   └── ws-client.ts        # NEW (optional)
│       └── hooks/                  # NEW (or update existing)
│           ├── useList.ts
│           ├── useGet.ts
│           └── useCreate.ts
│
├── gen/
│   └── src/
│       └── generators/
│           ├── websocket-gateway-generator.ts  # NEW
│           ├── sdk-generator.ts                # Updated
│           └── ui-generator.ts                 # No changes needed
│
└── create-ssot-app/
    └── src/
        ├── prompts.ts              # Add WS questions
        └── ui-generator.ts         # No changes needed
```

---

## 🎨 User Experience

### Scenario 1: No WebSockets Needed (E-commerce)

**User runs**:
```bash
npx create-ssot-app my-shop --preset ecommerce
```

**Prompt**:
```
? Does your app need real-time features? (y/N) N
```

**Generated**: HTTP-only SDK, no WS code

---

### Scenario 2: Real-Time Chat App

**User runs**:
```bash
npx create-ssot-app my-chat --preset chat
```

**Auto-detected**: Schema has `Message` model → WS enabled automatically

**OR Prompt**:
```
? Detected Message model. Enable real-time WebSockets? (Y/n) Y
? Which models need real-time updates?
  [x] Message (live chat)
  [x] Notification (live notifications)
  [ ] User (static data)
```

**Generated**: 
- HTTP + WebSocket transports
- Hybrid data clients
- WebSocket gateway
- Updated hooks with subscriptions

**User experience in app**:
```typescript
// Messages update in real-time, no code changes needed!
const { data: messages } = useList('Message')

// Notifications pop up instantly
const { data: notifications } = useList('Notification')
```

---

## 🔐 Security Considerations

### 1. **Authentication**
WebSocket connections must authenticate:

```typescript
// Client sends token on connect
const ws = new WebSocket(`ws://localhost:3001/ws?token=${authToken}`)

// Server validates
const user = await authenticateToken(token)
if (!user) {
  ws.close(4401, 'Unauthorized')
}
```

### 2. **Authorization**
Channel subscriptions check permissions:

```typescript
function canSubscribe(user: User, channel: string): boolean {
  const [model, operation, id] = channel.split(':')
  
  // Model-level permissions
  if (model === 'Message' && operation === 'list') {
    return user.authenticated // Any authenticated user
  }
  
  if (model === 'Message' && operation === 'item') {
    return isOwner(user, id) || isAdmin(user)
  }
  
  return false
}
```

### 3. **Rate Limiting**
Prevent subscription abuse:

```typescript
const MAX_SUBSCRIPTIONS_PER_CLIENT = 50

function subscribe(client: WebSocketClient, channel: string) {
  if (client.subscriptions.size >= MAX_SUBSCRIPTIONS_PER_CLIENT) {
    client.send({ error: 'Too many subscriptions' })
    return
  }
  // ...
}
```

### 4. **Data Filtering**
Only broadcast what user can see:

```typescript
function broadcast(channel: string, data: any) {
  for (const client of this.clients.values()) {
    if (client.subscriptions.has(channel)) {
      // Filter data based on user permissions
      const filtered = filterForUser(data, client.user)
      if (filtered) {
        client.send({ channel, data: filtered })
      }
    }
  }
}
```

---

## 📊 Performance Considerations

### 1. **Connection Pooling**
Reuse WebSocket connections across hooks:

```typescript
// Singleton WebSocket connection per app
const wsManager = new WebSocketManager()

export function useDataClient<T>(resource: string) {
  const ws = wsManager.getConnection() // Reused across hooks
  return new HybridDataClient(new HTTPTransport(...), ws)
}
```

### 2. **Batched Updates**
Buffer updates to prevent UI thrashing:

```typescript
class WebSocketTransport {
  private updateBuffer: Update[] = []
  private flushTimer?: NodeJS.Timeout
  
  private enqueueUpdate(update: Update) {
    this.updateBuffer.push(update)
    
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushUpdates()
      }, 100) // Flush every 100ms
    }
  }
  
  private flushUpdates() {
    const updates = this.updateBuffer
    this.updateBuffer = []
    this.flushTimer = undefined
    
    // Notify all subscribers at once
    this.notifySubscribers(updates)
  }
}
```

### 3. **Automatic Reconnection**
Handle disconnections gracefully:

```typescript
class WebSocketTransport {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    }
  }
  
  private handleConnect() {
    this.reconnectAttempts = 0
    // Resubscribe to all channels
    this.resubscribeAll()
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('HybridDataClient', () => {
  it('uses HTTP when WS not available', async () => {
    const http = new HTTPTransport(...)
    const client = new HybridDataClient(http)
    
    const result = await client.list()
    expect(http.list).toHaveBeenCalled()
  })
  
  it('uses WS when subscribed', async () => {
    const http = new HTTPTransport(...)
    const ws = new WebSocketTransport(...)
    const client = new HybridDataClient(http, ws)
    
    client.subscribe('list', () => {})
    const result = await client.list()
    
    expect(ws.list).toHaveBeenCalled()
    expect(http.list).not.toHaveBeenCalled()
  })
})
```

### Integration Tests

```typescript
describe('Real-time updates', () => {
  it('updates UI when item created via WS', async () => {
    const { result } = renderHook(() => useList('Message'))
    
    // Wait for initial load
    await waitFor(() => expect(result.current.data).toHaveLength(5))
    
    // Simulate WS message
    wsClient.send({ 
      channel: 'Message:created', 
      data: { id: 6, text: 'Hello' } 
    })
    
    // UI updates automatically
    await waitFor(() => expect(result.current.data).toHaveLength(6))
  })
})
```

---

## 📚 Documentation for Users

### Quick Start

**1. Enable WebSockets** (`ssot.config.ts`):

```typescript
export default {
  websockets: {
    enabled: true,
    models: {
      'Message': {
        subscribe: ['list', 'item'],
        broadcast: ['created', 'updated', 'deleted']
      }
    }
  }
}
```

**2. Generate code**:

```bash
pnpm ssot generate
```

**3. Start servers**:

```bash
pnpm dev      # Starts both HTTP and WS servers
```

**4. Use in UI** (no changes needed):

```typescript
// Real-time messages - just works!
const { data: messages } = useList('Message')
```

---

## 🎯 Success Criteria

✅ **Optional**: No WS code generated if not needed  
✅ **Transparent**: Existing hooks/components work unchanged  
✅ **Unified**: Same interface for HTTP and WS  
✅ **Hydration**: Initial HTTP, then WS updates  
✅ **Two-Way**: Mutations via HTTP, subscriptions via WS  
✅ **Idiomatic**: Follows adapter pattern, DRY/SRP principles  
✅ **Secure**: Authentication, authorization, rate limiting  
✅ **Performant**: Connection pooling, batched updates, reconnection  
✅ **Testable**: Unit and integration test coverage  

---

## 📅 Timeline

**Total**: 5 days

- **Day 1**: Core transport abstraction (DataClient, HTTPTransport, WebSocketTransport)
- **Day 2**: Hook integration (update useList, useGet, etc.)
- **Day 3**: Server WebSocket gateway generator
- **Day 4**: Configuration detection and code generation
- **Day 5**: Testing, documentation, examples

---

## 🚀 Next Steps

1. **Review** this strategy with team
2. **Prototype** core abstractions (Day 1 work)
3. **Validate** with simple example (Message model)
4. **Iterate** based on feedback
5. **Implement** remaining phases
6. **Document** for users
7. **Ship** 🎉

---

**Status**: ✅ Ready for implementation  
**Blockers**: None  
**Dependencies**: Existing SDK runtime, hooks, generator pipeline  

