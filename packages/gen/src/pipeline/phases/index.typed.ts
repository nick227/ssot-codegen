/**
 * Strongly-Typed Phase Registry
 * 
 * Exports all typed phases for use in the PhaseRunner.
 * Use this for full compile-time safety.
 * 
 * @example
 * ```ts
 * import { createAllTypedPhases } from './phases/index.typed.js'
 * import { PhaseRunner } from './phase-runner.js'
 * 
 * const phases = createAllTypedPhases()
 * const runner = new PhaseRunner(config, logger)
 * runner.registerPhases(phases)
 * await runner.run()
 * ```
 */

import { GenerationPhase } from '../phase-runner.js'

// Import typed phases
import { SetupOutputDirPhaseTyped } from './00-setup-output-dir.phase.typed.js'
import { ParseSchemaPhaseTyped } from './01-parse-schema.phase.typed.js'
import { ValidateSchemaPhaseTyped } from './02-validate-schema.phase.typed.js'
import { AnalyzeRelationshipsPhaseTyped } from './03-analyze-relationships.phase.typed.js'
import { GenerateCodePhaseTyped } from './04-generate-code.phase.typed.js'
import { WriteFilesPhaseTyped } from './05-write-files.phase.typed.js'
import { WriteInfrastructurePhaseTyped } from './06-write-infrastructure.phase.typed.js'
import { GenerateBarrelsPhaseTyped } from './07-generate-barrels.phase.typed.js'
import { GenerateOpenAPIPhaseTyped } from './08-generate-openapi.phase.typed.js'
import { WriteManifestPhaseTyped } from './09-write-manifest.phase.typed.js'
import { GenerateTsConfigPhaseTyped } from './10-generate-tsconfig.phase.typed.js'
import { WriteStandalonePhaseTyped } from './11-write-standalone.phase.typed.js'
import { WriteTestsPhaseTyped } from './12-write-tests.phase.typed.js'
import { FormatCodePhaseTyped } from './13-format-code.phase.typed.js'

/**
 * Create all generation phases with strong typing
 * 
 * Returns array of typed phases that provide compile-time safety.
 * Each phase enforces its input requirements and output guarantees at compile time.
 * 
 * @returns Array of typed generation phases
 */
export function createAllTypedPhases(): GenerationPhase[] {
  return [
    new SetupOutputDirPhaseTyped(),
    new ParseSchemaPhaseTyped(),
    new ValidateSchemaPhaseTyped(),
    new AnalyzeRelationshipsPhaseTyped(),
    new GenerateCodePhaseTyped(),
    new WriteFilesPhaseTyped(),
    new WriteInfrastructurePhaseTyped(),
    new GenerateBarrelsPhaseTyped(),
    new GenerateOpenAPIPhaseTyped(),
    new WriteManifestPhaseTyped(),
    new GenerateTsConfigPhaseTyped(),
    new WriteStandalonePhaseTyped(),
    new WriteTestsPhaseTyped(),
    new FormatCodePhaseTyped()
  ]
}

/**
 * Export individual typed phases for selective use
 */
export {
  SetupOutputDirPhaseTyped,
  ParseSchemaPhaseTyped,
  ValidateSchemaPhaseTyped,
  AnalyzeRelationshipsPhaseTyped,
  GenerateCodePhaseTyped,
  WriteFilesPhaseTyped,
  WriteInfrastructurePhaseTyped,
  GenerateBarrelsPhaseTyped,
  GenerateOpenAPIPhaseTyped,
  WriteManifestPhaseTyped,
  GenerateTsConfigPhaseTyped,
  WriteStandalonePhaseTyped,
  WriteTestsPhaseTyped,
  FormatCodePhaseTyped
}

