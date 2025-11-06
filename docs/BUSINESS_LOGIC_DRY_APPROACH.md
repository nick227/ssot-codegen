# Business Logic Generation - DRY Approach

## Philosophy: Model-First, Clean, Composable

Instead of generating **massive imperative workflows**, generate:
1. **Declarative workflow definitions** (from schema)
2. **Reusable base classes** (workflow engine)
3. **Small, composable functions** (< 20 lines each)
4. **Clear extension points** (hooks system)

---

## ❌ What NOT to Generate

### Anti-Pattern: Massive Methods

```typescript
// BAD: 200-line generated method ❌
async checkout(customerId, data) {
  return await prisma.$transaction(async (tx) => {
    // 20 lines: cart validation
    // 30 lines: stock validation
    // 40 lines: coupon validation
    // 30 lines: price calculation
    // 40 lines: order creation
    // 20 lines: stock reservation
    // 20 lines: cart cleanup
    // = 200 lines of HARD TO MAINTAIN CODE
  })
}
```

**Problems:**
- Hard to test individual steps
- Hard to customize
- Violates SRP
- Not DRY (patterns repeated across methods)

---

## ✅ What TO Generate

### Approach 1: Workflow Definition (Declarative)

**Generate a clean workflow definition:**

```typescript
// AUTO-GENERATED from Order schema analysis
import { WorkflowBuilder } from '@/base/workflow'
import { validateStock, validateCoupon, calculateOrderTotal } from '@/base/order-utils'

export const orderCheckoutWorkflow = new WorkflowBuilder('OrderCheckout')
  .step('validateCart', async (ctx) => {
    ctx.cart = await ctx.tx.cart.findUniqueOrThrow({
      where: { customerId: ctx.customerId },
      include: { items: { include: { product: true, variant: true } } }
    })
    if (ctx.cart.items.length === 0) throw new Error('Cart is empty')
  })
  
  .step('validateStock', async (ctx) => {
    await validateStock(ctx.cart.items, ctx.tx)
  })
  
  .step('applyCoupon', async (ctx) => {
    const subtotal = ctx.cart.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0)
    ctx.pricing = await validateCoupon(ctx.data.couponCode, subtotal, ctx.tx)
  })
  
  .step('calculatePricing', async (ctx) => {
    ctx.totals = await calculateOrderTotal(ctx.cart, ctx.pricing, ctx.data)
  })
  
  .step('createOrder', async (ctx) => {
    ctx.order = await ctx.tx.order.create({
      data: {
        ...ctx.totals,
        customerId: ctx.customerId,
        orderNumber: generateOrderNumber(),
        items: { create: ctx.cart.items.map(mapCartItemToOrderItem) }
      }
    })
  })
  
  .step('reserveStock', async (ctx) => {
    await reserveStock(ctx.cart.items, ctx.order.id, ctx.tx)
  })
  
  .step('clearCart', async (ctx) => {
    await ctx.tx.cartItem.deleteMany({ where: { cartId: ctx.cart.id } })
    await ctx.tx.cart.update({ where: { id: ctx.cart.id }, data: { completedAt: new Date() } })
  })
  
  .build()

// Usage in service (CLEAN!):
export const orderService = {
  async checkout(customerId: number, data: CheckoutData) {
    return orderCheckoutWorkflow.execute({ customerId, data })
  }
}
```

**Benefits:**
- ✅ Each step < 10 lines
- ✅ Reuses utilities
- ✅ Easy to read workflow
- ✅ Easy to test each step
- ✅ Easy to add/remove steps
- ✅ DRY - no duplication

---

### Approach 2: Base Workflow Engine (Reusable)

**Generate ONCE in base/:**

```typescript
// base/workflow.ts - GENERATED ONCE, reused everywhere
export class WorkflowBuilder<T = any> {
  constructor(private name: string) {}
  
  private steps: WorkflowStep[] = []
  
  step(name: string, fn: (ctx: T) => Promise<void>) {
    this.steps.push({ name, fn })
    return this
  }
  
  build() {
    return {
      execute: async (initialContext: Partial<T>) => {
        return await prisma.$transaction(async (tx) => {
          const ctx = { ...initialContext, tx } as T
          
          for (const step of this.steps) {
            try {
              await step.fn(ctx)
              logger.debug({ workflow: this.name, step: step.name }, 'Step completed')
            } catch (error) {
              logger.error({ workflow: this.name, step: step.name, error }, 'Step failed')
              throw error
            }
          }
          
          return ctx.order || ctx.result
        }, {
          maxWait: 5000,
          timeout: 10000
        })
      }
    }
  }
}
```

**DRY Benefits:**
- ✅ Transaction handling: Written ONCE
- ✅ Logging: Written ONCE
- ✅ Error handling: Written ONCE
- ✅ Reused by ALL workflows

---

### Approach 3: Composable Utilities (Small Functions)

**Generate reusable utility functions:**

```typescript
// base/order-utils.ts - AUTO-GENERATED from schema patterns

/**
 * Validate stock availability for cart items
 * Reusable across: checkout, addToCart, updateQuantity
 */
export async function validateStock(
  items: CartItemWithProduct[],
  tx: PrismaTransaction
): Promise<void> {
  for (const item of items) {
    const availableStock = item.variant
      ? item.variant.stock - item.variant.reservedStock
      : item.product.stock - item.product.reservedStock
    
    if (availableStock < item.quantity) {
      throw new Error(\`Insufficient stock for "\${item.product.name}"\`)
    }
  }
}

/**
 * Reserve stock for order items
 * Reusable across: checkout, manual order creation
 */
export async function reserveStock(
  items: CartItemWithProduct[],
  orderId: number,
  tx: PrismaTransaction
): Promise<void> {
  for (const item of items) {
    await tx.stockReservation.create({
      data: {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        orderId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    })
    
    // Update reserved count
    const updateData = { reservedStock: { increment: item.quantity } }
    if (item.variantId) {
      await tx.productVariant.update({ where: { id: item.variantId }, data: updateData })
    } else {
      await tx.product.update({ where: { id: item.productId }, data: updateData })
    }
  }
}

/**
 * Validate and calculate coupon discount
 * Reusable across: checkout, updateOrder, applyPromotion
 */
export async function validateCoupon(
  code: string | undefined,
  subtotal: number,
  tx: PrismaTransaction
): Promise<{ discount: number; couponId: number | null }> {
  if (!code) return { discount: 0, couponId: null }
  
  const coupon = await tx.coupon.findUnique({ where: { code } })
  if (!coupon) throw new Error('Invalid coupon code')
  if (!coupon.isActive) throw new Error('Coupon is not active')
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error('Coupon expired')
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) throw new Error('Coupon usage limit reached')
  if (coupon.minimumOrderAmount && subtotal < Number(coupon.minimumOrderAmount)) {
    throw new Error(\`Minimum order: $\${coupon.minimumOrderAmount}\`)
  }
  
  const discount = coupon.discountType === 'PERCENTAGE'
    ? Math.min(subtotal * Number(coupon.discountValue) / 100, Number(coupon.maxDiscountAmount || Infinity))
    : Number(coupon.discountValue)
  
  await tx.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } })
  
  return { discount, couponId: coupon.id }
}

/**
 * Calculate order totals
 * Reusable across: checkout, recalculateOrder, updateOrder
 */
export function calculateOrderTotal(pricing: {
  subtotal: number
  discount: number
  taxRate?: number
  shipping?: number
}): OrderTotals {
  const { subtotal, discount, taxRate = 0.08, shipping = 9.99 } = pricing
  const tax = (subtotal - discount) * taxRate
  const total = subtotal + tax + shipping - discount
  
  return { subtotal, tax, shipping, discount, total }
}
```

**DRY Benefits:**
- ✅ Each function < 30 lines
- ✅ Single responsibility
- ✅ Reusable across multiple workflows
- ✅ Easy to test individually
- ✅ Easy to override/customize

---

### Approach 4: State Machine (Declarative Config)

**Generate state machine configuration:**

```typescript
// AUTO-GENERATED from OrderStatus enum + timestamp fields
import { StateMachine } from '@/base/state-machine'

export const orderStateMachine = new StateMachine({
  model: 'Order',
  field: 'status',
  
  states: {
    PENDING: {
      transitions: ['CONFIRMED', 'CANCELLED'],
      timestamp: null
    },
    CONFIRMED: {
      transitions: ['PROCESSING', 'CANCELLED'],
      timestamp: 'confirmedAt',
      onEnter: async (order, tx) => {
        // Auto-generated: Validate payment completed
        const payment = await tx.payment.findUnique({ where: { orderId: order.id } })
        if (!payment || payment.status !== 'COMPLETED') {
          throw new Error('Payment not completed')
        }
      }
    },
    PROCESSING: {
      transitions: ['PACKED', 'CANCELLED'],
      timestamp: null
    },
    PACKED: {
      transitions: ['SHIPPED'],
      timestamp: 'packedAt'
    },
    SHIPPED: {
      transitions: ['DELIVERED'],
      timestamp: 'shippedAt',
      onEnter: async (order, tx) => {
        // Auto-generated: Deduct reserved stock
        await deductReservedStock(order.id, tx)
      }
    },
    DELIVERED: {
      transitions: [],
      timestamp: 'deliveredAt'
    },
    CANCELLED: {
      transitions: [],
      timestamp: 'cancelledAt',
      onEnter: async (order, tx) => {
        // Auto-generated: Restore stock
        await restoreOrderStock(order.id, tx)
      }
    }
  }
})

// Service methods (TINY!):
export const orderService = {
  async confirmOrder(id: number) {
    return orderStateMachine.transition(id, 'CONFIRMED')  // 1 line!
  },
  
  async cancelOrder(id: number, reason?: string) {
    return orderStateMachine.transition(id, 'CANCELLED', { notes: reason })  // 1 line!
  },
  
  async shipOrder(id: number) {
    return orderStateMachine.transition(id, 'SHIPPED')  // 1 line!
  }
}
```

**DRY Benefits:**
- ✅ State machine engine: Generated ONCE
- ✅ Transition logic: Reused automatically
- ✅ Timestamp updates: Automatic
- ✅ Validation: Declarative
- ✅ Service methods: 1 line each!

---

## 🎯 The DRY Model-First Approach

### Generate Base Infrastructure (Once)

**1. Base Workflow Engine** - Generated once in `base/workflow.ts`
**2. State Machine Engine** - Generated once in `base/state-machine.ts`
**3. Validation Utilities** - Generated once in `base/validators.ts`
**4. Stock Utilities** - Generated once in `base/stock-utils.ts`
**5. Pricing Calculator** - Generated once in `base/pricing.ts`

### Generate Model-Specific Configs (Tiny)

**Per-Model Files:**
```typescript
// services/order/order.workflows.ts (40 lines, not 200!)
import { defineWorkflow } from '@/base/workflow'
import { validateStock, reserveStock, calculateOrderTotal } from '@/base/order-utils'

export const checkoutWorkflow = defineWorkflow({
  name: 'OrderCheckout',
  
  steps: [
    { name: 'validateCart', fn: getCartWithItems },
    { name: 'validateStock', fn: validateStock },
    { name: 'applyCoupon', fn: applyCouponToCart },
    { name: 'calculatePricing', fn: calculateOrderTotal },
    { name: 'createOrder', fn: createOrderWithItems },
    { name: 'reserveStock', fn: reserveStock },
    { name: 'clearCart', fn: clearCartItems }
  ],
  
  hooks: {
    onSuccess: async (order) => {
      // Extension point for emails, analytics
    },
    onError: async (error, ctx) => {
      // Extension point for error handling
    }
  }
})

// services/order/order.service.ts (TINY!)
export const orderService = {
  ...baseCRUD,
  
  checkout: (customerId, data) => checkoutWorkflow.run({ customerId, data }),  // 1 line!
  confirmOrder: (id) => orderStateMachine.transition(id, 'CONFIRMED'),        // 1 line!
  cancelOrder: (id, reason) => orderStateMachine.transition(id, 'CANCELLED', { reason })  // 1 line!
}
```

**File Sizes:**
- ✅ `order.service.ts`: ~50 lines (CRUD + 3 workflow methods)
- ✅ `order.workflows.ts`: ~40 lines (workflow definitions)
- ✅ `order.state-machine.ts`: ~60 lines (state config)
- ✅ Total per model: ~150 lines across 3 small files

**vs 200+ lines in one massive file!**

---

### Approach 2: Schema-Driven Annotations

**Enhanced schema with business logic hints:**

```prisma
/// Order model
/// @workflow checkout: Cart -> Order (steps: validateStock, calculateTotal, reserveStock)
/// @stateMachine status: PENDING->CONFIRMED->PROCESSING->PACKED->SHIPPED->DELIVERED
/// @calculation total: subtotal + tax + shipping - discount
/// @transaction required
model Order {
  id              Int       @id @default(autoincrement())
  orderNumber     String    @unique
  customerId      Int
  status          OrderStatus @default(PENDING)
  
  /// @calculated from: items.sum(quantity * unitPrice)
  subtotal        Decimal   @db.Decimal(10, 2)
  
  /// @calculated from: (subtotal - discount) * taxRate
  tax             Decimal   @db.Decimal(10, 2)
  
  /// @calculated from: shippingService
  shipping        Decimal   @db.Decimal(10, 2)
  
  /// @calculated from: coupon.calculateDiscount(subtotal)
  discount        Decimal   @default(0) @db.Decimal(10, 2)
  
  /// @calculated from: subtotal + tax + shipping - discount
  total           Decimal   @db.Decimal(10, 2)
  
  /// @transition PENDING->CONFIRMED: requires payment.status=COMPLETED
  confirmedAt     DateTime?
  
  /// @transition PACKED->SHIPPED: deducts reservedStock
  shippedAt       DateTime?
  
  /// @transition *->CANCELLED: restores stock, releases reservations
  cancelledAt     DateTime?
  
  customer        Customer  @relation(fields: [customerId], references: [id])
  items           OrderItem[]
  payment         Payment?
  
  @@index([customerId])
}
```

**Generator reads annotations:**
```typescript
// Detects:
@workflow checkout         → Generate: checkoutWorkflow definition
@stateMachine status       → Generate: orderStateMachine config
@calculation total         → Generate: calculateTotal() utility
@transition PENDING->      → Generate: transition validation rules
```

**Generated code stays TINY:**
```typescript
// Generated: 15 lines, not 200!
export const orderService = {
  ...baseCRUD,
  checkout: workflowExecutor('OrderCheckout'),
  confirmOrder: stateMachine('Order').transitionTo('CONFIRMED'),
  calculateTotal: calculator('Order', 'total')
}
```

---

### Approach 3: Composable Mixins

**Generate small reusable pieces:**

```typescript
// AUTO-GENERATED mixin pattern
import { withStateMachine } from '@/base/mixins/state-machine'
import { withStockManagement } from '@/base/mixins/stock'
import { withPricing } from '@/base/mixins/pricing'
import { withWorkflows } from '@/base/mixins/workflow'

// Base CRUD (generated)
const baseOrderService = {
  list(query) { },
  findById(id) { },
  create(data) { },
  update(id, data) { },
  delete(id) { }
}

// Compose with mixins (auto-detected from schema)
export const orderService = {
  ...baseOrderService,
  
  // Mixin: StateMachine (because Order has status enum + timestamps)
  ...withStateMachine(baseOrderService, {
    field: 'status',
    transitions: orderStateTransitions
  }),
  // Adds: confirmOrder(), cancelOrder(), shipOrder() - 3 methods
  
  // Mixin: Workflows (because Order has complex creation logic)
  ...withWorkflows(baseOrderService, {
    checkout: checkoutWorkflowSteps
  }),
  // Adds: checkout() - 1 method
  
  // Mixin: Pricing (because Order has calculation fields)
  ...withPricing(baseOrderService, {
    formula: 'subtotal + tax + shipping - discount'
  })
  // Adds: calculateTotal(), recalculate() - 2 methods
}
```

**File size: ~30 lines total!**

---

## 📐 Architecture: Layered Generation

### Layer 1: Base Infrastructure (Generated Once)

```
base/
├── workflow.ts          (WorkflowBuilder class)
├── state-machine.ts     (StateMachine class)
├── validators.ts        (Common validation functions)
├── pricing.ts           (Price calculation utilities)
├── stock-utils.ts       (Stock management functions)
├── transaction.ts       (Transaction helpers)
└── mixins/
    ├── state-machine.ts
    ├── workflow.ts
    ├── pricing.ts
    └── stock.ts

Total: ~500 lines for ALL utilities (used by all models)
```

### Layer 2: Model-Specific Configs (Tiny)

```
services/order/
├── order.service.ts         (~40 lines: CRUD + mixins)
├── order.workflows.ts       (~40 lines: workflow definitions)
├── order.state-machine.ts   (~50 lines: state config)
└── order.validators.ts      (~30 lines: custom rules)

Total per model: ~160 lines across 4 small, focused files
```

### Layer 3: Service Composition (Automatic)

```typescript
// AUTO-COMPOSED from detected patterns
export const orderService = compose(
  baseCRUD,                          // Basic CRUD
  withStateMachine(stateConfig),     // + State transitions
  withWorkflows({ checkout }),       // + Checkout workflow
  withPricing(pricingConfig)         // + Price calculations
)

// Result: Full-featured service in 5 lines!
```

---

## 🧩 Benefits of DRY Approach

### 1. File Sizes Stay Small

| Approach | Lines Generated |
|----------|----------------|
| ❌ Massive methods | 200+ lines per workflow |
| ✅ DRY approach | 40 lines per workflow definition |
| **Savings** | **80% reduction** |

### 2. Code Reuse

| Utility | Used By | Times Reused |
|---------|---------|--------------|
| `validateStock()` | checkout, addToCart, updateQuantity | 3x |
| `reserveStock()` | checkout, manualOrder | 2x |
| `validateCoupon()` | checkout, updateOrder, applyPromo | 3x |
| `calculateOrderTotal()` | checkout, recalculate, updatePricing | 3x |

**Result:** 500 lines of utilities replace 2,000+ lines of duplicated code!

### 3. Easy to Customize

**Want to add a custom validation to checkout?**

```typescript
// Before (massive generated method):
// Edit 200-line checkout() method ❌
// Hard to find where to add logic
// Might break other steps

// After (DRY approach):
// Add to workflow definition ✅
export const checkoutWorkflow = defineWorkflow({
  steps: [
    { name: 'validateCart', fn: getCartWithItems },
    { name: 'customCheck', fn: myCustomValidation },  // ✅ Easy to insert!
    { name: 'validateStock', fn: validateStock },
    // ... rest
  ]
})
```

### 4. Easy to Test

**Before:**
```typescript
// Must mock entire 200-line transaction ❌
it('should validate stock', async () => {
  // Mock 10 different Prisma calls
  // Call checkout()
  // Assert somewhere in the 200 lines it validated stock
})
```

**After:**
```typescript
// Test individual utility ✅
it('should validate stock', async () => {
  const items = [{ product: { stock: 5 }, quantity: 10 }]
  await expect(validateStock(items, tx)).rejects.toThrow('Insufficient stock')
})

// Test workflow composition ✅
it('should execute checkout workflow', async () => {
  const result = await checkoutWorkflow.run({ customerId: 1, data: {} })
  expect(result.order).toBeDefined()
})
```

---

## 📋 What to Generate

### Priority 1: Base Utilities (Once, Reused Everywhere)

1. ✅ `base/workflow.ts` - WorkflowBuilder class
2. ✅ `base/state-machine.ts` - StateMachine class
3. ✅ `base/order-utils.ts` - Stock, pricing, coupon utilities
4. ✅ `base/validators.ts` - Common validation functions
5. ✅ `base/transaction.ts` - Transaction helpers

**Total:** ~500 lines, benefits ALL models

### Priority 2: Model-Specific Definitions (Per Model)

1. ✅ `order.workflows.ts` - Declarative workflow definitions (~40 lines)
2. ✅ `order.state-machine.ts` - State transition config (~50 lines)
3. ✅ Enhanced `order.service.ts` - Composes utilities (~40 lines)

**Total:** ~130 lines per model (vs 200+ in massive methods)

---

## 🎨 Code Generation Strategy

### Step 1: Analyze Schema

```typescript
const patterns = analyzeBusinessPatterns(orderModel, schema)

// Detects:
{
  hasWorkflow: true,  // Order + OrderItem + Cart pattern
  hasStateMachine: true,  // status enum + timestamps
  hasCalculations: true,  // subtotal, tax, total fields
  hasStockManagement: true,  // Related Product with stock fields
  needsTransactions: true  // Multiple related writes
}
```

### Step 2: Generate Base Utilities (If Not Exists)

```typescript
if (!exists('base/workflow.ts')) {
  generate('base/workflow.ts', workflowEngineTemplate)  // 80 lines
}

if (!exists('base/order-utils.ts')) {
  generate('base/order-utils.ts', orderUtilitiesTemplate(patterns))  // 150 lines
}
```

### Step 3: Generate Model Configs (Tiny)

```typescript
if (patterns.hasWorkflow) {
  generate('services/order/order.workflows.ts', workflowDefinition(patterns))  // 40 lines
}

if (patterns.hasStateMachine) {
  generate('services/order/order.state-machine.ts', stateMachineConfig(patterns))  // 50 lines
}
```

### Step 4: Enhance Service (Composition)

```typescript
// Modify order.service.ts to add workflow methods:
export const orderService = {
  ...baseCRUD,  // Existing CRUD
  
  // Add workflow methods (clean imports):
  checkout: (cId, data) => checkoutWorkflow.run({ customerId: cId, data }),
  
  // Add state machine methods (clean imports):
  confirmOrder: (id) => orderStateMachine.transition(id, 'CONFIRMED'),
  cancelOrder: (id, reason) => orderStateMachine.transition(id, 'CANCELLED', { reason }),
  
  // Add calculation methods (clean imports):
  calculateTotal: (id) => recalculateOrderTotal(id)
}

// Total additions: ~10 lines
// order.service.ts final size: ~60 lines (CRUD + workflows)
```

---

## 📏 File Size Enforcement

### Target Sizes (Per Your Rule #14)

| File Type | Target | Actual with DRY |
|-----------|--------|-----------------|
| `order.service.ts` | < 200 lines | ✅ ~60 lines |
| `order.workflows.ts` | < 200 lines | ✅ ~40 lines |
| `order.state-machine.ts` | < 200 lines | ✅ ~50 lines |
| `base/workflow.ts` | < 200 lines | ✅ ~80 lines |
| `base/order-utils.ts` | < 200 lines | ✅ ~150 lines |

**All files stay SHORT and focused!**

---

## 🔄 Reuse Strategy

### Pattern: Generate Utilities for Common Operations

```typescript
// base/stock-utils.ts - GENERATED ONCE from any model with stock field

export async function validateStock(items, tx) { /* 15 lines */ }
export async function reserveStock(items, orderId, tx) { /* 20 lines */ }
export async function deductStock(items, tx) { /* 20 lines */ }
export async function restoreStock(items, tx) { /* 20 lines */ }
export async function checkLowStock(threshold) { /* 10 lines */ }

// Total: ~85 lines
// Reused by: Product, ProductVariant, Order, Cart services
// Saves: 85 lines × 4 models = 340 lines of duplication!
```

### Pattern: Generate Workflow Primitives

```typescript
// base/workflow-steps.ts - GENERATED from common patterns

// Reusable steps (5-10 lines each):
export const getCartWithItems = async (ctx) => { /* 8 lines */ }
export const validateCartNotEmpty = async (ctx) => { /* 5 lines */ }
export const calculateSubtotal = async (ctx) => { /* 6 lines */ }
export const generateOrderNumber = () => { /* 3 lines */ }
export const clearCartItems = async (ctx) => { /* 8 lines */ }

// Compose into workflows:
const checkout = composeWorkflow([
  getCartWithItems,
  validateCartNotEmpty,
  validateStock,
  calculateSubtotal,
  // ... etc
])
```

---

## 💡 Model-First Philosophy Maintained

### The Model is Truth

```prisma
model Order {
  status OrderStatus  // ← State machine auto-detected
  total Decimal       // ← Calculation auto-detected
  items OrderItem[]   // ← Workflow auto-detected
  
  confirmedAt DateTime?  // ← Timestamp for CONFIRMED state
  shippedAt DateTime?    // ← Timestamp for SHIPPED state
}
```

**Generator reads the model and infers:**
- "This needs a state machine" (status enum + timestamps)
- "This needs calculations" (total field with related fields)
- "This needs workflows" (parent-child pattern with Order-OrderItem)
- "This needs transactions" (multi-model writes)

### Zero Configuration

**Engineer doesn't write:**
```yaml
# ❌ No config files needed!
workflows:
  - name: checkout
    steps: [validateCart, validateStock, ...]
```

**Generator detects from MODEL:**
```prisma
# ✅ Model itself is the configuration!
model Order {
  items OrderItem[]  # → Workflow detected
  status OrderStatus # → State machine detected
  total Decimal      # → Calculation detected
}
```

---

## 🎯 Final Architecture

```
generated/
├── base/                         (Generated ONCE - 500 lines total)
│   ├── workflow.ts               (80 lines - Reusable engine)
│   ├── state-machine.ts          (100 lines - Reusable engine)
│   ├── order-utils.ts            (150 lines - Shared utilities)
│   ├── validators.ts             (70 lines - Common validators)
│   ├── pricing.ts                (60 lines - Calculation utilities)
│   └── stock-utils.ts            (40 lines - Stock operations)
│
└── services/order/               (Generated PER MODEL - 150 lines total)
    ├── order.service.ts          (60 lines - CRUD + composition)
    ├── order.workflows.ts        (40 lines - Workflow definitions)
    ├── order.state-machine.ts    (50 lines - State configuration)
    └── index.ts                  (Barrel export)

Total for 24 models:
- Base utilities: 500 lines (reused 24x)
- Per model: 150 lines × 24 = 3,600 lines
- TOTAL: 4,100 lines

vs Manual Implementation:
- Per model: 700 lines × 24 = 16,800 lines
- TOTAL: 16,800 lines

SAVINGS: 12,700 lines (75% reduction) + ZERO duplication!
```

---

## ✅ Revised Generation Plan

### Generate:

1. **Base Workflow Engine** (Once)
   - Small, focused class
   - Handles transactions, logging, errors
   - ~80 lines

2. **Workflow Definitions** (Per Model)
   - Declarative step definitions
   - No business logic duplication
   - ~40 lines per model

3. **Utility Functions** (Shared)
   - Small, pure functions
   - Single responsibility
   - Fully reusable
   - ~10-20 lines each

4. **Service Composition** (Per Model)
   - Import utilities
   - Compose workflows
   - Export clean API
   - ~10 lines of additions

### Result:

✅ **SHORT files** (< 200 lines - Rule #14)  
✅ **DRY code** (utilities reused everywhere - Rule #13)  
✅ **Functional** (small pure functions - Rule #13)  
✅ **SRP** (each file has one purpose - Rule #13)  
✅ **Model-first** (inferred from schema, zero config)  
✅ **Clean** (easy to read and understand)  

---

**This is the way!** 🎯

Generate smart, composable pieces - not massive monolithic methods!

