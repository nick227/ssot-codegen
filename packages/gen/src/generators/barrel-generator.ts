/**
 * Barrel Generator - Centralized barrel content emitters
 *
 * Consolidates all per-layer barrel generation into a single module
 * to eliminate duplication across templates and writers.
 */

import { BarrelBuilder } from './utils/barrel-builder.js'

type ModelName = string

/**
 * Generate contracts barrel for a model
 */
export function generateContractsBarrel(modelName: ModelName): string {
  const modelLower = modelName.toLowerCase()
  return BarrelBuilder.modelBarrel(modelLower, [
    'create.dto',
    'update.dto',
    'read.dto',
    'query.dto'
  ])
}

/**
 * Generate validators barrel for a model
 */
export function generateValidatorsBarrel(modelName: ModelName): string {
  const modelLower = modelName.toLowerCase()
  return BarrelBuilder.modelBarrel(modelLower, [
    'create.zod',
    'update.zod',
    'query.zod'
  ])
}

/**
 * Generate services barrel for a model
 */
export function generateServiceBarrel(modelName: ModelName): string {
  const modelLower = modelName.toLowerCase()
  return BarrelBuilder.simple([`${modelLower}.service`])
}

/**
 * Generate controllers barrel for a model
 */
export function generateControllerBarrel(modelName: ModelName): string {
  const modelLower = modelName.toLowerCase()
  return BarrelBuilder.simple([`${modelLower}.controller`])
}

/**
 * Generate routes barrel for a model
 */
export function generateRoutesBarrel(modelName: ModelName): string {
  const modelLower = modelName.toLowerCase()
  return BarrelBuilder.simple([`${modelLower}.routes`])
}

/**
 * Generate layer-level barrel that re-exports each model's barrel
 */
export function generateLayerIndexBarrel(modelNames: ModelName[]): string {
  return BarrelBuilder.layerBarrel(
    modelNames.map(name => ({ name, lower: name.toLowerCase() })),
    modelName => `./${modelName.toLowerCase()}/index.js`
  )
}


