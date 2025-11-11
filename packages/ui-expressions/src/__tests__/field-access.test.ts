/**
 * Field Access Tests
 */

import { describe, test, expect } from 'vitest'
import { evaluate } from '../evaluator.js'
import type { ExpressionContext } from '../types.js'

describe('Field Access', () => {
  test('simple field access', () => {
    expect(evaluate({
      type: 'field',
      path: 'name'
    }, {
      data: { name: 'John' },
      user: { id: '1', roles: [] },
      params: {},
      globals: {}
    })).toBe('John')
  })

  test('nested field access', () => {
    expect(evaluate({
      type: 'field',
      path: 'user.name'
    }, {
      data: { user: { name: 'John' } },
      user: { id: '1', roles: [] },
      params: {},
      globals: {}
    })).toBe('John')
  })

  test('deep nested field access', () => {
    expect(evaluate({
      type: 'field',
      path: 'author.profile.bio'
    }, {
      data: { author: { profile: { bio: 'Software Developer' } } },
      user: { id: '1', roles: [] },
      params: {},
      globals: {}
    })).toBe('Software Developer')
  })

  test('field access - null value', () => {
    expect(evaluate({
      type: 'field',
      path: 'user.name'
    }, {
      data: { user: null },
      user: { id: '1', roles: [] },
      params: {},
      globals: {}
    })).toBe(null)
  })

  test('field access - undefined field', () => {
    expect(evaluate({
      type: 'field',
      path: 'nonexistent'
    }, {
      data: { name: 'John' },
      user: { id: '1', roles: [] },
      params: {},
      globals: {}
    })).toBeUndefined()
  })

  test('field access with array - wildcard', () => {
    expect(evaluate({
      type: 'field',
      path: 'items'
    }, {
      data: { items: [{ price: 10 }, { price: 20 }] },
      user: { id: '1', roles: [] },
      params: {},
      globals: {}
    })).toEqual([{ price: 10 }, { price: 20 }])
  })
})

