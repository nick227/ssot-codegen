/**
 * Business Logic Analyzer - Detects domain patterns and generates business logic
 * 
 * Analyzes schema to detect:
 * - Workflow patterns (Order checkout, Status transitions)
 * - Calculation patterns (Price totals, Tax)
 * - Inventory patterns (Stock management, Reservations)
 * - Validation patterns (Coupon validation, Stock checks)
 */

import type { ParsedModel, ParsedSchema, ParsedField } from '../dmmf-parser.js'
import { analyzeModel } from '../utils/relationship-analyzer.js'

export interface BusinessPattern {
  type: 'workflow' | 'calculation' | 'inventory' | 'validation' | 'state-machine'
  name: string
  detected: boolean
  fields: string[]
  methods: BusinessMethod[]
}

export interface BusinessMethod {
  name: string
  description: string
  parameters: { name: string; type: string }[]
  returnType: string
  transaction: boolean  // Needs database transaction
  validation: string[]  // Business rules to validate
}

export interface BusinessLogicAnalysis {
  model: ParsedModel
  patterns: BusinessPattern[]
  workflows: WorkflowDetection[]
  calculations: CalculationDetection[]
  stateMachines: StateMachineDetection[]
}

export interface WorkflowDetection {
  name: string  // e.g., "OrderCheckout"
  trigger: string  // e.g., "createOrder"
  steps: WorkflowStep[]
  requiresTransaction: boolean
}

export interface WorkflowStep {
  order: number
  name: string
  description: string
  validation?: string
  action: string
}

export interface CalculationDetection {
  field: string  // e.g., "total"
  formula: string  // e.g., "subtotal + tax + shipping - discount"
  dependencies: string[]  // Fields needed for calculation
  autoCalculate: boolean  // Should calculate automatically
}

export interface StateMachineDetection {
  field: string  // e.g., "status"
  enumName: string  // e.g., "OrderStatus"
  states: string[]  // All possible states
  transitions: StateTransition[]
  timestampFields: Record<string, string>  // status -> timestamp field
}

export interface StateTransition {
  from: string
  to: string
  methodName: string  // e.g., "confirmOrder"
  validation: string[]
  sideEffects?: string[]  // e.g., ["reserveStock", "sendEmail"]
}

/**
 * Analyze model for business logic patterns
 */
export function analyzeBusinessLogic(
  model: ParsedModel,
  schema: ParsedSchema
): BusinessLogicAnalysis {
  const patterns: BusinessPattern[] = []
  
  // Detect workflows
  const workflows = detectWorkflows(model, schema)
  if (workflows.length > 0) {
    patterns.push({
      type: 'workflow',
      name: 'OrderCheckout',
      detected: true,
      fields: ['status', 'total', 'items'],
      methods: workflows.flatMap(w => w.steps.map(s => ({
        name: s.name,
        description: s.description,
        parameters: [],
        returnType: 'Promise<Order>',
        transaction: true,
        validation: s.validation ? [s.validation] : []
      })))
    })
  }
  
  // Detect calculations
  const calculations = detectCalculations(model, schema)
  
  // Detect state machines
  const stateMachines = detectStateMachines(model, schema)
  
  return {
    model,
    patterns,
    workflows,
    calculations,
    stateMachines
  }
}

/**
 * Detect workflow patterns (Order, Cart, Payment, etc.)
 */
function detectWorkflows(model: ParsedModel, schema: ParsedSchema): WorkflowDetection[] {
  const workflows: WorkflowDetection[] = []
  const analysis = analyzeModel(model, schema)
  
  // ORDER CHECKOUT WORKFLOW
  if (model.name === 'Order' || (hasField(model, 'status') && hasField(model, 'total'))) {
    const hasItems = analysis.relationFields.some(r => r.name.toLowerCase().includes('item'))
    const hasCoupon = hasField(model, 'couponId')
    const hasPayment = analysis.relationFields.some(r => r.name === 'payment')
    
    if (hasItems) {
      workflows.push({
        name: 'OrderCheckout',
        trigger: 'checkout',
        requiresTransaction: true,
        steps: [
          {
            order: 1,
            name: 'validateCart',
            description: 'Validate cart items exist and have stock',
            validation: 'cartItems.length > 0 && allItemsInStock',
            action: 'checkStockAvailability'
          },
          {
            order: 2,
            name: 'calculateTotals',
            description: 'Calculate subtotal, tax, shipping, discount, total',
            action: 'sumCartItems + applyTax + addShipping - applyCoupon'
          },
          {
            order: 3,
            name: 'reserveStock',
            description: 'Reserve inventory for order items',
            action: 'createStockReservations'
          },
          {
            order: 4,
            name: 'applyCoupon',
            description: 'Validate and apply coupon discount',
            validation: 'coupon.isValid && coupon.notExpired && meetsMinimumOrder',
            action: 'calculateDiscount'
          },
          {
            order: 5,
            name: 'createOrder',
            description: 'Create order record with all calculated values',
            action: 'prisma.order.create with items'
          },
          {
            order: 6,
            name: 'deductStock',
            description: 'Deduct reserved stock from inventory',
            action: 'updateProductStock'
          },
          {
            order: 7,
            name: 'clearCart',
            description: 'Empty customer cart after successful order',
            action: 'deleteCartItems'
          }
        ]
      })
    }
  }
  
  // CART ADD WORKFLOW
  if (model.name === 'Cart' || model.name === 'CartItem') {
    workflows.push({
      name: 'AddToCart',
      trigger: 'addItem',
      requiresTransaction: true,
      steps: [
          {
            order: 1,
            name: 'validateProduct',
            description: 'Check product exists and is in stock',
            validation: 'product.exists && product.stock >= quantity',
            action: 'findProduct'
          },
          {
            order: 2,
            name: 'checkExistingItem',
            description: 'Check if item already in cart',
            action: 'findCartItem'
          },
          {
            order: 3,
            name: 'upsertCartItem',
            description: 'Add new item or increase quantity',
            action: 'upsert with quantity adjustment'
          },
          {
            order: 4,
            name: 'snapshotPrice',
            description: 'Capture current product price',
            action: 'set unitPrice from product.price'
          }
        ]
    })
  }
  
  return workflows
}

/**
 * Detect calculation patterns
 */
function detectCalculations(model: ParsedModel, schema: ParsedSchema): CalculationDetection[] {
  const calculations: CalculationDetection[] = []
  
  // ORDER TOTAL CALCULATION
  if (model.name === 'Order') {
    if (hasField(model, 'total') && hasField(model, 'subtotal')) {
      calculations.push({
        field: 'total',
        formula: 'subtotal + tax + shipping - discount',
        dependencies: ['subtotal', 'tax', 'shipping', 'discount'],
        autoCalculate: true
      })
    }
    
    if (hasField(model, 'subtotal')) {
      calculations.push({
        field: 'subtotal',
        formula: 'sum(orderItems.quantity * orderItems.unitPrice)',
        dependencies: ['items'],
        autoCalculate: true
      })
    }
  }
  
  // CART TOTAL
  if (model.name === 'Cart') {
    calculations.push({
      field: 'total',
      formula: 'sum(cartItems.quantity * cartItems.unitPrice)',
      dependencies: ['items'],
      autoCalculate: true
    })
  }
  
  return calculations
}

/**
 * Detect state machine patterns (Order status, Payment status, etc.)
 */
function detectStateMachines(model: ParsedModel, schema: ParsedSchema): StateMachineDetection[] {
  const machines: StateMachineDetection[] = []
  
  // Find enum status fields
  const statusField = model.fields.find(f => 
    f.kind === 'enum' && (f.name === 'status' || f.name.toLowerCase().endsWith('status'))
  )
  
  if (!statusField) return machines
  
  // ORDER STATUS MACHINE
  if (model.name === 'Order' && statusField.type === 'OrderStatus') {
    const timestampMap: Record<string, string> = {}
    
    // Map statuses to timestamp fields
    if (hasField(model, 'confirmedAt')) timestampMap['CONFIRMED'] = 'confirmedAt'
    if (hasField(model, 'packedAt')) timestampMap['PACKED'] = 'packedAt'
    if (hasField(model, 'shippedAt')) timestampMap['SHIPPED'] = 'shippedAt'
    if (hasField(model, 'deliveredAt')) timestampMap['DELIVERED'] = 'deliveredAt'
    if (hasField(model, 'cancelledAt')) timestampMap['CANCELLED'] = 'cancelledAt'
    
    machines.push({
      field: 'status',
      enumName: 'OrderStatus',
      states: ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
      timestampFields: timestampMap,
      transitions: [
        {
          from: 'PENDING',
          to: 'CONFIRMED',
          methodName: 'confirmOrder',
          validation: ['payment.status === COMPLETED', 'allItemsInStock'],
          sideEffects: ['reserveStock', 'sendConfirmationEmail']
        },
        {
          from: 'CONFIRMED',
          to: 'PROCESSING',
          methodName: 'startProcessing',
          validation: ['status === CONFIRMED'],
          sideEffects: ['notifyWarehouse']
        },
        {
          from: 'PROCESSING',
          to: 'PACKED',
          methodName: 'markPacked',
          validation: ['status === PROCESSING'],
          sideEffects: ['generateShippingLabel']
        },
        {
          from: 'PACKED',
          to: 'SHIPPED',
          methodName: 'shipOrder',
          validation: ['status === PACKED', 'hasShipment'],
          sideEffects: ['sendShippingEmail', 'updateTracking']
        },
        {
          from: 'SHIPPED',
          to: 'DELIVERED',
          methodName: 'markDelivered',
          validation: ['status === SHIPPED'],
          sideEffects: ['sendDeliveryConfirmation', 'releaseReservation']
        },
        {
          from: '*',
          to: 'CANCELLED',
          methodName: 'cancelOrder',
          validation: ['status !== DELIVERED', 'status !== REFUNDED'],
          sideEffects: ['restoreStock', 'releaseReservation', 'refundPayment']
        }
      ]
    })
  }
  
  // PAYMENT STATUS MACHINE
  if (model.name === 'Payment' && statusField.type === 'PaymentStatus') {
    machines.push({
      field: 'status',
      enumName: 'PaymentStatus',
      states: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      timestampFields: {},
      transitions: [
        {
          from: 'PENDING',
          to: 'PROCESSING',
          methodName: 'startPayment',
          validation: ['amount > 0'],
          sideEffects: ['callPaymentProvider']
        },
        {
          from: 'PROCESSING',
          to: 'COMPLETED',
          methodName: 'completePayment',
          validation: ['providerConfirmed'],
          sideEffects: ['confirmOrder']
        },
        {
          from: 'PROCESSING',
          to: 'FAILED',
          methodName: 'failPayment',
          validation: [],
          sideEffects: ['notifyCustomer', 'cancelOrder']
        }
      ]
    })
  }
  
  return machines
}

/**
 * Helper to check if model has a field
 */
function hasField(model: ParsedModel, fieldName: string): boolean {
  return model.fields.some(f => f.name === fieldName)
}

/**
 * Detect inventory management patterns
 */
export function detectInventoryPatterns(model: ParsedModel, schema: ParsedSchema): {
  hasStock: boolean
  hasReservedStock: boolean
  hasLowStockThreshold: boolean
  hasStockHistory: boolean
  needsStockManagement: boolean
} {
  const hasStock = hasField(model, 'stock')
  const hasReservedStock = hasField(model, 'reservedStock')
  const hasLowStockThreshold = hasField(model, 'lowStockThreshold')
  
  // Check if there's a related StockHistory model
  const hasStockHistory = schema.models.some(m => m.name === 'StockHistory')
  
  return {
    hasStock,
    hasReservedStock,
    hasLowStockThreshold,
    hasStockHistory,
    needsStockManagement: hasStock && hasReservedStock
  }
}

/**
 * Detect coupon/discount patterns
 */
export function detectCouponPatterns(model: ParsedModel, schema: ParsedSchema): {
  hasCoupon: boolean
  hasDiscount: boolean
  needsCouponValidation: boolean
} {
  const hasCoupon = model.relationFields.some(f => f.name === 'coupon' || f.type === 'Coupon')
  const hasDiscount = hasField(model, 'discount')
  
  return {
    hasCoupon,
    hasDiscount,
    needsCouponValidation: hasCoupon && hasDiscount
  }
}

/**
 * Detect pricing calculation patterns
 */
export function detectPricingPatterns(model: ParsedModel): {
  fields: string[]
  hasTax: boolean
  hasShipping: boolean
  hasDiscount: boolean
  hasSubtotal: boolean
  hasTotal: boolean
  needsCalculation: boolean
} {
  const fields: string[] = []
  const hasTax = hasField(model, 'tax')
  const hasShipping = hasField(model, 'shipping')
  const hasDiscount = hasField(model, 'discount')
  const hasSubtotal = hasField(model, 'subtotal')
  const hasTotal = hasField(model, 'total')
  
  if (hasTax) fields.push('tax')
  if (hasShipping) fields.push('shipping')
  if (hasDiscount) fields.push('discount')
  if (hasSubtotal) fields.push('subtotal')
  if (hasTotal) fields.push('total')
  
  return {
    fields,
    hasTax,
    hasShipping,
    hasDiscount,
    hasSubtotal,
    hasTotal,
    needsCalculation: hasTotal && (hasSubtotal || hasTax || hasShipping || hasDiscount)
  }
}

/**
 * Detect transaction requirement patterns
 */
export function detectTransactionPatterns(model: ParsedModel, schema: ParsedSchema): {
  needsTransaction: boolean
  reason: string[]
} {
  const reasons: string[] = []
  
  // Multiple related writes
  const hasItemsRelation = model.relationFields.some(r => 
    r.name.toLowerCase().includes('item') && r.isList
  )
  if (hasItemsRelation) {
    reasons.push('Creates parent + multiple child records')
  }
  
  // Stock management
  const inventoryPatterns = detectInventoryPatterns(model, schema)
  if (inventoryPatterns.needsStockManagement) {
    reasons.push('Modifies inventory levels')
  }
  
  // Financial operations
  if (hasField(model, 'total') || hasField(model, 'amount')) {
    reasons.push('Financial transaction')
  }
  
  return {
    needsTransaction: reasons.length > 0,
    reason: reasons
  }
}

/**
 * Detect sensitive data patterns (should never be in responses)
 */
export function detectSensitiveFields(model: ParsedModel): {
  fields: string[]
  shouldFilter: boolean
} {
  const sensitivePatterns = [
    'password',
    'passwordhash',
    'secret',
    'token',
    'apikey',
    'privatekey'
  ]
  
  const fields = model.fields
    .filter(f => sensitivePatterns.some(pattern => 
      f.name.toLowerCase().includes(pattern)
    ))
    .map(f => f.name)
  
  return {
    fields,
    shouldFilter: fields.length > 0
  }
}

