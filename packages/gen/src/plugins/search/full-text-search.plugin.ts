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
    
    const modelConfigs = enabledModels.map(([modelName, modelConfig]) => {
      const fields = modelConfig.fields.map(f => `    { 
      name: '${f.name}', 
      weight: ${f.weight}, 
      matchTypes: [${f.matchTypes.map(m => `'${m}'`).join(', ')}]
    }`).join(',\n')
      
      let ranking = ''
      if (modelConfig.ranking) {
        const parts: string[] = []
        if (modelConfig.ranking.boostRecent) {
          parts.push(`    boostRecent: { field: '${modelConfig.ranking.boostRecent.field}', weight: ${modelConfig.ranking.boostRecent.weight} }`)
        }
        if (modelConfig.ranking.boostPopular) {
          parts.push(`    boostPopular: { field: '${modelConfig.ranking.boostPopular.field}', weight: ${modelConfig.ranking.boostPopular.weight} }`)
        }
        if (parts.length > 0) {
          ranking = `,\n  ranking: {\n${parts.join(',\n')}\n  }`
        }
      }
      
      return `export const ${modelName.toLowerCase()}SearchConfig: SearchConfig = {
  fields: [
${fields}
  ]${ranking}
}`
    }).join('\n\n')
    
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
  
  private generateSearchService(models: ParsedModel[], config: SearchPluginConfig): string {
    const enabledModels = Object.entries(config.models)
      .filter(([_, cfg]) => cfg.enabled)
    
    const imports = enabledModels.map(([modelName]) => modelName).join(', ')
    
    // Get actual Prisma model names (case-sensitive)
    const modelMap = models.reduce((acc, model) => {
      acc[model.name.toLowerCase()] = model.name
      return acc
    }, {} as Record<string, string>)
    
    const fetchCases = enabledModels.map(([modelName, modelConfig]) => {
      const fieldNames = modelConfig.fields.map(f => f.name)
      const orConditions = fieldNames.map(field => 
        `{ ${field}: { contains: query, mode: 'insensitive' as const } }`
      ).join(',\n          ')
      
      // Use actual Prisma model name (could be different case)
      const prismaModelName = modelMap[modelName.toLowerCase()] || modelName
      const prismaAccessor = prismaModelName.charAt(0).toLowerCase() + prismaModelName.slice(1)
      
      return `      case '${modelName.toLowerCase()}':
        return prisma.${prismaAccessor}.findMany({
          where: { OR: [
          ${orConditions}
        ] },
          take: options.fetchLimit || (options.limit || 10) * 10
        })`
    }).join('\n      \n')
    
    return `// @generated
// Search Service - Minimal logic, reuses SearchEngine from SDK runtime

import { prisma } from '@/db/client'
import { SearchEngine, type SearchOptions, type SearchResult } from '@ssot-codegen/sdk-runtime'
import { searchRegistry, type SearchableModel } from './search.config.js'
import type { ${imports} } from '@prisma/client'

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
   * Fetch records from DB (reuses existing query patterns)
   */
  private async fetchRecords(
    modelName: SearchableModel,
    query: string,
    options: SearchOptions
  ) {
    switch (modelName) {
${fetchCases}
      
      default:
        return []
    }
  }
}
`
  }
  
  private generateSearchController(config: SearchPluginConfig): string {
    return `// @generated
// Search Controller

import type { Request, Response } from 'express'
import { SearchService } from './search.service.js'

const searchService = new SearchService()

/**
 * GET /api/search?q=query&model=product&limit=10&skip=0&minScore=0&sort=relevance
 */
export async function search(req: Request, res: Response) {
  try {
    const { q, model, limit = 10, skip = 0, minScore = 0, sort = 'relevance' } = req.query
    
    // Validation
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' })
    }
    
    if (!model || typeof model !== 'string') {
      return res.status(400).json({ error: 'Query parameter "model" is required' })
    }
    
    const parsedLimit = Number(limit)
    const parsedSkip = Number(skip)
    const parsedMinScore = Number(minScore)
    
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' })
    }
    
    if (isNaN(parsedSkip) || parsedSkip < 0) {
      return res.status(400).json({ error: 'Skip must be >= 0' })
    }
    
    // Get all results for total count
    const allResults = await searchService.search(
      model as any,
      q,
      { 
        limit: 10000,  // Large limit to get all matches
        skip: 0, 
        minScore: parsedMinScore,
        sort: sort as any
      }
    )
    
    // Apply requested pagination
    const paginatedResults = allResults.slice(parsedSkip, parsedSkip + parsedLimit)
    const total = allResults.length
    const page = Math.floor(parsedSkip / parsedLimit) + 1
    const totalPages = Math.ceil(total / parsedLimit)
    
    res.json({ 
      results: paginatedResults,
      pagination: {
        total,           // Total matching records
        count: paginatedResults.length,  // Results in this page
        skip: parsedSkip,
        limit: parsedLimit,
        page,
        totalPages,
        hasMore: parsedSkip + parsedLimit < total,
        hasPrevious: parsedSkip > 0
      },
      query: q,
      model
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ 
      error: 'Search failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * GET /api/search/all?q=query&models=product,user&limit=10&minScore=0
 */
export async function searchAll(req: Request, res: Response) {
  try {
    const { q, models, limit = 10, minScore = 0 } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' })
    }
    
    const parsedLimit = Number(limit)
    const parsedMinScore = Number(minScore)
    
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' })
    }
    
    const modelList = models 
      ? String(models).split(',').map(m => m.trim())
      : undefined
    
    const results = await searchService.searchAll(
      q, 
      modelList as any, 
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
      query: q,
      modelsSearched: modelList || 'all'
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ 
      error: 'Search failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
`
  }
  
  private generateSearchTypes(models: ParsedModel[], config: SearchPluginConfig): string {
    return `// @generated
// Search Types

import type { SearchResult as BaseSearchResult, SearchOptions as BaseSearchOptions } from '@ssot-codegen/sdk-runtime'

export type { BaseSearchResult as SearchResult, BaseSearchOptions as SearchOptions }

export interface SearchResponse<T> {
  results: BaseSearchResult<T>[]
  total: number
  query: string
  model: string
}

export interface FederatedSearchResponse {
  results: Array<{
    model: string
    results: BaseSearchResult<any>[]
  }>
  query: string
  modelsSearched: string | string[]
}
`
  }
}

