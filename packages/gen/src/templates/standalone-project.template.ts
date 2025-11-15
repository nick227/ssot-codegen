/**
 * Templates for generating standalone, runnable projects
 */

export interface StandaloneProjectOptions {
  projectName: string
  framework: 'express' | 'fastify'
  databaseProvider: 'postgresql' | 'mysql' | 'sqlite'
  models: string[]
  pluginDependencies?: Record<string, string>
  pluginDevDependencies?: Record<string, string>
  serviceNames?: string[]  // Service integration route names (e.g., ['ai-agent', 'file-storage'])
  hasPlugins?: boolean  // Whether any plugins were generated
  hasUI?: boolean  // Whether UI files were generated
  uiFramework?: 'vite' | 'nextjs'  // Frontend framework (default: 'vite')
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
    "dev": "${options.hasUI ? (options.uiFramework === 'nextjs' ? 'concurrently "tsx watch src/server.ts" "next dev"' : 'concurrently "tsx watch src/server.ts" "vite"') : 'tsx watch src/server.ts'}",
    "dev:backend": "tsx watch src/server.ts",
    "dev:frontend": "${options.hasUI ? (options.uiFramework === 'nextjs' ? 'next dev' : 'vite') : ''}",
    "build": "${options.hasUI ? (options.uiFramework === 'nextjs' ? 'rimraf dist .next && tsc && tsc-alias && next build' : 'rimraf dist dist-frontend && tsc && tsc-alias && vite build') : 'rimraf dist && tsc && tsc-alias'}",
    "build:backend": "rimraf dist && tsc && tsc-alias",
    "build:frontend": "${options.hasUI ? (options.uiFramework === 'nextjs' ? 'next build' : 'vite build') : ''}",
    "start": "${options.hasUI ? (options.uiFramework === 'nextjs' ? 'concurrently "node dist/src/server.js" "next start"' : 'concurrently "node dist/src/server.js" "vite preview"') : 'node dist/src/server.js'}",
    "start:backend": "node dist/src/server.js",
    "start:frontend": "${options.hasUI ? (options.uiFramework === 'nextjs' ? 'next start' : 'vite preview') : ''}",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:validate": "vitest run tests/self-validation.test.ts",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \\"src/**/*.{ts,tsx,json}\\"",
    "format:check": "prettier --check \\"src/**/*.{ts,tsx,json}\\"",
    "clean": "rimraf dist/ node_modules/ coverage/",
    "validate": "pnpm typecheck && pnpm lint && pnpm test:validate",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "prepare": "husky install || true",
    "precommit": "lint-staged"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "@ssot-codegen/sdk-runtime": "file:../../packages/sdk-runtime",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^17.2.0",
    "express": "^4.21.0",
    "express-async-errors": "^3.1.1",
    "express-rate-limit": "^7.4.0",
    "helmet": "^8.1.0",
    "hpp": "^0.2.3",
    "http-errors": "^2.0.0",
    "pino": "^9.5.0",
    "pino-http": "^10.3.0",
    "zod": "^3.25.0"${options.hasUI ? (options.uiFramework === 'nextjs' ? ',\n    "next": "^15.0.0",\n    "react": "^18.3.0",\n    "react-dom": "^18.3.0",\n    "@tanstack/react-query": "^5.0.0"' : ',\n    "react": "^18.3.0",\n    "react-dom": "^18.3.0",\n    "react-router-dom": "^6.26.0",\n    "@tanstack/react-query": "^5.0.0"') : ''}${options.pluginDependencies && Object.keys(options.pluginDependencies).length > 0 ? ',\n    ' + Object.entries(options.pluginDependencies).map(([pkg, ver]) => `"${pkg}": "${ver}"`).join(',\n    ') : ''}
  },
  "devDependencies": {
    "@types/compression": "^1.7.5",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/hpp": "^0.2.6",
    "@types/node": "^22.10.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "@vitest/coverage-v8": "^2.1.0",
    "@vitest/ui": "^2.1.0",
    "eslint": "^9.15.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.31.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.2.0",
    "pino-pretty": "^13.1.0",
    "prettier": "^3.4.0",
    "prisma": "^5.22.0",
    "rimraf": "^6.0.0",
    "supertest": "^7.0.0",
    "tsc-alias": "^1.8.16",
    "tsx": "^4.20.0",
    "typescript": "^5.9.0",
    "vitest": "^2.1.0"${options.hasUI ? (options.uiFramework === 'nextjs' ? ',\n    "@types/react": "^18.3.0",\n    "@types/react-dom": "^18.3.0",\n    "concurrently": "^9.0.0",\n    "tailwindcss": "^3.4.0",\n    "autoprefixer": "^10.4.0",\n    "postcss": "^8.4.0",\n    "@testing-library/react": "^16.0.0",\n    "@testing-library/jest-dom": "^6.0.0"' : ',\n    "@types/react": "^18.3.0",\n    "@types/react-dom": "^18.3.0",\n    "@vitejs/plugin-react": "^4.3.0",\n    "concurrently": "^9.0.0",\n    "vite": "^5.4.0",\n    "tailwindcss": "^3.4.0",\n    "autoprefixer": "^10.4.0",\n    "postcss": "^8.4.0",\n    "@testing-library/react": "^16.0.0",\n    "@testing-library/jest-dom": "^6.0.0"') : ''}${options.pluginDevDependencies && Object.keys(options.pluginDevDependencies).length > 0 ? ',\n    ' + Object.entries(options.pluginDevDependencies).map(([pkg, ver]) => `"${pkg}": "${ver}"`).join(',\n    ') : ''}
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  },
  "_generatedBy": "ssot-codegen standalone generator"
}
`

export const tsconfigTemplate = (projectName: string, hasUI?: boolean, uiFramework?: 'vite' | 'nextjs') => {
  const isNextjs = hasUI && uiFramework === 'nextjs'
  const isVite = hasUI && uiFramework === 'vite'
  
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"${hasUI ? ', "DOM", "DOM.Iterable"' : ''}],
    "rootDir": ".",
    "outDir": "./dist",
    "jsx": "${hasUI ? (isNextjs ? 'preserve' : 'react-jsx') : 'react-jsx'}",
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
      "@/*": ["./src/*"${hasUI ? (isNextjs ? ',\n      "@/components/*": ["./components/*"],\n      "@/app/*": ["./app/*"]' : ',\n      "@/components/*": ["./src/components/*"]') : ''}]
    }${isNextjs ? ',\n    "plugins": [\n      {\n        "name": "next"\n      }\n    ]' : ''}
  },
  "include": ["src/**/*"${hasUI ? (isNextjs ? ', "app/**/*", "components/**/*"' : ', "src/**/*", "index.html"') : ''}],
  "exclude": ["node_modules", "dist", "src/sdk/**/*"${hasUI ? (isNextjs ? ', ".next"' : ', "dist-frontend", "src/main.tsx", "src/App.tsx", "src/**/*.tsx"') : ''}]
}
`
}

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
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Load .env from multiple possible locations (workspace-first)
 * This allows generated projects to share a workspace .env file
 */
function loadEnvironment() {
  const envPaths = [
    path.join(__dirname, '../.env'),                    // Project root
    path.join(__dirname, '../../.env'),                 // Parent (workspace root)
    path.join(__dirname, '../../../.env'),              // Grandparent
  ]

  let envLoaded = false
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      loadEnv({ path: envPath, override: false })
      console.log(\`✅ Loaded environment from: \${path.relative(process.cwd(), envPath)}\`)
      envLoaded = true
      break
    }
  }

  if (!envLoaded) {
    console.warn('⚠️  No .env file found in project or workspace root')
    console.warn('💡 Create .env in workspace root or run: cp .env.example .env')
    loadEnv() // Try default locations
  }
}

// Load environment on import
loadEnvironment()

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
  console.error('❌ DATABASE_URL is required')
  console.error('💡 Create a .env file in workspace root with your database connection')
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

/**
 * Convert PascalCase to camelCase for variable names
 */
import { toKebabCase, pluralize } from '@/utils/naming.js'

const toCamelCase = (str: string): string => {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

export const appTemplate = (models: string[], serviceNames?: string[], hasPlugins?: boolean) => {
  const routeImports = models
    .map(m => `import { ${toCamelCase(m)}Router } from './routes/${toKebabCase(m)}/index.js'`)
    .join('\n')
  
  // Import integration helper for consistent path generation
  const routeRegistrations = models
    .map(m => {
      const modelKebab = toKebabCase(m)
      const modelPlural = pluralize(modelKebab)
      return `  app.use(\`\${config.api.prefix}/${modelPlural}\`, ${toCamelCase(m)}Router)`
    })
    .join('\n')
  
  // Add service route imports
  const serviceImports = serviceNames && serviceNames.length > 0
    ? serviceNames
        .map(s => `import { ${toCamelCase(s.replace(/-/g, ''))}Router } from './routes/${s}/index.js'`)
        .join('\n')
    : ''
  
  // Add service route registrations
  const serviceRegistrations = serviceNames && serviceNames.length > 0
    ? serviceNames
        .map(s => `  app.use(\`\${config.api.prefix}/${s}\`, ${toCamelCase(s.replace(/-/g, ''))}Router)`)
        .join('\n')
    : ''
  
  // Add plugin route imports
  const pluginImports = hasPlugins
    ? `import { usageRouter } from './monitoring/routes/usage.routes.js'
import { checklistRouter } from './checklist/checklist.api.js'`
    : ''
  
  // Add plugin route registrations
  const pluginRegistrations = hasPlugins
    ? `  app.use(\`\${config.api.prefix}/usage\`, usageRouter)
  app.use(\`\${config.api.prefix}/checklist\`, checklistRouter)`
    : ''

  return `import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'express-async-errors'
import config from './config.js'
import { errorHandler, notFoundHandler } from './middleware.js'
import { httpLogger, logger } from './logger.js'

// CORS configuration with environment-aware defaults
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' 
    ? true  // Allow all origins in development (Express accepts boolean)
    : process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Current-Page']
}
${routeImports}${serviceImports ? '\n' + serviceImports : ''}${pluginImports ? '\n' + pluginImports : ''}

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
  app.use(cors(corsOptions))
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

  // API Routes (CRUD)
${routeRegistrations}
${serviceRegistrations ? '\n  // Service Routes\n' + serviceRegistrations : ''}
${pluginRegistrations ? '\n  // Plugin Routes\n' + pluginRegistrations : ''}

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
   ${options.hasUI ? 'This starts both the backend API server and Next.js frontend concurrently.\n\n   - Backend API: http://localhost:3000\n   - Frontend UI: http://localhost:3001' : ''}

6. **Access the API:**
   - Health check: http://localhost:3000/health
   - API endpoints: http://localhost:3000/api/*${options.hasUI ? '\n\n7. **Access the UI:**\n   - Frontend: http://localhost:3001\n   - Browse CRUD pages for all models' : ''}

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
├── src/              # All code here
│   ├── app.ts        # Express app configuration
│   ├── server.ts     # Server entry point
│   ├── config.ts     # Configuration
│   ├── db.ts         # Database client
│   ├── logger.ts     # Logging setup
│   ├── middleware.ts # Error handlers
│   ├── contracts/    # Generated DTOs
│   ├── services/     # Generated services
│   ├── controllers/  # Generated controllers
│   ├── routes/       # Generated routes
│   └── sdk/          # TypeScript SDK + React hooks
├── tests/            # Self-validation tests
│   ├── self-validation.test.ts
│   └── setup.ts
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

export const eslintConfigTemplate = () => `import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        node: true,
        es2022: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  prettierConfig,
];
`

export const prettierConfigTemplate = () => `{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
`

export const huskyPreCommitTemplate = () => `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm run precommit
`

export const nextConfigTemplate = () => `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy API requests to Express backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/:path*',
      },
    ]
  },
  // Enable TypeScript path aliases
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
`

export const nextLayoutTemplate = () => `import { ExpressionProvider } from '@/components/ssot'
import './globals.css'

export const metadata = {
  title: 'Generated App',
  description: 'Generated by SSOT Codegen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ExpressionProvider>
          {children}
        </ExpressionProvider>
      </body>
    </html>
  )
}
`

export const tailwindConfigTemplate = () => `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`

export const postcssConfigTemplate = () => `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`

export const globalsCssTemplate = () => `@tailwind base;
@tailwind components;
@tailwind utilities;
`

export const viteConfigTemplate = () => `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist-frontend',
  },
})
`

export const viteIndexHtmlTemplate = () => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

export const viteMainTemplate = () => `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
`

export const viteAppTemplate = () => `import { Routes, Route } from 'react-router-dom'
import { ExpressionProvider } from '@/components/ssot'

function App() {
  return (
    <ExpressionProvider>
      <Routes>
        <Route path="/" element={<div className="p-6"><h1 className="text-2xl font-bold">Welcome</h1></div>} />
        {/* Routes will be added by page generators */}
      </Routes>
    </ExpressionProvider>
  )
}

export default App
`

export const vitestConfigTemplate = () => `import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
      ],
    },
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
`

