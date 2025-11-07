/**
 * Generation Phases - Exports all discrete generation phases
 */

export { SetupOutputDirPhase } from './00-setup-output-dir.phase.js'
export { ParseSchemaPhase } from './01-parse-schema.phase.js'
export { ValidateSchemaPhase } from './02-validate-schema.phase.js'
export { AnalyzeRelationshipsPhase } from './03-analyze-relationships.phase.js'
export { GenerateCodePhase } from './04-generate-code.phase.js'
export { WriteFilesPhase } from './05-write-files.phase.js'
export { WriteInfrastructurePhase } from './06-write-infrastructure.phase.js'
export { GenerateBarrelsPhase } from './07-generate-barrels.phase.js'
export { GenerateOpenAPIPhase } from './08-generate-openapi.phase.js'
export { WriteManifestPhase } from './09-write-manifest.phase.js'
export { GenerateTsConfigPhase } from './10-generate-tsconfig.phase.js'
export { WriteStandalonePhase } from './11-write-standalone.phase.js'
export { WriteTestsPhase } from './12-write-tests.phase.js'
export { FormatCodePhase } from './13-format-code.phase.js'

import { SetupOutputDirPhase } from './00-setup-output-dir.phase.js'
import { ParseSchemaPhase } from './01-parse-schema.phase.js'
import { ValidateSchemaPhase } from './02-validate-schema.phase.js'
import { AnalyzeRelationshipsPhase } from './03-analyze-relationships.phase.js'
import { GenerateCodePhase } from './04-generate-code.phase.js'
import { WriteFilesPhase } from './05-write-files.phase.js'
import { WriteInfrastructurePhase } from './06-write-infrastructure.phase.js'
import { GenerateBarrelsPhase } from './07-generate-barrels.phase.js'
import { GenerateOpenAPIPhase } from './08-generate-openapi.phase.js'
import { WriteManifestPhase } from './09-write-manifest.phase.js'
import { GenerateTsConfigPhase } from './10-generate-tsconfig.phase.js'
import { WriteStandalonePhase } from './11-write-standalone.phase.js'
import { WriteTestsPhase } from './12-write-tests.phase.js'
import { FormatCodePhase } from './13-format-code.phase.js'
import type { GenerationPhase } from '../phase-runner.js'

/**
 * Create all standard generation phases
 */
export function createAllPhases(): GenerationPhase[] {
  return [
    new SetupOutputDirPhase(),
    new ParseSchemaPhase(),
    new ValidateSchemaPhase(),
    new AnalyzeRelationshipsPhase(),
    new GenerateCodePhase(),
    new WriteFilesPhase(),
    new WriteInfrastructurePhase(),
    new GenerateBarrelsPhase(),
    new GenerateOpenAPIPhase(),
    new WriteManifestPhase(),
    new GenerateTsConfigPhase(),
    new WriteStandalonePhase(),
    new WriteTestsPhase(),
    new FormatCodePhase()
  ]
}

