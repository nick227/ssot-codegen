/**
 * Validator Generator V2 - Class-based, testable implementation
 * 
 * Generates Zod validation schemas from Prisma models
 */

import { BaseGenerator } from './base-generator.js'
import type { GeneratorOutput } from './generator-interface.js'
import { ObjectBuilder } from './utils/template-builder.js'
import { BarrelBuilder } from './utils/barrel-builder.js'
import { mapPrismaToZod } from '../type-mapper.js'

export class ValidatorGenerator extends BaseGenerator {
  /**
   * Generate all validators for this model
   */
  generate(): GeneratorOutput {
    const files = new Map<string, string>([
      [`${this.modelLower}.create.zod.ts`, this.generateCreate()],
      [`${this.modelLower}.update.zod.ts`, this.generateUpdate()],
      [`${this.modelLower}.query.zod.ts`, this.generateQuery()]
    ])
    
    return {
      files,
      imports: this.getImports(),
      exports: this.getExports(),
      metadata: {
        fileCount: files.size,
        lineCount: Array.from(files.values()).reduce((sum, c) => sum + c.split('\n').length, 0)
      }
    }
  }
  
  /**
   * Generate Create validator
   */
  generateCreate(): string {
    const fields = this.buildZodFields(this.model.createFields)
    
    return this.createTemplate()
      .imports(['import { z } from \'zod\''])
      .block(this.buildZodSchema(`${this.modelName}CreateSchema`, fields))
      .block(`export type ${this.modelName}CreateInput = z.infer<typeof ${this.modelName}CreateSchema>`)
      .buildWithNewline()
  }
  
  /**
   * Generate Update validator (partial)
   */
  generateUpdate(): string {
    return this.createTemplate()
      .imports([
        'import { z } from \'zod\'',
        `import { ${this.modelName}CreateSchema } from './${this.modelLower}.create.zod.js'`
      ])
      .block(`export const ${this.modelName}UpdateSchema = ${this.modelName}CreateSchema.partial()`)
      .block(`export type ${this.modelName}UpdateInput = z.infer<typeof ${this.modelName}UpdateSchema>`)
      .buildWithNewline()
  }
  
  /**
   * Generate Query validator
   */
  generateQuery(): string {
    const scalarFields = this.model.scalarFields
      .map(f => `    ${f.name}: z.enum(['asc', 'desc']).optional()`)
    
    const relationFields = this.model.relationFields
      .map(f => `    ${f.name}: z.record(z.enum(['asc', 'desc'])).optional()`)
    
    const orderByFields = [...scalarFields, ...relationFields]
    const orderBySchema = orderByFields.length > 0 
      ? `z.object({\n${orderByFields.join(',\n')}\n  }).optional()`
      : 'z.record(z.enum([\'asc\', \'desc\'])).optional()'
    
    const includeFields = this.model.relationFields
      .map(f => `    ${f.name}: z.boolean().optional()`)
    const includeSchema = includeFields.length > 0
      ? `z.object({\n${includeFields.join(',\n')}\n  }).optional()`
      : 'z.record(z.boolean()).optional()'
    
    const selectFields = this.model.fields
      .map(f => `    ${f.name}: z.boolean().optional()`)
    const selectSchema = `z.object({\n${selectFields.join(',\n')}\n  }).optional()`
    
    return this.createTemplate()
      .imports(['import { z } from \'zod\''])
      .block(`export const ${this.modelName}QuerySchema = z.object({
  skip: z.coerce.number().min(0).optional(),
  take: z.coerce.number().min(1).max(100).optional().default(20),
  orderBy: ${orderBySchema},
  where: z.object({
    // Filterable fields based on model
  }).optional(),
  include: ${includeSchema},
  select: ${selectSchema}
})`)
      .block(`export type ${this.modelName}QueryInput = z.infer<typeof ${this.modelName}QuerySchema>`)
      .buildWithNewline()
  }
  
  /**
   * Build Zod field definitions
   */
  private buildZodFields(fields: typeof this.model.createFields): string[] {
    return fields.map(field => {
      const zodSchema = mapPrismaToZod(field)
      return `  ${field.name}: ${zodSchema}`
    })
  }
  
  /**
   * Build Zod schema object
   */
  private buildZodSchema(schemaName: string, fields: string[]): string {
    return `export const ${schemaName} = z.object({
${fields.join(',\n')}
})`
  }
  
  /**
   * Get imports
   */
  getImports(): string[] {
    return ['import { z } from \'zod\'']
  }
  
  /**
   * Get exports
   */
  getExports(): string[] {
    return [
      `${this.modelName}CreateSchema`,
      `${this.modelName}CreateInput`,
      `${this.modelName}UpdateSchema`,
      `${this.modelName}UpdateInput`,
      `${this.modelName}QuerySchema`,
      `${this.modelName}QueryInput`
    ]
  }
  
  /**
   * Generate barrel
   */
  generateBarrel(): string {
    return BarrelBuilder.modelBarrel(this.modelLower, [
      'create.zod',
      'update.zod',
      'query.zod'
    ])
  }
}

