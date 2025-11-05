# AI Chat Example - Service Integration Patterns

This example demonstrates **service integration** - connecting generated CRUD to external services.

## What's Different Here?

Unlike simple extensions that add search/filtering, service integrations **orchestrate complex workflows** involving external APIs.

## Service Integration Pattern

```prisma
/// @service ai-agent
model AIPrompt {
  id      Int    @id
  message String
  // ...
}
```

The `@service` annotation tells the generator: *"This model needs custom orchestration beyond CRUD."*

## Examples in This Folder

### `ai-agent.service.integration.ts`

**Problem:** AI conversations aren't simple CRUD - they involve:
1. Save user message
2. Call OpenAI API
3. Handle streaming responses
4. Track tokens and costs
5. Update conversation context
6. Error handling and retries

**Solution:** Service integration that orchestrates the workflow:

```typescript
export const aiAgentService = {
  ...generatedAIPromptService,  // Keep CRUD
  
  async sendMessage(userId: number, message: string) {
    // 1. Save prompt
    const prompt = await prisma.aIPrompt.create(...)
    
    // 2. Call AI
    const response = await openai.chat.completions.create(...)
    
    // 3. Save response
    const savedMessage = await prisma.message.create(...)
    
    // 4. Track usage
    await prisma.usageLog.create(...)
    
    // 5. Return orchestrated result
    return {
      promptId: prompt.id,
      responseId: savedMessage.id,
      text: response.choices[0].message.content,
      tokens: { ... },
      cost: calculated
    }
  }
}
```

### `file-storage.service.integration.ts`

File upload orchestration:
- Save to S3/local storage
- Create database record
- Generate thumbnails
- Track metadata

## When to Use Service Integration

Use this pattern when:
- ✅ External API calls (OpenAI, Stripe, SendGrid)
- ✅ Multi-step workflows
- ✅ Complex business logic
- ✅ Transaction coordination
- ✅ Async processing
- ✅ Cost/usage tracking

**Don't use for:**
- ❌ Simple CRUD
- ❌ Basic filtering/search (use extensions)
- ❌ Single database operations

## Using in Generated Projects

```bash
pnpm ssot generate ai-chat-example
cd gen-1
cp ../examples/ai-chat-example/extensions/* src/services/
pnpm install
pnpm dev
```

Update your routes to use the integration service:
```typescript
import { aiAgentService } from '../services/ai-agent.service.integration.js'

router.post('/send-message', async (req, res) => {
  const result = await aiAgentService.sendMessage(
    req.user.id,
    req.body.message
  )
  res.json(result)
})
```

## Benefits

- ✅ **Orchestration** - Complex workflows in one place
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Testable** - Mock external services
- ✅ **Reusable** - DRY workflows
- ✅ **Type-safe** - Full TypeScript support

