# Integration Architecture - How Everything Wires Together

**Complete guide to SSOT's integrated system architecture**

---

## 🎯 Overview

SSOT uses a **layered architecture** where each layer builds on the previous:

```
Layer 7: UI Templates (Pages, Layouts, Components)
Layer 6: React Hooks (Data Management)
Layer 5: WebSocket (Real-time Updates)
Layer 4: Plugins (Features: AI, Auth, Storage)
Layer 3: SDK (Type-safe API client)
Layer 2: API (Controllers, Services, Routes)
Layer 1: Database (Prisma Schema)
```

Each layer is **code-generated** from your schema + configuration files.

---

## 📋 Developer Input

Developers provide **3 configuration files**:

```
my-project/
├── schema.prisma           # Database schema with annotations
├── ssot.config.ts          # API + Plugin configuration
└── ssot.ui.config.ts       # UI configuration
```

---

## 🏗️ Complete Data Flow

### Example: AI Chat Application

#### 1. Define Schema (Layer 1)

```prisma
model Message {
  id             String       @id @default(cuid())
  content        String
  role           MessageRole  @default(USER)
  conversationId String
  createdAt      DateTime     @default(now())
  
  /// @realtime(subscribe: ["list"], broadcast: ["created"])
  /// Real-time messages - broadcast instantly
}

model Conversation {
  id          String    @id @default(cuid())
  title       String
  messages    Message[]
  systemPrompt String?
  model       String?   // AI model to use
  
  /// @realtime(subscribe: ["list", "get"], broadcast: ["created", "updated"])
}
```

**Annotations power:**
- @@realtime → WebSocket generation
- Field types → Form validation
- Relations → Include options in SDK

#### 2. Configure API + Plugins (Layer 2-4)

```typescript
// ssot.config.ts
import { OpenAIPlugin, ChatPlugin } from '@ssot-codegen/gen'

export default {
  framework: 'fastify',
  
  // Plugins generate services, controllers, routes
  plugins: [
    // AI Provider
    new OpenAIPlugin({
      defaultModel: 'gpt-4-turbo',
      enableUsageTracking: true
    }),
    
    // Chat Orchestration
    new ChatPlugin({
      enableWebSocket: true,
      contextWindow: 20
    })
  ],
  
  // WebSocket configuration
  websocket: {
    enabled: true,
    port: 3001,
    pubsub: {
      models: {
        Message: {
          subscribe: ['list'],
          broadcast: ['created', 'updated', 'deleted']
        },
        Conversation: {
          subscribe: ['list', 'get'],
          broadcast: ['created', 'updated']
        }
      }
    }
  },
  
  // React hooks configuration
  hooks: {
    frameworks: ['react'],
    generateTests: true
  }
}
```

**Generates:**
- ✅ API endpoints (`/api/chat/:id/message`)
- ✅ Chat service (AI + storage orchestration)
- ✅ WebSocket gateway (real-time messaging)
- ✅ Type-safe SDK
- ✅ React Query hooks

#### 3. Configure UI (Layer 6-7)

```typescript
// ssot.ui.config.ts
export default {
  theme: {
    colors: { primary: '#7c3aed' },
    darkMode: true
  },
  
  pages: [
    {
      path: 'chats/[id]',
      type: 'custom',
      sections: [{
        type: 'custom',
        components: [{
          type: 'ChatInterface',
          props: { conversationId: 'params.id' }
        }]
      }]
    }
  ],
  
  generation: {
    crudPages: {
      enabled: true,
      models: ['Conversation', 'Message']
    }
  }
}
```

**Generates:**
- ✅ Chat UI components
- ✅ Page routes
- ✅ Layout templates
- ✅ Navigation structure

#### 4. Generated Components Use Everything

```tsx
// Generated: src/chat/ui/ChatInterface.tsx

'use client'

// Layer 6: React Hooks (Data + State)
import { useChat } from '../react/useChat'
import { useChatWebSocket } from '../react/useChatWebSocket'

// Layer 7: UI Components
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

export function ChatInterface({ conversationId }) {
  // Hook connects to Layer 3 (SDK) + Layer 5 (WebSocket)
  const { messages, isLoading, sendMessage } = useChat(conversationId)
  
  // WebSocket hook connects to Layer 5 (real-time)
  useChatWebSocket(conversationId)
  
  return (
    <div className="flex flex-col h-screen">
      <MessageList messages={messages || []} />
      <MessageInput onSend={sendMessage} />
    </div>
  )
}
```

---

## 🔄 Request/Response Flow

### Sending a Message

```
[Frontend] User types "Hello AI"
    ↓
[Layer 7] MessageInput component
    ↓
[Layer 6] useChat hook
    ├─ Optimistic update (show message immediately)
    └─ Call mutation
    ↓
[Layer 5] WebSocket emit('send-message')
    ↓
[Backend] WebSocket Gateway receives
    ↓
[Layer 4] ChatPlugin.sendMessage()
    ├─ Save user message (Prisma)
    ├─ Get conversation history
    ├─ Call OpenAI plugin
    │   ↓
    │   [OpenAI API] GPT-4 processes
    │   ↓
    │   Returns AI response
    ├─ Save AI message (Prisma)
    └─ Update conversation timestamp
    ↓
[Layer 5] WebSocket broadcast to room
    ├─ Emit 'message' (user message)
    └─ Emit 'message' (AI response)
    ↓
[Layer 6] useChatWebSocket receives
    ↓
[Layer 6] React Query cache updated
    ↓
[Layer 7] MessageList re-renders
    ↓
[Frontend] User sees AI response!
```

**Total time:** ~1-2 seconds (including AI processing)

---

## 🧩 Plugin System Integration

### How Plugins Wire In

```typescript
// Plugin generates files
class ChatPlugin {
  generate(context) {
    return {
      files: Map<string, string>,        // Generated code
      routes: RouteDefinition[],         // API routes
      middleware: Middleware[],          // Express/Fastify middleware
      envVars: Record<string, string>,   // Environment variables
      packageJson: { dependencies }      // npm packages
    }
  }
}
```

**Plugin output is merged into generation:**

```
generated/
├── src/
│   ├── chat/              ← ChatPlugin.files
│   ├── ai/                ← OpenAIPlugin.files
│   ├── routes/
│   │   └── chat.routes.ts ← ChatPlugin.routes
│   └── middleware/        ← ChatPlugin.middleware
└── package.json           ← ChatPlugin.packageJson merged
```

### Plugin Dependencies

```typescript
// Plugins can depend on each other
class ChatPlugin {
  requirements = {
    plugins: ['openai'],  // Requires OpenAI plugin
    models: ['Conversation', 'Message']
  }
}
```

Generator validates dependencies before generation.

---

## 🔌 Hook System Integration

### Generated Hooks Structure

```
gen/sdk/
├── core/
│   └── queries/
│       ├── message-queries.ts      # Framework-agnostic
│       └── conversation-queries.ts
├── react/
│   ├── models/
│   │   ├── use-message.ts          # React Query hooks
│   │   └── use-conversation.ts
│   └── provider.tsx                # SDKProvider + QueryClient
└── index.ts
```

### Hook → SDK → API Flow

```typescript
// Generated hook
export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messageQueries.list({ where: { conversationId } })
  })
}

// messageQueries uses SDK
const messageQueries = {
  list: (query) => sdk.message.findMany(query)
}

// SDK calls API
sdk.message.findMany()
  ↓
  fetch('/api/messages', { method: 'GET', ... })
  ↓
  Backend API endpoint
  ↓
  Prisma query
  ↓
  Database
```

---

## 📡 WebSocket Integration

### How Real-time Works

#### Server Side (Auto-generated)

```typescript
// WebSocket Gateway (generated from @@realtime annotations)
io.on('connection', (socket) => {
  // Subscribe to model updates
  socket.on('subscribe:message', ({ conversationId }) => {
    socket.join(`message:${conversationId}`)
  })
  
  // Broadcast on create/update/delete
  prisma.$on('message:created', (message) => {
    io.to(`message:${message.conversationId}`).emit('update', {
      type: 'created',
      model: 'message',
      data: message
    })
  })
})
```

#### Client Side (Auto-generated)

```typescript
// WebSocket hook (generated)
export function useChatWebSocket(conversationId: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    socket.emit('subscribe:message', { conversationId })
    
    socket.on('update', ({ type, model, data }) => {
      if (model === 'message' && type === 'created') {
        queryClient.setQueryData(
          ['messages', conversationId],
          (old: any[]) => [...old, data]
        )
      }
    })
    
    return () => socket.off('update')
  }, [conversationId])
}
```

---

## 🎨 UI Component Integration

### Component Hierarchy

```tsx
<DashboardLayout>               {/* Layer 7: Layout */}
  <AppHeader />                 {/* Generated from navigation config */}
  <AppSidebar />                {/* Generated from navigation config */}
  
  <ChatInterface>               {/* Custom component */}
    <MessageList>               {/* Layer 7: UI Component */}
      {messages.map(m =>        /* Layer 6: Data from useChat hook */
        <MessageBubble>         {/* Layer 7: UI Component */}
          {m.content}           {/* Layer 1: Database data */}
        </MessageBubble>
      )}
    </MessageList>
    
    <MessageInput               /* Layer 7: UI Component */}
      onSend={sendMessage}      {/* Layer 6: Hook function */}
    />                          {/* ↓ Layer 5: WebSocket */}
  </ChatInterface>              {/* ↓ Layer 4: Chat Plugin */}
                                {/* ↓ Layer 3: SDK */}
</DashboardLayout>              {/* ↓ Layer 2: API */}
                                {/* ↓ Layer 1: Database */}
```

### Data Flow in Components

```typescript
// User sends message
MessageInput.onSend("Hello")
    ↓
useChat.sendMessage("Hello")
    ↓
useMutation.mutate({ content: "Hello" })
    ↓
SDK.message.create({ content: "Hello", role: 'USER' })
    ↓
fetch('/api/messages', { method: 'POST', body: {...} })
    ↓
ChatController.sendMessage()
    ↓
ChatService.sendMessage()
    ├─ Prisma.message.create()      (Save user message)
    ├─ OpenAI.chat()                (Get AI response)
    ├─ Prisma.message.create()      (Save AI message)
    └─ WebSocket.broadcast()        (Notify clients)
    ↓
useChatWebSocket receives update
    ↓
React Query cache updated
    ↓
MessageList re-renders
    ↓
User sees AI response!
```

---

## 📊 Complete System Map

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPER INPUT                          │
├─────────────────────────────────────────────────────────────┤
│ • schema.prisma       (Database + Annotations)              │
│ • ssot.config.ts      (API + Plugins)                       │
│ • ssot.ui.config.ts   (UI + Pages)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    CODE GENERATION                          │
├─────────────────────────────────────────────────────────────┤
│ Parser → Analyzer → Generators → Builders → Writers         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: DATABASE                        │
├─────────────────────────────────────────────────────────────┤
│ Prisma Client → Database → Models                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 2: API                             │
├─────────────────────────────────────────────────────────────┤
│ Controllers → Services → Routes → Middleware                │
│ • Generated from schema                                     │
│ • Plugin services integrated                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 3: SDK                             │
├─────────────────────────────────────────────────────────────┤
│ Type-safe Client → fetch() → Backend API                    │
│ • Generated from schema                                     │
│ • Typed: model.findMany(), model.create(), etc.             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 4: PLUGINS                         │
├─────────────────────────────────────────────────────────────┤
│ OpenAI → Chat → Storage → Auth → Email → Search            │
│ • Each plugin generates services, routes, types             │
│ • Plugins compose together                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 5: WEBSOCKET                       │
├─────────────────────────────────────────────────────────────┤
│ Gateway → Rooms → Pub/Sub → Client                          │
│ • Generated from @@realtime annotations                     │
│ • Auto-broadcasts on create/update/delete                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 6: HOOKS                           │
├─────────────────────────────────────────────────────────────┤
│ React Query → Cache → Optimistic Updates → Real-time        │
│ • useMessage(), useConversation(), etc.                     │
│ • WebSocket integration                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 7: UI                              │
├─────────────────────────────────────────────────────────────┤
│ Pages → Layouts → Components                                │
│ • Auto-generated CRUD pages                                 │
│ • Custom pages from config                                  │
│ • Smart components (DataTable, Form)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 Plugin Integration Points

### Plugin Lifecycle

```typescript
class ChatPlugin {
  // 1. Requirements
  requirements = {
    models: ['Conversation', 'Message'],
    envVars: ['OPENAI_API_KEY'],
    dependencies: { 'openai': '^4.0.0' },
    plugins: ['openai']  // Depends on OpenAI plugin
  }
  
  // 2. Validation (before generation)
  validate(context: PluginContext) {
    // Check schema has required models
    // Check environment variables
    // Return errors/warnings
  }
  
  // 3. Generation
  generate(context: PluginContext) {
    return {
      files: Map<string, string>,      // Generated code
      routes: RouteDefinition[],       // API routes
      middleware: Middleware[],        // Express/Fastify middleware
      envVars: {},                     // .env variables
      packageJson: { dependencies }    // npm packages
    }
  }
  
  // 4. Health Check (runtime)
  healthCheck(context: PluginContext) {
    // Return checks to validate plugin works
  }
}
```

### Plugin Composition

Plugins can use other plugins:

```typescript
// ChatPlugin uses OpenAIPlugin
class ChatPlugin {
  generate(context) {
    // Import OpenAI provider generated by OpenAIPlugin
    const code = `
      import { openaiProvider } from '@/ai/providers/openai.provider'
      
      export async function sendMessage(content: string) {
        const response = await openaiProvider.chat([...])
        return response
      }
    `
    
    return { files: new Map([['chat.service.ts', code]]) }
  }
}
```

---

## 📡 WebSocket Integration Points

### 1. Schema Annotation

```prisma
model Message {
  /// @realtime(subscribe: ["list"], broadcast: ["created", "updated"])
}
```

### 2. Generated Gateway

```typescript
// Auto-generated from annotation
io.on('connection', (socket) => {
  socket.on('subscribe:message', ({ conversationId }) => {
    socket.join(`message:${conversationId}`)
  })
})

// Prisma middleware (auto-generated)
prisma.$use(async (params, next) => {
  const result = await next(params)
  
  if (params.model === 'Message' && params.action === 'create') {
    io.to(`message:${result.conversationId}`).emit('update', {
      type: 'created',
      model: 'message',
      data: result
    })
  }
  
  return result
})
```

### 3. Generated Client Hook

```typescript
// Auto-generated WebSocket hook
export function useRealtimeMessages(conversationId: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    socket.emit('subscribe:message', { conversationId })
    
    socket.on('update', (update) => {
      // Update React Query cache
      queryClient.setQueryData(['messages'], (old) => [...old, update.data])
    })
  }, [conversationId])
}
```

---

## 🎯 Hook System Integration

### Generated Hook Structure

```typescript
// Core queries (framework-agnostic)
export const messageQueries = {
  all: {
    list: (query) => ({
      queryKey: ['messages', query],
      queryFn: () => sdk.message.findMany(query)
    }),
    get: (id) => ({
      queryKey: ['message', id],
      queryFn: () => sdk.message.findUnique({ where: { id } })
    })
  }
}

// React adapter (wraps core queries)
export function useMessages(query) {
  return useQuery(messageQueries.all.list(query))
}

export function useMessage(id) {
  return useQuery(messageQueries.all.get(id))
}

// Mutations
export function useCreateMessage(options) {
  return useMutation({
    mutationFn: (data) => sdk.message.create({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages'])
    },
    ...options
  })
}
```

### WebSocket + Hooks Integration

```typescript
// Hooks automatically integrate with WebSocket
export function useMessages(conversationId: string) {
  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => sdk.message.findMany({ where: { conversationId } })
  })
  
  // Auto-subscribe to WebSocket updates
  useRealtimeMessages(conversationId)
  
  return query
}
```

---

## 🎨 UI Template Integration

### How Templates Use Plugins + Hooks

```typescript
// UI Config references plugin components
pages: [{
  path: 'chats/[id]',
  sections: [{
    components: [{
      type: 'ChatInterface',  // Generated by ChatPlugin
      props: { conversationId: 'params.id' }
    }]
  }]
}]

// Generated ChatInterface component uses:
import { useChat } from '@/chat/react/useChat'           // Hook (Layer 6)
import { useChatWebSocket } from '@/chat/react/useWebSocket' // WebSocket (Layer 5)

function ChatInterface({ conversationId }) {
  const { messages, sendMessage } = useChat(conversationId)
  useChatWebSocket(conversationId)
  
  return (...)
}
```

---

## 🚀 Complete Integration Example

### Files Developer Provides

```typescript
// 1. schema.prisma
model Message {
  content String
  /// @realtime(broadcast: ["created"])
}

// 2. ssot.config.ts
export default {
  plugins: [new OpenAIPlugin(), new ChatPlugin()],
  websocket: { enabled: true }
}

// 3. ssot.ui.config.ts
export default {
  pages: [{
    path: 'chats/[id]',
    sections: [{ components: [{ type: 'ChatInterface' }] }]
  }]
}
```

### Generated Output

```
generated/
├── src/
│   ├── ai/
│   │   └── providers/openai.provider.ts    # OpenAI Plugin
│   ├── chat/
│   │   ├── chat.service.ts                 # Chat Plugin
│   │   ├── chat.gateway.ts                 # Chat Plugin + WebSocket
│   │   ├── react/useChat.ts                # Chat Plugin + Hooks
│   │   └── ui/ChatInterface.tsx            # Chat Plugin + UI
│   ├── websocket/
│   │   └── gateway.ts                      # From @@realtime
│   ├── gen/
│   │   ├── sdk/                            # SDK generation
│   │   └── hooks/react/                    # Hooks generation
│   └── app/
│       └── chats/[id]/page.tsx             # UI generation
```

### Runtime Integration

```typescript
// Page component
'use client'

import { ChatInterface } from '@/chat/ui/ChatInterface'

export default function Page({ params }) {
  return <ChatInterface conversationId={params.id} />
}

// ChatInterface component
import { useChat } from '@/chat/react/useChat'
import { useChatWebSocket } from '@/chat/react/useChatWebSocket'

function ChatInterface({ conversationId }) {
  const { messages, sendMessage } = useChat(conversationId)
  useChatWebSocket(conversationId)
  
  return (...)
}

// useChat hook
function useChat(conversationId) {
  const { data: messages } = useMessages(conversationId)  // React Query
  const { mutate: sendMessage } = useCreateMessage()
  return { messages, sendMessage }
}

// useChatWebSocket hook
function useChatWebSocket(conversationId) {
  useEffect(() => {
    socket.emit('subscribe:message', { conversationId })
    socket.on('update', updateCache)
  }, [conversationId])
}
```

**Everything connects automatically!** 🔌

---

## ✅ Summary

### What Makes This Powerful

1. **Single Source of Truth** - Schema defines everything
2. **Annotations Drive Generation** - @@realtime → WebSocket code
3. **Plugins Compose** - ChatPlugin + OpenAIPlugin work together
4. **Hooks Abstract Complexity** - useChat() hides SDK + WebSocket
5. **UI Templates Package Everything** - Complete pages from config
6. **Type Safety Throughout** - TypeScript end-to-end

### Developer Experience

**What they write:**
- 50 lines of schema
- 30 lines of plugin config
- 50 lines of UI config

**What they get:**
- 10,000+ lines of generated code
- Complete working application
- Type-safe from database to UI
- Real-time updates
- AI integration
- Professional UI

**Productivity gain:** 100-1000x ⚡

---

**This is SSOT's complete integration architecture!** 🚀

