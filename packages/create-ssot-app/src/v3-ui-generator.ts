/**
 * V3 UI Generator
 * 
 * Generates JSON templates + mount point for V3 runtime.
 * NO CODE GENERATION - Just copies JSON files!
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProjectConfig } from './prompts.js'
import type { ParsedModel } from './ui-generator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Generate V3 UI (JSON templates + mount point)
 */
export async function generateV3UI(
  projectPath: string,
  config: ProjectConfig,
  models: ParsedModel[]
): Promise<void> {
  console.log('  Mode: JSON Runtime (V3) - Zero code generation!')
  
  // Create templates directory
  const templatesDir = path.join(projectPath, 'templates')
  fs.mkdirSync(templatesDir, { recursive: true })
  
  // Copy template JSON files based on selection
  const templateName = config.uiTemplate || 'blog'
  const sourceTemplateDir = path.resolve(__dirname, '../../examples/json-templates', templateName)
  
  if (fs.existsSync(sourceTemplateDir)) {
    // Copy all JSON files from example
    const files = fs.readdirSync(sourceTemplateDir)
    for (const file of files) {
      if (file.endsWith('.json')) {
        const source = path.join(sourceTemplateDir, file)
        const dest = path.join(templatesDir, file)
        fs.copyFileSync(source, dest)
      }
    }
    console.log(`  ✅ Copied ${templateName} JSON template`)
  } else {
    // Fallback: generate basic template
    generateBasicV3Template(templatesDir, models)
  }
  
  // Generate mount point (app/[[...slug]]/page.tsx)
  const appDir = path.join(projectPath, 'app', '[[...slug]]')
  fs.mkdirSync(appDir, { recursive: true })
  
  fs.writeFileSync(
    path.join(appDir, 'page.tsx'),
    generateMountPoint(config)
  )
  
  // Generate adapter configuration
  const adaptersDir = path.join(projectPath, 'lib', 'adapters')
  fs.mkdirSync(adaptersDir, { recursive: true })
  
  fs.writeFileSync(
    path.join(adaptersDir, 'index.ts'),
    generateAdapterConfig(config)
  )
  
  // Add README for V3
  fs.writeFileSync(
    path.join(templatesDir, 'README.md'),
    generateV3README(config)
  )
  
  // Generate root layout (REQUIRED by Next.js App Router)
  fs.writeFileSync(
    path.join(projectPath, 'app', 'layout.tsx'),
    generateRootLayout(config)
  )
  
  // Generate next.config.js
  fs.writeFileSync(
    path.join(projectPath, 'next.config.js'),
    generateNextConfig()
  )
  
  // Generate global styles
  fs.writeFileSync(
    path.join(projectPath, 'app', 'globals.css'),
    generateGlobalStyles()
  )
  
  // Generate tailwind.config.js
  fs.writeFileSync(
    path.join(projectPath, 'tailwind.config.js'),
    generateTailwindConfig()
  )
  
  // Generate postcss.config.js (REQUIRED for Tailwind)
  fs.writeFileSync(
    path.join(projectPath, 'postcss.config.js'),
    generatePostCSSConfig()
  )
  
  // Generate .env.local for Next.js
  fs.writeFileSync(
    path.join(projectPath, '.env.local'),
    generateEnvLocal(config)
  )
  
  // Generate API integration route (optional, for backend integration)
  const apiDir = path.join(projectPath, 'app', 'api', 'data')
  fs.mkdirSync(apiDir, { recursive: true })
  fs.writeFileSync(
    path.join(apiDir, 'route.ts'),
    generateDataAPIRoute()
  )
  
  console.log('  ✅ Generated mount point (app/[[...slug]]/page.tsx)')
  console.log('  ✅ Generated root layout (app/layout.tsx)')
  console.log('  ✅ Generated Next.js configuration')
  console.log('  ✅ Generated PostCSS + Tailwind config')
  console.log('  ✅ Generated environment files')
  console.log('  ✅ Generated API integration routes')
  console.log('  ✅ Generated adapter configuration')
}

/**
 * Generate mount point (single file that renders entire app!)
 */
function generateMountPoint(config: ProjectConfig): string {
  return `'use client'

/**
 * V3 Runtime Mount Point
 * 
 * This is the ONLY page file needed!
 * Entire application defined in JSON at /templates
 */

import { TemplateRuntime } from '@ssot-ui/runtime'
import { adapters } from '@/lib/adapters'

// Load all JSON configuration
import template from '@/templates/template.json'
import dataContract from '@/templates/data-contract.json'
import capabilities from '@/templates/capabilities.json'
import mappings from '@/templates/mappings.json'
import models from '@/templates/models.json'
import theme from '@/templates/theme.json'
import i18n from '@/templates/i18n.json'

export default function Page({ params }: { params: { slug: string[] } }) {
  return (
    <TemplateRuntime
      config={{
        template,
        dataContract,
        capabilities,
        mappings,
        models,
        theme,
        i18n
      }}
      route={params.slug}
      adapters={adapters}
      options={{
        strictMode: true,
        showDevOverlay: process.env.NODE_ENV === 'development'
      }}
    />
  )
}
`
}

/**
 * Generate adapter configuration
 */
function generateAdapterConfig(config: ProjectConfig): string {
  return `/**
 * Adapter Configuration
 * 
 * Configures all adapters for the V3 runtime.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaDataAdapter } from '@ssot-ui/adapter-data-prisma'
import { InternalUIAdapter } from '@ssot-ui/adapter-ui-internal'
import { NextAuthAdapter } from '@ssot-ui/adapter-auth-nextauth'
import { NextRouterAdapter } from '@ssot-ui/adapter-router-next'
import { IntlFormatAdapter } from '@ssot-ui/adapter-format-intl'
import dataContract from '@/templates/data-contract.json'

const prisma = new PrismaClient()

export const adapters = {
  data: new PrismaDataAdapter(prisma, dataContract as any),
  ui: InternalUIAdapter,
  auth: NextAuthAdapter,
  router: NextRouterAdapter,
  format: new IntlFormatAdapter('en-US')
}

// NOTE: Configure NextAuth in app/api/auth/[...nextauth]/route.ts
// See: https://next-auth.js.org/configuration/initialization
`
}

/**
 * Generate root layout (REQUIRED by Next.js App Router)
 */
function generateRootLayout(config: ProjectConfig): string {
  return `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${config.projectName}',
  description: 'Built with SSOT CodeGen V3 JSON Runtime',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`
}

/**
 * Generate next.config.js
 */
function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ssot-ui/runtime',
    '@ssot-ui/adapter-data-prisma',
    '@ssot-ui/adapter-ui-internal',
    '@ssot-ui/adapter-auth-nextauth',
    '@ssot-ui/adapter-router-next',
    '@ssot-ui/adapter-format-intl'
  ],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
}

module.exports = nextConfig
`
}

/**
 * Generate global styles
 */
function generateGlobalStyles(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Global styles for V3 runtime */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}
`
}

/**
 * Generate tailwind.config.js
 */
function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './node_modules/@ssot-ui/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
}

/**
 * Generate PostCSS config (REQUIRED for Tailwind)
 */
function generatePostCSSConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
}

/**
 * Generate .env.local (Next.js convention)
 */
function generateEnvLocal(config: ProjectConfig): string {
  return `# Next.js Environment Variables (Local Development)
# This file is NOT committed to git

# Database (use same as .env for local dev)
DATABASE_URL="file:./dev.db"

# Next.js
NEXT_PUBLIC_APP_NAME="${config.projectName}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# API Server (if running separately)
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Development
NODE_ENV="development"
`
}

/**
 * Generate API integration route
 */
function generateDataAPIRoute(): string {
  return `/**
 * Data API Route
 * 
 * Optional: Proxy requests to separate API server
 * or handle data operations directly in Next.js
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const model = searchParams.get('model')
  
  // TODO: Either proxy to Express API or handle directly with Prisma
  
  return NextResponse.json({
    message: 'API route ready',
    model
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // TODO: Handle create/update operations
  
  return NextResponse.json({
    message: 'Operation successful',
    data: body
  })
}
`
}

/**
 * Generate V3 README
 */
function generateV3README(config: ProjectConfig): string {
  return `# ${config.projectName} - V3 JSON Runtime

**UI Mode**: JSON Runtime (V3)  
**Code Generated**: ZERO!  
**Template**: ${config.uiTemplate || 'blog'}

---

## 📁 **Structure**

\`\`\`
templates/          ← All UI configuration (JSON only!)
├── template.json          # Pages, components, routes
├── data-contract.json     # Whitelists for filters/sorts
├── capabilities.json      # Security policies
├── mappings.json          # Field aliases
├── models.json            # Auto-generated from Prisma
├── theme.json             # Design tokens
└── i18n.json              # Translations

app/[[...slug]]/    ← Single mount point
└── page.tsx               # 40 lines - renders everything

lib/adapters/       ← Adapter configuration
└── index.ts               # 20 lines - connects to Prisma, UI, etc.
\`\`\`

**Total project code**: ~60 lines  
**Everything else**: JSON configuration

---

## 🔄 **Workflow**

### **Edit UI**
Just edit JSON files in \`templates/\`!

\`\`\`bash
# Edit template
code templates/template.json

# Changes apply instantly (hot reload)
npm run dev
\`\`\`

### **Generate models.json**
Auto-updates when Prisma schema changes:

\`\`\`bash
npm run gen:models:watch
\`\`\`

### **Validate**
\`\`\`bash
npm run validate:templates
\`\`\`

## 🖥️ **Development**

### **Dual Server Setup**
V3 projects run TWO servers:

1. **Next.js (UI)**: \`npm run dev\` → http://localhost:3000
2. **Express (API)**: \`npm run dev:api\` → http://localhost:3001

### **Single Server (Alternative)**
Use Next.js API routes for everything:
- Move backend logic to \`app/api/\`
- Remove Express server
- Simpler deployment

---

## 🎨 **Hot Reload**

Edit any JSON file → See changes **instantly** (no rebuild!)

---

## 📚 **Learn More**

- Architecture: docs/TEMPLATE_FACTORY_GUIDE.md
- Adapters: Check each @ssot-ui/adapter-* package
- Examples: examples/json-templates/
`
}

/**
 * Generate basic V3 template (fallback)
 */
function generateBasicV3Template(templatesDir: string, models: ParsedModel[]): void {
  // Validate models exist
  if (models.length === 0) {
    throw new Error('Cannot generate V3 template: No models found in Prisma schema')
  }
  
  // Basic template.json
  fs.writeFileSync(
    path.join(templatesDir, 'template.json'),
    JSON.stringify({
      version: '1.0.0',
      runtimeVersion: '^3.0.0',
      name: 'basic',
      pages: models.flatMap(model => [
        {
          type: 'list',
          route: `/${model.namePlural}`,
          runtime: 'server',
          model: model.nameLower,
          title: `All ${model.name}s`
        },
        {
          type: 'detail',
          route: `/${model.namePlural}/[id]`,
          runtime: 'server',
          model: model.nameLower,
          title: model.name,
          fields: model.fields
            .filter(f => !f.isRelation)
            .map(f => ({ field: f.name, label: f.name, format: 'text' }))
        }
      ])
    }, null, 2)
  )
  
  // models.json (from Prisma schema)
  fs.writeFileSync(
    path.join(templatesDir, 'models.json'),
    JSON.stringify({
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      schemaPath: './prisma/schema.prisma',
      models: models.map(m => ({
        name: m.name,
        fields: m.fields.map(f => ({
          name: f.name,
          type: f.type,
          isRequired: true,
          isList: false,
          isRelation: f.isRelation
        })),
        idFields: ['id'],
        uniqueFields: [],
        documentation: undefined
      })),
      enums: []
    }, null, 2)
  )
  
  // Empty files for others
  fs.writeFileSync(path.join(templatesDir, 'mappings.json'), JSON.stringify({ version: '1.0.0', models: {}, fields: {} }, null, 2))
  fs.writeFileSync(path.join(templatesDir, 'data-contract.json'), JSON.stringify({ version: '1.0.0', models: {} }, null, 2))
  fs.writeFileSync(path.join(templatesDir, 'capabilities.json'), JSON.stringify({ version: '1.0.0', ui: [], sanitize: { policy: 'basic' }, security: { enforceGuards: true } }, null, 2))
  fs.writeFileSync(path.join(templatesDir, 'theme.json'), JSON.stringify({ version: '1.0.0', modes: ['light'], defaultMode: 'light', colors: { primary: {}, neutral: {} }, spacing: {}, typography: { fontFamilies: {}, fontSizes: {}, fontWeights: {}, lineHeights: {} }, radii: {} }, null, 2))
  fs.writeFileSync(path.join(templatesDir, 'i18n.json'), JSON.stringify({ version: '1.0.0', pluralRules: 'simple', defaultLocale: 'en', locales: [{ code: 'en', name: 'English', messages: {} }] }, null, 2))
  
  console.log('  ✅ Generated basic V3 template from schema')
}

