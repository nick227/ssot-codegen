# WebSocket Integration - Complete Strategy Summary

**Date**: November 12, 2025  
**Status**: Ready for Implementation  
**Estimated Effort**: 5 days  

---

## 🎯 Executive Summary

We've designed a **comprehensive, idiomatic WebSocket integration** for SSOT CodeGen that:

1. ✅ **Optional**: Only generates WS code when needed
2. ✅ **Transparent**: UI layer doesn't care if using HTTP or WebSocket
3. ✅ **Unified Interface**: Common abstraction via `DataClient`
4. ✅ **Hydration**: Initial HTTP fetch, then WS subscriptions
5. ✅ **Two-Way**: Mutations via HTTP (reliable), updates via WS (instant)
6. ✅ **Idiomatic**: Follows existing adapter pattern and project principles

---

## 📁 Documentation Structure

### 1. **WEBSOCKET_STRATEGY.md** (Main Strategy)
**Purpose**: High-level architecture and design decisions  
**Contents**:
- Architecture overview (current vs target state)
- Design principles (transport abstraction, smart routing)
- 5-phase implementation plan
- Security & performance considerations
- Success criteria & timeline

**Read first** for understanding the big picture.

---

### 2. **WEBSOCKET_IMPLEMENTATION_EXAMPLES.md** (Code Examples)
**Purpose**: Concrete TypeScript implementations  
**Contents**:
- Core transport interface (`DataClient`)
- HTTP transport wrapper
- WebSocket transport with caching
- Hybrid client (smart router)
- Updated React hooks (`useList` with subscriptions)
- Server-side WebSocket gateway
- Integration with generated routes

**Read second** for implementation details.

---

### 3. **WEBSOCKET_CONFIGURATION_GUIDE.md** (User Guide)
**Purpose**: End-user configuration and usage  
**Contents**:
- Decision tree: "Do I need WebSockets?"
- Configuration examples (chat, e-commerce, notifications)
- Quick start guide
- Security best practices
- Performance tuning
- Testing instructions

**Read third** for user-facing documentation.

---

## 🏗️ Architecture at a Glance

### Current (HTTP Only)
```
UI Component
  → useList hook
    → BaseModelClient
      → BaseAPIClient (fetch)
        → REST API
```

### New (HTTP + WebSocket)
```
UI Component (UNCHANGED)
  → useList hook (UPDATED: adds subscriptions)
    → HybridDataClient (NEW: smart router)
      ├─→ HTTPTransport (queries & mutations)
      └─→ WebSocketTransport (subscriptions & cache)
        → WebSocket Gateway (NEW: server-side)
```

**Key**: UI components require **zero changes**. Hooks handle everything.

---

## 🎨 Design Principles Followed

### 1. **Adapter Pattern** (Existing Idiom)
Like `BaseAPIClient`, we create transport adapters:
- `HTTPTransport` wraps existing HTTP client
- `WebSocketTransport` implements same interface
- `HybridDataClient` routes between them

**Files**: < 200 lines each ✅

---

### 2. **DRY (Don't Repeat Yourself)**
Single `DataClient` interface for all transports:
```typescript
interface DataClient<T> {
  list(): Promise<ListResponse<T>>
  get(id): Promise<T | null>
  create(data): Promise<T>
  update(id, data): Promise<T>
  delete(id): Promise<boolean>
  subscribe?(channel, callback): Unsubscribe // Optional
}
```

---

### 3. **SRP (Single Responsibility)**
Each class has one job:
- `HTTPTransport`: HTTP requests
- `WebSocketTransport`: WS connections & subscriptions
- `HybridDataClient`: Route between transports
- `WebSocketGateway`: Server-side WS management

---

### 4. **Optional by Default**
No WebSocket code generated unless:
1. User explicitly enables in `ssot.config.ts`, OR
2. Schema contains real-time models (`Message`, `Notification`)

**Fail Fast**: If no WS needed, generate HTTP-only code (existing behavior).

---

### 5. **Progressive Enhancement**
Hooks try WebSocket first, fall back to HTTP:
```typescript
async list() {
  if (ws?.hasSubscription('list')) {
    return ws.list() // Instant from cache
  }
  return http.list() // Reliable fallback
}
```

**Graceful Degradation**: App works without WS, better with WS.

---

## 🔧 Key Implementation Details

### Transport Selection Logic

```typescript
// Queries: Use WS if subscribed (cached), else HTTP
async list(params) {
  return this.ws?.hasSubscription('list')
    ? this.ws.list(params)   // Instant
    : this.http.list(params) // Reliable
}

// Mutations: Always HTTP (reliability)
async create(data) {
  const result = await this.http.create(data)
  // Server broadcasts via WS to other clients
  return result
}

// Subscriptions: WS only
subscribe(channel, callback) {
  return this.ws?.subscribe(channel, callback) ?? (() => {})
}
```

---

### Hook Integration

```typescript
// BEFORE (HTTP only)
export function useList<T>(client: DataClient<T>) {
  useEffect(() => {
    client.list().then(setData)
  }, [client])
  
  return { data }
}

// AFTER (HTTP + WS)
export function useList<T>(client: DataClient<T>, options = {}) {
  useEffect(() => {
    // 1. Initial fetch (HTTP)
    client.list().then(setData)
    
    // 2. Subscribe to updates (WS)
    const unsub = options.subscribe 
      ? client.subscribe?.('list', update => {
          setData(prev => applyUpdate(prev, update))
        })
      : undefined
    
    return unsub
  }, [client, options.subscribe])
  
  return { data }
}
```

**UI components unchanged!**

---

### Server-Side Integration

```typescript
// Generated route handler
router.post('/api/messages', async (req, res) => {
  const message = await prisma.message.create({ data: req.body })
  
  // Broadcast to WebSocket clients
  wsGateway.broadcast('Message:created', {
    type: 'created',
    data: message,
    timestamp: Date.now()
  })
  
  res.json(message)
})
```

**No manual work**: Generator adds broadcast calls automatically.

---

## 📋 Implementation Phases

### Phase 1: Core Transport Abstraction (Day 1)
**Create**:
- `packages/sdk-runtime/src/transport/data-client.ts`
- `packages/sdk-runtime/src/transport/http-transport.ts`
- `packages/sdk-runtime/src/transport/websocket-transport.ts`
- `packages/sdk-runtime/src/transport/hybrid-client.ts`

**Tests**: Unit tests for each transport

---

### Phase 2: SDK Hook Integration (Day 2)
**Update**:
- `packages/sdk-runtime/src/hooks/useList.ts`
- `packages/sdk-runtime/src/hooks/useGet.ts`
- Add subscription logic
- Maintain backward compatibility

**Tests**: Hook tests with WS mocks

---

### Phase 3: Server WebSocket Gateway (Day 3)
**Create**:
- `packages/gen/src/generators/websocket-gateway-generator.ts`
- Generates `generated/src/websockets/gateway.ts`
- Generates `generated/src/websockets/channels.ts`
- Generates `generated/src/websockets/auth.ts`

**Update**:
- Route generators to add broadcast calls

**Tests**: Integration tests with real WS server

---

### Phase 4: Configuration & Code Generation (Day 4)
**Update**:
- `packages/create-ssot-app/src/prompts.ts` (add WS questions)
- `packages/gen/src/generators/sdk-generator.ts` (conditional WS)
- Detection logic for auto-enabling WS

**Create**:
- `ssot.config.ts` schema for WebSocket config

**Tests**: E2E test (generate → run → verify WS works)

---

### Phase 5: Documentation & Polish (Day 5)
**Create**:
- User documentation (already drafted!)
- Example projects (chat, notifications)
- Migration guide (HTTP → WS)

**Update**:
- Main README with WS section
- Generated project README

**Tests**: Documentation examples work

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('HybridDataClient', () => {
  it('uses HTTP when WS unavailable', async () => {
    const client = new HybridDataClient(http)
    await client.list()
    expect(http.list).toHaveBeenCalled()
  })
  
  it('uses WS when subscribed', async () => {
    const client = new HybridDataClient(http, ws)
    client.subscribe('list', () => {})
    await client.list()
    expect(ws.list).toHaveBeenCalled()
  })
})
```

---

### Integration Tests
```typescript
describe('Real-time updates', () => {
  it('updates UI when item created', async () => {
    const { result } = renderHook(() => useList(client))
    
    // Simulate WS message
    wsClient.send({ 
      channel: 'Message:created', 
      data: { id: 1, text: 'Hello' } 
    })
    
    await waitFor(() => {
      expect(result.current.data).toHaveLength(1)
    })
  })
})
```

---

### E2E Tests
```bash
# 1. Generate project with WS enabled
npx create-ssot-app test-ws --preset chat

# 2. Start servers
cd test-ws && pnpm dev

# 3. Verify WS connection
curl http://localhost:3000/health
wscat -c ws://localhost:3001/ws?token=test

# 4. Test real-time updates
curl -X POST http://localhost:3000/api/messages \
  -d '{"text":"Hello"}'
# Verify WS broadcast received
```

---

## 🔐 Security Measures

### 1. Authentication
```typescript
// Client
const ws = new WebSocket(`ws://localhost:3001/ws?token=${authToken}`)

// Server
const user = await authenticateToken(token)
if (!user) ws.close(4401, 'Unauthorized')
```

---

### 2. Authorization
```typescript
// Per-channel permissions
'Message': {
  permissions: {
    list: 'authenticated',
    item: (user, channel) => {
      const messageId = channel.split(':')[2]
      return canAccess(user, messageId)
    }
  }
}
```

---

### 3. Rate Limiting
```typescript
const MAX_SUBSCRIPTIONS_PER_CLIENT = 50
const MAX_CONNECTIONS_PER_USER = 5
```

---

### 4. Data Filtering
```typescript
// Only send what user can see
function broadcast(channel, data) {
  for (const client of clients) {
    const filtered = filterForUser(data, client.user)
    if (filtered) client.send(filtered)
  }
}
```

---

## 📊 Performance Optimizations

### 1. Connection Pooling
Single WS connection per app, reused across all hooks

---

### 2. Batched Updates
Buffer updates, flush every 100ms to prevent UI thrashing

---

### 3. Smart Caching
WS transport caches subscribed data, reduces HTTP requests

---

### 4. Auto-Reconnection
Exponential backoff: 1s, 2s, 4s, 8s, 16s

---

## 📦 Package Changes

### New Packages
None! All within existing packages.

### Modified Packages

**`packages/sdk-runtime`**:
- Add `src/transport/` (new)
- Update `src/hooks/` (subscriptions)
- No breaking changes

**`packages/gen`**:
- Add `src/generators/websocket-gateway-generator.ts` (new)
- Update `src/generators/sdk-generator.ts` (conditional WS)
- Update route generators (broadcast calls)

**`packages/create-ssot-app`**:
- Update prompts (WS questions)
- Add WS detection logic

---

## 🎯 Success Criteria

After implementation, we should have:

✅ **Zero Breaking Changes**: Existing projects work unchanged  
✅ **Optional**: WS code only generated when needed  
✅ **Transparent**: UI components don't know about transport  
✅ **Unified**: Same interface for HTTP and WS  
✅ **Secure**: Authentication, authorization, rate limiting  
✅ **Performant**: Connection pooling, batching, caching  
✅ **Tested**: Unit, integration, E2E coverage  
✅ **Documented**: User guide, examples, migration path  

---

## 🚀 Next Steps

### Immediate (Today)
1. ✅ Review strategy documents (this!)
2. ⏳ Get team approval
3. ⏳ Create GitHub issue/project board

### Week 1 (Days 1-5)
1. Day 1: Implement core transports
2. Day 2: Update SDK hooks
3. Day 3: Generate WS gateway
4. Day 4: Configuration & detection
5. Day 5: Documentation & examples

### Week 2 (Testing & Refinement)
1. Integration testing
2. Performance tuning
3. Security audit
4. Documentation polish
5. Ship! 🎉

---

## 📚 Files Created

1. **`docs/WEBSOCKET_STRATEGY.md`** (12 KB)
   - High-level architecture
   - Implementation phases
   - Security & performance

2. **`docs/WEBSOCKET_IMPLEMENTATION_EXAMPLES.md`** (18 KB)
   - Concrete TypeScript code
   - All key classes
   - Integration examples

3. **`docs/WEBSOCKET_CONFIGURATION_GUIDE.md`** (15 KB)
   - User-facing guide
   - Configuration examples
   - Decision tree & testing

4. **`WEBSOCKET_INTEGRATION_SUMMARY.md`** (this file, 8 KB)
   - Executive summary
   - Quick reference
   - Next steps

**Total**: ~53 KB of comprehensive documentation 📝

---

## 💡 Key Insights

### Why This Approach Works

1. **Idiomatic**: Follows existing patterns (adapters, hooks, generation)
2. **Incremental**: Each phase builds on previous
3. **Safe**: No breaking changes, optional feature
4. **Simple**: DRY/SRP principles, short files
5. **Practical**: Solves real problems (chat, notifications)

---

### Why NOT Other Approaches

❌ **Socket.io**: Too heavy, not idiomatic to our HTTP-first design  
❌ **GraphQL Subscriptions**: Adds complexity, different API paradigm  
❌ **Server-Sent Events (SSE)**: One-way only, no binary support  
❌ **Polling**: Inefficient, high latency  

✅ **Raw WebSocket + Smart Abstraction**: Lightweight, flexible, transparent

---

## 🎓 Learning for Future Features

This WebSocket strategy demonstrates:

1. **Adapter Pattern**: Clean way to add optional features
2. **Progressive Enhancement**: Works without, better with
3. **Transport Abstraction**: UI doesn't care about protocol
4. **Smart Defaults**: Auto-detect when feature needed
5. **Comprehensive Docs**: Strategy + Examples + User Guide

**Apply this pattern** for future features (GraphQL, gRPC, REST alternatives).

---

## 📞 Questions & Feedback

Before implementation, consider:

1. **Scope creep**: Any missing requirements?
2. **Edge cases**: What can go wrong?
3. **Alternatives**: Better approach?
4. **Timeline**: 5 days realistic?
5. **Resources**: Who implements each phase?

**Open to feedback!** This is a living strategy.

---

## ✅ Ready to Proceed

**Status**: ✅ Complete strategy documented  
**Blockers**: None identified  
**Dependencies**: Existing SDK runtime, hooks, generators  
**Risk**: Low (isolated, optional, well-tested)  
**Confidence**: High  

**Let's build it!** 🚀

---

**Last Updated**: November 12, 2025  
**Next Review**: After Phase 1 completion  

