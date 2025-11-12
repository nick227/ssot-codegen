/**
 * ExpressionContext
 * 
 * DRY: Single context provider for ALL expression evaluation
 * SRP: Only manages expression evaluation context
 * 
 * Fixes:
 * - Context stability (memoization now works)
 * - Prop drilling (no more passing context everywhere)
 * - Performance (context created once, not per render)
 * 
 * Usage:
 * ```tsx
 * <ExpressionContextProvider data={item} user={session.user}>
 *   <DetailPage>
 *     <Field />  // No context props needed!
 *   </DetailPage>
 * </ExpressionContextProvider>
 * ```
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { ExpressionContext } from '@ssot-ui/expressions'

const ExpressionContextInternal = createContext<ExpressionContext | null>(null)

export interface ExpressionContextProviderProps {
  /** Current item/form data */
  data: Record<string, any>
  /** Current user (from session/auth) */
  user?: { id: string; roles: string[]; permissions?: string[] } | null
  /** Route parameters */
  params?: Record<string, string>
  /** Global application state */
  globals?: Record<string, any>
  /** Child components */
  children: ReactNode
}

/**
 * Provides expression evaluation context to all child components
 * 
 * DRY: Create context once at page level, use everywhere
 * Performance: Memoized to prevent unnecessary re-renders
 * 
 * @param props - Provider props
 * @returns Provider component
 */
export function ExpressionContextProvider({
  data,
  user,
  params = {},
  globals = {},
  children
}: ExpressionContextProviderProps) {
  // Memoize context value to ensure stable reference
  // Only recreates if actual values change
  const value = useMemo<ExpressionContext>(
    () => ({
      data,
      user: user || { id: '', roles: [], permissions: [] },
      params,
      globals
    }),
    [data, user, params, globals]
  )
  
  return (
    <ExpressionContextInternal.Provider value={value}>
      {children}
    </ExpressionContextInternal.Provider>
  )
}

/**
 * Hook to access expression evaluation context
 * 
 * DRY: All hooks use this to get context
 * Type-safe: Throws if used outside provider
 * 
 * @returns Current expression context
 * @throws Error if used outside ExpressionContextProvider
 */
export function useExpressionContext(): ExpressionContext {
  const context = useContext(ExpressionContextInternal)
  
  if (!context) {
    throw new Error(
      'useExpressionContext must be used within ExpressionContextProvider. ' +
      'Wrap your component tree with <ExpressionContextProvider>.'
    )
  }
  
  return context
}

/**
 * Hook to check if inside expression context provider
 * 
 * Useful for optional expression evaluation
 * 
 * @returns true if inside provider, false otherwise
 */
export function useHasExpressionContext(): boolean {
  const context = useContext(ExpressionContextInternal)
  return context !== null
}

