/**
 * UI Generator - Component Library System
 * 
 * Generates reusable component library + handler system + page stubs
 */

export { UiGenerator } from './ui-generator.js'
export { generateComponentLibrary } from './component-library-generator.js'
export { generateHandlers } from './handler-generator.js'
export { generatePageStubs } from './page-stub-generator.js'

export type {
  UiGeneratorConfig,
  ComponentLibraryConfig,
  HandlerConfig,
  PageStubConfig
} from './types.js'

