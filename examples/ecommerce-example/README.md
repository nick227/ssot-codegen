# E-Commerce Example

Complete online store with products, customers, orders, payments, and reviews.

## Structure

```
ecommerce-example/
├── schema.prisma           # Source schema (15+ models)
├── extensions/             # Advanced e-commerce patterns
│   ├── README.md
│   ├── product.service.extensions.ts
│   ├── product.controller.extensions.ts
│   └── product.routes.extensions.ts
└── README.md
```

## Models

**Products & Catalog:**
- Product (with variants, SEO, inventory)
- Category (hierarchical)
- Brand
- ProductImage
- ProductVariant

**Customers & Orders:**
- Customer (with addresses, wishlist)
- Order (with status tracking)
- OrderItem
- Payment
- Shipment

**Reviews & Marketing:**
- ProductReview
- ProductTag
- Coupon

## Generate

```bash
pnpm ssot generate ecommerce-example
cd gen-1
pnpm install
pnpm test:validate
pnpm dev
```

## Extensions

Advanced e-commerce functionality:
- **Search** - Multi-field product search
- **Filtering** - Price, category, stock, ratings
- **SEO** - Slug-based URLs
- **Admin** - Low stock alerts
- **Performance** - Optimized queries with pagination

See `extensions/README.md` for patterns.

## Features Demonstrated

- ✅ Product variants (size, color, etc.)
- ✅ Hierarchical categories
- ✅ Multi-image products
- ✅ Customer addresses
- ✅ Order tracking & status
- ✅ Payment integration
- ✅ Shipment tracking
- ✅ Product reviews with approval
- ✅ Wishlist functionality
- ✅ Coupon system
- ✅ Inventory management
- ✅ Stock reservations

## What You Get

Complete e-commerce API:
- Full CRUD for all models
- Complex relationship handling
- Advanced search & filtering
- Order management workflows
- Payment processing ready
- Review moderation
- Inventory tracking

**Production-ready e-commerce backend!**
