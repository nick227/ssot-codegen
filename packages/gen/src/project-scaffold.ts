import fs from 'node:fs'
import path from 'node:path'
import type { PathsConfig } from './path-resolver.js'
import { resolveDependencies, type DependencyConfig } from './dependencies/index.js'

const ensureDir = (p: string) => fs.mkdirSync(p, { recursive: true })
const write = (file: string, content: string) => { 
  ensureDir(path.dirname(file))
  fs.writeFileSync(file, content, 'utf8')
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

export const generatePackageJson = (cfg: ScaffoldConfig) => {
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
  write(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  
  console.log(`[scaffold] Generated package.json with ${resolved.metadata.profile} profile`)
  if (resolved.metadata.features.length > 0) {
    console.log(`[scaffold] Features enabled: ${resolved.metadata.features.join(', ')}`)
  }
  
  return pkgPath
}

export const generateEnvExample = (cfg: ScaffoldConfig) => {
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
  write(envPath, content)
  return envPath
}

export const generateGitignore = (cfg: ScaffoldConfig) => {
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
  write(gitignorePath, content)
  return gitignorePath
}

export const generatePrismaClient = (cfg: ScaffoldConfig) => {
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
  write(dbPath, content)
  return dbPath
}

export const generateConfig = (cfg: ScaffoldConfig) => {
  const content = `import { config as loadEnv } from 'dotenv'

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

  const configPath = path.join(cfg.projectRoot, 'src', 'config.ts')
  write(configPath, content)
  return configPath
}

export const generateMiddleware = (cfg: ScaffoldConfig) => {
  const content = cfg.framework === 'express' 
    ? `import type { Request, Response, NextFunction } from 'express'
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
    : `import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  console.error(error)

  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      details: error.errors,
    })
  }

  const statusCode = error.statusCode || 500
  reply.status(statusCode).send({
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  })
}
`

  const middlewarePath = path.join(cfg.projectRoot, 'src', 'middleware.ts')
  write(middlewarePath, content)
  return middlewarePath
}

export const generateApp = (cfg: ScaffoldConfig) => {
  const content = cfg.framework === 'express'
    ? `import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import 'express-async-errors'
import config from './config.js'
import { errorHandler, notFoundHandler } from './middleware.js'

export const createApp = () => {
  const app = express()

  // Security & parsing
  app.use(helmet())
  app.use(cors({ origin: config.cors.origin }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // API routes
  // TODO: Import and register your generated routes here
  // Example:
  // import { todoRoutes } from '@gen/routes/todo'
  // app.use(\`\${config.api.prefix}/todos\`, todoRoutes)

  // Error handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
`
    : `import Fastify from 'fastify'
import cors from '@fastify/cors'
import config from './config.js'
import { errorHandler } from './middleware.js'

export const createApp = async () => {
  const app = Fastify({
    logger: {
      level: config.logging.level,
    },
  })

  // Plugins
  await app.register(cors, { origin: config.cors.origin })

  // Error handler
  app.setErrorHandler(errorHandler)

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
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
  write(appPath, content)
  return appPath
}

export const generateServer = (cfg: ScaffoldConfig) => {
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
  write(serverPath, content)
  return serverPath
}

export const generateTsConfig = (cfg: ScaffoldConfig) => {
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
  write(tsconfigPath, JSON.stringify(content, null, 2) + '\n')
  return tsconfigPath
}

export const generateReadme = (cfg: ScaffoldConfig) => {
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
  write(readmePath, content)
  return readmePath
}

export const scaffoldProject = (cfg: ScaffoldConfig): string[] => {
  const generatedFiles: string[] = []

  console.log(`[scaffold] Generating project files for ${cfg.projectName}...`)

  generatedFiles.push(generatePackageJson(cfg))
  generatedFiles.push(generateTsConfig(cfg))
  generatedFiles.push(generateEnvExample(cfg))
  generatedFiles.push(generateGitignore(cfg))
  generatedFiles.push(generatePrismaClient(cfg))
  generatedFiles.push(generateConfig(cfg))
  generatedFiles.push(generateMiddleware(cfg))
  generatedFiles.push(generateApp(cfg))
  generatedFiles.push(generateServer(cfg))
  generatedFiles.push(generateReadme(cfg))

  console.log(`[scaffold] ✅ Generated ${generatedFiles.length} project files`)
  
  return generatedFiles
}

