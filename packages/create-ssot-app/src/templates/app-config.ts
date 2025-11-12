/**
 * app.json Template Generator
 * 
 * Generates minimal app.json with sane defaults.
 */

import type { ProjectConfig } from '../types.js'

export function generateAppConfig(config: ProjectConfig): string {
  const appConfig = {
    name: config.projectName,
    version: '1.0.0',
    
    features: {
      auth: true,
      uploads: false,  // M0: Not yet
      payments: false  // M0: Not yet
    },
    
    auth: {
      providers: ['email'],
      signInPath: '/auth/signin'
    },
    
    permissions: 'owner-or-admin',
    
    // Pages auto-generated from models
    // If models.json has Track, User → auto-create pages
    pages: {},
    
    ui: {
      theme: 'default',
      layout: 'sidebar'
    },
    
    routing: 'convention'
  }
  
  return JSON.stringify(appConfig, null, 2)
}

/**
 * Generate minimal app.json (absolutely minimal)
 */
export function generateMinimalAppConfig(projectName: string): string {
  return JSON.stringify({
    name: projectName,
    permissions: 'owner-or-admin'
    // Everything else uses defaults!
  }, null, 2)
}

/**
 * Generate app.json with preset
 */
export function generatePresetAppConfig(preset: 'media' | 'marketplace' | 'saas', projectName: string): string {
  const base = {
    name: projectName,
    permissions: 'owner-or-admin',
    ui: {
      theme: 'default',
      layout: 'sidebar'
    }
  }
  
  switch (preset) {
    case 'media':
      return JSON.stringify({
        ...base,
        features: {
          auth: true,
          uploads: true,  // Media needs uploads
          payments: false
        },
        pages: {
          Track: {
            list: {
              columns: ['title', 'uploader.name', 'plays', 'createdAt']
            },
            detail: true,
            form: {
              fields: ['title', 'description', 'audioUrl']
            }
          },
          Playlist: {
            list: true,
            detail: true,
            form: true
          }
        }
      }, null, 2)
      
    case 'marketplace':
      return JSON.stringify({
        ...base,
        features: {
          auth: true,
          uploads: false,
          payments: true  // Marketplace needs payments
        },
        pages: {
          Product: {
            list: {
              columns: ['name', 'price', 'inventory', 'createdAt']
            },
            detail: true,
            form: {
              fields: ['name', 'description', 'price', 'inventory']
            }
          },
          Order: {
            list: {
              columns: ['user.name', 'total', 'status', 'createdAt']
            },
            detail: true,
            form: false  // Orders created via checkout, not manual form
          }
        }
      }, null, 2)
      
    case 'saas':
      return JSON.stringify({
        ...base,
        features: {
          auth: true,
          uploads: false,
          payments: true  // SaaS needs subscriptions
        },
        pages: {
          Org: {
            list: true,
            detail: true,
            form: {
              fields: ['name', 'plan']
            }
          },
          User: {
            list: {
              columns: ['name', 'email', 'org.name', 'createdAt']
            },
            detail: true,
            form: {
              fields: ['name', 'email']
            }
          },
          Subscription: {
            list: true,
            detail: true,
            form: false
          }
        }
      }, null, 2)
      
    default:
      return generateMinimalAppConfig(projectName)
  }
}

