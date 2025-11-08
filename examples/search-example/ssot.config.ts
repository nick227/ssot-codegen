/**
 * SSOT Codegen Configuration - Search Example
 * 
 * This example demonstrates the full-text search plugin with:
 * - Multiple searchable models
 * - Configurable field weights
 * - Smart ranking (recent, popular)
 * - Different match strategies per field
 */

export default {
  standalone: true,
  framework: 'express' as const,
  
  plugins: {
    'full-text-search': {
      enabled: true,
      strategy: 'simple',
      
      // Global search weights (can be overridden per model)
      defaultWeights: {
        exactMatch: 20,
        startsWith: 15,
        contains: 5,
        wordBoundary: 10,
        fuzzy: 3
      },
      
      models: {
        // Product search - most comprehensive
        Product: {
          enabled: true,
          fields: [
            { 
              name: 'name', 
              weight: 100,           // Highest priority
              priority: 'high',
              matchTypes: ['exact', 'startsWith', 'contains', 'wordBoundary']
            },
            { 
              name: 'description', 
              weight: 60,            // Medium-high priority
              priority: 'medium',
              matchTypes: ['contains', 'fuzzy']  // Allow fuzzy for descriptions
            },
            { 
              name: 'category', 
              weight: 40,
              priority: 'medium',
              matchTypes: ['exact', 'contains']
            },
            { 
              name: 'tags', 
              weight: 30,            // Lower priority
              priority: 'low',
              matchTypes: ['exact', 'contains']
            }
          ],
          ranking: {
            boostRecent: { field: 'createdAt', weight: 5 },   // Recent products ranked higher
            boostPopular: { field: 'viewCount', weight: 3 }   // Popular products ranked higher
          }
        },
        
        // User search - name and email focused
        User: {
          enabled: true,
          fields: [
            { 
              name: 'email', 
              weight: 100,
              priority: 'high',
              matchTypes: ['exact', 'startsWith']  // No fuzzy for emails
            },
            { 
              name: 'name', 
              weight: 90,
              priority: 'high',
              matchTypes: ['exact', 'startsWith', 'contains', 'wordBoundary']
            },
            { 
              name: 'username', 
              weight: 85,
              priority: 'high',
              matchTypes: ['exact', 'startsWith']
            },
            { 
              name: 'bio', 
              weight: 30,
              priority: 'low',
              matchTypes: ['contains']
            }
          ]
        },
        
        // Blog post search
        BlogPost: {
          enabled: true,
          fields: [
            { 
              name: 'title', 
              weight: 100,
              priority: 'high',
              matchTypes: ['exact', 'startsWith', 'contains', 'wordBoundary']
            },
            { 
              name: 'excerpt', 
              weight: 60,
              priority: 'medium',
              matchTypes: ['contains']
            },
            { 
              name: 'content', 
              weight: 40,
              priority: 'medium',
              matchTypes: ['contains', 'fuzzy']
            },
            { 
              name: 'tags', 
              weight: 30,
              priority: 'low',
              matchTypes: ['exact', 'contains']
            }
          ],
          ranking: {
            boostRecent: { field: 'createdAt', weight: 5 },
            boostPopular: { field: 'viewCount', weight: 2 }
          }
        },
        
        // Review search - for finding specific reviews
        Review: {
          enabled: true,
          fields: [
            { 
              name: 'title', 
              weight: 100,
              priority: 'high',
              matchTypes: ['startsWith', 'contains']
            },
            { 
              name: 'content', 
              weight: 70,
              priority: 'medium',
              matchTypes: ['contains', 'fuzzy']
            }
          ],
          ranking: {
            boostPopular: { field: 'helpful', weight: 4 }  // Helpful reviews ranked higher
          }
        }
      }
    }
  }
}

