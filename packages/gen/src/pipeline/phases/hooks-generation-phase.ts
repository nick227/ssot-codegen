/**
 * Hooks Generation Phase - Generates framework-specific hooks
 * React, Vue, Angular, Zustand, Vanilla
 */

import { generateAllHooks } from '../../generators/hooks/index.js'
import {
  ErrorSeverity,
  PhaseStatus,
  type GenerationPhase,
  type PhaseResult,
  type IGenerationContext,
  type GenerationError
} from '../generation-types.js'

/**
 * Generates frontend framework hooks for all models
 * 
 * Responsibilities:
 * - Generate React hooks (useQuery, useMutation)
 * - Generate Vue composables
 * - Generate Zustand stores
 * - Generate Vanilla JS stores
 * - Generate Angular services
 * - Validate analysis cache completeness
 * 
 * Validates that analysis cache is populated for enhanced features
 */
export class HooksGenerationPhase implements GenerationPhase {
  readonly name = 'hooks-generation'
  readonly order = 9
  
  shouldExecute(context: IGenerationContext): boolean {
    // Always generate hooks
    return true
  }
  
  async execute(context: IGenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    
    try {
      // Validate analysis cache if enhanced mode
      this.validateAnalysisCache(context, errors)
      
      // Generate hooks for configured frameworks
      // Note: generateAllHooks expects Map<string, ModelAnalysis> which is different from our cache
      // For now, pass undefined to skip caching in hooks generator (hooks will analyze models themselves)
      const hooks = generateAllHooks(
        context.schema,
        { frameworks: [...context.config.generation.hookFrameworks] },
        undefined
      )
      
      // Add hooks to builders
      this.addHooksToBuilders(hooks, context, errors)
      
      const frameworkCount = context.config.generation.hookFrameworks.length
      console.log(`[ssot-codegen] Generated hooks for ${frameworkCount} framework(s): ${context.config.generation.hookFrameworks.join(', ')}`)
      
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
        severity: ErrorSeverity.ERROR,
        message: 'Fatal error during hooks generation',
        phase: this.name,
        error: error as Error
      })
      
      return {
        success: false,
        status: PhaseStatus.FAILED,
        errors
      }
    }
  }
  
  /**
   * Validate analysis cache completeness
   */
  private validateAnalysisCache(
    context: IGenerationContext,
    errors: GenerationError[]
  ): void {
    if (!context.config.useEnhanced) {
      return
    }
    
    // Check if cache has analysis for expected models
    const expectedCount = context.cache.getExpectedCount(context.schema)
    const actualCount = context.cache.getAnalysisCount()
    
    if (actualCount < expectedCount && context.schema.models.length > 0) {
      errors.push({
        severity: ErrorSeverity.WARNING,
        message: `Model analysis incomplete: ${actualCount} of ${expectedCount} models analyzed. Hooks may be missing advanced features.`,
        phase: this.name
      })
    }
  }
  
  /**
   * Add generated hooks to appropriate builders
   */
  private addHooksToBuilders(
    hooks: any,
    context: IGenerationContext,
    errors: GenerationError[]
  ): void {
    try {
      // Core hooks (framework-agnostic)
      if (hooks.core) {
        for (const [filename, content] of hooks.core) {
          context.filesBuilder.getCoreHooksBuilder().addFile(filename, content)
        }
      }
      
      // React hooks
      if (hooks.react) {
        for (const [filename, content] of hooks.react) {
          context.filesBuilder.getReactHooksBuilder().addFile(filename, content)
        }
      }
      
      // Vue composables
      if (hooks.vue) {
        for (const [filename, content] of hooks.vue) {
          context.filesBuilder.getVueHooksBuilder().addFile(filename, content)
        }
      }
      
      // Zustand stores
      if (hooks.zustand) {
        for (const [filename, content] of hooks.zustand) {
          context.filesBuilder.getZustandHooksBuilder().addFile(filename, content)
        }
      }
      
      // Vanilla JS stores
      if (hooks.vanilla) {
        for (const [filename, content] of hooks.vanilla) {
          context.filesBuilder.getVanillaHooksBuilder().addFile(filename, content)
        }
      }
      
      // Angular services
      if (hooks.angular) {
        for (const [filename, content] of hooks.angular) {
          context.filesBuilder.getAngularHooksBuilder().addFile(filename, content)
        }
      }
    } catch (error) {
      errors.push({
        severity: ErrorSeverity.ERROR,
        message: 'Error adding hooks to builders',
        phase: this.name,
        error: error as Error
      })
    }
  }
  
  async rollback(context: IGenerationContext): Promise<void> {
    // Clear all hook builders
    context.filesBuilder.getCoreHooksBuilder().clear()
    context.filesBuilder.getReactHooksBuilder().clear()
    context.filesBuilder.getVueHooksBuilder().clear()
    context.filesBuilder.getZustandHooksBuilder().clear()
    context.filesBuilder.getVanillaHooksBuilder().clear()
    context.filesBuilder.getAngularHooksBuilder().clear()
  }
}

