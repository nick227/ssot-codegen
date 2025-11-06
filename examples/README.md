# 📚 SSOT Code Generator - Examples

Complete collection of examples demonstrating each feature of the SSOT Code Generator.

---

## 🎯 Quick Start Examples

### 1. **Basic CRUD** (`01-basic-blog`)
**What it demonstrates:** Fundamental registry pattern and CRUD operations

- Simple blog with posts, users, comments
- Basic CRUD endpoints
- Clean registry structure
- Perfect starting point

**Use when:** Learning the basics, starting a new project

```bash
cd examples/01-basic-blog
npm install
npm run generate
```

---

### 2. **Enterprise Features** (`02-enterprise-api`)
**What it demonstrates:** Advanced enterprise capabilities

- ✅ Middleware (auth, rate-limiting, logging)
- ✅ Permissions (RBAC with owner support)
- ✅ Caching (TTL + auto-invalidation)
- ✅ Events (webhooks & async processing)
- ✅ Search (full-text + advanced filters)

**Use when:** Building production APIs, enterprise applications

```bash
cd examples/02-enterprise-api
npm install
npm run generate
```

---

### 3. **Multi-Tenant SaaS** (`03-multi-tenant`)
**What it demonstrates:** Tenant isolation patterns

- Workspace/tenant management
- Row-level security
- Tenant-scoped queries
- Subscription handling
- Team permissions

**Use when:** Building SaaS platforms, multi-tenant systems

```bash
cd examples/03-multi-tenant
npm install
npm run generate
```

---

### 4. **Social Network** (`04-social-network`)
**What it demonstrates:** Complex relationships and social features

- User profiles & following
- Posts with likes & comments
- Hashtags & mentions
- Feed aggregation
- Friend relationships
- Activity streams

**Use when:** Building social features, activity feeds

```bash
cd examples/04-social-network
npm install
npm run generate
```

---

### 5. **E-commerce Platform** (`05-ecommerce`)
**What it demonstrates:** Complete e-commerce backend

- Products & categories
- Shopping cart
- Orders & payments
- Inventory management
- Reviews & ratings
- Shipping & addresses

**Use when:** Building online stores, marketplaces

```bash
cd examples/05-ecommerce
npm install
npm run generate
```

---

### 6. **Content Management** (`06-cms`)
**What it demonstrates:** CMS-specific features

- Pages & blocks
- Media library
- SEO metadata
- Publishing workflow
- Versioning
- Multi-language support

**Use when:** Building CMS, documentation sites

```bash
cd examples/06-cms
npm install
npm run generate
```

---

### 7. **API Gateway** (`07-api-gateway`)
**What it demonstrates:** Service orchestration

- Multiple service integration
- Rate limiting per client
- API key management
- Request/response transformation
- Circuit breakers
- Service discovery

**Use when:** Building API gateways, microservices

```bash
cd examples/07-api-gateway
npm install
npm run generate
```

---

### 8. **Real-time Chat** (`08-realtime-chat`)
**What it demonstrates:** Real-time features

- WebSocket integration
- Message queues
- Presence tracking
- Typing indicators
- Read receipts
- Channel management

**Use when:** Building chat, real-time collaboration

```bash
cd examples/08-realtime-chat
npm install
npm run generate
```

---

## 🎨 Feature Matrix

| Example | Registry | Middleware | Permissions | Caching | Events | Search | Relationships |
|---------|----------|------------|-------------|---------|--------|--------|---------------|
| Basic Blog | ✅ | - | - | - | - | ✅ | Simple |
| Enterprise | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Medium |
| Multi-Tenant | ✅ | ✅ | ✅ | ✅ | - | ✅ | Complex |
| Social Network | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Complex |
| E-commerce | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Complex |
| CMS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Medium |
| API Gateway | ✅ | ✅ | ✅ | ✅ | ✅ | - | Simple |
| Real-time Chat | ✅ | ✅ | ✅ | - | ✅ | ✅ | Medium |

---

## 📖 Learning Path

### Beginner
1. Start with **Basic Blog** (01)
2. Understand registry pattern
3. Learn CRUD operations

### Intermediate
4. **Enterprise Features** (02)
5. Add authentication & permissions
6. Implement caching & events

### Advanced
7. **Multi-Tenant** (03) - Complex isolation
8. **Social Network** (04) - Complex relationships
9. **Real-time Chat** (08) - WebSocket integration

---

## 🚀 Quick Comparison

### Simple Project Needs
→ Use **Basic Blog** (01)
- < 10 models
- Simple CRUD
- No complex permissions

### Production API Needs
→ Use **Enterprise Features** (02)
- Authentication required
- Rate limiting needed
- Caching important
- Event tracking

### SaaS Platform Needs
→ Use **Multi-Tenant** (03)
- Multiple tenants/workspaces
- Subscription management
- Team permissions
- Usage tracking

### E-commerce Needs
→ Use **E-commerce** (05)
- Product catalog
- Shopping cart
- Order processing
- Inventory management

---

## 📁 Example Structure

Each example follows this structure:

```
examples/XX-example-name/
├── README.md              # Feature overview & setup
├── prisma/
│   └── schema.prisma     # Prisma schema
├── src/
│   ├── registry/         # Generated registry files
│   ├── controllers/      # Generated or custom controllers
│   ├── services/         # Generated services
│   └── app.ts           # Express app setup
├── package.json
└── .env.example
```

---

## 🎯 Feature Demonstrations

### Registry Pattern
**Examples:** All (01-08)
- Single source of truth
- Type-safe configuration
- 73% less code

### Middleware
**Examples:** 02, 03, 04, 05, 06, 07, 08
```typescript
middleware: {
  auth: ['create', 'update', 'delete'],
  rateLimit: { max: 100, windowMs: 60000 }
}
```

### Permissions (RBAC)
**Examples:** 02, 03, 04, 05, 06, 07, 08
```typescript
permissions: {
  create: ['admin', 'editor'],
  update: ['admin', { owner: 'userId' }]
}
```

### Caching
**Examples:** 02, 03, 04, 05, 06, 07
```typescript
caching: {
  list: { ttl: 300 },
  get: { ttl: 600 }
}
```

### Events/Webhooks
**Examples:** 02, 04, 05, 06, 07, 08
```typescript
events: {
  onCreate: ['model.created', 'analytics.track'],
  onUpdate: ['model.updated']
}
```

### Search/Filters
**Examples:** 01, 02, 03, 04, 05, 06, 08
```typescript
search: {
  fullTextFields: ['title', 'content'],
  filterableFields: ['status', 'category']
}
```

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL or MySQL
- pnpm (recommended) or npm

### Quick Setup (Any Example)

```bash
# 1. Navigate to example
cd examples/XX-example-name

# 2. Install dependencies
npm install

# 3. Setup database
cp .env.example .env
# Edit .env with your database credentials

# 4. Initialize database
npx prisma migrate dev

# 5. Generate code
npm run generate

# 6. Start development server
npm run dev
```

---

## 📊 Performance Comparison

All examples use optimized code generation:
- **13-23% faster** generation
- **20% fewer** allocations
- **73% less** code (registry mode)

---

## 🎓 Best Practices Demonstrated

### Code Organization
- Registry-first approach
- Factory pattern usage
- Clean separation of concerns

### Type Safety
- Full TypeScript coverage
- Zod validation
- Prisma type integration

### Performance
- Cached analysis
- Efficient queries
- Connection pooling

### Security
- Authentication middleware
- Permission enforcement
- Input validation
- SQL injection prevention

---

## 🤝 Contributing

Want to add an example? Great!

1. Create folder: `examples/XX-your-example`
2. Add schema and README
3. Test generation
4. Submit PR

---

## 📚 Documentation

- [Main Documentation](../docs/)
- [Registry Pattern Guide](../docs/REGISTRY_USAGE_GUIDE.md)
- [Advanced Features](../docs/ADVANCED_FEATURES.md)
- [Performance Report](../docs/PERFORMANCE_FINAL_REPORT.md)

---

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/your-org/ssot-codegen/issues)
- **Docs:** See `/docs` folder
- **Examples:** This folder!

---

**Choose an example above and start building! 🚀**
