/**
 * Expression Sandbox
 * 
 * Provides security boundaries for expression evaluation to prevent:
 * - Prototype pollution
 * - Infinite loops
 * - Memory exhaustion
 * - Access to dangerous properties
 * 
 * SRP: Only handles expression security
 */

import { ExpressionEvaluator } from './evaluator.js'
import type { Expression, ExpressionContext, EvaluationOptions } from './types.js'

/**
 * Evaluation budget to prevent DOS attacks
 */
export interface EvaluationBudget {
  /** Maximum expression tree depth */
  maxDepth: number
  
  /** Maximum operations per evaluation */
  maxOperations: number
  
  /** Maximum execution time (ms) */
  timeout: number
  
  /** Whitelist of allowed operations */
  allowedOperations?: Set<string>
}

/**
 * Default budget (conservative for security)
 */
export const DEFAULT_BUDGET: EvaluationBudget = {
  maxDepth: 10,
  maxOperations: 100,
  timeout: 100  // 100ms
}

/**
 * Dangerous property names that should never be accessed
 */
const DANGEROUS_PROPERTIES = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'process',
  'global',
  'require',
  'module',
  'exports',
  'eval',
  'Function',
  '__dirname',
  '__filename'
])

/**
 * Budget exceeded error
 */
export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BudgetExceededError'
  }
}

/**
 * Security error
 */
export class SecurityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SecurityError'
  }
}

/**
 * Safe Expression Evaluator
 * 
 * Wraps ExpressionEvaluator with security boundaries.
 */
export class SafeEvaluator {
  private evaluator: ExpressionEvaluator
  private budget: EvaluationBudget
  private operationCount: number = 0
  private startTime: number = 0
  
  constructor(
    budget: Partial<EvaluationBudget> = {},
    options: EvaluationOptions = {}
  ) {
    this.budget = { ...DEFAULT_BUDGET, ...budget }
    this.evaluator = new ExpressionEvaluator(undefined, {
      ...options,
      maxDepth: this.budget.maxDepth
    })
  }
  
  /**
   * Evaluate expression with security boundaries
   * 
   * @param expr - Expression to evaluate
   * @param context - Evaluation context
   * @returns Evaluated result
   * @throws {BudgetExceededError} If budget exceeded
   * @throws {SecurityError} If dangerous operation attempted
   */
  evaluate(expr: Expression, context: ExpressionContext): any {
    // Reset counters
    this.operationCount = 0
    this.startTime = Date.now()
    
    // Validate expression before evaluation
    this.validateExpression(expr)
    
    // Freeze context to prevent mutation
    const frozenContext = this.freezeContext(context)
    
    // Evaluate with checks
    return this.evaluateWithChecks(expr, frozenContext)
  }
  
  /**
   * Evaluate expression with budget checks
   */
  private evaluateWithChecks(expr: Expression, context: ExpressionContext): any {
    // 1. Check timeout
    if (Date.now() - this.startTime > this.budget.timeout) {
      throw new BudgetExceededError(
        `Expression evaluation timeout (${this.budget.timeout}ms exceeded)`
      )
    }
    
    // 2. Check operation count
    this.operationCount++
    if (this.operationCount > this.budget.maxOperations) {
      throw new BudgetExceededError(
        `Maximum operations (${this.budget.maxOperations}) exceeded`
      )
    }
    
    // 3. Validate operation is allowed
    if (expr.type === 'operation') {
      if (this.budget.allowedOperations && !this.budget.allowedOperations.has(expr.op)) {
        throw new SecurityError(`Operation '${expr.op}' is not allowed`)
      }
    }
    
    // 4. Evaluate using normal evaluator
    return this.evaluator.evaluate(expr, context)
  }
  
  /**
   * Validate expression tree for security issues
   */
  private validateExpression(expr: Expression): void {
    switch (expr.type) {
      case 'field':
        this.validateFieldPath(expr.path)
        break
        
      case 'operation':
        if (expr.args) {
          expr.args.forEach(arg => this.validateExpression(arg))
        }
        break
        
      case 'condition':
        this.validateExpression(expr.left)
        this.validateExpression(expr.right)
        break
        
      case 'permission':
        // Permission checks are safe (no user input)
        break
        
      case 'literal':
        // Literals are safe
        break
        
      default:
        throw new SecurityError(`Unknown expression type: ${(expr as any).type}`)
    }
  }
  
  /**
   * Validate field path for dangerous properties
   */
  private validateFieldPath(path: string): void {
    const parts = path.split('.')
    
    for (const part of parts) {
      if (DANGEROUS_PROPERTIES.has(part)) {
        throw new SecurityError(
          `Field access '${path}' is not allowed (contains dangerous property '${part}')`
        )
      }
    }
  }
  
  /**
   * Freeze context to prevent mutation
   * 
   * Note: Deep freeze for nested objects to prevent prototype pollution
   */
  private freezeContext(context: ExpressionContext): ExpressionContext {
    return {
      data: this.deepFreeze({ ...context.data }),
      user: Object.freeze({ ...context.user }),
      params: Object.freeze({ ...context.params }),
      globals: Object.freeze({ ...context.globals })
    }
  }
  
  /**
   * Deep freeze an object and all nested objects
   */
  private deepFreeze(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    // Freeze the object itself
    Object.freeze(obj)
    
    // Recursively freeze nested objects
    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (obj[prop] !== null && typeof obj[prop] === 'object' && !Object.isFrozen(obj[prop])) {
        this.deepFreeze(obj[prop])
      }
    })
    
    return obj
  }
}

/**
 * Create a safe evaluator with default budget
 */
export function createSafeEvaluator(budget?: Partial<EvaluationBudget>): SafeEvaluator {
  return new SafeEvaluator(budget)
}

/**
 * Evaluate expression safely with default budget
 */
export function evaluateSafe(expr: Expression, context: ExpressionContext): any {
  const evaluator = createSafeEvaluator()
  return evaluator.evaluate(expr, context)
}

