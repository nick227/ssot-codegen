/**
 * File Path Registry - Handle path collisions across platforms
 * 
 * v2.0: Cross-platform path collision detection.
 * Handles case-insensitive filesystems (Windows, macOS) and path normalization.
 * 
 * FEATURES:
 * - Case-insensitive collision detection
 * - Path normalization (handles / vs \)
 * - Tracks source of each path (for debugging)
 * - Reports conflicts with context
 */

import * as path from 'node:path'
import { ErrorSeverity, type GenerationError } from '../pipeline/generation-types.js'

/**
 * Path metadata
 */
interface PathMetadata {
  originalPath: string  // Path as provided
  normalizedPath: string  // Normalized for comparison
  source: string  // What generated this (model name, plugin, etc.)
  modelName?: string  // Associated model if applicable
}

/**
 * Registry for tracking generated file paths
 * 
 * Prevents collisions on case-insensitive filesystems and provides
 * clear error messages when conflicts occur.
 * 
 * @example
 * ```ts
 * const registry = new FilePathRegistry()
 * 
 * // Register path
 * if (registry.isAvailable('user.controller.ts', 'User')) {
 *   registry.register('user.controller.ts', 'User')
 *   // ... generate file
 * }
 * 
 * // Check for collision
 * registry.register('User.controller.ts', 'UserProfile')  // Throws on Windows/macOS
 * ```
 */
export class FilePathRegistry {
  private readonly paths = new Map<string, PathMetadata>()
  private readonly isWindows = process.platform === 'win32'
  private readonly isMacOS = process.platform === 'darwin'
  
  /**
   * Check if path is case-insensitive filesystem
   * Windows and macOS are case-insensitive by default
   */
  private get isCaseInsensitive(): boolean {
    return this.isWindows || this.isMacOS
  }
  
  /**
   * Normalize path for comparison
   * 
   * On case-insensitive filesystems, converts to lowercase.
   * Always normalizes separators (\ vs /)
   */
  private normalize(filePath: string): string {
    // Normalize path separators
    let normalized = path.normalize(filePath).replace(/\\/g, '/')
    
    // On case-insensitive filesystems, lowercase for comparison
    if (this.isCaseInsensitive) {
      normalized = normalized.toLowerCase()
    }
    
    return normalized
  }
  
  /**
   * Check if path is available (no collision)
   * 
   * @param filePath - Path to check
   * @returns true if available, false if collision detected
   */
  isAvailable(filePath: string): boolean {
    const normalized = this.normalize(filePath)
    return !this.paths.has(normalized)
  }
  
  /**
   * Register a path
   * 
   * @param filePath - Path to register
   * @param source - Source identifier (model name, plugin, etc.)
   * @param modelName - Optional associated model name
   * @throws {PathCollisionError} if path already registered
   */
  register(filePath: string, source: string, modelName?: string): void {
    const normalized = this.normalize(filePath)
    
    if (this.paths.has(normalized)) {
      const existing = this.paths.get(normalized)!
      throw new PathCollisionError(
        filePath,
        existing.originalPath,
        source,
        existing.source,
        this.isCaseInsensitive
      )
    }
    
    this.paths.set(normalized, {
      originalPath: filePath,
      normalizedPath: normalized,
      source,
      modelName
    })
  }
  
  /**
   * Try to register path, return false on collision
   * Non-throwing version of register()
   * 
   * @param filePath - Path to register
   * @param source - Source identifier
   * @param modelName - Optional model name
   * @param errors - Error array to append to on collision
   * @returns true if registered, false if collision
   */
  tryRegister(
    filePath: string,
    source: string,
    modelName: string | undefined,
    errors: GenerationError[]
  ): boolean {
    try {
      this.register(filePath, source, modelName)
      return true
    } catch (error) {
      if (error instanceof PathCollisionError) {
        errors.push({
          severity: ErrorSeverity.WARNING,
          message: error.message,
          model: modelName,
          phase: 'path-validation'
        })
        return false
      }
      throw error  // Re-throw unexpected errors
    }
  }
  
  /**
   * Get all registered paths (immutable)
   */
  getAllPaths(): ReadonlyArray<PathMetadata> {
    return Array.from(this.paths.values())
  }
  
  /**
   * Get path metadata
   */
  getMetadata(filePath: string): PathMetadata | undefined {
    const normalized = this.normalize(filePath)
    return this.paths.get(normalized)
  }
  
  /**
   * Clear all paths (for testing or watch mode)
   */
  clear(): void {
    this.paths.clear()
  }
  
  /**
   * Get count of registered paths
   */
  size(): number {
    return this.paths.size
  }
}

/**
 * Path collision error
 */
export class PathCollisionError extends Error {
  constructor(
    public readonly newPath: string,
    public readonly existingPath: string,
    public readonly newSource: string,
    public readonly existingSource: string,
    public readonly caseInsensitive: boolean
  ) {
    const reason = caseInsensitive && newPath.toLowerCase() === existingPath.toLowerCase()
      ? '(case-insensitive collision)'
      : '(exact collision)'
    
    super(
      `Path collision detected ${reason}:\n` +
      `  New: "${newPath}" from ${newSource}\n` +
      `  Existing: "${existingPath}" from ${existingSource}`
    )
    
    this.name = 'PathCollisionError'
  }
}

/**
 * Create path registry (convenience function)
 */
export function createPathRegistry(): FilePathRegistry {
  return new FilePathRegistry()
}

