# CLI Logger Integration Example

## Before vs After Comparison

### BEFORE (Current index-new.ts)

```typescript
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
  const generatedFiles = generateCode(parsedSchema, { 
    framework,
    useEnhancedGenerators: true
  })
  
  await writeGeneratedFiles(generatedFiles, cfg, parsedSchema.models.map(m => m.name))
  await writeBaseInfrastructure(cfg)
  await generateBarrels(cfg, parsedSchema.models.map(m => m.name), generatedFiles)
  await generateOpenAPI(cfg, parsedSchema.models)
  
  const totalFiles = countGeneratedFiles(generatedFiles)
  console.log(`[ssot-codegen] ✅ Generated ${totalFiles} working code files`)
  
  return {
    models: parsedSchema.models.map(m => m.name),
    files: totalFiles
  }
}
```

### AFTER (With Enhanced Logger)

```typescript
import { createLogger, type LogLevel } from './utils/cli-logger.js'
import { analyzeRelationships } from './relationship-analyzer.js'

export interface GeneratorConfig {
  schemaPath?: string
  schemaText?: string
  output?: string
  framework?: 'express' | 'fastify'
  paths?: Partial<PathsConfig>
  
  // New CLI options
  verbosity?: LogLevel
  colors?: boolean
  timestamps?: boolean
}

export async function generateFromSchema(config: GeneratorConfig) {
  // Create logger with config
  const logger = createLogger({
    level: config.verbosity || (process.env.CI ? 'minimal' : 'normal'),
    useColors: config.colors ?? (!process.env.CI && process.stdout.isTTY),
    showTimestamps: config.timestamps ?? false
  })
  
  logger.startGeneration()
  
  try {
    // ===== PARSE SCHEMA =====
    logger.startPhase('Parsing schema')
    
    let dmmf: DMMF.Document
    if (config.schemaPath) {
      logger.debug('Reading schema from file', { path: config.schemaPath })
      dmmf = await getDMMF({ datamodelPath: config.schemaPath })
    } else if (config.schemaText) {
      logger.debug('Parsing inline schema')
      dmmf = await getDMMF({ datamodel: config.schemaText })
    } else {
      throw new Error('Either schemaPath or schemaText is required')
    }
    
    const parsedSchema = parseDMMF(dmmf)
    logger.endPhase('Parsing schema')
    
    // ===== VALIDATE SCHEMA =====
    logger.startPhase('Validating schema')
    const errors = validateSchema(parsedSchema)
    if (errors.length > 0) {
      errors.forEach(err => logger.error(err))
      throw new Error('Schema validation failed')
    }
    logger.endPhase('Validating schema')
    
    // ===== ANALYZE RELATIONSHIPS =====
    logger.startPhase('Analyzing relationships')
    const relationships = analyzeRelationships(parsedSchema)
    logger.endPhase('Analyzing relationships')
    
    logger.logSchemaParsed(
      parsedSchema.models.length,
      parsedSchema.enums.length,
      relationships.length
    )
    
    // ===== GENERATE CODE =====
    logger.startPhase('Generating code')
    const cfg = { ...defaultPaths, ...config.paths, rootDir: config.output || defaultPaths.rootDir }
    const framework = config.framework || 'express'
    
    const generatedFiles = generateCode(parsedSchema, { 
      framework,
      useEnhancedGenerators: true
    })
    
    // Track per-model progress
    const modelNames = parsedSchema.models.map(m => m.name)
    const filesByModel = new Map<string, number>()
    
    for (const model of parsedSchema.models) {
      logger.startModel(model.name)
      
      // Detect junction tables
      const isJunction = model.fields.length === 2 && 
                        model.fields.every(f => f.kind === 'object')
      
      if (isJunction) {
        logger.logJunctionTable(model.name)
      }
      
      // Count files for this model
      const modelFiles = countFilesForModel(generatedFiles, model.name)
      filesByModel.set(model.name, modelFiles)
      
      logger.completeModel(model.name, modelFiles)
    }
    
    logger.endPhase('Generating code', countGeneratedFiles(generatedFiles))
    
    // ===== WRITE FILES =====
    logger.startPhase('Writing files to disk')
    await writeGeneratedFiles(generatedFiles, cfg, modelNames)
    logger.endPhase('Writing files to disk')
    
    // ===== BASE INFRASTRUCTURE =====
    logger.startPhase('Writing base infrastructure')
    await writeBaseInfrastructure(cfg)
    logger.endPhase('Writing base infrastructure', 2) // BaseCRUDController + BaseServiceController
    
    // ===== GENERATE BARRELS =====
    logger.startPhase('Generating barrel exports')
    await generateBarrels(cfg, modelNames, generatedFiles)
    logger.endPhase('Generating barrel exports')
    
    // ===== GENERATE OPENAPI =====
    logger.startPhase('Generating OpenAPI specification')
    await generateOpenAPI(cfg, parsedSchema.models)
    logger.endPhase('Generating OpenAPI specification', 1)
    
    // ===== GENERATE MANIFEST =====
    logger.startPhase('Writing manifest')
    const schemaHash = hash(config.schemaText || '')
    await writeManifest(cfg, schemaHash, modelNames, '0.5.0')
    logger.endPhase('Writing manifest', 1)
    
    // ===== GENERATE TSCONFIG =====
    logger.startPhase('Generating TypeScript config')
    await emitTsConfigPaths(cfg, path.resolve('.'))
    logger.endPhase('Generating TypeScript config', 1)
    
    // ===== GENERATE SUMMARY =====
    const totalFiles = countGeneratedFiles(generatedFiles)
    
    // Build breakdown for table
    const breakdown = [
      { layer: 'DTOs', count: countFilesByType(generatedFiles, 'dto') },
      { layer: 'Validators', count: countFilesByType(generatedFiles, 'zod') },
      { layer: 'Services', count: countFilesByType(generatedFiles, 'service') },
      { layer: 'Controllers', count: countFilesByType(generatedFiles, 'controller') },
      { layer: 'Routes', count: countFilesByType(generatedFiles, 'routes') },
      { layer: 'Base/Infra', count: 2 }, // Base classes
      { layer: 'Barrel exports', count: modelNames.length * 4 }, // One per layer per model
      { layer: 'Config/Manifest', count: 3 } // OpenAPI + manifest + tsconfig
    ]
    
    logger.printGenerationTable(breakdown)
    logger.completeGeneration(totalFiles)
    
    return {
      models: modelNames,
      files: totalFiles,
      relationships: relationships.length,
      breakdown
    }
    
  } catch (error) {
    logger.error('Generation failed', error as Error)
    throw error
  }
}

// Helper functions
function countFilesForModel(files: any, modelName: string): number {
  // Count files belonging to this model
  const modelLower = modelName.toLowerCase()
  let count = 0
  
  for (const [layer, models] of Object.entries(files)) {
    if (typeof models === 'object' && modelLower in models) {
      const modelFiles = models[modelLower]
      if (Array.isArray(modelFiles)) {
        count += modelFiles.length
      } else if (typeof modelFiles === 'string') {
        count += 1
      }
    }
  }
  
  return count
}

function countFilesByType(files: any, type: string): number {
  // Count files matching a type across all models
  let count = 0
  
  for (const [layer, models] of Object.entries(files)) {
    if (layer.includes(type) || layer.includes(type + 's')) {
      if (typeof models === 'object') {
        for (const modelFiles of Object.values(models)) {
          if (Array.isArray(modelFiles)) {
            count += modelFiles.length
          } else if (modelFiles) {
            count += 1
          }
        }
      }
    }
  }
  
  return count
}
```

## CLI Argument Parsing

Update CLI to accept verbosity flags:

```typescript
// cli.ts
#!/usr/bin/env node
import { generateFromSchema } from './index-new.js'
import { type LogLevel } from './utils/cli-logger.js'

const args = process.argv.slice(2)
let verbosity: LogLevel = 'normal'
let useColors = true
let showTimestamps = false
let schemaPath = './prisma/schema.prisma'
let output = './gen'
let framework: 'express' | 'fastify' = 'express'

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  
  switch (arg) {
    case '--silent':
      verbosity = 'silent'
      break
    case '--minimal':
      verbosity = 'minimal'
      break
    case '--verbose':
    case '-v':
      verbosity = 'verbose'
      break
    case '--debug':
      verbosity = 'debug'
      break
    case '--no-color':
      useColors = false
      break
    case '--timestamps':
      showTimestamps = true
      break
    case '--schema':
      schemaPath = args[++i]
      break
    case '--output':
    case '-o':
      output = args[++i]
      break
    case '--framework':
    case '-f':
      framework = args[++i] as 'express' | 'fastify'
      break
    case '--help':
    case '-h':
      printHelp()
      process.exit(0)
  }
}

await generateFromSchema({
  schemaPath,
  output,
  framework,
  verbosity,
  colors: useColors,
  timestamps: showTimestamps
})

function printHelp() {
  console.log(`
Usage: ssot-codegen [options]

Options:
  --schema <path>        Path to Prisma schema file (default: ./prisma/schema.prisma)
  -o, --output <path>    Output directory (default: ./gen)
  -f, --framework <name> Framework: express or fastify (default: express)
  
Verbosity:
  --silent               No output except errors
  --minimal              Minimal output
  (default)              Normal output with progress
  -v, --verbose          Detailed output with timing
  --debug                Debug output with internal details
  
Display:
  --no-color             Disable colored output
  --timestamps           Show timestamps in output
  
  -h, --help             Show this help message
  
Examples:
  ssot-codegen                                  # Generate with defaults
  ssot-codegen --verbose                        # Verbose output
  ssot-codegen --schema ./db/schema.prisma      # Custom schema path
  ssot-codegen --output ./api --framework fastify  # Custom output and framework
`)
}
```

## Sample Usage

```bash
# Default (normal verbosity)
$ ssot-codegen

# Minimal output for CI
$ ssot-codegen --minimal

# Detailed output for debugging
$ ssot-codegen --verbose

# Full debug mode
$ ssot-codegen --debug --timestamps

# Silent mode (only errors)
$ ssot-codegen --silent
```

