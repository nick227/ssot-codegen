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
**Purpose:** Simplest possible schema (User + Post)  
**Keys Required:** Just `DATABASE_URL`  
**Best For:** Learning basics, quick testing

```bash
pnpm gen --schema examples/minimal/schema.prisma
```

### 📝 Basic Blog Example
**Purpose:** Registry pattern demonstration  
**Keys Required:** `DATABASE_URL`  
**Features:** Posts, Comments, Search  
**Best For:** Understanding the registry pattern

```bash
pnpm gen --schema examples/01-basic-blog/schema.prisma
```

### 📚 Blog Example (Full Featured)
**Purpose:** Production blog platform  
**Keys Required:** `DATABASE_URL`  
**Features:** Authors, Posts, Comments, Categories, Tags  
**Best For:** Content management systems

```bash
pnpm gen --schema examples/blog-example/schema.prisma
```

### 🏢 Enterprise API Example
**Purpose:** All enterprise features demonstrated  
**Keys Required:** `DATABASE_URL`, `REDIS_URL` (optional)  
**Features:** Auth, RBAC, Caching, Events, Search  
**Best For:** Production APIs, enterprise applications

```bash
pnpm gen --schema examples/02-enterprise-api/schema.prisma
```

### 🏢 Multi-Tenant SaaS Example
**Purpose:** Multi-tenant architecture  
**Keys Required:** `DATABASE_URL`  
**Features:** Workspace isolation, Team management, Subscriptions  
**Best For:** SaaS platforms, B2B applications

```bash
pnpm gen --schema examples/03-multi-tenant/schema.prisma
```

### 🎨 Image Optimizer Example
**Purpose:** Image conversion and optimization API  
**Keys Required:** `DATABASE_URL` (FFmpeg required)  
**Features:** PNG↔JPG conversion, WebP/AVIF support, batch processing  
**Best For:** Image processing, media APIs, CDN optimization

```bash
pnpm gen --schema examples/05-image-optimizer/schema.prisma
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
**Keys Required:** `DATABASE_URL`  
**Features:** Products, Orders, Payments, Reviews, Inventory  
**Best For:** Online stores, marketplace platforms

```bash
pnpm gen --schema examples/ecommerce-example/schema.prisma
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
| **01-basic-blog** | ⭐⭐ | 0 | Registry pattern basics |
| **blog-example** | ⭐⭐ | 0 | Full blog platform |
| **02-enterprise-api** | ⭐⭐⭐⭐ | 0-1 | Enterprise features |
| **03-multi-tenant** | ⭐⭐⭐⭐ | 0 | SaaS platforms |
| **05-image-optimizer** | ⭐⭐⭐ | 0 (needs FFmpeg) | Image processing |
| **ai-chat-example** | ⭐⭐⭐ | 1+ | AI integrations |
| **ecommerce-example** | ⭐⭐⭐⭐⭐ | 0-3 | Online stores |

---

## 🎯 Choosing an Example

### I'm just learning
→ Start with **Minimal** example

### I want to understand the registry pattern
→ Use **01-basic-blog** example

### I'm building a content site
→ Use **blog-example** (full featured)

### I need enterprise features (auth, RBAC, caching)
→ Use **02-enterprise-api** example

### I'm building a SaaS platform
→ Use **03-multi-tenant** example

### I need image processing
→ Use **05-image-optimizer** example (requires FFmpeg)

### I want to integrate AI features
→ Use **ai-chat-example** (requires AI API keys)

### I'm building an online store
→ Use **ecommerce-example**

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
