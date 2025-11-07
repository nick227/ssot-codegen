/**
 * Cloudinary Storage Plugin
 * Image and video storage with transformations
 */

import type { FeaturePlugin, PluginContext, PluginOutput, PluginRequirements, ValidationResult, HealthCheckSection } from '../plugin.interface.js'

export class CloudinaryPlugin implements FeaturePlugin {
  name = 'cloudinary'
  version = '1.0.0'
  description = 'Cloudinary media storage with transformations'
  enabled = true
  
  requirements: PluginRequirements = {
    models: { required: [], optional: [] },
    envVars: { required: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'], optional: [] },
    dependencies: { runtime: { 'cloudinary': '^2.5.1' }, dev: {} }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('storage/providers/cloudinary.provider.ts', `// @generated
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export const cloudinaryProvider = {
  async upload(buffer: Buffer, publicId?: string) {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream({ public_id: publicId }, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
      upload.end(buffer)
    })
  },
  
  async delete(publicId: string) {
    return cloudinary.uploader.destroy(publicId)
  },
  
  getUrl(publicId: string, transformations?: string) {
    return cloudinary.url(publicId, { transformation: transformations })
  }
}

export { cloudinary }
`)
    
    files.set('storage/cloudinary.ts', `// @generated\nexport { cloudinaryProvider, cloudinary } from './providers/cloudinary.provider.js'`)
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: { CLOUDINARY_CLOUD_NAME: 'your-cloud-name', CLOUDINARY_API_KEY: 'your-api-key', CLOUDINARY_API_SECRET: 'your-api-secret' },
      packageJson: { dependencies: this.requirements.dependencies!.runtime, devDependencies: {} }
    }
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'cloudinary',
      title: '📸 Cloudinary',
      icon: '📸',
      checks: [{
        id: 'cloudinary-config',
        name: 'Configuration',
        description: 'Validates Cloudinary credentials',
        testFunction: `return { success: !!process.env.CLOUDINARY_CLOUD_NAME && !!process.env.CLOUDINARY_API_KEY, message: 'Configured' }`
      }]
    }
  }
}

