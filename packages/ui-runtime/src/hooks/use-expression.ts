/**
 * useExpression Hook
 * 
 * DRY: Single hook for ALL expression evaluation in React components
 * SRP: Only evaluates expressions, doesn't render
 * 
 * IMPROVEMENTS:
 * - Type-safe with generics
 * - Uses React Context (no prop drilling)
 * - Better error handling (fallback, onError, throwOnError)
 * - Memoization that actually works (stable context)
 * 
 * Usage:
 * ```tsx
 * // At page level:
 * <ExpressionContextProvider data={item} user={session.user}>
 *   <DetailPage>
 *     <Field />  // No context props needed!
 *   </DetailPage>
 * </ExpressionContextProvider>
 * 
 * // In components:
 * const value = useExpression<number>(field.computed)
 * const isVisible = useConditionalVisibility(field.visibleWhen)
 * ```
 */

import { useMemo } from 'react'
import { evaluate, type Expression } from '@ssot-ui/expressions'
import { useExpressionContext } from '../context/expression-context.js'

/**
 * Options for expression evaluation error handling
 */
export interface UseExpressionOptions<T> {
  /** Value to return if evaluation fails or expression is undefined */
  fallback?: T
  /** Callback for evaluation errors */
  onError?: (error: Error) => void
  /** If true, throw errors instead of returning fallback */
  throwOnError?: boolean
}

/**
 * Evaluate an expression with memoization and type safety
 * 
 * DRY: All components use this single hook
 * Performance: Memoized with stable context reference
 * Type-safe: Generic return type
 * Error handling: fallback, onError, throwOnError options
 * 
 * @template T - Expected return type
 * @param expr - Expression to evaluate (undefined = return fallback)
 * @param options - Error handling options
 * @returns Evaluated value (type T) or fallback
 * 
 * @example
 * ```tsx
 * // Basic usage (inferred type)
 * const value = useExpression(field.computed)
 * 
 * // With type safety
 * const total = useExpression<number>(field.computed)
 * 
 * // With fallback
 * const discount = useExpression<number>(field.computed, { fallback: 0 })
 * 
 * // With error handling
 * const price = useExpression<number>(field.computed, {
 *   fallback: 0,
 *   onError: (err) => toast.error(`Price calculation failed: ${err.message}`)
 * })
 * 
 * // Throw errors in development
 * const value = useExpression(field.computed, {
 *   throwOnError: process.env.NODE_ENV === 'development'
 * })
 * ```
 */
export function useExpression<T = unknown>(
  expr: Expression | undefined,
  options?: UseExpressionOptions<T>
): T | undefined {
  const context = useExpressionContext()
  
  return useMemo(() => {
    // Return fallback if no expression provided
    if (!expr) return options?.fallback
    
    try {
      // Evaluate expression with context from provider
      return evaluate(expr, context) as T
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      
      // Throw if requested (useful in development)
      if (options?.throwOnError) {
        throw err
      }
      
      // Call error handler if provided
      if (options?.onError) {
        options.onError(err)
      }
      
      // Log error to console (development aid)
      if (process.env.NODE_ENV !== 'production') {
        console.error('[useExpression] Evaluation failed:', err)
        console.error('[useExpression] Expression:', expr)
        console.error('[useExpression] Context:', context)
      }
      
      // Return fallback value
      return options?.fallback
    }
  }, [expr, context, options])
}

/**
 * Evaluate conditional visibility
 * 
 * DRY: All components use this for visibility logic
 * Default: true if no condition provided
 * 
 * @param visibleWhen - Visibility condition
 * @returns boolean - Whether element should be visible
 * 
 * @example
 * ```tsx
 * const isVisible = useConditionalVisibility(field.visibleWhen)
 * if (!isVisible) return null
 * 
 * // Or inline:
 * return useConditionalVisibility(field.visibleWhen) ? <Field /> : null
 * ```
 */
export function useConditionalVisibility(
  visibleWhen: Expression | undefined
): boolean {
  const result = useExpression<boolean>(visibleWhen, { fallback: true })
  
  // Default to visible if no condition provided or evaluation failed
  if (result === undefined) return true
  
  // Cast to boolean (handles truthy/falsy values)
  return Boolean(result)
}

/**
 * Evaluate conditional enabled state
 * 
 * DRY: All components use this for enabled logic
 * Default: true if no condition provided
 * 
 * @param enabledWhen - Enabled condition
 * @returns boolean - Whether element should be enabled
 * 
 * @example
 * ```tsx
 * const isEnabled = useConditionalEnabled(field.enabledWhen)
 * 
 * return (
 *   <input
 *     disabled={!isEnabled}
 *     // ... other props
 *   />
 * )
 * ```
 */
export function useConditionalEnabled(
  enabledWhen: Expression | undefined
): boolean {
  const result = useExpression<boolean>(enabledWhen, { fallback: true })
  
  // Default to enabled if no condition provided or evaluation failed
  if (result === undefined) return true
  
  // Cast to boolean (handles truthy/falsy values)
  return Boolean(result)
}


