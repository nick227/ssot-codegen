# Route Generation Explained - Plugin vs Service vs CRUD

## 🎯 Your Questions Answered

### Q1: Why `aimodelconfig` instead of `ai-model-config` (snake-case)?

**Answer:** The generator uses the Prisma model name directly for route folder naming.

**Model in Schema:**
```prisma
model AIModelConfig {  // ← PascalCase in schema
  id Int @id
  modelName String
  // ...
}
```

**Generated Route Folder:**
```
routes/aimodelconfig/  // ← lowercase(AIModelConfig) = "aimodelconfig"
```

**This is standard CRUD behavior** - not from any plugin. The generator lowercases the model name but doesn't add hyphens/underscores.

**Fix Options:**
1. Rename model: `model AiModelConfig` → `routes/aimodelconfig/` (same)
2. Rename model: `model ModelConfig` → `routes/modelconfig/` (cleaner)
3. Update naming convention in route generator to add hyphens

### Q2: What is AIModelConfig and why does it have routes?

**Answer:** It's a regular Prisma model in your schema for **admin configuration** of AI model pricing/limits.

**From Schema:**
```prisma
// ============================================================================
// SYSTEM CONFIGURATION (Admin only)
// ============================================================================

model AIModelConfig {
  id               Int      @id @default(autoincrement())
  modelName        String   @unique
  provider         String   // 'openai', 'anthropic', 'google'
  isActive         Boolean  @default(true)
  costPer1kPromptTokens    Decimal @db.Decimal(10, 6)
  costPer1kCompletionTokens Decimal @db.Decimal(10, 6)
  maxTokens        Int      @default(4096)
  supportsStreaming Boolean @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**Purpose:** Admins can dynamically configure which AI models are available, their costs, and limits without code changes.

**Why routes?** Because it's a **standard Prisma model** (no `@service` annotation), so the generator creates full CRUD:
- `GET /aimodelconfig` - List all model configs
- `POST /aimodelconfig` - Create new model config
- `PUT /aimodelconfig/:id` - Update model config
- `DELETE /aimodelconfig/:id` - Delete model config

**This is NOT from any plugin.** It's standard CRUD generation for every Prisma model.

### Q3: Are `routes/ai-agent` and `routes/conversation` redundant?

**Answer:** NO! They serve completely different purposes:

---

## 📊 Route Type Comparison

### Type 1: **CRUD Routes** (from Prisma models without `@service`)

**Source:** Regular Prisma model
```prisma
model Conversation {  // ← No @service annotation
  id Int @id
  userId Int
  title String
  // ...
}
```

**Generated:**
```
routes/conversation/conversation.routes.ts
  ├─ GET    /conversation        (list all)
  ├─ GET    /conversation/:id    (get by id)
  ├─ POST   /conversation        (create)
  ├─ PUT    /conversation/:id    (update)
  ├─ DELETE /conversation/:id    (delete)
  └─ GET    /conversation/meta/count
```

**Generated From:** Standard CRUD generator (always runs for every model)

**Purpose:** Basic database operations on `Conversation` table

---

### Type 2: **Service Routes** (from `@service` annotations)

**Source:** Prisma model with `@service` annotation
```prisma
/// @service ai-agent
/// @provider openai
/// @methods sendMessage, streamMessage, regenerateResponse, getUsageStats
model AIPrompt {  // ← Has @service annotation
  id Int @id
  // ...
}
```

**Generated:**
```
routes/ai-agent/ai-agent.routes.ts
  ├─ POST /message              (sendMessage)
  ├─ POST /stream-message       (streamMessage)
  ├─ POST /regenerate-response  (regenerateResponse)
  └─ GET  /usage-stats          (getUsageStats)
```

**Generated From:** Service integration generator (only for `@service` models)

**Purpose:** Custom business workflow endpoints that orchestrate AI calls, database saves, credit tracking, etc.

---

### Type 3: **Plugin Routes** (from enabled plugins)

**Source:** Plugin configuration
```javascript
// ssot.config.js
features: {
  usageTracker: { enabled: true }  // ← Plugin enabled
}
```

**Generated:**
```
monitoring/routes/
  ├─ GET /monitoring/usage         (current usage stats)
  ├─ GET /monitoring/analytics     (historical analytics)
  ├─ GET /monitoring/top-users     (top API users)
  └─ GET /monitoring/health        (system health)
```

**Generated From:** UsageTrackerPlugin (plugin system)

**Purpose:** Infrastructure-level monitoring and analytics

---

## 🔍 Complete Breakdown for Your Schema

### From Plugins (Infrastructure - Config Driven)

**Enabled in `ssot.config.js`:**
```javascript
features: {
  jwtService: { enabled: true },
  usageTracker: { enabled: true },
  openai: { enabled: true },
  claude: { enabled: true }
}
```

**Generated Routes:**
```
monitoring/routes/
  ├─ GET /monitoring/usage       ← UsageTrackerPlugin
  ├─ GET /monitoring/analytics   ← UsageTrackerPlugin
  └─ ...

(No routes from OpenAI/Claude plugins - they're service-level only)
```

**Files Generated:**
- `src/ai/` - OpenAI & Claude providers/services
- `src/auth/` - JWT middleware (no routes, just middleware)
- `src/monitoring/` - Usage tracker routes

---

### From Services (Business Logic - Schema Driven)

**Declared in schema:**
```prisma
/// @service ai-agent
/// @methods sendMessage, streamMessage, regenerateResponse, getUsageStats
model AIPrompt { ... }

/// @service file-storage
/// @methods uploadFile, getSignedUrl, deleteFile, listUserFiles
model FileUpload { ... }

/// @service payment-processor
/// @methods createPaymentIntent, confirmPayment, refundPayment
model Payment { ... }

/// @service email-sender
/// @methods sendEmail, sendBulkEmail
model EmailQueue { ... }

/// @service google-auth
/// @methods initiateLogin, handleCallback
model OAuthAccount { ... }
```

**Generated Routes:**
```
routes/ai-agent/ai-agent.routes.ts
  ├─ POST /message
  ├─ POST /stream-message
  ├─ POST /regenerate-response
  └─ GET  /usage-stats

routes/file-storage/file-storage.routes.ts
  ├─ POST /upload-file
  ├─ GET  /get-signed-url
  └─ ...

routes/payment-processor/payment-processor.routes.ts
  ├─ POST /create-payment-intent
  └─ ...

routes/email-sender/email-sender.routes.ts
  ├─ POST /send-email
  └─ ...

routes/google-auth/google-auth.routes.ts
  ├─ GET /initiate-login
  └─ ...
```

---

### From Standard CRUD (Prisma Models - Always Generated)

**Every model without `@service`:**
```prisma
model Conversation { ... }     // No @service
model Message { ... }           // No @service
model User { ... }              // No @service
model AIModelConfig { ... }     // No @service ← This one!
model AIResponse { ... }        // No @service
model UsageLog { ... }          // No @service
```

**Generated Routes (CRUD):**
```
routes/conversation/conversation.routes.ts     ← Standard CRUD
routes/message/message.routes.ts               ← Standard CRUD
routes/user/user.routes.ts                     ← Standard CRUD
routes/aimodelconfig/aimodelconfig.routes.ts   ← Standard CRUD (this one!)
routes/airesponse/airesponse.routes.ts         ← Standard CRUD
routes/usagelog/usagelog.routes.ts             ← Standard CRUD
```

---

## 🎯 Why Different Routes Exist

### `routes/aimodelconfig/` (Standard CRUD)
**Purpose:** Admin panel to manage AI model configurations
**Source:** Prisma model `AIModelConfig` (no `@service`)
**Generated by:** CRUD route generator
**Endpoints:**
- `GET /aimodelconfig` - List available AI models
- `POST /aimodelconfig` - Add new AI model
- `PUT /aimodelconfig/:id` - Update model config (pricing, limits)
- `DELETE /aimodelconfig/:id` - Remove model

**Use Case:** Admin configures: "GPT-4 costs $0.03/1K tokens, max 8K tokens"

---

### `routes/ai-agent/` (Service Integration)
**Purpose:** AI conversation orchestration (calls OpenAI, saves results, tracks usage)
**Source:** Prisma model `AIPrompt` with `@service ai-agent`
**Generated by:** Service integration generator
**Endpoints:**
- `POST /ai-agent/message` - Send message to AI
- `POST /ai-agent/stream-message` - Stream AI response
- `POST /ai-agent/regenerate-response` - Regenerate with different params
- `GET /ai-agent/usage-stats` - Get user's AI usage

**Use Case:** End-user sends chat message, AI responds, usage tracked

---

### `routes/conversation/` (Standard CRUD)
**Purpose:** Basic conversation management (CRUD operations)
**Source:** Prisma model `Conversation` (no `@service`)
**Generated by:** CRUD route generator
**Endpoints:**
- `GET /conversation` - List user's conversations
- `POST /conversation` - Create new conversation
- `PUT /conversation/:id` - Update conversation (title, archive)
- `DELETE /conversation/:id` - Delete conversation

**Use Case:** User manages their conversation history

---

## 🔄 How They Work Together

```
┌─────────────────────────────────────────────────────────┐
│                    USER SENDS MESSAGE                    │
└───────────────────────┬─────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │  POST /ai-agent/message       │  ← SERVICE route
        │  (ai-agent.routes.ts)         │
        └───────────────┬───────────────┘
                        ↓
        ┌───────────────────────────────┐
        │  aiAgentController.sendMessage│
        └───────────────┬───────────────┘
                        ↓
        ┌───────────────────────────────┐
        │  aiAgentService.sendMessage() │  ← SERVICE implementation
        └───────────────┬───────────────┘
                        ↓
         ┌──────────────┴───────────────┐
         ↓                              ↓
┌────────────────────┐      ┌──────────────────────┐
│ openaiService.chat │      │ conversationService  │
│ (from PLUGIN)      │      │ .create()            │
└────────────────────┘      │ (standard CRUD)      │
         ↓                  └──────────────────────┘
┌────────────────────┐               ↓
│ OpenAI API         │      ┌──────────────────────┐
│ (external)         │      │ prisma.conversation  │
└────────────────────┘      │ .create()            │
                            └──────────────────────┘
```

**NOT redundant!** Each serves a different purpose in the flow.

---

## 🎯 Summary Table

| Route | Source | Type | Purpose | Generator |
|-------|--------|------|---------|-----------|
| `/aimodelconfig` | `model AIModelConfig` | CRUD | Admin: Manage AI model configs | CRUD generator |
| `/ai-agent` | `@service ai-agent` on `AIPrompt` | Service | User: Send AI messages | Service generator |
| `/conversation` | `model Conversation` | CRUD | User: Manage conversations | CRUD generator |
| `/message` | `model Message` | CRUD | User: Manage messages | CRUD generator |
| `/monitoring` | `usageTracker` plugin | Plugin | Admin: View API analytics | Plugin generator |

**All serve different purposes! None are redundant.**

---

## 🐛 Issue: Naming Convention

You're right that `aimodelconfig` is awkward. The generator should produce better names.

### Current Behavior:
```
AIModelConfig → aimodelconfig  (just lowercase)
```

### Better Behavior:
```
AIModelConfig → ai-model-config  (kebab-case)
```

### Where to Fix:
`packages/gen/src/path-resolver.ts` or route generators need to convert PascalCase to kebab-case.

**Example Fix:**
```typescript
// Instead of:
const routePath = model.name.toLowerCase()  // "aimodelconfig"

// Do:
const routePath = toKebabCase(model.name)   // "ai-model-config"
```

---

## ✅ Not Redundant - Just Different Purposes

### `routes/conversation/` (CRUD)
```typescript
// Basic operations
GET    /conversation           // List all conversations
POST   /conversation           // Create new conversation
PUT    /conversation/:id       // Update conversation
DELETE /conversation/:id       // Delete conversation
```

**Purpose:** Standard database CRUD for the `Conversation` table

---

### `routes/ai-agent/` (Service Integration)
```typescript
// Business workflows
POST /ai-agent/message                 // Send message → OpenAI → save
POST /ai-agent/stream-message          // Stream AI response
POST /ai-agent/regenerate-response     // Retry with different model
GET  /ai-agent/usage-stats             // Get usage statistics
```

**Purpose:** Complex orchestration using OpenAI plugin + multiple database operations

**Key Difference:** 
- `POST /conversation` just saves to database
- `POST /ai-agent/message` calls OpenAI, saves prompt, saves response, updates conversation, deducts credits, logs usage

**Workflow vs CRUD!**

---

## 🎨 Visual Example: Sending a Chat Message

### Option 1: Direct CRUD (Simple)
```
User → POST /conversation
     → conversationController.createConversation
     → conversationService.create()
     → prisma.conversation.create()
     → Database
```

**Result:** Conversation record created (no AI involved)

### Option 2: Service Workflow (Complex)
```
User → POST /ai-agent/message
     → aiAgentController.sendMessage
     → aiAgentService.sendMessage()
          ├─ openaiService.chat()        ← Plugin!
          │  └─ OpenAI API call
          │
          ├─ prisma.aIPrompt.create()    ← Save prompt
          ├─ prisma.aIResponse.create()  ← Save response
          ├─ prisma.conversation.update()← Add to conversation
          ├─ prisma.user.update()        ← Deduct credits
          └─ usageLog.track()            ← Log usage
     → Response
```

**Result:** Full AI workflow with all tracking!

**Clearly different!** One is simple CRUD, other is complex orchestration.

---

## 🔧 Route Generation Sources

### Source 1: Standard CRUD Generator (Always Runs)
**For:** Every Prisma model **without** `@service` annotation

**Generates:**
- `routes/{model}/` folder
- 6 CRUD endpoints (list, get, create, update, delete, count)
- Standard controller
- Standard service

**Examples in Your Schema:**
- `Conversation` → `routes/conversation/`
- `Message` → `routes/message/`
- `User` → `routes/user/`
- `AIModelConfig` → `routes/aimodelconfig/` ✅
- `AIResponse` → `routes/airesponse/`
- `UsageLog` → `routes/usagelog/`

---

### Source 2: Service Integration Generator
**For:** Prisma models **with** `@service` annotation

**Generates:**
- `routes/{service-name}/` folder
- Custom endpoints from `@methods`
- Service controller
- Service scaffold

**Examples in Your Schema:**
- `@service ai-agent` on `AIPrompt` → `routes/ai-agent/` ✅
- `@service file-storage` on `FileUpload` → `routes/file-storage/`
- `@service payment-processor` on `Payment` → `routes/payment-processor/`
- `@service email-sender` on `EmailQueue` → `routes/email-sender/`
- `@service google-auth` on `OAuthAccount` → `routes/google-auth/`

---

### Source 3: Plugin Generator
**For:** Enabled plugins that need routes

**Generates:**
- `{plugin-category}/routes/` folder
- Plugin-specific endpoints

**Examples in Your Config:**
- `usageTracker` plugin → `monitoring/routes/` ✅
- (OpenAI, Claude, JWT don't have routes - service-level only)

---

## 🎯 Why Both `ai-agent` and `aiprompt`?

Wait, let me check if `aiprompt` routes were generated...

<function_calls>
<invoke name="run_terminal_cmd">
<parameter name="command">Test-Path generated/ai-chat-example-13/src/routes/aiprompt
