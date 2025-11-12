/**
 * String Operations Tests
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

describe('String Operations', () => {
  test('concat - simple', () => {
    expect(evaluate({
      type: 'operation',
      op: 'concat',
      args: [
        { type: 'literal', value: 'Hello' },
        { type: 'literal', value: ' ' },
        { type: 'literal', value: 'World' }
      ]
    }, mockContext)).toBe('Hello World')
  })

  test('concat - with fields', () => {
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

  test('upper', () => {
    expect(evaluate({
      type: 'operation',
      op: 'upper',
      args: [{ type: 'literal', value: 'hello' }]
    }, mockContext)).toBe('HELLO')
  })

  test('lower', () => {
    expect(evaluate({
      type: 'operation',
      op: 'lower',
      args: [{ type: 'literal', value: 'HELLO' }]
    }, mockContext)).toBe('hello')
  })

  test('capitalize', () => {
    expect(evaluate({
      type: 'operation',
      op: 'capitalize',
      args: [{ type: 'literal', value: 'hello' }]
    }, mockContext)).toBe('Hello')
  })

  test('trim', () => {
    expect(evaluate({
      type: 'operation',
      op: 'trim',
      args: [{ type: 'literal', value: '  hello  ' }]
    }, mockContext)).toBe('hello')
  })

  test('substring', () => {
    expect(evaluate({
      type: 'operation',
      op: 'substring',
      args: [
        { type: 'literal', value: 'hello' },
        { type: 'literal', value: 1 },
        { type: 'literal', value: 4 }
      ]
    }, mockContext)).toBe('ell')
  })

  test('replace', () => {
    expect(evaluate({
      type: 'operation',
      op: 'replace',
      args: [
        { type: 'literal', value: 'hello world' },
        { type: 'literal', value: 'world' },
        { type: 'literal', value: 'there' }
      ]
    }, mockContext)).toBe('hello there')
  })

  test('split', () => {
    expect(evaluate({
      type: 'operation',
      op: 'split',
      args: [
        { type: 'literal', value: 'a,b,c' },
        { type: 'literal', value: ',' }
      ]
    }, mockContext)).toEqual(['a', 'b', 'c'])
  })

  test('join', () => {
    expect(evaluate({
      type: 'operation',
      op: 'join',
      args: [
        { type: 'literal', value: ['a', 'b', 'c'] },
        { type: 'literal', value: ', ' }
      ]
    }, mockContext)).toBe('a, b, c')
  })

  test('contains - true', () => {
    expect(evaluate({
      type: 'operation',
      op: 'contains',
      args: [
        { type: 'literal', value: 'hello world' },
        { type: 'literal', value: 'world' }
      ]
    }, mockContext)).toBe(true)
  })

  test('contains - false', () => {
    expect(evaluate({
      type: 'operation',
      op: 'contains',
      args: [
        { type: 'literal', value: 'hello world' },
        { type: 'literal', value: 'goodbye' }
      ]
    }, mockContext)).toBe(false)
  })

  test('startsWith - true', () => {
    expect(evaluate({
      type: 'operation',
      op: 'startsWith',
      args: [
        { type: 'literal', value: 'hello' },
        { type: 'literal', value: 'hel' }
      ]
    }, mockContext)).toBe(true)
  })

  test('endsWith - true', () => {
    expect(evaluate({
      type: 'operation',
      op: 'endsWith',
      args: [
        { type: 'literal', value: 'hello' },
        { type: 'literal', value: 'lo' }
      ]
    }, mockContext)).toBe(true)
  })

  test('length', () => {
    expect(evaluate({
      type: 'operation',
      op: 'length',
      args: [{ type: 'literal', value: 'hello' }]
    }, mockContext)).toBe(5)
  })
})


