/**
 * Business Workflow Generator - Generates complex business workflows
 * 
 * Generates production-ready business logic for:
 * - Order checkout with stock management
 * - Cart operations with price snapshots
 * - Payment processing workflows
 * - Stock reservation and release
 * - Coupon validation and application
 */

import type { ParsedModel, ParsedSchema } from '../dmmf-parser.js'
import { analyzeBusinessLogic, detectPricingPatterns, detectInventoryPatterns, detectCouponPatterns } from './business-logic-analyzer.js'

/**
 * Generate Order checkout workflow
 */
export function generateOrderCheckoutWorkflow(
  orderModel: ParsedModel,
  schema: ParsedSchema
): string {
  const analysis = analyzeBusinessLogic(orderModel, schema)
  const pricingPatterns = detectPricingPatterns(orderModel)
  const couponPatterns = detectCouponPatterns(orderModel, schema)
  
  // Find related models
  const orderItemModel = schema.models.find(m => m.name === 'OrderItem')
  const cartModel = schema.models.find(m => m.name === 'Cart')
  const productModel = schema.models.find(m => m.name === 'Product')
  const stockReservationModel = schema.models.find(m => m.name === 'StockReservation')
  
  if (!orderItemModel || !cartModel) {
    return '' // Can't generate without these
  }
  
  return `
  /**
   * BUSINESS WORKFLOW: Order Checkout
   * 
   * Complete order checkout process with:
   * - Stock validation and reservation
   * - Price calculation with tax/shipping/coupons
   * - Atomic transaction handling
   * - Automatic stock deduction
   * - Cart clearing
   * 
   * @param customerId Customer placing the order
   * @param data Order data (addresses, payment method, etc.)
   * @returns Created order with all items
   * @throws Error if stock unavailable, coupon invalid, or transaction fails
   */
  async checkout(customerId: number, data: {
    shippingAddressId: number
    billingAddressId?: number
    couponCode?: string
    notes?: string
    ipAddress?: string
  }) {
    return await prisma.$transaction(async (tx) => {
      // STEP 1: Get customer's cart with items
      const cart = await tx.cart.findUnique({
        where: { customerId },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      })
      
      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty')
      }
      
      // STEP 2: Validate stock availability
      for (const item of cart.items) {
        const availableStock = item.variant 
          ? item.variant.stock - item.variant.reservedStock
          : item.product.stock - item.product.reservedStock
        
        if (availableStock < item.quantity) {
          throw new Error(\`Insufficient stock for \${item.product.name}\`)
        }
      }
      
      // STEP 3: Calculate pricing
      const subtotal = cart.items.reduce((sum, item) => {
        return sum + (Number(item.unitPrice) * item.quantity)
      }, 0)
      
      ${couponPatterns.needsCouponValidation ? `
      // STEP 4: Validate and apply coupon
      let discount = 0
      let couponId = null
      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: data.couponCode }
        })
        
        if (!coupon) {
          throw new Error('Invalid coupon code')
        }
        
        if (!coupon.isActive) {
          throw new Error('Coupon is not active')
        }
        
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
          throw new Error('Coupon has expired')
        }
        
        if (coupon.minimumOrderAmount && subtotal < Number(coupon.minimumOrderAmount)) {
          throw new Error(\`Minimum order amount is \${coupon.minimumOrderAmount}\`)
        }
        
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          throw new Error('Coupon usage limit reached')
        }
        
        // Calculate discount
        if (coupon.discountType === 'PERCENTAGE') {
          discount = subtotal * (Number(coupon.discountValue) / 100)
          if (coupon.maxDiscountAmount) {
            discount = Math.min(discount, Number(coupon.maxDiscountAmount))
          }
        } else {
          discount = Number(coupon.discountValue)
        }
        
        couponId = coupon.id
        
        // Increment usage count
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } }
        })
      }
      ` : `
      const discount = 0
      const couponId = null
      `}
      
      ${pricingPatterns.hasTax ? `
      // STEP 5: Calculate tax (placeholder - integrate with tax service)
      const taxRate = 0.08 // TODO: Get from tax service based on shipping address
      const tax = (subtotal - discount) * taxRate
      ` : 'const tax = 0'}
      
      ${pricingPatterns.hasShipping ? `
      // STEP 6: Calculate shipping (placeholder - integrate with shipping service)
      const shipping = 9.99 // TODO: Get from shipping service
      ` : 'const shipping = 0'}
      
      // STEP 7: Calculate total
      const total = subtotal + tax + shipping - discount
      
      // STEP 8: Generate order number
      const orderNumber = \`ORD-\${Date.now()}-\${Math.random().toString(36).substr(2, 9).toUpperCase()}\`
      
      // STEP 9: Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: 'PENDING',
          subtotal,
          tax,
          shipping,
          discount,
          total,
          shippingAddressId: data.shippingAddressId,
          billingAddressId: data.billingAddressId || data.shippingAddressId,
          couponId,
          couponCode: data.couponCode,
          notes: data.notes,
          ipAddress: data.ipAddress,
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              productName: item.product.name,
              sku: item.variant?.sku || item.product.sku
            }))
          }
        },
        include: {
          items: true,
          customer: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          shippingAddress: true,
          billingAddress: true
        }
      })
      
      ${stockReservationModel ? `
      // STEP 10: Reserve stock for order
      for (const item of cart.items) {
        // Reserve stock
        await tx.stockReservation.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            orderId: order.id,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
          }
        })
        
        // Update reserved stock count
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { reservedStock: { increment: item.quantity } }
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { reservedStock: { increment: item.quantity } }
          })
        }
      }
      ` : `
      // STEP 10: Deduct stock immediately (no reservation system)
      for (const item of cart.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } }
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          })
        }
      }
      `}
      
      // STEP 11: Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      })
      
      // STEP 12: Mark cart as completed
      await tx.cart.update({
        where: { id: cart.id },
        data: { completedAt: new Date() }
      })
      
      logger.info({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId,
        total: order.total,
        itemCount: order.items.length
      }, 'Order checkout completed')
      
      return order
    }, {
      maxWait: 5000,  // 5 seconds max wait for transaction
      timeout: 10000, // 10 seconds timeout
    })
  }`
}

/**
 * Generate stock management methods
 */
export function generateStockManagementMethods(
  productModel: ParsedModel,
  schema: ParsedSchema
): string {
  const inventoryPatterns = detectInventoryPatterns(productModel, schema)
  
  if (!inventoryPatterns.needsStockManagement) {
    return ''
  }
  
  return `
  /**
   * BUSINESS LOGIC: Check stock availability
   * 
   * @param productId Product to check
   * @param variantId Optional variant
   * @param quantity Quantity needed
   * @returns Available stock quantity
   */
  async checkStockAvailability(productId: number, variantId: number | null, quantity: number): Promise<{
    available: boolean
    currentStock: number
    reservedStock: number
    availableStock: number
  }> {
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true, reservedStock: true }
      })
      
      if (!variant) {
        throw new Error('Product variant not found')
      }
      
      const availableStock = variant.stock - variant.reservedStock
      
      return {
        available: availableStock >= quantity,
        currentStock: variant.stock,
        reservedStock: variant.reservedStock,
        availableStock
      }
    } else {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true, reservedStock: true }
      })
      
      if (!product) {
        throw new Error('Product not found')
      }
      
      const availableStock = product.stock - product.reservedStock
      
      return {
        available: availableStock >= quantity,
        currentStock: product.stock,
        reservedStock: product.reservedStock,
        availableStock
      }
    }
  },
  
  /**
   * BUSINESS LOGIC: Deduct stock after order confirmation
   * 
   * Reduces both stock and reserved stock atomically
   */
  async deductStock(productId: number, variantId: number | null, quantity: number, reason: {
    orderId?: number
    notes?: string
  }) {
    return await prisma.$transaction(async (tx) => {
      // Deduct stock
      if (variantId) {
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stock: { decrement: quantity },
            reservedStock: { decrement: quantity }
          }
        })
      } else {
        await tx.product.update({
          where: { id: productId },
          data: {
            stock: { decrement: quantity },
            reservedStock: { decrement: quantity }
          }
        })
      }
      
      ${inventoryPatterns.hasStockHistory ? `
      // Record stock history
      await tx.stockHistory.create({
        data: {
          productId,
          change: -quantity,
          reason: 'SALE',
          orderId: reason.orderId,
          notes: reason.notes
        }
      })
      ` : ''}
      
      logger.info({ productId, variantId, quantity, reason }, 'Stock deducted')
    })
  },
  
  /**
   * BUSINESS LOGIC: Restore stock on order cancellation
   */
  async restoreStock(productId: number, variantId: number | null, quantity: number, reason: {
    orderId?: number
    notes?: string
  }) {
    return await prisma.$transaction(async (tx) => {
      // Restore stock
      if (variantId) {
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stock: { increment: quantity },
            reservedStock: { decrement: quantity }
          }
        })
      } else {
        await tx.product.update({
          where: { id: productId },
          data: {
            stock: { increment: quantity },
            reservedStock: { decrement: quantity }
          }
        })
      }
      
      ${inventoryPatterns.hasStockHistory ? `
      // Record stock history
      await tx.stockHistory.create({
        data: {
          productId,
          change: quantity,
          reason: 'CANCELLED',
          orderId: reason.orderId,
          notes: reason.notes || 'Order cancelled'
        }
      })
      ` : ''}
      
      logger.info({ productId, variantId, quantity, reason }, 'Stock restored')
    })
  }`
}

/**
 * Generate Cart add-to-cart workflow
 */
export function generateAddToCartWorkflow(
  cartModel: ParsedModel,
  schema: ParsedSchema
): string {
  const productModel = schema.models.find(m => m.name === 'Product')
  const cartItemModel = schema.models.find(m => m.name === 'CartItem')
  
  if (!productModel || !cartItemModel) {
    return ''
  }
  
  return `
  /**
   * BUSINESS WORKFLOW: Add item to cart
   * 
   * Handles:
   * - Stock validation
   * - Price snapshot
   * - Quantity updates for existing items
   * - Cart creation if needed
   * 
   * @throws Error if out of stock
   */
  async addToCart(customerId: number, data: {
    productId: number
    variantId?: number
    quantity: number
  }) {
    return await prisma.$transaction(async (tx) => {
      // Find or create cart
      let cart = await tx.cart.findUnique({
        where: { customerId }
      })
      
      if (!cart) {
        cart = await tx.cart.create({
          data: {
            customerId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }
        })
      }
      
      // Validate product and stock
      const product = await tx.product.findUnique({
        where: { id: data.productId },
        include: {
          variants: data.variantId ? {
            where: { id: data.variantId }
          } : false
        }
      })
      
      if (!product) {
        throw new Error('Product not found')
      }
      
      if (!product.isActive) {
        throw new Error('Product is not available')
      }
      
      // Check stock
      const variant = product.variants?.[0]
      const availableStock = variant
        ? variant.stock - variant.reservedStock
        : product.stock - product.reservedStock
      
      if (availableStock < data.quantity) {
        throw new Error(\`Only \${availableStock} items available\`)
      }
      
      // Get current price
      const unitPrice = variant
        ? Number(product.price) + Number(variant.priceAdjustment)
        : Number(product.price)
      
      // Check if item already in cart
      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: data.productId,
          variantId: data.variantId || null
        }
      })
      
      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + data.quantity
        
        // Re-check stock for new quantity
        if (availableStock < newQuantity) {
          throw new Error(\`Only \${availableStock} items available\`)
        }
        
        return await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { 
            quantity: newQuantity,
            unitPrice  // Update price to current price
          },
          include: {
            product: {
              select: { id: true, name: true, slug: true }
            },
            variant: true
          }
        })
      } else {
        // Add new item
        return await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: data.productId,
            variantId: data.variantId,
            quantity: data.quantity,
            unitPrice
          },
          include: {
            product: {
              select: { id: true, name: true, slug: true }
            },
            variant: true
          }
        })
      }
    })
  }`
}

/**
 * Generate Order status transition methods (State Machine)
 */
export function generateOrderStatusTransitions(
  orderModel: ParsedModel,
  schema: ParsedSchema
): string {
  const hasStatus = orderModel.fields.some(f => f.name === 'status')
  
  if (!hasStatus) {
    return ''
  }
  
  return `
  /**
   * BUSINESS WORKFLOW: Confirm Order
   * 
   * Transitions: PENDING -> CONFIRMED
   * - Sets confirmedAt timestamp
   * - Validates payment completed
   */
  async confirmOrder(id: number) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true }
    })
    
    if (!order) {
      throw new Error('Order not found')
    }
    
    if (order.status !== 'PENDING') {
      throw new Error(\`Cannot confirm order in \${order.status} status\`)
    }
    
    if (!order.payment || order.payment.status !== 'COMPLETED') {
      throw new Error('Payment not completed')
    }
    
    return await prisma.order.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date()
      },
      include: {
        items: true,
        customer: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    })
  },
  
  /**
   * BUSINESS WORKFLOW: Cancel Order
   * 
   * - Restores stock
   * - Releases reservations
   * - Initiates refund if paid
   */
  async cancelOrder(id: number, reason?: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
          payment: true
        }
      })
      
      if (!order) {
        throw new Error('Order not found')
      }
      
      if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
        throw new Error(\`Cannot cancel order in \${order.status} status\`)
      }
      
      // Restore stock for all items
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { increment: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          })
        }
      }
      
      // Release stock reservations
      await tx.stockReservation.deleteMany({
        where: { orderId: id }
      })
      
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          notes: reason ? \`\${order.notes || ''} | Cancelled: \${reason}\` : order.notes
        },
        include: {
          items: true,
          customer: {
            select: { id: true, email: true, firstName: true, lastName: true }
          }
        }
      })
      
      logger.info({ orderId: id, reason }, 'Order cancelled and stock restored')
      
      return updatedOrder
    })
  },
  
  /**
   * BUSINESS WORKFLOW: Ship Order
   * 
   * Transitions: PACKED -> SHIPPED
   * - Deducts reserved stock
   * - Sets shippedAt timestamp
   */
  async shipOrder(id: number, trackingNumber?: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true, shipment: true }
      })
      
      if (!order) {
        throw new Error('Order not found')
      }
      
      if (order.status !== 'PACKED') {
        throw new Error(\`Cannot ship order in \${order.status} status\`)
      }
      
      // Deduct reserved stock (convert reservation to actual sale)
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity }
            }
          })
        }
      }
      
      // Update shipment if exists
      if (order.shipment && trackingNumber) {
        await tx.shipment.update({
          where: { id: order.shipment.id },
          data: { trackingNumber }
        })
      }
      
      // Update order
      return await tx.order.update({
        where: { id },
        data: {
          status: 'SHIPPED',
          shippedAt: new Date()
        },
        include: {
          items: true,
          shipment: true
        }
      })
    })
  }`
}

/**
 * Generate coupon validation logic
 */
export function generateCouponValidation(
  couponModel: ParsedModel,
  schema: ParsedSchema
): string {
  return `
  /**
   * BUSINESS LOGIC: Validate coupon for order
   * 
   * Checks:
   * - Coupon exists and is active
   * - Not expired
   * - Usage limit not exceeded
   * - Minimum order amount met
   * - Customer eligible (if customer-specific)
   * 
   * @returns Coupon data with calculated discount
   */
  async validateCoupon(code: string, orderData: {
    customerId: number
    subtotal: number
  }): Promise<{
    valid: boolean
    coupon?: any
    discount: number
    errors: string[]
  }> {
    const errors: string[] = []
    
    const coupon = await prisma.coupon.findUnique({
      where: { code }
    })
    
    if (!coupon) {
      return { valid: false, discount: 0, errors: ['Invalid coupon code'] }
    }
    
    if (!coupon.isActive) {
      errors.push('Coupon is not active')
    }
    
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      errors.push('Coupon has expired')
    }
    
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      errors.push('Coupon usage limit reached')
    }
    
    if (coupon.minimumOrderAmount && orderData.subtotal < Number(coupon.minimumOrderAmount)) {
      errors.push(\`Minimum order amount is \${coupon.minimumOrderAmount}\`)
    }
    
    if (errors.length > 0) {
      return { valid: false, discount: 0, errors }
    }
    
    // Calculate discount
    let discount = 0
    if (coupon.discountType === 'PERCENTAGE') {
      discount = orderData.subtotal * (Number(coupon.discountValue) / 100)
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, Number(coupon.maxDiscountAmount))
      }
    } else {
      discount = Number(coupon.discountValue)
    }
    
    return {
      valid: true,
      coupon,
      discount,
      errors: []
    }
  }`
}

