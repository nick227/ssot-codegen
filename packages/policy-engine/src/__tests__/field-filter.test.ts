/**
 * Field Filter Tests
 */

import { describe, test, expect } from 'vitest'
import { filterFields, filterDataFields } from '../field-filter.js'
import type { PolicyContext } from '../types.js'

const mockContext: PolicyContext = {
  user: { id: 'user-123', roles: ['user'] },
  model: 'Track',
  action: 'update'
}

describe('filterFields', () => {
  test('allows specified read fields', () => {
    const result = filterFields(
      {
        read: ['id', 'title', 'description'],
        write: []
      },
      mockContext
    )
    
    expect(result.read).toEqual(['id', 'title', 'description'])
  })
  
  test('allows specified write fields', () => {
    const result = filterFields(
      {
        read: [],
        write: ['title', 'description']
      },
      mockContext
    )
    
    expect(result.write).toEqual(['title', 'description'])
  })
  
  test('allows all fields when using wildcard', () => {
    const result = filterFields(
      {
        read: ['*'],
        write: ['*']
      },
      mockContext
    )
    
    expect(result.read).toEqual(['*'])
    expect(result.write).toEqual(['*'])
  })
  
  test('deny takes precedence over read', () => {
    const result = filterFields(
      {
        read: ['id', 'title', 'role'],
        deny: ['role']
      },
      mockContext
    )
    
    expect(result.read).toEqual(['id', 'title'])
    expect(result.read).not.toContain('role')
  })
  
  test('deny takes precedence over write', () => {
    const result = filterFields(
      {
        write: ['name', 'email', 'role'],
        deny: ['role']
      },
      mockContext
    )
    
    expect(result.write).toEqual(['name', 'email'])
    expect(result.write).not.toContain('role')
  })
  
  test('defaults to all fields when none specified', () => {
    const result = filterFields({}, mockContext)
    
    expect(result.read).toEqual(['*'])
    expect(result.write).toEqual(['*'])
  })
})

describe('filterDataFields', () => {
  test('filters data to only allowed fields', () => {
    const data = {
      id: '123',
      title: 'Test',
      description: 'Desc',
      uploadedBy: 'user-123',
      plays: 100
    }
    
    const filtered = filterDataFields(data, ['title', 'description'])
    
    expect(filtered).toEqual({
      title: 'Test',
      description: 'Desc'
    })
    expect(filtered).not.toHaveProperty('uploadedBy')
    expect(filtered).not.toHaveProperty('plays')
  })
  
  test('returns all data when wildcard specified', () => {
    const data = {
      id: '123',
      title: 'Test',
      description: 'Desc'
    }
    
    const filtered = filterDataFields(data, ['*'])
    
    expect(filtered).toEqual(data)
  })
  
  test('returns empty object when no fields allowed', () => {
    const data = {
      id: '123',
      title: 'Test'
    }
    
    const filtered = filterDataFields(data, [])
    
    expect(filtered).toEqual({})
  })
  
  test('ignores fields not in data', () => {
    const data = {
      title: 'Test'
    }
    
    const filtered = filterDataFields(data, ['title', 'description', 'nonexistent'])
    
    expect(filtered).toEqual({ title: 'Test' })
  })
  
  test('prevents privilege escalation', () => {
    const data = {
      name: 'John',
      email: 'john@example.com',
      role: 'admin'  // Attacker trying to escalate
    }
    
    const filtered = filterDataFields(data, ['name', 'email'])
    
    expect(filtered).toEqual({
      name: 'John',
      email: 'john@example.com'
    })
    expect(filtered).not.toHaveProperty('role')
  })
})

