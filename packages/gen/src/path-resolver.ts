// Path Resolver for generated imports (v0.5.0)
export interface PathsConfig {
  alias: string
  rootDir: string
  perModelSubfolders: boolean
  useBarrels: boolean
  layers: Record<string,string>
  filenamePattern: 'model.artifact.suffix'
  
  /**
   * Barrel file extension configuration
   * - 'js' (default): Use .js extensions for ESM compatibility
   * - 'none': Omit extensions (for bundler-based projects)
   * - 'ts': Use .ts extensions (for TypeScript-only projects)
   */
  barrelExtension?: 'js' | 'none' | 'ts'
}
export interface FileId { layer: string; model?: string; file?: string }
const posix = (s:string) => s.replace(/\\/g, '/')

/**
 * Generate filesystem path for a file
 */
export const filePath = (cfg: PathsConfig, id: FileId) => {
  const layer = cfg.layers[id.layer] || id.layer
  const parts = [cfg.rootDir, layer]
  if (cfg.perModelSubfolders && id.model) parts.push(id.model.toLowerCase())
  if (id.file) parts.push(id.file)
  return posix(parts.join('/'))
}

/**
 * Generate ESM import path
 * 
 * @throws Error with context if layer mapping not found
 */
export const esmImport = (cfg: PathsConfig, id: FileId, preferBarrel=true) => {
  try {
    const layer = cfg.layers[id.layer] || id.layer
    const parts = [cfg.alias, layer]
    if (cfg.perModelSubfolders && id.model) parts.push(id.model.toLowerCase())
    if (!preferBarrel && id.file) {
      // Remove .ts extension from file imports
      parts.push(id.file.replace(/\.ts$/, ''))
      // Add configured extension if not using barrels
      const ext = cfg.barrelExtension || 'js'
      if (ext !== 'none') {
        parts[parts.length - 1] = `${parts[parts.length - 1]}.${ext}`
      }
    }
    return posix(parts.join('/'))
  } catch (error) {
    throw new Error(
      `Failed to generate ESM import path for layer '${id.layer}'` +
      (id.model ? `, model '${id.model}'` : '') +
      (id.file ? `, file '${id.file}'` : '') +
      `: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const barrelIds = (id: FileId) => {
  const layerBarrel: FileId = { layer: id.layer }
  const modelBarrel: FileId = id.model ? { layer: id.layer, model: id.model } : layerBarrel
  return { layerBarrel, modelBarrel }
}
