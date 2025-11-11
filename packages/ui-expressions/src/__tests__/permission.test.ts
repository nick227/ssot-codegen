/**
 * Permission Operations Tests
 */

import { describe, test, expect } from 'vitest'
import { evaluate } from '../evaluator.js'
import type { ExpressionContext } from '../types.js'

describe('Permission Operations', () => {
  test('hasRole - user has role', () => {
    expect(evaluate({
      type: 'permission',
      check: 'hasRole',
      args: ['admin']
    }, {
      data: {},
      user: { id: '1', roles: ['admin', 'user'] },
      params: {},
      globals: {}
    })).toBe(true)
  })

  test('hasRole - user does not have role', () => {
    expect(evaluate({
      type: 'permission',
      check: 'hasRole',
      args: ['admin']
    }, {
      data: {},
      user: { id: '1', roles: ['user'] },
      params: {},
      globals: {}
    })).toBe(false)
  })

  test('hasAnyRole - user has one role', () => {
    expect(evaluate({
      type: 'operation',
      op: 'hasAnyRole',
      args: [
        { type: 'literal', value: ['admin', 'editor'] }
      ]
    }, {
      data: {},
      user: { id: '1', roles: ['editor', 'user'] },
      params: {},
      globals: {}
    })).toBe(true)
  })

  test('hasAllRoles - user has all roles', () => {
    expect(evaluate({
      type: 'operation',
      op: 'hasAllRoles',
      args: [
        { type: 'literal', value: ['admin', 'user'] }
      ]
    }, {
      data: {},
      user: { id: '1', roles: ['admin', 'user', 'editor'] },
      params: {},
      globals: {}
    })).toBe(true)
  })

  test('hasPermission - user has permission', () => {
    expect(evaluate({
      type: 'operation',
      op: 'hasPermission',
      args: [
        { type: 'literal', value: 'posts.edit' }
      ]
    }, {
      data: {},
      user: { id: '1', roles: ['admin'], permissions: ['posts.edit', 'posts.delete'] },
      params: {},
      globals: {}
    })).toBe(true)
  })

  test('isOwner - user is owner', () => {
    expect(evaluate({
      type: 'operation',
      op: 'isOwner',
      args: [
        { type: 'literal', value: 'userId' }
      ]
    }, {
      data: { userId: 'user123' },
      user: { id: 'user123', roles: [] },
      params: {},
      globals: {}
    })).toBe(true)
  })

  test('isOwner - nested field', () => {
    expect(evaluate({
      type: 'operation',
      op: 'isOwner',
      args: [
        { type: 'literal', value: 'author.id' }
      ]
    }, {
      data: { author: { id: 'user123' } },
      user: { id: 'user123', roles: [] },
      params: {},
      globals: {}
    })).toBe(true)
  })

  test('isAuthenticated - user is authenticated', () => {
    expect(evaluate({
      type: 'operation',
      op: 'isAuthenticated',
      args: []
    }, {
      data: {},
      user: { id: 'user123', roles: [] },
      params: {},
      globals: {}
    })).toBe(true)
  })

  test('isAnonymous - user is anonymous', () => {
    expect(evaluate({
      type: 'operation',
      op: 'isAnonymous',
      args: []
    }, {
      data: {},
      user: { id: '', roles: [] },
      params: {},
      globals: {}
    })).toBe(true)
  })

  test('complex permission - isOwner OR hasRole(admin)', () => {
    expect(evaluate({
      type: 'operation',
      op: 'or',
      args: [
        {
          type: 'operation',
          op: 'isOwner',
          args: [{ type: 'literal', value: 'userId' }]
        },
        {
          type: 'operation',
          op: 'hasRole',
          args: [{ type: 'literal', value: 'admin' }]
        }
      ]
    }, {
      data: { userId: 'other-user' },
      user: { id: 'user123', roles: ['admin'] },
      params: {},
      globals: {}
    })).toBe(true)
  })
})

