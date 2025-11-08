/**
 * Checklist Generation Phase - Generates system health check dashboard
 * Runs last, only if no critical errors
 */

import { generateChecklistSystem } from '../../generators/checklist-generator.js'
import { PluginManager } from '../../plugins/plugin-manager.js'
import type { GeneratedFiles } from '../types.js'
import {
  ErrorSeverity,
  PhaseStatus,
  type GenerationPhase,
  type PhaseResult,
  type IGenerationContext,
  type GenerationError
} from '../generation-types.js'

/**
 * Generates system health check dashboard
 * 
 * Responsibilities:
 * - Collect plugin health checks
 * - Generate checklist HTML/dashboard
 * - Only run if no critical errors
 * - Auto-open if configured
 * 
 * IMPORTANT: Only generates if generation was successful
 * Prevents showing "all green" dashboard for broken code
 */
export class ChecklistGenerationPhase implements GenerationPhase {
  readonly name = 'checklist-generation'
  readonly order = 11
  
  shouldExecute(context: IGenerationContext): boolean {
    // Only if checklist enabled AND no critical errors
    if (!context.config.generation.checklist) {
      return false
    }
    
    if (context.hasCriticalErrors()) {
      console.warn('[ssot-codegen] Skipping checklist generation due to critical errors')
      return false
    }
    
    return true
  }
  
  async execute(context: IGenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    
    try {
      // Collect plugin health checks
      const pluginHealthChecks = await this.collectPluginHealthChecks(context, errors)
      
      // Build temporary GeneratedFiles for checklist generator
      const files = this.buildTemporaryFiles(context)
      
      // Generate checklist
      const checklist = generateChecklistSystem(context.schema, files, {
        projectName: context.config.metadata.projectName,
        useRegistry: context.config.useRegistry,
        framework: context.config.framework,
        autoOpen: context.config.generation.autoOpen,
        includeEnvironmentChecks: true,
        includeCodeValidation: true,
        includeAPITesting: true,
        includePerformanceMetrics: true,
        pluginHealthChecks
      })
      
      // Add checklist files to builder
      const checklistBuilder = context.filesBuilder.getChecklistBuilder()
      for (const [filename, content] of checklist) {
        checklistBuilder.addFile(filename, content)
      }
      
      console.log(`[ssot-codegen] Generated system health checklist`)
      
      const success = errors.filter(e => 
        e.severity === ErrorSeverity.ERROR || e.severity === ErrorSeverity.FATAL
      ).length === 0
      
      return {
        success,
        status: success ? PhaseStatus.COMPLETED : PhaseStatus.FAILED,
        errors
      }
    } catch (error) {
      errors.push({
        severity: ErrorSeverity.WARNING,
        message: 'Error generating checklist (non-critical)',
        phase: this.name,
        error: error as Error
      })
      
      return {
        success: true,  // Checklist failures are non-critical
        status: PhaseStatus.COMPLETED,
        errors
      }
    }
  }
  
  /**
   * Collect health checks from plugins
   */
  private async collectPluginHealthChecks(
    context: IGenerationContext,
    errors: GenerationError[]
  ): Promise<Map<string, any>> {
    const healthChecks = new Map<string, any>()
    
    if (!context.config.features) {
      return healthChecks
    }
    
    try {
      const pluginManager = new PluginManager({
        schema: context.schema,
        projectName: context.config.metadata.projectName,
        framework: context.config.framework,
        outputDir: '',
        features: context.config.features
      })
      
      for (const [pluginName, plugin] of pluginManager.getPlugins()) {
        if (plugin.healthCheck) {
          try {
            const healthCheck = plugin.healthCheck({
              schema: context.schema,
              projectName: context.config.metadata.projectName,
              framework: context.config.framework,
              outputDir: '',
              config: context.config.features
            })
            
            healthChecks.set(pluginName, healthCheck)
          } catch (error) {
            errors.push({
              severity: ErrorSeverity.WARNING,
              message: `Error getting health check for plugin ${pluginName}`,
              phase: this.name,
              error: error as Error
            })
          }
        }
      }
    } catch (error) {
      errors.push({
        severity: ErrorSeverity.WARNING,
        message: 'Error collecting plugin health checks',
        phase: this.name,
        error: error as Error
      })
    }
    
    return healthChecks
  }
  
  /**
   * Build temporary GeneratedFiles structure for checklist generator
   * The checklist generator needs the files structure to analyze
   */
  private buildTemporaryFiles(context: IGenerationContext): GeneratedFiles {
    return context.filesBuilder.build()
  }
  
  async rollback(context: IGenerationContext): Promise<void> {
    context.filesBuilder.getChecklistBuilder().clear()
  }
}

