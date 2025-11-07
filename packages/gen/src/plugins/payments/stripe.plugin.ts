/**
 * Stripe Payment Plugin
 * Payment processing with Stripe
 */

import type { FeaturePlugin, PluginContext, PluginOutput, PluginRequirements, ValidationResult, HealthCheckSection } from '../plugin.interface.js'

export class StripePlugin implements FeaturePlugin {
  name = 'stripe'
  version = '1.0.0'
  description = 'Stripe payment processing'
  enabled = true
  
  requirements: PluginRequirements = {
    models: { required: [], optional: ['Payment', 'Subscription'] },
    envVars: { required: ['STRIPE_SECRET_KEY'], optional: ['STRIPE_WEBHOOK_SECRET'] },
    dependencies: { runtime: { 'stripe': '^17.4.0' }, dev: {} }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('payments/providers/stripe.provider.ts', `// @generated
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-20.acacia' })

export const stripeProvider = {
  async createPaymentIntent(amount: number, currency = 'usd') {
    return stripe.paymentIntents.create({ amount, currency })
  },
  
  async createCustomer(email: string, name?: string) {
    return stripe.customers.create({ email, name })
  },
  
  async createSubscription(customerId: string, priceId: string) {
    return stripe.subscriptions.create({ customer: customerId, items: [{ price: priceId }] })
  },
  
  async cancelSubscription(subscriptionId: string) {
    return stripe.subscriptions.cancel(subscriptionId)
  }
}

export { stripe }
`)
    
    files.set('payments/stripe.ts', `// @generated\nexport { stripeProvider, stripe } from './providers/stripe.provider.js'`)
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: { STRIPE_SECRET_KEY: 'sk_test_your-stripe-key', STRIPE_WEBHOOK_SECRET: 'whsec_your-webhook-secret' },
      packageJson: { dependencies: this.requirements.dependencies!.runtime, devDependencies: {} }
    }
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'stripe',
      title: '💳 Stripe',
      icon: '💳',
      checks: [{
        id: 'stripe-key',
        name: 'API Key',
        description: 'Validates STRIPE_SECRET_KEY',
        testFunction: `return { success: !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_'), message: 'Configured' }`
      }]
    }
  }
}

