/**
 * Phase 5: Write Files
 * 
 * Writes all generated code files to disk
 */

import fs from 'node:fs'
import path from 'node:path'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { esmImport } from '../../path-resolver.js'

const ensureDir = async (p: string) => fs.promises.mkdir(p, { recursive: true })
const write = async (file: string, content: string) => { 
  await ensureDir(path.dirname(file))
  await fs.promises.writeFile(file, content, 'utf8')
}

const pathMap: Record<string, { fs: string; esm: string }> = {}
const track = (idStr: string, fsPath: string, esmPath: string) => {
  pathMap[idStr] = { fs: fsPath, esm: esmPath }
}

const id = (layer: string, model?: string, file?: string) => ({ layer, model, file })

export class WriteFilesPhase extends GenerationPhase {
  readonly name = 'writeFiles'
  readonly order = 5
  
  getDescription(): string {
    return 'Writing files to disk'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { generatedFiles, pathsConfig: cfg, modelNames } = context as any
    
    if (!generatedFiles || !cfg) {
      throw new Error('Generated files or paths config not found in context')
    }
    
    const writes: Promise<void>[] = []
    
    // Write contracts
    for (const [modelName, fileMap] of generatedFiles.contracts) {
      for (const [filename, content] of fileMap) {
        const filePath = path.join(cfg.rootDir, 'contracts', modelName.toLowerCase(), filename)
        writes.push(write(filePath, content))
        track(`contracts:${modelName}:${filename}`, filePath, esmImport(cfg, id('contracts', modelName)))
      }
    }
    
    // Write validators
    for (const [modelName, fileMap] of generatedFiles.validators) {
      for (const [filename, content] of fileMap) {
        const filePath = path.join(cfg.rootDir, 'validators', modelName.toLowerCase(), filename)
        writes.push(write(filePath, content))
        track(`validators:${modelName}:${filename}`, filePath, esmImport(cfg, id('validators', modelName)))
      }
    }
    
    // Write services
    for (const [filename, content] of generatedFiles.services) {
      const modelName = filename.replace('.service.ts', '').replace('.service.scaffold', '')
      const filePath = path.join(cfg.rootDir, 'services', modelName, filename)
      writes.push(write(filePath, content))
      track(`services:${modelName}:${filename}`, filePath, esmImport(cfg, id('services', modelName)))
    }
    
    // Write controllers
    for (const [filename, content] of generatedFiles.controllers) {
      const modelName = filename.replace('.controller.ts', '')
      const filePath = path.join(cfg.rootDir, 'controllers', modelName, filename)
      writes.push(write(filePath, content))
      track(`controllers:${modelName}:${filename}`, filePath, esmImport(cfg, id('controllers', modelName)))
    }
    
    // Write routes
    for (const [filename, content] of generatedFiles.routes) {
      const modelName = filename.replace('.routes.ts', '')
      const filePath = path.join(cfg.rootDir, 'routes', modelName, filename)
      writes.push(write(filePath, content))
      track(`routes:${modelName}:${filename}`, filePath, esmImport(cfg, id('routes', modelName)))
    }
    
    // Write registry files
    if (generatedFiles.registry) {
      for (const [filename, content] of generatedFiles.registry) {
        const filePath = path.join(cfg.rootDir, 'registry', filename)
        writes.push(write(filePath, content))
        track(`registry:${filename}`, filePath, esmImport(cfg, id('registry', undefined, filename)))
      }
    }
    
    // Write SDK files
    for (const [filename, content] of generatedFiles.sdk) {
      const filePath = path.join(cfg.rootDir, 'sdk', filename)
      writes.push(write(filePath, content))
      track(`sdk:${filename}`, filePath, esmImport(cfg, id('sdk', undefined, filename)))
    }
    
    // Write hooks files
    for (const [filename, content] of generatedFiles.hooks.core) {
      const filePath = path.join(cfg.rootDir, 'sdk', 'core', 'queries', filename)
      writes.push(write(filePath, content))
      track(`hooks:core:${filename}`, filePath, `${cfg.alias}/sdk/core/queries/${filename.replace('.ts', '')}`)
    }
    
    if (generatedFiles.hooks.react) {
      for (const [filename, content] of generatedFiles.hooks.react) {
        const filePath = path.join(cfg.rootDir, 'sdk', 'react', filename)
        writes.push(write(filePath, content))
        track(`hooks:react:${filename}`, filePath, `${cfg.alias}/sdk/react/${filename.replace('.ts', '').replace('.tsx', '')}`)
      }
    }
    
    // Write checklist files
    if (generatedFiles.checklist) {
      for (const [filename, content] of generatedFiles.checklist) {
        const srcPath = path.join(cfg.rootDir, 'checklist', filename)
        writes.push(write(srcPath, content))
        track(`checklist:${filename}`, srcPath, `${cfg.alias}/checklist/${filename}`)
        
        if (filename.endsWith('.html')) {
          const publicPath = path.join(cfg.rootDir, '..', 'public', filename)
          writes.push(write(publicPath, content))
        }
      }
    }
    
    // Write plugin files
    if (generatedFiles.plugins) {
      for (const [pluginName, pluginFiles] of generatedFiles.plugins) {
        for (const [filename, content] of pluginFiles) {
          const filePath = path.join(cfg.rootDir, filename)
          writes.push(write(filePath, content))
          track(`plugin:${pluginName}:${filename}`, filePath, `${cfg.alias}/${filename.replace('.ts', '')}`)
        }
      }
    }
    
    await Promise.all(writes)
    
    return {
      success: true
    }
  }
}

