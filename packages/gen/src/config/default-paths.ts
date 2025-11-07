/**
 * Default Paths Configuration
 * 
 * Centralized path configuration for code generation.
 * Define layer names, alias, and filename patterns in one place.
 */

import type { PathsConfig } from '../path-resolver.js'

/**
 * Default paths configuration used across all generation modes
 * 
 * - `alias`: Import alias for generated code (@gen)
 * - `rootDir`: Base directory for generated code
 * - `perModelSubfolders`: Whether to create subdirectories per model
 * - `useBarrels`: Whether to generate barrel exports (index.ts)
 * - `filenamePattern`: How to name files (model.artifact.suffix)
 * - `layers`: Directory names for each layer of generated code
 */
export const defaultPaths: PathsConfig = {
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

