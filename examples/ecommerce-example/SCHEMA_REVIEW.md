# E-commerce Schema Review & Improvements

## Current Schema Analysis

### ✅ What's Good
- Solid foundation with 17 models
- Proper relationships and cascades
- Good indexing strategy
- Multiple payment methods
- Order status workflow
- Product variants and images
- Review system
- Hierarchical categories

---

## 🔍 Identified Gaps & Improvements

### 1. **CRITICAL: Coupon/Discount System** ⚠️
**Missing**: No way to apply discount codes, run promotions, or track coupon usage.

**Impact**: High - Essential for marketing and conversions

**Proposed Addition**:
```prisma
model Coupon {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  description     String?
  discountType    DiscountType  // PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
  discountValue   Decimal   @db.Decimal(10, 2)
  minPurchase     Decimal?  @db.Decimal(10, 2)
  maxDiscount     Decimal?  @db.Decimal(10, 2)
  usageLimit      Int?      // null = unlimited
  usageCount      Int       @default(0)
  validFrom       DateTime
  validUntil      DateTime?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  
  orders          Order[]
}

// Add to Order model:
  couponId        Int?
  couponCode      String?
  coupon          Coupon?   @relation(...)
```

---

### 2. **CRITICAL: Inventory Management** ⚠️
**Missing**: No stock reservation, no multi-warehouse, no stock history

**Impact**: High - Overselling and stock accuracy issues

**Proposed Additions**:
```prisma
// Stock reservation during checkout
model StockReservation {
  id              Int       @id @default(autoincrement())
  productId       Int
  variantId       Int?
  quantity        Int
  cartId          Int?
  orderId         Int?
  expiresAt       DateTime  // Auto-release after 15 mins
  createdAt       DateTime  @default(now())
  
  product         Product   @relation(...)
  variant         ProductVariant? @relation(...)
}

// Track stock changes
model StockHistory {
  id              Int       @id @default(autoincrement())
  productId       Int
  change          Int       // +/- quantity
  reason          StockChangeReason  // SALE, RETURN, ADJUSTMENT, RESTOCK
  orderId         Int?
  notes           String?
  createdAt       DateTime  @default(now())
  createdBy       Int?      // Admin user ID
  
  product         Product   @relation(...)
}
```

---

### 3. **IMPORTANT: Product SEO & Metadata**
**Missing**: No SEO fields, no meta descriptions, no structured data

**Impact**: Medium-High - Affects discoverability and conversions

**Add to Product**:
```prisma
model Product {
  // ... existing fields
  
  // SEO fields
  metaTitle       String?   @db.VarChar(60)
  metaDescription String?   @db.VarChar(160)
  metaKeywords    String?
  
  // Dimensions for shipping
  length          Decimal?  @db.Decimal(8, 2)  // cm
  width           Decimal?  @db.Decimal(8, 2)  // cm
  height          Decimal?  @db.Decimal(8, 2)  // cm
  
  // Product specifications
  condition       ProductCondition @default(NEW)
  minOrderQty     Int       @default(1)
  maxOrderQty     Int?
  
  // Availability
  availableFrom   DateTime?
  availableUntil  DateTime?
}

enum ProductCondition {
  NEW
  REFURBISHED
  USED_LIKE_NEW
  USED_GOOD
}
```

---

### 4. **IMPORTANT: Refunds & Returns**
**Missing**: No refund tracking, no RMA (Return Merchandise Authorization)

**Impact**: Medium - Customer service nightmare without this

**Proposed Addition**:
```prisma
model Refund {
  id              Int       @id @default(autoincrement())
  orderId         Int
  refundNumber    String    @unique
  reason          RefundReason
  amount          Decimal   @db.Decimal(10, 2)
  status          RefundStatus @default(PENDING)
  refundMethod    PaymentMethod  // Same as original payment
  notes           String?
  processedAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  order           Order     @relation(...)
  items           RefundItem[]
}

model RefundItem {
  id              Int       @id @default(autoincrement())
  refundId        Int
  orderItemId     Int
  quantity        Int
  amount          Decimal   @db.Decimal(10, 2)
  
  refund          Refund    @relation(...)
  orderItem       OrderItem @relation(...)
}

enum RefundReason {
  DEFECTIVE
  WRONG_ITEM
  NOT_AS_DESCRIBED
  CHANGED_MIND
  DUPLICATE_ORDER
  OTHER
}

enum RefundStatus {
  PENDING
  APPROVED
  REJECTED
  PROCESSING
  COMPLETED
}
```

---

### 5. **IMPORTANT: Cart Improvements**
**Missing**: Variant selection, price snapshots, abandoned cart tracking

**Impact**: Medium - Lost sales and pricing issues

**Improvements**:
```prisma
model CartItem {
  id              Int       @id @default(autoincrement())
  cartId          Int
  productId       Int
  variantId       Int?      // ADD: Support variants
  quantity        Int       @default(1)
  
  // Snapshot pricing
  unitPrice       Decimal   @db.Decimal(10, 2)  // ADD: Price when added
  
  addedAt         DateTime  @default(now())
  updatedAt       DateTime  @updatedAt  // ADD: Track updates
  
  cart            Cart      @relation(...)
  product         Product   @relation(...)
  variant         ProductVariant? @relation(...)  // ADD
  
  @@unique([cartId, productId, variantId])  // CHANGE: Include variant
  @@index([cartId])
}

// Add to Cart:
  expiresAt       DateTime?  // For guest carts
  completedAt     DateTime?  // When converted to order
```

---

### 6. **USEFUL: Customer Enhancements**
**Missing**: Password, authentication, loyalty program

**Impact**: Medium - Auth and customer retention

**Add to Customer**:
```prisma
model Customer {
  // ... existing fields
  
  // Authentication
  passwordHash    String?
  lastLoginAt     DateTime?
  emailVerifyToken String?
  passwordResetToken String?
  passwordResetExpires DateTime?
  
  // Preferences
  marketingOptIn  Boolean   @default(false)
  currency        String    @default("USD")
  language        String    @default("en")
  
  // Loyalty
  loyaltyPoints   Int       @default(0)
  loyaltyTier     LoyaltyTier @default(BRONZE)
}

enum LoyaltyTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}
```

---

### 7. **USEFUL: Order Improvements**
**Missing**: Timestamps for status changes, estimated delivery

**Add to Order**:
```prisma
model Order {
  // ... existing fields
  
  // Timestamps
  confirmedAt     DateTime?
  packedAt        DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  
  // Delivery
  estimatedDelivery DateTime?
  
  // Tracking
  ipAddress       String?
  userAgent       String?
}
```

---

### 8. **USEFUL: Review Improvements**
**Missing**: Helpful votes, images, verified purchase

**Add to Review**:
```prisma
model Review {
  // ... existing fields
  
  helpfulCount    Int       @default(0)
  notHelpfulCount Int       @default(0)
  images          ReviewImage[]
  
  @@index([productId, isApproved])  // ADD: For approved reviews query
}

model ReviewImage {
  id              Int       @id @default(autoincrement())
  reviewId        Int
  imageUrl        String
  createdAt       DateTime  @default(now())
  
  review          Review    @relation(...)
  
  @@index([reviewId])
}
```

---

### 9. **NICE TO HAVE: Product Bundles**
**Missing**: No way to sell product kits/bundles

**Proposed Addition**:
```prisma
model ProductBundle {
  id              Int       @id @default(autoincrement())
  name            String
  slug            String    @unique
  description     String?
  price           Decimal   @db.Decimal(10, 2)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  
  items           BundleItem[]
}

model BundleItem {
  bundleId        Int
  productId       Int
  quantity        Int       @default(1)
  
  bundle          ProductBundle @relation(...)
  product         Product   @relation(...)
  
  @@id([bundleId, productId])
}
```

---

### 10. **NICE TO HAVE: Notifications**
**Missing**: Back-in-stock alerts, price drop alerts

**Proposed Addition**:
```prisma
model ProductAlert {
  id              Int       @id @default(autoincrement())
  customerId      Int
  productId       Int
  alertType       AlertType
  triggered       Boolean   @default(false)
  triggeredAt     DateTime?
  createdAt       DateTime  @default(now())
  
  customer        Customer  @relation(...)
  product         Product   @relation(...)
  
  @@unique([customerId, productId, alertType])
}

enum AlertType {
  BACK_IN_STOCK
  PRICE_DROP
}
```

---

## 📊 Priority Ranking

### Must Have (Before Production)
1. ✅ **Coupon/Discount System** - Marketing essential
2. ✅ **Stock Reservation** - Prevent overselling
3. ✅ **Refunds & Returns** - Customer service requirement
4. ✅ **Cart Variant Support** - Core shopping functionality

### Should Have (Phase 2)
5. ✅ **Product SEO Fields** - Discoverability
6. ✅ **Stock History** - Inventory tracking
7. ✅ **Customer Authentication** - User accounts
8. ✅ **Order Timestamps** - Better tracking

### Nice to Have (Phase 3)
9. ✅ **Review Images** - Enhanced reviews
10. ✅ **Product Bundles** - Upselling
11. ✅ **Product Alerts** - Customer retention
12. ✅ **Loyalty Program** - Repeat purchases

---

## 🔧 Index Improvements

Add composite indexes for common queries:

```prisma
// Product - Homepage featured query
@@index([isActive, isFeatured, createdAt])

// Product - Category browsing
@@index([categoryId, isActive, createdAt])

// Order - Customer order history
@@index([customerId, createdAt(sort: Desc)])

// Review - Product reviews sorted
@@index([productId, isApproved, createdAt(sort: Desc)])
```

---

## 🛡️ Data Integrity Improvements

### Add Constraints

```prisma
// Product: Ensure price logic
@@check: price > 0
@@check: compareAtPrice == null OR compareAtPrice > price

// Review: Rating must be 1-5
@@check: rating >= 1 AND rating <= 5

// OrderItem: Positive quantities
@@check: quantity > 0

// Coupon: Valid date range
@@check: validUntil == null OR validUntil > validFrom
```

---

## 📝 Recommended Implementation Order

### Phase 1: Essential (Week 1-2)
1. Add Coupon system
2. Add Stock Reservation
3. Improve CartItem (variants, pricing)
4. Add Product SEO fields

### Phase 2: Important (Week 3-4)
5. Add Refund/Return system
6. Add Customer authentication fields
7. Add Stock History
8. Add Order timestamps

### Phase 3: Enhancement (Week 5+)
9. Add Review images and voting
10. Add Product Bundles
11. Add Product Alerts
12. Add Loyalty Program

---

## 💡 Additional Considerations

### Performance
- Add Redis for cart caching
- Add search index (Elasticsearch) for products
- Consider read replicas for product browsing

### Security
- Hash passwords with bcrypt
- Rate limit API endpoints
- Add CSRF protection
- Sanitize user inputs

### Business Logic
- Implement inventory sync jobs
- Add abandoned cart recovery emails
- Implement automatic stock reservation expiry
- Add order auto-cancellation for unpaid orders

---

## 🎯 Verdict

**Current Schema**: Good foundation, ~75% production-ready

**Critical Gaps**: 
- ❌ No coupon/discount system
- ❌ No stock reservation
- ❌ No refund tracking
- ⚠️ Limited cart functionality

**Recommendation**: Implement Phase 1 improvements before production launch.

---

**Would you like me to implement any of these improvements?**

