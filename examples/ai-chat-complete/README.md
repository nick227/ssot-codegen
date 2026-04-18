# AI Chat - Complete Integration Example

**Complete chat application showcasing the full power of SSOT:**

✅ **WebSockets** - Real-time message streaming  
✅ **AI Plugins** - GPT-4, Claude, Gemini integration  
✅ **React Hooks** - Type-safe data management  
✅ **UI Templates** - Beautiful chat interface  
✅ **Schema Annotations** - @@realtime for instant updates  

---

## 🎯 What This Example Demonstrates

### 1. Schema with Annotations
```prisma
model Message {
  id             String       @id @default(cuid())
  content        String
  role           MessageRole
  conversationId String
  
  /// @realtime(subscribe: ["list"], broadcast: ["created", "updated", "deleted"])
}
```

### 2. Plugin Configuration
```typescript
plugins: [
  new OpenAIPlugin({
    defaultModel: 'gpt-4-turbo',
    enableUsageTracking: true
  }),
  new ChatPlugin({
    enableWebSocket: true,
    enableMemory: true
  })
]
```

### 3. WebSocket Configuration
```typescript
websocket: {
  enabled: true,
  pubsub: {
    models: {
      Message: {
        subscribe: ['list'],
        broadcast: ['created']
      }
    }
  }
}
```

### 4. UI Configuration
```typescript
pages: [{
  path: 'chats/[id]',
  type: 'custom',
  sections: [{
    type: 'custom',
    components: [{
      type: 'ChatInterface',
      props: { conversationId: 'params.id' }
    }]
  }]
}]
```

---

## 🚀 Quick Start

### Step 1: Generate Project

```bash
# Navigate to this example
cd examples/ai-chat-complete

# Generate complete project
pnpm ssot generate schema.prisma --output ./generated

# Generate UI
pnpm ssot ui --config ssot.ui.config.ts --output ./generated/src
```

### Step 2: Setup Environment

```bash
cd generated

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://user:pass@localhost:5432/chat"
OPENAI_API_KEY="sk-your-openai-key-here"
EOF

# Install dependencies
pnpm install

# Setup database
pnpm prisma migrate dev --name init
pnpm prisma generate
```

### Step 3: Run Application

```bash
# Terminal 1: Start API server
pnpm dev

# Terminal 2: Start WebSocket server
pnpm dev:ws

# Terminal 3: Start frontend
cd ../frontend
pnpm dev
```

---

## 📦 What Gets Generated

### Backend Files

```
generated/
├── src/
│   ├── chat/
│   │   ├── chat.service.ts       # AI + storage orchestration
│   │   ├── chat.controller.ts    # HTTP endpoints
│   │   ├── chat.routes.ts        # Route registration
│   │   ├── chat.gateway.ts       # WebSocket gateway
│   │   ├── chat.types.ts         # Type definitions
│   │   ├── react/
│   │   │   ├── useChat.ts        # React hook
│   │   │   └── useChatWebSocket.ts # WebSocket hook
│   │   └── ui/
│   │       ├── ChatInterface.tsx  # Complete chat UI
│   │       ├── MessageList.tsx    # Message display
│   │       ├── MessageInput.tsx   # Message input
│   │       └── ConversationList.tsx # Conversation list
│   │
│   ├── ai/
│   │   ├── providers/
│   │   │   └── openai.provider.ts # OpenAI integration
│   │   └── services/
│   │       └── openai.service.ts  # High-level AI API
│   │
│   ├── websocket/
│   │   ├── gateway.ts             # WebSocket server
│   │   └── client.ts              # WebSocket client
│   │
│   └── gen/
│       ├── sdk/                   # Type-safe SDK
│       └── hooks/                 # React Query hooks
```

### Frontend Files

```
src/app/
├── page.tsx                # Home page
├── chats/
│   ├── page.tsx           # Conversation list
│   └── [id]/page.tsx      # Chat interface
│
└── components/
    └── ssot/
        ├── ChatInterface.tsx
        ├── MessageList.tsx
        └── MessageInput.tsx
```

---

## 🔌 How It All Wires Together

### Data Flow

```
User types message
    ↓
MessageInput component
    ↓
useChat hook (React Query)
    ↓
WebSocket.emit('send-message')
    ↓
Chat Gateway (WebSocket server)
    ↓
Chat Service
    ├─→ Save user message (Prisma)
    ├─→ Get conversation history
    ├─→ Call AI provider (OpenAI)
    ├─→ Save AI response (Prisma)
    └─→ Broadcast updates (WebSocket)
    ↓
useChatWebSocket hook receives update
    ↓
React Query cache updated
    ↓
MessageList re-renders with new messages
```

### Component Integration

```typescript
// Chat interface uses:
import { useChat } from '@/chat/react/useChat'              // React hook
import { useChatWebSocket } from '@/chat/react/useChatWebSocket' // WebSocket hook
import { MessageList } from '@/chat/ui/MessageList'         // UI component
import { MessageInput } from '@/chat/ui/MessageInput'       // UI component

function ChatInterface({ conversationId }) {
  // Data management (React Query)
  const { messages, sendMessage } = useChat(conversationId)
  
  // Real-time updates (WebSocket)
  useChatWebSocket(conversationId)
  
  return (
    <>
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </>
  )
}
```

---

## 🧩 Architecture Layers

### Layer 1: Database (Prisma)
```prisma
model Message {
  /// @realtime(subscribe: ["list"], broadcast: ["created"])
}
```

### Layer 2: Plugins
```typescript
plugins: [
  new OpenAIPlugin(),  // AI provider
  new ChatPlugin()     // Chat orchestration
]
```

### Layer 3: WebSocket
```typescript
websocket: {
  pubsub: {
    models: { Message: { broadcast: ['created'] } }
  }
}
```

### Layer 4: SDK + Hooks
```typescript
// Generated hooks
const { messages } = useMessages({ conversationId })
const { mutate: createMessage } = useCreateMessage()
```

### Layer 5: UI Components
```typescript
<ChatInterface conversationId={id} />
```

---

## 🎨 Features

### Real-time Messaging
- WebSocket connection for instant delivery
- Optimistic updates (message shows immediately)
- Automatic reconnection
- Message batching for performance

### AI Integration
- Multiple providers (OpenAI, Claude, Gemini)
- Configurable per conversation
- Custom system prompts
- Temperature control
- Token usage tracking
- Cost estimation

### Conversation Management
- Create/delete conversations
- Conversation history
- Multi-participant support
- Conversation types (DIRECT, GROUP, AI)

### Modern UI
- Beautiful chat interface
- Message bubbles (user vs AI)
- Typing indicators
- Read receipts
- Auto-scroll to bottom
- Mobile responsive

---

## ⚙️ Configuration Options

### AI Model Selection

```typescript
// In ssot.config.ts
new OpenAIPlugin({
  defaultModel: 'gpt-4-turbo',  // or 'gpt-3.5-turbo'
  enableUsageTracking: true,
  enableCostEstimation: true
})

// Per conversation (in database)
conversation.model = 'gpt-4'
conversation.temperature = 0.7
conversation.systemPrompt = 'You are a helpful assistant'
```

### WebSocket Settings

```typescript
websocket: {
  port: 3001,
  path: '/ws',
  reconnect: {
    maxAttempts: 10,
    backoff: 'exponential'
  },
  batching: {
    enabled: true,
    flushInterval: 100
  }
}
```

---

## 🧪 Testing

```bash
# Start backend
pnpm dev

# Start WebSocket server
pnpm dev:ws

# Open browser
http://localhost:3000/chats

# Create a new chat
# Send a message
# Watch AI respond in real-time!
```

---

## 🔐 Authentication

Add auth to secure conversations:

```typescript
// ssot.config.ts
plugins: [
  new JWTPlugin(),
  new OpenAIPlugin(),
  new ChatPlugin()
]

// ssot.ui.config.ts
pages: [{
  path: 'chats',
  requiresAuth: true,  // Require login
  roles: ['USER']      // Optional role check
}]
```

---

## 📊 Usage Tracking

Chat plugin automatically tracks:
- Tokens used (prompt + completion)
- Estimated cost per message
- Model used
- Response latency

All stored in `message.metadata`:

```typescript
{
  usage: {
    promptTokens: 150,
    completionTokens: 75,
    totalTokens: 225,
    estimatedCost: 0.00675
  },
  model: 'gpt-4-turbo',
  latency: 1234,
  finishReason: 'stop'
}
```

---

## 🚀 Next Steps

1. ✅ Generate the project
2. ✅ Configure environment variables
3. ✅ Start servers
4. ✅ Test chat functionality
5. 🎨 Customize UI
6. 🤖 Add more AI providers
7. 🔐 Add authentication
8. 📱 Deploy!

---

## 💡 Extend This Example

### Add Voice Input
```typescript
plugins: [
  new OpenAIPlugin(),
  new DeepgramPlugin(),  // Voice-to-text
  new ElevenLabsPlugin() // Text-to-voice
]
```

### Add Image Generation
```typescript
// Use DALL-E for image generation
const image = await openai.images.generate({
  prompt: message.content,
  model: 'dall-e-3'
})
```

### Add RAG (Retrieval Augmented Generation)
```typescript
// Add embeddings for semantic search
const embedding = await openaiService.embed(message.content)
// Search similar messages
// Include in context
```

---

## 📚 Learn More

- [Plugin System](../../docs/PLUGIN_GUIDE.md)
- [WebSocket Integration](../../docs/RLS_WEBSOCKET_INTEGRATION.md)
- [UI Configuration](../../docs/UI_CONFIGURATION_GUIDE.md)
- [React Hooks](../../docs/SDK_HOOK_CONTRACT_LOCKED.md)

---

## ✨ This is the Power of SSOT!

**One schema, one config, complete application!** 🚀

