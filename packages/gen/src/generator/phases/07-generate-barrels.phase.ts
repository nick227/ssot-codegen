/**
 * Phase 7: Generate Barrels
 * 
 * Generates barrel export files for all layers
 */

import fs from 'node:fs'
import path from 'node:path'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { esmImport } from '../../path-resolver.js'
import {
  generateContractsBarrel,
  generateValidatorsBarrel,
  generateServiceBarrel,
  generateControllerBarrel,
  generateRoutesBarrel,
  generateLayerIndexBarrel
} from '../../generators/barrel-generator.js'

const ensureDir = async (p: string) => fs.promises.mkdir(p, { recursive: true })
const write = async (file: string, content: string) => { 
  await ensureDir(path.dirname(file))
  await fs.promises.writeFile(file, content, 'utf8')
}

const pathMap: Record<string, { fs: string; esm: string }> = {}
const track = (idStr: string, fsPath: string, esmPath: string) => {
  pathMap[idStr] = { fs: fsPath, esm: esmPath }
}

const id = (layer: string, model?: string, file?: string) => ({ layer, model, file })

export class GenerateBarrelsPhase extends GenerationPhase {
  readonly name = 'generateBarrels'
  readonly order = 7
  
  getDescription(): string {
    return 'Generating barrel exports'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { generatedFiles, pathsConfig: cfg, modelNames } = context as any
    
    if (!generatedFiles || !cfg || !modelNames) {
      throw new Error('Required context data not found')
    }
    
    const writes: Promise<void>[] = []
    
    // Track which models have files in which layers
    const layerModels = {
      contracts: [] as string[],
      validators: [] as string[],
      services: [] as string[],
      controllers: [] as string[],
      routes: [] as string[]
    }
    
    // Single pass through models
    for (const modelName of modelNames) {
      const modelLower = modelName.toLowerCase()
      
      // Contracts
      if (generatedFiles.contracts.has(modelName)) {
        layerModels.contracts.push(modelName)
        const barrelPath = path.join(cfg.rootDir, 'contracts', modelLower, 'index.ts')
        const barrelContent = generateContractsBarrel(modelName)
        writes.push(write(barrelPath, barrelContent))
        track(`contracts:${modelName}:index`, barrelPath, esmImport(cfg, id('contracts', modelName)))
      }
      
      // Validators
      if (generatedFiles.validators.has(modelName)) {
        layerModels.validators.push(modelName)
        const barrelPath = path.join(cfg.rootDir, 'validators', modelLower, 'index.ts')
        const barrelContent = generateValidatorsBarrel(modelName)
        writes.push(write(barrelPath, barrelContent))
        track(`validators:${modelName}:index`, barrelPath, esmImport(cfg, id('validators', modelName)))
      }
      
      // Services
      if (generatedFiles.services.has(`${modelLower}.service.ts`) || generatedFiles.services.has(`${modelLower}.service.scaffold.ts`)) {
        layerModels.services.push(modelName)
        const barrelPath = path.join(cfg.rootDir, 'services', modelLower, 'index.ts')
        const barrelContent = generateServiceBarrel(modelName)
        writes.push(write(barrelPath, barrelContent))
        track(`services:${modelName}:index`, barrelPath, esmImport(cfg, id('services', modelName)))
      }
      
      // Controllers
      if (generatedFiles.controllers.has(`${modelLower}.controller.ts`)) {
        layerModels.controllers.push(modelName)
        const barrelPath = path.join(cfg.rootDir, 'controllers', modelLower, 'index.ts')
        const barrelContent = generateControllerBarrel(modelName)
        writes.push(write(barrelPath, barrelContent))
        track(`controllers:${modelName}:index`, barrelPath, esmImport(cfg, id('controllers', modelName)))
      }
      
      // Routes
      if (generatedFiles.routes.has(`${modelLower}.routes.ts`)) {
        layerModels.routes.push(modelName)
        const barrelPath = path.join(cfg.rootDir, 'routes', modelLower, 'index.ts')
        const barrelContent = generateRoutesBarrel(modelName)
        writes.push(write(barrelPath, barrelContent))
        track(`routes:${modelName}:index`, barrelPath, esmImport(cfg, id('routes', modelName)))
      }
    }
    
    // Generate layer-level barrels
    for (const [layer, layerModelsArray] of Object.entries(layerModels)) {
      if (layerModelsArray.length > 0) {
        const layerBarrelPath = path.join(cfg.rootDir, layer, 'index.ts')
        const layerBarrelContent = generateLayerIndexBarrel(layerModelsArray)
        writes.push(write(layerBarrelPath, layerBarrelContent))
        track(`${layer}:index`, layerBarrelPath, esmImport(cfg, id(layer)))
      }
    }
    
    await Promise.all(writes)
    
    return {
      success: true
    }
  }
}

