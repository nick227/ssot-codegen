/**
 * Usage Tracker Plugin
 * 
 * Provides comprehensive API usage tracking and analytics
 * 
 * Features:
 * - Request/response logging
 * - Endpoint usage statistics
 * - User activity tracking
 * - Error rate monitoring
 * - Response time metrics
 * - Top endpoints dashboard
 * - Daily/weekly/monthly aggregates
 * 
 * Use Cases:
 * - API analytics
 * - Performance monitoring
 * - User behavior analysis
 * - Error tracking
 * - Rate limit planning
 * - Capacity planning
 */

import type {
  FeaturePlugin,
  PluginContext,
  PluginOutput,
  PluginRequirements,
  ValidationResult,
  HealthCheckSection
} from '../plugin.interface.js'

export interface UsageTrackerConfig {
  /** Enable request logging (default: true) */
  enableRequestLogging?: boolean
  
  /** Enable response time tracking (default: true) */
  enableResponseTime?: boolean
  
  /** Enable error tracking (default: true) */
  enableErrorTracking?: boolean
  
  /** Enable user activity tracking (default: true) */
  enableUserTracking?: boolean
  
  /** Store usage in database (default: true) */
  persistToDatabase?: boolean
  
  /** Aggregate interval in hours (default: 24) */
  aggregateIntervalHours?: number
  
  /** Retention period in days (default: 90) */
  retentionDays?: number
  
  /** Sample rate (1.0 = 100%, 0.1 = 10%) (default: 1.0) */
  sampleRate?: number
}

export class UsageTrackerPlugin implements FeaturePlugin {
  name = 'usage-tracker'
  version = '1.0.0'
  description = 'API usage tracking, analytics, and monitoring'
  enabled = true
  
  private config: Required<UsageTrackerConfig>
  
  constructor(config: UsageTrackerConfig = {}) {
    this.config = {
      enableRequestLogging: true,
      enableResponseTime: true,
      enableErrorTracking: true,
      enableUserTracking: true,
      persistToDatabase: true,
      aggregateIntervalHours: 24,
      retentionDays: 90,
      sampleRate: 1.0,
      ...config
    }
  }
  
  requirements: PluginRequirements = {
    models: {
      required: [],
      optional: ['RequestLog', 'UsageMetric']
    },
    envVars: {
      required: [],
      optional: ['USAGE_TRACKER_ENABLED', 'USAGE_SAMPLE_RATE']
    },
    dependencies: {
      runtime: {},
      dev: {}
    }
  }
  
  /**
   * Validate plugin can be used
   */
  validate(context: PluginContext): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    
    // Check if database persistence is enabled
    if (this.config.persistToDatabase) {
      const requestLogModel = context.schema.models.find(m => m.name === 'RequestLog')
      
      if (!requestLogModel) {
        warnings.push(`RequestLog model not found. Usage data will be stored in memory only (lost on restart).`)
        suggestions.push(`For persistent usage tracking, add this model:
          
model RequestLog {
  id            Int       @id @default(autoincrement())
  method        String
  path          String
  statusCode    Int
  responseTime  Int       // milliseconds
  userId        Int?
  apiKeyId      Int?
  userAgent     String?
  ip            String?
  error         String?
  createdAt     DateTime  @default(now())
  
  @@index([path])
  @@index([userId])
  @@index([createdAt])
}

model UsageMetric {
  id            Int       @id @default(autoincrement())
  date          DateTime  @unique
  totalRequests Int       @default(0)
  totalErrors   Int       @default(0)
  avgResponseTime Float   @default(0)
  uniqueUsers   Int       @default(0)
  topEndpoints  Json      @default("{}")
  
  @@index([date])
}`)
      }
    }
    
    return {
      valid: true,  // Warnings only, not errors
      errors,
      warnings,
      suggestions
    }
  }
  
  /**
   * Generate Usage Tracker code
   */
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    // Usage tracking middleware
    files.set('monitoring/middleware/usage-tracker.middleware.ts', this.generateUsageMiddleware())
    
    // Usage service (analytics)
    files.set('monitoring/services/usage.service.ts', this.generateUsageService())
    
    // Usage routes (dashboard API)
    files.set('monitoring/routes/usage.routes.ts', this.generateUsageRoutes())
    
    // Types
    files.set('monitoring/types/usage.types.ts', this.generateUsageTypes())
    
    // Barrel export
    files.set('monitoring/index.ts', this.generateBarrelExport())
    
    return {
      files,
      routes: [
        { path: '/usage/stats', method: 'get', handler: './monitoring/routes/usage.routes.js' },
        { path: '/usage/endpoints', method: 'get', handler: './monitoring/routes/usage.routes.js' },
        { path: '/usage/errors', method: 'get', handler: './monitoring/routes/usage.routes.js' },
        { path: '/usage/users', method: 'get', handler: './monitoring/routes/usage.routes.js' }
      ],
      middleware: [
        {
          name: 'usageTracker',
          importPath: './monitoring/middleware/usage-tracker.middleware.js',
          global: true  // Apply to all routes
        }
      ],
      envVars: {
        USAGE_TRACKER_ENABLED: 'true',
        USAGE_SAMPLE_RATE: this.config.sampleRate.toString()
      }
    }
  }
  
  /**
   * Generate usage tracking middleware
   */
  private generateUsageMiddleware(): string {
    return `// @generated
// Usage Tracking Middleware
// Tracks all API requests for analytics and monitoring

import type { Request, Response, NextFunction } from 'express'
import { usageService } from '../services/usage.service.js'

const ENABLED = process.env.USAGE_TRACKER_ENABLED !== 'false'
const SAMPLE_RATE = parseFloat(process.env.USAGE_SAMPLE_RATE || '${this.config.sampleRate}')

/**
 * Usage tracking middleware
 * 
 * Automatically tracks:
 * - Request method and path
 * - Response status and time
 * - User ID (if authenticated)
 * - API key ID (if using API keys)
 * - Errors
 * 
 * Applied globally to all routes
 */
export function usageTracker(req: Request, res: Response, next: NextFunction) {
  if (!ENABLED) {
    return next()
  }
  
  // Sample requests based on rate
  if (SAMPLE_RATE < 1.0 && Math.random() > SAMPLE_RATE) {
    return next()
  }
  
  const startTime = Date.now()
  
  // Capture response
  const originalSend = res.send
  let responseTime = 0
  let error: string | undefined
  
  res.send = function(data: any) {
    responseTime = Date.now() - startTime
    
    // Track usage (async, don't block response)
    setImmediate(() => {
      usageService.track({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        userId: (req.user as any)?.userId || (req.user as any)?.id,
        apiKeyId: (req.apiKey as any)?.id,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.socket.remoteAddress,
        error: res.statusCode >= 400 ? extractError(data) : undefined
      }).catch(err => {
        // Ignore tracking errors (don't break app)
        console.error('[Usage Tracker] Failed to track request:', err)
      })
    })
    
    return originalSend.call(this, data)
  }
  
  next()
}

/**
 * Extract error message from response
 */
function extractError(data: any): string | undefined {
  if (!data) return undefined
  
  try {
    if (typeof data === 'string') {
      const parsed = JSON.parse(data)
      return parsed.error || parsed.message
    }
    if (typeof data === 'object') {
      return data.error || data.message
    }
  } catch {
    // Ignore parse errors
  }
  
  return undefined
}
`
  }
  
  /**
   * Generate usage service
   */
  private generateUsageService(): string {
    return `// @generated
// Usage Service
// Provides analytics and metrics for API usage

import prisma from '@/db'
import type { UsageRecord, UsageStats, EndpointStats, UserActivity } from '../types/usage.types.js'
import { logger } from '@/logger'

${this.config.persistToDatabase ? '' : `
/**
 * In-memory usage storage (lost on restart)
 * For production, use database (RequestLog model)
 */
const usageRecords: UsageRecord[] = []
const MAX_RECORDS = 10000  // Prevent memory overflow

`}
export const usageService = {
  /**
   * Track a single request
   */
  async track(record: Omit<UsageRecord, 'id' | 'createdAt'>): Promise<void> {
    ${this.config.persistToDatabase ? `
    try {
      await prisma.requestLog.create({
        data: {
          method: record.method,
          path: record.path,
          statusCode: record.statusCode,
          responseTime: record.responseTime,
          userId: record.userId,
          apiKeyId: record.apiKeyId,
          userAgent: record.userAgent,
          ip: record.ip,
          error: record.error
        }
      })
    } catch (error) {
      logger.error({ error }, 'Failed to persist usage record')
      // Don't throw - tracking should never break the app
    }
    ` : `
    // Store in memory
    usageRecords.push({
      id: usageRecords.length + 1,
      ...record,
      createdAt: new Date()
    })
    
    // Limit memory usage
    if (usageRecords.length > MAX_RECORDS) {
      usageRecords.shift()  // Remove oldest
    }
    `}
  },
  
  /**
   * Get overall usage statistics
   */
  async getStats(startDate?: Date, endDate?: Date): Promise<UsageStats> {
    ${this.config.persistToDatabase ? `
    const where: any = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }
    
    const [total, errors, avgTime, uniqueUsers] = await Promise.all([
      prisma.requestLog.count({ where }),
      prisma.requestLog.count({ where: { ...where, statusCode: { gte: 400 } } }),
      prisma.requestLog.aggregate({
        where,
        _avg: { responseTime: true }
      }),
      prisma.requestLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } }
      }).then(groups => groups.length)
    ])
    
    return {
      totalRequests: total,
      totalErrors: errors,
      errorRate: total > 0 ? errors / total : 0,
      avgResponseTime: avgTime._avg.responseTime || 0,
      uniqueUsers,
      period: {
        start: startDate || new Date(0),
        end: endDate || new Date()
      }
    }
    ` : `
    // Calculate from in-memory records
    const filtered = usageRecords.filter(r => {
      if (startDate && r.createdAt < startDate) return false
      if (endDate && r.createdAt > endDate) return false
      return true
    })
    
    const totalRequests = filtered.length
    const totalErrors = filtered.filter(r => r.statusCode >= 400).length
    const avgResponseTime = filtered.reduce((sum, r) => sum + r.responseTime, 0) / totalRequests || 0
    const uniqueUsers = new Set(filtered.filter(r => r.userId).map(r => r.userId)).size
    
    return {
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      avgResponseTime,
      uniqueUsers,
      period: {
        start: startDate || new Date(0),
        end: endDate || new Date()
      }
    }
    `}
  },
  
  /**
   * Get top endpoints by request count
   */
  async getTopEndpoints(limit: number = 10, startDate?: Date, endDate?: Date): Promise<EndpointStats[]> {
    ${this.config.persistToDatabase ? `
    const where: any = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }
    
    const grouped = await prisma.requestLog.groupBy({
      by: ['method', 'path'],
      where,
      _count: { id: true },
      _avg: { responseTime: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit
    })
    
    return grouped.map(g => ({
      method: g.method,
      path: g.path,
      count: g._count.id,
      avgResponseTime: g._avg.responseTime || 0
    }))
    ` : `
    // Calculate from in-memory
    const filtered = usageRecords.filter(r => {
      if (startDate && r.createdAt < startDate) return false
      if (endDate && r.createdAt > endDate) return false
      return true
    })
    
    const grouped = new Map<string, { count: number; totalTime: number }>()
    
    for (const record of filtered) {
      const key = \`\${record.method} \${record.path}\`
      const existing = grouped.get(key) || { count: 0, totalTime: 0 }
      grouped.set(key, {
        count: existing.count + 1,
        totalTime: existing.totalTime + record.responseTime
      })
    }
    
    return Array.from(grouped.entries())
      .map(([key, stats]) => {
        const [method, path] = key.split(' ', 2)
        return {
          method,
          path,
          count: stats.count,
          avgResponseTime: stats.totalTime / stats.count
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
    `}
  },
  
  /**
   * Get error breakdown
   */
  async getErrorBreakdown(limit: number = 10): Promise<Array<{ statusCode: number; count: number; percentage: number }>> {
    ${this.config.persistToDatabase ? `
    const errors = await prisma.requestLog.groupBy({
      by: ['statusCode'],
      where: { statusCode: { gte: 400 } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit
    })
    
    const total = errors.reduce((sum, e) => sum + e._count.id, 0)
    
    return errors.map(e => ({
      statusCode: e.statusCode,
      count: e._count.id,
      percentage: total > 0 ? (e._count.id / total) * 100 : 0
    }))
    ` : `
    const errorRecords = usageRecords.filter(r => r.statusCode >= 400)
    const grouped = new Map<number, number>()
    
    for (const record of errorRecords) {
      grouped.set(record.statusCode, (grouped.get(record.statusCode) || 0) + 1)
    }
    
    const total = errorRecords.length
    
    return Array.from(grouped.entries())
      .map(([statusCode, count]) => ({
        statusCode,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
    `}
  },
  
  /**
   * Get user activity
   */
  async getUserActivity(limit: number = 10): Promise<UserActivity[]> {
    ${this.config.persistToDatabase ? `
    const activity = await prisma.requestLog.groupBy({
      by: ['userId'],
      where: { userId: { not: null } },
      _count: { id: true },
      _max: { createdAt: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit
    })
    
    return activity.map(a => ({
      userId: a.userId!,
      requestCount: a._count.id,
      lastActivity: a._max.createdAt!
    }))
    ` : `
    const grouped = new Map<number, { count: number; lastActivity: Date }>()
    
    for (const record of usageRecords) {
      if (!record.userId) continue
      
      const existing = grouped.get(record.userId)
      if (!existing || record.createdAt > existing.lastActivity) {
        grouped.set(record.userId, {
          count: (existing?.count || 0) + 1,
          lastActivity: record.createdAt
        })
      } else {
        grouped.set(record.userId, {
          ...existing,
          count: existing.count + 1
        })
      }
    }
    
    return Array.from(grouped.entries())
      .map(([userId, stats]) => ({
        userId,
        requestCount: stats.count,
        lastActivity: stats.lastActivity
      }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, limit)
    `}
  },
  
  /**
   * Clean up old records (run periodically)
   */
  async cleanup(): Promise<number> {
    ${this.config.persistToDatabase ? `
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - ${this.config.retentionDays})
    
    const result = await prisma.requestLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    })
    
    logger.info({ deleted: result.count, cutoffDate }, 'Cleaned up old usage records')
    return result.count
    ` : `
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - ${this.config.retentionDays})
    
    const originalLength = usageRecords.length
    const filtered = usageRecords.filter(r => r.createdAt >= cutoffDate)
    usageRecords.length = 0
    usageRecords.push(...filtered)
    
    return originalLength - filtered.length
    `}
  },
  
  /**
   * Get real-time metrics (last N minutes)
   */
  async getRealtimeMetrics(minutes: number = 5): Promise<UsageStats> {
    const startDate = new Date(Date.now() - minutes * 60 * 1000)
    return this.getStats(startDate, new Date())
  }
}
`
  }
  
  /**
   * Generate usage routes
   */
  private generateUsageRoutes(): string {
    return `// @generated
// Usage Analytics Routes
// Provides API for querying usage statistics

import { Router } from 'express'
import { usageService } from '../services/usage.service.js'
import { requireAuth } from '@/auth/middleware/jwt.middleware.js'
import type { Request, Response } from 'express'

export const usageRouter = Router()

/**
 * GET /usage/stats
 * Get overall usage statistics
 * 
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 */
usageRouter.get('/stats',
  requireAuth,  // Admin only
  async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined
      
      const stats = await usageService.getStats(startDate, endDate)
      
      res.json(stats)
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get usage stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * GET /usage/endpoints
 * Get top endpoints by request count
 * 
 * Query params:
 * - limit: Number of results (default: 10)
 * - startDate: ISO date string
 * - endDate: ISO date string
 */
usageRouter.get('/endpoints',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined
      
      const endpoints = await usageService.getTopEndpoints(limit, startDate, endDate)
      
      res.json({ data: endpoints })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get endpoint stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * GET /usage/errors
 * Get error breakdown by status code
 */
usageRouter.get('/errors',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10
      const errors = await usageService.getErrorBreakdown(limit)
      
      res.json({ data: errors })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get error breakdown',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * GET /usage/users
 * Get most active users
 */
usageRouter.get('/users',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10
      const users = await usageService.getUserActivity(limit)
      
      res.json({ data: users })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get user activity',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * GET /usage/realtime
 * Get real-time metrics (last N minutes)
 */
usageRouter.get('/realtime',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const minutes = parseInt(req.query.minutes as string) || 5
      const metrics = await usageService.getRealtimeMetrics(minutes)
      
      res.json(metrics)
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get realtime metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

/**
 * POST /usage/cleanup
 * Manually trigger cleanup of old records
 */
usageRouter.post('/cleanup',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const deleted = await usageService.cleanup()
      
      res.json({ 
        message: 'Cleanup complete',
        recordsDeleted: deleted
      })
    } catch (error) {
      res.status(500).json({
        error: 'Failed to cleanup records',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)
`
  }
  
  /**
   * Generate TypeScript types
   */
  private generateUsageTypes(): string {
    return `// @generated
// Usage Tracker Type Definitions

/**
 * Single usage record
 */
export interface UsageRecord {
  id: number
  method: string
  path: string
  statusCode: number
  responseTime: number  // milliseconds
  userId?: number
  apiKeyId?: number
  userAgent?: string
  ip?: string
  error?: string
  createdAt: Date
}

/**
 * Overall usage statistics
 */
export interface UsageStats {
  totalRequests: number
  totalErrors: number
  errorRate: number  // 0-1
  avgResponseTime: number  // milliseconds
  uniqueUsers: number
  period: {
    start: Date
    end: Date
  }
}

/**
 * Endpoint statistics
 */
export interface EndpointStats {
  method: string
  path: string
  count: number
  avgResponseTime: number
}

/**
 * User activity
 */
export interface UserActivity {
  userId: number
  requestCount: number
  lastActivity: Date
}

/**
 * Error breakdown
 */
export interface ErrorBreakdown {
  statusCode: number
  count: number
  percentage: number
}
`
  }
  
  /**
   * Generate barrel export
   */
  private generateBarrelExport(): string {
    return `// @generated
// Usage Tracker - Barrel Export

export { usageTracker } from './middleware/usage-tracker.middleware.js'
export { usageService } from './services/usage.service.js'
export { usageRouter } from './routes/usage.routes.js'

export type {
  UsageRecord,
  UsageStats,
  EndpointStats,
  UserActivity,
  ErrorBreakdown
} from './types/usage.types.js'
`
  }
  
  /**
   * Health check for Usage Tracker
   */
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'usage-tracker',
      title: '📊 Usage Tracker',
      icon: '📊',
      checks: [
        {
          id: 'usage-enabled',
          name: 'Usage Tracking Enabled',
          description: 'Validates usage tracking is enabled',
          testFunction: `
            const enabled = process.env.USAGE_TRACKER_ENABLED !== 'false'
            return {
              success: enabled,
              message: enabled ? 'Usage tracking enabled' : 'Usage tracking disabled'
            }
          `
        },
        {
          id: 'usage-middleware',
          name: 'Usage Middleware',
          description: 'Validates usage tracking middleware is available',
          testFunction: `
            const { usageTracker } = await import('@/monitoring')
            return {
              success: typeof usageTracker === 'function',
              message: 'Usage tracking middleware available'
            }
          `
        },
        {
          id: 'usage-service',
          name: 'Usage Service',
          description: 'Validates usage service functions',
          testFunction: `
            const { usageService } = await import('@/monitoring')
            const stats = await usageService.getStats()
            return {
              success: typeof stats.totalRequests === 'number',
              message: \`Tracking \${stats.totalRequests} requests\`
            }
          `
        },
        {
          id: 'usage-routes',
          name: 'Usage Analytics Routes',
          description: 'Tests usage analytics API endpoints',
          endpoint: '/usage/stats',
          skipForStatic: true
        }
      ]
    }
  }
}

