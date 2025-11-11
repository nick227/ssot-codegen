/**
 * Expression Evaluator
 * 
 * SRP: Only evaluates expressions, doesn't render or store
 * DRY: Single evaluator used by all components
 */

import type {
  Expression,
  ExpressionContext,
  FieldAccessExpression,
  OperationExpression,
  ConditionExpression,
  PermissionExpression,
  EvaluationOptions,
  OperationRegistry
} from './types.js'
import { OPERATIONS } from './operations/index.js'

/**
 * Expression Evaluator Class
 * 
 * DRY: Single implementation for ALL expression evaluation
 * SRP: Only evaluates, doesn't validate or render
 */
export class ExpressionEvaluator {
  private operations: OperationRegistry
  private maxDepth: number
  private currentDepth: number = 0

  constructor(
    operations: OperationRegistry = OPERATIONS,
    options: EvaluationOptions = {}
  ) {
    this.operations = { ...operations, ...options.customOperations }
    this.maxDepth = options.maxDepth || 50
  }

  /**
   * Evaluate any expression type
   * DRY: Single entry point for all evaluations
   */
  evaluate(expr: Expression, context: ExpressionContext): any {
    // Prevent infinite recursion
    this.currentDepth++
    if (this.currentDepth > this.maxDepth) {
      this.currentDepth = 0
      throw new Error(`Maximum recursion depth (${this.maxDepth}) exceeded`)
    }

    try {
      let result: any

      switch (expr.type) {
        case 'literal':
          result = expr.value
          break

        case 'field':
          result = this.evaluateFieldAccess(expr, context)
          break

        case 'operation':
          result = this.evaluateOperation(expr, context)
          break

        case 'condition':
          result = this.evaluateCondition(expr, context)
          break

        case 'permission':
          result = this.evaluatePermission(expr, context)
          break

        default:
          throw new Error(`Unknown expression type: ${(expr as any).type}`)
      }

      this.currentDepth--
      return result
    } catch (error) {
      this.currentDepth = 0
      throw error
    }
  }

  /**
   * Evaluate field access
   * DRY: Single implementation for all field access
   * Supports deep paths: 'user.profile.name'
   */
  private evaluateFieldAccess(
    expr: FieldAccessExpression,
    context: ExpressionContext
  ): any {
    const parts = expr.path.split('.')
    let value: any = context.data

    for (const part of parts) {
      if (value == null) {
        return null
      }

      // Handle array wildcards: 'items.*.price'
      if (part === '*') {
        if (!Array.isArray(value)) {
          throw new Error(`Cannot use wildcard '*' on non-array value`)
        }
        // Return array as-is for operations to handle
        return value
      }

      value = value[part]
    }

    return value
  }

  /**
   * Evaluate operation
   * DRY: Reuses operation registry
   */
  private evaluateOperation(
    expr: OperationExpression,
    context: ExpressionContext
  ): any {
    const operation = this.operations[expr.op]
    if (!operation) {
      throw new Error(`Unknown operation: ${expr.op}`)
    }

    // Evaluate all arguments first
    const args = expr.args.map(arg => this.evaluate(arg, context))

    // Permission operations need context
    if (expr.op.startsWith('has') || expr.op === 'isOwner' || expr.op === 'isAuthenticated' || expr.op === 'isAnonymous') {
      return operation(...args, context)
    }

    // Execute operation
    return operation(...args)
  }

  /**
   * Evaluate condition
   * DRY: Reuses comparison operations
   */
  private evaluateCondition(
    expr: ConditionExpression,
    context: ExpressionContext
  ): boolean {
    const left = this.evaluate(expr.left, context)
    const right = this.evaluate(expr.right, context)

    // Use comparison operations
    const comparator = this.operations[expr.op]
    if (!comparator) {
      throw new Error(`Unknown condition operator: ${expr.op}`)
    }

    return comparator(left, right)
  }

  /**
   * Evaluate permission check
   * DRY: Reuses permission operations
   */
  private evaluatePermission(
    expr: PermissionExpression,
    context: ExpressionContext
  ): boolean {
    const checker = this.operations[expr.check]
    if (!checker) {
      throw new Error(`Unknown permission check: ${expr.check}`)
    }

    return checker(...expr.args, context)
  }
}

/**
 * Singleton evaluator instance
 * DRY: Reuse same instance everywhere
 */
export const evaluator = new ExpressionEvaluator()

/**
 * Convenience function for one-off evaluations
 * DRY: Most components use this
 */
export function evaluate(expr: Expression, context: ExpressionContext): any {
  return evaluator.evaluate(expr, context)
}

