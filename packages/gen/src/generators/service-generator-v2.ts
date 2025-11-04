/**
 * Service Generator V2 - Class-based, testable implementation
 * 
 * Generates service layer with Prisma CRUD operations
 */

import { BaseGenerator } from './base-generator.js'
import type { GeneratorOutput } from './generator-interface.js'
import { ObjectBuilder } from './utils/template-builder.js'
import { BarrelBuilder } from './utils/barrel-builder.js'

export class ServiceGenerator extends BaseGenerator {
  /**
   * Generate service file
   */
  generate(): GeneratorOutput {
    const content = this.createTemplate()
      .importString(this.buildImports())
      .block(this.buildServiceObject())
      .buildWithNewline()
    
    const files = new Map<string, string>([
      [`${this.modelLower}.service.ts`, content]
    ])
    
    return {
      files,
      imports: this.getImports(),
      exports: this.getExports(),
      metadata: {
        fileCount: 1,
        lineCount: content.split('\n').length
      }
    }
  }
  
  /**
   * Build all imports for service
   */
  private buildImports(): string {
    return `import prisma from '@/db'
import type { ${this.modelName}CreateDTO, ${this.modelName}UpdateDTO, ${this.modelName}QueryDTO } from '${this.metadata.getContractsPath()}'
import type { Prisma } from '@prisma/client'

`
  }
  
  /**
   * Build complete service object
   */
  private buildServiceObject(): string {
    const methods = [
      this.generateListMethod(),
      this.generateFindByIdMethod(),
      this.generateCreateMethod(),
      this.generateUpdateMethod(),
      this.generateDeleteMethod(),
      this.generateCountMethod(),
      this.generateExistsMethod()
    ]
    
    return `export const ${this.modelLower}Service = {
${methods.join(',\n\n')}
}`
  }
  
  /**
   * Generate list method with pagination
   */
  generateListMethod(): string {
    return `  /**
   * List ${this.modelName} records with pagination
   */
  async list(query: ${this.modelName}QueryDTO) {
    const { skip = 0, take = 20, orderBy, where, include, select } = query
    
    const [items, total] = await Promise.all([
      prisma.${this.modelLower}.findMany({
        skip,
        take,
        orderBy: orderBy as Prisma.${this.modelName}OrderByWithRelationInput,
        where: where as Prisma.${this.modelName}WhereInput,
        include: include as Prisma.${this.modelName}Include | undefined,
        select: select as Prisma.${this.modelName}Select | undefined,
      }),
      prisma.${this.modelLower}.count({
        where: where as Prisma.${this.modelName}WhereInput,
      })
    ])
    
    return {
      data: items,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total
      }
    }
  }`
  }
  
  /**
   * Generate findById method
   */
  generateFindByIdMethod(): string {
    return `  /**
   * Find ${this.modelName} by ID
   */
  async findById(id: ${this.idType}) {
    return prisma.${this.modelLower}.findUnique({
      where: { id }
    })
  }`
  }
  
  /**
   * Generate create method
   */
  generateCreateMethod(): string {
    return `  /**
   * Create ${this.modelName}
   */
  async create(data: ${this.modelName}CreateDTO) {
    return prisma.${this.modelLower}.create({
      data
    })
  }`
  }
  
  /**
   * Generate update method
   */
  generateUpdateMethod(): string {
    return `  /**
   * Update ${this.modelName}
   */
  async update(id: ${this.idType}, data: ${this.modelName}UpdateDTO) {
    try {
      return await prisma.${this.modelLower}.update({
        where: { id },
        data
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null  // Not found
      }
      throw error
    }
  }`
  }
  
  /**
   * Generate delete method
   */
  generateDeleteMethod(): string {
    return `  /**
   * Delete ${this.modelName}
   */
  async delete(id: ${this.idType}) {
    try {
      await prisma.${this.modelLower}.delete({
        where: { id }
      })
      return true
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false  // Not found
      }
      throw error
    }
  }`
  }
  
  /**
   * Generate count method
   */
  generateCountMethod(): string {
    return `  /**
   * Count ${this.modelName} records
   */
  async count(where?: Prisma.${this.modelName}WhereInput) {
    return prisma.${this.modelLower}.count({ where })
  }`
  }
  
  /**
   * Generate exists method
   */
  generateExistsMethod(): string {
    return `  /**
   * Check if ${this.modelName} exists
   */
  async exists(id: ${this.idType}) {
    const count = await prisma.${this.modelLower}.count({
      where: { id }
    })
    return count > 0
  }`
  }
  
  /**
   * Get imports
   */
  getImports(): string[] {
    return [
      `import prisma from '@/db'`,
      `import type { ${this.modelName}CreateDTO, ${this.modelName}UpdateDTO, ${this.modelName}QueryDTO } from '${this.metadata.getContractsPath()}'`,
      `import type { Prisma } from '@prisma/client'`
    ]
  }
  
  /**
   * Get exports
   */
  getExports(): string[] {
    return [`${this.modelLower}Service`]
  }
  
  /**
   * Generate barrel
   */
  generateBarrel(): string {
    return BarrelBuilder.simple([`${this.modelLower}.service`])
  }
}

