/**
 * DTO Generator V2 - Class-based, testable implementation
 * 
 * Generates TypeScript DTOs from Prisma models
 * - CreateDTO (fields for insert)
 * - UpdateDTO (all optional for PATCH)
 * - ReadDTO (all fields from DB)
 * - QueryDTO (pagination, filtering, sorting)
 */

import type { ParsedField } from '../dmmf-parser.js'
import { BaseGenerator } from './base-generator.js'
import type { GeneratorOutput } from './generator-interface.js'
import { TemplateBuilder, InterfaceBuilder } from './utils/template-builder.js'
import { BarrelBuilder } from './utils/barrel-builder.js'
import { mapPrismaToTypeScript } from '../type-mapper.js'
import { isOptionalForCreate } from '../dmmf-parser.js'

export class DTOGenerator extends BaseGenerator {
  /**
   * Generate all DTOs for this model
   */
  generate(): GeneratorOutput {
    const files = new Map<string, string>([
      [`${this.modelLower}.create.dto.ts`, this.generateCreate()],
      [`${this.modelLower}.update.dto.ts`, this.generateUpdate()],
      [`${this.modelLower}.read.dto.ts`, this.generateRead()],
      [`${this.modelLower}.query.dto.ts`, this.generateQuery()]
    ])
    
    return {
      files,
      imports: this.getImports(),
      exports: this.getExports(),
      metadata: {
        fileCount: files.size,
        lineCount: Array.from(files.values()).reduce((sum, content) => sum + content.split('\n').length, 0)
      }
    }
  }
  
  /**
   * Generate CreateDTO
   */
  generateCreate(): string {
    const fields = this.buildFieldList(this.model.createFields, (field) => 
      isOptionalForCreate(field)
    )
    
    return this.createTemplate()
      .importString(this.buildEnumImports())
      .block(this.buildInterface(`${this.modelName}CreateDTO`, fields))
      .buildWithNewline()
  }
  
  /**
   * Generate UpdateDTO (all fields optional)
   */
  generateUpdate(): string {
    const fields = this.buildFieldList(this.model.updateFields, () => true)
    
    return this.createTemplate()
      .importString(this.buildEnumImports())
      .block(this.buildInterface(`${this.modelName}UpdateDTO`, fields))
      .buildWithNewline()
  }
  
  /**
   * Generate ReadDTO (all scalar fields)
   */
  generateRead(): string {
    const fields = this.buildFieldList(this.model.readFields, (field) => !field.isRequired)
    
    return this.createTemplate()
      .importString(this.buildEnumImports())
      .block(this.buildInterface(`${this.modelName}ReadDTO`, fields))
      .buildWithNewline()
  }
  
  /**
   * Generate QueryDTO (for filtering, pagination, sorting)
   */
  generateQuery(): string {
    const filterableFields = this.model.scalarFields.filter(f => 
      !f.isReadOnly && !f.isUpdatedAt
    )
    
    const whereFields = filterableFields.map(f => this.buildWhereField(f))
    
    return this.createTemplate()
      .importString(`import type { ${this.modelName}ReadDTO } from './${this.modelLower}.read.dto.js'`)
      .block(this.buildQueryInterface(whereFields))
      .block(this.buildListResponseInterface())
      .buildWithNewline()
  }
  
  /**
   * Build field list for interface
   */
  private buildFieldList(
    fields: ParsedField[],
    isOptional: (field: ParsedField) => boolean
  ): string[] {
    return fields.map(field => {
      const optional = isOptional(field) ? '?' : ''
      const type = mapPrismaToTypeScript(field)
      return `  ${field.name}${optional}: ${type}`
    })
  }
  
  /**
   * Build interface definition
   */
  private buildInterface(name: string, fields: string[]): string {
    return `export interface ${name} {
${fields.join('\n')}
}`
  }
  
  /**
   * Build where clause field for Query DTO
   */
  private buildWhereField(field: ParsedField): string {
    const baseType = mapPrismaToTypeScript(field)
    
    const FILTER_OPERATORS: Record<string, string[]> = {
      'String': ['equals', 'contains', 'startsWith', 'endsWith'],
      'Int': ['equals', 'gt', 'gte', 'lt', 'lte'],
      'Float': ['equals', 'gt', 'gte', 'lt', 'lte'],
      'DateTime': ['equals', 'gt', 'gte', 'lt', 'lte']
    }
    
    const operators = FILTER_OPERATORS[field.type]
    
    if (operators) {
      const ops = operators.map(op => `      ${op}?: ${baseType}`).join('\n')
      return `    ${field.name}?: {
${ops}
    }`
    } else {
      return `    ${field.name}?: ${baseType}`
    }
  }
  
  /**
   * Build orderBy type (object-based for Prisma compatibility)
   */
  private buildOrderByType(): string {
    const scalarFields = this.model.scalarFields
      .map(f => `    ${f.name}?: 'asc' | 'desc'`)
    
    const relationFields = this.model.relationFields
      .map(f => `    ${f.name}?: { [key: string]: 'asc' | 'desc' }`)
    
    const allFields = [...scalarFields, ...relationFields]
    
    if (allFields.length === 0) {
      return `Record<string, 'asc' | 'desc'>`
    }
    
    return `{
${allFields.join('\n')}
  }`
  }
  
  /**
   * Build include type for relation selection
   */
  private buildIncludeType(): string {
    if (this.model.relationFields.length === 0) {
      return 'Record<string, boolean>'
    }
    
    const relationFields = this.model.relationFields
      .map(f => `    ${f.name}?: boolean`)
    
    return `{
${relationFields.join('\n')}
  }`
  }
  
  /**
   * Build select type for field selection
   */
  private buildSelectType(): string {
    const allFields = this.model.fields
      .map(f => `    ${f.name}?: boolean`)
    
    return `{
${allFields.join('\n')}
  }`
  }
  
  /**
   * Build Query interface
   */
  private buildQueryInterface(whereFields: string[]): string {
    const orderByType = this.buildOrderByType()
    const includeType = this.buildIncludeType()
    const selectType = this.buildSelectType()
    
    return `export interface ${this.modelName}QueryDTO {
  skip?: number
  take?: number
  orderBy?: ${orderByType}
  where?: {
${whereFields.join('\n')}
  }
  include?: ${includeType}
  select?: ${selectType}
}`
  }
  
  /**
   * Build List Response interface
   */
  private buildListResponseInterface(): string {
    return `export interface ${this.modelName}ListResponse {
  data: ${this.modelName}ReadDTO[]
  meta: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
}`
  }
  
  /**
   * Build enum imports if needed
   */
  private buildEnumImports(): string {
    if (!this.metadata.hasEnums) return ''
    
    const enumTypes = this.metadata.getEnumTypes()
    return `import type { ${enumTypes.join(', ')} } from '@prisma/client'\n\n`
  }
  
  /**
   * Get all imports needed by DTOs
   */
  getImports(): string[] {
    const imports: string[] = []
    
    if (this.metadata.hasEnums) {
      imports.push(`import type { ${this.metadata.getEnumTypes().join(', ')} } from '@prisma/client'`)
    }
    
    return imports
  }
  
  /**
   * Get all exports provided by DTOs
   */
  getExports(): string[] {
    return [
      `${this.modelName}CreateDTO`,
      `${this.modelName}UpdateDTO`,
      `${this.modelName}ReadDTO`,
      `${this.modelName}QueryDTO`,
      `${this.modelName}ListResponse`
    ]
  }
  
  /**
   * Generate barrel file
   */
  generateBarrel(): string {
    return BarrelBuilder.modelBarrel(this.modelLower, [
      'create.dto',
      'update.dto',
      'read.dto',
      'query.dto'
    ])
  }
}

