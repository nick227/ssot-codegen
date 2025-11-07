/**
 * Example Plugin v2 - Demonstrates new capabilities
 * 
 * This example shows how to use:
 * - Template overrides
 * - Lifecycle hooks
 * - Configuration schema
 * - Plugin dependencies
 * - Custom phases
 */

import type {
  FeaturePluginV2,
  PluginContextV2,
  PluginOutputV2,
  ValidationResultV2,
  PluginRequirementsV2,
  PluginConfigSchema,
  TemplateRegistry,
  PluginLifecycleHooks
} from '../plugin-v2.interface.js'
import type { ParsedSchema, ParsedModel } from '../../dmmf-parser.js'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '@/pipeline/phase-runner.js'

/**
 * Example custom phase
 */
class ExampleCustomPhase extends GenerationPhase {
  readonly name = 'exampleCustom'
  readonly order = 13  // After all standard phases
  
  getDescription(): string {
    return 'Running example custom phase'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { logger } = context
    logger.debug('Example custom phase executed')
    
    return {
      success: true
    }
  }
}

/**
 * Example plugin using v2 API
 */
export class ExampleV2Plugin implements FeaturePluginV2 {
  name = 'example-v2'
  version = '2.0.0'
  description = 'Example plugin demonstrating v2 capabilities'
  enabled = true
  
  // Plugin depends on another plugin
  dependencies = ['google-auth']  // Example dependency
  
  // Configuration schema
  configSchema: PluginConfigSchema = {
    type: 'object',
    properties: {
      apiKey: {
        type: 'string',
        description: 'API key for the service',
        pattern: '^[A-Za-z0-9_-]+$'
      },
      maxRetries: {
        type: 'number',
        description: 'Maximum retry attempts',
        minimum: 0,
        maximum: 10,
        default: 3
      },
      enabled: {
        type: 'boolean',
        description: 'Enable the feature',
        default: true
      }
    },
    required: ['apiKey'],
    additionalProperties: false
  }
  
  // Requirements
  requirements: PluginRequirementsV2 = {
    models: {
      required: ['User'],
      optional: ['Organization']
    },
    envVars: {
      required: ['EXAMPLE_API_KEY'],
      optional: ['EXAMPLE_API_URL'],
      schema: {
        EXAMPLE_API_KEY: {
          type: 'string',
          required: true,
          pattern: /^sk-[A-Za-z0-9]{32}$/,
          description: 'API key from example.com/keys'
        },
        EXAMPLE_API_URL: {
          type: 'url',
          required: false,
          default: 'https://api.example.com',
          description: 'API endpoint URL'
        }
      }
    },
    dependencies: {
      runtime: {
        'example-sdk': '^1.0.0'
      },
      dev: {
        '@types/example-sdk': '^1.0.0'
      },
      peer: {
        'zod': '^3.0.0'
      }
    },
    plugins: ['google-auth']  // Depends on google-auth plugin
  }
  
  // Lifecycle hooks
  lifecycle: PluginLifecycleHooks = {
    async beforeGeneration(context) {
      console.log(`[example-v2] Preparing to generate...`)
    },
    
    async onSchemaValidated(schema) {
      console.log(`[example-v2] Schema has ${schema.models.length} models`)
    },
    
    async onModelGenerated(model, files) {
      console.log(`[example-v2] Generated ${files.size} files for ${model.name}`)
    },
    
    async afterGeneration(context, output) {
      console.log(`[example-v2] Generated ${output.files.size} files`)
    },
    
    async onFilesWritten(fileCount) {
      console.log(`[example-v2] All ${fileCount} files written to disk`)
    },
    
    async onError(error, phase) {
      console.error(`[example-v2] Error in phase ${phase}:`, error)
    },
    
    async onComplete(result) {
      console.log(`[example-v2] Generation complete: ${result.files} files in ${result.duration}ms`)
    }
  }
  
  /**
   * Override templates
   */
  overrideTemplates(registry: TemplateRegistry): void {
    // Example: Completely replace a template
    registry.override('user.service', `
// Custom user service template
export const userService = {
  // Custom implementation
}
    `)
    
    // Example: Extend a template
    registry.extend('app.ts', {
      before: '// Example plugin initialization',
      after: '// Example plugin teardown',
      replace: [
        {
          pattern: /app\.listen\(/g,
          replacement: 'initializeExample();\napp.listen('
        }
      ]
    })
  }
  
  /**
   * Register custom phases
   */
  registerPhases(): GenerationPhase[] {
    return [new ExampleCustomPhase()]
  }
  
  /**
   * Validate
   */
  validate(context: PluginContextV2): ValidationResultV2 {
    const errors: any[] = []
    const warnings: any[] = []
    const suggestions: any[] = []
    
    // Check for User model
    const hasUserModel = context.schema.models.some(m => m.name === 'User')
    if (!hasUserModel) {
      errors.push({
        severity: 'error',
        message: 'User model is required',
        code: 'MISSING_USER_MODEL'
      })
    }
    
    // Check env vars
    if (!process.env.EXAMPLE_API_KEY) {
      warnings.push({
        severity: 'warning',
        message: 'EXAMPLE_API_KEY not set - plugin will generate with runtime check',
        code: 'MISSING_ENV_VAR'
      })
    }
    
    // Suggest improvements
    const hasOrgModel = context.schema.models.some(m => m.name === 'Organization')
    if (!hasOrgModel) {
      suggestions.push({
        severity: 'info',
        message: 'Consider adding Organization model for multi-tenancy support',
        code: 'SUGGEST_ORG_MODEL'
      })
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }
  
  /**
   * Generate
   */
  generate(context: PluginContextV2): PluginOutputV2 {
    const files = new Map<string, string>()
    
    // Generate provider file
    files.set('example/example.provider.ts', `
// @generated
// Example Provider v2

export const exampleProvider = {
  apiKey: process.env.EXAMPLE_API_KEY || '',
  
  async doSomething() {
    if (!this.apiKey) {
      throw new Error('EXAMPLE_API_KEY is required')
    }
    
    // Implementation
    return { success: true }
  }
}
    `)
    
    // Generate configuration
    files.set('example/example.config.ts', `
// @generated
// Example Configuration

export const exampleConfig = {
  apiUrl: process.env.EXAMPLE_API_URL || 'https://api.example.com',
  maxRetries: 3,
  timeout: 30000
}
    `)
    
    return {
      files,
      routes: [{
        path: '/api/example',
        method: 'get',
        handler: '@/example/example.controller'
      }],
      middleware: [{
        name: 'exampleAuth',
        importPath: '@/example/example.middleware',
        global: false
      }],
      envVars: {
        EXAMPLE_API_KEY: 'sk-example_key_here',
        EXAMPLE_API_URL: 'https://api.example.com'
      },
      packageJson: {
        dependencies: {
          'example-sdk': '^1.0.0'
        },
        devDependencies: {
          '@types/example-sdk': '^1.0.0'
        },
        scripts: {
          'example:test': 'echo "Testing example plugin"'
        }
      }
    }
  }
  
  /**
   * Health check (optional)
   */
  healthCheck(context: PluginContextV2) {
    return {
      id: 'example-v2',
      title: 'Example v2 Plugin',
      icon: '🔌',
      checks: [
        {
          id: 'example-api-key',
          name: 'API Key Configured',
          description: 'EXAMPLE_API_KEY is set',
          testFunction: 'checkExampleApiKey'
        }
      ]
    }
  }
}

