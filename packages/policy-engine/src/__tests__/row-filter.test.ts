/**
 * Row Filter Tests
 */

import { describe, test, expect } from 'vitest'
import { applyRowFilters } from '../row-filter.js'
import type { PolicyContext } from '../types.js'

const mockContext: PolicyContext = {
  user: { id: 'user-123', roles: ['user'] },
  model: 'Track',
  action: 'read'
}

describe('applyRowFilters', () => {
  test('extracts filter from simple equality', () => {
    const expression = {
      type: 'condition' as const,
      op: 'eq' as const,
      left: { type: 'field' as const, path: 'uploadedBy' },
      right: { type: 'field' as const, path: 'user.id' }
    }
    
    const filter = applyRowFilters(expression, mockContext)
    
    expect(filter).toHaveProperty('uploadedBy', 'user-123')
  })
  
  test('extracts filter from literal comparison', () => {
    const expression = {
      type: 'condition' as const,
      op: 'eq' as const,
      left: { type: 'field' as const, path: 'isPublic' },
      right: { type: 'literal' as const, value: true }
    }
    
    const filter = applyRowFilters(expression, mockContext)
    
    expect(filter).toHaveProperty('isPublic', true)
  })
  
  test('extracts OR filters', () => {
    const expression = {
      type: 'operation' as const,
      op: 'or' as const,
      args: [
        {
          type: 'condition' as const,
          op: 'eq' as const,
          left: { type: 'field' as const, path: 'isPublic' },
          right: { type: 'literal' as const, value: true }
        },
        {
          type: 'condition' as const,
          op: 'eq' as const,
          left: { type: 'field' as const, path: 'uploadedBy' },
          right: { type: 'field' as const, path: 'user.id' }
        }
      ]
    }
    
    const filter = applyRowFilters(expression, mockContext)
    
    expect(filter).toHaveProperty('OR')
    expect(filter.OR).toBeInstanceOf(Array)
    expect(filter.OR).toHaveLength(2)
  })
  
  test('extracts AND filters', () => {
    const expression = {
      type: 'operation' as const,
      op: 'and' as const,
      args: [
        {
          type: 'condition' as const,
          op: 'eq' as const,
          left: { type: 'field' as const, path: 'status' },
          right: { type: 'literal' as const, value: 'active' }
        },
        {
          type: 'condition' as const,
          op: 'eq' as const,
          left: { type: 'field' as const, path: 'uploadedBy' },
          right: { type: 'field' as const, path: 'user.id' }
        }
      ]
    }
    
    const filter = applyRowFilters(expression, mockContext)
    
    expect(filter).toHaveProperty('AND')
    expect(filter.AND).toBeInstanceOf(Array)
  })
  
  test('returns empty filter for permission-based expression', () => {
    const expression = {
      type: 'permission' as const,
      check: 'hasRole' as const,
      args: ['admin']
    }
    
    const filter = applyRowFilters(expression, mockContext)
    
    expect(filter).toEqual({})
  })
  
  test('handles complex nested expressions', () => {
    const expression = {
      type: 'operation' as const,
      op: 'or' as const,
      args: [
        {
          type: 'condition' as const,
          op: 'eq' as const,
          left: { type: 'field' as const, path: 'isPublic' },
          right: { type: 'literal' as const, value: true }
        },
        {
          type: 'operation' as const,
          op: 'and' as const,
          args: [
            {
              type: 'condition' as const,
              op: 'eq' as const,
              left: { type: 'field' as const, path: 'status' },
              right: { type: 'literal' as const, value: 'draft' }
            },
            {
              type: 'condition' as const,
              op: 'eq' as const,
              left: { type: 'field' as const, path: 'uploadedBy' },
              right: { type: 'field' as const, path: 'user.id' }
            }
          ]
        }
      ]
    }
    
    const filter = applyRowFilters(expression, mockContext)
    
    expect(filter).toHaveProperty('OR')
    expect(filter.OR).toHaveLength(2)
  })
})

