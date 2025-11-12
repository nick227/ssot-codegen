/**
 * Array Operations Tests
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

describe('Array Operations', () => {
  test('count', () => {
    expect(evaluate({
      type: 'operation',
      op: 'count',
      args: [{ type: 'literal', value: [1, 2, 3, 4] }]
    }, mockContext)).toBe(4)
  })

  test('sum - array of numbers', () => {
    expect(evaluate({
      type: 'operation',
      op: 'sum',
      args: [{ type: 'literal', value: [1, 2, 3, 4] }]
    }, mockContext)).toBe(10)
  })

  test('sum - array of objects with field', () => {
    expect(evaluate({
      type: 'operation',
      op: 'sum',
      args: [
        { type: 'literal', value: [{ price: 10 }, { price: 20 }, { price: 30 }] },
        { type: 'literal', value: 'price' }
      ]
    }, mockContext)).toBe(60)
  })

  test('avg - array of numbers', () => {
    expect(evaluate({
      type: 'operation',
      op: 'avg',
      args: [{ type: 'literal', value: [1, 2, 3, 4] }]
    }, mockContext)).toBe(2.5)
  })

  test('first', () => {
    expect(evaluate({
      type: 'operation',
      op: 'first',
      args: [{ type: 'literal', value: [1, 2, 3] }]
    }, mockContext)).toBe(1)
  })

  test('last', () => {
    expect(evaluate({
      type: 'operation',
      op: 'last',
      args: [{ type: 'literal', value: [1, 2, 3] }]
    }, mockContext)).toBe(3)
  })

  test('map - extract field', () => {
    expect(evaluate({
      type: 'operation',
      op: 'map',
      args: [
        { type: 'literal', value: [{ name: 'John' }, { name: 'Jane' }] },
        { type: 'literal', value: 'name' }
      ]
    }, mockContext)).toEqual(['John', 'Jane'])
  })

  test('filter', () => {
    expect(evaluate({
      type: 'operation',
      op: 'filter',
      args: [
        { type: 'literal', value: [{ published: true }, { published: false }, { published: true }] },
        { type: 'literal', value: 'published' },
        { type: 'literal', value: true }
      ]
    }, mockContext)).toEqual([{ published: true }, { published: true }])
  })

  test('find', () => {
    expect(evaluate({
      type: 'operation',
      op: 'find',
      args: [
        { type: 'literal', value: [{ id: 1 }, { id: 2 }, { id: 3 }] },
        { type: 'literal', value: 'id' },
        { type: 'literal', value: 2 }
      ]
    }, mockContext)).toEqual({ id: 2 })
  })

  test('some', () => {
    expect(evaluate({
      type: 'operation',
      op: 'some',
      args: [
        { type: 'literal', value: [{ published: false }, { published: true }] },
        { type: 'literal', value: 'published' },
        { type: 'literal', value: true }
      ]
    }, mockContext)).toBe(true)
  })

  test('every', () => {
    expect(evaluate({
      type: 'operation',
      op: 'every',
      args: [
        { type: 'literal', value: [{ published: true }, { published: true }] },
        { type: 'literal', value: 'published' },
        { type: 'literal', value: true }
      ]
    }, mockContext)).toBe(true)
  })

  test('slice', () => {
    expect(evaluate({
      type: 'operation',
      op: 'slice',
      args: [
        { type: 'literal', value: [1, 2, 3, 4, 5] },
        { type: 'literal', value: 1 },
        { type: 'literal', value: 3 }
      ]
    }, mockContext)).toEqual([2, 3])
  })

  test('unique', () => {
    expect(evaluate({
      type: 'operation',
      op: 'unique',
      args: [{ type: 'literal', value: [1, 2, 2, 3, 3, 4] }]
    }, mockContext)).toEqual([1, 2, 3, 4])
  })

  test('flatten', () => {
    expect(evaluate({
      type: 'operation',
      op: 'flatten',
      args: [{ type: 'literal', value: [[1, 2], [3, 4], [5]] }]
    }, mockContext)).toEqual([1, 2, 3, 4, 5])
  })
})


