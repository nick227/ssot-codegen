/**
 * useExpression Hook Tests
 */

import { describe, test, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useExpression, useConditionalVisibility, useConditionalEnabled, buildExpressionContext } from '../use-expression.js'
import type { ExpressionContext } from '@ssot-ui/expressions'

const mockContext: ExpressionContext = {
  data: {},
  user: { id: '1', roles: [] },
  params: {},
  globals: {}
}

describe('useExpression', () => {
  test('evaluates literal expression', () => {
    const { result } = renderHook(() =>
      useExpression(
        { type: 'literal', value: 42 },
        mockContext
      )
    )
    expect(result.current).toBe(42)
  })

  test('evaluates field access', () => {
    const { result } = renderHook(() =>
      useExpression(
        { type: 'field', path: 'name' },
        { ...mockContext, data: { name: 'John' } }
      )
    )
    expect(result.current).toBe('John')
  })

  test('evaluates operation', () => {
    const { result } = renderHook(() =>
      useExpression(
        {
          type: 'operation',
          op: 'add',
          args: [
            { type: 'literal', value: 5 },
            { type: 'literal', value: 3 }
          ]
        },
        mockContext
      )
    )
    expect(result.current).toBe(8)
  })

  test('returns undefined for undefined expression', () => {
    const { result } = renderHook(() =>
      useExpression(undefined, mockContext)
    )
    expect(result.current).toBeUndefined()
  })

  test('returns undefined and logs error on evaluation failure', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(() =>
      useExpression(
        {
          type: 'operation',
          op: 'unknownOp',
          args: []
        },
        mockContext
      )
    )
    
    expect(result.current).toBeUndefined()
    expect(consoleSpy).toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })

  test('memoizes result', () => {
    let evaluationCount = 0
    
    const expression = {
      type: 'operation' as const,
      op: 'add',
      args: [
        { type: 'literal' as const, value: 1 },
        { type: 'literal' as const, value: 1 }
      ]
    }
    
    const { result, rerender } = renderHook(
      ({ expr, ctx }) => {
        evaluationCount++
        return useExpression(expr, ctx)
      },
      { initialProps: { expr: expression, ctx: mockContext } }
    )
    
    expect(result.current).toBe(2)
    const firstCount = evaluationCount
    
    // Rerender with same props
    rerender({ expr: expression, ctx: mockContext })
    
    // Memoization should prevent re-evaluation
    expect(evaluationCount).toBe(firstCount)
  })
})

describe('useConditionalVisibility', () => {
  test('returns true for undefined condition', () => {
    const { result } = renderHook(() =>
      useConditionalVisibility(undefined, mockContext)
    )
    expect(result.current).toBe(true)
  })

  test('returns true for truthy expression', () => {
    const { result } = renderHook(() =>
      useConditionalVisibility(
        {
          type: 'condition',
          op: 'eq',
          left: { type: 'literal', value: 5 },
          right: { type: 'literal', value: 5 }
        },
        mockContext
      )
    )
    expect(result.current).toBe(true)
  })

  test('returns false for falsy expression', () => {
    const { result } = renderHook(() =>
      useConditionalVisibility(
        {
          type: 'condition',
          op: 'eq',
          left: { type: 'literal', value: 5 },
          right: { type: 'literal', value: 3 }
        },
        mockContext
      )
    )
    expect(result.current).toBe(false)
  })

  test('evaluates permission-based visibility', () => {
    const { result } = renderHook(() =>
      useConditionalVisibility(
        {
          type: 'permission',
          check: 'hasRole',
          args: ['admin']
        },
        {
          ...mockContext,
          user: { id: '1', roles: ['admin'] }
        }
      )
    )
    expect(result.current).toBe(true)
  })
})

describe('useConditionalEnabled', () => {
  test('returns true for undefined condition', () => {
    const { result} = renderHook(() =>
      useConditionalEnabled(undefined, mockContext)
    )
    expect(result.current).toBe(true)
  })

  test('returns true for truthy expression', () => {
    const { result } = renderHook(() =>
      useConditionalEnabled(
        { type: 'literal', value: true },
        mockContext
      )
    )
    expect(result.current).toBe(true)
  })

  test('returns false for falsy expression', () => {
    const { result } = renderHook(() =>
      useConditionalEnabled(
        { type: 'literal', value: false },
        mockContext
      )
    )
    expect(result.current).toBe(false)
  })
})

describe('buildExpressionContext', () => {
  test('builds context with all parameters', () => {
    const context = buildExpressionContext(
      { name: 'John' },
      { id: 'user123', roles: ['admin'] },
      { id: '123' },
      { theme: 'dark' }
    )
    
    expect(context).toEqual({
      data: { name: 'John' },
      user: { id: 'user123', roles: ['admin'] },
      params: { id: '123' },
      globals: { theme: 'dark' }
    })
  })

  test('provides defaults for optional parameters', () => {
    const context = buildExpressionContext({ name: 'John' })
    
    expect(context).toEqual({
      data: { name: 'John' },
      user: { id: '', roles: [], permissions: [] },
      params: {},
      globals: {}
    })
  })

  test('handles null user', () => {
    const context = buildExpressionContext({ name: 'John' }, null)
    
    expect(context.user).toEqual({ id: '', roles: [], permissions: [] })
  })
})

