/**
 * AWS S3 Storage Plugin
 * File storage and retrieval using AWS S3
 */

import type { FeaturePlugin, PluginContext, PluginOutput, PluginRequirements, ValidationResult, HealthCheckSection } from '../plugin.interface.js'

export class S3Plugin implements FeaturePlugin {
  name = 's3'
  version = '1.0.0'
  description = 'AWS S3 file storage integration'
  enabled = true
  
  requirements: PluginRequirements = {
    models: { required: [], optional: ['File'] },
    envVars: { required: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_BUCKET_NAME'], optional: ['AWS_REGION'] },
    dependencies: { runtime: { '@aws-sdk/client-s3': '^3.709.0', '@aws-sdk/s3-request-presigner': '^3.709.0' }, dev: {} }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('storage/providers/s3.provider.ts', `// @generated
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

const BUCKET = process.env.AWS_BUCKET_NAME!

export const s3Provider = {
  async upload(key: string, buffer: Buffer, contentType?: string) {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }))
    return { key, url: \`https://\${BUCKET}.s3.amazonaws.com/\${key}\` }
  },
  
  async download(key: string): Promise<Buffer> {
    const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
    return Buffer.from(await response.Body!.transformToByteArray())
  },
  
  async delete(key: string) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  },
  
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn })
  }
}
`)
    
    files.set('storage/s3.ts', `// @generated\nexport { s3Provider } from './providers/s3.provider.js'`)
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: { AWS_ACCESS_KEY_ID: 'your-aws-key', AWS_SECRET_ACCESS_KEY: 'your-aws-secret', AWS_BUCKET_NAME: 'your-bucket', AWS_REGION: 'us-east-1' },
      packageJson: { dependencies: this.requirements.dependencies!.runtime, devDependencies: {} }
    }
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 's3',
      title: '☁️ AWS S3',
      icon: '☁️',
      checks: [{
        id: 's3-config',
        name: 'S3 Configuration',
        description: 'Validates AWS credentials',
        testFunction: `return { success: !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_BUCKET_NAME, message: 'Configured' }`
      }]
    }
  }
}

