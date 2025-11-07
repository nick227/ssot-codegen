/**
 * Plugin Output Snapshot Tests
 * Ensures plugin-generated code remains consistent across changes
 */

import { describe, it, expect } from 'vitest'
import { OpenAIPlugin } from '../ai/openai.plugin.js'
import { GoogleAuthPlugin } from '../auth/google-auth.plugin.js'
import { StripePlugin } from '../payments/stripe.plugin.js'
import { S3Plugin } from '../storage/s3.plugin.js'
import { SendGridPlugin } from '../email/sendgrid.plugin.js'
import { createMockPluginContext } from './plugin-test-utils.js'

describe('Plugin Output Snapshots', () => {
  const mockContext = createMockPluginContext()
  
  describe('OpenAI Plugin', () => {
    it('should match OpenAI service file snapshot', () => {
      const plugin = new OpenAIPlugin({ defaultModel: 'gpt-4' })
      const output = plugin.generate(mockContext)
      
      // OpenAI plugin generates ai/services/openai.service.ts
      const serviceFile = output.files.get('ai/services/openai.service.ts')
      expect(serviceFile).toBeDefined()
      expect(serviceFile).toMatchSnapshot()
    })
    
    it('should match OpenAI env vars snapshot', () => {
      const plugin = new OpenAIPlugin()
      const output = plugin.generate(mockContext)
      
      expect(output.envVars).toMatchSnapshot()
    })
    
    it('should match OpenAI dependencies snapshot', () => {
      const plugin = new OpenAIPlugin()
      const output = plugin.generate(mockContext)
      
      expect(output.packageJson).toMatchSnapshot()
    })
  })
  
  describe('Google Auth Plugin', () => {
    it('should match Google OAuth strategy snapshot', () => {
      const plugin = new GoogleAuthPlugin({
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        strategy: 'jwt'
      })
      const output = plugin.generate(mockContext)
      
      const strategyFile = output.files.get('auth/strategies/google.strategy.ts')
      expect(strategyFile).toBeDefined()
      expect(strategyFile).toMatchSnapshot()
    })
    
    it('should match OAuth routes snapshot', () => {
      const plugin = new GoogleAuthPlugin({
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        strategy: 'jwt'
      })
      const output = plugin.generate(mockContext)
      
      const routesFile = output.files.get('auth/routes/auth.routes.ts')
      expect(routesFile).toBeDefined()
      expect(routesFile).toMatchSnapshot()
    })
    
    it('should match JWT utilities snapshot', () => {
      const plugin = new GoogleAuthPlugin({
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        strategy: 'jwt'
      })
      const output = plugin.generate(mockContext)
      
      const jwtFile = output.files.get('auth/utils/jwt.util.ts')
      expect(jwtFile).toBeDefined()
      expect(jwtFile).toMatchSnapshot()
    })
    
    it('should match auth middleware snapshot', () => {
      const plugin = new GoogleAuthPlugin({
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        strategy: 'jwt'
      })
      const output = plugin.generate(mockContext)
      
      const middlewareFile = output.files.get('auth/middleware/auth.middleware.ts')
      expect(middlewareFile).toBeDefined()
      expect(middlewareFile).toMatchSnapshot()
    })
  })
  
  describe('Stripe Plugin', () => {
    it('should match Stripe provider snapshot', () => {
      const plugin = new StripePlugin()
      const output = plugin.generate(mockContext)
      
      // Get first file from output (actual path may vary)
      const firstFile = Array.from(output.files.values())[0]
      expect(firstFile).toBeDefined()
      expect(firstFile).toMatchSnapshot()
    })
    
    it('should generate consistent file structure', () => {
      const plugin = new StripePlugin()
      const output = plugin.generate(mockContext)
      
      const fileNames = Array.from(output.files.keys())
      expect(fileNames).toMatchSnapshot('stripe-files')
    })
  })
  
  describe('S3 Plugin', () => {
    it('should match S3 file structure snapshot', () => {
      const plugin = new S3Plugin({
        region: 'us-east-1',
        bucket: 'test-bucket'
      })
      const output = plugin.generate(mockContext)
      
      const fileNames = Array.from(output.files.keys())
      expect(fileNames).toMatchSnapshot('s3-files')
    })
    
    it('should generate consistent S3 provider code', () => {
      const plugin = new S3Plugin({
        region: 'us-east-1',
        bucket: 'test-bucket'
      })
      const output = plugin.generate(mockContext)
      
      const firstFile = Array.from(output.files.values())[0]
      expect(firstFile).toContain('@generated')
      expect(firstFile).toContain('S3')
    })
  })
  
  describe('SendGrid Plugin', () => {
    it('should match SendGrid file structure snapshot', () => {
      const plugin = new SendGridPlugin({
        fromEmail: 'test@example.com'
      })
      const output = plugin.generate(mockContext)
      
      const fileNames = Array.from(output.files.keys())
      expect(fileNames).toMatchSnapshot('sendgrid-files')
    })
  })
  
  describe('Plugin Structure Consistency', () => {
    const plugins = [
      { name: 'OpenAI', instance: new OpenAIPlugin() },
      { name: 'Google Auth', instance: new GoogleAuthPlugin({ clientId: 'test', clientSecret: 'test' }) },
      { name: 'Stripe', instance: new StripePlugin() },
      { name: 'S3', instance: new S3Plugin() },
      { name: 'SendGrid', instance: new SendGridPlugin() }
    ]
    
    for (const { name, instance } of plugins) {
      it(`${name} should have consistent output structure`, () => {
        const output = instance.generate(mockContext)
        
        // All plugins must return these
        expect(output).toHaveProperty('files')
        expect(output).toHaveProperty('envVars')
        expect(output).toHaveProperty('packageJson')
        
        // Files must be a Map
        expect(output.files).toBeInstanceOf(Map)
        
        // Env vars must be an object
        expect(typeof output.envVars).toBe('object')
        
        // Package json must have dependencies
        expect(output.packageJson).toHaveProperty('dependencies')
      })
      
      it(`${name} should generate valid file paths`, () => {
        const output = instance.generate(mockContext)
        
        for (const filename of output.files.keys()) {
          // Should be valid relative paths
          expect(filename).not.toMatch(/^\//)  // No absolute paths
          expect(filename).not.toMatch(/\\/)   // No backslashes
          expect(filename).toMatch(/\.ts$/)    // Must be TypeScript
        }
      })
      
      it(`${name} should generate non-empty files`, () => {
        const output = instance.generate(mockContext)
        
        for (const [filename, content] of output.files) {
          expect(content.length).toBeGreaterThan(50)  // Not trivial
          expect(content).toContain('// @generated')   // Has marker
        }
      })
    }
  })
})

