/**
 * Import Builder - Type-safe import statement management
 * 
 * Provides fluent API for building import statements
 */

export class ImportBuilder {
  private imports = new Set<string>()
  
  /**
   * Add raw import statement
   */
  add(importStatement: string): this {
    this.imports.add(importStatement)
    return this
  }
  
  /**
   * Add type import
   * @example addType('@prisma/client', 'Prisma', 'Todo')
   * // import type { Prisma, Todo } from '@prisma/client'
   */
  addType(module: string, ...types: string[]): this {
    if (types.length === 0) return this
    this.imports.add(`import type { ${types.join(', ')} } from '${module}'`)
    return this
  }
  
  /**
   * Add default import
   * @example addDefault('@/db', 'prisma')
   * // import prisma from '@/db'
   */
  addDefault(module: string, name: string): this {
    this.imports.add(`import ${name} from '${module}'`)
    return this
  }
  
  /**
   * Add named import
   * @example addNamed('zod', 'z', 'ZodError')
   * // import { z, ZodError } from 'zod'
   */
  addNamed(module: string, ...names: string[]): this {
    if (names.length === 0) return this
    this.imports.add(`import { ${names.join(', ')} } from '${module}'`)
    return this
  }
  
  /**
   * Add namespace import
   * @example addNamespace('@/controllers/todo', 'todoController')
   * // import * as todoController from '@/controllers/todo'
   */
  addNamespace(module: string, alias: string): this {
    this.imports.add(`import * as ${alias} from '${module}'`)
    return this
  }
  
  /**
   * Conditionally add import
   */
  addIf(condition: boolean, callback: (builder: this) => this): this {
    if (condition) {
      callback(this)
    }
    return this
  }
  
  /**
   * Build import statements (sorted for consistency)
   */
  build(): string[] {
    return Array.from(this.imports).sort()
  }
  
  /**
   * Build as string with newlines
   */
  toString(): string {
    const imports = this.build()
    return imports.length > 0 ? imports.join('\n') + '\n\n' : ''
  }
  
  /**
   * Check if has any imports
   */
  hasImports(): boolean {
    return this.imports.size > 0
  }
  
  /**
   * Clear all imports
   */
  clear(): this {
    this.imports.clear()
    return this
  }
}


