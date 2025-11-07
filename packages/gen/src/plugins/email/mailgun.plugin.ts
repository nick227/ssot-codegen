/**
 * Mailgun Email Plugin
 */

import type { FeaturePlugin, PluginContext, PluginOutput, PluginRequirements, ValidationResult, HealthCheckSection } from '../plugin.interface.js'

export class MailgunPlugin implements FeaturePlugin {
  name = 'mailgun'
  version = '1.0.0'
  description = 'Mailgun email service'
  enabled = true
  
  requirements: PluginRequirements = {
    models: { required: [], optional: [] },
    envVars: { required: ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'], optional: [] },
    dependencies: { runtime: { 'mailgun.js': '^10.2.3', 'form-data': '^4.0.1' }, dev: {} }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('email/providers/mailgun.provider.ts', `// @generated
import formData from 'form-data'
import Mailgun from 'mailgun.js'

const mailgun = new Mailgun(formData)
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY! })

export const mailgunProvider = {
  async send(to: string, subject: string, html: string, from?: string) {
    return mg.messages.create(process.env.MAILGUN_DOMAIN!, {
      from: from || \`noreply@\${process.env.MAILGUN_DOMAIN}\`,
      to,
      subject,
      html
    })
  }
}
`)
    
    files.set('email/mailgun.ts', `// @generated\nexport { mailgunProvider } from './providers/mailgun.provider.js'`)
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: { MAILGUN_API_KEY: 'your-mailgun-api-key', MAILGUN_DOMAIN: 'mg.example.com' },
      packageJson: { dependencies: this.requirements.dependencies!.runtime, devDependencies: {} }
    }
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'mailgun',
      title: '📧 Mailgun',
      icon: '📧',
      checks: [{
        id: 'mailgun-config',
        name: 'Configuration',
        description: 'Validates Mailgun credentials',
        testFunction: `return { success: !!process.env.MAILGUN_API_KEY && !!process.env.MAILGUN_DOMAIN, message: 'Configured' }`
      }]
    }
  }
}

