# SSOT Codegen Examples

Complete, production-ready examples demonstrating different use cases and features.

## 📚 Available Examples

### 1. Minimal Example ⚡
**Perfect for**: Getting started quickly

```bash
cd examples/minimal
pnpm setup && pnpm test
```

**Features**:
- 2 models (User, Todo)
- Basic CRUD operations
- ~5 minute setup
- ~40 generated files

**Best for**: First-time users, understanding basics

---

### 2. Blog Example 📝
**Perfect for**: Content management systems

```bash
cd examples/blog-example
pnpm setup && pnpm dev
```

**Features**:
- 7 models (Author, Post, Comment, Category, Tag, etc.)
- Authentication & authorization
- Publishing workflow
- Nested comments
- Many-to-many relationships
- ~100 generated files
- Full integration tests

**Best for**: Learning relationships, auth, complex workflows

---

### 3. E-Commerce Example 🛒
**Perfect for**: Online stores, marketplaces

```bash
cd examples/ecommerce-example
pnpm setup && pnpm dev
```

**Features**:
- 24 models (Customer, Product, Order, Payment, etc.)
- Shopping cart
- Order processing
- Inventory management
- Reviews and ratings
- Coupon system
- ~387 generated files

**Best for**: Complex domains, large schemas, production patterns

---

### 4. AI Chat Example 🤖
**Perfect for**: Service integrations, AI features

```bash
cd examples/ai-chat-example
pnpm setup && pnpm dev
```

**Features**:
- 11 models (User, Conversation, Message, etc.)
- @service annotations for AI integration
- File upload service
- Payment processing
- Email notifications
- Service-oriented architecture
- ~140 generated files

**Best for**: Learning service integrations, AI features, external APIs

---

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/ssot-codegen
cd ssot-codegen

# 2. Build the library
pnpm install
pnpm build

# 3. Choose an example
cd examples/minimal        # or blog-example, ecommerce-example, ai-chat-example

# 4. Run setup
pnpm setup                 # Installs + generates + DB setup

# 5. Start development
pnpm dev                   # (if example has dev server)
```

### What Happens During Setup

`pnpm setup` performs:
1. ✅ Install dependencies
2. ✅ Generate code from Prisma schema
3. ✅ Setup database schema
4. ✅ (Optional) Seed sample data

The `gen/` folder is created with:
- **contracts/**: TypeScript DTOs
- **validators/**: Zod validation schemas
- **services/**: Database service layer
- **controllers/**: Express/Fastify handlers
- **routes/**: Route definitions
- **sdk/**: Type-safe client SDK

---

## 📊 Comparison

| Example | Models | Files Generated | Setup Time | Best For |
|---------|--------|-----------------|------------|----------|
| **Minimal** | 2 | ~40 | 5 min | Learning basics |
| **Blog** | 7 | ~100 | 10 min | Content platforms |
| **E-Commerce** | 24 | ~387 | 15 min | Online stores |
| **AI Chat** | 11 | ~140 | 10 min | Service integration |

---

## 🎯 Choosing an Example

### I want to learn the basics
→ **Start with minimal**

### I'm building a blog/CMS
→ **Use blog-example**

### I'm building an online store
→ **Use ecommerce-example**

### I'm integrating external services
→ **Use ai-chat-example**

### I want to see everything
→ **Try all of them!** Each shows different patterns.

---

## 📋 Common Tasks

### After Changing Schema

```bash
# 1. Edit prisma/schema.prisma
# 2. Regenerate code
pnpm generate

# 3. Update database
pnpm db:push

# 4. Restart server (if running)
pnpm dev
```

### Running Tests

```bash
# Unit tests
pnpm test

# Integration tests (blog-example)
pnpm test:integration

# All tests
pnpm test:all
```

### Clean Start

```bash
# Remove generated code and node_modules
pnpm clean

# Fresh setup
pnpm setup
```

---

## 🛠️ Example Structure

Each example follows this structure:

```
example-name/
├── prisma/
│   └── schema.prisma       ← Prisma schema definition
├── src/
│   ├── app.ts              ← Application setup
│   ├── server.ts           ← Server entry point
│   └── extensions/         ← Custom business logic
├── scripts/
│   ├── generate.js         ← Code generation script
│   ├── db-setup.js         ← Database initialization
│   └── seed.ts             ← Sample data
├── tests/                  ← Integration tests (some examples)
├── gen/                    ← Generated code (gitignored)
├── .gitignore              ← Excludes gen/, dist/, etc.
├── package.json            ← Dependencies and scripts
└── README.md               ← Setup instructions
```

---

## 💡 Tips

### Generated Code is Gitignored
The `gen/` folder is created during setup and **not committed** to git. This is intentional:
- ✅ Keeps examples pristine
- ✅ Always uses your version of the library
- ✅ No merge conflicts
- ✅ Regenerate anytime with `pnpm generate`

### Customization
Don't edit files in `gen/` - they'll be overwritten. Instead:
- Extend generated services in `src/extensions/`
- Add custom routes in `src/routes/`
- Override controllers in `src/controllers/`

### Database Choice
Examples use different databases to show flexibility:
- **minimal**: PostgreSQL
- **blog-example**: PostgreSQL
- **ecommerce-example**: PostgreSQL
- **ai-chat-example**: MySQL

You can change the database provider in `schema.prisma`.

---

## 🧪 Testing

### Blog Example (Full Test Suite)
```bash
cd examples/blog-example
pnpm test                    # Unit tests
pnpm test:integration        # API integration tests
```

### Other Examples
```bash
pnpm test                    # Basic functionality tests
```

---

## 📚 Learning Path

### Beginner
1. **minimal** - Understand generation basics
2. **blog-example** - Learn relationships and auth
3. Try your own schema!

### Intermediate
1. **ecommerce-example** - Complex domains
2. **ai-chat-example** - Service integrations
3. Extend with custom logic

### Advanced
1. Study generated code structure
2. Customize with extensions
3. Deploy to production

---

## 🤝 Contributing

Found an issue or have an improvement?
- Open an issue
- Submit a PR
- Share your use case

---

## 📖 Documentation

- [Main README](../README.md)
- [Getting Started Guide](../docs/getting-started.md)
- [API Reference](../docs/api-reference.md)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Examples are learning tools** - Clone, experiment, and build something awesome! 🚀

