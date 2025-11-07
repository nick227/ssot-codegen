/**
 * PayPal Payment Plugin
 */

import type { FeaturePlugin, PluginContext, PluginOutput, PluginRequirements, ValidationResult, HealthCheckSection } from '../plugin.interface.js'

export class PayPalPlugin implements FeaturePlugin {
  name = 'paypal'
  version = '1.0.0'
  description = 'PayPal payment processing'
  enabled = true
  
  requirements: PluginRequirements = {
    models: { required: [], optional: [] },
    envVars: { required: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'], optional: ['PAYPAL_MODE'] },
    dependencies: { runtime: { '@paypal/checkout-server-sdk': '^1.0.3' }, dev: {} }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('payments/providers/paypal.provider.ts', `// @generated
import paypal from '@paypal/checkout-server-sdk'

const environment = process.env.PAYPAL_MODE === 'live' 
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)

const client = new paypal.core.PayPalHttpClient(environment)

export const paypalProvider = {
  async createOrder(amount: number, currency = 'USD') {
    const request = new paypal.orders.OrdersCreateRequest()
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: amount.toString() } }]
    })
    return client.execute(request)
  },
  
  async captureOrder(orderId: string) {
    const request = new paypal.orders.OrdersCaptureRequest(orderId)
    return client.execute(request)
  }
}
`)
    
    files.set('payments/paypal.ts', `// @generated\nexport { paypalProvider } from './providers/paypal.provider.js'`)
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: { PAYPAL_CLIENT_ID: 'your-client-id', PAYPAL_CLIENT_SECRET: 'your-secret', PAYPAL_MODE: 'sandbox' },
      packageJson: { dependencies: this.requirements.dependencies!.runtime, devDependencies: {} }
    }
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'paypal',
      title: '💰 PayPal',
      icon: '💰',
      checks: [{
        id: 'paypal-config',
        name: 'Configuration',
        description: 'Validates PayPal credentials',
        testFunction: `return { success: !!process.env.PAYPAL_CLIENT_ID, message: 'Configured' }`
      }]
    }
  }
}

