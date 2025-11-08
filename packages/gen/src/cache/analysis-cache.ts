/**
 * Type-safe analysis cache with guaranteed lookups
 * Prevents undefined access errors and improves performance
 */

import type { ParsedSchema } from '../dmmf-parser.js'
import type { UnifiedModelAnalysis } from '../analyzers/index.js'
import type { ServiceAnnotation } from '../service-linker.js'
import type { IAnalysisCache } from '../pipeline/generation-types.js'

/**
 * Type-safe cache for model analysis and service annotations
 * 
 * Features:
 * - Guaranteed lookups (getAnalysis throws if missing)
 * - Safe optional lookups (tryGetAnalysis returns undefined)
 * - Single-lookup caching (prevents repeated Map.get calls)
 * - Expected count validation
 * - Immutable iteration
 */
export class AnalysisCache implements IAnalysisCache {
  private readonly modelAnalysis = new Map<string, UnifiedModelAnalysis>()
  private readonly serviceAnnotations = new Map<string, ServiceAnnotation>()
  
  // ============================================================================
  // Model Analysis
  // ============================================================================
  
  /**
   * Store analysis for a model
   */
  setAnalysis(modelName: string, analysis: UnifiedModelAnalysis): void {
    this.modelAnalysis.set(modelName, analysis)
  }
  
  /**
   * Get analysis for a model (throws if not found)
   * Use this when analysis is required
   */
  getAnalysis(modelName: string): UnifiedModelAnalysis {
    const analysis = this.modelAnalysis.get(modelName)
    if (!analysis) {
      throw new Error(
        `No analysis found for model: ${modelName}. ` +
        `Ensure AnalysisPhase completed successfully before accessing analysis.`
      )
    }
    return analysis
  }
  
  /**
   * Try to get analysis for a model (returns undefined if not found)
   * Use this when analysis is optional
   */
  tryGetAnalysis(modelName: string): UnifiedModelAnalysis | undefined {
    return this.modelAnalysis.get(modelName)
  }
  
  /**
   * Check if analysis exists for a model
   */
  hasAnalysis(modelName: string): boolean {
    return this.modelAnalysis.has(modelName)
  }
  
  // ============================================================================
  // Service Annotations
  // ============================================================================
  
  /**
   * Store service annotation for a model
   */
  setServiceAnnotation(modelName: string, annotation: ServiceAnnotation): void {
    this.serviceAnnotations.set(modelName, annotation)
  }
  
  /**
   * Get service annotation for a model (throws if not found)
   * Use this when annotation is required
   */
  getServiceAnnotation(modelName: string): ServiceAnnotation {
    const annotation = this.serviceAnnotations.get(modelName)
    if (!annotation) {
      throw new Error(
        `No service annotation found for model: ${modelName}. ` +
        `Check that model has @service annotation in schema.`
      )
    }
    return annotation
  }
  
  /**
   * Try to get service annotation (returns undefined if not found)
   * Use this when annotation is optional
   */
  tryGetServiceAnnotation(modelName: string): ServiceAnnotation | undefined {
    return this.serviceAnnotations.get(modelName)
  }
  
  /**
   * Check if service annotation exists for a model
   */
  hasServiceAnnotation(modelName: string): boolean {
    return this.serviceAnnotations.has(modelName)
  }
  
  // ============================================================================
  // Iteration
  // ============================================================================
  
  /**
   * Get all analyzed models (immutable)
   */
  getAllAnalyzedModels(): ReadonlyArray<[string, UnifiedModelAnalysis]> {
    return Array.from(this.modelAnalysis.entries())
  }
  
  /**
   * Get all service annotations (immutable)
   */
  getAllServiceAnnotations(): ReadonlyArray<[string, ServiceAnnotation]> {
    return Array.from(this.serviceAnnotations.entries())
  }
  
  // ============================================================================
  // Statistics & Validation
  // ============================================================================
  
  /**
   * Get count of analyzed models
   */
  getAnalysisCount(): number {
    return this.modelAnalysis.size
  }
  
  /**
   * Get expected analysis count (non-junction models only)
   */
  getExpectedCount(schema: ParsedSchema): number {
    return schema.models.filter(model => {
      const analysis = this.tryGetAnalysis(model.name)
      return !analysis?.isJunctionTable
    }).length
  }
  
  /**
   * Validate that all expected models were analyzed
   * @returns Array of model names missing analysis
   */
  getMissingAnalysis(schema: ParsedSchema): string[] {
    const missing: string[] = []
    
    for (const model of schema.models) {
      const analysis = this.tryGetAnalysis(model.name)
      
      // Skip junction tables (they shouldn't be analyzed)
      if (analysis?.isJunctionTable) {
        continue
      }
      
      // Model should have been analyzed but wasn't
      if (!this.hasAnalysis(model.name)) {
        missing.push(model.name)
      }
    }
    
    return missing
  }
  
  /**
   * Clear all cached data
   * Use when rebuilding cache (e.g., watch mode)
   */
  clear(): void {
    this.modelAnalysis.clear()
    this.serviceAnnotations.clear()
  }
}

