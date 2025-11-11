/**
 * V3 UI Generator
 * 
 * Generates JSON templates + mount point for V3 runtime.
 * NO CODE GENERATION - Just copies JSON files!
 */

import fs from 'node:fs'
import path from 'node:path'
import type { ProjectConfig } from './prompts.js'
import type { ParsedModel } from './ui-generator.js'

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
  
  console.log('  ✅ Generated mount point (app/[[...slug]]/page.tsx)')
  console.log('  ✅ Generated adapter configuration')
}

/**
 * Generate mount point (single file that renders entire app!)
 */
function generateMountPoint(config: ProjectConfig): string {
  return `/**
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
  auth: NextAuthAdapter, // TODO: Configure with NextAuth
  router: NextRouterAdapter,
  format: new IntlFormatAdapter('en-US')
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
  
  // Empty files for others
  fs.writeFileSync(path.join(templatesDir, 'mappings.json'), JSON.stringify({ version: '1.0.0', models: {}, fields: {} }, null, 2))
  fs.writeFileSync(path.join(templatesDir, 'data-contract.json'), JSON.stringify({ version: '1.0.0', models: {} }, null, 2))
  fs.writeFileSync(path.join(templatesDir, 'capabilities.json'), JSON.stringify({ version: '1.0.0', ui: [], sanitize: { policy: 'basic' }, security: { enforceGuards: true } }, null, 2))
  fs.writeFileSync(path.join(templatesDir, 'theme.json'), JSON.stringify({ version: '1.0.0', modes: ['light'], defaultMode: 'light', colors: { primary: {}, neutral: {} }, spacing: {}, typography: { fontFamilies: {}, fontSizes: {}, fontWeights: {}, lineHeights: {} }, radii: {} }, null, 2))
  fs.writeFileSync(path.join(templatesDir, 'i18n.json'), JSON.stringify({ version: '1.0.0', pluralRules: 'simple', defaultLocale: 'en', locales: [{ code: 'en', name: 'English', messages: {} }] }, null, 2))
  
  console.log('  ✅ Generated basic V3 template from schema')
}

