/**
 * Phase-Based Code Generation Pipeline
 * Export all pipeline components
 */

// Core types and interfaces
export * from './generation-types.js'
export type { GeneratedFiles } from './types.js'

// Foundation classes
export { ErrorCollector } from './error-collector.js'
export { ConfigNormalizer } from './config-normalizer.js'
export { GenerationContext } from './generation-context.js'
export { CodeGenerationPipeline } from './code-generation-pipeline.js'

// Phases
export { ValidationPhase } from './phases/validation-phase.js'
export { AnalysisPhase } from './phases/analysis-phase.js'
export { NamingConflictPhase } from './phases/naming-conflict-phase.js'
export { DTOGenerationPhase } from './phases/dto-generation-phase.js'
export { ServiceGenerationPhase } from './phases/service-generation-phase.js'
export { ControllerGenerationPhase } from './phases/controller-generation-phase.js'
export { RouteGenerationPhase } from './phases/route-generation-phase.js'
export { RegistryGenerationPhase } from './phases/registry-generation-phase.js'
export { SDKGenerationPhase } from './phases/sdk-generation-phase.js'
export { HooksGenerationPhase } from './phases/hooks-generation-phase.js'
export { PluginGenerationPhase } from './phases/plugin-generation-phase.js'
export { ChecklistGenerationPhase } from './phases/checklist-generation-phase.js'

// Builders
export { FileBuilder, validateGeneratedCode } from '../builders/file-builder.js'
export { GeneratedFilesBuilder } from '../builders/generated-files-builder.js'
export { DTOValidatorGenerator } from '../builders/dto-validator-generator.js'

// Cache
export { AnalysisCache } from '../cache/analysis-cache.js'

