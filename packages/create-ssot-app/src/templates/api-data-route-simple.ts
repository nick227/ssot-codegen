/**
 * Simple /api/data Route Template (M0)
 * 
 * Practical security with owner-or-admin defaults.
 * ~100 lines total (not 500+!)
 */

export function generateSimpleDataRoute(): string {
  return `import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../auth/[...nextauth]/route'

const prisma = new PrismaClient()

// Security: Fields that are ALWAYS denied for writes
const DENY_FIELDS = ['role', 'permissions', 'passwordHash', 'password', 'apiKey', 'apiKeys', 'secret']

/**
 * Check if model has a specific field
 */
function hasField(model: string, field: string): boolean {
  const dmmf = (prisma as any)._baseDmmf || (prisma as any)._dmmf
  if (!dmmf) return false
  
  const modelDef = dmmf.datamodel.models.find((m: any) => m.name === model)
  if (!modelDef) return false
  
  return modelDef.fields.some((f: any) => f.name === field)
}

/**
 * Apply owner-or-admin security filter
 */
function applySecurityFilter(model: string, action: string, user: any, where: any = {}) {
  // Admin can access everything
  if (user?.role === 'admin') return where
  
  // For reads: public OR owner
  if (action === 'read') {
    const filters: any[] = []
    
    if (hasField(model, 'isPublic')) {
      filters.push({ isPublic: true })
    }
    
    if (hasField(model, 'uploadedBy')) {
      filters.push({ uploadedBy: user.id })
    } else if (hasField(model, 'userId')) {
      filters.push({ userId: user.id })
    }
    
    if (filters.length === 0) return where
    if (filters.length === 1) return { ...where, ...filters[0] }
    return { ...where, OR: filters }
  }
  
  // For writes: owner only
  if (action === 'write') {
    if (hasField(model, 'uploadedBy')) {
      return { ...where, uploadedBy: user.id }
    }
    if (hasField(model, 'userId')) {
      return { ...where, userId: user.id }
    }
    throw new Error('Permission denied')
  }
  
  return where
}

/**
 * Sanitize data by removing denied fields
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data
  
  const safe = { ...data }
  DENY_FIELDS.forEach(field => delete safe[field])
  return safe
}

export async function POST(request: NextRequest) {
  // 1. Authentication
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  
  // 2. Parse action (e.g., "Track.findMany")
  const [model, action] = body.action.split('.')
  if (!model || !action) {
    return NextResponse.json({ error: 'Invalid action format' }, { status: 400 })
  }
  
  try {
    let result
    const params = body.params || {}
    
    // Apply safe defaults
    const take = Math.min(params.take || 50, 1000)
    
    switch (action) {
      case 'findMany': {
        // Apply security filter
        const where = applySecurityFilter(model, 'read', session.user, params.where)
        
        result = await (prisma as any)[model.toLowerCase()].findMany({
          where,
          take,
          skip: params.skip,
          orderBy: params.orderBy,
          include: params.include
        })
        break
      }
      
      case 'findOne': {
        // Apply security filter
        const where = applySecurityFilter(model, 'read', session.user, params.where)
        
        result = await (prisma as any)[model.toLowerCase()].findUnique({
          where,
          include: params.include
        })
        break
      }
      
      case 'create': {
        // Sanitize data
        const safeData = sanitizeData(params.data)
        
        // Auto-set owner field if exists
        if (hasField(model, 'uploadedBy')) {
          safeData.uploadedBy = session.user.id
        } else if (hasField(model, 'userId')) {
          safeData.userId = session.user.id
        }
        
        result = await (prisma as any)[model.toLowerCase()].create({
          data: safeData
        })
        break
      }
      
      case 'update': {
        // Apply security filter (owner only)
        const where = applySecurityFilter(model, 'write', session.user, params.where)
        
        // Sanitize data
        const safeData = sanitizeData(params.data)
        
        result = await (prisma as any)[model.toLowerCase()].update({
          where,
          data: safeData
        })
        break
      }
      
      case 'delete': {
        // Apply security filter (owner only)
        const where = applySecurityFilter(model, 'write', session.user, params.where)
        
        result = await (prisma as any)[model.toLowerCase()].delete({
          where
        })
        break
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('[Data API] Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
`
}

