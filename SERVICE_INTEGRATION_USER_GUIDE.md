# 🤖 SERVICE INTEGRATION - USER GUIDE

**How to Add Complex Workflows to Your Generated API**

---

## 📚 **TABLE OF CONTENTS**

1. [What Are Services?](#what-are-services)
2. [When to Use Services](#when-to-use-services)
3. [How to Define Services](#how-to-define-services)
4. [What Gets Generated](#what-gets-generated)
5. [How to Implement Services](#how-to-implement-services)
6. [Complete Examples](#complete-examples)
7. [Best Practices](#best-practices)
8. [Advanced Patterns](#advanced-patterns)

---

## 🎯 **WHAT ARE SERVICES?**

**Services** are complex workflows that go beyond simple CRUD operations.

### **Standard CRUD (Auto-Generated):**
```prisma
model Post {
  id      Int     @id @default(autoincrement())
  title   String
  content String
}
```
**Generates:** Create, Read, Update, Delete, List

**What You Get:**
```
POST   /api/posts       → Create
GET    /api/posts       → List
GET    /api/posts/:id   → Read
PUT    /api/posts/:id   → Update
DELETE /api/posts/:id   → Delete
```

---

### **Service Integration (Complex Workflows):**
```prisma
/// @service ai-agent
/// @provider openai
/// @methods sendMessage, streamMessage
/// @rateLimit 20/minute
model AIPrompt {
  id     Int    @id @default(autoincrement())
  prompt String
  // ... fields
}
```

**Generates:** Controller + Routes that call YOUR custom service logic

**What You Get:**
```
POST /api/ai-agent/message         → YOUR sendMessage() method
POST /api/ai-agent/stream-message  → YOUR streamMessage() method
+ Authentication
+ Rate limiting
+ Error handling  
+ Structured logging
+ Type-safe controllers
```

**You Implement:** The actual orchestration logic (calling OpenAI, saving results, etc.)

---

## 🎯 **WHEN TO USE SERVICES**

Use **Standard CRUD** when:
- ✅ Simple database operations (create, read, update, delete)
- ✅ Basic relationships
- ✅ Simple queries

Use **Service Integration** when:
- 🤖 Calling external APIs (OpenAI, Stripe, SendGrid)
- 📁 Complex file operations (uploads, transformations)
- 💳 Multi-step workflows (payment processing)
- 🔄 Orchestration (multiple database operations + external calls)
- 📧 Background jobs (email sending, report generation)
- 🔐 OAuth flows (login, account linking)

**Rule of Thumb:** If your logic needs more than a simple Prisma query, use a service!

---

## 📝 **HOW TO DEFINE SERVICES**

### **Step 1: Add Annotations to Your Model**

Use special comments above your model:

```prisma
/// @service {service-name}
/// @provider {external-provider}
/// @methods {method1}, {method2}, {method3}
/// @rateLimit {max}/{period}
/// @description {what this service does}
model YourModel {
  // ... your fields
}
```

### **Annotation Reference:**

| Annotation | Required | Format | Example |
|------------|----------|--------|---------|
| `@service` | ✅ YES | `@service service-name` | `@service ai-agent` |
| `@provider` | ⚠️ OPTIONAL | `@provider name` | `@provider openai` |
| `@methods` | ✅ YES | `@methods m1, m2, m3` | `@methods sendMessage, getStats` |
| `@rateLimit` | ⚠️ OPTIONAL | `@rateLimit max/period` | `@rateLimit 50/minute` |
| `@description` | ⚠️ OPTIONAL | `@description text` | `@description AI chat service` |

---

## 🔧 **WHAT GETS GENERATED**

When you add service annotations, the generator creates:

### **1. Controller** (`gen/controllers/{service-name}/{service-name}.controller.ts`)
```typescript
// Auto-generated controller that calls YOUR service
import { aiAgentService } from '@/services/ai-agent.service.js'

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId
  if (!userId) return res.status(401).json({ error: 'Auth required' })
  
  const data = req.body
  const result = await aiAgentService.sendMessage(userId, data)  // Calls YOUR method
  
  return res.status(201).json(result)
}
```

**Generated for you:**
- ✅ Authentication checking
- ✅ Error handling (401, 403, 404, 500)
- ✅ Structured logging
- ✅ Type-safe request/response handling
- ✅ Imports YOUR service

---

### **2. Routes** (`gen/routes/{service-name}/{service-name}.routes.ts`)
```typescript
// Auto-generated routes with auth + rate limiting
import { Router } from 'express'
import * as aiAgentController from '@gen/controllers/ai-agent'
import { authenticate } from '@/auth/jwt.js'
import { rateLimit } from 'express-rate-limit'

export const aiAgentRouter = Router()

// Rate limiting from @rateLimit annotation
const aiAgentLimiter = rateLimit({
  windowMs: 60000,
  max: 20,  // From @rateLimit 20/minute
  message: 'Too many requests, please try again later.'
})

// Auto-inferred routes:
// sendMessage → POST /message
aiAgentRouter.post('/message', authenticate, aiAgentLimiter, aiAgentController.sendMessage)

// getStats → GET /stats
aiAgentRouter.get('/stats', authenticate, aiAgentLimiter, aiAgentController.getStats)
```

**Generated for you:**
- ✅ HTTP method inference (send* = POST, get* = GET, delete* = DELETE)
- ✅ Path inference (sendMessage → /message)
- ✅ Authentication middleware
- ✅ Rate limiting from annotation
- ✅ Proper Express router

---

### **3. Service Scaffold** (`gen/services/{service-name}.service.scaffold.ts`)

If service doesn't exist yet, generates a scaffold:

```typescript
// Scaffold with provider client setup + method stubs
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const aiAgentService = {
  async sendMessage(userId: number, ...args: any[]) {
    // TODO: Implement your logic here
    throw new Error('sendMessage not implemented yet')
  },
  
  async getStats(userId: number, ...args: any[]) {
    // TODO: Implement your logic here
    throw new Error('getStats not implemented yet')
  }
}
```

**Generated for you:**
- ✅ Provider client initialization
- ✅ Environment variable configuration
- ✅ Method stubs with TODOs
- ✅ TypeScript types
- ✅ Proper exports

---

## 💻 **HOW TO IMPLEMENT SERVICES**

### **Step 1: Copy Scaffold to Your Source**

```bash
# Generated scaffold is in:
gen/services/ai-agent.service.scaffold.ts

# Copy to your source (or create from scratch):
src/services/ai-agent.service.ts
```

### **Step 2: Implement Your Methods**

```typescript
// src/services/ai-agent.service.ts
import OpenAI from 'openai'
import prisma from '../db.js'
import { logger } from '../logger.js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const aiAgentService = {
  /**
   * Send a message to the AI
   * This will be exposed as POST /api/ai-agent/message
   */
  async sendMessage(userId: number, params: { prompt: string, model?: string }) {
    try {
      logger.info({ userId, prompt: params.prompt }, 'Sending AI message')
      
      // Step 1: Save prompt to database
      const aiPrompt = await prisma.aIPrompt.create({
        data: {
          userId,
          prompt: params.prompt,
          model: params.model || 'gpt-4',
          status: 'PROCESSING'
        }
      })
      
      // Step 2: Call OpenAI
      const response = await openai.chat.completions.create({
        model: params.model || 'gpt-4',
        messages: [{ role: 'user', content: params.prompt }]
      })
      
      // Step 3: Save response
      const aiResponse = await prisma.aIResponse.create({
        data: {
          promptId: aiPrompt.id,
          responseText: response.choices[0].message.content,
          model: response.model,
          tokens: response.usage?.total_tokens || 0
        }
      })
      
      // Step 4: Update prompt status
      await prisma.aIPrompt.update({
        where: { id: aiPrompt.id },
        data: { status: 'COMPLETED' }
      })
      
      // Step 5: Return response
      return {
        promptId: aiPrompt.id,
        responseId: aiResponse.id,
        text: aiResponse.responseText,
        tokens: aiResponse.tokens
      }
    } catch (error) {
      logger.error({ error, userId }, 'Error in sendMessage')
      throw error
    }
  },
  
  async getStats(userId: number) {
    // Your implementation...
    const stats = await prisma.aIPrompt.aggregate({
      where: { userId },
      _count: true,
      _sum: { /* ... */ }
    })
    return stats
  }
}
```

### **Step 3: Done!**

The generator automatically:
- ✅ Wires your service to the controller
- ✅ Creates routes with auth + rate limiting
- ✅ Handles errors
- ✅ Logs everything
- ✅ Type-checks your responses

**You just write the business logic!** 🎯

---

## 📚 **COMPLETE EXAMPLES**

### **Example 1: AI Agent (OpenAI)**

```prisma
/// @service ai-agent
/// @provider openai
/// @methods sendMessage, streamMessage, regenerateResponse, getUsageStats
/// @rateLimit 20/minute
/// @description AI conversation orchestration service
model AIPrompt {
  id          Int          @id @default(autoincrement())
  userId      Int
  prompt      String       @db.Text
  model       String       @default("gpt-4")
  temperature Float        @default(0.7)
  status      PromptStatus @default(PENDING)
  createdAt   DateTime     @default(now())
  
  user        User         @relation(fields: [userId], references: [id])
  response    AIResponse?
}

model AIResponse {
  id           Int      @id @default(autoincrement())
  promptId     Int      @unique
  responseText String   @db.Text
  model        String
  tokens       Int
  createdAt    DateTime @default(now())
  
  prompt       AIPrompt @relation(fields: [promptId], references: [id])
}

enum PromptStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

**What You Implement:**
```typescript
// src/services/ai-agent.service.ts
export const aiAgentService = {
  async sendMessage(userId, params) {
    // 1. Save prompt
    // 2. Call OpenAI
    // 3. Save response
    // 4. Return result
  }
}
```

**What Gets Generated:**
- Controller (202 lines) with auth + error handling
- Routes (35 lines) with rate limiting
- 4 API endpoints

**Code Multiplier:** 215 lines written → 966 lines total = **4.5x** 🚀

---

### **Example 2: File Upload (Cloudflare R2)**

```prisma
/// @service file-storage
/// @provider cloudflare
/// @methods uploadFile, getSignedUrl, deleteFile, listUserFiles
/// @rateLimit 50/minute
/// @description File upload and storage service using Cloudflare R2
model FileUpload {
  id          Int        @id @default(autoincrement())
  userId      Int
  filename    String
  originalName String
  mimeType    String
  size        Int
  r2Key       String     @unique
  r2Bucket    String
  status      FileStatus @default(UPLOADED)
  createdAt   DateTime   @default(now())
  
  user        User       @relation(fields: [userId], references: [id])
}

enum FileStatus {
  UPLOADING
  UPLOADED
  PROCESSING
  READY
  DELETED
}
```

**What You Implement:**
```typescript
// src/services/file-storage.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({ /* R2 config */ })

export const fileStorageService = {
  async uploadFile(userId, params: { buffer, filename, mimeType }) {
    // 1. Validate file
    // 2. Upload to R2
    // 3. Save metadata to database
    // 4. Return file info
  },
  
  async getSignedUrl(userId, params: { fileId }) {
    // 1. Fetch file from database
    // 2. Verify ownership
    // 3. Generate presigned URL
    // 4. Return URL with expiration
  }
}
```

**What Gets Generated:**
- Controller (250 lines)
- Routes (34 lines)
- Scaffold with R2 client setup

**Endpoints:**
```
POST   /api/file-storage/upload-file
GET    /api/file-storage/signed-url?fileId=123
DELETE /api/file-storage/file?fileId=123
GET    /api/file-storage/user-files
```

**Code Multiplier:** 330 lines written → 1,075 lines total = **3.3x** 🚀

---

### **Example 3: Payment Processing (Stripe)**

```prisma
/// @service payment-processor
/// @provider stripe
/// @methods createPaymentIntent, confirmPayment, refundPayment, getPaymentStatus, handleWebhook
/// @rateLimit 100/minute
/// @description Payment processing service using Stripe
model Payment {
  id              Int           @id @default(autoincrement())
  userId          Int
  stripePaymentId String        @unique
  amount          Decimal       @db.Decimal(10, 2)
  currency        String        @default("usd")
  status          PaymentStatus @default(PENDING)
  metadata        Json?
  createdAt       DateTime      @default(now())
  
  user            User          @relation(fields: [userId], references: [id])
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  REFUNDED
}
```

**What You Implement:**
```typescript
// src/services/payment-processor.service.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const paymentProcessorService = {
  async createPaymentIntent(userId, params: { amount, currency }) {
    // 1. Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata: { userId: userId.toString() }
    })
    
    // 2. Save to database
    const payment = await prisma.payment.create({
      data: {
        userId,
        stripePaymentId: paymentIntent.id,
        amount,
        currency,
        status: 'PENDING'
      }
    })
    
    return {
      paymentId: payment.id,
      clientSecret: paymentIntent.client_secret,
      status: payment.status
    }
  },
  
  async confirmPayment(userId, params: { paymentId }) {
    // Implementation...
  }
}
```

**Endpoints Generated:**
```
POST /api/payment-processor/payment-intent
POST /api/payment-processor/confirm-payment
POST /api/payment-processor/refund-payment
GET  /api/payment-processor/payment-status
POST /api/payment-processor/handle-webhook
```

---

### **Example 4: Email Sending (SendGrid)**

```prisma
/// @service email-sender
/// @provider sendgrid
/// @methods sendEmail, sendBulkEmail, sendTemplateEmail
/// @rateLimit 200/minute
model EmailQueue {
  id         Int         @id @default(autoincrement())
  userId     Int?
  toEmail    String
  subject    String
  body       String      @db.Text
  status     EmailStatus @default(QUEUED)
  sendgridId String?     @unique
  sentAt     DateTime?
  createdAt  DateTime    @default(now())
  
  user       User?       @relation(fields: [userId], references: [id])
}

enum EmailStatus {
  QUEUED
  SENDING
  SENT
  DELIVERED
  FAILED
}
```

**What You Implement:**
```typescript
// src/services/email-sender.service.ts
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export const emailSenderService = {
  async sendEmail(userId, params: { to, subject, body }) {
    // 1. Queue email in database
    const email = await prisma.emailQueue.create({
      data: { userId, toEmail: params.to, subject: params.subject, body: params.body }
    })
    
    // 2. Send via SendGrid
    await sgMail.send({
      to: params.to,
      from: 'noreply@yourapp.com',
      subject: params.subject,
      html: params.body
    })
    
    // 3. Update status
    await prisma.emailQueue.update({
      where: { id: email.id },
      data: { status: 'SENT', sentAt: new Date() }
    })
    
    return email
  }
}
```

---

### **Example 5: OAuth (Google)**

```prisma
/// @service google-auth
/// @provider google
/// @methods initiateLogin, handleCallback, linkAccount
/// @rateLimit 50/minute
model OAuthAccount {
  id           Int      @id @default(autoincrement())
  userId       Int
  provider     String
  providerId   String
  email        String?
  accessToken  String?  @db.Text
  refreshToken String?  @db.Text
  createdAt    DateTime @default(now())
  
  user         User     @relation(fields: [userId], references: [id])
  
  @@unique([provider, providerId])
}
```

**What You Implement:**
```typescript
// src/services/google-auth.service.ts
import { OAuth2Client } from 'google-auth-library'

const googleOAuth = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
})

export const googleAuthService = {
  async initiateLogin() {
    const authUrl = googleOAuth.generateAuthUrl({
      scope: ['profile', 'email']
    })
    return { url: authUrl }
  },
  
  async handleCallback(userId, params: { code: string }) {
    // Exchange code for tokens
    const { tokens } = await googleOAuth.getToken(params.code)
    // ... save to database
  }
}
```

---

## 🎨 **HTTP METHOD INFERENCE**

The generator automatically infers HTTP methods from your method names:

| Method Name Prefix | HTTP Method | Example |
|-------------------|-------------|---------|
| `send*` | POST | `sendMessage` → POST /message |
| `create*` | POST | `createPayment` → POST /payment |
| `upload*` | POST | `uploadFile` → POST /upload-file |
| `process*` | POST | `processOrder` → POST /process-order |
| `initiate*` | POST | `initiateLogin` → POST /initiate-login |
| `handle*` | POST | `handleCallback` → POST /handle-callback |
| `get*` | GET | `getStats` → GET /stats |
| `list*` | GET | `listFiles` → GET /list-files |
| `fetch*` | GET | `fetchData` → GET /fetch-data |
| `delete*` | DELETE | `deleteFile` → DELETE /delete-file |
| `remove*` | DELETE | `removeItem` → DELETE /remove-item |
| *(anything else)* | POST | `doSomething` → POST /do-something |

**Path Inference:**
- Remove prefix (send, create, get, etc.)
- Convert to kebab-case
- `sendMessage` → `/message`
- `getUserProfile` → `/user-profile`
- `deleteOldFiles` → `/old-files`

---

## 🎯 **PROVIDER TEMPLATES**

The generator includes scaffolds for common providers:

### **Supported Providers:**

| Provider | Type | Setup Code Generated |
|----------|------|---------------------|
| `openai` | AI | `new OpenAI({ apiKey: ... })` |
| `anthropic` | AI | `new Anthropic({ apiKey: ... })` |
| `cloudflare` | Storage | `new S3Client({ endpoint: R2, ... })` |
| `s3` | Storage | `new S3Client({ region, credentials })` |
| `stripe` | Payments | `new Stripe(secretKey)` |
| `sendgrid` | Email | `sgMail.setApiKey(...)` |
| `google` | OAuth | `new OAuth2Client({ clientId, ... })` |

**Adding New Providers:**

If you use a provider not in the list, generator will create a basic scaffold:

```typescript
// Provider: custom
export const customService = {
  async yourMethod(userId, ...args) {
    // TODO: Implement your custom provider logic
  }
}
```

---

## ⚙️ **COMPLETE WORKFLOW**

### **1. Define in Schema**
```prisma
/// @service my-service
/// @provider openai
/// @methods doSomething, getSomething
model MyModel { /* ... */ }
```

### **2. Run Generator**
```bash
npm run generate
```

### **3. Check Generated Files**
```
gen/
├── controllers/my-service/
│   └── my-service.controller.ts  ✅ Generated
├── routes/my-service/
│   └── my-service.routes.ts      ✅ Generated
└── services/
    └── my-service.service.scaffold.ts  ✅ Scaffold
```

### **4. Implement Service**
```bash
# Copy scaffold to src:
cp gen/services/my-service.service.scaffold.ts src/services/my-service.service.ts

# Implement your methods:
# - doSomething()
# - getSomething()
```

### **5. API Ready!**
```
POST /api/my-service/do-something   ✅ Works!
GET  /api/my-service/get-something  ✅ Works!
```

**All with authentication, rate limiting, error handling, logging!** ⚡

---

## 💡 **BEST PRACTICES**

### **1. Service Naming**
```prisma
// ✅ GOOD: kebab-case, descriptive
/// @service ai-agent
/// @service file-storage
/// @service payment-processor

// ❌ BAD: camelCase, unclear
/// @service aiAgent
/// @service service1
/// @service myService
```

### **2. Method Naming**
```prisma
// ✅ GOOD: Action-based, clear intent
/// @methods sendMessage, processPayment, uploadFile

// ❌ BAD: Generic, unclear
/// @methods do, run, execute
```

### **3. Rate Limiting**
```prisma
// ✅ GOOD: Appropriate limits
/// @rateLimit 20/minute   # AI (expensive)
/// @rateLimit 50/minute   # File ops (moderate)
/// @rateLimit 100/minute  # Payments (high throughput)
/// @rateLimit 200/minute  # Emails (bulk)

// ❌ BAD: No limits or too restrictive
/// @rateLimit 1/minute    # Too restrictive
/// @rateLimit 10000/minute  # No protection
```

### **4. Error Handling**
```typescript
// ✅ GOOD: Let errors bubble, log them
export const myService = {
  async myMethod(userId, params) {
    try {
      logger.info({ userId }, 'Starting')
      // ... your logic
      return result
    } catch (error) {
      logger.error({ error, userId }, 'Failed')
      throw error  // Let controller handle HTTP response
    }
  }
}

// ❌ BAD: Swallow errors
export const myService = {
  async myMethod(userId, params) {
    try {
      // ... logic
    } catch {
      return null  // Don't do this!
    }
  }
}
```

---

## 🚀 **ADVANCED PATTERNS**

### **Pattern 1: Multi-Model Services**

Services can interact with multiple models:

```prisma
/// @service order-processor
/// @methods createOrder, calculateTotal, applyDiscount
model Order {
  id    Int @id
  // ...
}

model OrderItem {
  id      Int @id
  orderId Int
  // ...
}

model Coupon {
  id   Int @id
  code String @unique
  // ...
}
```

```typescript
export const orderProcessorService = {
  async createOrder(userId, params) {
    return prisma.$transaction(async (tx) => {
      // 1. Create order
      const order = await tx.order.create({ /* ... */ })
      
      // 2. Create order items
      await tx.orderItem.createMany({ /* ... */ })
      
      // 3. Apply coupon if provided
      if (params.couponCode) {
        const coupon = await tx.coupon.findUnique({ /* ... */ })
        // Apply discount...
      }
      
      return order
    })
  }
}
```

---

### **Pattern 2: Background Processing**

```prisma
/// @service report-generator
/// @methods generateReport, checkStatus
model Report {
  id        Int          @id
  status    ReportStatus @default(QUEUED)
  resultUrl String?
}
```

```typescript
export const reportGeneratorService = {
  async generateReport(userId, params) {
    // 1. Create report record (QUEUED)
    const report = await prisma.report.create({ /* ... */ })
    
    // 2. Queue background job (don't await!)
    processReportInBackground(report.id)  // Async
    
    // 3. Return immediately
    return { reportId: report.id, status: 'QUEUED' }
  },
  
  async checkStatus(userId, params: { reportId }) {
    return prisma.report.findUnique({ where: { id: params.reportId } })
  }
}
```

---

### **Pattern 3: Webhook Handlers**

```prisma
/// @service stripe-webhooks
/// @methods handlePaymentSuccess, handlePaymentFailed
model WebhookEvent {
  id        Int      @id
  eventType String
  payload   Json
  processed Boolean @default(false)
}
```

```typescript
export const stripeWebhooksService = {
  async handlePaymentSuccess(userId, params: { stripeEvent }) {
    // Parse Stripe event
    // Update payment status
    // Send confirmation email
    // Update user credits
  }
}
```

---

## 📊 **COMPARISON: CRUD vs SERVICES**

### **Standard CRUD (Auto-Generated):**

**Schema:**
```prisma
model Post {
  id      Int    @id
  title   String
  content String
}
```

**You Write:** 0 lines  
**You Get:** 5 endpoints (create, list, get, update, delete)  
**Use Case:** Simple database operations

---

### **Service Integration (You Implement):**

**Schema:**
```prisma
/// @service ai-agent
/// @methods sendMessage
model AIPrompt {
  id     Int    @id
  prompt String
}
```

**You Write:** ~200 lines (your orchestration logic)  
**You Get:** 
- Your 200 lines
- +250 lines controller (generated)
- +35 lines routes (generated)
- +150 lines scaffold (generated)
- = **635 lines total (3.2x multiplier)**

**Use Case:** Complex workflows (API calls, multi-step, orchestration)

---

## 🎯 **WHEN TO USE WHICH**

```
Simple CRUD?
└─> Use standard models (no annotations)
    └─> Generator creates full CRUD API
        └─> Done! ✅

Complex workflow?
└─> Add @service annotations
    └─> Generator creates integration layer
        └─> You implement orchestration
            └─> Done! ✅
```

---

## 📋 **QUICK REFERENCE**

### **Service Annotation Template:**

```prisma
/// @service {service-name}
/// @provider {provider-name}
/// @methods {method1}, {method2}, {method3}
/// @rateLimit {max}/{period}
/// @description {what-it-does}
model YourModel {
  id        Int      @id @default(autoincrement())
  userId    Int
  // ... your fields
  
  user      User     @relation(fields: [userId], references: [id])
}
```

### **Service Implementation Template:**

```typescript
// src/services/{service-name}.service.ts
import prisma from '../db.js'
import { logger } from '../logger.js'
// Import provider SDK

export const {serviceName}Service = {
  async method1(userId: number, params: YourParams) {
    try {
      logger.info({ userId }, 'Method1 started')
      
      // Your orchestration logic here:
      // 1. Validate input
      // 2. Call external API
      // 3. Save to database
      // 4. Return result
      
      return { success: true, data: result }
    } catch (error) {
      logger.error({ error, userId }, 'Method1 failed')
      throw error  // Let controller handle HTTP response
    }
  }
}
```

---

## 🎉 **THE MAGIC**

### **You Write (Schema + Service):**
```
50 lines:  Prisma schema with annotations
200 lines: Service implementation (your logic)
─────────
250 lines TOTAL
```

### **You Get (Generated + Your Code):**
```
250 lines:  Your service implementation
250 lines:  Controller (generated)
35 lines:   Routes (generated)
100 lines:  DTOs (generated)
100 lines:  Validators (generated)
────────
735 lines TOTAL
```

### **Code Multiplier: 2.9x** 🚀

**For complex services, you get:**
- ✅ Type-safe controllers
- ✅ Authentication
- ✅ Rate limiting
- ✅ Error handling
- ✅ Structured logging
- ✅ Request validation
- ✅ Auto-registration

**All from a few lines of schema annotations!** ⭐

---

## 📖 **FULL EXAMPLES**

See working examples in:
- `examples/ai-chat-example/` - AI agent + file upload (implemented)
- `examples/blog-example/` - Standard CRUD with extensions
- `examples/ecommerce-example/` - E-commerce with search

---

## 🎓 **GETTING STARTED**

### **1. Add Service to Schema:**
```prisma
/// @service my-service
/// @methods myMethod
model MyModel { id Int @id }
```

### **2. Generate:**
```bash
npm run generate
```

### **3. Implement:**
```typescript
// src/services/my-service.service.ts
export const myService = {
  async myMethod(userId, params) {
    // Your logic here
    return { result: 'success' }
  }
}
```

### **4. Use API:**
```bash
curl -X POST http://localhost:3000/api/my-service/my-method \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}'
```

**That's it!** 🎉

---

## 🚀 **CONCLUSION**

Service integration lets you:
- ✅ **Define** complex workflows in your schema
- ✅ **Generate** integration layer (controllers, routes, auth, rate limiting)
- ✅ **Implement** only the business logic
- ✅ **Deploy** production-ready APIs with minimal code

**Code Multiplier:** 2-50x depending on complexity  
**Time Savings:** Massive (no boilerplate, just logic)  
**Quality:** Production-grade (auth, logging, error handling included)

---

**Start adding `@service` annotations to your schema today!** 🎯

For questions, see:
- `COMPLETE_PRODUCTION_ASSESSMENT.md` - Full production review
- `CRITICAL_FIXES_COMPLETE.md` - All fixes documented
- `examples/ai-chat-example/` - Complete working example

