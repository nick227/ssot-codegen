/**
 * Full-Text Search Plugin
 * 
 * Generates search configuration and services for full-text search
 * Uses SearchEngine from SDK runtime for DRY code generation
 */

import type {
  FeaturePluginV2,
  PluginContextV2,
  PluginOutputV2,
  ValidationResultV2,
  PluginRequirementsV2,
  PluginConfigSchema
} from '../plugin-v2.interface.js'
import type { ParsedModel } from '../../dmmf-parser.js'

export interface SearchPluginConfig {
  strategy?: 'simple' | 'postgres-fts' | 'elasticsearch'
  defaultWeights?: {
    startsWith: number
    exactMatch: number
    contains: number
    wordBoundary: number
    fuzzy: number
  }
  models: Record<string, ModelSearchConfig>
}

export interface ModelSearchConfig {
  enabled: boolean
  fields: SearchFieldConfig[]
  ranking?: {
    boostRecent?: { field: string; weight: number }
    boostPopular?: { field: string; weight: number }
  }
}

export interface SearchFieldConfig {
  name: string
  weight: number
  priority?: 'high' | 'medium' | 'low'
  matchTypes: Array<'startsWith' | 'exact' | 'contains' | 'fuzzy' | 'wordBoundary'>
}

export class FullTextSearchPlugin implements FeaturePluginV2 {
  name = 'full-text-search'
  version = '1.0.0'
  description = 'Full-text search with configurable ranking and scoring'
  enabled = true
  
  configSchema: PluginConfigSchema = {
    type: 'object',
    properties: {
      strategy: {
        type: 'string',
        enum: ['simple', 'postgres-fts', 'elasticsearch'],
        default: 'simple',
        description: 'Search implementation strategy'
      },
      defaultWeights: {
        type: 'object',
        description: 'Default scoring weights for match types'
      },
      models: {
        type: 'object',
        description: 'Per-model search configuration'
      }
    },
    required: ['models']
  }
  
  requirements: PluginRequirementsV2 = {
    envVars: {
      required: [],
      optional: []
    },
    dependencies: {
      runtime: {
        '@ssot-codegen/sdk-runtime': '^1.0.0'
      }
    }
  }
  
  validate(context: PluginContextV2): ValidationResultV2 {
    const errors: any[] = []
    const warnings: any[] = []
    const suggestions: any[] = []
    
    const pluginConfig = context.config.plugins?.[this.name] as SearchPluginConfig
    
    if (!pluginConfig?.models || Object.keys(pluginConfig.models).length === 0) {
      errors.push({
        severity: 'error',
        message: 'No models configured for search. Add models to plugin config.',
        code: 'NO_SEARCH_MODELS'
      })
      return { valid: false, errors, warnings, suggestions }
    }
    
    // Validate each model exists in schema
    for (const [modelName, modelConfig] of Object.entries(pluginConfig.models)) {
      const model = context.schema.models.find(m => m.name === modelName)
      
      if (!model) {
        warnings.push({
          severity: 'warning',
          message: `Model "${modelName}" not found in schema`,
          code: 'MODEL_NOT_FOUND'
        })
        continue
      }
      
      // Validate fields exist
      if (modelConfig.enabled) {
        for (const field of modelConfig.fields) {
          const fieldExists = model.fields.find(f => f.name === field.name)
          if (!fieldExists) {
            warnings.push({
              severity: 'warning',
              message: `Field "${field.name}" not found in model "${modelName}"`,
              field: field.name
            })
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }
  
  generate(context: PluginContextV2): PluginOutputV2 {
    const files = new Map<string, string>()
    const pluginConfig = context.config.plugins?.[this.name] as SearchPluginConfig
    
    if (!pluginConfig) {
      throw new Error('Search plugin config not found')
    }
    
    // Generate search config (just data, no logic)
    files.set('search/search.config.ts', this.generateSearchConfig(context.schema.models, pluginConfig))
    
    // Generate search service (minimal logic, reuses SearchEngine)
    files.set('search/search.service.ts', this.generateSearchService(context.schema.models, pluginConfig))
    
    // Generate search controller
    files.set('search/search.controller.ts', this.generateSearchController(pluginConfig))
    
    // Generate search types
    files.set('search/search.types.ts', this.generateSearchTypes(context.schema.models, pluginConfig))
    
    return {
      files,
      routes: [
        {
          path: '/api/search',
          method: 'get',
          handler: '@/search/search.controller',
          middleware: []
        },
        {
          path: '/api/search/all',
          method: 'get',
          handler: '@/search/search.controller',
          middleware: []
        }
      ],
      middleware: [],
      envVars: {},
      packageJson: {
        dependencies: {
          '@ssot-codegen/sdk-runtime': '^1.0.0'
        }
      }
    }
  }
  
  private generateSearchConfig(models: ParsedModel[], config: SearchPluginConfig): string {
    const enabledModels = Object.entries(config.models)
      .filter(([_, cfg]) => cfg.enabled)
    
    const modelConfigs = enabledModels.map(([modelName, modelConfig]) => 
      this.generateModelSearchConfig(modelName, modelConfig)
    ).join('\n\n')
    
    const registryEntries = enabledModels.map(([modelName]) => 
      `  ${modelName.toLowerCase()}: ${modelName.toLowerCase()}SearchConfig`
    ).join(',\n')
    
    return `// @generated
// Search Configuration - Generated by full-text-search plugin
// This file contains ONLY configuration data, not logic

import type { SearchConfig } from '@ssot-codegen/sdk-runtime'

${modelConfigs}

export const searchRegistry = {
${registryEntries}
} as const

export type SearchableModel = keyof typeof searchRegistry
`
  }
  
  private generateModelSearchConfig(modelName: string, modelConfig: ModelSearchConfig): string {
    const fields = modelConfig.fields
      .map(f => `    { name: '${f.name}', weight: ${f.weight}, matchTypes: [${f.matchTypes.map(m => `'${m}'`).join(', ')}] }`)
      .join(',\n')
    
    const ranking = this.generateRankingConfig(modelConfig.ranking)
    
    return `export const ${modelName.toLowerCase()}SearchConfig: SearchConfig = {
  fields: [
${fields}
  ]${ranking}
}`
  }
  
  private generateRankingConfig(ranking?: ModelSearchConfig['ranking']): string {
    if (!ranking) return ''
    
    const parts: string[] = []
    if (ranking.boostRecent) {
      parts.push(`    boostRecent: { field: '${ranking.boostRecent.field}', weight: ${ranking.boostRecent.weight} }`)
    }
    if (ranking.boostPopular) {
      parts.push(`    boostPopular: { field: '${ranking.boostPopular.field}', weight: ${ranking.boostPopular.weight} }`)
    }
    
    return parts.length > 0 ? `,\n  ranking: {\n${parts.join(',\n')}\n  }` : ''
  }
  
  private buildModelMetadata(models: ParsedModel[], enabledModels: Array<[string, ModelSearchConfig]>): string {
    return enabledModels.map(([modelName, modelConfig]) => {
      const model = models.find(m => m.name === modelName)
      if (!model) return ''
      
      const prismaAccessor = model.name.charAt(0).toLowerCase() + model.name.slice(1)
      const fieldNames = modelConfig.fields.map(f => `'${f.name}'`).join(', ')
      
      return `  '${modelName.toLowerCase()}': { accessor: '${prismaAccessor}', fields: [${fieldNames}] }`
    }).join(',\n')
  }
  
  private generateSearchService(models: ParsedModel[], config: SearchPluginConfig): string {
    const enabledModels = Object.entries(config.models)
      .filter(([_, cfg]) => cfg.enabled)
    
    const imports = enabledModels.map(([modelName]) => modelName).join(', ')
    
    // Build model metadata for dynamic access
    const modelMetadata = this.buildModelMetadata(models, enabledModels)
    
    return `// @generated
// Search Service - Minimal logic, reuses SearchEngine from SDK runtime

import { prisma } from '@/db/client'
import { SearchEngine, type SearchOptions, type SearchResult } from '@ssot-codegen/sdk-runtime'
import { searchRegistry, type SearchableModel } from './search.config.js'
import type { ${imports} } from '@prisma/client'

/**
 * Model metadata for dynamic Prisma access (DRY)
 */
const modelMetadata: Record<SearchableModel, { accessor: string; fields: string[] }> = {
${modelMetadata}
}

/**
 * Unified Search Service
 * Uses SearchEngine from SDK runtime - NO DUPLICATED LOGIC
 * SearchEngine instances are cached per model for performance
 */
export class SearchService {
  private engines = new Map<SearchableModel, SearchEngine<any>>()
  
  /**
   * Get or create cached SearchEngine for a model
   */
  private getEngine<T>(modelName: SearchableModel): SearchEngine<T> {
    if (!this.engines.has(modelName)) {
      const config = searchRegistry[modelName]
      if (!config) {
        throw new Error(\`No search config for model: \${modelName}\`)
      }
      this.engines.set(modelName, new SearchEngine<T>(config${config.defaultWeights ? ', ' + JSON.stringify(config.defaultWeights) : ''}))
    }
    return this.engines.get(modelName)!
  }
  
  /**
   * Search any model by name
   */
  async search<T = any>(
    modelName: SearchableModel,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<T>[]> {
    // Fetch records from database
    const records = await this.fetchRecords(modelName, query, options)
    
    // Use cached SearchEngine to score and rank
    const engine = this.getEngine<T>(modelName)
    return engine.search(records as T[], query, options)
  }
  
  /**
   * Federated search across multiple models
   */
  async searchAll(
    query: string,
    models: SearchableModel[] = [${enabledModels.map(([name]) => `'${name.toLowerCase()}'`).join(', ')}],
    options: SearchOptions = {}
  ) {
    const results = await Promise.all(
      models.map(async model => ({
        model,
        results: await this.search(model, query, options)
      }))
    )
    
    return results.filter(r => r.results.length > 0)
  }
  
  /**
   * Fetch records from DB using dynamic metadata (DRY - no switch statement)
   */
  private async fetchRecords(
    modelName: SearchableModel,
    query: string,
    options: SearchOptions
  ) {
    const metadata = modelMetadata[modelName]
    if (!metadata) {
      throw new Error(\`No metadata for model: \${modelName}\`)
    }
    
    // Build OR conditions dynamically from metadata
    const orConditions = metadata.fields.map(field => ({
      [field]: { contains: query, mode: 'insensitive' as const }
    }))
    
    // Dynamic Prisma access (type-safe)
    const prismaModel = (prisma as any)[metadata.accessor]
    if (!prismaModel) {
      throw new Error(\`Prisma model not found: \${metadata.accessor}\`)
    }
    
    return prismaModel.findMany({
      where: { OR: orConditions },
      take: options.fetchLimit || (options.limit || 10) * 10
    })
  }
}
`
  }
  
  private generateSearchController(config: SearchPluginConfig): string {
    return `// @generated
// Search Controller

import type { Request, Response } from 'express'
import { SearchService } from './search.service.js'
import type { SearchableModel } from './search.config.js'

const searchService = new SearchService()

// Configuration
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 10
const MAX_TOTAL_FETCH = 10000

/**
 * Validation helpers (DRY)
 */
function validateQuery(q: unknown): string {
  if (!q || typeof q !== 'string') {
    throw new Error('Query parameter "q" is required')
  }
  return q
}

function validateLimit(limit: unknown): number {
  const parsed = Number(limit)
  if (isNaN(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    throw new Error(\`Limit must be between 1 and \${MAX_LIMIT}\`)
  }
  return parsed
}

function validateSkip(skip: unknown): number {
  const parsed = Number(skip)
  if (isNaN(parsed) || parsed < 0) {
    throw new Error('Skip must be >= 0')
  }
  return parsed
}

function validateMinScore(minScore: unknown): number {
  const parsed = Number(minScore)
  if (isNaN(parsed) || parsed < 0) {
    throw new Error('minScore must be >= 0')
  }
  return parsed
}

function validateModel(model: unknown): SearchableModel {
  if (!model || typeof model !== 'string') {
    throw new Error('Query parameter "model" is required')
  }
  return model as SearchableModel
}

function handleError(res: Response, error: unknown) {
  console.error('Search error:', error)
  
  const message = error instanceof Error ? error.message : 'Unknown error'
  const statusCode = message.includes('parameter') || message.includes('must be') ? 400 : 500
  
  res.status(statusCode).json({ 
    error: statusCode === 400 ? 'Invalid request' : 'Search failed', 
    message
  })
}

function calculatePagination(total: number, skip: number, limit: number) {
  return {
    total,
    count: Math.min(total - skip, limit),
    skip,
    limit,
    page: Math.floor(skip / limit) + 1,
    totalPages: Math.ceil(total / limit),
    hasMore: skip + limit < total,
    hasPrevious: skip > 0
  }
}

/**
 * GET /api/search?q=query&model=product&limit=10&skip=0&minScore=0&sort=relevance
 */
export async function search(req: Request, res: Response) {
  try {
    const { q, model, limit = DEFAULT_LIMIT, skip = 0, minScore = 0, sort = 'relevance' } = req.query
    
    // Validate inputs (throws on error)
    const query = validateQuery(q)
    const modelName = validateModel(model)
    const parsedLimit = validateLimit(limit)
    const parsedSkip = validateSkip(skip)
    const parsedMinScore = validateMinScore(minScore)
    
    // Get all results for accurate total count
    const allResults = await searchService.search(
      modelName,
      query,
      { 
        limit: MAX_TOTAL_FETCH,
        skip: 0, 
        minScore: parsedMinScore,
        sort: sort as any
      }
    )
    
    // Apply client-requested pagination
    const paginatedResults = allResults.slice(parsedSkip, parsedSkip + parsedLimit)
    
    res.json({ 
      results: paginatedResults,
      pagination: calculatePagination(allResults.length, parsedSkip, parsedLimit),
      query,
      model: modelName
    })
  } catch (error) {
    handleError(res, error)
  }
}

/**
 * GET /api/search/all?q=query&models=product,user&limit=10&minScore=0
 */
export async function searchAll(req: Request, res: Response) {
  try {
    const { q, models, limit = DEFAULT_LIMIT, minScore = 0 } = req.query
    
    // Validate inputs
    const query = validateQuery(q)
    const parsedLimit = validateLimit(limit)
    const parsedMinScore = validateMinScore(minScore)
    
    const modelList = models 
      ? String(models).split(',').map(m => m.trim() as SearchableModel)
      : undefined
    
    const results = await searchService.searchAll(
      query, 
      modelList, 
      { limit: parsedLimit, minScore: parsedMinScore }
    )
    
    // Calculate totals across all models
    const totalResults = results.reduce((sum, r) => sum + r.results.length, 0)
    
    res.json({ 
      results,
      pagination: {
        total: totalResults,
        modelsSearched: results.length
      },
      query,
      modelsSearched: modelList || 'all'
    })
  } catch (error) {
    handleError(res, error)
  }
}
`
  }
  
  private generateSearchTypes(models: ParsedModel[], config: SearchPluginConfig): string {
    return `// @generated
// Search Types

import type { SearchResult as BaseSearchResult, SearchOptions as BaseSearchOptions } from '@ssot-codegen/sdk-runtime'

export type { BaseSearchResult as SearchResult, BaseSearchOptions as SearchOptions }

export interface PaginationMeta {
  total: number         // Total matching records
  count: number         // Results in current page
  skip: number          // Number of records skipped
  limit: number         // Max results per page
  page: number          // Current page number (1-indexed)
  totalPages: number    // Total number of pages
  hasMore: boolean      // Whether there are more results
  hasPrevious: boolean  // Whether there are previous results
}

export interface SearchResponse<T> {
  results: BaseSearchResult<T>[]
  pagination: PaginationMeta
  query: string
  model: string
}

export interface FederatedSearchResponse {
  results: Array<{
    model: string
    results: BaseSearchResult<any>[]
  }>
  pagination: {
    total: number
    modelsSearched: number
  }
  query: string
  modelsSearched: string | string[]
}
`
  }
}

