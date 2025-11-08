/**
 * Unit Tests: FilePathRegistry
 * 
 * Tests cross-platform path collision detection.
 * CRITICAL: Must work correctly on Windows (case-insensitive) and Linux (case-sensitive)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FilePathRegistry, PathCollisionError } from '../file-path-registry.js'
import { ErrorSeverity } from '../../pipeline/generation-types.js'
import type { GenerationError } from '../../pipeline/generation-types.js'

describe('FilePathRegistry', () => {
  let registry: FilePathRegistry
  
  beforeEach(() => {
    registry = new FilePathRegistry()
  })
  
  describe('Basic path registration', () => {
    it('should register a path successfully', () => {
      expect(() => {
        registry.register('user.controller.ts', 'User')
      }).not.toThrow()
      
      expect(registry.size()).toBe(1)
    })
    
    it('should check if path is available', () => {
      expect(registry.isAvailable('user.controller.ts')).toBe(true)
      
      registry.register('user.controller.ts', 'User')
      
      expect(registry.isAvailable('user.controller.ts')).toBe(false)
    })
    
    it('should track metadata', () => {
      registry.register('user.controller.ts', 'User', 'UserModel')
      
      const metadata = registry.getMetadata('user.controller.ts')
      
      expect(metadata).toBeDefined()
      expect(metadata?.originalPath).toBe('user.controller.ts')
      expect(metadata?.source).toBe('User')
      expect(metadata?.modelName).toBe('UserModel')
    })
  })
  
  describe('Path collision detection', () => {
    it('should detect exact path collision', () => {
      registry.register('user.controller.ts', 'User')
      
      expect(() => {
        registry.register('user.controller.ts', 'UserProfile')
      }).toThrow(PathCollisionError)
    })
    
    it('should provide detailed collision error', () => {
      registry.register('user.controller.ts', 'User')
      
      try {
        registry.register('user.controller.ts', 'UserProfile')
        expect.fail('Should have thrown PathCollisionError')
      } catch (error) {
        expect(error).toBeInstanceOf(PathCollisionError)
        const pathError = error as PathCollisionError
        
        expect(pathError.newPath).toBe('user.controller.ts')
        expect(pathError.existingPath).toBe('user.controller.ts')
        expect(pathError.newSource).toBe('UserProfile')
        expect(pathError.existingSource).toBe('User')
        expect(pathError.message).toContain('Path collision')
        expect(pathError.message).toContain('user.controller.ts')
        expect(pathError.message).toContain('User')
        expect(pathError.message).toContain('UserProfile')
      }
    })
  })
  
  describe('Case-insensitive collisions (Windows/macOS)', () => {
    it('should detect case-insensitive collision on Windows', () => {
      // Mock Windows platform
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true })
      
      const winRegistry = new FilePathRegistry()
      winRegistry.register('user.controller.ts', 'User')
      
      // Should detect collision (different case, same file on Windows)
      expect(() => {
        winRegistry.register('User.controller.ts', 'UserProfile')
      }).toThrow(PathCollisionError)
      
      // Restore platform
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true })
    })
    
    it('should detect case-insensitive collision on macOS', () => {
      // Mock macOS platform
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'darwin', writable: true })
      
      const macRegistry = new FilePathRegistry()
      macRegistry.register('post.service.ts', 'Post')
      
      // Should detect collision (different case, same file on macOS)
      expect(() => {
        macRegistry.register('POST.service.ts', 'BlogPost')
      }).toThrow(PathCollisionError)
      
      // Restore platform
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true })
    })
    
    it('should indicate case-insensitive collision in error', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true })
      
      const winRegistry = new FilePathRegistry()
      winRegistry.register('user.ts', 'User')
      
      try {
        winRegistry.register('USER.ts', 'Admin')
        expect.fail('Should have thrown')
      } catch (error) {
        const pathError = error as PathCollisionError
        expect(pathError.caseInsensitive).toBe(true)
        expect(pathError.message).toContain('case-insensitive collision')
      }
      
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true })
    })
  })
  
  describe('Case-sensitive behavior (Linux)', () => {
    it('should allow different cases on Linux', () => {
      // Mock Linux platform
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'linux', writable: true })
      
      const linuxRegistry = new FilePathRegistry()
      
      // Both should succeed (different files on Linux)
      expect(() => {
        linuxRegistry.register('user.controller.ts', 'User')
        linuxRegistry.register('User.controller.ts', 'UserProfile')
      }).not.toThrow()
      
      expect(linuxRegistry.size()).toBe(2)
      
      // Restore platform
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true })
    })
  })
  
  describe('Path normalization', () => {
    it('should normalize forward slashes', () => {
      registry.register('models/user.ts', 'User')
      
      // Should be normalized to same path
      expect(registry.isAvailable('models/user.ts')).toBe(false)
    })
    
    it('should normalize backslashes (Windows)', () => {
      registry.register('models\\user.ts', 'User')
      
      // Forward slash should match backslash after normalization
      const metadata = registry.getMetadata('models/user.ts')
      expect(metadata).toBeDefined()
    })
    
    it('should handle mixed separators', () => {
      registry.register('models/controllers\\user.ts', 'User')
      
      const metadata = registry.getMetadata('models/controllers/user.ts')
      expect(metadata).toBeDefined()
    })
  })
  
  describe('tryRegister (non-throwing)', () => {
    it('should register successfully and return true', () => {
      const errors: GenerationError[] = []
      
      const success = registry.tryRegister('user.ts', 'User', 'UserModel', errors)
      
      expect(success).toBe(true)
      expect(errors).toHaveLength(0)
      expect(registry.size()).toBe(1)
    })
    
    it('should return false on collision and add error', () => {
      const errors: GenerationError[] = []
      
      registry.register('user.ts', 'User')
      const success = registry.tryRegister('user.ts', 'UserProfile', 'ProfileModel', errors)
      
      expect(success).toBe(false)
      expect(errors).toHaveLength(1)
      expect(errors[0].severity).toBe(ErrorSeverity.WARNING)
      expect(errors[0].message).toContain('Path collision')
      expect(errors[0].model).toBe('ProfileModel')
    })
    
    it('should not register on collision', () => {
      const errors: GenerationError[] = []
      
      registry.register('user.ts', 'User')
      registry.tryRegister('user.ts', 'UserProfile', undefined, errors)
      
      // Should still have only 1 registration
      expect(registry.size()).toBe(1)
      
      // Should still be from 'User', not 'UserProfile'
      const metadata = registry.getMetadata('user.ts')
      expect(metadata?.source).toBe('User')
    })
  })
  
  describe('getAllPaths', () => {
    it('should return all registered paths', () => {
      registry.register('user.ts', 'User')
      registry.register('post.ts', 'Post')
      registry.register('comment.ts', 'Comment')
      
      const paths = registry.getAllPaths()
      
      expect(paths).toHaveLength(3)
      expect(paths.map(p => p.source)).toEqual(['User', 'Post', 'Comment'])
    })
    
    it('should return immutable array (type-level protection)', () => {
      registry.register('user.ts', 'User')
      registry.register('post.ts', 'Post')
      
      const paths = registry.getAllPaths()
      
      // TypeScript marks as readonly (runtime can't enforce, but type system does)
      expect(paths).toHaveLength(2)
      
      // Verify it's a fresh array (not the internal map)
      const paths2 = registry.getAllPaths()
      expect(paths).not.toBe(paths2)  // Different instances
      expect(paths).toEqual(paths2)  // But same content
    })
  })
  
  describe('clear', () => {
    it('should clear all paths', () => {
      registry.register('user.ts', 'User')
      registry.register('post.ts', 'Post')
      
      expect(registry.size()).toBe(2)
      
      registry.clear()
      
      expect(registry.size()).toBe(0)
      expect(registry.isAvailable('user.ts')).toBe(true)
      expect(registry.isAvailable('post.ts')).toBe(true)
    })
  })
  
  describe('Real-world scenarios', () => {
    it('should handle model name collision (User vs UserProfile)', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', { value: 'win32', writable: true })
      
      const winRegistry = new FilePathRegistry()
      const errors: GenerationError[] = []
      
      // Register User controller
      winRegistry.tryRegister('user.controller.ts', 'User', 'User', errors)
      
      // Try to register UserProfile controller (would create user-profile.controller.ts normally)
      // But if someone manually names it User.controller.ts, should detect collision
      winRegistry.tryRegister('User.controller.ts', 'UserProfile', 'UserProfile', errors)
      
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('case-insensitive collision')
      
      Object.defineProperty(process, 'platform', { value: originalPlatform, writable: true })
    })
    
    it('should handle service annotation collision', () => {
      // Service named "image-optimizer" creates image-optimizer.controller.ts
      registry.register('image-optimizer.controller.ts', 'image-optimizer-service')
      
      // If a model was also named ImageOptimizer, it would try to create image-optimizer.controller.ts
      expect(() => {
        registry.register('image-optimizer.controller.ts', 'ImageOptimizer')
      }).toThrow(PathCollisionError)
    })
    
    it('should allow different files from same source', () => {
      registry.register('user.controller.ts', 'User')
      registry.register('user.service.ts', 'User')
      registry.register('user.routes.ts', 'User')
      
      expect(registry.size()).toBe(3)
      
      const paths = registry.getAllPaths()
      expect(paths.every(p => p.source === 'User')).toBe(true)
    })
  })
  
  describe('PathCollisionError', () => {
    it('should format error message correctly', () => {
      const error = new PathCollisionError(
        'User.controller.ts',
        'user.controller.ts',
        'UserProfile',
        'User',
        true  // case-insensitive
      )
      
      expect(error.message).toContain('Path collision')
      expect(error.message).toContain('case-insensitive collision')
      expect(error.message).toContain('User.controller.ts')
      expect(error.message).toContain('user.controller.ts')
      expect(error.message).toContain('UserProfile')
      expect(error.message).toContain('User')
      expect(error.name).toBe('PathCollisionError')
    })
    
    it('should indicate exact collision when appropriate', () => {
      const error = new PathCollisionError(
        'user.ts',
        'user.ts',
        'DuplicateSource',
        'OriginalSource',
        false  // case-sensitive (exact match)
      )
      
      expect(error.message).toContain('exact collision')
      expect(error.message).not.toContain('case-insensitive')
    })
  })
  
  describe('Edge cases', () => {
    it('should handle empty source string', () => {
      expect(() => {
        registry.register('file.ts', '')
      }).not.toThrow()
      
      const metadata = registry.getMetadata('file.ts')
      expect(metadata?.source).toBe('')
    })
    
    it('should handle paths with dots', () => {
      registry.register('user.read.dto.ts', 'User')
      registry.register('user.create.dto.ts', 'User')
      
      expect(registry.size()).toBe(2)
    })
    
    it('should handle deeply nested paths', () => {
      registry.register('a/b/c/d/e/file.ts', 'Deep')
      
      expect(registry.isAvailable('a/b/c/d/e/file.ts')).toBe(false)
    })
    
    it('should handle special characters in path', () => {
      registry.register('user-profile_v2.controller.ts', 'UserProfile')
      
      expect(registry.size()).toBe(1)
    })
  })
})

