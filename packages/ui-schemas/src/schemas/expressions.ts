/**
 * Expression Schemas - Zod schemas for expression validation
 * 
 * Validates JSON expressions used for:
 * - Computed fields
 * - Conditional visibility
 * - Conditional enabled state
 * - Field permissions
 */

import { z } from 'zod'

// ============================================================================
// Base Expression Types
// ============================================================================

/**
 * Literal expression
 * @example { "type": "literal", "value": 42 }
 */
export const LiteralExpressionSchema = z.object({
  type: z.literal('literal'),
  value: z.unknown()
})

/**
 * Field access expression
 * Supports deep paths: "user.profile.name"
 * @example { "type": "field", "path": "user.name" }
 */
export const FieldAccessExpressionSchema = z.object({
  type: z.literal('field'),
  path: z.string().min(1)
})

/**
 * Base for all expression types
 * Used for recursive definition
 */
export type Expression = z.infer<typeof LiteralExpressionSchema> |
  z.infer<typeof FieldAccessExpressionSchema> |
  z.infer<typeof OperationExpressionSchema> |
  z.infer<typeof ConditionExpressionSchema> |
  z.infer<typeof PermissionExpressionSchema>

/**
 * Lazy expression schema for recursive definitions
 */
export const ExpressionSchema: z.ZodType<Expression> = z.lazy(() =>
  z.discriminatedUnion('type', [
    LiteralExpressionSchema,
    FieldAccessExpressionSchema,
    OperationExpressionSchema,
    ConditionExpressionSchema,
    PermissionExpressionSchema
  ])
)

// ============================================================================
// Operation Expression
// ============================================================================

/**
 * Operation expression
 * Calls a function with arguments
 * @example { "type": "operation", "op": "add", "args": [...] }
 */
export const OperationExpressionSchema = z.object({
  type: z.literal('operation'),
  op: z.string().min(1),
  args: z.array(z.lazy(() => ExpressionSchema))
})

// ============================================================================
// Condition Expression
// ============================================================================

/**
 * Condition expression
 * Compares two expressions
 * @example { "type": "condition", "op": "eq", "left": ..., "right": ... }
 */
export const ConditionExpressionSchema = z.object({
  type: z.literal('condition'),
  op: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'exists']),
  left: z.lazy(() => ExpressionSchema),
  right: z.lazy(() => ExpressionSchema)
})

// ============================================================================
// Permission Expression
// ============================================================================

/**
 * Permission check expression
 * @example { "type": "permission", "check": "hasRole", "args": ["admin"] }
 */
export const PermissionExpressionSchema = z.object({
  type: z.literal('permission'),
  check: z.enum(['hasRole', 'hasPermission', 'isOwner']),
  args: z.array(z.string())
})

// ============================================================================
// Field-Level Expressions (for template.json)
// ============================================================================

/**
 * Computed field expression
 * Calculates field value from other fields
 */
export const ComputedFieldSchema = ExpressionSchema

/**
 * Conditional visibility expression
 * Shows/hides field based on condition
 */
export const VisibilityConditionSchema = ExpressionSchema

/**
 * Conditional enabled expression
 * Enables/disables field based on condition
 */
export const EnabledConditionSchema = ExpressionSchema

/**
 * Read permission expression
 * Determines if user can read field
 */
export const ReadPermissionSchema = ExpressionSchema

/**
 * Write permission expression
 * Determines if user can write field
 */
export const WritePermissionSchema = ExpressionSchema

// ============================================================================
// Type Exports
// ============================================================================

export type LiteralExpression = z.infer<typeof LiteralExpressionSchema>
export type FieldAccessExpression = z.infer<typeof FieldAccessExpressionSchema>
export type OperationExpression = z.infer<typeof OperationExpressionSchema>
export type ConditionExpression = z.infer<typeof ConditionExpressionSchema>
export type PermissionExpression = z.infer<typeof PermissionExpressionSchema>
export type ComputedField = z.infer<typeof ComputedFieldSchema>
export type VisibilityCondition = z.infer<typeof VisibilityConditionSchema>
export type EnabledCondition = z.infer<typeof EnabledConditionSchema>
export type ReadPermission = z.infer<typeof ReadPermissionSchema>
export type WritePermission = z.infer<typeof WritePermissionSchema>


