/**
 * Templates for generating standalone, runnable projects
 */

export interface StandaloneProjectOptions {
  projectName: string
  framework: 'express' | 'fastify'
  databaseProvider: 'postgresql' | 'mysql' | 'sqlite'
  models: string[]
}

export const packageJsonTemplate = (options: StandaloneProjectOptions) => `{
  "name": "${options.projectName.replace(/-\d+$/, '')}",
  "version": "1.0.0",
  "type": "module",
  "description": "Generated standalone project from SSOT Codegen",
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "rimraf dist && tsc && tsc-alias",
    "start": "node dist/src/server.js",
    "test": "vitest",
    "test:validate": "vitest run tests/self-validation.test.ts",
    "test:ui": "vitest --ui",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist/ node_modules/",
    "validate": "pnpm typecheck && pnpm test:validate"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^17.2.0",
    "express": "^4.21.0",
    "express-async-errors": "^3.1.1",
    "express-rate-limit": "^7.4.0",
    "helmet": "^8.1.0",
    "http-errors": "^2.0.0",
    "pino": "^9.5.0",
    "pino-http": "^10.3.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.0",
    "@vitest/ui": "^2.1.0",
    "pino-pretty": "^13.1.0",
    "rimraf": "^6.0.0",
    "tsc-alias": "^1.8.16",
    "tsx": "^4.20.0",
    "typescript": "^5.9.0",
    "vitest": "^2.1.0"
  },
  "_generatedBy": "ssot-codegen standalone generator"
}
`

export const tsconfigTemplate = (projectName: string) => `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "rootDir": ".",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "allowImportingTsExtensions": false,
    "paths": {
      "@gen/*": ["./gen/*"],
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "gen/**/*"],
  "exclude": ["node_modules", "dist"]
}
`

export const envTemplate = (databaseProvider: string) => {
  const dbUrl = databaseProvider === 'postgresql' 
    ? 'postgresql://user:password@localhost:5432/dbname'
    : databaseProvider === 'mysql'
    ? 'mysql://user:password@localhost:3306/dbname'
    : 'file:./dev.db'
  
  return `# Environment Configuration
# Copy this file to .env and update with your values

# Server
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# Database
DATABASE_URL="${dbUrl}"

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
`
}

export const configTemplate = () => `import { config as loadEnv } from 'dotenv'

loadEnv()

export const config = {
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
} as const

// Validate required env vars
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

export default config
`

export const dbTemplate = () => `import { PrismaClient } from '@prisma/client'

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

export const loggerTemplate = () => `import pino from 'pino'
import pinoHttp from 'pino-http'

// Create base logger
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  
  // Pretty print in development
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Production logging format
  formatters: process.env.NODE_ENV === 'production'
    ? {
        level: (label) => ({ level: label }),
        bindings: (bindings) => ({
          pid: bindings.pid,
          host: bindings.hostname,
          node_version: process.version,
        }),
      }
    : undefined,

  // Add timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Custom serializers
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.getHeader('content-type'),
      },
    }),
    err: pino.stdSerializers.err,
  },
})

// HTTP logger middleware
export const httpLogger = pinoHttp({
  logger,
  
  // Generate request ID
  genReqId: (req) => req.headers['x-request-id'] || req.id,

  // Custom log level based on status code
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error'
    if (res.statusCode >= 400) return 'warn'
    if (res.statusCode >= 300) return 'info'
    return 'debug'
  },

  // Don't log health checks in production
  autoLogging: {
    ignore: (req) => 
      process.env.NODE_ENV === 'production' && req.url === '/health',
  },

  // Custom success message
  customSuccessMessage: (req, res) => {
    return \`\${req.method} \${req.url} - \${res.statusCode}\`
  },

  // Custom error message
  customErrorMessage: (req, res, err) => {
    return \`\${req.method} \${req.url} - \${res.statusCode} - \${err.message}\`
  },
})

export default logger
`

export const middlewareTemplate = () => `import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err)

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors,
    })
  }

  const statusCode = (err as any).statusCode || 500
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  })
}
`

export const appTemplate = (models: string[]) => {
  const routeImports = models
    .map(m => `import { ${m.toLowerCase()}Router } from '@gen/routes/${m.toLowerCase()}/index.js'`)
    .join('\n')
  
  const routeRegistrations = models
    .map(m => `  app.use(\`\${config.api.prefix}/${m.toLowerCase()}s\`, ${m.toLowerCase()}Router)`)
    .join('\n')

  return `import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'express-async-errors'
import config from './config.js'
import { errorHandler, notFoundHandler } from './middleware.js'
import { httpLogger, logger } from './logger.js'
${routeImports}

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

export const createApp = async (): Promise<express.Application> => {
  const app = express()

  // Logging
  app.use(httpLogger)

  // Security & parsing
  app.use(helmet())
  app.use(cors({ origin: config.cors.origin }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  
  // Apply rate limiting to API routes
  app.use('/api', limiter)
  
  // Log startup
  logger.info({ config: { port: config.port, env: config.nodeEnv } }, 'App configuration loaded')

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // API Routes
${routeRegistrations}

  // Error handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
`
}

export const serverTemplate = () => `import { createApp } from './app.js'
import config from './config.js'
import prisma from './db.js'

const start = async () => {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected')

    const app = await createApp()

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

export const readmeTemplate = (options: StandaloneProjectOptions) => `# ${options.projectName}

Generated standalone project from SSOT Codegen.

## Models

${options.models.map(m => `- ${m}`).join('\n')}

## Getting Started

1. **Install dependencies:**
   \`\`\`bash
   pnpm install
   \`\`\`

2. **Configure environment:**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your database credentials
   \`\`\`

3. **Setup database:**
   \`\`\`bash
   # Run Prisma migrations (if you have a schema)
   npx prisma migrate dev
   \`\`\`

4. **Run self-validation tests:**
   \`\`\`bash
   pnpm test:validate
   \`\`\`
   This validates that:
   - TypeScript compiles
   - Server starts
   - Database connection works
   - All CRUD operations function
   - API endpoints respond

5. **Start development server:**
   \`\`\`bash
   pnpm dev
   \`\`\`

6. **Access the API:**
   - Health check: http://localhost:3000/health
   - API endpoints: http://localhost:3000/api/*

## Scripts

- \`pnpm dev\` - Start development server with hot reload
- \`pnpm build\` - Build for production
- \`pnpm start\` - Start production server
- \`pnpm test\` - Run tests in watch mode
- \`pnpm test:validate\` - Run self-validation test suite
- \`pnpm test:ui\` - Open Vitest UI
- \`pnpm validate\` - Run typecheck + tests (full validation)
- \`pnpm typecheck\` - Run TypeScript type checking
- \`pnpm clean\` - Remove build artifacts

## API Endpoints

${options.models.map(m => `
### ${m}
- \`GET /api/${m.toLowerCase()}s\` - List all
- \`GET /api/${m.toLowerCase()}s/:id\` - Get by ID
- \`POST /api/${m.toLowerCase()}s\` - Create
- \`PUT /api/${m.toLowerCase()}s/:id\` - Update
- \`DELETE /api/${m.toLowerCase()}s/:id\` - Delete
`).join('\n')}

## Project Structure

\`\`\`
${options.projectName}/
├── gen/              # Generated code (DTOs, services, controllers, routes, SDK)
├── src/              # Application code
│   ├── app.ts        # Express app configuration
│   ├── server.ts     # Server entry point
│   ├── config.ts     # Configuration
│   ├── db.ts         # Database client
│   ├── logger.ts     # Logging setup
│   └── middleware.ts # Error handlers
├── tests/            # Self-validation tests
│   ├── self-validation.test.ts  # Comprehensive integration tests
│   └── setup.ts      # Test configuration
├── prisma/           # Database schema
│   └── schema.prisma
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .env.example
\`\`\`

## Testing

This project includes comprehensive self-validation tests that verify:

- ✅ TypeScript compilation
- ✅ Server startup
- ✅ Database connectivity
- ✅ CRUD operations for all models
- ✅ API endpoint responses

Run \`pnpm test:validate\` to execute the full test suite.

## Notes

This is a fully standalone, deletable project. All dependencies are self-contained.
You can safely delete this entire folder when done testing.
`

export const gitignoreTemplate = () => `# Dependencies
node_modules/

# Build Output
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# Database
prisma/*.db
prisma/*.db-journal

# Testing
coverage/
.nyc_output/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*
`

