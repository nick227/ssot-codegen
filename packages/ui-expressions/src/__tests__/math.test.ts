/**
 * Math Operations Tests
 */

import { describe, test, expect } from 'vitest'
import { evaluate } from '../evaluator.js'
import type { ExpressionContext } from '../types.js'

const mockContext: ExpressionContext = {
  data: {},
  user: { id: '1', roles: [] },
  params: {},
  globals: {}
}

describe('Math Operations', () => {
  test('add - simple addition', () => {
    expect(evaluate({
      type: 'operation',
      op: 'add',
      args: [
        { type: 'literal', value: 5 },
        { type: 'literal', value: 3 }
      ]
    }, mockContext)).toBe(8)
  })

  test('add - multiple numbers', () => {
    expect(evaluate({
      type: 'operation',
      op: 'add',
      args: [
        { type: 'literal', value: 1 },
        { type: 'literal', value: 2 },
        { type: 'literal', value: 3 },
        { type: 'literal', value: 4 }
      ]
    }, mockContext)).toBe(10)
  })

  test('add - with field access', () => {
    expect(evaluate({
      type: 'operation',
      op: 'add',
      args: [
        { type: 'field', path: 'price' },
        { type: 'literal', value: 10 }
      ]
    }, {
      ...mockContext,
      data: { price: 50 }
    })).toBe(60)
  })

  test('subtract', () => {
    expect(evaluate({
      type: 'operation',
      op: 'subtract',
      args: [
        { type: 'literal', value: 10 },
        { type: 'literal', value: 3 }
      ]
    }, mockContext)).toBe(7)
  })

  test('multiply', () => {
    expect(evaluate({
      type: 'operation',
      op: 'multiply',
      args: [
        { type: 'literal', value: 5 },
        { type: 'literal', value: 3 }
      ]
    }, mockContext)).toBe(15)
  })

  test('multiply - with fields', () => {
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

  test('divide', () => {
    expect(evaluate({
      type: 'operation',
      op: 'divide',
      args: [
        { type: 'literal', value: 10 },
        { type: 'literal', value: 2 }
      ]
    }, mockContext)).toBe(5)
  })

  test('divide - by zero throws error', () => {
    expect(() => evaluate({
      type: 'operation',
      op: 'divide',
      args: [
        { type: 'literal', value: 10 },
        { type: 'literal', value: 0 }
      ]
    }, mockContext)).toThrow('Division by zero')
  })

  test('mod', () => {
    expect(evaluate({
      type: 'operation',
      op: 'mod',
      args: [
        { type: 'literal', value: 10 },
        { type: 'literal', value: 3 }
      ]
    }, mockContext)).toBe(1)
  })

  test('pow', () => {
    expect(evaluate({
      type: 'operation',
      op: 'pow',
      args: [
        { type: 'literal', value: 2 },
        { type: 'literal', value: 3 }
      ]
    }, mockContext)).toBe(8)
  })

  test('abs - positive', () => {
    expect(evaluate({
      type: 'operation',
      op: 'abs',
      args: [{ type: 'literal', value: 5 }]
    }, mockContext)).toBe(5)
  })

  test('abs - negative', () => {
    expect(evaluate({
      type: 'operation',
      op: 'abs',
      args: [{ type: 'literal', value: -5 }]
    }, mockContext)).toBe(5)
  })

  test('round', () => {
    expect(evaluate({
      type: 'operation',
      op: 'round',
      args: [{ type: 'literal', value: 3.7 }]
    }, mockContext)).toBe(4)
  })

  test('floor', () => {
    expect(evaluate({
      type: 'operation',
      op: 'floor',
      args: [{ type: 'literal', value: 3.7 }]
    }, mockContext)).toBe(3)
  })

  test('ceil', () => {
    expect(evaluate({
      type: 'operation',
      op: 'ceil',
      args: [{ type: 'literal', value: 3.2 }]
    }, mockContext)).toBe(4)
  })

  test('min', () => {
    expect(evaluate({
      type: 'operation',
      op: 'min',
      args: [
        { type: 'literal', value: 5 },
        { type: 'literal', value: 3 },
        { type: 'literal', value: 7 }
      ]
    }, mockContext)).toBe(3)
  })

  test('max', () => {
    expect(evaluate({
      type: 'operation',
      op: 'max',
      args: [
        { type: 'literal', value: 5 },
        { type: 'literal', value: 3 },
        { type: 'literal', value: 7 }
      ]
    }, mockContext)).toBe(7)
  })

  test('nested operations - (5 + 3) * 2', () => {
    expect(evaluate({
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
    }, mockContext)).toBe(16)
  })

  test('complex expression - discount calculation', () => {
    // total = price - (price * 0.10)
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
            { type: 'literal', value: 0.10 }
          ]
        }
      ]
    }, {
      ...mockContext,
      data: { price: 100 }
    })).toBe(90)
  })
})

