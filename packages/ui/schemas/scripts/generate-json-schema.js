/**
 * Generate JSON Schema from Zod schemas
 * 
 * Exports JSON Schema files for IDE autocomplete and documentation.
 */

import fs from 'node:fs'
import path from 'node:path'
import { zodToJsonSchema } from 'zod-to-json-schema'

// Import Zod schemas
import {
  TemplateSchema,
  PageSchema,
  ListPageSchema,
  DetailPageSchema,
  FormPageSchema
} from '../dist/schemas/template.js'

import { DataContractSchema } from '../dist/schemas/data-contract.js'
import { CapabilitiesSchema } from '../dist/schemas/capabilities.js'
import { MappingsSchema } from '../dist/schemas/mappings.js'
import { ModelsSchema } from '../dist/schemas/models.js'
import { ThemeSchema } from '../dist/schemas/theme.js'
import { I18nSchema } from '../dist/schemas/i18n.js'

const outputDir = path.resolve(process.cwd(), 'json-schema')

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true })

// Generate schemas
const schemas = {
  'template.json': TemplateSchema,
  'page.json': PageSchema,
  'list-page.json': ListPageSchema,
  'detail-page.json': DetailPageSchema,
  'form-page.json': FormPageSchema,
  'data-contract.json': DataContractSchema,
  'capabilities.json': CapabilitiesSchema,
  'mappings.json': MappingsSchema,
  'models.json': ModelsSchema,
  'theme.json': ThemeSchema,
  'i18n.json': I18nSchema
}

console.log('Generating JSON Schemas...\n')

for (const [filename, zodSchema] of Object.entries(schemas)) {
  const jsonSchema = zodToJsonSchema(zodSchema, {
    name: filename.replace('.json', ''),
    $refStrategy: 'none'
  })
  
  const outputPath = path.join(outputDir, filename)
  fs.writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2))
  
  console.log(`✅ Generated: ${filename}`)
}

// Generate index file
const indexContent = `# SSOT UI JSON Schemas

These JSON Schema files provide IDE autocomplete and validation for SSOT UI template files.

## Usage in VS Code

Add to your JSON file:

\`\`\`json
{
  "$schema": "https://ssot-ui.dev/schemas/v3/template.json",
  "version": "1.0.0",
  ...
}
\`\`\`

## Available Schemas

${Object.keys(schemas).map(s => `- \`${s}\``).join('\n')}

## Local Development

Point to local schema files:

\`\`\`json
{
  "$schema": "./node_modules/@ssot-ui/schemas/json-schema/template.json"
}
\`\`\`
`

fs.writeFileSync(path.join(outputDir, 'README.md'), indexContent)

console.log('\n✅ All JSON Schemas generated successfully!')
console.log(`\n📁 Output: ${outputDir}`)

