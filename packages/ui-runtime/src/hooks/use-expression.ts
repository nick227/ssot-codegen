/**
 * useExpression Hook
 * 
 * DRY: Single hook for ALL expression evaluation in React components
 * SRP: Only evaluates expressions, doesn't render
 * 
 * Usage:
 * ```tsx
 * const value = useExpression(field.computed, context)
 * const isVisible = useConditionalVisibility(field.visibleWhen, context)
 * ```
 */

import { useMemo } from 'react'
import { evaluate, type Expression, type ExpressionContext } from '@ssot-ui/expressions'

/**
 * Evaluate an expression with memoization
 * 
 * DRY: All components use this single hook
 * Performance: Memoized to prevent re-evaluation
 * 
 * @param expr - Expression to evaluate (undefined = return undefined)
 * @param context - Evaluation context (data, user, params, globals)
 * @returns Evaluated value or undefined
 */
export function useExpression(
  expr: Expression | undefined,
  context: ExpressionContext
): any {
  return useMemo(() => {
    if (!expr) return undefined
    
    try {
      return evaluate(expr, context)
    } catch (error) {
      // Log error but don't throw (graceful degradation)
      console.error('[useExpression] Evaluation failed:', error)
      console.error('[useExpression] Expression:', expr)
      console.error('[useExpression] Context:', context)
      return undefined
    }
  }, [expr, context])
}

/**
 * Evaluate conditional visibility
 * 
 * DRY: All components use this for visibility logic
 * Default: true if no condition provided
 * 
 * @param visibleWhen - Visibility condition
 * @param context - Evaluation context
 * @returns boolean - Whether element should be visible
 */
export function useConditionalVisibility(
  visibleWhen: Expression | undefined,
  context: ExpressionContext
): boolean {
  const result = useExpression(visibleWhen, context)
  
  // Default to visible if no condition provided
  if (result === undefined) return true
  
  // Cast to boolean
  return Boolean(result)
}

/**
 * Evaluate conditional enabled state
 * 
 * DRY: All components use this for enabled logic
 * Default: true if no condition provided
 * 
 * @param enabledWhen - Enabled condition
 * @param context - Evaluation context
 * @returns boolean - Whether element should be enabled
 */
export function useConditionalEnabled(
  enabledWhen: Expression | undefined,
  context: ExpressionContext
): boolean {
  const result = useExpression(enabledWhen, context)
  
  // Default to enabled if no condition provided
  if (result === undefined) return true
  
  // Cast to boolean
  return Boolean(result)
}

/**
 * Build expression context from current state
 * 
 * DRY: Standardizes context creation across components
 * 
 * @param data - Current item/form data
 * @param user - Current user (from session/auth)
 * @param params - Route parameters
 * @param globals - Global application state
 * @returns ExpressionContext
 */
export function buildExpressionContext(
  data: Record<string, any>,
  user?: { id: string; roles: string[]; permissions?: string[] } | null,
  params?: Record<string, string>,
  globals?: Record<string, any>
): ExpressionContext {
  return {
    data,
    user: user || { id: '', roles: [], permissions: [] },
    params: params || {},
    globals: globals || {}
  }
}

