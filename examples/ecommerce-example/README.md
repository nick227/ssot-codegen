# E-Commerce Example - Complete Online Store

Production-ready e-commerce platform demonstrating complex domain modeling and business workflows.

## What This Demonstrates

- ✅ Complex domain with 24 models
- ✅ Shopping cart with variant support
- ✅ Order processing workflow
- ✅ Payment gateway integration
- ✅ Inventory management
- ✅ Review system with images
- ✅ Coupon/discount system
- ✅ Stock reservation (prevent overselling)
- ✅ Refunds and returns
- ✅ Audit trails

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Generate code from schema
pnpm generate

# 3. Setup database
pnpm db:setup

# 4. (Optional) Seed with sample data
pnpm db:seed

# 5. Start development server
pnpm dev
```

Server runs on `http://localhost:3000`

## Schema Overview

### 24 Models, ~387 Generated Files

#### Core Commerce
- **Customer**: User accounts with addresses
- **Product**: Products with variants, SKUs, inventory
- **ProductVariant**: Size, color, etc. variations
- **Category**: Hierarchical product categories
- **Brand**: Product brands

#### Shopping & Orders
- **Cart**: Shopping cart with items
- **CartItem**: Cart line items with variants
- **Order**: Order management with status tracking
- **OrderItem**: Order line items
- **OrderStatus**: Order state tracking
- **Shipment**: Shipping information

#### Payments
- **Payment**: Payment processing
- **PaymentMethod**: Saved payment methods
- **Refund**: Refund processing

#### Inventory
- **Inventory**: Stock tracking
- **InventoryAudit**: Stock change history
- **StockReservation**: Prevent overselling

#### Marketing
- **Coupon**: Discount codes
- **ProductTag**: Product tagging for search/filter
- **Tag**: Tag definitions

#### Engagement
- **Review**: Product reviews with ratings
- **ReviewImage**: Review photo uploads
- **Wishlist**: Customer wishlists

## Features

### Shopping Experience
- Product catalog with variants (size, color, etc.)
- Advanced search and filtering
- Categories and brands
- Reviews with images
- Wishlist functionality

### Cart & Checkout
- Add to cart with variant selection
- Stock validation
- Coupon application
- Multiple payment methods
- Address management

### Order Management
- Order creation with stock reservation
- Status tracking (Pending → Processing → Shipped → Delivered)
- Shipment tracking
- Refund processing
- Return handling

### Inventory Control
- Real-time stock tracking
- Stock reservations (prevent overselling)
- Audit trail for stock changes
- Low stock alerts (via schema design)

## Generated API Endpoints

### Products
```
GET    /api/products                    # List products
GET    /api/products/:id                # Get product details
GET    /api/products/:id/variants       # Get variants
GET    /api/products/slug/:slug         # Get by slug
POST   /api/products/:id/views          # Track views
```

### Cart
```
GET    /api/carts                       # Get customer cart
POST   /api/cart-items                  # Add to cart
PUT    /api/cart-items/:id              # Update quantity
DELETE /api/cart-items/:id              # Remove from cart
```

### Orders
```
POST   /api/orders                      # Create order (checkout)
GET    /api/orders/:id                  # Get order details
GET    /api/orders                      # List customer orders
PUT    /api/orders/:id/status           # Update order status
```

### Reviews
```
GET    /api/reviews?productId=:id       # Product reviews
POST   /api/reviews                     # Submit review
POST   /api/review-images               # Upload review photos
```

## What Gets Generated

From **24 models** → **~387 files**:

```
gen/
├── contracts/          ← DTOs (121 files)
├── validators/         ← Zod schemas (97 files)
├── services/           ← DB operations (49 files)
├── controllers/        ← Handlers (47 files)
├── routes/             ← Routes (47 files)
├── sdk/                ← Client SDK (25 files)
└── base/               ← Base classes (3 files)
```

## Testing

```bash
# Run search API tests
pnpm test
```

## Customization Examples

### Custom Service - Product Recommendations

```typescript
// src/extensions/product/recommendations.ts
import { productService } from '../../gen/services/product/product.service.js'

export async function getRecommendations(productId: number) {
  const product = await productService.findUnique({ id: productId })
  if (!product) return []
  
  // Find similar products by category
  return productService.findMany({
    where: { categoryId: product.categoryId },
    take: 5,
    orderBy: 'views:desc'
  })
}
```

### Custom Route - Best Sellers

```typescript
// src/extensions/product/routes.ts
import { Router } from 'express'

export const productRoutes = Router()

productRoutes.get('/best-sellers', async (req, res) => {
  // Custom aggregation logic
  const bestSellers = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10
  })
  
  res.json({ data: bestSellers })
})
```

## Business Logic Examples

### Checkout Process
1. Validate cart items (stock availability)
2. Create stock reservations
3. Calculate total with coupon
4. Process payment
5. Create order
6. Update inventory
7. Release cart

### Order Fulfillment
1. Order created → Status: Pending
2. Payment confirmed → Status: Processing
3. Items picked → Create shipment
4. Shipped → Status: Shipped (with tracking)
5. Delivered → Status: Delivered
6. (If needed) Create refund

## Learn More

- [Search API Documentation](./SEARCH_API_DOCUMENTATION.md)
- [Schema Review](./SCHEMA_REVIEW.md)
- [Improvements Comparison](./IMPROVEMENTS_COMPARISON.md)
- [Main Documentation](../../README.md)

---

**This example shows a complete e-commerce platform from a single Prisma schema** 🛒
