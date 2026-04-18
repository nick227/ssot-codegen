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

interface BarrelWrite {
  path: string
  content: string
  trackId: string
  esmPath: string
}

interface GeneratedFilesMap {
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
  generatedFiles: {
    contracts: Map<string, Map<string, string>>
    validators: Map<string, Map<string, string>>
    services: Map<string, string>
    controllers: Map<string, string>
    routes: Map<string, string>
  },
  esmPathFn: (layer: string, model?: string) => string
): Array<{
  path: string
  content: string
  trackId: string
  esmPath: string
}> {
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
    const serviceKey1 = `${modelLower}.service.ts`
    const serviceKey2 = `${modelKebab}.service.ts`
    const serviceScaffold1 = `${modelLower}.service.scaffold.ts`
    const serviceScaffold2 = `${modelKebab}.service.scaffold.ts`
    if (generatedFiles.services.has(serviceKey1) || 
        generatedFiles.services.has(serviceKey2) ||
        generatedFiles.services.has(serviceScaffold1) ||
        generatedFiles.services.has(serviceScaffold2)) {
      layerModels.services.push(modelName)
      writes.push({
        path: path.join(cfg.rootDir, 'services', modelKebab, 'index.ts'),
        content: generateServiceBarrel(modelName),
        trackId: `services:${modelName}:index`,
        esmPath: esmPathFn('services', modelName)
      })
    }
    
    // Controllers
    const controllerKey1 = `${modelLower}.controller.ts`
    const controllerKey2 = `${modelKebab}.controller.ts`
    const controllerScaffold1 = `${modelLower}.controller.scaffold.ts`
    const controllerScaffold2 = `${modelKebab}.controller.scaffold.ts`
    if (generatedFiles.controllers.has(controllerKey1) ||
        generatedFiles.controllers.has(controllerKey2) ||
        generatedFiles.controllers.has(controllerScaffold1) ||
        generatedFiles.controllers.has(controllerScaffold2)) {
      layerModels.controllers.push(modelName)
      writes.push({
        path: path.join(cfg.rootDir, 'controllers', modelKebab, 'index.ts'),
        content: generateControllerBarrel(modelName),
        trackId: `controllers:${modelName}:index`,
        esmPath: esmPathFn('controllers', modelName)
      })
    }
    
    // Routes
    const routeKey1 = `${modelLower}.routes.ts`
    const routeKey2 = `${modelKebab}.routes.ts`
    const routeScaffold1 = `${modelLower}.routes.scaffold.ts`
    const routeScaffold2 = `${modelKebab}.routes.scaffold.ts`
    if (generatedFiles.routes.has(routeKey1) ||
        generatedFiles.routes.has(routeKey2) ||
        generatedFiles.routes.has(routeScaffold1) ||
        generatedFiles.routes.has(routeScaffold2)) {
      layerModels.routes.push(modelName)
      writes.push({
        path: path.join(cfg.rootDir, 'routes', modelKebab, 'index.ts'),
        content: generateRoutesBarrel(modelName),
        trackId: `routes:${modelName}:index`,
        esmPath: esmPathFn('routes', modelName)
      })
    }
  }
  
  // Handle service integration controllers (controllers that don't match model name patterns)
  const processedControllerNames = new Set<string>()
  for (const modelName of modelNames) {
    const modelKebab = toKebabCase(modelName)
    const modelLower = modelName.toLowerCase()
    const controllerKey1 = `${modelLower}.controller.ts`
    const controllerKey2 = `${modelKebab}.controller.ts`
    const controllerScaffold1 = `${modelLower}.controller.scaffold.ts`
    const controllerScaffold2 = `${modelKebab}.controller.scaffold.ts`
    if (generatedFiles.controllers.has(controllerKey1)) processedControllerNames.add(controllerKey1)
    if (generatedFiles.controllers.has(controllerKey2)) processedControllerNames.add(controllerKey2)
    if (generatedFiles.controllers.has(controllerScaffold1)) processedControllerNames.add(controllerScaffold1)
    if (generatedFiles.controllers.has(controllerScaffold2)) processedControllerNames.add(controllerScaffold2)
  }

  // Check for any controller files that weren't processed
  for (const [controllerFileName] of generatedFiles.controllers) {
    if (!processedControllerNames.has(controllerFileName) && controllerFileName.endsWith('.controller.ts')) {
      const controllerName = controllerFileName.replace(/\.controller\.ts$/, '')
      const controllerKebab = toKebabCase(controllerName)
      
      const barrelPath = path.join(cfg.rootDir, 'controllers', controllerKebab, 'index.ts')
      const alreadyExists = writes.some(w => w.path === barrelPath)
      
      if (!alreadyExists) {
        layerModels.controllers.push(controllerName)
        writes.push({
          path: barrelPath,
          content: generateControllerBarrel(controllerName),
          trackId: `controllers:${controllerName}:index`,
          esmPath: esmPathFn('controllers', controllerName)
        })
      }
    }
  }

  // Handle service integration services
  const processedServiceNames = new Set<string>()
  for (const modelName of modelNames) {
    const modelKebab = toKebabCase(modelName)
    const modelLower = modelName.toLowerCase()
    const serviceKey1 = `${modelLower}.service.ts`
    const serviceKey2 = `${modelKebab}.service.ts`
    const serviceScaffold1 = `${modelLower}.service.scaffold.ts`
    const serviceScaffold2 = `${modelKebab}.service.scaffold.ts`
    if (generatedFiles.services.has(serviceKey1)) processedServiceNames.add(serviceKey1)
    if (generatedFiles.services.has(serviceKey2)) processedServiceNames.add(serviceKey2)
    if (generatedFiles.services.has(serviceScaffold1)) processedServiceNames.add(serviceScaffold1)
    if (generatedFiles.services.has(serviceScaffold2)) processedServiceNames.add(serviceScaffold2)
  }

  // Check for any service files that weren't processed
  for (const [serviceFileName] of generatedFiles.services) {
    if (!processedServiceNames.has(serviceFileName) && serviceFileName.endsWith('.service.ts')) {
      const serviceName = serviceFileName.replace(/\.service\.ts$/, '')
      const serviceKebab = toKebabCase(serviceName)
      
      const barrelPath = path.join(cfg.rootDir, 'services', serviceKebab, 'index.ts')
      const alreadyExists = writes.some(w => w.path === barrelPath)
      
      if (!alreadyExists) {
        layerModels.services.push(serviceName)
        writes.push({
          path: barrelPath,
          content: generateServiceBarrel(serviceName),
          trackId: `services:${serviceName}:index`,
          esmPath: esmPathFn('services', serviceName)
        })
      }
    }
  }
  
  // Handle service integration routes (routes that don't match model name patterns)
  // Service routes use service annotation names, not model names
  const processedRouteNames = new Set<string>()
  for (const modelName of modelNames) {
    const modelKebab = toKebabCase(modelName)
    const modelLower = modelName.toLowerCase()
    const routeKey1 = `${modelLower}.routes.ts`
    const routeKey2 = `${modelKebab}.routes.ts`
    const routeScaffold1 = `${modelLower}.routes.scaffold.ts`
    const routeScaffold2 = `${modelKebab}.routes.scaffold.ts`
    if (generatedFiles.routes.has(routeKey1)) processedRouteNames.add(routeKey1)
    if (generatedFiles.routes.has(routeKey2)) processedRouteNames.add(routeKey2)
    if (generatedFiles.routes.has(routeScaffold1)) processedRouteNames.add(routeScaffold1)
    if (generatedFiles.routes.has(routeScaffold2)) processedRouteNames.add(routeScaffold2)
  }
  
  // Check for any route files that weren't processed (service integration routes)
  for (const [routeFileName] of generatedFiles.routes) {
    if (!processedRouteNames.has(routeFileName) && routeFileName.endsWith('.routes.ts')) {
      // Extract service/route name from filename (e.g., "admin-config-service.routes.ts" -> "admin-config-service")
      const routeName = routeFileName.replace(/\.routes\.ts$/, '')
      const routeKebab = toKebabCase(routeName)
      
      // Only create barrel if it doesn't already exist
      const barrelPath = path.join(cfg.rootDir, 'routes', routeKebab, 'index.ts')
      const alreadyExists = writes.some(w => w.path === barrelPath)
      
      if (!alreadyExists) {
        layerModels.routes.push(routeName)
        writes.push({
          path: barrelPath,
          content: generateRoutesBarrel(routeName),
          trackId: `routes:${routeName}:index`,
          esmPath: esmPathFn('routes', routeName)
        })
      }
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

