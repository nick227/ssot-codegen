# E-commerce Example - Complete Online Store

Production-ready e-commerce platform schema with all essential features for building an online store.

## What This Demonstrates

- ✅ Complete e-commerce data model
- ✅ Customer management with multiple addresses
- ✅ Product catalog with variants and images
- ✅ Shopping cart and wishlist
- ✅ Order processing workflow
- ✅ Payment gateway integration
- ✅ Shipment tracking
- ✅ Product reviews and ratings
- ✅ Inventory management
- ✅ Category hierarchy
- ✅ Brand management
- ✅ Product tagging

## Schema Overview (24 Models - Production Ready)

### Customer Management
- **Customer**: User accounts and profiles
- **Address**: Shipping and billing addresses

### Product Catalog
- **Product**: Main product catalog with pricing and inventory
- **Category**: Hierarchical category structure
- **Brand**: Product manufacturers/brands
- **ProductImage**: Multiple images per product
- **ProductVariant**: Size, color, and other variations
- **Tag**: Flexible product tagging
- **ProductTag**: Product ↔ Tag junction

### Shopping Experience
- **Cart**: Shopping cart
- **CartItem**: Items in cart
- **WishlistItem**: Saved products

### Order Management
- **Order**: Customer orders with status tracking
- **OrderItem**: Order line items
- **Payment**: Payment transactions
- **Shipment**: Delivery tracking

### Engagement
- **Review**: Product reviews and ratings

## Features Included

### Customer Features
✅ Registration and authentication with password hashing  
✅ Email verification system  
✅ Multiple shipping/billing addresses  
✅ Order history with detailed tracking  
✅ Product reviews with photos  
✅ Wishlist functionality  
✅ Shopping cart with expiry  
✅ Loyalty points system  
✅ Marketing preferences (GDPR compliant)  
✅ Multi-language and currency support

### Product Features
✅ SKU management with variants  
✅ Pricing with compare-at-price and cost tracking  
✅ **Stock reservation** to prevent overselling  
✅ **Inventory audit trail** for all changes  
✅ Product variants (size, color, etc.) in cart  
✅ Multiple product images with primary selection  
✅ Hierarchical product categorization  
✅ Brand association with details  
✅ Product tagging system  
✅ Featured products  
✅ **SEO metadata** (title, description, keywords)  
✅ Product dimensions for shipping  
✅ Product condition (new, refurbished, used)  
✅ Min/max order quantities  
✅ Availability date ranges  
✅ **Back-in-stock alerts**

### Order Features
✅ Order number generation  
✅ **Detailed status tracking** (confirmed, packed, shipped, delivered)  
✅ **Status timestamps** for each stage  
✅ Tax and shipping calculation  
✅ **Coupon/discount support**  
✅ Multiple address types  
✅ Order notes  
✅ IP tracking for fraud prevention  
✅ Estimated delivery dates

### Payment Features
✅ Multiple payment methods (6 types)  
✅ Payment status workflow  
✅ Gateway integration ready  
✅ Transaction ID storage  
✅ **Complete refund system**  
✅ Partial refunds support  
✅ Refund reason tracking

### Shipping Features
✅ Carrier tracking  
✅ Tracking number  
✅ Shipment status updates (7 states)  
✅ Delivery confirmation  
✅ Delivery timestamps

### Marketing & Promotions
✅ **Coupon system** (percentage, fixed, free shipping)  
✅ Usage limits and tracking  
✅ Minimum purchase requirements  
✅ Date range validity  
✅ Coupon redemption tracking

### Inventory Management
✅ **Real-time stock reservation**  
✅ **Auto-release** expired reservations  
✅ **Stock history audit trail**  
✅ Multiple change reasons tracking  
✅ Low stock threshold alerts

### Reviews & Engagement
✅ Product reviews with ratings (1-5)  
✅ **Customer review photos**  
✅ Verified purchase badges  
✅ Review approval workflow  
✅ Helpful voting system  
✅ **Product availability alerts**  
✅ **Price drop notifications**

## Quick Start

```bash
# Generate code
pnpm run generate

# Run tests
pnpm run test
```

## Generated API Endpoints

### Customers
```
POST   /customers           # Register
GET    /customers/:id       # Get profile
PUT    /customers/:id       # Update profile
GET    /customers/:id/orders # Order history
```

### Products
```
GET    /products            # List with filters
GET    /products/:slug      # Get by slug
POST   /products            # Create (admin)
PUT    /products/:id        # Update
GET    /products/:id/reviews # Get reviews
```

### Categories & Brands
```
GET    /categories          # List all
GET    /categories/:slug    # Get with products
GET    /brands              # List brands
```

### Cart
```
GET    /cart                # Get current cart
POST   /cart/items          # Add item
PUT    /cart/items/:id      # Update quantity
DELETE /cart/items/:id      # Remove item
```

### Orders
```
POST   /orders              # Checkout
GET    /orders/:id          # Get order
GET    /orders/:id/tracking # Track shipment
```

### Reviews
```
POST   /reviews             # Add review
GET    /products/:id/reviews # Get product reviews
```

## Database Schema Relationships

```
Customer (1) ──→ (∞) Address
Customer (1) ──→ (∞) Order
Customer (1) ──→ (1) Cart
Customer (1) ──→ (∞) Review
Customer (1) ──→ (∞) WishlistItem

Product (∞) ──→ (1) Category
Product (∞) ──→ (1) Brand (optional)
Product (1) ──→ (∞) ProductImage
Product (1) ──→ (∞) ProductVariant
Product (1) ──→ (∞) Review
Product (∞) ←→ (∞) Tag (via ProductTag)

Cart (1) ──→ (∞) CartItem
CartItem (∞) ──→ (1) Product

Order (1) ──→ (∞) OrderItem
Order (1) ──→ (1) Address (shipping)
Order (1) ──→ (1) Payment
Order (1) ──→ (1) Shipment

Category (tree) ──→ Category (parent/children)
```

## Business Logic Examples

### Order Processing Flow
1. Customer adds items to cart
2. Proceeds to checkout
3. Selects shipping address
4. Submits payment
5. Order created with PENDING status
6. Payment processed → CONFIRMED
7. Order prepared → PROCESSING
8. Shipment created → SHIPPED
9. Tracking updates → DELIVERED

### Inventory Management
- Stock tracked per product
- Low stock threshold alerts
- Variants have separate stock
- Stock decremented on order
- Stock restored on cancellation/refund

### Pricing Strategy
- Base price
- Compare-at-price (was/now)
- Cost price for margin tracking
- Variant price adjustments
- Tax and shipping calculations

## Environment Setup

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce_db"
```

## Use Cases

Perfect for:
- ✅ Full-featured online stores
- ✅ Multi-vendor marketplaces (extend with Vendor model)
- ✅ Subscription box services
- ✅ Digital product stores
- ✅ B2B wholesale platforms
- ✅ Learning e-commerce architecture
- ✅ Testing SSOT Codegen at scale

## Next Steps

1. Set up PostgreSQL database
2. Run `npx prisma migrate dev`
3. Generate code with `pnpm run generate`
4. Seed sample data
5. Build your storefront!

## Generated Structure

```
gen/
├── contracts/         # DTOs for all 17 models
│   ├── customer/
│   ├── product/
│   ├── order/
│   ├── cart/
│   └── ... (13 more)
├── validators/        # Zod schemas with business rules
├── routes/           # RESTful API routes
├── controllers/      # Request handlers
├── services/         # Business logic
│   ├── order.service.ts      # Order processing
│   ├── payment.service.ts    # Payment handling
│   ├── inventory.service.ts  # Stock management
│   └── ...
├── loaders/          # DataLoader for performance
├── auth/             # Role-based access control
└── openapi/          # Complete API specification
```

## Generated Code Stats

- 📦 17 models
- 🔄 170+ generated files
- 🎯 85+ API endpoints
- 📋 50+ DTOs
- ✅ Complete CRUD operations
- 🔐 Auth-ready controllers
- 📊 OpenAPI 3.1 specification

## This is a **complete e-commerce store in a box!**

Just add:
- Frontend (React, Vue, Next.js, etc.)
- Payment gateway keys (Stripe, PayPal, etc.)
- Email service for notifications
- Image storage (S3, Cloudinary, etc.)
- Deploy and start selling! 🚀

