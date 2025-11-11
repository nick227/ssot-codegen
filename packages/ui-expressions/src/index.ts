/**
 * @ssot-ui/expressions
 * 
 * Expression evaluation engine for SSOT UI
 * 
 * DRY: Single evaluator for all expression types
 * SRP: Only handles expression evaluation
 * Model-Driven: JSON drives all behavior
 */

// Core evaluator
export { ExpressionEvaluator, evaluator, evaluate } from './evaluator.js'

// Types
export type {
  Expression,
  ExpressionContext,
  LiteralExpression,
  FieldAccessExpression,
  OperationExpression,
  ConditionExpression,
  PermissionExpression,
  OperationFn,
  OperationRegistry,
  EvaluationOptions,
  EvaluationResult
} from './types.js'

// Operations registry
export { OPERATIONS } from './operations/index.js'

// Individual operation sets (for testing/custom extensions)
export {
  mathOperations,
  stringOperations,
  dateOperations,
  logicalOperations,
  comparisonOperations,
  arrayOperations,
  permissionOperations
} from './operations/index.js'

