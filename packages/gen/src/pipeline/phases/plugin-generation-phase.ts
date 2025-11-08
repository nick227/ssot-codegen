/**
 * Plugin Generation Phase - Generates feature plugins
 * Google Auth, Search, etc.
 */

import { PluginManager } from '../../plugins/plugin-manager.js'
import {
  ErrorSeverity,
  PhaseStatus,
  type GenerationPhase,
  type PhaseResult,
  type IGenerationContext,
  type GenerationError
} from '../generation-types.js'

/**
 * Generates plugin code and integrations
 * 
 * Responsibilities:
 * - Validate plugin configurations
 * - Generate plugin code
 * - Collect plugin outputs (env vars, deps)
 * - Strict validation mode support
 * 
 * CRITICAL: In strict mode, plugin failures BLOCK generation
 * This prevents deploying broken auth/features to production
 */
export class PluginGenerationPhase implements GenerationPhase {
  readonly name = 'plugin-generation'
  readonly order = 10
  
  shouldExecute(context: IGenerationContext): boolean {
    // Only run if features configured
    return context.config.features !== undefined
  }
  
  async execute(context: IGenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    
    try {
      // Create plugin manager
      const pluginManager = new PluginManager({
        schema: context.schema,
        projectName: context.config.metadata.projectName,
        framework: context.config.framework,
        outputDir: '',
        features: context.config.features || {}
      })
      
      // Validate all plugins
      const validations = pluginManager.validateAll()
      const hasInvalidPlugins = Array.from(validations.values()).some(v => !v.valid)
      
      if (hasInvalidPlugins) {
        const severity = context.config.errorHandling.strictPluginValidation
          ? ErrorSeverity.ERROR
          : ErrorSeverity.WARNING
        
        const error: GenerationError = {
          severity,
          message: 'Plugin validation failed',
          phase: this.name,
          blocksGeneration: context.config.errorHandling.strictPluginValidation
        }
        
        errors.push(error)
        
        // In strict mode, fail immediately (prevents broken auth/features in production)
        if (context.config.errorHandling.strictPluginValidation) {
          console.error('[ssot-codegen] ❌ Plugin validation failed in strict mode')
          console.error('[ssot-codegen] Set strictPluginValidation: false to continue anyway')
          
          return {
            success: false,
            status: PhaseStatus.FAILED,
            errors
          }
        }
        
        console.warn('[ssot-codegen] ⚠️  Plugin validation failed, continuing anyway')
      }
      
      // Generate plugin code
      const pluginOutputs = pluginManager.generateAll()
      
      // Add plugin files to builders
      for (const [pluginName, output] of pluginOutputs) {
        const pluginBuilder = context.filesBuilder.getPluginBuilder(pluginName)
        
        for (const [filename, content] of output.files) {
          pluginBuilder.addFile(filename, content, pluginName)
        }
      }
      
      // Store plugin outputs for env vars and package.json merging
      context.filesBuilder.setPluginOutputs(pluginOutputs)
      
      console.log(`[ssot-codegen] Generated ${pluginOutputs.size} plugin(s)`)
      
      const success = errors.filter(e => 
        e.severity === ErrorSeverity.ERROR || e.severity === ErrorSeverity.FATAL
      ).length === 0
      
      return {
        success,
        status: success ? PhaseStatus.COMPLETED : PhaseStatus.FAILED,
        errors
      }
    } catch (error) {
      const genError: GenerationError = {
        severity: context.config.errorHandling.strictPluginValidation
          ? ErrorSeverity.ERROR
          : ErrorSeverity.WARNING,
        message: 'Error during plugin generation',
        phase: this.name,
        error: error as Error,
        blocksGeneration: context.config.errorHandling.strictPluginValidation
      }
      
      errors.push(genError)
      
      return {
        success: !context.config.errorHandling.strictPluginValidation,
        status: context.config.errorHandling.strictPluginValidation 
          ? PhaseStatus.FAILED 
          : PhaseStatus.COMPLETED,
        errors
      }
    }
  }
  
  async rollback(context: IGenerationContext): Promise<void> {
    // Clear all plugin builders
    // Note: We don't know which plugins were created, so we rely on
    // the filesBuilder to manage plugin builders internally
    console.warn('[ssot-codegen] Rolling back plugin generation')
  }
}

