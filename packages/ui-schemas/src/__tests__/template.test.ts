import { describe, it, expect } from 'vitest'
import { validateTemplate, validateTemplateRules } from '../schemas/template.js'

describe('Template Schema', () => {
  describe('Basic Validation', () => {
    it('should validate valid template', () => {
      const template = {
        version: '1.0.0',
        runtimeVersion: '^3.0.0',
        name: 'test-template',
        pages: [
          {
            type: 'list',
            route: '/posts',
            runtime: 'server',
            model: 'post'
          }
        ]
      }
      
      const result = validateTemplate(template)
      expect(result.valid).toBe(true)
    })
    
    it('should reject invalid version', () => {
      const template = {
        version: 'invalid',
        runtimeVersion: '^3.0.0',
        name: 'test',
        pages: [{ type: 'list', route: '/', runtime: 'server', model: 'test' }]
      }
      
      const result = validateTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path === 'version')).toBe(true)
    })
    
    it('should require at least one page', () => {
      const template = {
        version: '1.0.0',
        runtimeVersion: '^3.0.0',
        name: 'test',
        pages: []
      }
      
      const result = validateTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('At least one page required'))).toBe(true)
    })
  })
  
  describe('Page Type Discrimination', () => {
    it('should validate list page', () => {
      const template = {
        version: '1.0.0',
        runtimeVersion: '^3.0.0',
        name: 'test',
        pages: [{
          type: 'list',
          route: '/posts',
          runtime: 'server',
          model: 'post',
          pagination: { type: 'cursor', defaultSize: 20 }
        }]
      }
      
      const result = validateTemplate(template)
      expect(result.valid).toBe(true)
    })
    
    it('should validate detail page', () => {
      const template = {
        version: '1.0.0',
        runtimeVersion: '^3.0.0',
        name: 'test',
        pages: [{
          type: 'detail',
          route: '/posts/:id',
          runtime: 'server',
          model: 'post',
          fields: [
            { field: 'title', label: 'Title', format: 'text' }
          ]
        }]
      }
      
      const result = validateTemplate(template)
      expect(result.valid).toBe(true)
    })
    
    it('should validate form page', () => {
      const template = {
        version: '1.0.0',
        runtimeVersion: '^3.0.0',
        name: 'test',
        pages: [{
          type: 'form',
          route: '/posts/new',
          runtime: 'client', // Must be client
          model: 'post',
          mode: 'create',
          fields: [
            { name: 'title', label: 'Title', type: 'text' }
          ]
        }]
      }
      
      const result = validateTemplate(template)
      expect(result.valid).toBe(true)
    })
    
    it('should reject form page with server runtime', () => {
      const template = {
        version: '1.0.0',
        runtimeVersion: '^3.0.0',
        name: 'test',
        pages: [{
          type: 'form',
          route: '/posts/new',
          runtime: 'server', // Invalid - forms must be client
          model: 'post',
          mode: 'create',
          fields: []
        }]
      }
      
      const result = validateTemplate(template)
      expect(result.valid).toBe(false)
    })
  })
  
  describe('Template Rules', () => {
    it('should warn about HTML fields without sanitize policy', () => {
      const template = {
        version: '1.0.0',
        runtimeVersion: '^3.0.0',
        name: 'test',
        pages: [{
          type: 'detail',
          route: '/posts/:id',
          runtime: 'server',
          model: 'post',
          fields: [
            { field: 'content', label: 'Content', format: 'html' } // Missing sanitizePolicy
          ]
        }]
      }
      
      const warnings = validateTemplateRules(template as any)
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings.some(w => w.includes('sanitizePolicy'))).toBe(true)
    })
  })
})

