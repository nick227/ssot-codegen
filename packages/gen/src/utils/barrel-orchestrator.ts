/**
 * Barrel Orchestrator
 * 
 * Centralized logic for determining which barrels to generate based on generated files
 */

import path from 'node:path'
import { toKebabCase } from './naming.js'
import {
  generateContractsBarrel,
  generateValidatorsBarrel,
  generateServiceBarrel,
  generateControllerBarrel,
  generateRoutesBarrel,
  generateLayerIndexBarrel
} from '@/generators/barrel-generator.js'
import type { PathsConfig } from '../path-resolver.js'

export interface BarrelWrite {
  path: string
  content: string
  trackId: string
  esmPath: string
}

export interface GeneratedFilesMap {
  contracts: Map<string, Map<string, string>>
  validators: Map<string, Map<string, string>>
  services: Map<string, string>
  controllers: Map<string, string>
  routes: Map<string, string>
}

/**
 * Determine which barrel files need to be generated
 * 
 * @param cfg - Paths configuration
 * @param modelNames - Array of model names
 * @param generatedFiles - Map of generated files by layer
 * @param esmPathFn - Function to generate ESM import paths
 * @returns Array of barrel writes to perform
 */
export function determineBarrelWrites(
  cfg: PathsConfig,
  modelNames: string[],
  generatedFiles: GeneratedFilesMap,
  esmPathFn: (layer: string, model?: string) => string
): BarrelWrite[] {
  const barrelExt = cfg.barrelExtension || 'js'
  const writes: BarrelWrite[] = []
  
  // Track which models have files in which layers
  const layerModels = {
    contracts: [] as string[],
    validators: [] as string[],
    services: [] as string[],
    controllers: [] as string[],
    routes: [] as string[]
  }
  
  // Single pass through models - check all layers simultaneously
  for (const modelName of modelNames) {
    const modelKebab = toKebabCase(modelName)
    
    // Contracts
    if (generatedFiles.contracts.has(modelName)) {
      layerModels.contracts.push(modelName)
      writes.push({
        path: path.join(cfg.rootDir, 'contracts', modelKebab, 'index.ts'),
        content: generateContractsBarrel(modelName),
        trackId: `contracts:${modelName}:index`,
        esmPath: esmPathFn('contracts', modelName)
      })
    }
    
    // Validators
    if (generatedFiles.validators.has(modelName)) {
      layerModels.validators.push(modelName)
      writes.push({
        path: path.join(cfg.rootDir, 'validators', modelKebab, 'index.ts'),
        content: generateValidatorsBarrel(modelName),
        trackId: `validators:${modelName}:index`,
        esmPath: esmPathFn('validators', modelName)
      })
    }
    
    // Services (check for kebab-case filenames)
    const modelLower = modelName.toLowerCase()
    if (generatedFiles.services.has(`${modelLower}.service.ts`) || 
        generatedFiles.services.has(`${modelLower}.service.scaffold.ts`)) {
      layerModels.services.push(modelName)
      writes.push({
        path: path.join(cfg.rootDir, 'services', modelKebab, 'index.ts'),
        content: generateServiceBarrel(modelName),
        trackId: `services:${modelName}:index`,
        esmPath: esmPathFn('services', modelName)
      })
    }
    
    // Controllers
    if (generatedFiles.controllers.has(`${modelLower}.controller.ts`) ||
        generatedFiles.controllers.has(`${modelLower}.controller.scaffold.ts`)) {
      layerModels.controllers.push(modelName)
      writes.push({
        path: path.join(cfg.rootDir, 'controllers', modelKebab, 'index.ts'),
        content: generateControllerBarrel(modelName),
        trackId: `controllers:${modelName}:index`,
        esmPath: esmPathFn('controllers', modelName)
      })
    }
    
    // Routes
    if (generatedFiles.routes.has(`${modelLower}.routes.ts`) ||
        generatedFiles.routes.has(`${modelLower}.routes.scaffold.ts`)) {
      layerModels.routes.push(modelName)
      writes.push({
        path: path.join(cfg.rootDir, 'routes', modelKebab, 'index.ts'),
        content: generateRoutesBarrel(modelName),
        trackId: `routes:${modelName}:index`,
        esmPath: esmPathFn('routes', modelName)
      })
    }
  }
  
  // Generate layer-level barrels
  for (const [layer, layerModelsArray] of Object.entries(layerModels)) {
    if (layerModelsArray.length > 0) {
      writes.push({
        path: path.join(cfg.rootDir, layer, 'index.ts'),
        content: generateLayerIndexBarrel(layerModelsArray, barrelExt),
        trackId: `${layer}:index`,
        esmPath: esmPathFn(layer)
      })
    }
  }
  
  return writes
}

