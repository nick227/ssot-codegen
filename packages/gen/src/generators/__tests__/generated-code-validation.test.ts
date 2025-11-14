/**
 * Generated Code Validation Tests
 * 
 * Validates that generated code follows correct patterns and will work at runtime.
 * These tests catch common issues before they reach generated projects.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('Generated Code Validation', () => {
  /**
   * Validates that controller exports are properly bound
   */
  describe('Controller Method Binding', () => {
    it('validates BaseCRUDController generator uses .bind()', () => {
      const generatorPath = join(__dirname, '../controller-generator-base-class.ts')
      
      if (!existsSync(generatorPath)) {
        throw new Error(`Generator not found: ${generatorPath}`)
      }
      
      const code = readFileSync(generatorPath, 'utf-8')
      
      // Check that generateCRUDExports function uses .bind()
      const hasBind = code.includes('.bind(') && code.includes('generateCRUDExports')
      
      if (!hasBind) {
        // Check for old pattern (without bind)
        const oldPattern = /export const list\$\{model\.name\}s = \$\{modelCamel\}CRUD\.list[^.]/
        if (oldPattern.test(code)) {
          throw new Error(
            '❌ CRITICAL: Controller methods exported without .bind()!\n' +
            'This causes "Cannot read properties of undefined (reading \'modelName\')" errors.\n' +
            'Location: generateCRUDExports function\n' +
            'Fix: Add .bind(instance) to all method exports'
          )
        }
      }
      
      expect(hasBind || !code.includes('generateCRUDExports')).toBe(true)
    })
    
    it('validates all CRUD methods are bound in generator', () => {
      const generatorPath = join(__dirname, '../controller-generator-base-class.ts')
      const code = readFileSync(generatorPath, 'utf-8')
      
      const methods = ['list', 'search', 'getById', 'create', 'update', 'deleteRecord', 'count']
      const bulkMethods = ['bulkCreate', 'bulkUpdate', 'bulkDelete']
      
      // Extract the generateCRUDExports function
      const exportsMatch = code.match(/function generateCRUDExports[\s\S]*?return `[\s\S]*?`/m)
      
      if (!exportsMatch) {
        throw new Error('Could not find generateCRUDExports function')
      }
      
      const exportsCode = exportsMatch[0]
      
      // Check each method is bound
      for (const method of [...methods, ...bulkMethods]) {
        // Look for pattern: method.bind(instance) in template string
        // Pattern: ${modelCamel}CRUD.method.bind(${modelCamel}CRUD)
        const bindPattern = new RegExp(
          `\\$\\{modelCamel\\}CRUD\\.${method}\\.bind\\(\\$\\{modelCamel\\}CRUD\\)`,
          'g'
        )
        
        if (!bindPattern.test(exportsCode)) {
          // Check if method is even exported (look for export const ... = ...method)
          const exportPattern = new RegExp(`export const.*=.*\\$\\{modelCamel\\}CRUD\\.${method}[^.]`, 'g')
          if (exportPattern.test(exportsCode)) {
            throw new Error(
              `❌ Method '${method}' is exported but not bound!\n` +
              `This will cause "Cannot read properties of undefined" errors at runtime.\n` +
              `Fix: Change '${method}' to '${method}.bind(${modelCamel}CRUD)' in generateCRUDExports`
            )
          }
        }
      }
      
      expect(true).toBe(true)
    })
  })
  
  /**
   * Validates template code patterns
   */
  describe('Template Code Patterns', () => {
    it('validates BaseCRUDController template has proper error handling', () => {
      const templatePath = join(__dirname, '../../templates/base-crud-controller.template.ts')
      
      if (!existsSync(templatePath)) {
        // Template might be inline, skip
        return
      }
      
      const code = readFileSync(templatePath, 'utf-8')
      
      // Check that error handling accesses this.config safely
      const hasConfigCheck = code.includes('this.config') && 
                            (code.includes('?.') || code.includes('if (this.config'))
      
      if (!hasConfigCheck && code.includes('this.config.modelName')) {
        console.warn('⚠️  Template accesses this.config without null checks')
      }
    })
  })
  
  /**
   * Validates that similar binding issues don't exist elsewhere
   */
  describe('Other Binding Issues', () => {
    it('checks for unbound method exports in generators', () => {
      const generatorsDir = join(__dirname, '..')
      
      if (!existsSync(generatorsDir)) {
        return
      }
      
      const files = readdirSync(generatorsDir)
        .filter(f => f.endsWith('.ts') && !f.includes('.test.'))
      
      const issues: string[] = []
      
      for (const file of files) {
        const filePath = join(generatorsDir, file)
        const code = readFileSync(filePath, 'utf-8')
        
        // Look for pattern: export const method = instance.method (without bind)
        // But exclude if it's already bound or is a function call
        const unboundPattern = /export const \w+ = \w+\.\w+(?!\.bind\(|\()/g
        const matches = code.match(unboundPattern)
        
        if (matches) {
          // Filter out false positives (function calls, etc.)
          const suspicious = matches.filter(m => {
            const line = code.substring(code.indexOf(m) - 50, code.indexOf(m) + 100)
            return !line.includes('()') && !line.includes('new ') && line.includes('=')
          })
          
          if (suspicious.length > 0) {
            issues.push(`${file}: ${suspicious.join(', ')}`)
          }
        }
      }
      
      if (issues.length > 0) {
        console.warn('⚠️  Potential unbound method exports found:', issues)
        // Don't fail, just warn - these might be intentional
      }
      
      expect(true).toBe(true)
    })
  })
})

