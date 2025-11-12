/**
 * Core Evaluator Tests
 */

import { describe, test, expect } from 'vitest'
import { ExpressionEvaluator, evaluate } from '../evaluator.js'
import type { ExpressionContext } from '../types.js'

const mockContext: ExpressionContext = {
  data: {},
  user: { id: '1', roles: [] },
  params: {},
  globals: {}
}

describe('ExpressionEvaluator', () => {
  test('evaluates literal expressions', () => {
    expect(evaluate({ type: 'literal', value: 42 }, mockContext)).toBe(42)
    expect(evaluate({ type: 'literal', value: 'hello' }, mockContext)).toBe('hello')
    expect(evaluate({ type: 'literal', value: true }, mockContext)).toBe(true)
    expect(evaluate({ type: 'literal', value: null }, mockContext)).toBe(null)
  })

  test('throws on unknown expression type', () => {
    expect(() => evaluate({
      type: 'unknown',
      value: 42
    } as any, mockContext)).toThrow('Unknown expression type: unknown')
  })

  test('throws on unknown operation', () => {
    expect(() => evaluate({
      type: 'operation',
      op: 'unknownOp',
      args: []
    }, mockContext)).toThrow('Unknown operation: unknownOp')
  })

  test('throws on maximum recursion depth', () => {
    // Create deeply nested expression
    let expr: any = { type: 'literal', value: 1 }
    for (let i = 0; i < 60; i++) {
      expr = {
        type: 'operation',
        op: 'add',
        args: [expr, { type: 'literal', value: 1 }]
      }
    }

    const evaluator = new ExpressionEvaluator(undefined, { maxDepth: 50 })
    expect(() => evaluator.evaluate(expr, mockContext)).toThrow('Maximum recursion depth (50) exceeded')
  })

  test('supports custom operations', () => {
    const evaluator = new ExpressionEvaluator(undefined, {
      customOperations: {
        double: (n: number) => n * 2
      }
    })

    expect(evaluator.evaluate({
      type: 'operation',
      op: 'double',
      args: [{ type: 'literal', value: 5 }]
    }, mockContext)).toBe(10)
  })

  test('evaluates complex nested expressions', () => {
    // (5 + 3) * 2 - 4
    expect(evaluate({
      type: 'operation',
      op: 'subtract',
      args: [
        {
          type: 'operation',
          op: 'multiply',
          args: [
            {
              type: 'operation',
              op: 'add',
              args: [
                { type: 'literal', value: 5 },
                { type: 'literal', value: 3 }
              ]
            },
            { type: 'literal', value: 2 }
          ]
        },
        { type: 'literal', value: 4 }
      ]
    }, mockContext)).toBe(12)
  })

  test('evaluates expression with field access and operations', () => {
    // price * quantity
    expect(evaluate({
      type: 'operation',
      op: 'multiply',
      args: [
        { type: 'field', path: 'price' },
        { type: 'field', path: 'quantity' }
      ]
    }, {
      ...mockContext,
      data: { price: 10, quantity: 3 }
    })).toBe(30)
  })

  test('evaluates conditional with comparison', () => {
    // if (price > 50) then 'expensive' else 'cheap'
    expect(evaluate({
      type: 'operation',
      op: 'if',
      args: [
        {
          type: 'condition',
          op: 'gt',
          left: { type: 'field', path: 'price' },
          right: { type: 'literal', value: 50 }
        },
        { type: 'literal', value: 'expensive' },
        { type: 'literal', value: 'cheap' }
      ]
    }, {
      ...mockContext,
      data: { price: 100 }
    })).toBe('expensive')
  })

  test('evaluates permissions in conditional', () => {
    // if (hasRole('admin')) then 'allowed' else 'denied'
    expect(evaluate({
      type: 'operation',
      op: 'if',
      args: [
        {
          type: 'permission',
          check: 'hasRole',
          args: ['admin']
        },
        { type: 'literal', value: 'allowed' },
        { type: 'literal', value: 'denied' }
      ]
    }, {
      ...mockContext,
      user: { id: '1', roles: ['admin'] }
    })).toBe('allowed')
  })

  test('real-world example - fullName computed field', () => {
    // fullName = firstName + ' ' + lastName
    expect(evaluate({
      type: 'operation',
      op: 'concat',
      args: [
        { type: 'field', path: 'firstName' },
        { type: 'literal', value: ' ' },
        { type: 'field', path: 'lastName' }
      ]
    }, {
      ...mockContext,
      data: { firstName: 'John', lastName: 'Doe' }
    })).toBe('John Doe')
  })

  test('real-world example - discount calculation', () => {
    // finalPrice = price - (price * discountPercent)
    expect(evaluate({
      type: 'operation',
      op: 'subtract',
      args: [
        { type: 'field', path: 'price' },
        {
          type: 'operation',
          op: 'multiply',
          args: [
            { type: 'field', path: 'price' },
            { type: 'field', path: 'discountPercent' }
          ]
        }
      ]
    }, {
      ...mockContext,
      data: { price: 100, discountPercent: 0.10 }
    })).toBe(90)
  })

  test('real-world example - status badge', () => {
    // status = published ? 'Live' : 'Draft'
    expect(evaluate({
      type: 'operation',
      op: 'if',
      args: [
        { type: 'field', path: 'published' },
        { type: 'literal', value: 'Live' },
        { type: 'literal', value: 'Draft' }
      ]
    }, {
      ...mockContext,
      data: { published: true }
    })).toBe('Live')
  })

  test('real-world example - conditional visibility', () => {
    // visible = (status === 'published') AND (hasRole('admin') OR isOwner())
    expect(evaluate({
      type: 'operation',
      op: 'and',
      args: [
        {
          type: 'condition',
          op: 'eq',
          left: { type: 'field', path: 'status' },
          right: { type: 'literal', value: 'published' }
        },
        {
          type: 'operation',
          op: 'or',
          args: [
            {
              type: 'operation',
              op: 'hasRole',
              args: [{ type: 'literal', value: 'admin' }]
            },
            {
              type: 'operation',
              op: 'isOwner',
              args: [{ type: 'literal', value: 'userId' }]
            }
          ]
        }
      ]
    }, {
      data: { status: 'published', userId: 'user123' },
      user: { id: 'user123', roles: ['user'] },
      params: {},
      globals: {}
    })).toBe(true)
  })

  test('real-world example - array total', () => {
    // total = sum(items, 'price')
    expect(evaluate({
      type: 'operation',
      op: 'sum',
      args: [
        { type: 'field', path: 'items' },
        { type: 'literal', value: 'price' }
      ]
    }, {
      ...mockContext,
      data: {
        items: [
          { name: 'Item 1', price: 10 },
          { name: 'Item 2', price: 20 },
          { name: 'Item 3', price: 30 }
        ]
      }
    })).toBe(60)
  })
})


