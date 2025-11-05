/**
 * Hooks Generator - Main orchestrator
 * 
 * Generates framework-agnostic core queries + framework-specific adapters
 */

import type { ParsedModel, ParsedSchema } from '../../dmmf-parser.js'
import { generateCoreQueries, generateCoreQueriesIndex } from './core-queries-generator.js'
import { 
  generateReactHooks, 
  generateReactHooksIndex, 
  generateReactProvider,
  generateReactHooksReadme
} from './react-adapter-generator.js'
import {
  generateVueComposables,
  generateZustandStore,
  generateVanillaStore,
  generateAngularService,
  generateFrameworkAdapterIndex
} from './framework-adapters.js'
import {
  generateReactHookTests,
  generateTestSetup,
  generateVitestConfig
} from './test-generator.js'

export interface HooksConfig {
  frameworks?: Array<'react' | 'vue' | 'zustand' | 'vanilla' | 'angular'>
  generateTests?: boolean  // Generate automated tests (default: true)
}

export interface GeneratedHooks {
  core: Map<string, string>        // Framework-agnostic queries
  react?: Map<string, string>      // React hooks
  vue?: Map<string, string>        // Vue composables
  zustand?: Map<string, string>    // Zustand stores
  vanilla?: Map<string, string>    // Vanilla JS stores
  angular?: Map<string, string>    // Angular services
}

/**
 * Generate all hooks for all models
 */
export function generateAllHooks(
  schema: ParsedSchema,
  config: HooksConfig = {}
): GeneratedHooks {
  const frameworks = config.frameworks || ['react']  // Default to React only
  const hooks: GeneratedHooks = {
    core: new Map()
  }
  
  // Initialize framework maps
  if (frameworks.includes('react')) hooks.react = new Map()
  if (frameworks.includes('vue')) hooks.vue = new Map()
  if (frameworks.includes('zustand')) hooks.zustand = new Map()
  if (frameworks.includes('vanilla')) hooks.vanilla = new Map()
  if (frameworks.includes('angular')) hooks.angular = new Map()
  
  // Generate per-model
  for (const model of schema.models) {
    generateModelHooks(model, schema, hooks, frameworks, config)
  }
  
  // Generate index barrels
  hooks.core.set('index.ts', generateCoreQueriesIndex(schema.models, schema))
  
  if (hooks.react) {
    hooks.react.set('index.ts', generateReactHooksIndex(schema.models, schema))
    hooks.react.set('provider.tsx', generateReactProvider())
    hooks.react.set('README.md', generateReactHooksReadme(schema.models, schema))
    
    // Generate tests if enabled (default: true)
    if (config.generateTests !== false) {
      hooks.react.set('__tests__/setup.ts', generateTestSetup())
      hooks.react.set('vitest.config.ts', generateVitestConfig())
    }
  }
  
  if (hooks.vue) {
    hooks.vue.set('index.ts', generateFrameworkAdapterIndex(schema.models, schema, 'vue'))
  }
  
  if (hooks.zustand) {
    hooks.zustand.set('index.ts', generateFrameworkAdapterIndex(schema.models, schema, 'zustand'))
  }
  
  if (hooks.vanilla) {
    hooks.vanilla.set('index.ts', generateFrameworkAdapterIndex(schema.models, schema, 'vanilla'))
  }
  
  if (hooks.angular) {
    hooks.angular.set('index.ts', generateFrameworkAdapterIndex(schema.models, schema, 'angular'))
  }
  
  return hooks
}

/**
 * Generate hooks for a single model
 */
function generateModelHooks(
  model: ParsedModel,
  schema: ParsedSchema,
  hooks: GeneratedHooks,
  frameworks: string[],
  config: HooksConfig
): void {
  const modelLower = model.name.toLowerCase()
  
  // 1. Core queries (always generated, framework-agnostic)
  const coreQueries = generateCoreQueries(model, schema)
  hooks.core.set(`${modelLower}-queries.ts`, coreQueries)
  
  // 2. React adapter (if enabled)
  if (frameworks.includes('react') && hooks.react) {
    const reactHooks = generateReactHooks(model, schema)
    hooks.react.set(`models/use-${modelLower}.ts`, reactHooks)
    
    // Generate tests if enabled
    if (config.generateTests !== false) {
      const tests = generateReactHookTests(model, schema)
      hooks.react.set(`models/__tests__/use-${modelLower}.test.tsx`, tests)
    }
  }
  
  // 3. Vue adapter (if enabled)
  if (frameworks.includes('vue') && hooks.vue) {
    const vueComposables = generateVueComposables(model, schema)
    hooks.vue.set(`composables/use-${modelLower}.ts`, vueComposables)
  }
  
  // 4. Zustand adapter (if enabled)
  if (frameworks.includes('zustand') && hooks.zustand) {
    const zustandStore = generateZustandStore(model, schema)
    hooks.zustand.set(`stores/${modelLower}-store.ts`, zustandStore)
  }
  
  // 5. Vanilla adapter (if enabled)
  if (frameworks.includes('vanilla') && hooks.vanilla) {
    const vanillaStore = generateVanillaStore(model, schema)
    hooks.vanilla.set(`stores/${modelLower}-store.ts`, vanillaStore)
  }
  
  // 6. Angular adapter (if enabled)
  if (frameworks.includes('angular') && hooks.angular) {
    const angularService = generateAngularService(model, schema)
    hooks.angular.set(`services/${modelLower}.service.ts`, angularService)
  }
}

// Re-export generators for direct use
export * from './core-queries-generator.js'
export * from './react-adapter-generator.js'
export * from './framework-adapters.js'
export * from './test-generator.js'


