/**
 * TemplateRuntime
 * 
 * Core runtime renderer that reads JSON configuration and renders
 * complete applications WITHOUT generating any code.
 * 
 * ZERO CODE GENERATION - Just mount this component!
 */

import { useEffect, useState, useMemo } from 'react'
import type { DataAdapter, UIAdapter, AuthAdapter, RouterAdapter, FormatAdapter } from '@ssot-ui/adapters'
import type { Template, DataContract, Capabilities, Mappings, Models, Theme, I18n } from '@ssot-ui/schemas'
import { loadTemplate, type ExecutionPlan, type LoaderResult } from '@ssot-ui/loader'
import { PageRenderer } from './renderers/page-renderer.js'
import { ErrorBoundary } from './components/error-boundary.js'
import { LoadingFallback } from './components/loading-fallback.js'

// ============================================================================
// Runtime Configuration
// ============================================================================

export interface RuntimeConfig {
  template: Template
  dataContract: DataContract
  capabilities: Capabilities
  mappings: Mappings
  models: Models
  theme: Theme
  i18n: I18n
}

export interface TemplateRuntimeProps {
  // Config (can be object or URL to fetch)
  config: RuntimeConfig | string
  
  // Current route (for catch-all routing)
  route?: string[]
  
  // Adapters (REQUIRED)
  adapters: {
    data: DataAdapter
    ui: UIAdapter
    auth?: AuthAdapter      // Optional - deny all guards if not present
    router?: RouterAdapter  // Optional - basic routing if not present
    format?: FormatAdapter  // Optional - basic formatting if not present
  }
  
  // Options
  options?: {
    strictMode?: boolean        // Fail on unknown page types (default: true)
    showDevOverlay?: boolean    // Show diagnostics (default: process.env.NODE_ENV === 'development')
    cacheConfig?: boolean       // Cache loaded config (default: true)
    locale?: string             // Current locale (default: from i18n.defaultLocale)
  }
}

// ============================================================================
// Config Cache
// ============================================================================

const configCache = new Map<string, { plan: ExecutionPlan; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute in dev

function getCacheKey(config: RuntimeConfig | string): string {
  return typeof config === 'string' ? config : JSON.stringify(config)
}

// ============================================================================
// TemplateRuntime Component
// ============================================================================

export function TemplateRuntime(props: TemplateRuntimeProps) {
  const { config, route, adapters, options = {} } = props
  const {
    strictMode = true,
    showDevOverlay = process.env.NODE_ENV === 'development',
    cacheConfig = true,
    locale
  } = options
  
  const [plan, setPlan] = useState<ExecutionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Load and validate config
  useEffect(() => {
    let cancelled = false
    
    async function loadConfig() {
      try {
        setLoading(true)
        setError(null)
        
        // Check cache
        const cacheKey = getCacheKey(config)
        if (cacheConfig && configCache.has(cacheKey)) {
          const cached = configCache.get(cacheKey)!
          
          // Check if still fresh
          if (Date.now() - cached.timestamp < CACHE_TTL) {
            if (!cancelled) {
              setPlan(cached.plan)
              setLoading(false)
            }
            return
          }
        }
        
        // Fetch config if URL
        let runtimeConfig: RuntimeConfig
        if (typeof config === 'string') {
          const response = await fetch(config)
          if (!response.ok) {
            throw new Error(`Failed to fetch config: ${response.statusText}`)
          }
          runtimeConfig = await response.json()
        } else {
          runtimeConfig = config
        }
        
        // Load through pipeline
        const result: LoaderResult = await loadTemplate({
          template: runtimeConfig.template,
          dataContract: runtimeConfig.dataContract,
          capabilities: runtimeConfig.capabilities,
          mappings: runtimeConfig.mappings,
          models: runtimeConfig.models,
          theme: runtimeConfig.theme,
          i18n: runtimeConfig.i18n,
          runtimeVersion: '3.0.0' // Current runtime version
        })
        
        if (!result.ok) {
          throw new Error(`Template validation failed:\n${formatLoaderErrors(result)}`)
        }
        
        if (!cancelled) {
          // Cache the plan
          if (cacheConfig) {
            configCache.set(cacheKey, {
              plan: result.plan,
              timestamp: Date.now()
            })
          }
          
          setPlan(result.plan)
          setLoading(false)
          
          // Show warnings in dev
          if (showDevOverlay && result.warnings.length > 0) {
            console.warn('Template warnings:', result.warnings)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message)
          setLoading(false)
        }
      }
    }
    
    loadConfig()
    
    return () => {
      cancelled = true
    }
  }, [config, cacheConfig, showDevOverlay])
  
  // Determine current route
  const currentRoute = useMemo(() => {
    if (route) {
      return '/' + route.filter(Boolean).join('/')
    }
    
    // Try to get from RouterAdapter
    if (adapters.router) {
      return adapters.router.usePathname()
    }
    
    // Fallback to window.location (client-side only)
    if (typeof window !== 'undefined') {
      return window.location.pathname
    }
    
    return '/'
  }, [route, adapters.router])
  
  // Find matching page in plan
  const currentPage = useMemo(() => {
    if (!plan) return null
    
    // Exact match first
    let match = plan.routes.find(r => r.path === currentRoute)
    
    // Try pattern matching
    if (!match) {
      match = plan.routes.find(r => matchRoute(currentRoute, r.path))
    }
    
    return match || null
  }, [plan, currentRoute])
  
  // Loading state
  if (loading) {
    return <LoadingFallback />
  }
  
  // Error state
  if (error || !plan) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-error-500 mb-4">Template Loading Error</h1>
        <p className="text-neutral-600">{error || 'Failed to load template'}</p>
      </div>
    )
  }
  
  // No matching page
  if (!currentPage) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-neutral-600">Route: {currentRoute}</p>
      </div>
    )
  }
  
  // Render page
  return (
    <ErrorBoundary>
      <PageRenderer
        page={currentPage}
        plan={plan}
        adapters={adapters}
        strictMode={strictMode}
        locale={locale}
      />
    </ErrorBoundary>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function formatLoaderErrors(result: { errors: any[]; warnings: string[] }): string {
  return result.errors.map(e => `${e.file}: ${e.message}`).join('\n')
}

function matchRoute(currentRoute: string, pattern: string): boolean {
  const currentParts = currentRoute.split('/').filter(Boolean)
  const patternParts = pattern.split('/').filter(Boolean)
  
  if (currentParts.length !== patternParts.length) {
    return false
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    
    // Dynamic param matches anything
    if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
      continue
    }
    
    // Static must match exactly
    if (patternPart !== currentParts[i]) {
      return false
    }
  }
  
  return true
}

