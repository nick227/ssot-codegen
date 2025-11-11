/**
 * Logical Operations Tests
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

describe('Logical Operations', () => {
  test('and - all true', () => {
    expect(evaluate({
      type: 'operation',
      op: 'and',
      args: [
        { type: 'literal', value: true },
        { type: 'literal', value: true },
        { type: 'literal', value: true }
      ]
    }, mockContext)).toBe(true)
  })

  test('and - one false', () => {
    expect(evaluate({
      type: 'operation',
      op: 'and',
      args: [
        { type: 'literal', value: true },
        { type: 'literal', value: false },
        { type: 'literal', value: true }
      ]
    }, mockContext)).toBe(false)
  })

  test('or - one true', () => {
    expect(evaluate({
      type: 'operation',
      op: 'or',
      args: [
        { type: 'literal', value: false },
        { type: 'literal', value: true },
        { type: 'literal', value: false }
      ]
    }, mockContext)).toBe(true)
  })

  test('or - all false', () => {
    expect(evaluate({
      type: 'operation',
      op: 'or',
      args: [
        { type: 'literal', value: false },
        { type: 'literal', value: false },
        { type: 'literal', value: false }
      ]
    }, mockContext)).toBe(false)
  })

  test('not - true', () => {
    expect(evaluate({
      type: 'operation',
      op: 'not',
      args: [{ type: 'literal', value: true }]
    }, mockContext)).toBe(false)
  })

  test('not - false', () => {
    expect(evaluate({
      type: 'operation',
      op: 'not',
      args: [{ type: 'literal', value: false }]
    }, mockContext)).toBe(true)
  })

  test('if - condition true', () => {
    expect(evaluate({
      type: 'operation',
      op: 'if',
      args: [
        { type: 'literal', value: true },
        { type: 'literal', value: 'yes' },
        { type: 'literal', value: 'no' }
      ]
    }, mockContext)).toBe('yes')
  })

  test('if - condition false', () => {
    expect(evaluate({
      type: 'operation',
      op: 'if',
      args: [
        { type: 'literal', value: false },
        { type: 'literal', value: 'yes' },
        { type: 'literal', value: 'no' }
      ]
    }, mockContext)).toBe('no')
  })

  test('if - with field comparison', () => {
    expect(evaluate({
      type: 'operation',
      op: 'if',
      args: [
        {
          type: 'condition',
          op: 'eq',
          left: { type: 'field', path: 'published' },
          right: { type: 'literal', value: true }
        },
        { type: 'literal', value: 'Live' },
        { type: 'literal', value: 'Draft' }
      ]
    }, {
      ...mockContext,
      data: { published: true }
    })).toBe('Live')
  })

  test('coalesce - returns first non-null', () => {
    expect(evaluate({
      type: 'operation',
      op: 'coalesce',
      args: [
        { type: 'literal', value: null },
        { type: 'literal', value: undefined },
        { type: 'literal', value: 'default' },
        { type: 'literal', value: 'other' }
      ]
    }, mockContext)).toBe('default')
  })

  test('exists - value exists', () => {
    expect(evaluate({
      type: 'operation',
      op: 'exists',
      args: [{ type: 'literal', value: 'hello' }]
    }, mockContext)).toBe(true)
  })

  test('exists - null', () => {
    expect(evaluate({
      type: 'operation',
      op: 'exists',
      args: [{ type: 'literal', value: null }]
    }, mockContext)).toBe(false)
  })

  test('isNull - null', () => {
    expect(evaluate({
      type: 'operation',
      op: 'isNull',
      args: [{ type: 'literal', value: null }]
    }, mockContext)).toBe(true)
  })

  test('isEmpty - empty string', () => {
    expect(evaluate({
      type: 'operation',
      op: 'isEmpty',
      args: [{ type: 'literal', value: '' }]
    }, mockContext)).toBe(true)
  })

  test('isEmpty - empty array', () => {
    expect(evaluate({
      type: 'operation',
      op: 'isEmpty',
      args: [{ type: 'literal', value: [] }]
    }, mockContext)).toBe(true)
  })

  test('isEmpty - non-empty', () => {
    expect(evaluate({
      type: 'operation',
      op: 'isEmpty',
      args: [{ type: 'literal', value: 'hello' }]
    }, mockContext)).toBe(false)
  })

  test('complex logical - (A and B) or C', () => {
    expect(evaluate({
      type: 'operation',
      op: 'or',
      args: [
        {
          type: 'operation',
          op: 'and',
          args: [
            { type: 'literal', value: false },
            { type: 'literal', value: true }
          ]
        },
        { type: 'literal', value: true }
      ]
    }, mockContext)).toBe(true)
  })
})

