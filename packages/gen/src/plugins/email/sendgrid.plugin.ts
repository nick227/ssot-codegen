/**
 * SendGrid Email Plugin
 */

import type { FeaturePlugin, PluginContext, PluginOutput, PluginRequirements, ValidationResult, HealthCheckSection } from '../plugin.interface.js'

export class SendGridPlugin implements FeaturePlugin {
  name = 'sendgrid'
  version = '1.0.0'
  description = 'SendGrid email service'
  enabled = true
  
  requirements: PluginRequirements = {
    models: { required: [], optional: [] },
    envVars: { required: ['SENDGRID_API_KEY'], optional: ['SENDGRID_FROM_EMAIL'] },
    dependencies: { runtime: { '@sendgrid/mail': '^8.1.4' }, dev: {} }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('email/providers/sendgrid.provider.ts', `// @generated
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export const sendgridProvider = {
  async send(to: string, subject: string, html: string, from?: string) {
    return sgMail.send({
      to,
      from: from || process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
      subject,
      html
    })
  },
  
  async sendTemplate(to: string, templateId: string, data: Record<string, unknown>) {
    return sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
      templateId,
      dynamicTemplateData: data
    })
  }
}
`)
    
    files.set('email/sendgrid.ts', `// @generated\nexport { sendgridProvider } from './providers/sendgrid.provider.js'`)
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: { SENDGRID_API_KEY: 'SG.your-sendgrid-key', SENDGRID_FROM_EMAIL: 'noreply@example.com' },
      packageJson: { dependencies: this.requirements.dependencies!.runtime, devDependencies: {} }
    }
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'sendgrid',
      title: '📧 SendGrid',
      icon: '📧',
      checks: [{
        id: 'sendgrid-key',
        name: 'API Key',
        description: 'Validates SENDGRID_API_KEY',
        testFunction: `return { success: !!process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.'), message: 'Configured' }`
      }]
    }
  }
}

