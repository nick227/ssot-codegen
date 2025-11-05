# SSOT Codegen Examples

This directory contains example Prisma schemas demonstrating different use cases and patterns.

## 📁 Structure (Option 2: Organized by Feature)

Each example follows a clean, schema-first structure:

```
examples/
├── minimal/
│   ├── schema.prisma          # Simple User + Post schema
│   └── README.md
│
├── blog-example/
│   ├── schema.prisma          # Full blog platform (7 models)
│   ├── extensions/            # Example custom code
│   │   ├── post.service.extension.ts
│   │   └── README.md
│   └── README.md
│
├── ecommerce-example/
│   ├── schema.prisma          # Online store (15+ models)
│   ├── extensions/            # E-commerce patterns
│   │   ├── product.service.extensions.ts
│   │   ├── product.controller.extensions.ts
│   │   ├── product.routes.extensions.ts
│   │   └── README.md
│   └── README.md
│
└── ai-chat-example/
    ├── schema.prisma          # AI chat with @service annotations
    ├── extensions/            # Service integration patterns
    │   ├── ai-agent.service.integration.ts
    │   ├── file-storage.service.integration.ts
    │   └── README.md
    └── README.md
```

## 🚀 Quick Start

### List Available Examples

```bash
pnpm ssot list
```

### Generate a Project

```bash
# Generate from any example
pnpm ssot generate minimal
pnpm ssot generate blog-example
pnpm ssot generate ecommerce-example
pnpm ssot generate ai-chat-example

# Creates gen-N/ folder with complete standalone project
cd gen-1
pnpm install
pnpm test:validate
pnpm dev
```

## 📚 Examples

### 1. Minimal
**Purpose:** Simplest possible example  
**Models:** User, Post  
**Features:** Basic CRUD, one-to-many relationship  
**Best for:** Learning the basics

### 2. Blog Example
**Purpose:** Full-featured content platform  
**Models:** Author, Post, Comment, Category, Tag  
**Features:** Many-to-many, SEO, publishing workflow  
**Extensions:** Search, slugs, view tracking  
**Best for:** Content management systems

### 3. E-Commerce Example
**Purpose:** Online store backend  
**Models:** Product, Customer, Order, Payment, Review, etc.  
**Features:** Variants, inventory, orders, payments  
**Extensions:** Advanced search, filtering, pagination  
**Best for:** E-commerce platforms

### 4. AI Chat Example
**Purpose:** AI-powered chat application  
**Models:** User, Conversation, Message, AIPrompt  
**Features:** Service integration (`@service` annotation)  
**Extensions:** OpenAI integration, token tracking  
**Best for:** AI/ML applications with external services

## 🎨 Extension Patterns

Each example's `extensions/` folder shows real-world patterns:

### Service Extensions
Add custom methods while keeping generated CRUD:
```typescript
import { postService as generated } from '@gen/services/post'

export const postService = {
  ...generated,  // Keep all generated methods
  
  async search(query: string) {
    // Your custom logic
  }
}
```

### Service Integration
Orchestrate complex workflows with external services:
```typescript
export const aiAgentService = {
  async sendMessage(userId, message) {
    // 1. Save to database
    // 2. Call external API (OpenAI)
    // 3. Process response
    // 4. Track usage
    // 5. Return coordinated result
  }
}
```

See individual `extensions/README.md` files for detailed patterns.

## 🎯 Benefits of This Structure

1. **Schema-First** - Schema is the source of truth
2. **Clean** - No boilerplate (package.json, scripts/, node_modules/)
3. **Educational** - Extensions show real patterns
4. **Flexible** - Copy extensions to gen-N as needed
5. **Isolated** - Generated projects are standalone
6. **Deletable** - Safe to delete any gen-N folder

## 🔄 Workflow

```bash
# 1. Edit schema
vim examples/blog-example/schema.prisma

# 2. Generate project
pnpm ssot generate blog-example

# 3. Test it
cd gen-1
pnpm install
pnpm test:validate

# 4. Optionally copy extensions
cp ../examples/blog-example/extensions/* src/extensions/

# 5. Run it
pnpm dev

# 6. Try another generation (keeps gen-1!)
cd ..
pnpm ssot generate blog-example  # Creates gen-2
```

## 📖 Documentation

- [CLI Usage](../docs/CLI_USAGE.md) - Command reference
- [Quick Start](../docs/QUICKSTART.md) - Getting started guide
- Individual example READMEs - Use case specific docs
