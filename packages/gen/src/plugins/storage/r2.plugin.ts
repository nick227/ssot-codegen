/**
 * Cloudflare R2 Storage Plugin
 * S3-compatible storage without egress fees
 */

import type { FeaturePlugin, PluginContext, PluginOutput, PluginRequirements, ValidationResult, HealthCheckSection } from '../plugin.interface.js'

export class R2Plugin implements FeaturePlugin {
  name = 'r2'
  version = '1.0.0'
  description = 'Cloudflare R2 storage (S3-compatible)'
  enabled = true
  
  requirements: PluginRequirements = {
    models: { required: [], optional: [] },
    envVars: { required: ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_ACCOUNT_ID'], optional: [] },
    dependencies: { runtime: { '@aws-sdk/client-s3': '^3.709.0' }, dev: {} }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('storage/providers/r2.provider.ts', `// @generated
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: \`https://\${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com\`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
})

const BUCKET = process.env.R2_BUCKET_NAME!

export const r2Provider = {
  async upload(key: string, buffer: Buffer, contentType?: string) {
    await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: contentType }))
    return { key, url: \`https://pub-\${process.env.R2_ACCOUNT_ID}.r2.dev/\${key}\` }
  },
  
  async download(key: string): Promise<Buffer> {
    const response = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    return Buffer.from(await response.Body!.transformToByteArray())
  },
  
  async delete(key: string) {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  }
}
`)
    
    files.set('storage/r2.ts', `// @generated\nexport { r2Provider } from './providers/r2.provider.js'`)
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: { R2_ACCESS_KEY_ID: 'your-r2-key', R2_SECRET_ACCESS_KEY: 'your-r2-secret', R2_BUCKET_NAME: 'your-bucket', R2_ACCOUNT_ID: 'your-account-id' },
      packageJson: { dependencies: this.requirements.dependencies!.runtime, devDependencies: {} }
    }
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'r2',
      title: '☁️ Cloudflare R2',
      icon: '☁️',
      checks: [{
        id: 'r2-config',
        name: 'R2 Configuration',
        description: 'Validates R2 credentials',
        testFunction: `return { success: !!process.env.R2_ACCESS_KEY_ID && !!process.env.R2_BUCKET_NAME, message: 'Configured' }`
      }]
    }
  }
}

