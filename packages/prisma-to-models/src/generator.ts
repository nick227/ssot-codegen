/**
 * Prisma to models.json Generator
 * 
 * Parses Prisma schema and generates models.json for SSOT UI templates.
 * Auto-runs on schema changes.
 */

import pkg from '@prisma/internals'
const { getDMMF } = pkg
import type { Models, Model, Field, Enum } from '@ssot-ui/schemas'
import fs from 'node:fs'
import path from 'node:path'

// ============================================================================
// Generator
// ============================================================================

export async function generateModelsFromPrisma(
  schemaPath: string,
  outputPath?: string
): Promise<Models> {
  // Read schema file
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
  
  // Parse with Prisma internals
  const dmmf = await getDMMF({ datamodel: schemaContent })
  
  // Convert models
  const models: Model[] = dmmf.datamodel.models.map(model => ({
    name: model.name,
    fields: model.fields.map(field => ({
      name: field.name,
      type: field.type,
      isRequired: field.isRequired,
      isList: field.isList,
      isUnique: field.isUnique || false,
      isId: field.isId || false,
      isRelation: field.kind === 'object',
      relationTo: field.kind === 'object' ? field.type : undefined,
      relationName: field.relationName,
      default: field.default,
      documentation: field.documentation
    })),
    idFields: model.primaryKey?.fields ? [...model.primaryKey.fields] : undefined,
    uniqueFields: model.uniqueFields.map(uf => [...uf]),
    documentation: model.documentation
  }))
  
  // Convert enums
  const enums: Enum[] = dmmf.datamodel.enums.map(enumDef => ({
    name: enumDef.name,
    values: enumDef.values.map(v => v.name),
    documentation: enumDef.documentation
  }))
  
  // Build models.json
  const modelsJson: Models = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    schemaPath,
    models,
    enums
  }
  
  // Write to file if outputPath provided
  if (outputPath) {
    const dir = path.dirname(outputPath)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(outputPath, JSON.stringify(modelsJson, null, 2))
    console.log(`✅ Generated models.json: ${outputPath}`)
    console.log(`   Models: ${models.length}`)
    console.log(`   Enums: ${enums.length}`)
  }
  
  return modelsJson
}

/**
 * Watch Prisma schema for changes and regenerate
 */
export async function watchPrismaSchema(
  schemaPath: string,
  outputPath: string
): Promise<void> {
  console.log(`👀 Watching ${schemaPath} for changes...`)
  
  // Initial generation
  await generateModelsFromPrisma(schemaPath, outputPath)
  
  // Watch for changes
  fs.watchFile(schemaPath, { interval: 1000 }, async () => {
    console.log(`\n🔄 Schema changed, regenerating models.json...`)
    try {
      await generateModelsFromPrisma(schemaPath, outputPath)
    } catch (error) {
      console.error('❌ Generation failed:', (error as Error).message)
    }
  })
}

