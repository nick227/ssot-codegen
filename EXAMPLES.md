# SSOT Codegen Examples

Complete example projects demonstrating SSOT Codegen capabilities from simple to complex.

## Available Examples

### 1. 🎯 Demo Example (Ultra-Light)
**Path**: `examples/demo-example/`  
**Models**: 1 (Todo)  
**Purpose**: Minimal demonstration with single table

```bash
pnpm run examples:demo
pnpm run test:demo
```

**What's Generated**:
- ✅ Single Todo model
- ✅ Basic CRUD operations
- ✅ One API route
- ✅ OpenAPI spec
- ✅ ~20 files generated

**Perfect For**:
- Learning SSOT Codegen basics
- Quick POC demonstrations
- Testing pipeline changes
- Understanding generated structure

[📖 View Demo README](./examples/demo-example/README.md)

---

### 2. 📝 Blog Example (Full Platform)
**Path**: `examples/blog-example/`  
**Models**: 7 (Author, Post, Comment, Category, Tag, PostCategory, PostTag)  
**Purpose**: Complete blog platform with all features

```bash
pnpm run examples:blog
pnpm run test:blog
```

**What's Generated**:
- ✅ User authentication with roles
- ✅ Post publishing workflow
- ✅ Nested comment system
- ✅ Categories and tags
- ✅ Many-to-many relationships
- ✅ ~70+ files generated

**Features Included**:
- Author management with profiles
- Draft/publish workflow
- Nested comments with replies
- SEO-friendly slugs
- Role-based access (Admin, Editor, Author, Subscriber)
- View and like counters
- Comment approval

**Perfect For**:
- Full-featured blogs
- Content management systems
- News platforms
- Learning complex relationships
- Production blog websites

[📖 View Blog README](./examples/blog-example/README.md)

---

### 3. 🛒 E-commerce Example (Complete Store - PRODUCTION READY)
**Path**: `examples/ecommerce-example/`  
**Models**: 24 (Customer, Product, Order, Cart, Payment, Shipment, Coupon, Refund, etc.)  
**Purpose**: Production-ready online store with advanced features

```bash
pnpm run examples:ecommerce
pnpm run test:ecommerce
```

**What's Generated**:
- ✅ Customer authentication & management
- ✅ Product catalog with SEO & variants
- ✅ Shopping cart with variant support
- ✅ Order processing with detailed tracking
- ✅ Payment gateway integration
- ✅ Shipment tracking
- ✅ Product reviews with images
- ✅ **Coupon/discount system**
- ✅ **Stock reservation** (prevent overselling)
- ✅ **Complete refunds & returns**
- ✅ **Inventory audit trail**
- ✅ **Back-in-stock alerts**
- ✅ ~240+ files generated

**Core Features**:
- Customer accounts with authentication & loyalty points
- Product variants (size, color, etc.) in cart
- Product images and SEO metadata
- Categories with hierarchy
- Brand management
- Shopping cart with expiry & wishlist
- Order workflow with detailed timestamps
- Payment processing (6 methods)
- Shipment tracking (7 states)
- Product reviews with customer photos
- **Stock reservation system**
- **Inventory audit trail**
- **Coupon/discount system**
- **Complete refunds & returns**
- **Back-in-stock & price drop alerts**
- Low stock threshold alerts

**Perfect For**:
- Online stores
- Multi-vendor marketplaces
- B2B platforms
- Learning e-commerce architecture
- Production e-commerce websites

[📖 View E-commerce README](./examples/ecommerce-example/README.md)

---

## Quick Start

### Generate All Examples
```bash
# Build packages first
pnpm run build

# Generate all examples
pnpm run examples:all
```

### Test All Examples
```bash
# Run all tests
pnpm run test:examples

# Or test individually
pnpm run test:demo
pnpm run test:blog
pnpm run test:ecommerce
```

### Full Test (Build + Generate + Test)
```bash
pnpm run full-test
```

---

## Example Comparison

| Feature | Demo | Blog | E-commerce |
|---------|------|------|------------|
| **Models** | 1 | 7 | 24 |
| **Files Generated** | ~20 | ~70 | ~240 |
| **Complexity** | 🟢 Simple | 🟡 Medium | 🔴 Complex |
| **Relationships** | None | 1-to-many, many-to-many | All types + hierarchy |
| **Auth** | None | RBAC | RBAC + Policies |
| **Use Case** | Learning | Blogs/CMS | E-commerce |
| **Production Ready** | POC | ✅ Yes | ✅ Yes |

---

## Directory Structure

```
examples/
├── demo-example/           # Ultra-light Todo
│   ├── prisma/
│   │   └── schema.prisma   # Single Todo model
│   ├── scripts/
│   │   ├── generate.js     # Generation script
│   │   └── test.js        # Test suite
│   ├── gen/               # Generated code (after running)
│   └── README.md
│
├── blog-example/          # Full blog platform
│   ├── prisma/
│   │   └── schema.prisma  # 7 models + enums
│   ├── scripts/
│   │   ├── generate.js
│   │   └── test.js
│   ├── gen/              # Generated code
│   └── README.md
│
├── ecommerce-example/    # Complete online store
│   ├── prisma/
│   │   └── schema.prisma # 17 models + enums
│   ├── scripts/
│   │   ├── generate.js
│   │   └── test.js
│   ├── gen/             # Generated code
│   └── README.md
│
└── minimal/             # Original test example
    └── ...
```

---

## Generated Code Structure

All examples generate the same layer structure:

```
gen/
├── contracts/         # TypeScript DTOs
├── validators/        # Zod schemas
├── routes/           # Express/Fastify routes
├── controllers/      # Request handlers
├── services/         # Business logic
├── loaders/          # DataLoader (N+1 prevention)
├── auth/             # Authentication policies
├── telemetry/        # Observability hooks
├── openapi/          # OpenAPI 3.1 specification
├── manifests/        # Build metadata
└── shared/           # Common utilities
```

---

## Usage in Your Project

### Import Generated Code

```typescript
// From demo-example
import type { TodoCreateDTO } from '@gen/contracts/todo'
import { createTodo } from '@gen/controllers/todo'

// From blog-example
import type { PostCreateDTO } from '@gen/contracts/post'
import { postRoutes } from '@gen/routes/post'

// From ecommerce-example
import type { OrderCreateDTO } from '@gen/contracts/order'
import { processOrder } from '@gen/services/order'
```

### Use as Template

1. Copy an example schema to your project
2. Modify the Prisma schema
3. Run generation
4. Build your application!

```bash
# Copy e-commerce example
cp -r examples/ecommerce-example my-store

# Customize schema
edit my-store/prisma/schema.prisma

# Generate
cd my-store
pnpm run generate

# Use generated code
import { Product } from '@gen/contracts/product'
```

---

## Testing Philosophy

Each example includes comprehensive tests:

### What's Tested
✅ File generation completeness  
✅ Import path correctness (@gen alias)  
✅ No deep relative imports  
✅ OpenAPI spec validity  
✅ Manifest integrity  
✅ TypeScript compilation  
✅ Barrel exports  
✅ Model relationships

### Test Output Example
```
[blog-example] Running tests...

✅ All model directories exist
✅ Core models have complete artifacts
✅ Post model fully generated
✅ Models use @gen alias for relationships
✅ OpenAPI includes all model paths
✅ Manifest tracks all generated files
✅ Junction tables (PostCategory, PostTag) generated
✅ Barrel exports for all models

📊 Blog Example: 8 passed, 0 failed
📦 Generated 7 models with full CRUD operations
```

---

## Example Schemas

### Demo - Todo (Simplest)
```prisma
model Todo {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### Blog - Post (With Relationships)
```prisma
model Post {
  id          Int       @id @default(autoincrement())
  title       String
  content     String
  published   Boolean   @default(false)
  authorId    Int
  
  author      Author    @relation(...)
  comments    Comment[]
  categories  PostCategory[]
  tags        PostTag[]
}
```

### E-commerce - Product (Complex)
```prisma
model Product {
  id          Int       @id @default(autoincrement())
  sku         String    @unique
  name        String
  price       Decimal   @db.Decimal(10, 2)
  stock       Int       @default(0)
  categoryId  Int
  
  category    Category  @relation(...)
  images      ProductImage[]
  variants    ProductVariant[]
  reviews     Review[]
  tags        ProductTag[]
}
```

---

## Next Steps

1. **Try Demo** - Start with `pnpm run demo` to understand basics
2. **Explore Blog** - Learn relationships with `pnpm run examples:blog`
3. **Study E-commerce** - See full complexity with `pnpm run examples:ecommerce`
4. **Build Your Own** - Copy an example and customize!

---

## CI/CD Integration

Add to your GitHub Actions:

```yaml
name: Test Examples
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm run build
      - run: pnpm run examples:all
      - run: pnpm run test:examples
```

---

## Contributing Examples

Want to add an example? Structure:

```
examples/your-example/
├── package.json          # Name, scripts
├── prisma/schema.prisma  # Your schema
├── scripts/
│   ├── generate.js       # Generate code
│   └── test.js          # Test suite
├── tsconfig.json        # TypeScript config
└── README.md            # Documentation
```

Then add scripts to root `package.json`.

---

## FAQ

**Q: Which example should I start with?**  
A: Start with `demo-example` to learn basics, then move to `blog-example` for relationships.

**Q: Can I use these in production?**  
A: Yes! Blog and E-commerce examples are production-ready schemas. Add your business logic.

**Q: How do I customize generated code?**  
A: Modify the Prisma schema and regenerate. For custom logic, use extension hooks (coming in v0.5.0+).

**Q: Can I combine examples?**  
A: Absolutely! Mix models from different examples. For example, add blog to e-commerce for content marketing.

---

**Generated with SSOT Codegen v0.4.0**  
**"Website in a Box" - Complete schemas, ready to use!** 🚀

