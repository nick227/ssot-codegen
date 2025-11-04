import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { normalize, Normalized } from '@ssot-codegen/core'
import { PathsConfig, filePath, esmImport } from './path-resolver.js'

export * from './project-scaffold.js'
export * from './dependencies/index.js'
export { generateFromSchema } from './index-new.js'

export interface GeneratorConfig {
  output?: string
  schemaText?: string
  paths?: Partial<PathsConfig>
}

const defaultPaths: PathsConfig = {
  alias: '@gen',
  rootDir: './gen',
  perModelSubfolders: true,
  useBarrels: true,
  filenamePattern: 'model.artifact.suffix',
  layers: {
    contracts: 'contracts',
    validators: 'validators',
    routes: 'routes',
    controllers: 'controllers',
    services: 'services',
    loaders: 'loaders',
    auth: 'auth',
    telemetry: 'telemetry',
    openapi: 'openapi',
    sdk: 'sdk',
    manifests: 'manifests',
    shared: 'shared'
  }
}

const ensureDir = (p: string) => fs.mkdirSync(p, { recursive: true })
const write = (file: string, content: string) => { ensureDir(path.dirname(file)); fs.writeFileSync(file, content, 'utf8') }
const hash = (text: string) => crypto.createHash('sha256').update(text).digest('hex')

const pathMap: Record<string, { fs: string; esm: string }> = {}
const track = (idStr: string, fsPath: string, esmPath: string) => {
  pathMap[idStr] = { fs: fsPath, esm: esmPath }
}

const id = (layer:string, model?:string, file?:string) => ({ layer, model, file })

// Track files created per layer/model for barrel generation
const layerFiles: Record<string, string[]> = {}
const trackFile = (layer: string, model: string, filename: string) => {
  const key = `${layer}:${model}`
  if (!layerFiles[key]) layerFiles[key] = []
  layerFiles[key].push(filename)
}

const emitBarrels = (cfg: PathsConfig, models: string[]) => {
  // Generate model-level barrels
  for (const [key, files] of Object.entries(layerFiles)) {
    const [layer, model] = key.split(':')
    const modelBarrelFs = filePath(cfg, id(layer, model, 'index.ts'))
    const exports = files.map(f => `export * from './${f.replace('.ts', '.js')}'`)
    write(modelBarrelFs, `// @generated barrel\n${exports.join('\n')}\n`)
    track(`${layer}:${model}:index`, modelBarrelFs, esmImport(cfg, id(layer, model)))
  }
  
  // Generate layer-level barrels
  for (const layer of Object.keys(cfg.layers)) {
    const barrelFs = filePath(cfg, id(layer, undefined, 'index.ts'))
    const exports: string[] = []
    for (const m of models) {
      exports.push(`export * as ${m.toLowerCase()} from '${esmImport(cfg, id(layer, m))}'`)
    }
    write(barrelFs, `// @generated layer barrel\n${exports.join('\n')}\n`)
    track(`${layer}:index`, barrelFs, esmImport(cfg, id(layer)))
  }
}

const renderModel = (cfg: PathsConfig, modelName: string) => {
  const lower = modelName.toLowerCase()
  const createDto = `${lower}.create.dto.ts`
  const createZod = `${lower}.create.zod.ts`
  const routes = `${lower}.routes.ts`
  const controller = `${lower}.controller.ts`
  const service = `${lower}.service.ts`
  const loader = `${lower}.loader.ts`
  const telemetry = `${lower}.telemetry.ts`

  const dtoFs = filePath(cfg, id('contracts', modelName, createDto))
  write(dtoFs, `// @generated\nexport interface ${modelName}CreateDTO { /* fields */ }\n`)
  track(`contracts:${modelName}:${createDto}`, dtoFs, esmImport(cfg, id('contracts', modelName), cfg.useBarrels))
  trackFile('contracts', modelName, createDto)

  const zodFs = filePath(cfg, id('validators', modelName, createZod))
  write(zodFs, `// @generated\n// zod schema for ${modelName}Create\n`)
  track(`validators:${modelName}:${createZod}`, zodFs, esmImport(cfg, id('validators', modelName), cfg.useBarrels))
  trackFile('validators', modelName, createZod)

  const routesFs = filePath(cfg, id('routes', modelName, routes))
  write(routesFs, `// @generated\nexport const ${lower}Routes = ['/` + lower + `'];\n`)
  track(`routes:${modelName}:${routes}`, routesFs, esmImport(cfg, id('routes', modelName), cfg.useBarrels))
  trackFile('routes', modelName, routes)

  const ctrlFs = filePath(cfg, id('controllers', modelName, controller))
  const importDto = esmImport(cfg, id('contracts', modelName), true)
  write(ctrlFs, `// @generated\nimport type { ${modelName}CreateDTO } from '${importDto}'\nexport const create${modelName} = (input:${modelName}CreateDTO) => {}\n`)
  track(`controllers:${modelName}:${controller}`, ctrlFs, esmImport(cfg, id('controllers', modelName), cfg.useBarrels))
  trackFile('controllers', modelName, controller)

  const svcFs = filePath(cfg, id('services', modelName, service))
  write(svcFs, `// @generated\nexport const ${lower}Service = {}\n`)
  track(`services:${modelName}:${service}`, svcFs, esmImport(cfg, id('services', modelName), cfg.useBarrels))
  trackFile('services', modelName, service)

  const loaderFs = filePath(cfg, id('loaders', modelName, loader))
  write(loaderFs, `// @generated\nexport const ${lower}Loader = {}\n`)
  track(`loaders:${modelName}:${loader}`, loaderFs, esmImport(cfg, id('loaders', modelName), cfg.useBarrels))
  trackFile('loaders', modelName, loader)

  const telemFs = filePath(cfg, id('telemetry', undefined, telemetry))
  write(telemFs, `// @generated\nexport const ${lower}Telemetry = {}\n`)
  track(`telemetry:${modelName}:${telemetry}`, telemFs, esmImport(cfg, id('telemetry'), cfg.useBarrels))
  trackFile('telemetry', modelName, telemetry)
}

const renderOpenAPI = (cfg: PathsConfig, models: string[]) => {
  const spec = {
    openapi: '3.1.0',
    info: { title: 'SSOT Codegen POC', version: '0.4.0' },
    paths: Object.fromEntries(models.map(m => [`/${m.toLowerCase()}`, { get: { summary: `List ${m}`, responses: { '200': { description: 'OK' } } } }])),
    components: { schemas: Object.fromEntries(models.map(m => [`${m}ReadDTO`, { type: 'object', properties: { id: { type: 'integer' } } }])) }
  }
  write(filePath(cfg, { layer: 'openapi', file: 'openapi.json' }), JSON.stringify(spec, null, 2))
}

const writeManifest = (cfg: PathsConfig, schemaHash: string, models: string[], toolVersion: string) => {
  const outputs = Object.keys(pathMap).map(k => ({ id: k, fs: pathMap[k].fs, esm: pathMap[k].esm }))
  const manifest = {
    schemaHash,
    toolVersion,
    generated: new Date().toISOString(),
    outputs,
    pathMap
  }
  const manifestFs = filePath(cfg, { layer: 'manifests', file: 'build.json' })
  write(manifestFs, JSON.stringify(manifest, null, 2))
}

const emitTsConfigPaths = (cfg: PathsConfig, rootDir: string) => {
  const pathsConfig = {
    compilerOptions: {
      paths: {
        [`${cfg.alias}/*`]: [`${cfg.rootDir}/*`]
      }
    }
  }
  const pathsFile = path.join(rootDir, 'tsconfig.paths.json')
  write(pathsFile, JSON.stringify(pathsConfig, null, 2))
}

export interface GeneratorInput {
  dmmf: unknown
  config: GeneratorConfig & {
    projectName?: string
    description?: string
    framework?: 'express' | 'fastify'
    scaffold?: boolean
  }
}

export const runGenerator = async (input: GeneratorInput) => {
  const { dmmf, config } = input
  const cfg = { ...defaultPaths, ...config.paths, rootDir: config.output || defaultPaths.rootDir }
  const normalized = normalize(dmmf)
  const models = normalized.models.map(m => m.name)
  const schemaHash = hash(config.schemaText || '')
  const toolVersion = '0.4.0'
  
  console.log(`[ssot-codegen] Generating for ${models.length} model(s): ${models.join(', ')}`)
  
  // Generate per-model artifacts
  for (const model of models) {
    renderModel(cfg, model)
  }
  
  // Generate barrels
  emitBarrels(cfg, models)
  
  // Generate OpenAPI spec
  renderOpenAPI(cfg, models)
  
  // Write manifest
  writeManifest(cfg, schemaHash, models, toolVersion)
  
  // Emit tsconfig paths
  emitTsConfigPaths(cfg, path.resolve('.'))
  
  console.log(`[ssot-codegen] Generated ${Object.keys(pathMap).length} files`)
  return { models, outputs: Object.keys(pathMap).length }
}
