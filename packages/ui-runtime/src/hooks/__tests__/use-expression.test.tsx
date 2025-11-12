/**
 * useExpression Hook Tests (v2 with ExpressionContextProvider)
 * 
 * Tests the new context-based API with improved:
 * - Type safety (generics)
 * - Error handling (fallback, onError, throwOnError)
 * - Memoization (stable context)
 */

import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import { useExpression, useConditionalVisibility, useConditionalEnabled } from '../use-expression.js'
import { ExpressionContextProvider } from '../../context/expression-context.js'

/**
 * Helper to create wrapper with ExpressionContextProvider
 */
function createWrapper(
  data: Record<string, any>,
  user?: { id: string; roles: string[]; permissions?: string[] } | null,
  params?: Record<string, string>,
  globals?: Record<string, any>
) {
  return ({ children }: { children: ReactNode }) => (
    <ExpressionContextProvider
      data={data}
      user={user}
      params={params}
      globals={globals}
    >
      {children}
    </ExpressionContextProvider>
  )
}

describe('useExpression', () => {
  test('evaluates literal expression', () => {
    const { result } = renderHook(
      () => useExpression({ type: 'literal', value: 42 }),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBe(42)
  })

  test('evaluates field access', () => {
    const { result } = renderHook(
      () => useExpression({ type: 'field', path: 'name' }),
      { wrapper: createWrapper({ name: 'John' }) }
    )
    expect(result.current).toBe('John')
  })

  test('evaluates operation', () => {
    const { result } = renderHook(
      () => useExpression({
        type: 'operation',
        op: 'add',
        args: [
          { type: 'literal', value: 5 },
          { type: 'literal', value: 3 }
        ]
      }),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBe(8)
  })

  test('returns undefined for undefined expression', () => {
    const { result } = renderHook(
      () => useExpression(undefined),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBeUndefined()
  })

  test('returns fallback for undefined expression when provided', () => {
    const { result } = renderHook(
      () => useExpression<number>(undefined, { fallback: 0 }),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBe(0)
  })

  test('returns fallback on evaluation failure', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(
      () => useExpression<number>(
        { type: 'operation', op: 'unknownOp', args: [] },
        { fallback: -1 }
      ),
      { wrapper: createWrapper({}) }
    )
    
    expect(result.current).toBe(-1)
    
    consoleSpy.mockRestore()
  })

  test('calls onError callback on evaluation failure', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()
    
    renderHook(
      () => useExpression(
        { type: 'operation', op: 'unknownOp', args: [] },
        { onError }
      ),
      { wrapper: createWrapper({}) }
    )
    
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  test('throws error when throwOnError is true', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      renderHook(
        () => useExpression(
          { type: 'operation', op: 'unknownOp', args: [] },
          { throwOnError: true }
        ),
        { wrapper: createWrapper({}) }
      )
    }).toThrow()
    
    consoleSpy.mockRestore()
  })

  test('type safety with generics', () => {
    const { result } = renderHook(
      () => useExpression<number>({ type: 'literal', value: 42 }),
      { wrapper: createWrapper({}) }
    )
    
    // TypeScript should infer number | undefined
    const value: number | undefined = result.current
    expect(value).toBe(42)
  })

  test('memoizes result with stable context', () => {
    const data = { count: 1 }
    const user = { id: '1', roles: ['user'] }
    
    let evaluationCount = 0
    
    const expression = {
      type: 'field' as const,
      path: 'count'
    }
    
    const { result, rerender } = renderHook(
      () => {
        evaluationCount++
        return useExpression(expression)
      },
      { wrapper: createWrapper(data, user) }
    )
    
    expect(result.current).toBe(1)
    const firstCount = evaluationCount
    
    // Rerender (context should remain stable)
    rerender()
    
    // Should not re-evaluate (context is stable)
    expect(evaluationCount).toBe(firstCount)
  })

  test('re-evaluates when context changes', () => {
    const { result, rerender } = renderHook(
      ({ data }: { data: Record<string, any> }) => 
        useExpression({ type: 'field', path: 'count' }),
      {
        initialProps: { data: { count: 1 } },
        wrapper: ({ children, data }: { children: ReactNode; data: Record<string, any> }) => (
          <ExpressionContextProvider data={data}>
            {children}
          </ExpressionContextProvider>
        )
      }
    )
    
    expect(result.current).toBe(1)
    
    // Change data
    rerender({ data: { count: 2 } })
    
    expect(result.current).toBe(2)
  })

  test('throws error when used outside provider', () => {
    // Suppress error boundary console errors
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      renderHook(() => useExpression({ type: 'literal', value: 42 }))
    }).toThrow('useExpressionContext must be used within ExpressionContextProvider')
    
    consoleSpy.mockRestore()
  })
})

describe('useConditionalVisibility', () => {
  test('returns true for undefined condition', () => {
    const { result } = renderHook(
      () => useConditionalVisibility(undefined),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBe(true)
  })

  test('returns true for truthy expression', () => {
    const { result } = renderHook(
      () => useConditionalVisibility({
        type: 'condition',
        op: 'eq',
        left: { type: 'literal', value: 5 },
        right: { type: 'literal', value: 5 }
      }),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBe(true)
  })

  test('returns false for falsy expression', () => {
    const { result } = renderHook(
      () => useConditionalVisibility({
        type: 'condition',
        op: 'eq',
        left: { type: 'literal', value: 5 },
        right: { type: 'literal', value: 3 }
      }),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBe(false)
  })

  test('evaluates permission-based visibility', () => {
    const { result } = renderHook(
      () => useConditionalVisibility({
        type: 'permission',
        check: 'hasRole',
        args: ['admin']
      }),
      { wrapper: createWrapper({}, { id: '1', roles: ['admin'] }) }
    )
    expect(result.current).toBe(true)
  })

  test('returns true on evaluation error (fail-safe)', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(
      () => useConditionalVisibility({
        type: 'operation',
        op: 'unknownOp',
        args: []
      }),
      { wrapper: createWrapper({}) }
    )
    
    // Should default to visible on error (fail-safe)
    expect(result.current).toBe(true)
    
    consoleSpy.mockRestore()
  })
})

describe('useConditionalEnabled', () => {
  test('returns true for undefined condition', () => {
    const { result } = renderHook(
      () => useConditionalEnabled(undefined),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBe(true)
  })

  test('returns true for truthy expression', () => {
    const { result } = renderHook(
      () => useConditionalEnabled({ type: 'literal', value: true }),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBe(true)
  })

  test('returns false for falsy expression', () => {
    const { result } = renderHook(
      () => useConditionalEnabled({ type: 'literal', value: false }),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBe(false)
  })

  test('returns true on evaluation error (fail-safe)', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(
      () => useConditionalEnabled({
        type: 'operation',
        op: 'unknownOp',
        args: []
      }),
      { wrapper: createWrapper({}) }
    )
    
    // Should default to enabled on error (fail-safe)
    expect(result.current).toBe(true)
    
    consoleSpy.mockRestore()
  })
})


