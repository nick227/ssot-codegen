/**
 * RouterAdapter Interface
 * 
 * REDLINE: Declarative links only in JSON, imperative navigate returns Result.
 * 
 * CONTRACT:
 * - Link component for declarative navigation
 * - useParams/useSearchParams for data extraction
 * - navigate() returns Result<void> (can fail)
 * - redirect() for server-side redirects
 */

import type { ComponentType, ReactNode } from 'react'
import type { ErrorModel, Result } from './data.js'

// ============================================================================
// Link Component
// ============================================================================

export interface LinkProps {
  href: string
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
  children: ReactNode
  className?: string
}

// ============================================================================
// Router Hooks
// ============================================================================

export interface RouteParams {
  [key: string]: string | string[]
}

export interface SearchParams {
  [key: string]: string | string[]
}

// ============================================================================
// RouterAdapter Interface
// ============================================================================

export interface RouterAdapter {
  /**
   * Link component for declarative navigation
   */
  Link: ComponentType<LinkProps>
  
  /**
   * Get route parameters
   * Example: /posts/[id] → { id: "123" }
   */
  useParams(): RouteParams
  
  /**
   * Get search/query parameters
   * Example: ?sort=title&filter=published → { sort: "title", filter: "published" }
   */
  useSearchParams(): SearchParams
  
  /**
   * Programmatic navigation (client-side)
   * Returns Result to handle navigation failures
   */
  useNavigate(): (path: string, options?: {
    replace?: boolean
    scroll?: boolean
  }) => Promise<Result<void>>
  
  /**
   * Server-side redirect
   */
  redirect(path: string, statusCode?: number): void
  
  /**
   * Get current pathname
   */
  usePathname(): string
  
  /**
   * Check if route is active
   */
  isActive(path: string): boolean
}

// ============================================================================
// Route Builder Helpers
// ============================================================================

/**
 * Build route with parameters
 * Example: buildRoute('/posts/[id]', { id: '123' }) → '/posts/123'
 */
export function buildRoute(pattern: string, params: Record<string, string>): string {
  let route = pattern
  
  for (const [key, value] of Object.entries(params)) {
    route = route.replace(`[${key}]`, value)
    route = route.replace(`[...${key}]`, value)
  }
  
  return route
}

/**
 * Parse route pattern to extract param names
 * Example: '/posts/[id]/comments/[commentId]' → ['id', 'commentId']
 */
export function parseRouteParams(pattern: string): string[] {
  const matches = pattern.matchAll(/\[\.\.\.?([^\]]+)\]/g)
  return Array.from(matches).map(m => m[1])
}

/**
 * Check if route matches pattern
 */
export function matchesRoute(route: string, pattern: string): boolean {
  const patternParts = pattern.split('/')
  const routeParts = route.split('/')
  
  if (patternParts.length !== routeParts.length) {
    // Check for catch-all
    if (pattern.includes('[...]')) return true
    return false
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const routePart = routeParts[i]
    
    // Dynamic segment matches anything
    if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
      continue
    }
    
    // Static segment must match exactly
    if (patternPart !== routePart) {
      return false
    }
  }
  
  return true
}

