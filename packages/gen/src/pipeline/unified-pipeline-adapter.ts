/**
 * Unified Pipeline Adapter
 * 
 * Makes CodeGenerationPipeline compatible with PhaseRunner interface.
 * This allows gradual migration from PhaseRunner to CodeGenerationPipeline.
 * 
 * MIGRATION PATH:
 * 1. Use this adapter to replace PhaseRunner calls
 * 2. Update code to use CodeGenerationPipeline directly
 * 3. Remove adapter once migration complete
 */

import { CodeGenerationPipeline } from './code-generation-pipeline.js'
import { parseDMMF } from '../dmmf-parser.js'
import type { GeneratorConfig, GeneratorResult } from './types.js'
import type { CodeGeneratorConfig } from '../code-generator.js'
import type { CLILogger } from '@/utils/cli-logger.js'
import { PhaseHookRegistry } from './hooks/phase-hooks.js'

/**
 * Adapter that wraps CodeGenerationPipeline to provide PhaseRunner-compatible interface
 * 
 * This adapter:
 * - Converts GeneratorConfig → CodeGeneratorConfig
 * - Converts GeneratedFiles → GeneratorResult
 * - Handles schema parsing if needed
 * - Provides hook registry access
 */
export class UnifiedPipelineAdapter {
  private pipeline?: CodeGenerationPipeline
  private readonly config: GeneratorConfig
  private readonly logger: CLILogger
  private readonly hookRegistry: PhaseHookRegistry
  
  constructor(
    config: GeneratorConfig, 
    logger: CLILogger,
    hookRegistry?: PhaseHookRegistry
  ) {
    this.config = config
    this.logger = logger
    this.hookRegistry = hookRegistry || new PhaseHookRegistry()
  }
  
  /**
   * Execute the pipeline and return PhaseRunner-compatible result
   */
  async run(): Promise<GeneratorResult> {
    this.logger.startGeneration()
    
    try {
      // Step 1: Parse schema if needed
      const schema = await this.parseSchemaIfNeeded()
      
      // Step 2: Convert config
      const pipelineConfig = this.convertConfig(this.config)
      
      // Step 3: Create and execute pipeline
      this.pipeline = new CodeGenerationPipeline(schema, pipelineConfig, this.hookRegistry)
      const generatedFiles = await this.pipeline.execute()
      
      // Step 4: Convert result to PhaseRunner format
      const result = this.convertToGeneratorResult(generatedFiles)
      
      this.logger.completeGeneration(result.files)
      
      // Step 5: Log next steps if standalone
      if (this.config.standalone ?? true) {
        console.log(`\n✅ Standalone project created at: ${result.outputDir}`)
        console.log(`\nNext steps:`)
        console.log(`  cd ${result.outputDir}`)
        console.log(`  pnpm install`)
        console.log(`  pnpm dev`)
      }
      
      return result
    } catch (error) {
      this.logger.error('Generation failed', error as Error)
      throw error
    }
  }
  
  /**
   * Parse schema from config
   */
  private async parseSchemaIfNeeded() {
    // If schemaText provided, use it
    if (this.config.schemaText) {
      const { getDMMF } = require('@prisma/internals')
      const dmmf = await getDMMF({ datamodel: this.config.schemaText })
      return parseDMMF(dmmf)
    }
    
    // If schemaPath provided, read and parse it
    if (this.config.schemaPath) {
      const fs = await import('fs/promises')
      const schemaText = await fs.readFile(this.config.schemaPath, 'utf-8')
      const { getDMMF } = require('@prisma/internals')
      const dmmf = await getDMMF({ datamodel: schemaText })
      return parseDMMF(dmmf)
    }
    
    throw new Error('Must provide either schemaPath or schemaText')
  }
  
  /**
   * Convert GeneratorConfig → CodeGeneratorConfig
   */
  private convertConfig(config: GeneratorConfig): CodeGeneratorConfig {
    return {
      framework: config.framework || 'express',
      useEnhancedGenerators: true, // Always use enhanced in v2
      usePipeline: true, // This is the pipeline mode
      projectName: config.projectName,
      generateChecklist: true,
      autoOpenChecklist: false,
      hookFrameworks: ['react'], // Default, can be extended
      strictPluginValidation: false,
      continueOnError: true,
      failFast: false,
      features: config.features as any
    }
  }
  
  /**
   * Convert GeneratedFiles → GeneratorResult
   */
  private convertToGeneratorResult(files: any): GeneratorResult {
    // Count all generated files
    let totalFiles = 0
    const breakdown: Array<{ layer: string; count: number }> = []
    
    // Count DTOs/contracts
    if (files.contracts) {
      let contractCount = 0
      for (const [, map] of files.contracts) {
        contractCount += map.size
      }
      totalFiles += contractCount
      breakdown.push({ layer: 'contracts', count: contractCount })
    }
    
    // Count validators
    if (files.validators) {
      let validatorCount = 0
      for (const [, map] of files.validators) {
        validatorCount += map.size
      }
      totalFiles += validatorCount
      breakdown.push({ layer: 'validators', count: validatorCount })
    }
    
    // Count services
    if (files.services) {
      totalFiles += files.services.size
      breakdown.push({ layer: 'services', count: files.services.size })
    }
    
    // Count controllers
    if (files.controllers) {
      totalFiles += files.controllers.size
      breakdown.push({ layer: 'controllers', count: files.controllers.size })
    }
    
    // Count routes
    if (files.routes) {
      totalFiles += files.routes.size
      breakdown.push({ layer: 'routes', count: files.routes.size })
    }
    
    // Count SDK
    if (files.sdk) {
      totalFiles += files.sdk.size
      breakdown.push({ layer: 'sdk', count: files.sdk.size })
    }
    
    // Count hooks
    if (files.hooks) {
      let hookCount = 0
      if (files.hooks.core) hookCount += files.hooks.core.size
      if (files.hooks.react) hookCount += files.hooks.react.size
      if (files.hooks.vue) hookCount += files.hooks.vue.size
      if (files.hooks.zustand) hookCount += files.hooks.zustand.size
      if (files.hooks.vanilla) hookCount += files.hooks.vanilla.size
      if (files.hooks.angular) hookCount += files.hooks.angular.size
      
      totalFiles += hookCount
      breakdown.push({ layer: 'hooks', count: hookCount })
    }
    
    // Count registry
    if (files.registry) {
      totalFiles += files.registry.size
      breakdown.push({ layer: 'registry', count: files.registry.size })
    }
    
    // Extract model names from contracts
    const modelNames: string[] = files.contracts ? Array.from(files.contracts.keys()) : []
    
    // Get relationship count from context if available
    const relationshipCount = this.pipeline?.getContext().schema.models
      .reduce((sum, model) => {
        return sum + model.fields.filter(f => f.kind === 'object').length
      }, 0) || 0
    
    return {
      models: modelNames,
      files: totalFiles,
      relationships: relationshipCount,
      breakdown,
      outputDir: this.config.output
    }
  }
  
  /**
   * Get hook registry for plugin registration
   */
  getHookRegistry(): PhaseHookRegistry {
    return this.hookRegistry
  }
  
  /**
   * Get underlying pipeline (for advanced use cases)
   */
  getPipeline(): CodeGenerationPipeline | undefined {
    return this.pipeline
  }
}

/**
 * Create adapter instance (convenience function)
 */
export function createUnifiedPipeline(
  config: GeneratorConfig,
  logger: CLILogger,
  hookRegistry?: PhaseHookRegistry
): UnifiedPipelineAdapter {
  return new UnifiedPipelineAdapter(config, logger, hookRegistry)
}

