import fs from 'node:fs/promises'
import path from 'node:path'
import type { PathsConfig } from './path-resolver.js'
import { resolveDependencies, type DependencyConfig } from './dependencies/index.js'
import { 
  generateLogger as genLogger, 
  generateRequestLogger as genRequestLogger 
} from './templates/logger.template.js'
import { generateExpressTypes, generateFastifyTypes } from './templates/types.template.js'

const ensureDir = async (p: string) => await fs.mkdir(p, { recursive: true })
const write = async (file: string, content: string) => { 
  await ensureDir(path.dirname(file))
  await fs.writeFile(file, content, 'utf8')
}

export interface ScaffoldConfig {
  projectName: string
  projectRoot: string
  description?: string
  models: string[]
  framework: 'express' | 'fastify'
  useTypeScript: boolean
  
  // NEW: Flexible dependency configuration
  dependencies?: DependencyConfig
}

export const generatePackageJson = async (cfg: ScaffoldConfig) => {
  // Use flexible dependency system
  const depConfig: DependencyConfig = cfg.dependencies || {
    profile: 'standard',  // Default to standard profile
    framework: {
      name: cfg.framework,
      plugins: ['core', 'security']
    }
  }
  
  // Resolve dependencies
  const resolved = resolveDependencies(depConfig)
  
  // Merge with Prisma-specific scripts
  const scripts = {
    ...resolved.scripts,
    generate: 'prisma generate && node scripts/generate.js',
    'db:push': 'prisma db push',
    'db:migrate': 'prisma migrate dev',
    'db:studio': 'prisma studio',
  }
  
  const pkg = {
    name: cfg.projectName,
    version: '1.0.0',
    type: 'module' as const,
    description: cfg.description || `Generated API with ${cfg.models.length} models`,
    packageManager: 'pnpm@9.0.0',
    engines: {
      node: '>=18.0.0'
    },
    scripts,
    dependencies: resolved.runtime,
    devDependencies: resolved.dev,
    // Add metadata comment
    _generatedBy: `ssot-codegen with ${resolved.metadata.profile} profile`
  }

  const pkgPath = path.join(cfg.projectRoot, 'package.json')
  await write(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  
  console.log(`[scaffold] Generated package.json with ${resolved.metadata.profile} profile`)
  if (resolved.metadata.features.length > 0) {
    console.log(`[scaffold] Features enabled: ${resolved.metadata.features.join(', ')}`)
  }
  
  return pkgPath
}

export const generateEnvExample = async (cfg: ScaffoldConfig) => {
  const content = `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# Server
PORT=3000
NODE_ENV=development

# API
API_PREFIX=/api
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
`

  const envPath = path.join(cfg.projectRoot, '.env.example')
  await write(envPath, content)
  return envPath
}

export const generateGitignore = async (cfg: ScaffoldConfig) => {
  const content = `# Dependencies
node_modules/
.pnp
.pnp.js

# Environment
.env
.env.local
.env.*.local

# Build
dist/
build/
*.tsbuildinfo

# Generated
gen/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Prisma
prisma/*.db
prisma/*.db-journal
`

  const gitignorePath = path.join(cfg.projectRoot, '.gitignore')
  await write(gitignorePath, content)
  return gitignorePath
}

export const generatePrismaClient = async (cfg: ScaffoldConfig) => {
  const content = `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
`

  const dbPath = path.join(cfg.projectRoot, 'src', 'db.ts')
  await write(dbPath, content)
  return dbPath
}

export const generateConfig = async (cfg: ScaffoldConfig) => {
  const content = `import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv()

// Zod schema for configuration validation
const configSchema = z.object({
  port: z.number().int().positive().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  databaseUrl: z.string().url('DATABASE_URL must be a valid URL'),
  api: z.object({
    prefix: z.string().default('/api'),
  }),
  cors: z.object({
    origin: z.string().default('http://localhost:3000'),
  }),
  logging: z.object({
    level: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  }),
})

// Parse and validate configuration
export const config = configSchema.parse({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  api: {
    prefix: process.env.API_PREFIX || '/api',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
})

export type Config = z.infer<typeof configSchema>

export default config
`

  const configPath = path.join(cfg.projectRoot, 'src', 'config.ts')
  await write(configPath, content)
  return configPath
}

export const generateLogger = async (cfg: ScaffoldConfig) => {
  const content = genLogger(cfg)
  const loggerPath = path.join(cfg.projectRoot, 'src', 'logger.ts')
  await write(loggerPath, content)
  return loggerPath
}

export const generateRequestLogger = async (cfg: ScaffoldConfig) => {
  const content = genRequestLogger(cfg, cfg.framework)
  const requestLoggerPath = path.join(cfg.projectRoot, 'src', 'request-logger.ts')
  await write(requestLoggerPath, content)
  return requestLoggerPath
}

export const generateTypeDeclarations = async (cfg: ScaffoldConfig) => {
  const content = cfg.framework === 'express' 
    ? generateExpressTypes() 
    : generateFastifyTypes()
  const typesPath = path.join(cfg.projectRoot, 'src', 'types.d.ts')
  await write(typesPath, content)
  return typesPath
}

export const generateMiddleware = async (cfg: ScaffoldConfig) => {
  const content = cfg.framework === 'express' 
    ? `import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from './logger.js'
import { Prisma } from '@prisma/client'

/**
 * Global error handler with structured logging
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.id

  // Validation errors
  if (err instanceof ZodError) {
    logger.warn({ requestId, errors: err.errors }, 'Validation error')
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors,
      requestId,
    })
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, req, res)
  }

  // Generic errors
  const statusCode = (err as any).statusCode || 500
  
  if (statusCode >= 500) {
    logger.error({ requestId, err, statusCode }, 'Internal server error')
  } else {
    logger.warn({ requestId, err, statusCode }, 'Request error')
  }

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError, req: Request, res: Response) {
  const requestId = req.id

  switch (err.code) {
    case 'P2002': // Unique constraint violation
      logger.warn({ requestId, error: err }, 'Unique constraint violation')
      return res.status(409).json({
        error: 'Resource already exists',
        field: err.meta?.target,
        requestId,
      })
    
    case 'P2025': // Record not found
      logger.info({ requestId, error: err }, 'Record not found')
      return res.status(404).json({
        error: 'Resource not found',
        requestId,
      })
    
    case 'P2003': // Foreign key constraint failed
      logger.warn({ requestId, error: err }, 'Foreign key constraint violation')
      return res.status(400).json({
        error: 'Invalid reference',
        field: err.meta?.field_name,
        requestId,
      })
    
    default:
      logger.error({ requestId, error: err, code: err.code }, 'Database error')
      return res.status(500).json({
        error: 'Database error',
        requestId,
      })
  }
}

export const notFoundHandler = (req: Request, res: Response) => {
  logger.info({ requestId: req.id, path: req.path }, 'Route not found')
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    requestId: req.id,
  })
}
`
    : `import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { logger } from './logger.js'
import { Prisma } from '@prisma/client'

/**
 * Global error handler with structured logging
 */
export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const requestId = request.id

  // Validation errors
  if (error instanceof ZodError) {
    logger.warn({ requestId, errors: error.errors }, 'Validation error')
    return reply.status(400).send({
      error: 'Validation Error',
      details: error.errors,
      requestId,
    })
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, request, reply)
  }

  // Generic errors
  const statusCode = error.statusCode || 500
  
  if (statusCode >= 500) {
    logger.error({ requestId, error, statusCode }, 'Internal server error')
  } else {
    logger.warn({ requestId, error, statusCode }, 'Request error')
  }

  reply.status(statusCode).send({
    error: error.message || 'Internal Server Error',
    requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  })
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.id

  switch (err.code) {
    case 'P2002': // Unique constraint violation
      logger.warn({ requestId, error: err }, 'Unique constraint violation')
      return reply.status(409).send({
        error: 'Resource already exists',
        field: err.meta?.target,
        requestId,
      })
    
    case 'P2025': // Record not found
      logger.info({ requestId, error: err }, 'Record not found')
      return reply.status(404).send({
        error: 'Resource not found',
        requestId,
      })
    
    case 'P2003': // Foreign key constraint failed
      logger.warn({ requestId, error: err }, 'Foreign key constraint violation')
      return reply.status(400).send({
        error: 'Invalid reference',
        field: err.meta?.field_name,
        requestId,
      })
    
    default:
      logger.error({ requestId, error: err, code: err.code }, 'Database error')
      return reply.status(500).send({
        error: 'Database error',
        requestId,
      })
  }
}
`

  const middlewarePath = path.join(cfg.projectRoot, 'src', 'middleware.ts')
  await write(middlewarePath, content)
  return middlewarePath
}

export const generateApp = async (cfg: ScaffoldConfig) => {
  const content = cfg.framework === 'express'
    ? `import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import 'express-async-errors'
import config from './config.js'
import { logger } from './logger.js'
import { requestIdMiddleware, requestLoggerMiddleware } from './request-logger.js'
import { errorHandler, notFoundHandler } from './middleware.js'
import prisma from './db.js'

export const createApp = () => {
  const app = express()

  // Request tracking
  app.use(requestIdMiddleware)
  app.use(requestLoggerMiddleware)

  // Security & parsing
  app.use(helmet())
  app.use(cors({ origin: config.cors.origin }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Health & observability endpoints
  app.get('/health', async (req, res) => {
    try {
      // Check database connection
      await prisma.$queryRaw\`SELECT 1\`
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected'
      })
    } catch (error) {
      logger.error({ error }, 'Health check failed')
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected'
      })
    }
  })

  app.get('/ready', async (req, res) => {
    // Readiness probe for Kubernetes
    try {
      await prisma.$queryRaw\`SELECT 1\`
      res.status(200).send('OK')
    } catch (error) {
      res.status(503).send('Not Ready')
    }
  })

  // API routes
  // TODO: Import and register your generated routes here
  // Example:
  // import { todoRoutes } from '@gen/routes/todo'
  // app.use(\`\${config.api.prefix}/todos\`, todoRoutes)

  // Error handling (must be last)
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
`
    : `import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import config from './config.js'
import { logger } from './logger.js'
import { requestIdPlugin } from './request-logger.js'
import { errorHandler } from './middleware.js'
import prisma from './db.js'

export const createApp = async () => {
  const app = Fastify({
    logger: logger as any,
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
  })

  // Plugins
  await app.register(requestIdPlugin)
  await app.register(helmet)
  await app.register(cors, { origin: config.cors.origin })

  // Error handler
  app.setErrorHandler(errorHandler)

  // Health & observability endpoints
  app.get('/health', async () => {
    try {
      await prisma.$queryRaw\`SELECT 1\`
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected'
      }
    } catch (error) {
      logger.error({ error }, 'Health check failed')
      throw app.httpErrors.serviceUnavailable('Database connection failed')
    }
  })

  app.get('/ready', async (request, reply) => {
    try {
      await prisma.$queryRaw\`SELECT 1\`
      reply.status(200).send('OK')
    } catch (error) {
      reply.status(503).send('Not Ready')
    }
  })

  // API routes
  // TODO: Import and register your generated routes here
  // Example:
  // import { todoRoutes } from '@gen/routes/todo'
  // app.register(todoRoutes, { prefix: \`\${config.api.prefix}/todos\` })

  return app
}
`

  const appPath = path.join(cfg.projectRoot, 'src', 'app.ts')
  await write(appPath, content)
  return appPath
}

export const generateServer = async (cfg: ScaffoldConfig) => {
  const content = cfg.framework === 'express'
    ? `import { createApp } from './app.js'
import config from './config.js'
import prisma from './db.js'

const start = async () => {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected')

    const app = createApp()

    app.listen(config.port, () => {
      console.log(\`🚀 Server running on http://localhost:\${config.port}\`)
      console.log(\`📚 Health check: http://localhost:\${config.port}/health\`)
      console.log(\`📡 API prefix: \${config.api.prefix}\`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

start()
`
    : `import { createApp } from './app.js'
import config from './config.js'
import prisma from './db.js'

const start = async () => {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected')

    const app = await createApp()

    await app.listen({ 
      port: config.port,
      host: '0.0.0.0'
    })

    console.log(\`🚀 Server running on http://localhost:\${config.port}\`)
    console.log(\`📚 Health check: http://localhost:\${config.port}/health\`)
    console.log(\`📡 API prefix: \${config.api.prefix}\`)
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

start()
`

  const serverPath = path.join(cfg.projectRoot, 'src', 'server.ts')
  await write(serverPath, content)
  return serverPath
}

export const generateTsConfig = async (cfg: ScaffoldConfig) => {
  const content = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      lib: ['ES2022'],
      moduleResolution: 'bundler',
      esModuleInterop: true,
      skipLibCheck: true,
      strict: true,
      noUncheckedIndexedAccess: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      outDir: './dist',
      paths: {
        '@gen/*': ['./gen/*'],
        '@/*': ['./src/*']
      }
    },
    include: ['src/**/*', 'gen/**/*'],
    exclude: ['node_modules', 'dist']
  }

  const tsconfigPath = path.join(cfg.projectRoot, 'tsconfig.json')
  await write(tsconfigPath, JSON.stringify(content, null, 2) + '\n')
  return tsconfigPath
}

export const generateReadme = async (cfg: ScaffoldConfig) => {
  const modelsList = cfg.models.map(m => `- ${m}`).join('\n')
  
  const content = `# ${cfg.projectName}

${cfg.description || `Generated API project with ${cfg.models.length} models`}

## 🚀 Quick Start

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment

Copy the example environment file and configure your database:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` and set your \`DATABASE_URL\`:

\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
\`\`\`

### 3. Setup Database

Push the Prisma schema to your database:

\`\`\`bash
npm run db:push
\`\`\`

Or create and run migrations:

\`\`\`bash
npm run db:migrate
\`\`\`

### 4. Generate Code

Generate Prisma Client and code artifacts:

\`\`\`bash
npm run generate
\`\`\`

### 5. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The server will start on http://localhost:3000

## 📦 Project Structure

\`\`\`
.
├── prisma/
│   └── schema.prisma       # Database schema (SSOT)
├── src/
│   ├── server.ts           # Entry point
│   ├── app.ts              # ${cfg.framework === 'express' ? 'Express' : 'Fastify'} app setup
│   ├── db.ts               # Prisma client singleton
│   ├── config.ts           # Environment configuration
│   └── middleware.ts       # Error handlers
├── gen/                    # Generated code (do not edit!)
│   ├── contracts/          # TypeScript DTOs
│   ├── validators/         # Zod schemas
│   ├── routes/             # API routes
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   └── openapi/            # OpenAPI spec
└── scripts/
    └── generate.js         # Code generation script
\`\`\`

## 📚 API Models

${modelsList}

## 🛠️ Available Scripts

- \`npm run dev\` - Start development server with hot reload
- \`npm run build\` - Build for production
- \`npm start\` - Run production server
- \`npm run generate\` - Generate Prisma Client & code artifacts
- \`npm run db:push\` - Push schema to database (no migrations)
- \`npm run db:migrate\` - Create and apply migrations
- \`npm run db:studio\` - Open Prisma Studio
- \`npm run lint\` - Type check with TypeScript

## 🔧 Implementing Business Logic

The generated code in \`gen/\` contains type-safe stubs. Implement your business logic in the generated controller files:

\`\`\`typescript
// Example: Implement a controller
import type { TodoCreateDTO } from '@gen/contracts/todo'
import prisma from '@/db'

export const createTodo = async (input: TodoCreateDTO) => {
  return await prisma.todo.create({
    data: input
  })
}
\`\`\`

## 🔒 Security

- Helmet.js for security headers
- CORS configured
- Input validation with Zod
- Prisma prevents SQL injection
- Environment variables for secrets

## 📖 Documentation

- OpenAPI spec: \`gen/openapi/openapi.json\`
- View in Swagger UI or import into Postman

## 🧪 Testing

Add tests in \`src/__tests__/\` directory. Use Node's built-in test runner or add Jest/Vitest.

## 🚢 Deployment

### Build for production:

\`\`\`bash
npm run build
\`\`\`

### Set production environment:

\`\`\`env
NODE_ENV=production
DATABASE_URL="your-production-db-url"
\`\`\`

### Run:

\`\`\`bash
npm start
\`\`\`

## 📝 Regenerating Code

Whenever you modify \`prisma/schema.prisma\`:

1. Run \`npm run generate\`
2. Update your route registrations in \`src/app.ts\`
3. Implement new controller logic

**⚠️ Never edit files in \`gen/\` directory - they will be overwritten!**

## 📄 License

MIT
`

  const readmePath = path.join(cfg.projectRoot, 'README.md')
  await write(readmePath, content)
  return readmePath
}

export const scaffoldProject = async (cfg: ScaffoldConfig): Promise<string[]> => {
  const generatedFiles: string[] = []

  console.log(`[scaffold] Generating project files for ${cfg.projectName}...`)

  // Execute all file generation in parallel for better performance
  const filePromises = [
    generatePackageJson(cfg),
    generateTsConfig(cfg),
    generateEnvExample(cfg),
    generateGitignore(cfg),
    generatePrismaClient(cfg),
    generateConfig(cfg),
    generateLogger(cfg),
    generateRequestLogger(cfg),
    generateTypeDeclarations(cfg),
    generateMiddleware(cfg),
    generateApp(cfg),
    generateServer(cfg),
    generateReadme(cfg)
  ]
  
  const files = await Promise.all(filePromises)
  generatedFiles.push(...files)

  console.log(`[scaffold] ✅ Generated ${generatedFiles.length} project files`)
  
  return generatedFiles
}

