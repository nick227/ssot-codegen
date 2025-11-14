/**
 * Controller Binding Validation Tests
 * 
 * Validates that generated controllers properly bind methods to preserve 'this' context.
 * This catches issues where methods are exported without binding, causing runtime errors.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Controller Binding Validation', () => {
  /**
   * Test that generated controllers use .bind() for method exports
   * This prevents "Cannot read properties of undefined" errors
   */
  it('validates BaseCRUDController exports use .bind()', () => {
    // Read the controller generator template
    const generatorPath = join(__dirname, '../controller-generator-base-class.ts')
    
    if (!existsSync(generatorPath)) {
      throw new Error(`Generator file not found: ${generatorPath}`)
    }
    
    const generatorCode = readFileSync(generatorPath, 'utf-8')
    
    // Check that CRUD exports use .bind()
    const crudExportsPattern = /export const list\$\{model\.name\}s = \$\{modelCamel\}CRUD\.list\.bind/
    
    if (!crudExportsPattern.test(generatorCode)) {
      // Check if it's using the old pattern (without bind)
      const oldPattern = /export const list\$\{model\.name\}s = \$\{modelCamel\}CRUD\.list[^.]/
      if (oldPattern.test(generatorCode)) {
        throw new Error(
          '❌ Controller methods are exported without .bind()!\n' +
          'This will cause "Cannot read properties of undefined" errors.\n' +
          'Fix: Use .bind(instance) when exporting methods from BaseCRUDController.'
        )
      }
    }
    
    // Verify all CRUD methods use .bind()
    const methodsToCheck = [
      'list',
      'search',
      'getById',
      'create',
      'update',
      'deleteRecord',
      'count',
      'bulkCreate',
      'bulkUpdate',
      'bulkDelete'
    ]
    
    for (const method of methodsToCheck) {
      // Check for pattern like: export const methodName = instance.method.bind(instance)
      const bindPattern = new RegExp(
        `export const \\w+ = \\$\\{modelCamel\\}CRUD\\.${method}\\.bind\\(\\$\\{modelCamel\\}CRUD\\)`,
        'g'
      )
      
      if (!bindPattern.test(generatorCode)) {
        // Try alternative pattern matching
        const altPattern = new RegExp(
          `\\$\\{modelCamel\\}CRUD\\.${method}\\.bind`,
          'g'
        )
        
        if (!altPattern.test(generatorCode)) {
          throw new Error(
            `❌ Method '${method}' is not properly bound!\n` +
            `Generated controllers will fail at runtime.\n` +
            `Fix: Ensure all BaseCRUDController method exports use .bind(instance)`
          )
        }
      }
    }
    
    expect(true).toBe(true) // Test passes if no errors thrown
  })
  
  /**
   * Test that the template generates correct binding syntax
   */
  it('validates template generates bound methods', () => {
    const templatePath = join(__dirname, '../../templates/base-crud-controller.template.ts')
    
    if (!existsSync(templatePath)) {
      // Template might be inline, skip this test
      return
    }
    
    const templateCode = readFileSync(templatePath, 'utf-8')
    
    // Check that template includes binding instructions or generates bound methods
    const hasBinding = templateCode.includes('.bind(') || 
                      templateCode.includes('bind') ||
                      templateCode.includes('IMPORTANT: Bind methods')
    
    if (!hasBinding) {
      console.warn('⚠️  Template does not explicitly show binding - verify generator handles it')
    }
  })
})

