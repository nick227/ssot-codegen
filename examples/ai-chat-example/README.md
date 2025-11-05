# AI Chat Example - Service Integration

AI-powered chat application demonstrating **service integration patterns**.

## Structure

```
ai-chat-example/
├── schema.prisma           # Source schema with @service annotations
├── extensions/             # Service integration examples
│   ├── README.md
│   ├── ai-agent.service.integration.ts
│   └── file-storage.service.integration.ts
└── README.md
```

## Models

- **User** - Chat users with authentication
- **Conversation** - Chat conversations/threads
- **Message** - Chat messages (user & AI)
- **AIPrompt** - AI requests with `@service ai-agent`
- **UsageLog** - Token/cost tracking
- **AIModelConfig** - Model configuration

## What's Special?

This example shows how to **integrate external services** (like OpenAI) with generated code.

### The `@service` Annotation

```prisma
/// @service ai-agent
model AIPrompt {
  id      Int    @id
  message String
  userId  Int
}
```

This tells the generator: *"This isn't just CRUD - it needs orchestration."*

## Generate

```bash
pnpm ssot generate ai-chat-example
cd gen-1
pnpm install
pnpm test:validate
pnpm dev
```

## Service Integration Pattern

Instead of simple extensions, this shows **workflow orchestration**:

```typescript
async sendMessage(userId, message) {
  // 1. Save user message
  const prompt = await prisma.aIPrompt.create(...)
  
  // 2. Call OpenAI
  const completion = await openai.chat.completions.create(...)
  
  // 3. Save AI response
  const response = await prisma.message.create(...)
  
  // 4. Track usage & cost
  await prisma.usageLog.create(...)
  
  // 5. Return coordinated result
  return { promptId, responseId, text, tokens, cost }
}
```

## Features Demonstrated

- ✅ **External API Integration** (OpenAI)
- ✅ **Multi-step workflows**
- ✅ **Token & cost tracking**
- ✅ **Conversation context**
- ✅ **Error handling**
- ✅ **Streaming responses**
- ✅ **Model configuration**
- ✅ **Usage analytics**

## When to Use This Pattern

Use service integration when you need:
- External API orchestration
- Multi-step business logic
- Transaction coordination
- Cost/usage tracking
- Async processing

See `extensions/README.md` for detailed patterns.

## What You Get

AI-ready backend:
- User & conversation management
- AI prompt orchestration
- Token tracking
- Model configuration
- Usage analytics
- Full TypeScript types
- Comprehensive tests

**Production-ready AI chat backend!**
