/**
 * Search Engine - Generic full-text search with scoring and ranking
 * 
 * This is shared runtime code - generated projects just provide configuration
 */

export interface SearchConfig<T = any> {
  fields: SearchFieldConfig[]
  ranking?: RankingConfig
  preprocessor?: (query: string) => string
}

export interface SearchFieldConfig {
  name: string
  weight: number
  matchTypes: MatchType[]
  getter?: (record: any) => string
}

export interface RankingConfig {
  boostRecent?: { field: string; weight: number }
  boostPopular?: { field: string; weight: number }
  customScorer?: (record: any, query: string) => number
}

export type MatchType = 'startsWith' | 'exact' | 'contains' | 'fuzzy' | 'wordBoundary'

export interface SearchWeights {
  startsWith: number
  exactMatch: number
  contains: number
  wordBoundary: number
  fuzzy: number
}

export interface SearchOptions {
  limit?: number
  skip?: number
  minScore?: number
  sort?: 'relevance' | 'recent' | 'popular'
  fetchLimit?: number  // How many records to fetch before scoring (default: limit * 10)
}

export interface SearchEngineConfig {
  maxQueryLength?: number  // Default: 1000
  maxLimit?: number        // Default: 100
  minFuzzyLength?: number  // Default: 3
  fuzzyThreshold?: number  // Default: 0.7
}

export interface SearchResult<T> {
  data: T
  score: number
  matches: Array<{ field: string; type: MatchType }>
}

/**
 * Generic Search Engine - All search logic in one place
 */
export class SearchEngine<T> {
  private engineConfig: Required<SearchEngineConfig>
  
  constructor(
    private config: SearchConfig<T>,
    private weights: SearchWeights = {
      exactMatch: 20,
      startsWith: 15,
      contains: 5,
      wordBoundary: 10,
      fuzzy: 3
    },
    engineConfig: SearchEngineConfig = {}
  ) {
    this.engineConfig = {
      maxQueryLength: engineConfig.maxQueryLength ?? 1000,
      maxLimit: engineConfig.maxLimit ?? 100,
      minFuzzyLength: engineConfig.minFuzzyLength ?? 3,
      fuzzyThreshold: engineConfig.fuzzyThreshold ?? 0.7
    }
  }
  
  /**
   * Search through records with scoring
   */
  search(records: T[], query: string, options: SearchOptions = {}): SearchResult<T>[] {
    // Validate query
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string')
    }
    if (query.length > this.engineConfig.maxQueryLength) {
      throw new Error(`Query too long (max ${this.engineConfig.maxQueryLength} characters)`)
    }
    
    // Validate options
    const limit = options.limit || 10
    const skip = options.skip || 0
    
    if (limit < 1 || limit > this.engineConfig.maxLimit) {
      throw new Error(`Limit must be between 1 and ${this.engineConfig.maxLimit}`)
    }
    if (skip < 0) {
      throw new Error('Skip must be >= 0')
    }
    if (options.minScore !== undefined && options.minScore < 0) {
      throw new Error('minScore must be >= 0')
    }
    
    const normalizedQuery = this.config.preprocessor 
      ? this.config.preprocessor(query)
      : query.toLowerCase().trim()
    
    if (!normalizedQuery) return []
    
    // Score each record and filter out zero scores (unless minScore is explicitly 0)
    const minScore = options.minScore !== undefined ? options.minScore : 0.01
    const scored = records
      .map(record => this.scoreRecord(record, normalizedQuery))
      .filter(result => result.score >= minScore)
    
    // Sort by relevance or other criteria
    this.sortResults(scored, options.sort || 'relevance')
    
    // Paginate
    return scored.slice(skip, skip + limit)
  }
  
  /**
   * Score a single record against query
   */
  private scoreRecord(record: T, query: string): SearchResult<T> {
    let score = 0
    const matches: Array<{ field: string; type: MatchType }> = []
    
    for (const field of this.config.fields) {
      const value = field.getter 
        ? field.getter(record)
        : String((record as any)[field.name] || '').toLowerCase()
      
      if (!value) continue
      
      const fieldScore = this.scoreField(value, query, field.matchTypes)
      
      if (fieldScore.score > 0) {
        score += fieldScore.score * (field.weight / 100)
        matches.push(...fieldScore.matches.map(type => ({ field: field.name, type })))
      }
    }
    
    // Only apply ranking boosts if there was at least one field match
    if (score > 0 && this.config.ranking) {
      score += this.calculateRankingBoost(record, score, query)
    }
    
    return { data: record, score, matches }
  }
  
  /**
   * Score a field value against query
   */
  private scoreField(value: string, query: string, matchTypes: MatchType[]) {
    let score = 0
    const matches: MatchType[] = []
    
    for (const type of matchTypes) {
      const matchScore = this.checkMatch(value, query, type)
      if (matchScore > 0) {
        score += matchScore
        matches.push(type)
      }
    }
    
    return { score, matches }
  }
  
  /**
   * Check single match type
   */
  private checkMatch(value: string, query: string, type: MatchType): number {
    switch (type) {
      case 'exact':
        return value === query ? this.weights.exactMatch : 0
      
      case 'startsWith':
        return value.startsWith(query) ? this.weights.startsWith : 0
      
      case 'contains':
        return value.includes(query) ? this.weights.contains : 0
      
      case 'wordBoundary':
        const words = value.split(/\s+/)
        return words.some(w => w.startsWith(query)) ? this.weights.wordBoundary : 0
      
      case 'fuzzy':
        return this.fuzzyMatch(value, query)
      
      default:
        return 0
    }
  }
  
  /**
   * Simple fuzzy matching (Levenshtein distance)
   */
  private fuzzyMatch(value: string, query: string): number {
    const minLen = this.engineConfig.minFuzzyLength
    if (value.length < minLen || query.length < minLen) return 0
    
    const distance = this.levenshteinDistance(value, query)
    const maxLen = Math.max(value.length, query.length)
    const similarity = 1 - (distance / maxLen)
    
    return similarity > this.engineConfig.fuzzyThreshold 
      ? this.weights.fuzzy * similarity 
      : 0
  }
  
  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () => 
      Array(b.length + 1).fill(0)
    )
    
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j
    
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }
    
    return matrix[a.length][b.length]
  }
  
  /**
   * Calculate ranking boosts
   */
  private calculateRankingBoost(record: T, baseScore: number, query: string): number {
    let boost = 0
    
    if (this.config.ranking?.boostRecent) {
      const { field, weight } = this.config.ranking.boostRecent
      const dateValue = (record as any)[field]
      if (dateValue) {
        // Handle both Date objects and ISO strings (Prisma returns ISO strings)
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
        if (!isNaN(date.getTime())) {
          const ageInDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
          boost += weight * Math.exp(-ageInDays / 30)
        }
      }
    }
    
    if (this.config.ranking?.boostPopular) {
      const { field, weight } = this.config.ranking.boostPopular
      const popularity = Number((record as any)[field]) || 0
      boost += weight * Math.log(popularity + 1)
    }
    
    if (this.config.ranking?.customScorer) {
      boost += this.config.ranking.customScorer(record, query)
    }
    
    return boost
  }
  
  /**
   * Sort results
   */
  private sortResults(results: SearchResult<T>[], sortBy: string) {
    switch (sortBy) {
      case 'relevance':
        results.sort((a, b) => b.score - a.score)
        break
      
      case 'recent':
        if (!this.config.ranking?.boostRecent) {
          console.warn('Sort by "recent" requested but boostRecent not configured. Falling back to relevance.')
          results.sort((a, b) => b.score - a.score)
        } else {
          const field = this.config.ranking.boostRecent.field
          results.sort((a, b) => {
            const dateA = (a.data as any)[field]
            const dateB = (b.data as any)[field]
            return new Date(dateB).getTime() - new Date(dateA).getTime()
          })
        }
        break
      
      case 'popular':
        if (!this.config.ranking?.boostPopular) {
          console.warn('Sort by "popular" requested but boostPopular not configured. Falling back to relevance.')
          results.sort((a, b) => b.score - a.score)
        } else {
          const field = this.config.ranking.boostPopular.field
          results.sort((a, b) => {
            return Number((b.data as any)[field]) - Number((a.data as any)[field])
          })
        }
        break
      
      default:
        console.warn(`Unknown sort option "${sortBy}". Falling back to relevance.`)
        results.sort((a, b) => b.score - a.score)
    }
  }
}

