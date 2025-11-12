/**
 * UI Generator - Component Library System
 * 
 * Generates reusable component library + handler system + page stubs + complete websites
 */

export { generateUI } from './ui-generator.js'
export type { UiGeneratorConfig, UiGeneratorResult } from './ui-generator.js'
export { generateComponentLibrary } from './component-library-generator.js'
export { generateHandlers } from './handler-generator.js'
export { generatePageStubs } from './page-stub-generator.js'

export type {
  ComponentLibraryConfig,
  HandlerConfig,
  PageStubConfig
} from './types.js'

// Website Composition System
export { generatePages, createExamplePageSpec } from './page-composer.js'
export type { ComponentSpec, PageSpec, SectionSpec, PageMetadata } from './page-composer.js'

export { 
  generateSite, 
  loadSiteConfig, 
  validateSiteConfig,
  createExampleSiteConfig 
} from './site-builder.js'
export type { 
  SiteConfig, 
  PageDefinition, 
  ThemeConfig, 
  NavigationConfig,
  FeatureConfig 
} from './site-builder.js'

export type { 
  UiConfig,
  SiteSettings,
  ThemeSettings,
  NavigationSettings,
  PageConfig,
  PageSection,
  ComponentConfig,
  GenerationSettings
} from './ui-config-schema.js'

export {
  getTemplate,
  listTemplates,
  createBlogTemplate,
  createDashboardTemplate,
  createEcommerceTemplate,
  createLandingTemplate,
  createChatTemplate
} from './website-templates.js'

// Hook Linkers
export { generateHookLinkers } from './hook-linker-generator.js'

// Lightweight Components
export { generateLightweightComponents } from './lightweight-component-generator.js'

// Bulk Generation
export { generateBulkWebsites, loadBulkConfig } from './bulk-generator.js'
export type { BulkGenerateResult } from './bulk-generator.js'

