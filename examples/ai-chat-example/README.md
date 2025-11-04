# AI Chat Example - Service Integration Pattern Showcase

🤖 **Demonstrates:** Service integration for complex AI workflows  
🎯 **Pattern:** Schema declares, TypeScript implements, Generator integrates  
✨ **Features:** OpenAI integration, conversation management, cost tracking, credit system

---

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
cd examples/ai-chat-example
pnpm install
```

### **2. Configure Environment**
Create `.env` file:
```bash
# Database
DATABASE_URL="mysql://root@localhost:3306/ai_chat_example"

# Server
PORT=3003
NODE_ENV=development

# OpenAI (REQUIRED - use your system environment variable)
OPENAI_API_KEY=your-key-here
# Or ensure OPENAI_API_KEY is set as system environment variable

# JWT
JWT_SECRET=your-secret-key-change-in-production
```

### **3. Setup Database**
```bash
npm run db:init
# Creates database, runs migrations, seeds test data
```

### **4. Generate Code**
```bash
npm run generate
# Generates standard CRUD + Service Integration for AI Agent
```

### **5. Start Server**
```bash
npm run dev
```

---

## 🤖 **Service Integration Pattern**

### **Schema Annotation** (`prisma/schema.prisma`)
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
  
  user        User         @relation(fields: [userId], references: [id])
  response    AIResponse?
}
```

### **Service Implementation** (`src/services/ai-agent.service.ts`)
```typescript
export const aiAgentService = {
  async sendMessage(userId, prompt, options) {
    // 12-STEP ORCHESTRATION:
    // 1. Create conversation (if new)
    // 2. Save user message
    // 3. Create prompt record (PROCESSING)
    // 4. Build conversation context
    // 5. Call OpenAI API
    // 6. Save AI response message
    // 7. Calculate cost
    // 8. Save response metadata
    // 9. Update prompt to COMPLETED
    // 10. Log usage
    // 11. Deduct credits
    // 12. Return formatted response
    
    return { promptId, responseId, text, tokens, cost, duration }
  }
}
```

### **Auto-Generated Integration**
- ✅ Controller (`gen/controllers/ai-agent/ai-agent.controller.ts`)
- ✅ Routes (`gen/routes/ai-agent/ai-agent.routes.ts`)
- ✅ DTOs & Validators
- ✅ Error handling (401, 403, 404, 500)
- ✅ Structured logging
- ✅ Rate limiting (from @rateLimit)

---

## 📡 **API Endpoints**

### **Authentication**
```bash
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

### **Standard CRUD** (Generated)
```bash
GET    /api/users
GET    /api/conversations
GET    /api/messages
GET    /api/ai-prompts
```

### **AI Agent Service Integration** (Generated from @service)
```bash
POST /api/ai-agent/send-message           # Send message to AI
POST /api/ai-agent/stream-message         # Stream AI response (SSE)
POST /api/ai-agent/regenerate-response    # Regenerate last response
GET  /api/ai-agent/usage-stats            # Get usage statistics
```

---

## 🧪 **Testing**

### **1. Register User**
```bash
POST http://localhost:3003/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "username": "testuser",
  "password": "Test123!@#"
}
```

### **2. Login**
```bash
POST http://localhost:3003/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!@#"
}

# Response:
{
  "accessToken": "eyJhbG...",
  "user": { "id": 1, "credits": 100 }
}
```

### **3. Send AI Message** (Service Integration!)
```bash
POST http://localhost:3003/api/ai-agent/send-message
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "prompt": "Explain quantum computing in simple terms",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7
}

# Response:
{
  "promptId": 1,
  "responseId": 1,
  "conversationId": 1,
  "text": "Quantum computing is...",
  "tokens": {
    "prompt": 8,
    "completion": 150,
    "total": 158
  },
  "cost": 0.000237,
  "duration": 2341,
  "model": "gpt-3.5-turbo"
}
```

### **4. Get Usage Stats**
```bash
GET http://localhost:3003/api/ai-agent/usage-stats?days=7
Authorization: Bearer <your-token>

# Response:
{
  "period": { "days": 7, "since": "2025-10-28T..." },
  "total": { "requests": 5, "tokens": 1234, "cost": 0.05 },
  "byModel": [
    { "model": "gpt-3.5-turbo", "requests": 3, "tokens": 800, "cost": 0.002 },
    { "model": "gpt-4", "requests": 2, "tokens": 434, "cost": 0.048 }
  ],
  "user": { "credits": 95, "role": "USER" }
}
```

---

## 📊 **What Gets Generated**

### **You Write:** 265 lines
- Schema with annotations (50 lines)
- AI agent service (215 lines)

### **Generator Creates:** 600+ lines
- Standard CRUD for all models (300 lines)
- Service integration (150 lines)
  - ai-agent.controller.ts
  - ai-agent.routes.ts
- DTOs & validators (150 lines)

**Ratio:** 3.3x code multiplier!

---

## 🎓 **Key Features Demonstrated**

### **1. Service Integration Pattern**
- Schema annotations declare services
- Developer implements orchestration
- Generator creates integration layer

### **2. Multi-Step Orchestration**
- 12-step workflow in service
- Multiple database operations
- External API call (OpenAI)
- Transaction-safe error handling

### **3. Cost & Usage Tracking**
- Token counting
- Cost calculation per model
- Usage logging
- Credit management

### **4. Conversation Context**
- Multi-turn conversations
- Context window management (last 20 messages)
- System prompts

### **5. Production-Ready**
- Structured logging
- Error handling
- Rate limiting
- Authentication
- Status management (PENDING, PROCESSING, COMPLETED, FAILED)

---

## 📁 **Project Structure**

```
ai-chat-example/
├── prisma/
│   └── schema.prisma                     # Schema with @service annotations
├── src/
│   ├── services/
│   │   └── ai-agent.service.ts           # YOUR AI orchestration (215 lines)
│   ├── auth/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── routes.ts
│   ├── config.ts
│   ├── db.ts
│   ├── logger.ts
│   ├── middleware.ts
│   ├── server.ts
│   └── app.ts
├── gen/                                   # GENERATED CODE
│   ├── services/                          # Standard CRUD
│   ├── controllers/
│   │   └── ai-agent/
│   │       └── ai-agent.controller.ts     # ✨ Service integration!
│   └── routes/
│       └── ai-agent/
│           └── ai-agent.routes.ts         # ✨ Service integration routes!
├── scripts/
│   ├── generate.js
│   ├── db-setup.js
│   └── seed.js
└── package.json
```

---

## 🎯 **Comparison: Manual vs Service Integration**

### **Manual Approach** (505 lines):
- Schema (50)
- Service implementation (215)
- Controller integration (80) ← MANUAL 😡
- Route wiring (40) ← MANUAL 😡
- Error handling (30) ← MANUAL 😡
- Rate limiting (20) ← MANUAL 😡
- DTOs (40) ← MANUAL 😡
- Validators (30) ← MANUAL 😡

### **Service Integration** (265 lines):
- Schema with annotations (50)
- Service implementation (215)
- ✅ Everything else AUTO-GENERATED!

**Savings:** 240 lines (47% less code!)

---

## ✅ **Summary**

This example showcases the **service integration pattern** - perfect for:
- 🤖 AI agents and chatbots
- 📁 File upload services
- 💳 Payment processing
- 📧 Email queues
- 🔗 Webhook handlers
- 🔄 Any complex multi-step workflow

**Philosophy:**
- Schema = WHAT exists
- TypeScript = HOW it works
- Generator = Integration layer

**Result:**
- Write 265 lines
- Get 865 total lines
- 3.3x code multiplier!

---

**Next:** Run `npm run generate` to see service integration in action! 🚀

