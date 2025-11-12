# WebSocket Configuration Guide

**For**: End users configuring WebSocket support  
**Audience**: Developers using SSOT CodeGen  

---

## 🤔 Do You Need WebSockets?

### Use HTTP Only (Default) For:

- ✅ Admin panels (data changes infrequently)
- ✅ CRUD applications (user-initiated actions only)
- ✅ E-commerce (cart, checkout)
- ✅ Blogs, CMS (content rarely changes while viewing)
- ✅ Dashboards with manual refresh
- ✅ Internal tools (few concurrent users)

**Why**: HTTP is simpler, more reliable, easier to cache, and sufficient for 90% of apps.

---

### Use WebSockets When You Have:

- ✅ **Chat/Messaging** (real-time conversation)
- ✅ **Notifications** (instant alerts)
- ✅ **Collaborative editing** (Google Docs-style)
- ✅ **Live dashboards** (stock prices, analytics)
- ✅ **Multiplayer games**
- ✅ **Live feeds** (social media, activity streams)
- ✅ **IoT dashboards** (sensor data)

**Why**: These features require instant updates without user action.

---

## 📝 Configuration Examples

### Example 1: Chat Application (Full WebSocket)

```typescript
// ssot.config.ts
export default {
  websockets: {
    enabled: true,
    url: 'ws://localhost:3001/ws', // WebSocket endpoint
    
    pubsub: {
      // Real-time models
      models: {
        // Messages need instant updates
        'Message': {
          subscribe: ['list', 'item'],
          broadcast: ['created', 'updated', 'deleted'],
          permissions: {
            list: 'authenticated',           // Any logged-in user
            item: 'isParticipant || isAdmin' // Only chat participants
          }
        },
        
        // Typing indicators
        'TypingIndicator': {
          subscribe: ['list'],
          broadcast: ['created', 'deleted'],
          permissions: {
            list: 'isParticipant'
          }
        },
        
        // User presence
        'Presence': {
          subscribe: ['list'],
          broadcast: ['updated'],
          permissions: {
            list: 'authenticated'
          }
        }
      },
      
      // Custom channels for room-based chat
      channels: {
        'chat:room:{roomId}': {
          events: ['message', 'typing', 'join', 'leave'],
          permission: 'isRoomMember'
        }
      }
    },
    
    // Connection options
    reconnect: {
      maxAttempts: 5,
      backoff: 'exponential' // 1s, 2s, 4s, 8s, 16s
    },
    
    // Performance
    batching: {
      enabled: true,
      flushInterval: 100 // ms
    }
  }
}
```

**Generated Features**:
- ✅ WebSocket client with auto-reconnect
- ✅ Real-time message updates
- ✅ Typing indicators
- ✅ User presence tracking
- ✅ Room-based channels

---

### Example 2: E-commerce with Live Inventory (Hybrid)

```typescript
// ssot.config.ts
export default {
  websockets: {
    enabled: true,
    url: 'ws://localhost:3001/ws',
    
    pubsub: {
      models: {
        // Only inventory needs real-time updates
        'Product': {
          subscribe: ['item'], // Subscribe to individual products
          broadcast: ['updated'], // Only stock updates
          permissions: {
            item: 'true' // Public (anyone can see inventory)
          }
        }
        
        // Orders, Cart, User → HTTP only (no real-time needed)
      }
    }
  }
}
```

**Generated Features**:
- ✅ Real-time inventory updates on product pages
- ✅ "X items left" updates live
- ✅ HTTP for everything else (orders, cart)

---

### Example 3: Admin Panel with Live Activity Feed (Minimal)

```typescript
// ssot.config.ts
export default {
  websockets: {
    enabled: true,
    url: 'ws://localhost:3001/ws',
    
    pubsub: {
      models: {
        // Only activity feed needs real-time
        'ActivityLog': {
          subscribe: ['list'],
          broadcast: ['created'],
          permissions: {
            list: 'isAdmin'
          }
        }
        
        // All other models (User, Product, Order) → HTTP only
      }
    }
  }
}
```

**Generated Features**:
- ✅ Live activity feed on dashboard
- ✅ HTTP for all CRUD operations
- ✅ Minimal WebSocket overhead

---

### Example 4: Notification System (Smart)

```typescript
// ssot.config.ts
export default {
  websockets: {
    enabled: true,
    url: 'ws://localhost:3001/ws',
    
    pubsub: {
      models: {
        'Notification': {
          subscribe: ['list'],
          broadcast: ['created'],
          permissions: {
            // Users only see their own notifications
            list: (user, channel) => {
              return channel === `Notification:list:user:${user.id}`
            }
          }
        }
      },
      
      // User-specific channels
      channels: {
        'user:{userId}:notifications': {
          events: ['new', 'read', 'deleted'],
          permission: 'isOwner'
        }
      }
    }
  }
}
```

**Generated Features**:
- ✅ Per-user notification channels
- ✅ Instant notification delivery
- ✅ Privacy-safe (users only see their own)

---

## 🎛️ Configuration Options Reference

### Top-Level Options

```typescript
interface WebSocketConfig {
  enabled: boolean                    // Enable WebSocket support
  url?: string                        // WebSocket URL (default: auto-detected)
  port?: number                       // WS server port (default: 3001)
  path?: string                       // WS path (default: '/ws')
  
  pubsub: PubSubConfig                // Pub/sub configuration
  reconnect?: ReconnectConfig         // Reconnection settings
  batching?: BatchingConfig           // Update batching
  auth?: AuthConfig                   // Authentication
}
```

### Pub/Sub Configuration

```typescript
interface PubSubConfig {
  models: Record<string, ModelRealtimeConfig>  // Per-model settings
  channels?: Record<string, ChannelConfig>     // Custom channels
}

interface ModelRealtimeConfig {
  subscribe: Array<'list' | 'item'>   // What to subscribe to
  broadcast: Array<                   // What operations to broadcast
    'created' | 'updated' | 'deleted'
  >
  permissions: {                      // Who can subscribe
    list?: PermissionRule
    item?: PermissionRule
  }
}

type PermissionRule = 
  | 'true'                           // Public
  | 'authenticated'                  // Any logged-in user
  | 'isOwner'                        // Resource owner
  | 'isAdmin'                        // Admin only
  | string                           // Expression: 'isOwner || isAdmin'
  | ((user: User, channel: string) => boolean) // Custom function
```

### Reconnection Settings

```typescript
interface ReconnectConfig {
  maxAttempts: number                // Max reconnection attempts (default: 5)
  backoff: 'linear' | 'exponential'  // Backoff strategy (default: exponential)
  baseDelay: number                  // Base delay in ms (default: 1000)
}
```

### Batching Settings

```typescript
interface BatchingConfig {
  enabled: boolean                   // Enable update batching (default: true)
  flushInterval: number              // Flush interval in ms (default: 100)
  maxBatchSize: number               // Max updates per batch (default: 50)
}
```

---

## 🚀 Quick Start

### Step 1: Decide If You Need WebSockets

Ask yourself:
- Do users need to see changes **without refreshing**?
- Do multiple users work on the **same data simultaneously**?
- Is **instant notification** critical to your app?

**If No** → Skip WebSockets, use HTTP only (default)  
**If Yes** → Continue to Step 2

---

### Step 2: Identify Real-Time Models

For each model in your schema, ask:
- Does this data change **while users are viewing it**?
- Do users need to see updates **instantly**?
- Are there **multiple concurrent users** viewing/editing?

**Example**:
```
✅ Message → Real-time (chat messages)
✅ Notification → Real-time (instant alerts)
❌ User → HTTP only (profile changes rare)
❌ Product → HTTP only (or item-level for inventory)
❌ Order → HTTP only (no need for instant updates)
```

---

### Step 3: Configure WebSockets

Create or update `ssot.config.ts`:

```typescript
export default {
  websockets: {
    enabled: true,
    pubsub: {
      models: {
        'Message': {
          subscribe: ['list', 'item'],
          broadcast: ['created', 'updated', 'deleted'],
          permissions: {
            list: 'authenticated',
            item: 'isParticipant'
          }
        }
      }
    }
  }
}
```

---

### Step 4: Generate Code

```bash
pnpm ssot generate
```

**Generated Files**:
```
generated/
├── src/
│   ├── api/                    # REST API (existing)
│   ├── websockets/             # NEW: WebSocket gateway
│   │   ├── gateway.ts
│   │   ├── channels.ts
│   │   └── auth.ts
│   └── sdk/
│       ├── clients/
│       │   ├── http.ts         # HTTP client (existing)
│       │   ├── websocket.ts    # NEW: WebSocket client
│       │   └── hybrid.ts       # NEW: Smart router
│       └── hooks/
│           └── useList.ts      # Updated with WS support
```

---

### Step 5: Start Servers

```bash
pnpm dev
```

**Starts**:
- HTTP server (port 3000)
- WebSocket server (port 3001)
- Auto-configured, ready to use

---

### Step 6: Use in UI (No Changes!)

```typescript
// Components work the same, now with real-time updates
export default function MessagesPage() {
  const { data: messages } = useList('Message')
  
  // Messages update in real-time automatically!
  return <MessageList messages={messages} />
}
```

---

## 🔒 Security Best Practices

### 1. Always Authenticate WebSocket Connections

```typescript
websockets: {
  auth: {
    required: true,                // Require authentication
    tokenParam: 'token',           // Token query parameter
    validateToken: async (token) => {
      // Custom validation
      return await validateJWT(token)
    }
  }
}
```

### 2. Use Granular Permissions

```typescript
'Message': {
  permissions: {
    list: 'authenticated',                    // Any user
    item: (user, channel) => {
      const messageId = channel.split(':')[2]
      return canAccessMessage(user, messageId) // Custom logic
    }
  }
}
```

### 3. Rate Limit Subscriptions

```typescript
websockets: {
  limits: {
    maxSubscriptionsPerClient: 50,  // Prevent abuse
    maxConnectionsPerUser: 5        // Prevent resource exhaustion
  }
}
```

### 4. Filter Sensitive Data

```typescript
'User': {
  broadcast: ['updated'],
  filter: (data, subscriber) => {
    // Don't broadcast passwords, tokens, etc.
    const { password, apiKey, ...safe } = data
    return safe
  }
}
```

---

## 🎯 Decision Tree

```
Do you need WebSockets?
│
├─ YES → Do ALL models need real-time?
│   │
│   ├─ YES (Chat, Collaborative) 
│   │   → Enable for all models
│   │   → Configure full pub/sub
│   │
│   └─ NO (Hybrid app)
│       → Enable for specific models only
│       → Keep others HTTP-only
│
└─ NO → Use HTTP only (default)
    → Skip WebSocket configuration
    → Simpler, more reliable
```

---

## 📊 Performance Considerations

### When to Use `subscribe: ['list']`

**Good for**:
- Activity feeds (< 1000 items)
- Notifications (< 100 items)
- Small chat rooms (< 50 messages)

**Avoid for**:
- Large datasets (> 10,000 items)
- Infinite scroll (use pagination instead)

### When to Use `subscribe: ['item']`

**Good for**:
- Product inventory (single product page)
- Document editing (specific document)
- User profile (specific user)

**Avoid for**:
- List views (use `list` instead)

### Batching Strategy

```typescript
batching: {
  enabled: true,
  flushInterval: 100,     // Batch updates every 100ms
  maxBatchSize: 50        // Max 50 updates per batch
}
```

**Impact**:
- ✅ Reduces UI thrashing
- ✅ Improves performance
- ⚠️ Adds 100ms latency (acceptable for most apps)

---

## 🧪 Testing Your Configuration

### Test 1: Connection

```typescript
// In browser console
const ws = new WebSocket('ws://localhost:3001/ws?token=YOUR_TOKEN')
ws.onopen = () => console.log('Connected!')
ws.onerror = (error) => console.error('Connection failed:', error)
```

### Test 2: Subscription

```typescript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'Message:list'
}))

// Should receive:
// { type: 'subscribed', channel: 'Message:list' }
```

### Test 3: Real-Time Update

```bash
# Create message via API
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello"}'

# WebSocket should broadcast:
# { type: 'update', channel: 'Message:list', data: {...} }
```

---

## 📚 Example Configurations

### Minimal (Notifications Only)

```typescript
export default {
  websockets: {
    enabled: true,
    pubsub: {
      models: {
        'Notification': {
          subscribe: ['list'],
          broadcast: ['created'],
          permissions: { list: 'isOwner' }
        }
      }
    }
  }
}
```

### Medium (Chat + Notifications)

```typescript
export default {
  websockets: {
    enabled: true,
    pubsub: {
      models: {
        'Message': {
          subscribe: ['list', 'item'],
          broadcast: ['created', 'updated', 'deleted'],
          permissions: {
            list: 'authenticated',
            item: 'isParticipant'
          }
        },
        'Notification': {
          subscribe: ['list'],
          broadcast: ['created'],
          permissions: { list: 'isOwner' }
        }
      }
    }
  }
}
```

### Full (Collaborative App)

```typescript
export default {
  websockets: {
    enabled: true,
    pubsub: {
      models: {
        'Document': {
          subscribe: ['item'],
          broadcast: ['updated'],
          permissions: { item: 'isCollaborator' }
        },
        'Comment': {
          subscribe: ['list'],
          broadcast: ['created', 'updated', 'deleted'],
          permissions: { list: 'canViewDocument' }
        },
        'Presence': {
          subscribe: ['list'],
          broadcast: ['updated'],
          permissions: { list: 'authenticated' }
        }
      },
      channels: {
        'document:{docId}:cursor': {
          events: ['move'],
          permission: 'isCollaborator'
        }
      }
    },
    reconnect: {
      maxAttempts: 10,
      backoff: 'exponential'
    },
    batching: {
      enabled: true,
      flushInterval: 50 // Faster for real-time collaboration
    }
  }
}
```

---

## ✅ Summary

**WebSockets are**:
- ✅ Optional (only if you need real-time)
- ✅ Configurable (per-model granularity)
- ✅ Secure (authentication + permissions)
- ✅ Transparent (UI doesn't change)
- ✅ Idiomatic (follows project patterns)

**Start with HTTP, add WebSockets when you need them!**

---

**Next**: See [WEBSOCKET_STRATEGY.md](./WEBSOCKET_STRATEGY.md) for implementation details.

