/**
 * Simple Security Layer
 * 
 * Practical, opinionated security for M0.
 * No complex policy engine - just owner-or-admin defaults.
 * 
 * Total: ~65 lines of actual security code
 */

import type { PrismaClient } from '@prisma/client'

/**
 * User context (from NextAuth session)
 */
export interface SecurityUser {
  id: string
  role?: string
  email?: string
}

/**
 * Fields that are ALWAYS denied for writes (security-critical)
 */
const ALWAYS_DENY_WRITE = [
  'role',
  'permissions',
  'passwordHash',
  'password',
  'apiKey',
  'apiKeys',
  'secret',
  'secretKey',
  'stripeCustomerId',
  'stripeSecretKey'
]

/**
 * Check if a model has a specific field
 * 
 * @param model - Model name
 * @param field - Field name
 * @param prisma - Prisma client (to access DMMF)
 * @returns true if field exists
 */
function hasField(model: string, field: string, prisma: PrismaClient): boolean {
  // Use Prisma DMMF to check if field exists
  const dmmf = (prisma as any)._baseDmmf || (prisma as any)._dmmf
  if (!dmmf) return false
  
  const modelDef = dmmf.datamodel.models.find((m: any) => m.name === model)
  if (!modelDef) return false
  
  return modelDef.fields.some((f: any) => f.name === field)
}

/**
 * Apply security filter for row-level security (RLS)
 * 
 * Opinionated default: owner-or-admin
 * - Admins can access everything
 * - Users can access their own data (if uploadedBy/userId field exists)
 * - Public data is accessible to all (if isPublic field exists)
 * 
 * @param model - Model name
 * @param action - Action type
 * @param user - Current user
 * @param where - Existing where clause
 * @param prisma - Prisma client
 * @returns Modified where clause with security filter
 */
export function applySecurityFilter(
  model: string,
  action: 'read' | 'write',
  user: SecurityUser | null,
  where: any = {},
  prisma: PrismaClient
): any {
  // If no user (unauthenticated), deny all
  if (!user) {
    return { id: '__never__' }  // Impossible filter
  }
  
  // Admin can access everything
  if (user.role === 'admin') {
    return where
  }
  
  // For reads: public OR owner
  if (action === 'read') {
    const filters: any[] = []
    
    // Public filter (if model has isPublic field)
    if (hasField(model, 'isPublic', prisma)) {
      filters.push({ isPublic: true })
    }
    
    // Owner filter (if model has uploadedBy or userId field)
    if (hasField(model, 'uploadedBy', prisma)) {
      filters.push({ uploadedBy: user.id })
    } else if (hasField(model, 'userId', prisma)) {
      filters.push({ userId: user.id })
    }
    
    // If no filters, user can read everything (authenticated access)
    if (filters.length === 0) {
      return where
    }
    
    // Combine with OR
    if (filters.length === 1) {
      return { ...where, ...filters[0] }
    }
    
    return { ...where, OR: filters }
  }
  
  // For writes: owner only (unless admin)
  if (action === 'write') {
    // Owner filter (if model has uploadedBy or userId field)
    if (hasField(model, 'uploadedBy', prisma)) {
      return { ...where, uploadedBy: user.id }
    }
    
    if (hasField(model, 'userId', prisma)) {
      return { ...where, userId: user.id }
    }
    
    // If no owner field, deny (safe default)
    throw new Error(`Permission denied: ${model} has no owner field`)
  }
  
  return where
}

/**
 * Sanitize data by removing security-critical fields
 * 
 * Prevents users from modifying role, permissions, passwords, etc.
 * 
 * @param data - Data object to sanitize
 * @returns Sanitized data object
 */
export function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }
  
  const safe = { ...data }
  
  // Remove all denied fields
  ALWAYS_DENY_WRITE.forEach(field => {
    delete safe[field]
  })
  
  return safe
}

/**
 * Apply safe query defaults
 * 
 * Prevents expensive queries by enforcing sane limits.
 * 
 * @param params - Query parameters
 * @returns Parameters with safe defaults
 */
export function applySafeDefaults(params: any): any {
  return {
    ...params,
    // Default pagination: 50 items, max 1000
    take: Math.min(params?.take || 50, 1000),
    
    // Limit include depth to prevent N+1
    include: params?.include ? limitIncludeDepth(params.include, 3) : undefined
  }
}

/**
 * Limit include depth to prevent circular includes
 * 
 * @param include - Include object
 * @param maxDepth - Maximum depth
 * @returns Limited include object
 */
function limitIncludeDepth(include: any, maxDepth: number): any {
  if (maxDepth <= 0) return undefined
  if (!include || typeof include !== 'object') return include
  
  const limited: any = {}
  
  for (const [key, value] of Object.entries(include)) {
    if (typeof value === 'boolean') {
      limited[key] = value
    } else if (typeof value === 'object' && value !== null) {
      // Recursively limit nested includes
      const nested = limitIncludeDepth((value as any).include, maxDepth - 1)
      limited[key] = nested ? { include: nested } : true
    }
  }
  
  return Object.keys(limited).length > 0 ? limited : undefined
}

