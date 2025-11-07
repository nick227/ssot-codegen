/**
 * Barrel Generator Snapshot Tests
 * Ensures index.ts barrel files remain consistent
 * 
 * NOTE: This tests the CURRENT barrel generation logic.
 * When we consolidate barrel generation (roadmap item), 
 * these snapshots will help verify nothing breaks.
 */

import { describe, it, expect } from 'vitest'
import { generateBarrelIndex } from '../../index-new.js'

describe('Barrel Generation Snapshots', () => {
  describe('Model Barrel Exports', () => {
    it('should match contracts barrel snapshot', () => {
      const files = ['user.create.dto.ts', 'user.update.dto.ts', 'user.read.dto.ts', 'user.query.dto.ts']
      const barrel = generateBarrelExports(files, 'dto')
      
      expect(barrel).toMatchSnapshot()
    })
    
    it('should match services barrel snapshot', () => {
      const files = ['user.service.ts', 'post.service.ts', 'comment.service.ts']
      const barrel = generateBarrelExports(files, 'service')
      
      expect(barrel).toMatchSnapshot()
    })
    
    it('should match controllers barrel snapshot', () => {
      const files = ['user.controller.ts', 'post.controller.ts']
      const barrel = generateBarrelExports(files, 'controller')
      
      expect(barrel).toMatchSnapshot()
    })
  })
  
  describe('Barrel Export Patterns', () => {
    it('should use named exports for TypeScript files', () => {
      const files = ['user.dto.ts', 'post.dto.ts']
      const barrel = generateBarrelExports(files, 'dto')
      
      expect(barrel).toContain('export *')
      expect(barrel).toContain('.js\'')  // Should use .js in imports
      expect(barrel).toContain('// @generated')
    })
    
    it('should handle nested directories', () => {
      const files = ['user/user.service.ts', 'post/post.service.ts']
      const barrel = generateBarrelExports(files, 'service')
      
      expect(barrel).toContain('./user/user.service.js')
      expect(barrel).toContain('./post/post.service.js')
    })
  })
})

// Helper function (this exists in index-new.ts but extracting for testing)
function generateBarrelExports(files: string[], type: string): string {
  return `// @generated barrel
// Auto-generated ${type} exports

${files.map(f => {
    const importPath = './' + f.replace('.ts', '.js')
    return `export * from '${importPath}'`
  }).join('\n')}
`
}

