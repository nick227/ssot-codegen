/**
 * Create SSOT App - Refactored
 * 
 * Thin orchestration layer that delegates all generation to @ssot-codegen/gen
 * Single responsibility: Project scaffolding and setup
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProjectConfig } from './prompts.js'
import { generateFromSchema } from '@ssot-codegen/gen'
import { generateAuthMiddleware } from './ui-generator-auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface ParsedModel {
  name: string
  nameLower: string
  namePlural: string
  idField: {
    name: string
    type: string
  }
  fields: Array<{
    name: string
    type: string
    isRelation: boolean
    isId?: boolean
  }>
}

/**
 * Create new SSOT project
 * Delegates all code generation to @ssot-codegen/gen
 */
export async function createProject(projectPath: string, config: ProjectConfig): Promise<void> {
  console.log(`\n📦 Creating project: ${config.projectName}`)
  
  // 1. Create project directory
  fs.mkdirSync(projectPath, { recursive: true })
  console.log('  ✅ Created project directory')
  
  // 2. Generate Prisma schema (from preset or custom)
  const schemaPath = path.join(projectPath, 'prisma', 'schema.prisma')
  fs.mkdirSync(path.dirname(schemaPath), { recursive: true })
  fs.writeFileSync(schemaPath, generatePrismaSchema(config), 'utf-8')
  console.log('  ✅ Generated Prisma schema')
  
  // 3. Generate package.json
  const packageJson = generatePackageJson(config)
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf-8'
  )
  console.log('  ✅ Generated package.json')
  
  // 4. Generate config files
  generateConfigFiles(projectPath, config)
  console.log('  ✅ Generated config files')
  
  // 5. DELEGATE to gen/ for all code generation
  if (config.generateAPI || config.generateUI) {
    console.log('\n🔨 Generating code...')
    
    await generateFromSchema({
      schemaPath,
      outputDir: path.join(projectPath, 'src'),
      framework: config.framework || 'express',
      standalone: false,
      projectName: config.projectName,
      generateUI: config.generateUI,
      uiFramework: config.generateUI ? 'nextjs' : undefined,
      plugins: config.plugins || []
    })
    
    console.log('  ✅ Generated API and UI via @ssot-codegen/gen')
  }
  
  // 6. Generate auth middleware (if UI)
  if (config.generateUI) {
    generateAuthMiddleware(projectPath)
    console.log('  ✅ Generated auth middleware')
  }
  
  // 7. Generate README
  fs.writeFileSync(
    path.join(projectPath, 'README.md'),
    generateReadme(config),
    'utf-8'
  )
  console.log('  ✅ Generated README')
  
  console.log(`\n✅ Project created successfully!\n`)
  console.log(`📂 ${projectPath}`)
  console.log(`\nNext steps:`)
  console.log(`  cd ${config.projectName}`)
  console.log(`  npm install`)
  console.log(`  npx prisma db push`)
  console.log(`  npm run dev`)
}

/**
 * Generate Prisma schema from preset or custom
 */
function generatePrismaSchema(config: ProjectConfig): string {
  // If preset selected, load from presets/
  if (config.preset) {
    const presetPath = path.join(__dirname, 'presets', `${config.preset}-preset.ts`)
    if (fs.existsSync(presetPath)) {
      // Import and get schema from preset
      // For now, use example schema
      const examplePath = path.join(__dirname, '../examples', `${config.preset}-schema.prisma`)
      if (fs.existsSync(examplePath)) {
        return fs.readFileSync(examplePath, 'utf-8')
      }
    }
  }
  
  // Default minimal schema
  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
`
}

/**
 * Generate package.json
 */
function generatePackageJson(config: ProjectConfig): any {
  const scripts: Record<string, string> = {
    'dev': 'npm-run-all --parallel dev:api dev:ui',
    'build': 'npm-run-all build:api build:ui',
    'start': 'node src/index.js'
  }
  
  if (config.generateAPI) {
    scripts['dev:api'] = 'tsx watch src/index.ts'
    scripts['build:api'] = 'tsc'
  }
  
  if (config.generateUI) {
    scripts['dev:ui'] = 'next dev'
    scripts['build:ui'] = 'next build'
    scripts['start:ui'] = 'next start'
  }
  
  scripts['db:push'] = 'prisma db push'
  scripts['db:studio'] = 'prisma studio'
  scripts['db:migrate'] = 'prisma migrate dev'
  
  return {
    name: config.projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts,
    dependencies: {
      '@prisma/client': '^5.0.0',
      ...(config.generateAPI ? {
        'express': '^4.18.0',
        'zod': '^3.22.0'
      } : {}),
      ...(config.generateUI ? {
        'next': '^14.1.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        '@ssot-ui/expressions': 'workspace:*'
      } : {})
    },
    devDependencies: {
      'prisma': '^5.0.0',
      'typescript': '^5.3.0',
      'tsx': '^4.7.0',
      'npm-run-all': '^4.1.5',
      ...(config.generateUI ? {
        '@types/react': '^18.2.0',
        'tailwindcss': '^3.4.0',
        'autoprefixer': '^10.4.0',
        'postcss': '^8.4.0'
      } : {})
    }
  }
}

/**
 * Generate config files
 */
function generateConfigFiles(projectPath: string, config: ProjectConfig): void {
  // .gitignore
  fs.writeFileSync(
    path.join(projectPath, '.gitignore'),
    `node_modules/
dist/
.env
.env.local
*.log
.next/
`,
    'utf-8'
  )
  
  // .env
  fs.writeFileSync(
    path.join(projectPath, '.env'),
    `DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
`,
    'utf-8'
  )
  
  // tsconfig.json (if API)
  if (config.generateAPI) {
    fs.writeFileSync(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'bundler',
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          resolveJsonModule: true,
          outDir: './dist',
          rootDir: './src',
          paths: { '@/*': ['./src/*'] }
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
      }, null, 2),
      'utf-8'
    )
  }
}

/**
 * Generate README
 */
function generateReadme(config: ProjectConfig): string {
  return `# ${config.projectName}

Generated by SSOT CodeGen

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Setup database
npx prisma db push

# Start development
npm run dev
\`\`\`

${config.generateAPI ? `
## API
- REST API running on http://localhost:3000
- OpenAPI docs at http://localhost:3000/api/docs
` : ''}

${config.generateUI ? `
## UI
- Admin panel at http://localhost:3001/admin
- Uses smart components with expression system
` : ''}

## Generated Features
${config.generateAPI ? '- ✅ RESTful API' : ''}
${config.generateUI ? '- ✅ React UI (smart components)' : ''}
- ✅ Type-safe client SDK
- ✅ RLS security
- ✅ Expression system
- ✅ OpenAPI documentation

## Customization

All generated code is marked with "✨ SAFE TO EDIT" - your changes will be preserved on regeneration.

See \`UI_README.md\` for UI customization options.
`
}

