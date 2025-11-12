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

export {
  getTemplate,
  listTemplates,
  createBlogTemplate,
  createDashboardTemplate,
  createEcommerceTemplate,
  createLandingTemplate
} from './website-templates.js'

