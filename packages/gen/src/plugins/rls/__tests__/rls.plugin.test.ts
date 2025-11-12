/**
 * RLS Plugin Tests
 * 
 * Test the RLS plugin generation and conventions
 */

import { describe, it, expect } from 'vitest'
import { RlsPlugin } from '../rls.plugin.js'
import type { PluginContext } from '../../plugin.interface.js'

describe('RlsPlugin', () => {
  const mockContext: PluginContext = {
    schema: {
      models: [
        {
          name: 'Track',
          fields: [
            { name: 'id', type: 'String', isRequired: true, isList: false, isRelation: false },
            { name: 'title', type: 'String', isRequired: true, isList: false, isRelation: false },
            { name: 'uploadedBy', type: 'String', isRequired: true, isList: false, isRelation: false },
            { name: 'isPublic', type: 'Boolean', isRequired: true, isList: false, isRelation: false }
          ],
          documentation: 'User uploaded tracks'
        },
        {
          name: 'User',
          fields: [
            { name: 'id', type: 'String', isRequired: true, isList: false, isRelation: false },
            { name: 'email', type: 'String', isRequired: true, isList: false, isRelation: false },
            { name: 'role', type: 'String', isRequired: false, isList: false, isRelation: false }
          ],
          documentation: 'Application users'
        }
      ]
    },
    projectName: 'test-project',
    framework: 'express',
    outputDir: '/tmp/test',
    config: {}
  }
  
  it('should create plugin with defaults', () => {
    const plugin = new RlsPlugin()
    
    expect(plugin.name).toBe('rls')
    expect(plugin.version).toBe('1.0.0')
    expect(plugin.enabled).toBe(true)
  })
  
  it('should validate successfully with User model', () => {
    const plugin = new RlsPlugin()
    const result = plugin.validate(mockContext)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
  
  it('should warn when no User model exists', () => {
    const plugin = new RlsPlugin()
    const contextWithoutUser: PluginContext = {
      ...mockContext,
      schema: {
        models: mockContext.schema.models.filter(m => m.name !== 'User')
      }
    }
    
    const result = plugin.validate(contextWithoutUser)
    
    expect(result.valid).toBe(true)  // Still valid, just warning
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('No User model')
  })
  
  it('should generate RLS middleware', () => {
    const plugin = new RlsPlugin()
    const output = plugin.generate(mockContext)
    
    expect(output.files.has('middleware/rls.ts')).toBe(true)
    
    const rlsMiddleware = output.files.get('middleware/rls.ts')!
    expect(rlsMiddleware).toContain('applyRLS')
    expect(rlsMiddleware).toContain('admin')  // Admin bypass
    expect(rlsMiddleware).toContain('uploadedBy')  // Owner field
    expect(rlsMiddleware).toContain('isPublic')  // Public field
  })
  
  it('should generate permissions middleware', () => {
    const plugin = new RlsPlugin()
    const output = plugin.generate(mockContext)
    
    expect(output.files.has('middleware/permissions.ts')).toBe(true)
    
    const permMiddleware = output.files.get('middleware/permissions.ts')!
    expect(permMiddleware).toContain('checkFieldPermission')
    expect(permMiddleware).toContain('getAllowedFields')
    expect(permMiddleware).toContain('password')  // Sensitive field
  })
  
  it('should generate default policies', () => {
    const plugin = new RlsPlugin()
    const output = plugin.generate(mockContext)
    
    expect(output.files.has('config/policies.json')).toBe(true)
    
    const policies = output.files.get('config/policies.json')!
    const parsed = JSON.parse(policies)
    
    expect(parsed.policies).toHaveLength(2)  // Track + User
    expect(parsed.policies[0].model).toBe('Track')
    expect(parsed.policies[0].rules).toBeDefined()
  })
  
  it('should generate types', () => {
    const plugin = new RlsPlugin()
    const output = plugin.generate(mockContext)
    
    expect(output.files.has('types/rls.types.ts')).toBe(true)
    
    const types = output.files.get('types/rls.types.ts')!
    expect(types).toContain('export interface User')
    expect(types).toContain('RlsAction')
  })
  
  it('should register middleware', () => {
    const plugin = new RlsPlugin()
    const output = plugin.generate(mockContext)
    
    expect(output.middleware).toHaveLength(1)
    expect(output.middleware[0].name).toBe('rlsFilter')
    expect(output.middleware[0].importPath).toBe('@/middleware/rls')
    expect(output.middleware[0].global).toBe(false)  // Applied per-route
  })
  
  it('should include expressions dependency', () => {
    const plugin = new RlsPlugin()
    const output = plugin.generate(mockContext)
    
    expect(output.packageJson?.dependencies).toEqual({
      '@ssot-ui/expressions': 'workspace:*'
    })
  })
  
  it('should provide health check', () => {
    const plugin = new RlsPlugin()
    const healthCheck = plugin.healthCheck!(mockContext)
    
    expect(healthCheck.id).toBe('rls')
    expect(healthCheck.title).toBe('Row-Level Security')
    expect(healthCheck.checks.length).toBeGreaterThan(0)
  })
  
  it('should handle custom owner fields', () => {
    const plugin = new RlsPlugin({
      ownerFields: ['customOwner']
    })
    const output = plugin.generate(mockContext)
    
    const rlsMiddleware = output.files.get('middleware/rls.ts')!
    expect(rlsMiddleware).toContain('customOwner')
  })
  
  it('should handle custom admin role', () => {
    const plugin = new RlsPlugin({
      adminRole: 'superadmin'
    })
    const output = plugin.generate(mockContext)
    
    const rlsMiddleware = output.files.get('middleware/rls.ts')!
    expect(rlsMiddleware).toContain('superadmin')
  })
})

