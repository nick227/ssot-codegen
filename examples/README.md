# 📚 SSOT Codegen Examples

This directory contains example Prisma schemas demonstrating different use cases.

---

## 🎯 Quick Start

### Option 1: Use Workspace .env (Recommended)

**Best for testing multiple examples:**

```bash
# 1. Setup workspace .env (one time)
cd ../..  # Go to workspace root
cp env.development.template .env
# Edit .env with your API keys

# 2. Generate any example
pnpm gen --schema examples/ai-chat-example/schema.prisma

# 3. Works immediately (uses workspace .env)
cd generated/ai-chat-example-1
pnpm install && pnpm dev  # ✅ Works!
```

### Option 2: Example-Specific .env

**Best for isolating example configurations:**

```bash
# 1. Setup example .env
cd examples/ai-chat-example
cp .env.example .env
# Edit .env with your API keys

# 2. Generate with example-specific env
pnpm gen --schema examples/ai-chat-example/schema.prisma

# 3. Generated project will find example .env
cd generated/ai-chat-example-1
pnpm install && pnpm dev  # ✅ Works!
```

---

## 📋 Examples Overview

### 🎯 Minimal Example
**Purpose:** Simplest possible schema  
**Keys Required:** Just `DATABASE_URL`  
**Best For:** Learning basics, quick testing

```bash
pnpm gen --schema examples/minimal/schema.prisma
```

### 📝 Blog Example
**Purpose:** Basic blog with posts, comments, users  
**Keys Required:** `DATABASE_URL`  
**Keys Optional:** Google OAuth, S3 storage  
**Best For:** Content management, authentication

```bash
pnpm gen --schema examples/blog-example/schema.prisma
```

### 🤖 AI Chat Example
**Purpose:** Chat application with AI providers  
**Keys Required:** `DATABASE_URL` + at least one AI provider  
**Providers:** OpenAI, Claude, Gemini, Grok, OpenRouter  
**Best For:** AI integrations, chat interfaces

```bash
pnpm gen --schema examples/ai-chat-example/schema.prisma
```

### 🛍️ E-commerce Example
**Purpose:** Full e-commerce platform  
**Keys Required:** `DATABASE_URL`, Payment provider, Email  
**Providers:** Stripe/PayPal, SendGrid, S3/Cloudinary  
**Best For:** Online stores, payment processing

```bash
pnpm gen --schema examples/ecommerce-example/schema.prisma
```

### 🏢 Enterprise API Example
**Purpose:** Large-scale API with multiple services  
**Keys Required:** Varies by enabled services  
**Best For:** Microservices, complex systems

```bash
pnpm gen --schema examples/02-enterprise-api/schema.prisma
```

### 🎨 Image Optimizer Example
**Purpose:** Image conversion and optimization API  
**Keys Required:** `DATABASE_URL` (FFmpeg required)  
**Features:** PNG↔JPG conversion, WebP/AVIF support, batch processing  
**Best For:** Image processing, media APIs, CDN optimization

```bash
pnpm gen --schema examples/05-image-optimizer/schema.prisma
```

---

## 🔑 Environment Variables

### Strategy

Each example has a `.env.example` file showing what keys it needs:

```
examples/
├── ai-chat-example/
│   ├── schema.prisma
│   └── .env.example       # Shows: OpenAI, Claude, etc.
│
├── ecommerce-example/
│   ├── schema.prisma
│   └── .env.example       # Shows: Stripe, SendGrid, S3
│
└── blog-example/
    ├── schema.prisma
    └── .env.example       # Shows: DATABASE_URL only
```

### Where to Put Your Keys

**Recommended: Workspace Root** (for testing multiple examples)
```bash
# One .env for ALL examples
ssot-codegen/.env
```

**Alternative: Per-Example** (for isolated testing)
```bash
# Separate .env per example
examples/ai-chat-example/.env
examples/ecommerce-example/.env
```

**Generated Projects:** Automatically find nearest .env

---

## 🧪 Testing Examples

### Test Without API Keys

```bash
# Generate basic example
pnpm gen --schema examples/minimal/schema.prisma

# Run structure tests (no API calls)
cd generated/minimal-1
pnpm test  # ✅ Pass
```

### Test With API Keys

```bash
# Setup workspace .env with your keys
cp env.development.template .env

# Generate example with plugins
pnpm gen --schema examples/ai-chat-example/schema.prisma

# Test with real APIs
cd generated/ai-chat-example-1
pnpm dev  # ✅ All providers work!
```

---

## 📊 Example Comparison

| Example | Complexity | API Keys Required | Best For |
|---------|-----------|------------------|----------|
| **Minimal** | ⭐ | 0 | Learning, testing |
| **Blog** | ⭐⭐ | 0 | Content sites |
| **AI Chat** | ⭐⭐⭐ | 1+ | AI integrations |
| **Image Optimizer** | ⭐⭐⭐ | 0 (needs FFmpeg) | Image processing, media APIs |
| **E-commerce** | ⭐⭐⭐⭐ | 3+ | Online stores |
| **Enterprise** | ⭐⭐⭐⭐⭐ | Varies | Large systems |

---

## 🎯 Choosing an Example

### I'm just learning
→ Start with **Minimal** or **Blog** example

### I want to test AI features
→ Use **AI Chat** example (requires AI API key)

### I need image processing
→ Use **Image Optimizer** example (requires FFmpeg installed)

### I'm building an online store
→ Use **E-commerce** example (requires Stripe + SendGrid)

### I need complex relationships
→ Use **Enterprise API** example

---

## 📚 Next Steps

1. **Choose an example** from the table above
2. **Check `.env.example`** to see what keys you need
3. **Setup your .env** (workspace or example-specific)
4. **Generate project:**
   ```bash
   pnpm gen --schema examples/YOUR-EXAMPLE/schema.prisma
   ```
5. **Test immediately:**
   ```bash
   cd generated/YOUR-EXAMPLE-1
   pnpm install && pnpm dev
   ```

---

## 🔒 Security Note

- ✅ `.env.example` files ARE committed (safe placeholders)
- ❌ `.env` files are NOT committed (your real keys)
- ✅ All `.env` files are in `.gitignore`
- ❌ Never commit real API keys

---

## 💡 Tips

1. **Use workspace .env** if testing multiple examples
2. **Use example .env** if you want isolated configs
3. **Check .env.example** first to see what keys you need
4. **Start with minimal** example if unsure
5. **Use test API keys** for development

---

**Ready to generate? Pick an example and run `pnpm gen --schema examples/YOUR-EXAMPLE/schema.prisma`** 🚀
