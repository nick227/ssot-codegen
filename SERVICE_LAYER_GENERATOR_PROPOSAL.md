# Service Layer Generator Proposal

**Question:** How do we generate complex service patterns (AI agents, workflows) while staying schema-driven?  
**Answer:** **Hybrid Approach** - Schema declares, developers implement, generator integrates  
**Philosophy:** SSOT for **WHAT** exists, TypeScript for **HOW** it works

---

## 🎯 **The Challenge: AI Agent Example**

You want to express this complex sequence in schema:

```
POST /api/ai/prompt
  ↓
1. Save prompt to database (AIPrompt table)
  ↓
2. Call OpenAI API (external service)
  ↓
3. Save AI response (AIResponse table)
  ↓
4. Return response text
  ↓
Includes: error handling, cost tracking, retry logic, rate limiting
```

**Problem:** This is too complex for pure schema generation!

---

## 💡 **Proposed Solution: Hybrid Schema-Driven Service Layer**

### **Core Concept:**

1. **Schema DECLARES** services exist and their methods (`@service` annotations)
2. **Developers IMPLEMENT** service logic (full TypeScript control)
3. **Generator INTEGRATES** services (controllers, routes, DTOs, validators)
4. **Pattern Library** provides scaffolds for common patterns

---

## 📋 **Concrete Design**

### **Step 1: Schema Annotations (Simple & Clean)**

```prisma
/// @service ai-agent
/// @provider openai
/// @methods sendPrompt, getHistory, retryFailed
/// @rateLimit 10/minute
model AIPrompt {
  id          Int          @id @default(autoincrement())
  userId      Int
  prompt      String       @db.Text
  model       String       @default("gpt-4")
  temperature Float?       @default(0.7)
  status      PromptStatus @default(PENDING)
  createdAt   DateTime     @default(now())
  
  user        User         @relation(fields: [userId], references: [id])
  response    AIResponse?
}

enum PromptStatus {
  PENDING
  PROCESSING  
  COMPLETED
  FAILED
}

/// @linkedTo AIPrompt
model AIResponse {
  id          Int      @id @default(autoincrement())
  promptId    Int      @unique
  response    String   @db.Text
  model       String
  tokens      Int
  cost        Decimal  @db.Decimal(10, 4)
  duration    Int      // milliseconds
  createdAt   DateTime @default(now())
  
  prompt      AIPrompt @relation(fields: [promptId], references: [id])
}
```

**Annotations Mean:**
- `@service ai-agent` - Service file expected at `src/services/ai-agent.service.ts`
- `@provider openai` - Hint for pattern library (could scaffold OpenAI boilerplate)
- `@methods sendPrompt, getHistory, retryFailed` - Methods that will be exposed via API
- `@rateLimit 10/minute` - Auto-apply rate limiting middleware

---

### **Step 2: Developer Writes Service (Full TypeScript Control)**

```typescript
// src/services/ai-agent.service.ts
// Developer has FULL control over implementation!

import { aiPromptService as baseService } from '@gen/services/aiprompt'
import { createAIProvider } from '../lib/ai-providers.js'
import prisma from '../db.js'
import { logger } from '../logger.js'
import type { PromptStatus } from '@prisma/client'

const openai = createAIProvider('openai')

interface AIOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

export const aiAgentService = {
  ...baseService,  // Include generated CRUD
  
  /**
   * Send prompt to AI and save response
   * @exposed sendPrompt  ← Generator reads this JSDoc tag
   * @auth required
   * @rateLimit 10/minute
   */
  async sendPrompt(userId: number, prompt: string, options?: AIOptions) {
    const startTime = Date.now()
    let promptRecord: any
    
    try {
      // 1. Create prompt record (PENDING status)
      promptRecord = await prisma.aiPrompt.create({
        data: {
          userId,
          prompt,
          model: options?.model || 'gpt-4',
          temperature: options?.temperature || 0.7,
          status: 'PROCESSING' as PromptStatus
        }
      })
      
      logger.info({ promptId: promptRecord.id, userId }, 'Processing AI prompt')
      
      // 2. Call AI provider (developer's full control)
      const aiResponse = await openai.chat.completions.create({
        model: promptRecord.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: promptRecord.temperature,
        max_tokens: options?.maxTokens
      })
      
      const responseText = aiResponse.choices[0].message.content
      const totalTokens = aiResponse.usage.total_tokens
      
      // 3. Save AI response with metadata
      const responseRecord = await prisma.aiResponse.create({
        data: {
          promptId: promptRecord.id,
          response: responseText,
          model: promptRecord.model,
          tokens: totalTokens,
          cost: this.calculateCost(totalTokens, promptRecord.model),
          duration: Date.now() - startTime
        }
      })
      
      // 4. Update prompt status to COMPLETED
      await prisma.aiPrompt.update({
        where: { id: promptRecord.id },
        data: { status: 'COMPLETED' as PromptStatus }
      })
      
      logger.info({ 
        promptId: promptRecord.id, 
        tokens: totalTokens,
        cost: responseRecord.cost,
        duration: responseRecord.duration
      }, 'AI prompt completed successfully')
      
      // 5. Return structured response
      return {
        promptId: promptRecord.id,
        responseId: responseRecord.id,
        text: responseText,
        tokens: totalTokens,
        cost: responseRecord.cost,
        duration: responseRecord.duration
      }
      
    } catch (error: any) {
      // Update status on failure
      if (promptRecord) {
        await prisma.aiPrompt.update({
          where: { id: promptRecord.id },
          data: { status: 'FAILED' as PromptStatus }
        }).catch(() => {}) // Ignore if update fails
      }
      
      logger.error({ error, userId, prompt }, 'AI prompt failed')
      throw new Error(`AI request failed: ${error.message}`)
    }
  },
  
  /**
   * Get prompt history for user
   * @exposed getHistory
   * @auth required
   */
  async getHistory(userId: number, limit: number = 20) {
    return prisma.aiPrompt.findMany({
      where: { userId },
      include: { 
        response: true,
        user: {
          select: { id: true, email: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  },
  
  /**
   * Retry failed prompt
   * @exposed retryFailed
   * @auth required
   * @ownership promptId
   */
  async retryFailed(promptId: number, userId: number) {
    const prompt = await prisma.aiPrompt.findUnique({ 
      where: { id: promptId }
    })
    
    if (!prompt) {
      throw new Error('Prompt not found')
    }
    
    if (prompt.userId !== userId) {
      throw new Error('Unauthorized: You can only retry your own prompts')
    }
    
    if (prompt.status !== 'FAILED') {
      throw new Error('Prompt is not in FAILED state')
    }
    
    // Retry with same parameters
    return this.sendPrompt(userId, prompt.prompt, {
      model: prompt.model,
      temperature: prompt.temperature || 0.7
    })
  },
  
  /**
   * Calculate AI API cost based on tokens and model
   */
  calculateCost(tokens: number, model: string): number {
    const pricing: Record<string, number> = {
      'gpt-4': 0.03,         // $0.03 per 1K tokens
      'gpt-4-turbo': 0.01,
      'gpt-3.5-turbo': 0.002,
      'claude-3-opus': 0.015,
      'claude-3-sonnet': 0.003
    }
    
    const costPer1k = pricing[model] || 0.002
    return (tokens / 1000) * costPer1k
  }
}
```

---

### **Step 3: Generator AUTO-GENERATES Integration Layer**

#### **A. DTOs for Service Methods** (auto-generated)

```typescript
// gen/contracts/ai-agent/send-prompt.dto.ts
export interface SendPromptDTO {
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface SendPromptResponseDTO {
  promptId: number
  responseId: number
  text: string
  tokens: number
  cost: number
  duration: number
}
```

#### **B. Validators** (auto-generated)

```typescript
// gen/validators/ai-agent/send-prompt.zod.ts
import { z } from 'zod'

export const SendPromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(4000, 'Prompt too long'),
  model: z.enum(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet']).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4000).optional()
})
```

#### **C. Controller** (auto-generated, wires to user's service)

```typescript
// gen/controllers/ai-agent/ai-agent.controller.ts
import type { Request, Response } from 'express'
import { aiAgentService } from '@/services/ai-agent.service.js'  // User's service!
import { SendPromptSchema } from '@gen/validators/ai-agent'
import { ZodError } from 'zod'
import { logger } from '@/logger'

/**
 * Send AI Prompt
 * @generated from @service annotation
 */
export const sendPrompt = async (req: AuthRequest, res: Response) => {
  try {
    const data = SendPromptSchema.parse(req.body)
    const userId = req.user!.userId  // From authenticate middleware
    
    const result = await aiAgentService.sendPrompt(userId, data.prompt, {
      model: data.model,
      temperature: data.temperature,
      maxTokens: data.maxTokens
    })
    
    return res.status(201).json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn({ error: error.errors }, 'Validation error in sendPrompt')
      return res.status(400).json({ error: 'Validation Error', details: error.errors })
    }
    logger.error({ error, userId: req.user?.userId }, 'AI prompt request failed')
    return res.status(500).json({ error: 'AI request failed' })
  }
}

/**
 * Get AI Prompt History
 * @generated from @service annotation
 */
export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20
    const userId = req.user!.userId
    
    const history = await aiAgentService.getHistory(userId, limit)
    return res.json(history)
  } catch (error) {
    logger.error({ error, userId: req.user?.userId }, 'Failed to get AI history')
    return res.status(500).json({ error: 'Failed to get history' })
  }
}

/**
 * Retry Failed Prompt
 * @generated from @service annotation
 */
export const retryFailed = async (req: AuthRequest, res: Response) => {
  try {
    const promptId = parseInt(req.params.id, 10)
    const userId = req.user!.userId
    
    const result = await aiAgentService.retryFailed(promptId, userId)
    return res.json(result)
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message })
    }
    logger.error({ error, userId: req.user?.userId, promptId: req.params.id }, 'Failed to retry prompt')
    return res.status(500).json({ error: error.message })
  }
}
```

#### **D. Routes** (auto-generated)

```typescript
// gen/routes/ai-agent/ai-agent.routes.ts
import { Router } from 'express'
import * as aiAgentController from '@gen/controllers/ai-agent'
import { authenticate } from '@/auth/jwt.js'
import { rateLimit } from 'express-rate-limit'

export const aiAgentRouter = Router()

// Rate limiting from @rateLimit annotation
const promptLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // From @rateLimit 10/minute
  message: 'Too many AI requests, please try again later'
})

// Auto-generated from @methods annotation
aiAgentRouter.post('/send', 
  authenticate,                    // From @auth in JSDoc
  promptLimiter,                   // From @rateLimit in schema
  aiAgentController.sendPrompt
)

aiAgentRouter.get('/history', 
  authenticate,
  aiAgentController.getHistory
)

aiAgentRouter.post('/:id/retry',
  authenticate,
  aiAgentController.retryFailed
)
```

---

## 🏗️ **Generator Architecture**

### **New Component: Service Linker**

```typescript
// packages/gen/src/service-linker.ts

interface ServiceAnnotation {
  name: string                 // Service name (e.g., 'ai-agent')
  methods: string[]            // Exposed methods
  provider?: string            // External provider hint
  rateLimit?: string           // Rate limit config
  auth?: boolean               // Requires authentication
  serviceFile: string          // Path to implementation
}

/**
 * Parse @service annotations from Prisma model documentation
 */
function parseServiceAnnotation(model: ParsedModel): ServiceAnnotation | null {
  const doc = model.documentation || ''
  
  // Parse: /// @service ai-agent
  const serviceMatch = doc.match(/@service\s+(\S+)/)
  if (!serviceMatch) return null
  
  const serviceName = serviceMatch[1]
  
  // Parse: /// @methods sendPrompt, getHistory, retryFailed
  const methodsMatch = doc.match(/@methods\s+([^\n]+)/)
  const methods = methodsMatch 
    ? methodsMatch[1].split(',').map(m => m.trim())
    : []
  
  // Parse: /// @provider openai
  const providerMatch = doc.match(/@provider\s+(\S+)/)
  
  // Parse: /// @rateLimit 10/minute
  const rateLimitMatch = doc.match(/@rateLimit\s+([^\n]+)/)
  
  return {
    name: serviceName,
    methods,
    provider: providerMatch?.[1],
    rateLimit: rateLimitMatch?.[1],
    auth: true,  // Default to auth required
    serviceFile: `./services/${serviceName}.service.ts`
  }
}

/**
 * Validate service file exists and exports declared methods
 */
async function validateServiceFile(annotation: ServiceAnnotation): Promise<void> {
  const servicePath = path.join(process.cwd(), 'src', annotation.serviceFile)
  
  if (!fs.existsSync(servicePath)) {
    throw new Error(`Service file not found: ${servicePath}`)
  }
  
  // Use ts-morph to inspect exports
  const project = new Project()
  const sourceFile = project.addSourceFileAtPath(servicePath)
  
  // Find service export
  const exports = sourceFile.getExportedDeclarations()
  const serviceExport = exports.get(toCamelCase(annotation.name) + 'Service')
  
  if (!serviceExport) {
    throw new Error(`Service ${annotation.name} not exported from ${servicePath}`)
  }
  
  // Validate methods exist
  for (const methodName of annotation.methods) {
    const method = findMethod(serviceExport, methodName)
    if (!method) {
      throw new Error(`Method ${methodName} not found in ${annotation.name} service`)
    }
    
    // Optionally validate signature
    if (!method.isAsync()) {
      console.warn(`Warning: ${methodName} should be async`)
    }
  }
  
  console.log(`✅ Validated service: ${annotation.name}`)
}
```

### **New Generator: Service Integration Generator**

```typescript
// packages/gen/src/generators/service-integration.generator.ts

/**
 * Generate controller integration for custom service
 */
function generateServiceController(
  model: ParsedModel,
  annotation: ServiceAnnotation
): string {
  const serviceName = toCamelCase(annotation.name)
  
  const methods = annotation.methods.map(methodName => {
    const methodCap = capitalize(methodName)
    
    return `
/**
 * ${methodCap}
 * @generated from @service annotation
 */
export const ${methodName} = async (req: AuthRequest, res: Response) => {
  try {
    // Parse and validate input (auto-generated validator)
    const data = ${methodCap}Schema.parse(req.body)
    const userId = req.user!.userId
    
    // Call user's service method
    const result = await ${serviceName}Service.${methodName}(userId, ...extractArgs(data))
    
    return res.status(201).json(result)
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn({ error: error.errors }, 'Validation error in ${methodName}')
      return res.status(400).json({ error: 'Validation Error', details: error.errors })
    }
    logger.error({ error }, 'Error in ${methodName}')
    return res.status(500).json({ error: 'Request failed' })
  }
}
`
  }).join('\n')
  
  return `// @generated service integration
import type { Request, Response } from 'express'
import type { AuthRequest } from '@/auth/jwt'
import { ${serviceName}Service } from '@/services/${annotation.name}.service.js'
import { logger } from '@/logger'
import { ZodError } from 'zod'

${methods}
`
}

/**
 * Generate routes for custom service
 */
function generateServiceRoutes(
  model: ParsedModel,
  annotation: ServiceAnnotation
): string {
  const serviceName = toCamelCase(annotation.name)
  const routes = annotation.methods.map((methodName, index) => {
    // Infer HTTP method and path from method name
    const httpMethod = methodName.startsWith('get') || methodName.startsWith('list') 
      ? 'get' 
      : 'post'
    const path = methodName.replace(/^(get|list|send|create|update|delete)/, '').toLowerCase() || methodName
    
    const middlewares = []
    if (annotation.auth) middlewares.push('authenticate')
    if (annotation.rateLimit) middlewares.push(`${serviceName}Limiter`)
    
    return `${serviceName}Router.${httpMethod}('/${path}', ${middlewares.join(', ')}, ${serviceName}Controller.${methodName})`
  }).join('\n')
  
  // Rate limiter if needed
  const rateLimiter = annotation.rateLimit ? `
const ${serviceName}Limiter = rateLimit({
  windowMs: parseRateLimit('${annotation.rateLimit}').windowMs,
  max: parseRateLimit('${annotation.rateLimit}').max,
  message: 'Too many requests to ${serviceName}'
})
` : ''
  
  return `// @generated service routes
import { Router } from 'express'
import * as ${serviceName}Controller from '@gen/controllers/${annotation.name}'
import { authenticate } from '@/auth/jwt.js'
${annotation.rateLimit ? "import { rateLimit } from 'express-rate-limit'" : ''}

export const ${serviceName}Router = Router()

${rateLimiter}

${routes}
`
}
```

---

## 📦 **Pattern Library (Scaffolding Templates)**

### **Pattern 1: AI Agent Service (Scaffold)**

When generator detects `@service ai-agent` but file doesn't exist:

```typescript
// Auto-generated scaffold at src/services/ai-agent.service.ts
import { aiPromptService as baseService } from '@gen/services/aiprompt'
import prisma from '../db.js'
import { logger } from '../logger.js'

// TODO: Install and configure your AI provider
// npm install openai
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const aiAgentService = {
  ...baseService,
  
  /**
   * Send prompt to AI and save response
   * @exposed sendPrompt
   * 
   * TODO: Implement your AI orchestration logic here
   */
  async sendPrompt(userId: number, prompt: string, options?: any) {
    // TODO: Step 1 - Save prompt to database
    const promptRecord = await prisma.aiPrompt.create({
      data: { userId, prompt, status: 'PROCESSING' }
    })
    
    // TODO: Step 2 - Call AI provider
    const aiResponse = await openai.chat.completions.create({
      model: options?.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    })
    
    // TODO: Step 3 - Save response to database
    const responseRecord = await prisma.aiResponse.create({
      data: {
        promptId: promptRecord.id,
        response: aiResponse.choices[0].message.content,
        tokens: aiResponse.usage.total_tokens,
        // Add more fields as needed
      }
    })
    
    // TODO: Step 4 - Return response
    return {
      promptId: promptRecord.id,
      text: responseRecord.response
    }
  },
  
  /**
   * Get prompt history
   * @exposed getHistory
   */
  async getHistory(userId: number, limit: number = 20) {
    // TODO: Implement history fetching
    return prisma.aiPrompt.findMany({
      where: { userId },
      include: { response: true },
      take: limit
    })
  }
}
```

---

### **Pattern 2: File Upload Service (Scaffold)**

```prisma
/// @service file-upload
/// @storage s3
/// @methods uploadFile, getFile, deleteFile
model FileUpload {
  id        Int      @id @default(autoincrement())
  userId    Int
  filename  String
  mimeType  String
  size      Int
  s3Key     String
  s3Bucket  String
  url       String?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}
```

**Generated Scaffold:**
```typescript
// src/services/file-upload.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import prisma from '../db.js'

const s3 = new S3Client({ region: process.env.AWS_REGION })

export const fileUploadService = {
  /**
   * Upload file to S3 and save metadata
   * @exposed uploadFile
   */
  async uploadFile(userId: number, file: Express.Multer.File) {
    // TODO: Implement S3 upload logic
    const s3Key = `uploads/${userId}/${Date.now()}-${file.originalname}`
    
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype
    }))
    
    return prisma.fileUpload.create({
      data: {
        userId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        s3Key,
        s3Bucket: process.env.S3_BUCKET!
      }
    })
  },
  
  /**
   * Get signed URL for file
   * @exposed getFile
   */
  async getFile(fileId: number, userId: number) {
    // TODO: Implement presigned URL generation
    const file = await prisma.fileUpload.findUnique({ where: { id: fileId } })
    
    if (!file || file.userId !== userId) {
      throw new Error('File not found or unauthorized')
    }
    
    const signedUrl = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: file.s3Bucket,
      Key: file.s3Key
    }), { expiresIn: 3600 })
    
    return { url: signedUrl, filename: file.filename }
  }
}
```

---

## 🔄 **Generator Workflow**

```
1. Parse Prisma Schema
   ↓
2. Detect @service Annotations
   ↓
3. Validate Service Files Exist
   ├── If missing → Generate Scaffold (with TODO comments)
   └── If exists → Validate exports match @methods
   ↓
4. Generate Integration Layer
   ├── DTOs (from method signatures)
   ├── Validators (Zod schemas)
   ├── Controllers (wire to user service)
   └── Routes (with auth, rate limiting)
   ↓
5. Generate OpenAPI Docs
   ↓
6. Generate Contract Tests
```

---

## 📊 **Comparison of Approaches**

| Approach | SSOT? | Flexibility | Complexity | Debug | Recommend |
|----------|-------|-------------|------------|-------|-----------|
| **1. Workflow DSL** | ✅ | ❌ Low | ❌ High | ❌ Hard | ❌ No |
| **2. Relation-Based** | ✅ | ⚠️ Medium | ⚠️ Medium | ⚠️ OK | ⚠️ Maybe |
| **3. Templates Only** | ❌ | ✅ High | ⚠️ Medium | ✅ Easy | ❌ No |
| **4. Hybrid (Proposed)** | ✅ | ✅ High | ✅ Low | ✅ Easy | ✅ **YES** |
| **5. Function Field DSL** | ✅ | ❌ Low | ❌ Very High | ❌ Hard | ❌ No |

---

## ✅ **Why Hybrid Approach Wins**

### **Maintains SSOT Philosophy:**
```prisma
/// @service ai-agent
/// @methods sendPrompt, getHistory
model AIPrompt { ... }
```
↓
**Schema IS the single source of truth for:**
- What services exist
- What methods they expose
- What models they operate on
- What external providers they use

### **Developer Control:**
```typescript
// src/services/ai-agent.service.ts
export const aiAgentService = {
  async sendPrompt(...) {
    // Full TypeScript control!
    // No DSL limitations
    // Full IDE support
    // Real debugging
  }
}
```

### **Generator Handles Integration:**
- ✅ DTOs generated from method signatures
- ✅ Validators generated (Zod)
- ✅ Controllers wire to user service
- ✅ Routes include auth + rate limiting
- ✅ OpenAPI docs auto-generated
- ✅ Contract tests auto-generated

---

## 🚀 **Implementation Plan**

### **Phase 1: Service Annotation Parser** (6 hours)
- Parse `@service`, `@methods`, `@provider`, `@rateLimit` annotations
- Validate service files exist
- Extract method signatures using ts-morph

### **Phase 2: Service Integration Generator** (8 hours)
- Generate DTOs from method signatures
- Generate validators (Zod)
- Generate controllers that wire to user services
- Generate routes with auth + rate limiting

### **Phase 3: Pattern Library** (12 hours)
- AI Agent scaffold
- File Upload scaffold
- Payment Processing scaffold
- Webhook Handler scaffold
- Email Queue scaffold

### **Phase 4: Testing & Documentation** (6 hours)
- Generate contract tests
- Update documentation
- Create examples

**Total:** 32 hours for complete service layer generation system

---

## 📝 **Example: Complete AI Agent Flow**

### **1. Schema (SSOT)**
```prisma
/// @service ai-agent
/// @methods sendPrompt, getHistory
model AIPrompt {
  id     Int    @id
  prompt String
}
```

### **2. Service (Developer Implementation)**
```typescript
export const aiAgentService = {
  async sendPrompt(userId, prompt) {
    // Full orchestration control
    const record = await savePrompt()
    const ai = await callOpenAI()
    const response = await saveResponse()
    return response
  }
}
```

### **3. Generated (Auto-Integration)**
- ✅ `SendPromptDTO` interface
- ✅ `SendPromptSchema` validator
- ✅ `sendPrompt` controller
- ✅ `POST /api/ai-agent/send` route
- ✅ OpenAPI documentation
- ✅ Contract tests

---

## 🎯 **Your Specific Question: AI Agent Schema**

**Problem:** "How do we grind the sequence down to a schema?"

**Answer:** **Don't grind it down!** 

The sequence is **orchestration logic** (HOW), not **contract** (WHAT).

**Schema should declare:**
```prisma
/// @service ai-agent
/// @methods sendPrompt(prompt: String, options: AIOptions) -> AIResponse
model AIPrompt { ... }
```

**TypeScript should implement:**
```typescript
async sendPrompt(userId, prompt, options) {
  // Step 1: Save prompt
  // Step 2: Call AI
  // Step 3: Save response
  // Step 4: Return
  // Full complexity here!
}
```

**Generator should integrate:**
- Wire `sendPrompt` to `POST /api/ai/send`
- Add auth middleware
- Add rate limiting
- Generate DTOs/validators
- Create tests

---

## 🎓 **Philosophy: SSOT vs. Implementation**

**SSOT (Schema)** declares:
- ✅ What services exist
- ✅ What methods they expose
- ✅ What inputs/outputs they have
- ✅ What auth/rate limiting is required

**TypeScript (Code)** implements:
- ✅ HOW orchestration works
- ✅ HOW to call external APIs
- ✅ HOW to handle errors
- ✅ HOW to optimize performance

**Generator** creates:
- ✅ Integration layer (controllers, routes)
- ✅ Type safety (DTOs, validators)
- ✅ Documentation (OpenAPI)
- ✅ Testing harness

---

## ✅ **Recommendation**

**Implement the Hybrid Approach with these components:**

1. **Service Annotation Parser** - Read `@service` from Prisma schema
2. **Service Validator** - Use ts-morph to ensure implementation exists
3. **Integration Generator** - Create controllers, routes, DTOs for services
4. **Pattern Library** - Provide scaffolds for common patterns (AI, files, payments)
5. **Documentation** - Guide developers on writing services

**Result:**
- ✅ SSOT maintained (schema declares services)
- ✅ Developer freedom (TypeScript for complex logic)
- ✅ Type safety (full TypeScript support)
- ✅ Auto-integration (generator handles wiring)
- ✅ Debuggable (real code, not DSL)

---

**Want me to build the POC Service Integration Generator?**

**Files to Create:**
1. `packages/gen/src/service-linker.ts` - Parse annotations
2. `packages/gen/src/generators/service-integration.generator.ts` - Generate integration
3. `packages/gen/src/patterns/ai-agent-scaffold.ts` - AI pattern template
4. Update `code-generator.ts` to use service linker
5. Example: `examples/ai-example/` with working AI agent

**Effort:** ~16 hours for MVP (Phases 1 & 2)  
**Result:** Production-ready service layer generation system

🚀 Shall I proceed with building it?

