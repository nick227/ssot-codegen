/**
 * Service Integration Generator
 * 
 * Generates controllers and routes for @service annotated models.
 * Wires user-implemented services to the API layer automatically.
 */

import type { ServiceAnnotation } from '../service-linker.js'
import { 
  getServiceExportName, 
  inferHTTPMethod, 
  inferRoutePath,
  parseRateLimit
} from '../service-linker.js'
import { kebabToCamelCase } from '../utils/naming.js'

/**
 * Generate controller for service integration (using BaseServiceController)
 * 
 * Creates minimal controller methods using base class
 */
export function generateServiceController(annotation: ServiceAnnotation): string {
  const serviceName = getServiceExportName(annotation)
  
  const controllerSetup = `const controller = new BaseServiceController({ serviceName: '${annotation.name}' })`
  
  const methodExports = annotation.methods.map(methodName => {
    const httpMethod = inferHTTPMethod(methodName)
    const statusCode = httpMethod === 'get' ? 200 : 201
    
    return `/**
 * ${methodName}
 * @generated from @service ${annotation.name}
 */
export const ${methodName} = controller.wrap(
  '${methodName}',
  ${serviceName}.${methodName}${statusCode !== 201 ? `,\n  { statusCode: ${statusCode} }` : ''}
)`
  }).join('\n\n')
  
  return `// @generated
// Service Integration Controller for ${annotation.name}
// Using BaseServiceController to eliminate boilerplate

import { BaseServiceController } from '@/base'
import { ${serviceName} } from '@/services/${annotation.name}.service.js'

${controllerSetup}

${methodExports}
`
}

/**
 * Generate a single controller method
 */
function generateServiceControllerMethod(annotation: ServiceAnnotation, methodName: string): string {
  const httpMethod = inferHTTPMethod(methodName)
  const requiresBody = httpMethod === 'post' || httpMethod === 'put'
  
  // Determine if userId is needed (most service methods need it)
  const needsUserId = !methodName.toLowerCase().includes('public')
  
  return `/**
 * ${methodName}
 * @generated from @service ${annotation.name}
 */
export const ${methodName} = async (req: AuthRequest, res: Response) => {
  try {
    ${requiresBody ? `// Parse and validate request body
    const data = req.body
    ` : `// Parse query parameters
    const params = req.query
    `}
    ${needsUserId && annotation.auth ? `
    // Extract user ID from authenticated request
    const userId = req.user?.userId
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    ` : ''}
    
    // Call user's service method
    ${needsUserId ? `const result = await ${getServiceExportName(annotation)}.${methodName}(userId, ${requiresBody ? 'data' : 'params'})` : `const result = await ${getServiceExportName(annotation)}.${methodName}(${requiresBody ? 'data' : 'params'})`}
    
    logger.info({ ${needsUserId ? 'userId, ' : ''}method: '${methodName}' }, 'Service method executed successfully')
    
    return res${httpMethod === 'post' ? '.status(201)' : ''}.json(result)
  } catch (error: any) {
    if (error instanceof ZodError) {
      logger.warn({ error: error.errors }, 'Validation error in ${methodName}')
      return res.status(400).json({ error: 'Validation Error', details: error.errors })
    }
    
    // Handle common error types
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      logger.warn({ error: error.message${needsUserId ? ', userId: req.user?.userId' : ''} }, 'Authorization error in ${methodName}')
      return res.status(403).json({ error: error.message })
    }
    
    if (error.message?.includes('not found') || error.message?.includes('Not found')) {
      logger.warn({ error: error.message }, 'Resource not found in ${methodName}')
      return res.status(404).json({ error: error.message })
    }
    
    logger.error({ error${needsUserId ? ', userId: req.user?.userId' : ''} }, 'Error in ${methodName}')
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}`
}

/**
 * Generate routes for service integration
 * 
 * Creates routes that wire to service controller methods
 */
export function generateServiceRoutes(annotation: ServiceAnnotation): string {
  const serviceName = getServiceExportName(annotation)
  const modelLower = annotation.model.name.toLowerCase()
  
  // Generate rate limiter if specified
  const rateLimiterCode = annotation.rateLimit 
    ? generateRateLimiter(annotation)
    : ''
  
  // Generate routes for each method
  const routes = annotation.methods.map(methodName => {
    const httpMethod = inferHTTPMethod(methodName)
    const routePath = inferRoutePath(methodName)
    
    const middlewares = []
    
    // Add authentication if required
    if (annotation.auth) {
      middlewares.push('authenticate')
    }
    
    // Add rate limiting if specified
    if (annotation.rateLimit) {
      middlewares.push(`${kebabToCamelCase(annotation.name)}Limiter`)
    }
    
    const middlewareStr = middlewares.length > 0 
      ? middlewares.join(', ') + ', '
      : ''
    
    return `// ${methodName} - ${httpMethod.toUpperCase()} ${routePath}
${kebabToCamelCase(annotation.name)}Router.${httpMethod}('${routePath}', ${middlewareStr}${kebabToCamelCase(annotation.name)}Controller.${methodName})`
  }).join('\n\n')
  
  return `// @generated
// Service Integration Routes for ${annotation.name}
// ${annotation.description || 'Service routes'}

import { Router, type Router as RouterType } from 'express'
import * as ${kebabToCamelCase(annotation.name)}Controller from '@/controllers/${annotation.name}'
${annotation.auth ? "import { authenticate } from '@/auth/jwt.js'" : ''}
${annotation.rateLimit ? "import { rateLimit } from 'express-rate-limit'" : ''}

export const ${kebabToCamelCase(annotation.name)}Router: RouterType = Router()

${rateLimiterCode}

${routes}
`
}

/**
 * Generate rate limiter middleware
 */
function generateRateLimiter(annotation: ServiceAnnotation): string {
  if (!annotation.rateLimit) return ''
  
  const config = parseRateLimit(annotation.rateLimit)
  const limiterName = `${kebabToCamelCase(annotation.name)}Limiter`
  
  return `// Rate limiting: ${annotation.rateLimit}
const ${limiterName} = rateLimit({
  windowMs: ${config.windowMs}, // ${annotation.rateLimit}
  max: ${config.max},
  message: 'Too many requests to ${annotation.name}, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

`
}

// Using shared kebabToCamelCase from utils/naming.ts
// Removed duplicate implementation

/**
 * Generate service scaffold (if service file doesn't exist)
 * 
 * Creates a template file with TODOs for developer to implement
 */
export function generateServiceScaffold(annotation: ServiceAnnotation): string {
  const serviceName = getServiceExportName(annotation)
  const modelLower = annotation.model.name.toLowerCase()
  const baseServiceImport = `import { ${modelLower}Service as baseService } from '@/services/${modelLower}'`
  
  // Provider-specific imports
  const providerImports = getProviderImports(annotation.provider)
  const providerSetup = getProviderSetup(annotation.provider)
  
  // Generate method scaffolds
  const methodScaffolds = annotation.methods.map((methodName, index) => {
    return generateMethodScaffold(annotation, methodName, index)
  }).join('\n\n')
  
  return `/**
 * ${annotation.name} Service
 * ${annotation.description || 'Service implementation'}
 * 
 * @generated scaffold - IMPLEMENT YOUR LOGIC HERE
 * 
 * This file was auto-generated as a scaffold. You have FULL control over the implementation.
 * The generator will wire this service to controllers and routes automatically.
 */

${baseServiceImport}
import prisma from '../db.js'
import { logger } from '../logger.js'
${providerImports}

${providerSetup}

export const ${serviceName} = {
  ...baseService,  // Include generated CRUD methods
  
${methodScaffolds}
}
`
}

/**
 * Generate scaffold for a single method
 */
function generateMethodScaffold(annotation: ServiceAnnotation, methodName: string, index: number): string {
  const httpMethod = inferHTTPMethod(methodName)
  const isQuery = httpMethod === 'get'
  
  return `  /**
   * ${methodName}
   * 
   * @exposed - This method will be exposed via ${httpMethod.toUpperCase()} ${inferRoutePath(methodName)}
   * ${annotation.auth ? '@auth required - User must be authenticated' : '@public - No authentication required'}
   * 
   * TODO: Implement your ${methodName} logic here
   * This is where you write your orchestration code.
   */
  async ${methodName}(${annotation.auth ? 'userId: number, ' : ''}...args: any[]) {
    try {
      logger.info({ ${annotation.auth ? 'userId, ' : ''}method: '${methodName}' }, 'Executing ${methodName}')
      
      // TODO: Step 1 - Your implementation here
      // Example: Validate input, call external API, save to database, return response
      
      throw new Error('${methodName} not implemented yet - see TODO comments')
      
      // TODO: Step 2 - Return your response
      // return { success: true, data: ... }
    } catch (error) {
      logger.error({ error${annotation.auth ? ', userId' : ''} }, 'Error in ${methodName}')
      throw error
    }
  }`
}

/**
 * Get provider-specific imports
 */
function getProviderImports(provider?: string): string {
  if (!provider) return ''
  
  const imports: Record<string, string> = {
    'openai': `// TODO: Install OpenAI SDK: npm install openai
import OpenAI from 'openai'`,
    'anthropic': `// TODO: Install Anthropic SDK: npm install @anthropic-ai/sdk
import Anthropic from '@anthropic-ai/sdk'`,
    's3': `// TODO: Install AWS SDK: npm install @aws-sdk/client-s3
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'`,
    'cloudflare': `// TODO: Install Cloudflare SDK: npm install @cloudflare/workers-types @aws-sdk/client-s3
// Cloudflare R2 is S3-compatible
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'`,
    'stripe': `// TODO: Install Stripe SDK: npm install stripe
import Stripe from 'stripe'`,
    'sendgrid': `// TODO: Install SendGrid SDK: npm install @sendgrid/mail
import sgMail from '@sendgrid/mail'`,
    'google': `// TODO: Install Google Auth SDK: npm install google-auth-library
import { OAuth2Client } from 'google-auth-library'`
  }
  
  return imports[provider.toLowerCase()] || `// Provider: ${provider}`
}

/**
 * Get provider-specific setup code
 */
function getProviderSetup(provider?: string): string {
  if (!provider) return ''
  
  const setups: Record<string, string> = {
    'openai': `// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})`,
    'anthropic': `// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})`,
    's3': `// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})`,
    'cloudflare': `// Initialize Cloudflare R2 client (S3-compatible)
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!, // https://your-account-id.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!
  }
})`,
    'stripe': `// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})`,
    'sendgrid': `// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)`,
    'google': `// Initialize Google OAuth client
const googleOAuth = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3003/api/auth/google/callback'
})`
  }
  
  return setups[provider.toLowerCase()] || ''
}


