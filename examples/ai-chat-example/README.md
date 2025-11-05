# AI Chat Example - Service Integration

Demonstrates service-oriented architecture with AI integration, file uploads, and external API patterns.

## What This Demonstrates

- ✅ @service annotations for external integrations
- ✅ AI agent service (OpenAI, Anthropic, etc.)
- ✅ File upload service (S3, Cloud Storage)
- ✅ Payment processing service (Stripe, PayPal)
- ✅ Email notification service
- ✅ OAuth integration (Google Auth)
- ✅ Rate limiting
- ✅ Service-oriented architecture

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- MySQL (or PostgreSQL)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Generate code from schema
pnpm generate

# 3. Setup database
pnpm db:setup

# 4. Configure services (optional)
# Edit .env for API keys:
# OPENAI_API_KEY=sk-...
# AWS_ACCESS_KEY_ID=...
# STRIPE_SECRET_KEY=sk_test_...

# 5. Start development server
pnpm dev
```

Server runs on `http://localhost:3000`

## Schema Overview

### 11 Models + 4 Service Integrations

#### Core Models
- **User**: User accounts with OAuth
- **Conversation**: AI chat conversations
- **Message**: Chat messages (user/assistant)
- **AIPrompt**: Prompt templates
- **AIResponse**: AI responses with tokens/cost
- **AIModelConfig**: Model configuration (GPT-4, Claude, etc.)
- **UsageLog**: API usage tracking
- **OAuthAccount**: Google/OAuth accounts
- **EmailQueue**: Email notification queue
- **FileUpload**: File storage metadata
- **Payment**: Payment transactions

#### Service Integrations (@service annotation)
- **ai-agent**: AI conversation service (OpenAI/Anthropic)
- **file-storage**: File upload service (S3/Cloud Storage)
- **email-sender**: Email notification service
- **payment-processor**: Payment processing (Stripe)
- **google-auth**: OAuth integration

**Generated**: ~140 files including service clients

## Service Integration Pattern

### Schema with @service Annotation

```prisma
/// @service ai-agent
/// @provider openai
/// @methods sendMessage, getHistory, regenerateResponse
/// @rateLimit 20/minute
/// @description AI conversation orchestration service
model AIPrompt {
  id            Int      @id @default(autoincrement())
  userId        Int
  conversationId Int?
  prompt        String
  // ... more fields
}
```

### Generated Service Client

```typescript
// gen/sdk/services/ai-agent.client.ts
export class AiAgentClient {
  async sendMessage(data: { prompt: string }) {
    return this.client.post('/api/ai-agent/message', data)
  }
  
  async getHistory(conversationId: number) {
    return this.client.get(`/api/ai-agent/history/${conversationId}`)
  }
}
```

### Custom Implementation

```typescript
// src/services/ai-agent.service.ts
import OpenAI from 'openai'

export const aiAgent = {
  async sendMessage(prompt: string, conversationId?: number) {
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    })
    
    // Store in database
    const aiResponse = await prisma.aIResponse.create({
      data: {
        conversationId,
        content: response.choices[0].message.content,
        tokens: response.usage?.total_tokens,
        cost: calculateCost(response.usage)
      }
    })
    
    return aiResponse
  }
}
```

## Generated API Endpoints

### AI Agent Service
```
POST   /api/ai-agent/message           # Send message to AI
GET    /api/ai-agent/history/:id       # Get conversation history
POST   /api/ai-agent/regenerate/:id    # Regenerate response
```

### File Storage Service
```
POST   /api/file-storage/upload        # Upload file
GET    /api/file-storage/download/:id  # Download file
DELETE /api/file-storage/delete/:id    # Delete file
```

### Payment Processor Service
```
POST   /api/payment-processor/checkout # Create checkout session
GET    /api/payment-processor/status/:id # Get payment status
```

### Email Sender Service
```
POST   /api/email-sender/send          # Send email
GET    /api/email-sender/queue         # Get email queue status
```

### Standard CRUD Endpoints
All models also get standard CRUD endpoints:
```
GET    /api/conversations
POST   /api/conversations
GET    /api/messages?conversationId=:id
POST   /api/messages
GET    /api/usage-logs                 # Track API usage
```

## Features

### AI Conversation
- Multi-turn conversations
- Context preservation
- Token/cost tracking
- Model configuration (temperature, max_tokens, etc.)
- Rate limiting

### File Management
- Secure file uploads
- Cloud storage integration
- Metadata tracking
- Access control

### Payment Processing
- Subscription management
- Usage-based billing
- Payment tracking
- Refund handling

### Email Notifications
- Queue-based email sending
- Template support
- Retry logic
- Delivery tracking

## What Gets Generated

**Service Integration**:
- SDK clients for each service
- Type-safe method signatures
- HTTP method inference (GET, POST, etc.)
- Route path inference from method names

**Standard CRUD**:
- Full CRUD for all models
- Relationships handled automatically
- Validation schemas
- Error handling

## Testing

```bash
# Run tests
pnpm test
```

## Learn More

- [Service Annotations Guide](../../docs/service-annotations.md)
- [AI Integration Patterns](../../docs/ai-patterns.md)
- [Main Documentation](../../README.md)

---

**This example shows service-oriented architecture with external API integration** 🤖
