/**
 * Phase 6: Write Infrastructure
 * 
 * Writes base infrastructure files:
 * - Base controllers (CRUD, Service)
 * - Platform infrastructure (config, logger, error, security, health)
 * - Environment templates
 * - Main server file
 */

import path from 'node:path'
import fs from 'node:fs/promises'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { writeFile, trackPath, generateEsmPath } from '../phase-utilities.js'

export class WriteInfrastructurePhase extends GenerationPhase {
  readonly name = 'writeInfrastructure'
  readonly order = 6
  
  getDescription(): string {
    return 'Writing infrastructure and platform'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { pathsConfig: cfg, schema } = context
    
    if (!cfg) {
      throw new Error('Paths config not found in context')
    }
    
    const { baseCRUDControllerTemplate } = await import('../../templates/base-crud-controller.template.js')
    const { baseServiceControllerTemplate } = await import('../../templates/base-service-controller.template.js')
    
    const writes: Promise<void>[] = []
    
    // ========================================================================
    // BASE CONTROLLERS
    // ========================================================================
    const baseDir = path.join(cfg.rootDir, 'base')
    const baseCRUDPath = path.join(baseDir, 'base-crud-controller.ts')
    const baseServicePath = path.join(baseDir, 'base-service-controller.ts')
    const baseIndexPath = path.join(baseDir, 'index.ts')
    
    writes.push(writeFile(baseCRUDPath, baseCRUDControllerTemplate))
    trackPath('base:base-crud-controller.ts', baseCRUDPath, generateEsmPath(cfg, 'base', undefined, 'base-crud-controller.ts'))
    
    writes.push(writeFile(baseServicePath, baseServiceControllerTemplate))
    trackPath('base:base-service-controller.ts', baseServicePath, generateEsmPath(cfg, 'base', undefined, 'base-service-controller.ts'))
    
    const baseIndexContent = `// @generated\nexport * from './base-crud-controller.js'\nexport * from './base-service-controller.js'\n`
    writes.push(writeFile(baseIndexPath, baseIndexContent))
    trackPath('base:index.ts', baseIndexPath, generateEsmPath(cfg, 'base'))
    
    // ========================================================================
    // PLATFORM INFRASTRUCTURE
    // ========================================================================
    const platformDir = path.join(cfg.rootDir, 'platform')
    
    // Load platform templates
    const dbName = context.config.projectName || 'app'
    const platformTemplates = await this.loadPlatformTemplates(dbName)
    
    // Write config.ts
    const configPath = path.join(platformDir, 'config.ts')
    writes.push(writeFile(configPath, platformTemplates.config))
    trackPath('platform:config.ts', configPath, generateEsmPath(cfg, 'platform', undefined, 'config.ts'))
    
    // Write logger.ts
    const loggerPath = path.join(platformDir, 'logger.ts')
    writes.push(writeFile(loggerPath, platformTemplates.logger))
    trackPath('platform:logger.ts', loggerPath, generateEsmPath(cfg, 'platform', undefined, 'logger.ts'))
    
    // Write error.ts
    const errorPath = path.join(platformDir, 'error.ts')
    writes.push(writeFile(errorPath, platformTemplates.error))
    trackPath('platform:error.ts', errorPath, generateEsmPath(cfg, 'platform', undefined, 'error.ts'))
    
    // Write security.ts
    const securityPath = path.join(platformDir, 'security.ts')
    writes.push(writeFile(securityPath, platformTemplates.security))
    trackPath('platform:security.ts', securityPath, generateEsmPath(cfg, 'platform', undefined, 'security.ts'))
    
    // Write health.ts
    const healthPath = path.join(platformDir, 'health.ts')
    writes.push(writeFile(healthPath, platformTemplates.health))
    trackPath('platform:health.ts', healthPath, generateEsmPath(cfg, 'platform', undefined, 'health.ts'))
    
    // Write platform barrel
    const platformIndexPath = path.join(platformDir, 'index.ts')
    const platformIndexContent = `// @generated
export * from './config.js'
export * from './logger.js'
export * from './error.js'
export * from './security.js'
export * from './health.js'
`
    writes.push(writeFile(platformIndexPath, platformIndexContent))
    trackPath('platform:index.ts', platformIndexPath, generateEsmPath(cfg, 'platform'))
    
    // ========================================================================
    // ENVIRONMENT TEMPLATES
    // ========================================================================
    const projectRoot = cfg.rootDir.replace(/[\/\\]src$/, '')
    
    // .env.example
    const envExamplePath = path.join(projectRoot, '.env.example')
    writes.push(writeFile(envExamplePath, platformTemplates.envExample))
    
    // .env.development
    const envDevPath = path.join(projectRoot, '.env.development')
    const envDevContent = platformTemplates.envDevelopment.replace(/\{\{dbName\}\}/g, dbName)
    writes.push(writeFile(envDevPath, envDevContent))
    
    // .env.test
    const envTestPath = path.join(projectRoot, '.env.test')
    writes.push(writeFile(envTestPath, platformTemplates.envTest))
    
    // ========================================================================
    // SERVER ENTRY POINT
    // ========================================================================
    const serverPath = path.join(cfg.rootDir, 'server.ts')
    const serverContent = this.generateServerFile(context)
    writes.push(writeFile(serverPath, serverContent))
    trackPath('server.ts', serverPath, generateEsmPath(cfg, '', undefined, 'server.ts'))
    
    await Promise.all(writes)
    
    return {
      success: true,
      filesGenerated: writes.length
    }
  }
  
  private async loadPlatformTemplates(dbName: string = 'app') {
    const {
      getConfigTemplate,
      getLoggerTemplate,
      getErrorTemplate,
      getSecurityTemplate,
      getHealthTemplate,
      getEnvExampleTemplate,
      getEnvDevelopmentTemplate,
      getEnvTestTemplate
    } = await import('../../templates/platform-infrastructure.template.js')
    
    return {
      config: getConfigTemplate(),
      logger: getLoggerTemplate(),
      error: getErrorTemplate(),
      security: getSecurityTemplate(),
      health: getHealthTemplate(),
      envExample: getEnvExampleTemplate(dbName),
      envDevelopment: getEnvDevelopmentTemplate(dbName),
      envTest: getEnvTestTemplate(),
    }
  }
  
  private generateServerFile(context: PhaseContext): string {
    const models = Array.isArray(context.analyzedModels) ? context.analyzedModels : []
    
    return `/**
 * Express Server Setup
 * 
 * Production-ready Express application with:
 * - Security middleware (Helmet, CORS, rate limiting)
 * - Structured logging with request IDs
 * - Health check endpoints
 * - API versioning (/api/v1)
 * - Centralized error handling
 * - Graceful shutdown
 */

import express, { Request, Response } from 'express';
import { config } from './platform/config.js';
import { logger, httpLogger } from './platform/logger.js';
import { errorHandler } from './platform/error.js';
import {
  securityHeaders,
  corsMiddleware,
  rateLimiter,
  parameterPollutionProtection,
  configureTrustProxy,
} from './platform/security.js';
import {
  livenessCheck,
  readinessCheck,
  registerShutdownHandlers,
} from './platform/health.js';

// Import route modules
${models.map(m => `import ${m.name.toLowerCase()}Routes from './routes/${m.name.toLowerCase()}.routes.js';`).join('\n')}

/**
 * Create and configure Express application
 */
export function createApp() {
  const app = express();
  
  // Trust proxy
  configureTrustProxy(app);
  
  // Security middleware (apply early)
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(rateLimiter);
  
  // Body parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(parameterPollutionProtection);
  
  // Request logging
  app.use(httpLogger);
  
  // Health checks (no auth, outside API prefix)
  app.get('/health', livenessCheck);
  app.get('/health/ready', readinessCheck);
  
  // API routes (versioned under /api/v1)
  const apiRouter = express.Router();
  
${models.map(m => `  apiRouter.use('/${m.name.toLowerCase()}s', ${m.name.toLowerCase()}Routes);`).join('\n')}
  
  app.use(\`\${config.API_PREFIX}/\${config.API_VERSION}\`, apiRouter);
  
  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      type: '/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: \`Route \${req.method} \${req.url} not found\`,
      instance: req.url,
    });
  });
  
  // Global error handler (must be last)
  app.use(errorHandler);
  
  return app;
}

/**
 * Start the server
 */
export async function startServer() {
  const app = createApp();
  
  registerShutdownHandlers();
  
  const server = app.listen(config.PORT, config.HOST, () => {
    logger.info({
      environment: config.NODE_ENV,
      port: config.PORT,
      host: config.HOST,
      apiVersion: config.API_VERSION,
    }, '🚀 Server started');
    
    logger.info(\`📍 API: http://\${config.HOST}:\${config.PORT}\${config.API_PREFIX}/\${config.API_VERSION}\`);
    logger.info(\`❤️  Health: http://\${config.HOST}:\${config.PORT}/health\`);
  });
  
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(\`Port \${config.PORT} is already in use\`);
    } else {
      logger.error({ err: error }, 'Server error');
    }
    process.exit(1);
  });
}

// Start if main module
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  startServer().catch((error) => {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  });
}
`
  }
}

