/**
 * Template Loader
 * 
 * Three-step pipeline: Validate → Normalize → Plan
 * 
 * REDLINES ENFORCED:
 * - Version handshake (hard-fail on mismatch)
 * - Adapter firewall (no framework imports)
 * - Server-owned ordering (whitelisted fields only)
 * - HTML sanitization policy required
 * - Runtime flags explicit
 * - Error contract standardized
 */

import type {
  Template,
  DataContract,
  Capabilities,
  Mappings,
  Models,
  Theme,
  I18n
} from '@ssot-ui/schemas'

import {
  validateTemplateFile,
  validateDataContractFile,
  validateCapabilitiesFile,
  validateMappingsFile,
  validateModelsFile,
  validateThemeFile,
  validateI18nFile,
  validateCrossSchema,
  formatValidationErrors,
  formatValidationWarnings,
  type AllSchemas,
  type ValidationError
} from '@ssot-ui/schemas'

// ============================================================================
// Loader Input
// ============================================================================

export interface LoaderInput {
  template: unknown
  dataContract: unknown
  capabilities: unknown
  mappings: unknown
  models: unknown
  theme: unknown
  i18n: unknown
  runtimeVersion: string
}

// ============================================================================
// Normalized Template (After Normalization)
// ============================================================================

export interface NormalizedPage {
  type: 'list' | 'detail' | 'form' | 'custom'
  route: string
  runtime: 'server' | 'client' | 'edge'
  model?: string
  
  // Resolved data
  resolvedModel?: string     // After mapping
  resolvedFields?: Record<string, string> // field → resolved path
  
  // Defaults applied
  pagination?: { type: string; defaultSize: number }
  seo?: { title: string; description?: string }
  
  // Original definition
  original: any
}

export interface NormalizedTemplate {
  version: string
  name: string
  pages: NormalizedPage[]
  
  // Resolved mappings
  modelMappings: Map<string, string>
  fieldMappings: Map<string, string>
  
  // Metadata
  normalized: true
}

// ============================================================================
// Execution Plan (After Planning)
// ============================================================================

export interface RouteDefinition {
  path: string
  type: 'list' | 'detail' | 'form' | 'custom'
  runtime: 'server' | 'client' | 'edge'
  model: string
  params?: string[]          // Dynamic params ([id], [slug])
  guard?: { roles?: string[]; permissions?: string[] }
}

export interface DataRequirement {
  model: string
  operations: ('list' | 'detail' | 'create' | 'update' | 'delete')[]
  relations: string[]        // Aggregated includes
  filters: string[]          // Whitelisted fields
  sortable: string[]         // Whitelisted fields
}

export interface ExecutionPlan {
  routes: RouteDefinition[]
  data: DataRequirement[]
  guards: Array<{ route: string; roles?: string[]; permissions?: string[] }>
  
  // Rendering order
  serverPages: string[]      // Rendered first
  clientPages: string[]      // With "use client"
  edgePages: string[]        // Edge runtime
  
  // Metadata
  planned: true
  normalizedTemplate: NormalizedTemplate
}

// ============================================================================
// Loader Result
// ============================================================================

export interface LoaderSuccess {
  ok: true
  plan: ExecutionPlan
  warnings: string[]
  diagnostics: LoaderDiagnostics
}

export interface LoaderError {
  ok: false
  errors: ValidationError[]
  warnings: string[]
}

export type LoaderResult = LoaderSuccess | LoaderError

export interface LoaderDiagnostics {
  validationTime: number
  normalizationTime: number
  planningTime: number
  totalTime: number
  
  stats: {
    pages: number
    models: number
    guards: number
    relations: number
  }
  
  trace: string[]
}

// ============================================================================
// Template Loader
// ============================================================================

export class TemplateLoader {
  private diagnostics: LoaderDiagnostics = {
    validationTime: 0,
    normalizationTime: 0,
    planningTime: 0,
    totalTime: 0,
    stats: { pages: 0, models: 0, guards: 0, relations: 0 },
    trace: []
  }
  
  /**
   * Load template with full pipeline
   */
  async load(input: LoaderInput): Promise<LoaderResult> {
    const startTime = performance.now()
    
    this.diagnostics.trace = []
    
    // Step 1: Validate
    this.diagnostics.trace.push('Starting validation...')
    const validated = await this.validate(input)
    
    if (!validated.ok) {
      return validated
    }
    
    // Step 2: Normalize
    this.diagnostics.trace.push('Starting normalization...')
    const normalized = await this.normalize(validated.schemas)
    
    // Step 3: Plan
    this.diagnostics.trace.push('Starting planning...')
    const plan = await this.plan(normalized, validated.schemas)
    
    // Record total time
    this.diagnostics.totalTime = performance.now() - startTime
    this.diagnostics.trace.push(`✅ Complete in ${this.diagnostics.totalTime.toFixed(2)}ms`)
    
    return {
      ok: true,
      plan,
      warnings: validated.warnings,
      diagnostics: this.diagnostics
    }
  }
  
  /**
   * Step 1: Validate all JSON files
   */
  private async validate(input: LoaderInput): Promise<
    | { ok: true; schemas: AllSchemas; warnings: string[] }
    | { ok: false; errors: ValidationError[]; warnings: string[] }
  > {
    const startTime = performance.now()
    const allErrors: ValidationError[] = []
    const allWarnings: string[] = []
    
    // Validate each file individually
    const validations = [
      { name: 'template.json', data: input.template, fn: validateTemplateFile },
      { name: 'data-contract.json', data: input.dataContract, fn: validateDataContractFile },
      { name: 'capabilities.json', data: input.capabilities, fn: validateCapabilitiesFile },
      { name: 'mappings.json', data: input.mappings, fn: validateMappingsFile },
      { name: 'models.json', data: input.models, fn: validateModelsFile },
      { name: 'theme.json', data: input.theme, fn: validateThemeFile },
      { name: 'i18n.json', data: input.i18n, fn: validateI18nFile }
    ]
    
    for (const { name, data, fn } of validations) {
      this.diagnostics.trace.push(`  Validating ${name}...`)
      const result = fn(data)
      
      if (!result.valid) {
        allErrors.push(...result.errors)
        this.diagnostics.trace.push(`  ❌ ${name} validation failed`)
      } else {
        allWarnings.push(...result.warnings)
        this.diagnostics.trace.push(`  ✅ ${name} valid`)
      }
    }
    
    // If any file failed, stop
    if (allErrors.length > 0) {
      this.diagnostics.validationTime = performance.now() - startTime
      return {
        ok: false,
        errors: allErrors,
        warnings: allWarnings
      }
    }
    
    // Cast to typed schemas
    const schemas: AllSchemas = {
      template: input.template as Template,
      dataContract: input.dataContract as DataContract,
      capabilities: input.capabilities as Capabilities,
      mappings: input.mappings as Mappings,
      models: input.models as Models,
      theme: input.theme as Theme,
      i18n: input.i18n as I18n
    }
    
    // Cross-schema validation
    this.diagnostics.trace.push('  Cross-schema validation...')
    const crossResult = validateCrossSchema(schemas, input.runtimeVersion)
    
    if (!crossResult.valid) {
      allErrors.push(...crossResult.errors)
      this.diagnostics.trace.push('  ❌ Cross-schema validation failed')
      this.diagnostics.validationTime = performance.now() - startTime
      
      return {
        ok: false,
        errors: allErrors,
        warnings: [...allWarnings, ...crossResult.warnings]
      }
    }
    
    allWarnings.push(...crossResult.warnings)
    this.diagnostics.trace.push('  ✅ Cross-schema validation passed')
    
    this.diagnostics.validationTime = performance.now() - startTime
    this.diagnostics.trace.push(`  Validation complete (${this.diagnostics.validationTime.toFixed(2)}ms)`)
    
    return {
      ok: true,
      schemas,
      warnings: allWarnings
    }
  }
  
  /**
   * Step 2: Normalize (resolve aliases, apply defaults, validate deep paths)
   */
  private async normalize(schemas: AllSchemas): Promise<NormalizedTemplate> {
    const startTime = performance.now()
    
    // Build mappings
    const modelMappings = new Map(Object.entries(schemas.mappings.models))
    const fieldMappings = new Map(Object.entries(schemas.mappings.fields))
    
    // Normalize pages
    const normalizedPages: NormalizedPage[] = []
    
    for (const page of schemas.template.pages) {
      const normalized: NormalizedPage = {
        type: page.type,
        route: page.route,
        runtime: page.runtime,
        original: page
      }
      
      // Resolve model
      if (page.type !== 'custom') {
        normalized.model = page.model
        normalized.resolvedModel = modelMappings.get(page.model) || page.model
        this.diagnostics.trace.push(`  Model: ${page.model} → ${normalized.resolvedModel}`)
      }
      
      // Apply defaults
      if (page.type === 'list') {
        normalized.pagination = page.pagination || { type: 'pages', defaultSize: 20 }
        this.diagnostics.trace.push(`  Applied default pagination for ${page.route}`)
      }
      
      // Apply SEO defaults
      if (page.type !== 'custom') {
        const pageWithSEO = page as any
        if (!pageWithSEO.seo && pageWithSEO.title) {
          normalized.seo = { title: pageWithSEO.title }
          this.diagnostics.trace.push(`  Applied default SEO for ${page.route}`)
        }
      }
      
      normalizedPages.push(normalized)
    }
    
    this.diagnostics.normalizationTime = performance.now() - startTime
    this.diagnostics.trace.push(`  Normalization complete (${this.diagnostics.normalizationTime.toFixed(2)}ms)`)
    
    return {
      version: schemas.template.version,
      name: schemas.template.name,
      pages: normalizedPages,
      modelMappings,
      fieldMappings,
      normalized: true
    }
  }
  
  /**
   * Step 3: Plan (derive routes, data, guards, rendering order)
   */
  private async plan(normalized: NormalizedTemplate, schemas: AllSchemas): Promise<ExecutionPlan> {
    const startTime = performance.now()
    
    // Derive routes
    const routes: RouteDefinition[] = []
    const serverPages: string[] = []
    const clientPages: string[] = []
    const edgePages: string[] = []
    
    for (const page of normalized.pages) {
      // Extract dynamic params
      const params = this.extractParams(page.route)
      
      const route: RouteDefinition = {
        path: page.route,
        type: page.type,
        runtime: page.runtime,
        model: page.resolvedModel || page.model || '',
        params,
        guard: schemas.template.guards?.[page.route]
      }
      
      routes.push(route)
      
      // Group by runtime
      if (page.runtime === 'server') serverPages.push(page.route)
      else if (page.runtime === 'client') clientPages.push(page.route)
      else if (page.runtime === 'edge') edgePages.push(page.route)
    }
    
    this.diagnostics.trace.push(`  Derived ${routes.length} routes`)
    this.diagnostics.trace.push(`    Server: ${serverPages.length}, Client: ${clientPages.length}, Edge: ${edgePages.length}`)
    
    // Aggregate data requirements
    const dataMap = new Map<string, DataRequirement>()
    
    for (const page of normalized.pages) {
      if (page.type === 'custom' || !page.resolvedModel) continue
      
      const model = page.resolvedModel
      
      if (!dataMap.has(model)) {
        dataMap.set(model, {
          model,
          operations: [],
          relations: [],
          filters: [],
          sortable: []
        })
      }
      
      const req = dataMap.get(model)!
      
      // Determine operations
      if (page.type === 'list' && !req.operations.includes('list')) {
        req.operations.push('list')
      }
      if (page.type === 'detail' && !req.operations.includes('detail')) {
        req.operations.push('detail')
      }
      if (page.type === 'form') {
        if (page.original.mode === 'create' && !req.operations.includes('create')) {
          req.operations.push('create')
        }
        if (page.original.mode === 'edit' && !req.operations.includes('update')) {
          req.operations.push('update')
        }
      }
      
      // Aggregate relations
      if (page.original.relations) {
        for (const rel of page.original.relations) {
          if (!req.relations.includes(rel)) {
            req.relations.push(rel)
          }
        }
      }
      
      // Get whitelisted filters/sorts from data-contract
      const modelContract = schemas.dataContract.models[model]
      if (modelContract?.list) {
        req.filters = modelContract.list.filterable.map(f => 
          typeof f === 'string' ? f : f.field
        )
        req.sortable = modelContract.list.sortable
      }
    }
    
    const data = Array.from(dataMap.values())
    this.diagnostics.trace.push(`  Aggregated data requirements for ${data.length} models`)
    
    // Extract guards
    const guards = Object.entries(schemas.template.guards || {}).map(([route, guard]) => ({
      route,
      ...guard
    }))
    
    this.diagnostics.trace.push(`  Found ${guards.length} route guards`)
    
    // Record stats
    this.diagnostics.stats = {
      pages: routes.length,
      models: data.length,
      guards: guards.length,
      relations: data.reduce((sum, d) => sum + d.relations.length, 0)
    }
    
    this.diagnostics.planningTime = performance.now() - startTime
    this.diagnostics.trace.push(`  Planning complete (${this.diagnostics.planningTime.toFixed(2)}ms)`)
    
    return {
      routes,
      data,
      guards,
      serverPages,
      clientPages,
      edgePages,
      planned: true,
      normalizedTemplate: normalized
    }
  }
  
  /**
   * Extract dynamic params from route
   */
  private extractParams(route: string): string[] {
    const matches = route.matchAll(/\[([^\]]+)\]/g)
    return Array.from(matches).map(m => m[1])
  }
  
  /**
   * Get diagnostics
   */
  getDiagnostics(): LoaderDiagnostics {
    return this.diagnostics
  }
}

// ============================================================================
// Convenience Function
// ============================================================================

/**
 * Load template with single function call
 */
export async function loadTemplate(input: LoaderInput): Promise<LoaderResult> {
  const loader = new TemplateLoader()
  return loader.load(input)
}

/**
 * Format loader errors for display
 */
export function formatLoaderErrors(result: LoaderError): string {
  let output = formatValidationErrors(result.errors)
  
  if (result.warnings.length > 0) {
    output += formatValidationWarnings(result.warnings)
  }
  
  return output
}

/**
 * Format loader success for display
 */
export function formatLoaderSuccess(result: LoaderSuccess): string {
  const { plan, diagnostics } = result
  
  let output = '\n✅ Template loaded successfully!\n\n'
  
  output += '📊 Summary:\n'
  output += `  Pages: ${diagnostics.stats.pages} (${plan.serverPages.length} server, ${plan.clientPages.length} client, ${plan.edgePages.length} edge)\n`
  output += `  Models: ${diagnostics.stats.models}\n`
  output += `  Guards: ${diagnostics.stats.guards}\n`
  output += `  Relations: ${diagnostics.stats.relations}\n\n`
  
  output += '⚡ Performance:\n'
  output += `  Validation: ${diagnostics.validationTime.toFixed(2)}ms\n`
  output += `  Normalization: ${diagnostics.normalizationTime.toFixed(2)}ms\n`
  output += `  Planning: ${diagnostics.planningTime.toFixed(2)}ms\n`
  output += `  Total: ${diagnostics.totalTime.toFixed(2)}ms\n\n`
  
  if (result.warnings.length > 0) {
    output += formatValidationWarnings(result.warnings)
  }
  
  return output
}

