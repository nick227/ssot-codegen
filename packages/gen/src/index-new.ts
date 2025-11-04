/**
 * SSOT Codegen - Main Generator (Enhanced Version)
 * 
 * Generates working code from Prisma schema:
 * - Real DTOs with actual fields
 * - Working Zod validators
 * - Service layer with Prisma queries
 * - Controllers with CRUD operations
 * - Express/Fastify routes
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import type { DMMF } from '@prisma/generator-helper'
import { parseDMMF, validateSchema } from './dmmf-parser.js'
import { generateCode, countGeneratedFiles } from './code-generator.js'
import { PathsConfig, filePath, esmImport } from './path-resolver.js'

// Import CommonJS module
const require = createRequire(import.meta.url)
const { getDMMF } = require('@prisma/internals')

export * from './project-scaffold.js'
export * from './dependencies/index.js'

export interface GeneratorConfig {
  output?: string
  schemaPath?: string
  schemaText?: string
  paths?: Partial<PathsConfig>
  framework?: 'express' | 'fastify'
}

const defaultPaths: PathsConfig = {
  alias: '@gen',
  rootDir: './gen',
  perModelSubfolders: true,
  useBarrels: true,
  filenamePattern: 'model.artifact.suffix',
  layers: {
    contracts: 'contracts',
    validators: 'validators',
    routes: 'routes',
    controllers: 'controllers',
    services: 'services',
    loaders: 'loaders',
    auth: 'auth',
    telemetry: 'telemetry',
    openapi: 'openapi',
    sdk: 'sdk',
    manifests: 'manifests',
    shared: 'shared'
  }
}

const ensureDir = (p: string) => fs.mkdirSync(p, { recursive: true })
const write = (file: string, content: string) => { 
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, content, 'utf8')
}
const hash = (text: string) => crypto.createHash('sha256').update(text).digest('hex')

const pathMap: Record<string, { fs: string; esm: string }> = {}
const track = (idStr: string, fsPath: string, esmPath: string) => {
  pathMap[idStr] = { fs: fsPath, esm: esmPath }
}

const id = (layer: string, model?: string, file?: string) => ({ layer, model, file })

/**
 * Main generator function
 */
export async function generateFromSchema(config: GeneratorConfig) {
  console.log('[ssot-codegen] Starting code generation...')
  
  // Parse schema
  let dmmf: DMMF.Document
  if (config.schemaPath) {
    dmmf = await getDMMF({ datamodelPath: config.schemaPath })
  } else if (config.schemaText) {
    dmmf = await getDMMF({ datamodel: config.schemaText })
  } else {
    throw new Error('Either schemaPath or schemaText is required')
  }
  
  // Parse DMMF into our format
  const parsedSchema = parseDMMF(dmmf)
  
  // Validate
  const errors = validateSchema(parsedSchema)
  if (errors.length > 0) {
    console.error('[ssot-codegen] Schema validation errors:')
    errors.forEach(err => console.error(`  - ${err}`))
    throw new Error('Schema validation failed')
  }
  
  console.log(`[ssot-codegen] Parsed ${parsedSchema.models.length} models, ${parsedSchema.enums.length} enums`)
  
  // Generate code
  const cfg = { ...defaultPaths, ...config.paths, rootDir: config.output || defaultPaths.rootDir }
  const framework = config.framework || 'express'
  const generatedFiles = generateCode(parsedSchema, { framework })
  
  // Write files to disk
  writeGeneratedFiles(generatedFiles, cfg, parsedSchema.models.map(m => m.name))
  
  // Generate barrels
  generateBarrels(cfg, parsedSchema.models.map(m => m.name))
  
  // Generate OpenAPI
  generateOpenAPI(cfg, parsedSchema.models)
  
  // Generate manifest
  const schemaHash = hash(config.schemaText || '')
  writeManifest(cfg, schemaHash, parsedSchema.models.map(m => m.name), '0.5.0')
  
  // Generate tsconfig paths
  emitTsConfigPaths(cfg, path.resolve('.'))
  
  const totalFiles = countGeneratedFiles(generatedFiles)
  console.log(`[ssot-codegen] ✅ Generated ${totalFiles} working code files`)
  
  return {
    models: parsedSchema.models.map(m => m.name),
    files: totalFiles
  }
}

/**
 * Write generated files to disk
 */
function writeGeneratedFiles(
  files: ReturnType<typeof generateCode>,
  cfg: PathsConfig,
  models: string[]
): void {
  // Write contracts
  files.contracts.forEach((fileMap, modelName) => {
    fileMap.forEach((content, filename) => {
      const filePath = path.join(cfg.rootDir, 'contracts', modelName.toLowerCase(), filename)
      write(filePath, content)
      track(`contracts:${modelName}:${filename}`, filePath, esmImport(cfg, id('contracts', modelName)))
    })
  })
  
  // Write validators
  files.validators.forEach((fileMap, modelName) => {
    fileMap.forEach((content, filename) => {
      const filePath = path.join(cfg.rootDir, 'validators', modelName.toLowerCase(), filename)
      write(filePath, content)
      track(`validators:${modelName}:${filename}`, filePath, esmImport(cfg, id('validators', modelName)))
    })
  })
  
  // Write services
  files.services.forEach((content, filename) => {
    const modelName = filename.replace('.service.ts', '')
    const filePath = path.join(cfg.rootDir, 'services', modelName, filename)
    write(filePath, content)
    track(`services:${modelName}:${filename}`, filePath, esmImport(cfg, id('services', modelName)))
  })
  
  // Write controllers
  files.controllers.forEach((content, filename) => {
    const modelName = filename.replace('.controller.ts', '')
    const filePath = path.join(cfg.rootDir, 'controllers', modelName, filename)
    write(filePath, content)
    track(`controllers:${modelName}:${filename}`, filePath, esmImport(cfg, id('controllers', modelName)))
  })
  
  // Write routes
  files.routes.forEach((content, filename) => {
    const modelName = filename.replace('.routes.ts', '')
    const filePath = path.join(cfg.rootDir, 'routes', modelName, filename)
    write(filePath, content)
    track(`routes:${modelName}:${filename}`, filePath, esmImport(cfg, id('routes', modelName)))
  })
}

/**
 * Generate barrel files
 */
function generateBarrels(cfg: PathsConfig, models: string[]): void {
  // Generate model-level barrels for each layer
  const layers = ['contracts', 'validators', 'services', 'controllers', 'routes']
  
  for (const layer of layers) {
    for (const modelName of models) {
      const modelLower = modelName.toLowerCase()
      const barrelPath = path.join(cfg.rootDir, layer, modelLower, 'index.ts')
      const exports = `// @generated barrel\nexport * from './${modelLower}.*.js'\n`
      
      // Better barrel - export specific files
      let barrelContent = '// @generated barrel\n'
      if (layer === 'contracts') {
        barrelContent += `export * from './${modelLower}.create.dto.js'\n`
        barrelContent += `export * from './${modelLower}.update.dto.js'\n`
        barrelContent += `export * from './${modelLower}.read.dto.js'\n`
        barrelContent += `export * from './${modelLower}.query.dto.js'\n`
      } else if (layer === 'validators') {
        barrelContent += `export * from './${modelLower}.create.zod.js'\n`
        barrelContent += `export * from './${modelLower}.update.zod.js'\n`
        barrelContent += `export * from './${modelLower}.query.zod.js'\n`
      } else {
        barrelContent += `export * from './${modelLower}.${layer.slice(0, -1)}.js'\n`
      }
      
      write(barrelPath, barrelContent)
      track(`${layer}:${modelName}:index`, barrelPath, esmImport(cfg, id(layer, modelName)))
    }
    
    // Generate layer-level barrel
    const layerBarrelPath = path.join(cfg.rootDir, layer, 'index.ts')
    const layerExports = models.map(m => 
      `export * as ${m.toLowerCase()} from '${esmImport(cfg, id(layer, m))}'`
    ).join('\n')
    write(layerBarrelPath, `// @generated layer barrel\n${layerExports}\n`)
    track(`${layer}:index`, layerBarrelPath, esmImport(cfg, id(layer)))
  }
}

/**
 * Generate OpenAPI spec
 */
function generateOpenAPI(cfg: PathsConfig, models: import('./dmmf-parser.js').ParsedModel[]): void {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Generated API',
      version: '1.0.0',
      description: 'Auto-generated from Prisma schema'
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Development' }
    ],
    paths: Object.fromEntries(
      models.map(m => [
        `/${m.name.toLowerCase()}s`,
        {
          get: {
            operationId: `list${m.name}s`,
            summary: `List all ${m.name} records`,
            tags: [m.name],
            responses: {
              '200': { description: 'Success' }
            }
          },
          post: {
            operationId: `create${m.name}`,
            summary: `Create ${m.name}`,
            tags: [m.name],
            responses: {
              '201': { description: 'Created' },
              '400': { description: 'Validation Error' }
            }
          }
        }
      ])
    ),
    components: {
      schemas: Object.fromEntries(
        models.flatMap(m => [
          [`${m.name}CreateDTO`, { type: 'object', properties: {} }],
          [`${m.name}ReadDTO`, { type: 'object', properties: {} }]
        ])
      )
    }
  }
  
  const openApiPath = path.join(cfg.rootDir, 'openapi', 'openapi.json')
  write(openApiPath, JSON.stringify(spec, null, 2))
  track('openapi:spec', openApiPath, esmImport(cfg, id('openapi', undefined, 'openapi.json')))
}

/**
 * Write manifest
 */
function writeManifest(cfg: PathsConfig, schemaHash: string, models: string[], toolVersion: string): void {
  const outputs = Object.keys(pathMap).map(k => ({
    id: k,
    fs: pathMap[k].fs,
    esm: pathMap[k].esm
  }))
  
  const manifest = {
    schemaHash,
    toolVersion,
    generated: new Date().toISOString(),
    outputs,
    pathMap
  }
  
  const manifestPath = path.join(cfg.rootDir, 'manifests', 'build.json')
  write(manifestPath, JSON.stringify(manifest, null, 2))
}

/**
 * Emit tsconfig paths
 */
function emitTsConfigPaths(cfg: PathsConfig, rootDir: string): void {
  const pathsConfig = {
    compilerOptions: {
      paths: {
        [`${cfg.alias}/*`]: [`${cfg.rootDir}/*`]
      }
    }
  }
  const pathsFile = path.join(rootDir, 'tsconfig.paths.json')
  write(pathsFile, JSON.stringify(pathsConfig, null, 2))
}

// Keep old interface for backwards compatibility
export interface GeneratorInput {
  dmmf: unknown
  config: GeneratorConfig & {
    projectName?: string
    description?: string
    framework?: 'express' | 'fastify'
    scaffold?: boolean
  }
}

export const runGenerator = generateFromSchema

