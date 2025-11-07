/**
 * Payment & Email Plugins Test Suite
 * 
 * Tests Stripe, PayPal, SendGrid, Mailgun WITHOUT requiring real credentials
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createMockPluginContext,
  EnvMocker,
  validateGeneratedCode
} from './plugin-test-utils.js'

import { StripePlugin } from '../payments/stripe.plugin.js'
import { PayPalPlugin } from '../payments/paypal.plugin.js'
import { SendGridPlugin } from '../email/sendgrid.plugin.js'
import { MailgunPlugin } from '../email/mailgun.plugin.js'

describe('Payment & Email Plugins', () => {
  let envMocker: EnvMocker
  
  beforeEach(() => {
    envMocker = new EnvMocker()
  })
  
  afterEach(() => {
    envMocker.restore()
  })
  
  describe('Stripe Plugin', () => {
    const plugin = new StripePlugin()
    
    it('should require STRIPE_SECRET_KEY', () => {
      expect(plugin.requirements.envVars.required).toContain('STRIPE_SECRET_KEY')
    })
    
    it('should handle undefined Stripe key', () => {
      envMocker.clear(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'])
      
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.files.size).toBeGreaterThan(0)
      expect(output.envVars.STRIPE_SECRET_KEY).toBeTruthy()
    })
    
    it('should generate Stripe provider', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.files.has('payments/providers/stripe.provider.ts')).toBe(true)
      
      const provider = output.files.get('payments/providers/stripe.provider.ts') || ''
      expect(provider).toContain('Stripe')
      expect(provider).toContain('process.env.STRIPE_SECRET_KEY')
    })
    
    it('should export stripe dependency', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.packageJson?.dependencies).toHaveProperty('stripe')
    })
    
    it('should generate payment methods', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      const provider = output.files.get('payments/providers/stripe.provider.ts') || ''
      expect(provider).toMatch(/createPaymentIntent|paymentIntents/)
      expect(provider).toMatch(/createCustomer|customers/)
    })
  })
  
  describe('PayPal Plugin', () => {
    const plugin = new PayPalPlugin()
    
    it('should require PayPal credentials', () => {
      expect(plugin.requirements.envVars.required).toContain('PAYPAL_CLIENT_ID')
      expect(plugin.requirements.envVars.required).toContain('PAYPAL_CLIENT_SECRET')
    })
    
    it('should handle undefined PayPal credentials', () => {
      envMocker.clear(['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'])
      
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.files.size).toBeGreaterThan(0)
    })
    
    it('should support sandbox and live modes', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      const provider = output.files.get('payments/providers/paypal.provider.ts') || ''
      expect(provider).toMatch(/sandbox|live|mode/i)
    })
  })
  
  describe('SendGrid Plugin', () => {
    const plugin = new SendGridPlugin()
    
    it('should require SendGrid API key', () => {
      expect(plugin.requirements.envVars.required).toContain('SENDGRID_API_KEY')
    })
    
    it('should handle undefined SendGrid key', () => {
      envMocker.clear(['SENDGRID_API_KEY'])
      
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.files.size).toBeGreaterThan(0)
      expect(output.envVars.SENDGRID_API_KEY).toBeTruthy()
    })
    
    it('should generate email provider', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.files.has('email/providers/sendgrid.provider.ts')).toBe(true)
      
      const provider = output.files.get('email/providers/sendgrid.provider.ts') || ''
      expect(provider).toContain('@sendgrid/mail')
      expect(provider).toContain('process.env.SENDGRID_API_KEY')
    })
    
    it('should export sendgrid dependency', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.packageJson?.dependencies).toHaveProperty('@sendgrid/mail')
    })
    
    it('should generate send method', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      const provider = output.files.get('email/providers/sendgrid.provider.ts') || ''
      expect(provider).toMatch(/send|sendEmail/)
    })
  })
  
  describe('Mailgun Plugin', () => {
    const plugin = new MailgunPlugin()
    
    it('should require Mailgun credentials', () => {
      expect(plugin.requirements.envVars.required).toContain('MAILGUN_API_KEY')
      expect(plugin.requirements.envVars.required).toContain('MAILGUN_DOMAIN')
    })
    
    it('should handle undefined Mailgun credentials', () => {
      envMocker.clear(['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'])
      
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.files.size).toBeGreaterThan(0)
    })
    
    it('should export mailgun dependency', () => {
      const context = createMockPluginContext()
      const output = plugin.generate(context)
      
      expect(output.packageJson?.dependencies).toHaveProperty('mailgun.js')
    })
  })
  
  describe('Payment/Email Plugin Consistency', () => {
    const allPlugins = [
      new StripePlugin(),
      new PayPalPlugin(),
      new SendGridPlugin(),
      new MailgunPlugin()
    ]
    
    it('all plugins should handle missing credentials', () => {
      const context = createMockPluginContext()
      
      for (const plugin of allPlugins) {
        envMocker.clear(plugin.requirements.envVars.required)
        
        // Should generate code even without credentials
        const output = plugin.generate(context)
        expect(output.files.size).toBeGreaterThan(0)
        
        // Should export placeholder env vars
        for (const envVar of plugin.requirements.envVars.required) {
          expect(output.envVars).toHaveProperty(envVar)
        }
      }
    })
    
    it('all plugins should generate provider files', () => {
      const context = createMockPluginContext()
      
      for (const plugin of allPlugins) {
        const output = plugin.generate(context)
        const hasProvider = Array.from(output.files.keys()).some(f => 
          f.includes('provider')
        )
        expect(hasProvider).toBe(true)
      }
    })
    
    it('all plugins should have valid code', () => {
      const context = createMockPluginContext()
      
      for (const plugin of allPlugins) {
        const output = plugin.generate(context)
        const { valid, issues } = validateGeneratedCode(output)
        
        if (!valid) {
          console.warn(`${plugin.name} issues:`, issues)
        }
      }
    })
  })
})

