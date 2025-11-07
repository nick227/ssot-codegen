# Plugin vs Service - Complete Explanation with Examples

## 🎯 The Big Picture

**Plugins** and **Services** work together but serve different purposes:

- **Plugins** = Reusable infrastructure modules (OpenAI, Stripe, S3...)
- **Services** = Custom business workflows specific to your domain

---

## 📊 Visual Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                      YOUR APPLICATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              SERVICES (Your Code)                   │    │
│  │  Schema-driven, domain-specific workflows          │    │
│  ├────────────────────────────────────────────────────┤    │
│  │                                                     │    │
│  │  @service chat-assistant                           │    │
│  │  ├─ sendMessage() ─────────┐                      │    │
│  │  ├─ getHistory()           │                      │    │
│  │  └─ regenerate()            │ uses                 │    │
│  │                              ↓                      │    │
│  │  ┌──────────────────────────────────────┐         │    │
│  │  │    PLUGINS (Generated Infrastructure)│         │    │
│  │  │    Config-driven, reusable modules   │         │    │
│  │  ├──────────────────────────────────────┤         │    │
│  │  │                                       │         │    │
│  │  │  openaiService.chat()     ←──────────┘         │    │
│  │  │  claudeService.chat()                          │    │
│  │  │  stripeService.charge()                        │    │
│  │  │  s3Service.upload()                            │    │
│  │  │                                                 │    │
│  │  └─────────────────┬─────────────────────────────┘    │
│  │                    │                                    │
│  │                    ↓                                    │
│  │           External APIs                                │
│  │           (OpenAI, Stripe, AWS...)                     │
│  └────────────────────────────────────────────────────────┘
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Concrete Example: AI Chat Application

### 1. Configure Plugins (Infrastructure)

```javascript
// ssot.config.js
export default {
  features: {
    openai: { enabled: true, defaultModel: 'gpt-4-turbo' },
    claude: { enabled: true },       // Backup provider
    jwtService: { enabled: true },   // Authentication
    stripe: { enabled: true }        // Payments
  }
}
```

**Generates:**
- `src/ai/providers/openai.provider.ts` - OpenAI client wrapper
- `src/ai/services/openai.service.ts` - High-level API
- `src/ai/providers/claude.provider.ts` - Claude client wrapper
- `src/ai/services/claude.service.ts` - High-level API
- `src/auth/utils/jwt.util.ts` - JWT helpers
- `src/payments/providers/stripe.provider.ts` - Stripe wrapper

### 2. Define Services (Business Logic)

```prisma
// schema.prisma

/// @service ai-chat
/// @provider openai
/// @methods sendMessage, listMessages, regenerateResponse
model Conversation {
  id Int @id @default(autoincrement())
  userId Int
  messages Json
  model String @default("gpt-4-turbo")
  // ...
}

/// @service subscription-manager
/// @provider stripe
/// @methods createSubscription, cancelSubscription, updatePayment
model Subscription {
  id Int @id @default(autoincrement())
  userId Int
  stripeSubscriptionId String
  plan String
  // ...
}
```

**Generates:**
- `src/services/ai-chat.service.scaffold.ts` - Scaffold for chat logic
- `src/controllers/ai-chat.controller.ts` - Routes handler
- `src/routes/ai-chat.routes.ts` - Express routes
- `src/services/subscription-manager.service.scaffold.ts` - Stripe workflow scaffold

### 3. Implement Services Using Plugins

```typescript
// src/services/ai-chat.ts/ai-chat.service.ts

import { openaiService } from '../../ai/openai.js'      // ← Plugin!
import { claudeService } from '../../ai/claude.js'      // ← Plugin!
import { conversationService } from '../conversation/index.js'

export const aiChatService = {
  async sendMessage(userId: number, prompt: string, conversationId?: number) {
    // ✅ Step 1: Use OpenAI plugin for AI response
    const aiResponse = await openaiService.chat(prompt, {
      model: 'gpt-4-turbo',
      temperature: 0.7
    })
    
    // ✅ Step 2: Business logic - save to conversation
    if (conversationId) {
      await conversationService.create({
        userId,
        messages: [
          { role: 'user', content: prompt },
          { role: 'assistant', content: aiResponse }
        ]
      })
    }
    
    // ✅ Step 3: Track usage
    await trackUsage(userId, 'chat', aiResponse.usage.totalTokens)
    
    return { response: aiResponse, conversationId }
  },
  
  async regenerateResponse(conversationId: number, useProvider: 'openai' | 'claude') {
    // ✅ Easy to switch providers!
    const aiService = useProvider === 'openai' ? openaiService : claudeService
    
    const conversation = await conversationService.findById(conversationId)
    const lastMessage = conversation.messages[conversation.messages.length - 2]
    
    return await aiService.chat(lastMessage.content)
  }
}
```

```typescript
// src/services/subscription-manager.ts/subscription-manager.service.ts

import { stripeService } from '../../payments/stripe.js'  // ← Plugin!

export const subscriptionManagerService = {
  async createSubscription(userId: number, plan: string) {
    // ✅ Use Stripe plugin for payment processing
    const stripeSubscription = await stripeService.createSubscription({
      customerId: user.stripeCustomerId,
      priceId: getPriceForPlan(plan)
    })
    
    // ✅ Business logic - save to database
    return await prisma.subscription.create({
      data: {
        userId,
        stripeSubscriptionId: stripeSubscription.id,
        plan
      }
    })
  }
}
```

---

## 🎨 Mental Model

### Plugins = LEGO Bricks
- Pre-built, tested, reusable
- Snap in via config
- Standard interfaces
- Work independently

### Services = LEGO Creations
- Built from bricks (plugins)
- Custom to your design (schema annotations)
- Implement your unique logic
- Specific to your app

**Together:** Complete application! 🏗️

---

## 📖 Decision Tree

### When to Use PLUGINS:

✅ Need third-party integration (OpenAI, Stripe, S3...)
✅ Feature is infrastructure (auth, storage, email...)
✅ Multiple services will use it (reusable)
✅ Standard implementation (no custom logic)

**Example:** OpenAI integration, Stripe payments, JWT auth

### When to Use SERVICES:

✅ Custom business workflow (orchestration)
✅ Specific to one model/domain (AI chat agent)
✅ Requires custom logic (multi-step process)
✅ Ties together multiple plugins

**Example:** Chat orchestration, payment subscription flow, file processing pipeline

---

## 🔄 Interaction Patterns

### Pattern 1: Service Uses Single Plugin

```typescript
// Service: email-sender
// Plugin: sendgrid

import { sendgridService } from '@/email/sendgrid'

export const emailSenderService = {
  async sendWelcomeEmail(userId: number) {
    return await sendgridService.send({
      to: user.email,
      template: 'welcome',
      data: { name: user.name }
    })
  }
}
```

### Pattern 2: Service Uses Multiple Plugins

```typescript
// Service: content-processor
// Plugins: openai (AI), s3 (storage), sendgrid (email)

import { openaiService } from '@/ai/openai'
import { s3Service } from '@/storage/s3'
import { sendgridService } from '@/email/sendgrid'

export const contentProcessorService = {
  async processAndNotify(userId: number, content: string) {
    // Step 1: AI processing
    const summary = await openaiService.summarize(content)
    
    // Step 2: Store result
    const fileUrl = await s3Service.upload('summaries', summary)
    
    // Step 3: Notify user
    await sendgridService.send({
      to: user.email,
      subject: 'Content Processed',
      body: `Summary: ${summary}`
    })
    
    return { summary, fileUrl }
  }
}
```

### Pattern 3: Service Switches Providers

```typescript
// Service: ai-agent
// Plugins: openai, claude (fallback)

import { openaiService } from '@/ai/openai'
import { claudeService } from '@/ai/claude'

export const aiAgentService = {
  async chat(prompt: string, preferredProvider: 'openai' | 'claude') {
    try {
      // Try preferred provider
      if (preferredProvider === 'openai') {
        return await openaiService.chat(prompt)
      } else {
        return await claudeService.chat(prompt)
      }
    } catch (error) {
      // Fallback to alternative
      const fallbackProvider = preferredProvider === 'openai' 
        ? claudeService 
        : openaiService
      
      return await fallbackProvider.chat(prompt)
    }
  }
}
```

---

## 🎯 Configuration Examples by Use Case

### Use Case 1: AI Content Generator

**Config:**
```javascript
features: {
  openai: { enabled: true },
  s3: { enabled: true }
}
```

**Schema:**
```prisma
/// @service content-generator
/// @provider openai
/// @methods generateArticle, generateImage
model ContentRequest { ... }
```

**Result:** AI content generation with storage!

### Use Case 2: SaaS Subscription Platform

**Config:**
```javascript
features: {
  googleAuth: { enabled: true },
  stripe: { enabled: true },
  sendgrid: { enabled: true }
}
```

**Schema:**
```prisma
/// @service subscription-manager
/// @provider stripe
/// @methods createSubscription, cancelSubscription
model Subscription { ... }
```

**Result:** Full subscription system with OAuth, payments, emails!

### Use Case 3: Voice AI Application

**Config:**
```javascript
features: {
  deepgram: { enabled: true },    // Speech-to-text
  elevenlabs: { enabled: true },  // Text-to-speech
  openai: { enabled: true }       // AI processing
}
```

**Schema:**
```prisma
/// @service voice-assistant
/// @provider openai
/// @methods processVoiceCommand, synthesizeResponse
model VoiceCommand { ... }
```

**Result:** Complete voice AI pipeline!

---

## 💡 Best Practices

### 1. Config File Checklist
✅ **Do:**
- Commit config file to git
- Use environment variables for secrets
- Document why plugins are enabled
- Group related plugins

❌ **Don't:**
- Put secrets in config file
- Enable all plugins "just in case"
- Mix plugin config with service logic

### 2. Service Implementation
✅ **Do:**
- Import plugins at top of service
- Use type-safe plugin interfaces
- Handle errors from plugin calls
- Log plugin usage for debugging

❌ **Don't:**
- Recreate plugin logic in service
- Skip error handling
- Bypass plugin interfaces

### 3. Schema Organization
✅ **Do:**
- Use `@service` for custom workflows
- Reference `@provider` to show plugin usage
- Keep schema focused on data model

❌ **Don't:**
- Put plugin toggles in schema
- Mix service annotations with plugin config
- Over-annotate simple CRUD models

---

## 🔥 Power Features

### Feature 1: Multi-Provider Fallback

```typescript
// Enable multiple AI providers
features: {
  openai: { enabled: true },
  claude: { enabled: true },
  gemini: { enabled: true }
}
```

```typescript
// Service with automatic fallback
const providers = [openaiService, claudeService, geminiService]

for (const provider of providers) {
  try {
    return await provider.chat(prompt)
  } catch (error) {
    continue  // Try next provider
  }
}
```

**Reliability through redundancy!**

### Feature 2: A/B Testing

```typescript
// Enable multiple providers
features: {
  openai: { enabled: true, defaultModel: 'gpt-4-turbo' },
  claude: { enabled: true, defaultModel: 'claude-3-opus' }
}
```

```typescript
// Service implements A/B test
export const aiService = {
  async chat(prompt: string, userId: number) {
    const useOpenAI = userId % 2 === 0  // 50/50 split
    
    const provider = useOpenAI ? openaiService : claudeService
    const response = await provider.chat(prompt)
    
    // Track which provider was used for analytics
    await logABTest(userId, useOpenAI ? 'openai' : 'claude', response)
    
    return response
  }
}
```

**Compare providers in production!**

### Feature 3: Cost Optimization

```typescript
// Enable cheap + expensive providers
features: {
  'gpt-3.5-turbo': { enabled: true },  // Cheap
  'gpt-4-turbo': { enabled: true }     // Expensive
}
```

```typescript
// Service chooses based on complexity
export const smartChatService = {
  async chat(prompt: string) {
    const isComplex = await analyzeComplexity(prompt)
    
    // Use GPT-4 only when needed, GPT-3.5 otherwise
    const model = isComplex ? 'gpt-4-turbo' : 'gpt-3.5-turbo'
    
    return await openaiService.chat(prompt, { model })
  }
}
```

**Save 90% on API costs!**

---

## 📚 Real Examples from Generated Code

### Example 1: Generated Plugin (OpenAI)

```typescript
// src/ai/services/openai.service.ts (auto-generated)

export const openaiService = {
  /**
   * Simple chat completion
   */
  async chat(prompt: string, options: ChatOptions = {}): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'user', content: prompt }
    ]
    
    const response = await openaiProvider.chat(messages, options)
    return response.content
  },
  
  async embed(text: string): Promise<number[]> { ... },
  async classify(text: string, categories: string[]): Promise<string> { ... },
  async summarize(text: string, maxWords: number): Promise<string> { ... }
}
```

**✅ Ready to use immediately! No implementation needed.**

### Example 2: Generated Service Scaffold

```typescript
// src/services/ai-agent.ts/ai-agent.service.scaffold.ts (generated)

import { aipromptService as baseService } from '@/services/aiprompt'
import OpenAI from 'openai'  // ← Dependency from plugin

export const aiAgentService = {
  ...baseService,  // CRUD methods
  
  async sendMessage(userId: number, ...args: any[]) {
    // TODO: Implement using OpenAI plugin
    throw new Error('sendMessage not implemented yet')
  }
}
```

**✅ Scaffold ready, developer implements!**

### Example 3: Developer Implementation

```typescript
// src/services/ai-agent.ts/ai-agent.service.ts (developer writes)

import { openaiService } from '../../ai/openai.js'  // ← Use plugin!

export const aiAgentService = {
  ...baseService,
  
  async sendMessage(userId: number, input: { prompt: string }) {
    // ✅ Plugin handles OpenAI complexity
    const aiResponse = await openaiService.chat(input.prompt, {
      model: 'gpt-4-turbo',
      temperature: 0.7
    })
    
    // ✅ Service handles business logic
    const saved = await prisma.aIPrompt.create({
      data: {
        userId,
        prompt: input.prompt,
        status: 'COMPLETED'
      }
    })
    
    await prisma.aIResponse.create({
      data: {
        promptId: saved.id,
        response: aiResponse,
        // ... usage tracking
      }
    })
    
    return { promptId: saved.id, response: aiResponse }
  }
}
```

**✅ Developer focuses on business logic, plugin handles infrastructure!**

---

## 🎯 Key Takeaways

### 1. Plugins are INFRASTRUCTURE
```
OpenAI Plugin   = "How to talk to OpenAI API"
Stripe Plugin   = "How to process payments"
S3 Plugin       = "How to upload files"
```

### 2. Services are BUSINESS LOGIC
```
Chat Service       = "Our chat workflow using AI"
Payment Service    = "Our subscription logic using Stripe"
Upload Service     = "Our file processing using S3"
```

### 3. Configuration is DECLARATIVE
```javascript
// Config says WHAT to enable
features: {
  openai: { enabled: true }
}
```

```prisma
// Schema says WHICH services exist
/// @service ai-agent
model AIPrompt { ... }
```

```typescript
// Implementation says HOW it works
const response = await openaiService.chat(prompt)
```

**WHAT + WHICH + HOW = Complete System**

---

## 🚀 Summary

**Plugins:**
- Configured in `ssot.config.js`
- Generate infrastructure code
- Provide standard APIs
- Reusable across services

**Services:**
- Declared in schema via `@service`
- Generate scaffolds + routes
- Implement business logic
- Use plugins underneath

**Together:**
- Config toggles plugins
- Schema declares services
- Services use plugins
- Complete, working backend!

**This separation is the key to scalable, maintainable code generation!** 🎯

