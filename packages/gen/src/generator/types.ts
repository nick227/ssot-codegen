import type { PathsConfig } from '../path-resolver.js'
import type { GeneratedFiles } from '../code-generator.js'
import type { ParsedModel } from '../dmmf-parser.js'
import type { LogLevel } from '../utils/cli-logger.js'

export interface GeneratorConfig {
  output?: string
  schemaPath?: string
  schemaText?: string
  paths?: Partial<PathsConfig>
  framework?: 'express' | 'fastify'
  standalone?: boolean
  projectName?: string
  verbosity?: LogLevel
  colors?: boolean
  timestamps?: boolean
}

export interface GeneratorResult {
  models: string[]
  files: number
  relationships: number
  breakdown: Array<{ layer: string; count: number }>
  outputDir?: string
}

export interface StandaloneProjectOptions {
  outputDir: string
  projectName: string
  framework: 'express' | 'fastify'
  models: string[]
  schemaContent: string
  schemaPath?: string
  generatedFiles?: GeneratedFiles
}

export interface TestSuiteOptions {
  outputDir: string
  models: ParsedModel[]
  framework: 'express' | 'fastify'
}


