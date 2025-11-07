/**
 * Phase Utilities - Shared utilities for all generation phases
 * 
 * Centralizes common operations to eliminate duplication across phases
 */

import fs from 'node:fs'
import path from 'node:path'
import pLimit from 'p-limit'
import type { PathsConfig } from '../path-resolver.js'
import { esmImport } from '../path-resolver.js'

/**
 * Concurrency limiter for file operations
 * Limits concurrent file writes to prevent overwhelming the file system
 * 
 * Default: 100 concurrent writes
 * Can be overridden via SSOT_WRITE_CONCURRENCY environment variable
 */
const FILE_WRITE_CONCURRENCY = parseInt(process.env.SSOT_WRITE_CONCURRENCY || '100', 10)
const writeLimit = pLimit(FILE_WRITE_CONCURRENCY)

/**
 * File I/O utilities
 */
export const ensureDir = async (p: string): Promise<void> => {
  await fs.promises.mkdir(p, { recursive: true })
}

/**
 * Write a file with concurrency throttling
 * 
 * Uses p-limit to ensure we don't exceed FILE_WRITE_CONCURRENCY simultaneous writes.
 * This prevents file system overwhelm and improves reliability on slower disks.
 */
export const writeFile = async (filePath: string, content: string): Promise<void> => {
  return writeLimit(async () => {
    await ensureDir(path.dirname(filePath))
    await fs.promises.writeFile(filePath, content, 'utf8')
  })
}

/**
 * Path tracking for generated files (shared state across phases)
 */
const pathMap: Record<string, { fs: string; esm: string }> = {}

export const trackPath = (idStr: string, fsPath: string, esmPath: string): void => {
  pathMap[idStr] = { fs: fsPath, esm: esmPath }
}

export const getTrackedPaths = (): Record<string, { fs: string; esm: string }> => {
  return { ...pathMap }
}

export const clearTrackedPaths = (): void => {
  Object.keys(pathMap).forEach(key => delete pathMap[key])
}

/**
 * Path ID builder for tracking
 */
export const createPathId = (layer: string, model?: string, file?: string) => ({ 
  layer, 
  model, 
  file 
})

/**
 * Batch write files with tracking
 */
export async function batchWriteFiles(
  files: Array<{ path: string; content: string; trackAs?: string; esmPath?: string }>,
  cfg?: PathsConfig
): Promise<void> {
  const writes = files.map(async ({ path: filePath, content, trackAs, esmPath }) => {
    await writeFile(filePath, content)
    
    if (trackAs && esmPath && cfg) {
      trackPath(trackAs, filePath, esmPath)
    }
  })
  
  await Promise.all(writes)
}

/**
 * Generate ESM import path helper
 */
export function generateEsmPath(cfg: PathsConfig, layer: string, model?: string, file?: string): string {
  return esmImport(cfg, createPathId(layer, model, file))
}

