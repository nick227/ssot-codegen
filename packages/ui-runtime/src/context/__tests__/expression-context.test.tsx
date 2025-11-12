/**
 * ExpressionContext Tests
 * 
 * Tests the new ExpressionContextProvider and related hooks
 */

import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import {
  ExpressionContextProvider,
  useExpressionContext,
  useHasExpressionContext
} from '../expression-context.js'

describe('ExpressionContextProvider', () => {
  test('provides context to children', () => {
    const data = { name: 'John' }
    const user = { id: '1', roles: ['admin'] }
    const params = { id: '123' }
    const globals = { theme: 'dark' }
    
    const { result } = renderHook(
      () => useExpressionContext(),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
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
    )
    
    expect(result.current).toEqual({
      data,
      user,
      params,
      globals
    })
  })

  test('provides defaults for optional parameters', () => {
    const data = { name: 'John' }
    
    const { result } = renderHook(
      () => useExpressionContext(),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ExpressionContextProvider data={data}>
            {children}
          </ExpressionContextProvider>
        )
      }
    )
    
    expect(result.current).toEqual({
      data,
      user: { id: '', roles: [], permissions: [] },
      params: {},
      globals: {}
    })
  })

  test('handles null user', () => {
    const data = { name: 'John' }
    
    const { result } = renderHook(
      () => useExpressionContext(),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ExpressionContextProvider data={data} user={null}>
            {children}
          </ExpressionContextProvider>
        )
      }
    )
    
    expect(result.current.user).toEqual({
      id: '',
      roles: [],
      permissions: []
    })
  })

  test('memoizes context value (stable reference)', () => {
    const data = { name: 'John' }
    const user = { id: '1', roles: ['admin'] }
    
    let renderCount = 0
    
    const { result, rerender } = renderHook(
      () => {
        renderCount++
        return useExpressionContext()
      },
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ExpressionContextProvider data={data} user={user}>
            {children}
          </ExpressionContextProvider>
        )
      }
    )
    
    const firstContext = result.current
    const firstRenderCount = renderCount
    
    // Rerender
    rerender()
    
    // Context reference should remain stable
    expect(result.current).toBe(firstContext)
    expect(renderCount).toBe(firstRenderCount)
  })

  test('updates context when data changes', () => {
    const { result, rerender } = renderHook(
      ({ data }: { data: Record<string, any> }) => useExpressionContext(),
      {
        initialProps: { data: { count: 1 } },
        wrapper: ({ children, data }: { children: ReactNode; data: Record<string, any> }) => (
          <ExpressionContextProvider data={data}>
            {children}
          </ExpressionContextProvider>
        )
      }
    )
    
    expect(result.current.data).toEqual({ count: 1 })
    
    // Change data
    rerender({ data: { count: 2 } })
    
    expect(result.current.data).toEqual({ count: 2 })
  })
})

describe('useExpressionContext', () => {
  test('throws error when used outside provider', () => {
    // Suppress error console output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      renderHook(() => useExpressionContext())
    }).toThrow('useExpressionContext must be used within ExpressionContextProvider')
    
    consoleSpy.mockRestore()
  })

  test('returns context when inside provider', () => {
    const data = { name: 'Test' }
    
    const { result } = renderHook(
      () => useExpressionContext(),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ExpressionContextProvider data={data}>
            {children}
          </ExpressionContextProvider>
        )
      }
    )
    
    expect(result.current.data).toEqual(data)
  })
})

describe('useHasExpressionContext', () => {
  test('returns false when outside provider', () => {
    const { result } = renderHook(() => useHasExpressionContext())
    
    expect(result.current).toBe(false)
  })

  test('returns true when inside provider', () => {
    const { result } = renderHook(
      () => useHasExpressionContext(),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ExpressionContextProvider data={{}}>
            {children}
          </ExpressionContextProvider>
        )
      }
    )
    
    expect(result.current).toBe(true)
  })

  test('useful for optional expression evaluation', () => {
    // Simulate a component that optionally uses expressions
    function useOptionalExpression() {
      const hasContext = useHasExpressionContext()
      
      if (!hasContext) {
        return 'default-value'
      }
      
      const context = useExpressionContext()
      return context.data.value || 'fallback'
    }
    
    // Outside provider
    const { result: resultOutside } = renderHook(() => useOptionalExpression())
    expect(resultOutside.current).toBe('default-value')
    
    // Inside provider
    const { result: resultInside } = renderHook(
      () => useOptionalExpression(),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ExpressionContextProvider data={{ value: 'test' }}>
            {children}
          </ExpressionContextProvider>
        )
      }
    )
    expect(resultInside.current).toBe('test')
  })
})

