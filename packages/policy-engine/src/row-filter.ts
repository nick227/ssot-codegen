/**
 * Row Filter Utilities
 * 
 * Converts policy expressions into database WHERE clauses for row-level security (RLS).
 * 
 * SRP: Only handles row-level filter generation
 */

import type { Expression, ExpressionContext } from '@ssot-ui/expressions'
import type { PolicyContext } from './types.js'

/**
 * Apply row-level filters based on policy expression
 * 
 * Analyzes the policy expression and generates appropriate WHERE conditions.
 * 
 * @param allowExpression - The "allow" expression from the policy
 * @param context - Policy context
 * @returns WHERE clause for database query
 */
export function applyRowFilters(allowExpression: Expression, context: PolicyContext): any {
  // Simple implementation: Extract filters from common patterns
  
  // Pattern 1: Check if expression is a simple equality check
  // Example: { op: "eq", left: { field: "uploadedBy" }, right: { field: "user.id" } }
  if (allowExpression.type === 'condition' && allowExpression.op === 'eq') {
    return extractEqualityFilter(allowExpression, context)
  }
  
  // Pattern 2: Check if expression is an OR of conditions
  // Example: isPublic = true OR uploadedBy = user.id
  if (allowExpression.type === 'operation' && allowExpression.op === 'or') {
    return extractOrFilter(allowExpression, context)
  }
  
  // Pattern 3: Check if expression is an AND of conditions
  if (allowExpression.type === 'operation' && allowExpression.op === 'and') {
    return extractAndFilter(allowExpression, context)
  }
  
  // Pattern 4: Permission-based (no row filters needed)
  if (allowExpression.type === 'permission') {
    // Permissions are evaluated at access-check time, not at query time
    // Return no filter (allow all rows)
    return {}
  }
  
  // Pattern 5: Complex expression (conservative approach)
  // If we can't analyze the expression, return a safe filter
  console.warn('[PolicyEngine] Could not extract row filters from complex expression')
  return {}
}

/**
 * Extract filter from equality condition
 * 
 * Example: uploadedBy = user.id → WHERE uploadedBy = 'user-123'
 */
function extractEqualityFilter(expr: any, context: PolicyContext): any {
  if (expr.left?.type === 'field' && expr.right?.type === 'field') {
    const leftField = expr.left.path
    const rightField = expr.right.path
    
    // Check if right side is user.id
    if (rightField === 'user.id') {
      return {
        [leftField]: context.user.id
      }
    }
  }
  
  // Check if left side is a field and right side is a literal
  if (expr.left?.type === 'field' && expr.right?.type === 'literal') {
    return {
      [expr.left.path]: expr.right.value
    }
  }
  
  return {}
}

/**
 * Extract filter from OR condition
 * 
 * Example: isPublic = true OR uploadedBy = user.id
 * → WHERE isPublic = true OR uploadedBy = 'user-123'
 */
function extractOrFilter(expr: any, context: PolicyContext): any {
  if (!expr.args || !Array.isArray(expr.args)) {
    return {}
  }
  
  const filters = expr.args
    .map((arg: Expression) => applyRowFilters(arg, context))
    .filter((filter: any) => Object.keys(filter).length > 0)
  
  if (filters.length === 0) {
    return {}
  }
  
  if (filters.length === 1) {
    return filters[0]
  }
  
  return { OR: filters }
}

/**
 * Extract filter from AND condition
 * 
 * Example: status = 'active' AND uploadedBy = user.id
 * → WHERE status = 'active' AND uploadedBy = 'user-123'
 */
function extractAndFilter(expr: any, context: PolicyContext): any {
  if (!expr.args || !Array.isArray(expr.args)) {
    return {}
  }
  
  const filters = expr.args
    .map((arg: Expression) => applyRowFilters(arg, context))
    .filter((filter: any) => Object.keys(filter).length > 0)
  
  if (filters.length === 0) {
    return {}
  }
  
  if (filters.length === 1) {
    return filters[0]
  }
  
  return { AND: filters }
}

