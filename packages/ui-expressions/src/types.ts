/**
 * Expression Types - Core type definitions for the expression system
 * 
 * SRP: Only defines types, no logic
 * DRY: Single source of truth for all expression types
 */

/**
 * Context passed to all expression evaluations
 * Contains data, user, route params, and global state
 */
export interface ExpressionContext {
  /** Current item/form data being evaluated */
  data: Record<string, any>
  
  /** Current authenticated user */
  user: {
    id: string
    roles: string[]
    permissions?: string[]
  }
  
  /** Route/URL parameters */
  params: Record<string, string>
  
  /** Global application state */
  globals: Record<string, any>
}

/**
 * Base expression type - all expressions extend from this
 */
export interface BaseExpression {
  type: string
}

/**
 * Literal value expression
 * Example: { type: 'literal', value: 42 }
 */
export interface LiteralExpression extends BaseExpression {
  type: 'literal'
  value: unknown
}

/**
 * Field access expression
 * Example: { type: 'field', path: 'user.name' }
 * Supports deep paths: 'author.profile.bio'
 */
export interface FieldAccessExpression extends BaseExpression {
  type: 'field'
  path: string
}

/**
 * Operation expression
 * Example: { type: 'operation', op: 'add', args: [expr1, expr2] }
 */
export interface OperationExpression extends BaseExpression {
  type: 'operation'
  op: string
  args: Expression[]
}

/**
 * Condition expression
 * Example: { type: 'condition', op: 'eq', left: expr1, right: expr2 }
 */
export interface ConditionExpression extends BaseExpression {
  type: 'condition'
  op: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'exists'
  left: Expression
  right: Expression
}

/**
 * Permission check expression
 * Example: { type: 'permission', check: 'hasRole', args: ['admin'] }
 */
export interface PermissionExpression extends BaseExpression {
  type: 'permission'
  check: 'hasRole' | 'hasPermission' | 'isOwner'
  args: string[]
}

/**
 * Union of all expression types
 */
export type Expression =
  | LiteralExpression
  | FieldAccessExpression
  | OperationExpression
  | ConditionExpression
  | PermissionExpression

/**
 * Operation function signature
 * Takes evaluated arguments and context, returns result
 */
export type OperationFn = (...args: any[]) => any

/**
 * Registry of all available operations
 * DRY: Single registry used by evaluator
 */
export type OperationRegistry = Record<string, OperationFn>

/**
 * Evaluation options
 */
export interface EvaluationOptions {
  /** Throw on errors or return undefined */
  throwOnError?: boolean
  
  /** Maximum recursion depth for nested expressions */
  maxDepth?: number
  
  /** Custom operation overrides */
  customOperations?: OperationRegistry
}

/**
 * Evaluation result
 */
export interface EvaluationResult<T = any> {
  ok: boolean
  value?: T
  error?: string
}


