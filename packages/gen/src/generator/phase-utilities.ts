/**
 * Phase Utilities - Shared utilities for all generation phases
 * 
 * Centralizes common operations to eliminate duplication across phases
 */

import fs from 'node:fs'
import path from 'node:path'
import type { PathsConfig } from '../path-resolver.js'
import { esmImport } from '../path-resolver.js'

/**
 * File I/O utilities
 */
export const ensureDir = async (p: string): Promise<void> => {
  await fs.promises.mkdir(p, { recursive: true })
}

export const writeFile = async (filePath: string, content: string): Promise<void> => { 
  await ensureDir(path.dirname(filePath))
  await fs.promises.writeFile(filePath, content, 'utf8')
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

