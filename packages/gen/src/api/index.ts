/**
 * @ssot-codegen/gen - Public API
 * 
 * Clean, minimal API for embedding SSOT Codegen in your own tools.
 * 
 * @example
 * ```ts
 * import { generate } from '@ssot-codegen/gen/api'
 * 
 * const result = await generate({
 *   schema: './prisma/schema.prisma',
 *   framework: 'express',
 *   standalone: true
 * })
 * 
 * console.log(`✅ Generated ${result.filesCreated} files`)
 * ```
 */

export {
  generate,
  validateSchema,
  analyzeSchema,
  getVersion,
  GeneratorError
} from './public-api.js'

export type {
  GenerateOptions,
  GenerateResult,
  Framework,
  LogLevel,
  DatabaseProvider,
  ProgressEvent,
  ProgressEventType,
  PathsConfig
} from './public-api.js'

