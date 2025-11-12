/**
 * CLI Command: Generate UI
 * 
 * Generate complete websites from Prisma schema + UI configuration
 */

import { Command } from 'commander'
import path from 'path'
import fs from 'fs/promises'
import { 
  generateUI,
  generateSite,
  loadSiteConfig,
  validateSiteConfig,
  getTemplate,
  listTemplates,
  parseDMMF
} from '@ssot-codegen/gen'
import type { UiConfig, SiteConfig } from '@ssot-codegen/gen'

export function registerUiCommand(program: Command) {
  program
    .command('ui')
    .description('Generate UI pages, layouts, and components')
    .option('-s, --schema <path>', 'Path to Prisma schema', './prisma/schema.prisma')
    .option('-c, --config <path>', 'Path to UI config file', './ssot.ui.config.ts')
    .option('-o, --output <path>', 'Output directory', './src')
    .option('-t, --template <name>', 'Use a template (blog, dashboard, ecommerce, landing)')
    .option('-m, --models <models>', 'Comma-separated list of models to generate (default: all)')
    .option('--list-templates', 'List available templates')
    .option('--dry-run', 'Preview generation without writing files')
    .option('--components-only', 'Generate component library only')
    .option('--pages-only', 'Generate pages only (no components)')
    .action(async (options) => {
      try {
        // List templates
        if (options.listTemplates) {
          const templates = listTemplates()
          console.log('\n📦 Available Templates:\n')
          templates.forEach((t: { name: string; description: string }) => {
            console.log(`  ${t.name.padEnd(12)} - ${t.description}`)
          })
          console.log('')
          return
        }

        console.log('🎨 SSOT UI Generator\n')

        // Load Prisma schema
        const schemaPath = path.resolve(process.cwd(), options.schema)
        console.log(`📄 Loading schema: ${schemaPath}`)
        
        let schemaContent: string
        try {
          schemaContent = await fs.readFile(schemaPath, 'utf-8')
        } catch (err: unknown) {
          console.error(`❌ Error: Could not read schema file at ${schemaPath}`)
          process.exit(1)
        }

        // Parse schema using DMMF parser  
        let schema: any
        try {
          // Try to import @prisma/internals
          let getDMMF: any
          try {
            const internals = await import('@prisma/internals')
            getDMMF = internals.getDMMF || (internals as any).default?.getDMMF
          } catch {
            console.error(`❌ Error: @prisma/internals not found. Install with: pnpm add @prisma/internals`)
            process.exit(1)
          }
          
          const dmmf = await getDMMF({ datamodel: schemaContent })
          schema = parseDMMF(dmmf)
        } catch (parseErr: unknown) {
          console.error(`❌ Error: Failed to parse schema`)
          console.error(parseErr)
          process.exit(1)
        }
        console.log(`✓ Parsed ${schema.models.length} models\n`)

        const outputDir = path.resolve(process.cwd(), options.output)

        // Template mode
        if (options.template) {
          console.log(`📦 Using template: ${options.template}`)
          const template = getTemplate(options.template)
          
          if (!template) {
            console.error(`❌ Error: Template "${options.template}" not found`)
            console.log('\nRun with --list-templates to see available templates')
            process.exit(1)
          }

          const files = generateSite(template, schema, outputDir)
          await writeFiles(files, outputDir, options.dryRun)
          
          console.log(`\n✅ Generated ${files.size} files from ${options.template} template`)
          return
        }

        // Config file mode
        const configPath = path.resolve(process.cwd(), options.config)
        let uiConfig: UiConfig | null = null
        
        try {
          const configExists = await fs.access(configPath).then(() => true).catch(() => false)
          
          if (configExists) {
            console.log(`⚙️  Loading UI config: ${configPath}`)
            // Dynamic import of config file
            const configModule = await import(configPath)
            uiConfig = configModule.default || configModule.uiConfig
            console.log('✓ Loaded UI configuration\n')
          } else {
            console.log('ℹ️  No UI config found, using auto-generation\n')
          }
        } catch (err) {
          console.warn(`⚠️  Could not load UI config, using auto-generation`)
        }

        // Site generation mode (if config has site structure)
        if (uiConfig && 'pages' in uiConfig && uiConfig.pages) {
          const siteConfig = uiConfigToSiteConfig(uiConfig)
          
          // Validate
          const validation = validateSiteConfig(siteConfig)
          if (!validation.valid) {
            console.error('❌ Configuration errors:')
            validation.errors.forEach(err => console.error(`  - ${err}`))
            process.exit(1)
          }

          const files = generateSite(siteConfig, schema, outputDir)
          await writeFiles(files, outputDir, options.dryRun)
          
          console.log(`\n✅ Generated ${files.size} files`)
          return
        }

        // Simple UI generation mode
        const models = options.models ? options.models.split(',') : undefined
        
        const result = generateUI(schema, {
          outputDir,
          generateComponents: !options.pagesOnly,
          generatePages: !options.componentsOnly,
          models
        })

        console.log(`\n✅ UI Generation Complete:`)
        console.log(`   - Components: ${result.componentsGenerated}`)
        console.log(`   - Pages: ${result.pagesGenerated}`)
        console.log(`   - Total files: ${result.files.size}`)

        if (!options.dryRun) {
          await writeFiles(result.files, outputDir, false)
          console.log(`\n📁 Output: ${outputDir}`)
        }

      } catch (error) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : error)
        process.exit(1)
      }
    })
}

/**
 * Write generated files to disk
 */
async function writeFiles(
  files: Map<string, string>,
  baseDir: string,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log('\n🔍 Dry run - files that would be generated:')
    Array.from(files.keys()).forEach(filepath => {
      console.log(`   - ${filepath}`)
    })
    return
  }

  for (const [filepath, content] of files) {
    const fullPath = path.join(baseDir, filepath)
    const dir = path.dirname(fullPath)

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true })

    // Write file
    await fs.writeFile(fullPath, content, 'utf-8')
  }
}

/**
 * Convert UiConfig to SiteConfig format
 */
function uiConfigToSiteConfig(uiConfig: UiConfig): SiteConfig {
  // Map navigation settings to site config format
  const navigation: any = {}
  
  if (uiConfig.navigation?.header) {
    navigation.header = {
      logo: uiConfig.navigation.header.logo,
      title: uiConfig.navigation.header.title,
      links: (uiConfig.navigation.header.links || []).map(link => ({
        label: link.label,
        href: link.href
      }))
    }
  }
  
  if (uiConfig.navigation?.sidebar) {
    navigation.sidebar = {
      sections: (uiConfig.navigation.sidebar.sections || []).map(section => ({
        title: section.title,
        links: section.links.map(link => ({
          label: link.label,
          href: link.href,
          icon: link.icon
        }))
      }))
    }
  }
  
  if (uiConfig.navigation?.footer) {
    navigation.footer = {
      sections: uiConfig.navigation.footer.sections || [],
      copyright: uiConfig.navigation.footer.copyright
    }
  }
  
  return {
    name: uiConfig.site?.name || 'SSOT App',
    version: '1.0.0',
    theme: {
      colors: uiConfig.theme?.colors,
      fonts: uiConfig.theme?.fonts,
      darkMode: uiConfig.theme?.darkMode
    },
    navigation: Object.keys(navigation).length > 0 ? navigation : undefined,
    pages: (uiConfig.pages || []).map((page: any) => ({
      path: page.path,
      spec: {
        layout: page.layout || 'custom',
        title: page.title,
        sections: page.sections || [],
        metadata: {
          requiresAuth: page.requiresAuth,
          roles: page.roles
        }
      }
    })),
    features: {
      auth: uiConfig.generation?.crudPages?.enabled,
      search: uiConfig.generation?.crudPages?.list?.features?.includes('search'),
      darkMode: uiConfig.theme?.darkMode
    }
  }
}

