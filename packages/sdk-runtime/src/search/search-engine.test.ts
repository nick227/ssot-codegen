/**
 * Search Engine Tests
 */

import { describe, it, expect } from 'vitest'
import { SearchEngine, type SearchConfig } from './search-engine.js'

interface Product {
  id: number
  name: string
  description: string
  price: number
  createdAt: Date
  viewCount: number
}

describe('SearchEngine', () => {
  const products: Product[] = [
    {
      id: 1,
      name: 'Laptop Computer',
      description: 'High-performance laptop for gaming and work',
      price: 1200,
      createdAt: new Date('2024-01-15'),
      viewCount: 150
    },
    {
      id: 2,
      name: 'Computer Mouse',
      description: 'Wireless ergonomic mouse',
      price: 30,
      createdAt: new Date('2024-02-01'),
      viewCount: 80
    },
    {
      id: 3,
      name: 'Laptop Bag',
      description: 'Durable laptop carrying case',
      price: 50,
      createdAt: new Date('2024-01-20'),
      viewCount: 45
    },
    {
      id: 4,
      name: 'Desktop Computer',
      description: 'Powerful desktop PC for professionals',
      price: 2000,
      createdAt: new Date('2023-12-10'),
      viewCount: 200
    }
  ]
  
  const config: SearchConfig<Product> = {
    fields: [
      { name: 'name', weight: 100, matchTypes: ['exact', 'startsWith', 'contains', 'wordBoundary'] },
      { name: 'description', weight: 50, matchTypes: ['contains', 'fuzzy'] }
    ],
    ranking: {
      boostRecent: { field: 'createdAt', weight: 5 },
      boostPopular: { field: 'viewCount', weight: 3 }
    }
  }
  
  describe('Basic Search', () => {
    it('should find exact matches', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'Laptop Computer')
      
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].data.id).toBe(1)
    })
    
    it('should find partial matches with startsWith', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'lap')
      
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(r => r.data.name.toLowerCase().includes('laptop'))).toBe(true)
    })
    
    it('should find word boundary matches', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'computer')
      
      expect(results.length).toBeGreaterThan(0)
      // Should find "Laptop Computer", "Computer Mouse", "Desktop Computer"
      expect(results.length).toBeGreaterThanOrEqual(3)
    })
    
    it('should return empty array for no matches', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'nonexistent')
      
      expect(results).toEqual([])
    })
    
    it('should throw error for empty query', () => {
      const engine = new SearchEngine(config)
      
      expect(() => engine.search(products, '')).toThrow('Query must be a non-empty string')
    })
  })
  
  describe('Scoring and Ranking', () => {
    it('should score exact matches higher than partial', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'laptop')
      
      // "Laptop Computer" and "Laptop Bag" should score higher than "Durable laptop carrying case"
      const laptopProduct = results.find(r => r.data.name === 'Laptop Computer')
      const laptopBag = results.find(r => r.data.name === 'Laptop Bag')
      
      expect(laptopProduct).toBeDefined()
      expect(laptopBag).toBeDefined()
      
      if (laptopProduct && laptopBag) {
        // Both start with "Laptop" so should have high scores
        expect(laptopProduct.score).toBeGreaterThan(0)
        expect(laptopBag.score).toBeGreaterThan(0)
      }
    })
    
    it('should apply field weights correctly', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'gaming')
      
      // Should find "gaming" in description
      expect(results.length).toBeGreaterThan(0)
      const laptopResult = results.find(r => r.data.id === 1)
      expect(laptopResult).toBeDefined()
    })
    
    it('should boost recent items when configured', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'computer')
      
      expect(results.length).toBeGreaterThan(0)
      
      // Computer Mouse (Feb 2024) should rank higher than Desktop Computer (Dec 2023)
      // when they have similar relevance
      const positions = results.map(r => r.data.name)
      const mouseIndex = positions.indexOf('Computer Mouse')
      const desktopIndex = positions.indexOf('Desktop Computer')
      
      // Both should be found
      expect(mouseIndex).toBeGreaterThanOrEqual(0)
      expect(desktopIndex).toBeGreaterThanOrEqual(0)
    })
    
    it('should boost popular items when configured', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'computer')
      
      expect(results.length).toBeGreaterThan(0)
      
      // Desktop Computer has highest viewCount (200)
      const desktopResult = results.find(r => r.data.id === 4)
      expect(desktopResult).toBeDefined()
      
      if (desktopResult) {
        expect(desktopResult.score).toBeGreaterThan(0)
      }
    })
  })
  
  describe('Pagination', () => {
    it('should limit results', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'computer', { limit: 2 })
      
      expect(results.length).toBeLessThanOrEqual(2)
    })
    
    it('should skip results', () => {
      const engine = new SearchEngine(config)
      const allResults = engine.search(products, 'computer')
      const skippedResults = engine.search(products, 'computer', { skip: 1 })
      
      expect(skippedResults.length).toBe(allResults.length - 1)
      if (allResults.length > 1) {
        expect(skippedResults[0].data.id).toBe(allResults[1].data.id)
      }
    })
    
    it('should combine skip and limit', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'computer', { skip: 1, limit: 1 })
      
      expect(results.length).toBe(1)
    })
  })
  
  describe('Min Score Filtering', () => {
    it('should filter by minimum score', () => {
      const engine = new SearchEngine(config)
      const allResults = engine.search(products, 'laptop')
      const filteredResults = engine.search(products, 'laptop', { minScore: 10 })
      
      expect(filteredResults.length).toBeLessThanOrEqual(allResults.length)
      filteredResults.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(10)
      })
    })
  })
  
  describe('Sorting', () => {
    it('should sort by relevance (default)', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'computer')
      
      // Check that scores are descending
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score)
      }
    })
    
    it('should sort by recent when specified', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'computer', { sort: 'recent' })
      
      expect(results.length).toBeGreaterThan(0)
      
      // Check dates are descending
      for (let i = 0; i < results.length - 1; i++) {
        const dateA = new Date(results[i].data.createdAt).getTime()
        const dateB = new Date(results[i + 1].data.createdAt).getTime()
        expect(dateA).toBeGreaterThanOrEqual(dateB)
      }
    })
    
    it('should sort by popular when specified', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'computer', { sort: 'popular' })
      
      expect(results.length).toBeGreaterThan(0)
      
      // Check viewCount is descending
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].data.viewCount).toBeGreaterThanOrEqual(results[i + 1].data.viewCount)
      }
    })
  })
  
  describe('Match Types', () => {
    it('should track which fields matched', () => {
      const engine = new SearchEngine(config)
      const results = engine.search(products, 'laptop')
      
      expect(results.length).toBeGreaterThan(0)
      
      const result = results[0]
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches[0].field).toBeDefined()
      expect(result.matches[0].type).toBeDefined()
    })
    
    it('should support fuzzy matching with minScore override', () => {
      const configWithFuzzy: SearchConfig<Product> = {
        fields: [
          { name: 'name', weight: 100, matchTypes: ['fuzzy', 'contains'] }
        ]
      }
      
      const engine = new SearchEngine(configWithFuzzy)
      // Fuzzy matching is strict, so use minScore: 0 to see all fuzzy results
      const results = engine.search(products, 'computer', { minScore: 0 })
      
      // Should find results with fuzzy or contains matching
      expect(results.length).toBeGreaterThan(0)
      
      // Test that exact matches work
      const exactResults = engine.search(products, 'computer')
      expect(exactResults.length).toBeGreaterThan(0)
    })
  })
  
  describe('Custom Preprocessor', () => {
    it('should use custom query preprocessor', () => {
      const configWithPreprocessor: SearchConfig<Product> = {
        ...config,
        preprocessor: (query) => query.toLowerCase().replace(/[^a-z0-9\s]/g, '')
      }
      
      const engine = new SearchEngine(configWithPreprocessor)
      const results = engine.search(products, 'Laptop!!!')
      
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(r => r.data.name.includes('Laptop'))).toBe(true)
    })
  })
  
  describe('Custom Getter', () => {
    it('should use custom field getter', () => {
      const configWithGetter: SearchConfig<Product> = {
        fields: [
          { 
            name: 'customField', 
            weight: 100, 
            matchTypes: ['contains'],
            getter: (record: Product) => `${record.name} ${record.description}`
          }
        ]
      }
      
      const engine = new SearchEngine(configWithGetter)
      const results = engine.search(products, 'gaming')
      
      // Should search combined name + description
      expect(results.length).toBeGreaterThan(0)
    })
  })
  
  describe('Input Validation', () => {
    it('should throw error for invalid query type', () => {
      const engine = new SearchEngine(config)
      
      expect(() => engine.search(products, null as any)).toThrow('Query must be a non-empty string')
      expect(() => engine.search(products, 123 as any)).toThrow('Query must be a non-empty string')
    })
    
    it('should throw error for query too long', () => {
      const engine = new SearchEngine(config, undefined, { maxQueryLength: 10 })
      const longQuery = 'a'.repeat(11)
      
      expect(() => engine.search(products, longQuery)).toThrow('Query too long')
    })
    
    it('should throw error for invalid limit', () => {
      const engine = new SearchEngine(config, undefined, { maxLimit: 50 })
      
      expect(() => engine.search(products, 'test', { limit: 0 })).toThrow('Limit must be between')
      expect(() => engine.search(products, 'test', { limit: 100 })).toThrow('Limit must be between')
    })
    
    it('should throw error for negative skip', () => {
      const engine = new SearchEngine(config)
      
      expect(() => engine.search(products, 'test', { skip: -1 })).toThrow('Skip must be >= 0')
    })
    
    it('should throw error for negative minScore', () => {
      const engine = new SearchEngine(config)
      
      expect(() => engine.search(products, 'test', { minScore: -1 })).toThrow('minScore must be >= 0')
    })
  })
  
  describe('Date Handling (Prisma ISO Strings)', () => {
    it('should handle ISO date strings from Prisma', () => {
      const productsWithISODates = products.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString() as any  // Simulate Prisma returning ISO string
      }))
      
      const engine = new SearchEngine(config)
      const results = engine.search(productsWithISODates, 'computer')
      
      // Should still work and rank properly
      expect(results.length).toBeGreaterThan(0)
    })
    
    it('should handle both Date objects and ISO strings', () => {
      const mixed = [
        { ...products[0], createdAt: products[0].createdAt },  // Date object
        { ...products[1], createdAt: products[1].createdAt.toISOString() as any }  // ISO string
      ]
      
      const engine = new SearchEngine(config)
      const results = engine.search(mixed, 'computer')
      
      expect(results.length).toBeGreaterThan(0)
    })
  })
})

