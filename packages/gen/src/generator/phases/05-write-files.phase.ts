/**
 * Phase 5: Write Files
 * 
 * Writes all generated code files to disk
 */

import path from 'node:path'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { writeFile, trackPath, createPathId, generateEsmPath } from '../phase-utilities.js'
import { toKebabCase } from '../../utils/naming.js'

export class WriteFilesPhase extends GenerationPhase {
  readonly name = 'writeFiles'
  readonly order = 5
  
  getDescription(): string {
    return 'Writing files to disk'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
    const { generatedFiles, pathsConfig: cfg } = context
    
    if (!generatedFiles || !cfg) {
      throw new Error('Generated files or paths config not found in context')
    }
    
    const writes: Promise<void>[] = []
    
    // Write contracts
    for (const [modelName, fileMap] of generatedFiles.contracts) {
      const modelKebab = toKebabCase(modelName)
      for (const [filename, content] of fileMap) {
        const filePath = path.join(cfg.rootDir, 'contracts', modelKebab, filename)
        writes.push(writeFile(filePath, content))
        trackPath(`contracts:${modelName}:${filename}`, filePath, generateEsmPath(cfg, 'contracts', modelName))
      }
    }
    
    // Write validators
    for (const [modelName, fileMap] of generatedFiles.validators) {
      const modelKebab = toKebabCase(modelName)
      for (const [filename, content] of fileMap) {
        const filePath = path.join(cfg.rootDir, 'validators', modelKebab, filename)
        writes.push(writeFile(filePath, content))
        trackPath(`validators:${modelName}:${filename}`, filePath, generateEsmPath(cfg, 'validators', modelName))
      }
    }
    
    // Write services
    for (const [filename, content] of generatedFiles.services) {
      const modelName = filename.replace('.service.ts', '').replace('.service.scaffold.ts', '')
      const modelKebab = toKebabCase(modelName)
      const filePath = path.join(cfg.rootDir, 'services', modelKebab, filename)
      writes.push(writeFile(filePath, content))
      trackPath(`services:${modelName}:${filename}`, filePath, generateEsmPath(cfg, 'services', modelName))
    }
    
    // Write controllers
    for (const [filename, content] of generatedFiles.controllers) {
      const modelName = filename.replace('.controller.ts', '')
      const modelKebab = toKebabCase(modelName)
      const filePath = path.join(cfg.rootDir, 'controllers', modelKebab, filename)
      writes.push(writeFile(filePath, content))
      trackPath(`controllers:${modelName}:${filename}`, filePath, generateEsmPath(cfg, 'controllers', modelName))
    }
    
    // Write routes
    for (const [filename, content] of generatedFiles.routes) {
      const modelName = filename.replace('.routes.ts', '')
      const modelKebab = toKebabCase(modelName)
      const filePath = path.join(cfg.rootDir, 'routes', modelKebab, filename)
      writes.push(writeFile(filePath, content))
      trackPath(`routes:${modelName}:${filename}`, filePath, generateEsmPath(cfg, 'routes', modelName))
    }
    
    // Write registry files
    if (generatedFiles.registry) {
      for (const [filename, content] of generatedFiles.registry) {
        const filePath = path.join(cfg.rootDir, 'registry', filename)
        writes.push(writeFile(filePath, content))
        trackPath(`registry:${filename}`, filePath, generateEsmPath(cfg, 'registry', undefined, filename))
      }
    }
    
    // Write SDK files
    for (const [filename, content] of generatedFiles.sdk) {
      const filePath = path.join(cfg.rootDir, 'sdk', filename)
      writes.push(writeFile(filePath, content))
      trackPath(`sdk:${filename}`, filePath, generateEsmPath(cfg, 'sdk', undefined, filename))
    }
    
    // Write hooks files
    for (const [filename, content] of generatedFiles.hooks.core) {
      const filePath = path.join(cfg.rootDir, 'sdk', 'core', 'queries', filename)
      writes.push(writeFile(filePath, content))
      trackPath(`hooks:core:${filename}`, filePath, `${cfg.alias}/sdk/core/queries/${filename.replace('.ts', '')}`)
    }
    
    if (generatedFiles.hooks.react) {
      for (const [filename, content] of generatedFiles.hooks.react) {
        const filePath = path.join(cfg.rootDir, 'sdk', 'react', filename)
        writes.push(writeFile(filePath, content))
        trackPath(`hooks:react:${filename}`, filePath, `${cfg.alias}/sdk/react/${filename.replace('.ts', '').replace('.tsx', '')}`)
      }
    }
    
    // Write checklist files
    if (generatedFiles.checklist) {
      for (const [filename, content] of generatedFiles.checklist) {
        const srcPath = path.join(cfg.rootDir, 'checklist', filename)
        writes.push(writeFile(srcPath, content))
        trackPath(`checklist:${filename}`, srcPath, `${cfg.alias}/checklist/${filename}`)
        
        if (filename.endsWith('.html')) {
          const publicPath = path.join(cfg.rootDir, '..', 'public', filename)
          writes.push(writeFile(publicPath, content))
        }
      }
    }
    
    // Write plugin files
    if (generatedFiles.plugins) {
      for (const [pluginName, pluginFiles] of generatedFiles.plugins) {
        for (const [filename, content] of pluginFiles) {
          const filePath = path.join(cfg.rootDir, filename)
          writes.push(writeFile(filePath, content))
          trackPath(`plugin:${pluginName}:${filename}`, filePath, `${cfg.alias}/${filename.replace('.ts', '')}`)
        }
      }
    }
    
    await Promise.all(writes)
    
    return {
      success: true
    }
  }
}

