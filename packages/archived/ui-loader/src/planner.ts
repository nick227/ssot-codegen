/**
 * Planner
 * 
 * Derives execution plan including routes, data requirements,
 * guards, and rendering order.
 */

import type { AllSchemas } from '@ssot-ui/schemas'
import type { NormalizedTemplate, RouteDefinition, DataRequirement, ExecutionPlan } from './loader.js'

/**
 * Extract dynamic route parameters
 */
export function extractRouteParams(route: string): string[] {
  // Matches: [id], [slug], [...slug]
  const matches = route.matchAll(/\[\.\.\.?([^\]]+)\]/g)
  return Array.from(matches).map(m => m[1])
}

/**
 * Normalize route to Next.js format
 */
export function normalizeRoute(route: string): string {
  // Ensure starts with /
  if (!route.startsWith('/')) {
    route = '/' + route
  }
  
  // Replace :param with [param] for Next.js
  route = route.replace(/:(\w+)/g, '[$1]')
  
  return route
}

/**
 * Check if route is dynamic
 */
export function isDynamicRoute(route: string): boolean {
  return route.includes('[') && route.includes(']')
}

/**
 * Check if route is catch-all
 */
export function isCatchAllRoute(route: string): boolean {
  return route.includes('[...]')
}

/**
 * Compute breadcrumbs for a route
 */
export function computeBreadcrumbs(route: string): Array<{ label: string; path: string }> {
  const parts = route.split('/').filter(Boolean)
  const breadcrumbs: Array<{ label: string; path: string }> = [
    { label: 'Home', path: '/' }
  ]
  
  let currentPath = ''
  for (const part of parts) {
    // Skip dynamic params in breadcrumbs
    if (part.startsWith('[')) continue
    
    currentPath += '/' + part
    breadcrumbs.push({
      label: part.charAt(0).toUpperCase() + part.slice(1),
      path: currentPath
    })
  }
  
  return breadcrumbs
}

/**
 * Aggregate data requirements across all pages
 */
export function aggregateDataRequirements(
  normalized: NormalizedTemplate,
  schemas: AllSchemas
): DataRequirement[] {
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
      const mode = page.original.mode
      if (mode === 'create' && !req.operations.includes('create')) {
        req.operations.push('create')
      }
      if (mode === 'edit' && !req.operations.includes('update')) {
        req.operations.push('update')
      }
    }
    
    // Aggregate relations (prevent duplicates)
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
  
  return Array.from(dataMap.values())
}

/**
 * Determine optimal rendering order
 * 
 * Server components first (can be cached/SSR),
 * then client components (hydration),
 * then edge (redirects, auth).
 */
export function determineRenderingOrder(routes: RouteDefinition[]): {
  server: RouteDefinition[]
  client: RouteDefinition[]
  edge: RouteDefinition[]
} {
  return {
    server: routes.filter(r => r.runtime === 'server'),
    client: routes.filter(r => r.runtime === 'client'),
    edge: routes.filter(r => r.runtime === 'edge')
  }
}

