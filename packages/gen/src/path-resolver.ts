// Path Resolver for generated imports (v0.4.0)
export interface PathsConfig {
  alias: string
  rootDir: string
  perModelSubfolders: boolean
  useBarrels: boolean
  layers: Record<string,string>
  filenamePattern: 'model.artifact.suffix'
}
export interface FileId { layer: string; model?: string; file?: string }
const posix = (s:string) => s.replace(/\\/g, '/')
export const filePath = (cfg: PathsConfig, id: FileId) => {
  const layer = cfg.layers[id.layer] || id.layer
  const parts = [cfg.rootDir, layer]
  if (cfg.perModelSubfolders && id.model) parts.push(id.model.toLowerCase())
  if (id.file) parts.push(id.file)
  return posix(parts.join('/'))
}
export const esmImport = (cfg: PathsConfig, id: FileId, preferBarrel=true) => {
  const layer = cfg.layers[id.layer] || id.layer
  const parts = [cfg.alias, layer]
  if (cfg.perModelSubfolders && id.model) parts.push(id.model.toLowerCase())
  if (!preferBarrel && id.file) parts.push(id.file.replace(/\.ts$/, ''))
  return posix(parts.join('/'))
}
export const barrelIds = (id: FileId) => {
  const layerBarrel: FileId = { layer: id.layer }
  const modelBarrel: FileId = id.model ? { layer: id.layer, model: id.model } : layerBarrel
  return { layerBarrel, modelBarrel }
}
