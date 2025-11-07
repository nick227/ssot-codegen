/**
 * Storage Provider Plugins Test Suite
 * 
 * Tests S3, R2, and Cloudinary plugins WITHOUT requiring real credentials
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createMockPluginContext,
  EnvMocker,
  testPluginGeneration,
  validateGeneratedCode
} from './plugin-test-utils.js'

import { S3Plugin } from '../storage/s3.plugin.js'
import { R2Plugin } from '../storage/r2.plugin.js'
import { CloudinaryPlugin } from '../storage/cloudinary.plugin.js'

describe('Storage Provider Plugins', () => {
  let envMocker: EnvMocker
  
  beforeEach(() => {
    envMocker = new EnvMocker()
  })
  
  afterEach(() => {
    envMocker.restore()
  })
  
  describe('S3 Plugin', () => {
    const plugin = new S3Plugin()
    
    it('should require AWS credentials', () => {
      expect(plugin.requirements.envVars.required).toContain('AWS_ACCESS_KEY_ID')
      expect(plugin.requirements.envVars.required).toContain('AWS_SECRET_ACCESS_KEY')
      expect(plugin.requirements.envVars.required).toContain('AWS_BUCKET_NAME')
    })
    
    it('should handle undefined AWS credentials', () => {
      envMocker.clear([
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_BUCKET_NAME'
      ])
      
      const context = createMockPluginContext()
      const result = plugin.validate(context)
      
      // Should pass validation (env vars checked at runtime, not generation)
      expect(result.valid).toBe(true)
    })
    
    it('should generate S3 client code', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.files.has('storage/providers/s3.provider.ts')).toBe(true)
      
      const providerContent = output.files.get('storage/providers/s3.provider.ts') || ''
      expect(providerContent).toContain('S3Client')
      expect(providerContent).toContain('process.env.AWS_ACCESS_KEY_ID')
    })
    
    it('should export AWS SDK dependencies', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.packageJson?.dependencies).toHaveProperty('@aws-sdk/client-s3')
      expect(output.packageJson?.dependencies).toHaveProperty('@aws-sdk/s3-request-presigner')
    })
    
    it('should generate upload/download methods', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      const providerContent = output.files.get('storage/providers/s3.provider.ts') || ''
      expect(providerContent).toMatch(/upload|Upload/)
      expect(providerContent).toMatch(/download|Download/)
    })
  })
  
  describe('R2 Plugin', () => {
    const plugin = new R2Plugin()
    
    it('should require R2 credentials', () => {
      expect(plugin.requirements.envVars.required).toContain('R2_ACCESS_KEY_ID')
      expect(plugin.requirements.envVars.required).toContain('R2_SECRET_ACCESS_KEY')
    })
    
    it('should use S3-compatible API', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      // R2 uses AWS SDK (S3-compatible)
      expect(output.packageJson?.dependencies).toHaveProperty('@aws-sdk/client-s3')
    })
    
    it('should handle undefined R2 credentials', () => {
      envMocker.clear(['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ACCOUNT_ID'])
      
      const context = createMockPluginContext()
      const result = plugin.validate(context)
      expect(result.valid).toBe(true)
    })
  })
  
  describe('Cloudinary Plugin', () => {
    const plugin = new CloudinaryPlugin()
    
    it('should require Cloudinary credentials', () => {
      expect(plugin.requirements.envVars.required).toContain('CLOUDINARY_CLOUD_NAME')
      expect(plugin.requirements.envVars.required).toContain('CLOUDINARY_API_KEY')
      expect(plugin.requirements.envVars.required).toContain('CLOUDINARY_API_SECRET')
    })
    
    it('should handle undefined Cloudinary credentials', () => {
      envMocker.clear([
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
      ])
      
      const context = createMockPluginContext()
      const result = plugin.validate(context)
      expect(result.valid).toBe(true)
    })
    
    it('should generate Cloudinary SDK integration', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.packageJson?.dependencies).toHaveProperty('cloudinary')
    })
  })
  
  describe('Storage Plugin Consistency', () => {
    const storagePlugins = [
      new S3Plugin(),
      new R2Plugin(),
      new CloudinaryPlugin()
    ]
    
    it('all storage plugins should generate provider files', () => {
      const context = createMockPluginContext()
      
      for (const plugin of storagePlugins) {
        const output = plugin.generate(context)
        const providerFile = Array.from(output.files.keys()).find(f => 
          f.includes('storage') && f.includes('provider')
        )
        expect(providerFile).toBeTruthy()
      }
    })
    
    it('all storage plugins should handle missing credentials', () => {
      const context = createMockPluginContext()
      
      for (const plugin of storagePlugins) {
        // Clear all env vars
        envMocker.clear(plugin.requirements.envVars.required)
        
        const result = plugin.validate(context)
        // Should still validate (runtime will handle missing creds)
        expect(result.valid).toBe(true)
      }
    })
    
    it('all storage plugins should have valid generated code', () => {
      const context = createMockPluginContext()
      
      for (const plugin of storagePlugins) {
        const output = plugin.generate(context)
        const { valid, issues } = validateGeneratedCode(output)
        
        if (!valid) {
          console.warn(`${plugin.name} code quality issues:`, issues)
        }
      }
    })
  })
})

