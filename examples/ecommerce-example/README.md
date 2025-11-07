# 🛒 Ecommerce Platform - SSOT Codegen Test

Comprehensive ecommerce schema to test the full SSOT Codegen pipeline.

## Features Tested

### 📦 Models (13)
- User (with roles, authentication)
- Address (billing/shipping)
- Category (nested hierarchy)
- Product (complex with variants)
- Brand
- ProductVariant
- Cart & CartItem
- Order & OrderItem
- Payment
- Review
- WishlistItem

### 🔗 Relationships
- One-to-Many (User → Orders, Category → Products)
- One-to-One (User → Cart)
- Many-to-Many (via join tables)
- Self-referencing (Category hierarchy)
- Cascading deletes

### 📊 Advanced Features
- ✅ Enums (UserRole, OrderStatus, PaymentStatus, PaymentMethod, AddressType)
- ✅ Indexes (performance optimization)
- ✅ Unique constraints
- ✅ Default values
- ✅ Timestamps (createdAt, updatedAt)
- ✅ Optional fields
- ✅ Arrays (images, tags)
- ✅ Complex relations

### 🎯 What Gets Generated

**DTOs:**
- CreateUserDTO, UpdateUserDTO, ReadUserDTO
- CreateProductDTO, UpdateProductDTO, ReadProductDTO
- CreateOrderDTO, UpdateOrderDTO, ReadOrderDTO
- ... (39 DTOs total for 13 models)

**Validators:**
- Zod schemas for all DTOs
- Type-safe validation

**Services:**
- Full CRUD operations for each model
- Relationship handling
- Business logic

**Controllers:**
- REST endpoints
- Error handling
- Response formatting

**Routes:**
- Express/Fastify routes
- Authentication middleware ready

**SDK:**
- Type-safe client
- Auto-generated methods

**Registry:**
- Service registry
- Dependency injection ready

**Tests:**
- Unit tests for services
- Integration tests ready

**Checklist:**
- Health check dashboard
- Generation manifest

## Generate Code

```bash
cd examples/ecommerce-example
pnpm install
pnpm generate
```

Generated code will be in: `generated/ecommerce/`

## Statistics

- **Models:** 13
- **Enums:** 5
- **Relations:** ~25
- **Indexes:** ~30
- **DTOs Generated:** 39 (13 models × 3 types)
- **Services:** 13
- **Controllers:** 13
- **Routes:** 13
- **Total Files:** ~150+

## Test Coverage

This schema tests:
- ✅ Simple models (Brand)
- ✅ Complex models (Product, Order)
- ✅ Nested relations (Category hierarchy)
- ✅ Multiple enums per model
- ✅ Join tables (CartItem, OrderItem)
- ✅ Unique constraints
- ✅ Cascade deletes
- ✅ Optional relations
- ✅ Array fields
- ✅ Self-referencing relations
- ✅ Computed fields (order totals)
- ✅ Timestamps
- ✅ Default values

Perfect for testing the entire generation pipeline! 🚀
