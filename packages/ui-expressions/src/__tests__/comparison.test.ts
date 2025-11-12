/**
 * Comparison Operations Tests
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

describe('Comparison Operations', () => {
  test('eq - equal', () => {
    expect(evaluate({
      type: 'condition',
      op: 'eq',
      left: { type: 'literal', value: 5 },
      right: { type: 'literal', value: 5 }
    }, mockContext)).toBe(true)
  })

  test('eq - not equal', () => {
    expect(evaluate({
      type: 'condition',
      op: 'eq',
      left: { type: 'literal', value: 5 },
      right: { type: 'literal', value: 3 }
    }, mockContext)).toBe(false)
  })

  test('ne - not equal', () => {
    expect(evaluate({
      type: 'condition',
      op: 'ne',
      left: { type: 'literal', value: 5 },
      right: { type: 'literal', value: 3 }
    }, mockContext)).toBe(true)
  })

  test('gt - greater than', () => {
    expect(evaluate({
      type: 'condition',
      op: 'gt',
      left: { type: 'literal', value: 5 },
      right: { type: 'literal', value: 3 }
    }, mockContext)).toBe(true)
  })

  test('lt - less than', () => {
    expect(evaluate({
      type: 'condition',
      op: 'lt',
      left: { type: 'literal', value: 3 },
      right: { type: 'literal', value: 5 }
    }, mockContext)).toBe(true)
  })

  test('gte - greater than or equal', () => {
    expect(evaluate({
      type: 'condition',
      op: 'gte',
      left: { type: 'literal', value: 5 },
      right: { type: 'literal', value: 5 }
    }, mockContext)).toBe(true)
  })

  test('lte - less than or equal', () => {
    expect(evaluate({
      type: 'condition',
      op: 'lte',
      left: { type: 'literal', value: 3 },
      right: { type: 'literal', value: 5 }
    }, mockContext)).toBe(true)
  })

  test('in - value in array', () => {
    expect(evaluate({
      type: 'condition',
      op: 'in',
      left: { type: 'literal', value: 3 },
      right: { type: 'literal', value: [1, 2, 3, 4] }
    }, mockContext)).toBe(true)
  })

  test('in - value not in array', () => {
    expect(evaluate({
      type: 'condition',
      op: 'in',
      left: { type: 'literal', value: 5 },
      right: { type: 'literal', value: [1, 2, 3, 4] }
    }, mockContext)).toBe(false)
  })

  test('between', () => {
    expect(evaluate({
      type: 'operation',
      op: 'between',
      args: [
        { type: 'literal', value: 5 },
        { type: 'literal', value: 3 },
        { type: 'literal', value: 7 }
      ]
    }, mockContext)).toBe(true)
  })

  test('comparison with field access', () => {
    expect(evaluate({
      type: 'condition',
      op: 'gt',
      left: { type: 'field', path: 'price' },
      right: { type: 'literal', value: 50 }
    }, {
      ...mockContext,
      data: { price: 100 }
    })).toBe(true)
  })
})


