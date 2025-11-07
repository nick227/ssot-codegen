/**
 * Phase 4: Generate Code
 * 
 * Generates all code files (DTOs, validators, services, controllers, routes, SDK, plugins)
 */

import path from 'node:path'
import { generateCode, countGeneratedFiles } from '../../code-generator.js'
import { analyzeModel } from '../../utils/relationship-analyzer.js'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { PathsConfig } from '../../path-resolver.js'

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

export class GenerateCodePhase extends GenerationPhase {
  readonly name = 'generateCode'
  readonly order = 4
  
  getDescription(): string {
    return 'Generating code'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { schema, config, logger } = context
    
    if (!schema) {
      throw new Error('Schema not found in context')
    }
    
    // Setup output directory and config
    const srcDir = path.join(context.outputDir!, 'src')
    const cfg = { ...defaultPaths, ...config.paths, rootDir: srcDir }
    const framework = config.framework || 'express'
    const useRegistry = process.env.USE_REGISTRY === 'true'
    
    const modelNames = schema.models.map(m => m.name)
    
    // Generate all code
    const generatedFiles = generateCode(schema, { 
      framework,
      useEnhancedGenerators: !useRegistry,
      useRegistry,
      projectName: config.projectName || path.basename(context.outputDir!),
      
      // Feature plugins
      features: {
        googleAuth: process.env.ENABLE_GOOGLE_AUTH === 'true' ? {
          enabled: true,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          strategy: (process.env.AUTH_STRATEGY as 'jwt' | 'session') || 'jwt',
          userModel: process.env.AUTH_USER_MODEL || 'User'
        } : undefined
      }
    })
    
    // Log per-model progress
    for (const model of schema.models) {
      logger.startModel(model.name)
      
      // Detect junction tables
      const isJunction = model.fields.length === 2 && 
                        model.fields.every(f => f.kind === 'object' && !f.isList)
      
      if (isJunction) {
        logger.logJunctionTable(model.name)
      }
      
      // Count files for this model
      let modelFiles = 0
      const modelLower = model.name.toLowerCase()
      
      if (generatedFiles.contracts.has(model.name)) {
        modelFiles += generatedFiles.contracts.get(model.name)!.size
      }
      if (generatedFiles.validators.has(model.name)) {
        modelFiles += generatedFiles.validators.get(model.name)!.size
      }
      if (generatedFiles.services.has(`${modelLower}.service.ts`)) {
        modelFiles++
      }
      if (generatedFiles.controllers.has(`${modelLower}.controller.ts`)) {
        modelFiles++
      }
      if (generatedFiles.routes.has(`${modelLower}.routes.ts`)) {
        modelFiles++
      }
      
      logger.completeModel(model.name, modelFiles)
    }
    
    const totalFiles = countGeneratedFiles(generatedFiles)
    
    // Store in context for subsequent phases
    context.generatedFiles = generatedFiles
    context.pathsConfig = cfg
    context.modelNames = modelNames
    context.totalFiles = totalFiles
    
    return {
      success: true,
      data: generatedFiles,
      filesGenerated: totalFiles
    }
  }
}

