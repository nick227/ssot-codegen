/**
 * PolicyEngine Tests
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { PolicyEngine } from '../policy-engine.js'
import type { Policies, PolicyContext } from '../types.js'

const mockPolicies: Policies = {
  policies: [
    {
      model: 'Track',
      action: 'read',
      allow: {
        type: 'operation',
        op: 'or',
        args: [
          {
            type: 'condition',
            op: 'eq',
            left: { type: 'field', path: 'isPublic' },
            right: { type: 'literal', value: true }
          },
          {
            type: 'condition',
            op: 'eq',
            left: { type: 'field', path: 'uploadedBy' },
            right: { type: 'field', path: 'user.id' }
          }
        ]
      }
    },
    {
      model: 'Track',
      action: 'update',
      allow: {
        type: 'condition',
        op: 'eq',
        left: { type: 'field', path: 'uploadedBy' },
        right: { type: 'field', path: 'user.id' }
      },
      fields: {
        write: ['title', 'description'],
        deny: ['uploadedBy', 'plays']
      }
    },
    {
      model: 'User',
      action: 'update',
      allow: {
        type: 'condition',
        op: 'eq',
        left: { type: 'field', path: 'id' },
        right: { type: 'field', path: 'user.id' }
      },
      fields: {
        write: ['name', 'email'],
        deny: ['role', 'permissions']
      }
    }
  ]
}

describe('PolicyEngine', () => {
  let engine: PolicyEngine
  
  beforeEach(() => {
    engine = new PolicyEngine(mockPolicies)
  })
  
  describe('constructor', () => {
    test('creates engine with valid policies', () => {
      expect(engine).toBeInstanceOf(PolicyEngine)
    })
    
    test('throws error for invalid policies', () => {
      expect(() => {
        new PolicyEngine({ policies: 'invalid' } as any)
      }).toThrow('Invalid policies configuration')
    })
  })
  
  describe('checkAccess', () => {
    test('allows access when policy matches', async () => {
      const context: PolicyContext = {
        user: { id: 'user-123', roles: [] },
        model: 'Track',
        action: 'read',
        data: { isPublic: true }
      }
      
      const allowed = await engine.checkAccess(context)
      expect(allowed).toBe(true)
    })
    
    test('denies access when policy does not match', async () => {
      const context: PolicyContext = {
        user: { id: 'user-123', roles: [] },
        model: 'Track',
        action: 'update',
        data: { uploadedBy: 'other-user', title: 'New Title' }
      }
      
      const allowed = await engine.checkAccess(context)
      expect(allowed).toBe(false)
    })
    
    test('denies access when no policy defined', async () => {
      const context: PolicyContext = {
        user: { id: 'user-123', roles: [] },
        model: 'NonExistentModel',
        action: 'read'
      }
      
      const allowed = await engine.checkAccess(context)
      expect(allowed).toBe(false)
    })
  })
  
  describe('evaluate', () => {
    test('returns allowed: true for matching policy', async () => {
      const context: PolicyContext = {
        user: { id: 'user-123', roles: [] },
        model: 'Track',
        action: 'read',
        data: { isPublic: true }
      }
      
      const result = await engine.evaluate(context)
      
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })
    
    test('returns allowed: false with reason for non-matching policy', async () => {
      const context: PolicyContext = {
        user: { id: 'user-123', roles: [] },
        model: 'NonExistent',
        action: 'read'
      }
      
      const result = await engine.evaluate(context)
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('No policy defined')
    })
    
    test('returns field permissions for matching policy', async () => {
      const context: PolicyContext = {
        user: { id: 'user-123', roles: [] },
        model: 'Track',
        action: 'update',
        data: { uploadedBy: 'user-123' }
      }
      
      const result = await engine.evaluate(context)
      
      expect(result.allowed).toBe(true)
      expect(result.writeFields).toEqual(['title', 'description'])
    })
  })
  
  describe('applyRowFilters', () => {
    test('applies owner filter for update action', () => {
      const where = engine.applyRowFilters({
        model: 'Track',
        action: 'update',
        user: { id: 'user-123', roles: [] }
      })
      
      expect(where).toHaveProperty('uploadedBy', 'user-123')
    })
    
    test('merges with existing where clause', () => {
      const where = engine.applyRowFilters({
        model: 'Track',
        action: 'update',
        where: { isPublic: true },
        user: { id: 'user-123', roles: [] }
      })
      
      expect(where).toHaveProperty('AND')
      expect(where.AND).toBeInstanceOf(Array)
    })
    
    test('returns impossible filter when no policy exists', () => {
      const where = engine.applyRowFilters({
        model: 'NonExistent',
        action: 'read',
        user: { id: 'user-123', roles: [] }
      })
      
      expect(where).toHaveProperty('id', '__never__')
    })
  })
  
  describe('getAllowedFields', () => {
    test('returns write fields for update action', () => {
      const fields = engine.getAllowedFields({
        model: 'Track',
        action: 'update',
        user: { id: 'user-123', roles: [] }
      })
      
      expect(fields.write).toEqual(['title', 'description'])
    })
    
    test('excludes denied fields', () => {
      const fields = engine.getAllowedFields({
        model: 'User',
        action: 'update',
        user: { id: 'user-123', roles: [] }
      })
      
      expect(fields.write).toEqual(['name', 'email'])
      expect(fields.write).not.toContain('role')
      expect(fields.write).not.toContain('permissions')
    })
    
    test('returns empty arrays when no policy exists', () => {
      const fields = engine.getAllowedFields({
        model: 'NonExistent',
        action: 'read',
        user: { id: 'user-123', roles: [] }
      })
      
      expect(fields.read).toEqual([])
      expect(fields.write).toEqual([])
    })
  })
  
  describe('security', () => {
    test('fail-closed: denies access by default', async () => {
      const context: PolicyContext = {
        user: { id: 'user-123', roles: [] },
        model: 'UnknownModel',
        action: 'delete'
      }
      
      const allowed = await engine.checkAccess(context)
      expect(allowed).toBe(false)
    })
    
    test('prevents privilege escalation', async () => {
      const context: PolicyContext = {
        user: { id: 'user-123', roles: ['user'] },
        model: 'User',
        action: 'update',
        data: {
          id: 'user-123',
          role: 'admin'  // Trying to escalate
        }
      }
      
      const fields = engine.getAllowedFields({
        model: 'User',
        action: 'update',
        user: context.user
      })
      
      // 'role' should be denied
      expect(fields.write).not.toContain('role')
    })
    
    test('prevents accessing other users data', () => {
      const where = engine.applyRowFilters({
        model: 'User',
        action: 'update',
        where: { id: 'victim-id' },  // Trying to update another user
        user: { id: 'attacker-id', roles: [] }
      })
      
      // Should enforce user.id check
      expect(where.AND).toBeDefined()
    })
  })
})

