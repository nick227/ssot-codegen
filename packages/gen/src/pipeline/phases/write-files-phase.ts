/**
 * Write Files Phase - Persists generated code to disk
 * 
 * New pipeline-compatible version that uses IGenerationContext
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import {
  ErrorSeverity,
  PhaseStatus,
  type GenerationPhase,
  type PhaseResult,
  type IGenerationContext,
  type GenerationError
} from '../generation-types.js'

/**
 * Writes all generated files from context.filesBuilder to disk
 */
export class WriteFilesPhase implements GenerationPhase {
  readonly name = 'write-files'
  readonly order = 100  // Run last, after all generation phases
  
  shouldExecute(context: IGenerationContext): boolean {
    // Always write files
    return true
  }
  
  async execute(context: IGenerationContext): Promise<PhaseResult> {
    const errors: GenerationError[] = []
    let filesWritten = 0
    
    try {
      // Build final files from context
      const files = context.filesBuilder.build()
      
      // Determine output directory
      const outputDir = this.getOutputDir(context)
      
      console.log(`[ssot-codegen] Writing files to: ${outputDir}`)
      
      // Write contracts (DTOs)
      for (const [modelName, modelFiles] of files.contracts) {
        const modelDir = path.join(outputDir, 'dtos', modelName.toLowerCase())
        await fs.mkdir(modelDir, { recursive: true })
        
        for (const [filename, content] of modelFiles) {
          const filePath = path.join(modelDir, filename)
          await fs.writeFile(filePath, content, 'utf8')
          filesWritten++
        }
      }
      
      // Write validators
      for (const [modelName, modelFiles] of files.validators) {
        const modelDir = path.join(outputDir, 'validators', modelName.toLowerCase())
        await fs.mkdir(modelDir, { recursive: true })
        
        for (const [filename, content] of modelFiles) {
          const filePath = path.join(modelDir, filename)
          await fs.writeFile(filePath, content, 'utf8')
          filesWritten++
        }
      }
      
      // Write services
      const servicesDir = path.join(outputDir, 'services')
      await fs.mkdir(servicesDir, { recursive: true })
      for (const [filename, content] of files.services) {
        const filePath = path.join(servicesDir, filename)
        await fs.writeFile(filePath, content, 'utf8')
        filesWritten++
      }
      
      // Write controllers
      const controllersDir = path.join(outputDir, 'controllers')
      await fs.mkdir(controllersDir, { recursive: true })
      for (const [filename, content] of files.controllers) {
        const filePath = path.join(controllersDir, filename)
        await fs.writeFile(filePath, content, 'utf8')
        filesWritten++
      }
      
      // Write routes
      const routesDir = path.join(outputDir, 'routes')
      await fs.mkdir(routesDir, { recursive: true })
      for (const [filename, content] of files.routes) {
        const filePath = path.join(routesDir, filename)
        await fs.writeFile(filePath, content, 'utf8')
        filesWritten++
      }
      
      // Write SDK
      const sdkDir = path.join(outputDir, 'sdk')
      await fs.mkdir(sdkDir, { recursive: true })
      for (const [filename, content] of files.sdk) {
        const filePath = path.join(sdkDir, filename)
        // Create parent directories if filename includes subdirectories
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, content, 'utf8')
        filesWritten++
      }
      
      // Write registry (if present)
      if (files.registry) {
        const registryDir = path.join(outputDir, 'registry')
        await fs.mkdir(registryDir, { recursive: true })
        for (const [filename, content] of files.registry) {
          const filePath = path.join(registryDir, filename)
          await fs.writeFile(filePath, content, 'utf8')
          filesWritten++
        }
      }
      
      // Write hooks
      const hooksDir = path.join(outputDir, 'hooks')
      await fs.mkdir(hooksDir, { recursive: true })
      
      // Core hooks
      const coreHooksDir = path.join(hooksDir, 'core')
      await fs.mkdir(coreHooksDir, { recursive: true })
      for (const [filename, content] of files.hooks.core) {
        const filePath = path.join(coreHooksDir, filename)
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, content, 'utf8')
        filesWritten++
      }
      
      // Framework-specific hooks
      if (files.hooks.react) {
        const reactDir = path.join(hooksDir, 'react')
        await fs.mkdir(reactDir, { recursive: true })
        for (const [filename, content] of files.hooks.react) {
          const filePath = path.join(reactDir, filename)
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          await fs.writeFile(filePath, content, 'utf8')
          filesWritten++
        }
      }
      
      if (files.hooks.vue) {
        const vueDir = path.join(hooksDir, 'vue')
        await fs.mkdir(vueDir, { recursive: true })
        for (const [filename, content] of files.hooks.vue) {
          const filePath = path.join(vueDir, filename)
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          await fs.writeFile(filePath, content, 'utf8')
          filesWritten++
        }
      }
      
      if (files.hooks.zustand) {
        const zustandDir = path.join(hooksDir, 'zustand')
        await fs.mkdir(zustandDir, { recursive: true })
        for (const [filename, content] of files.hooks.zustand) {
          const filePath = path.join(zustandDir, filename)
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          await fs.writeFile(filePath, content, 'utf8')
          filesWritten++
        }
      }
      
      if (files.hooks.vanilla) {
        const vanillaDir = path.join(hooksDir, 'vanilla')
        await fs.mkdir(vanillaDir, { recursive: true })
        for (const [filename, content] of files.hooks.vanilla) {
          const filePath = path.join(vanillaDir, filename)
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          await fs.writeFile(filePath, content, 'utf8')
          filesWritten++
        }
      }
      
      if (files.hooks.angular) {
        const angularDir = path.join(hooksDir, 'angular')
        await fs.mkdir(angularDir, { recursive: true })
        for (const [filename, content] of files.hooks.angular) {
          const filePath = path.join(angularDir, filename)
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          await fs.writeFile(filePath, content, 'utf8')
          filesWritten++
        }
      }
      
      // Write checklist (if present)
      if (files.checklist) {
        for (const [filename, content] of files.checklist) {
          const filePath = path.join(outputDir, filename)
          await fs.writeFile(filePath, content, 'utf8')
          filesWritten++
        }
      }
      
      // Write plugins (if present)
      if (files.plugins) {
        for (const [pluginName, pluginFiles] of files.plugins) {
          const pluginDir = path.join(outputDir, 'plugins', pluginName)
          await fs.mkdir(pluginDir, { recursive: true })
          for (const [filename, content] of pluginFiles) {
            const filePath = path.join(pluginDir, filename)
            await fs.writeFile(filePath, content, 'utf8')
            filesWritten++
          }
        }
      }
      
      console.log(`[ssot-codegen] ✓ Wrote ${filesWritten} files to disk`)
      
      return {
        success: true,
        status: PhaseStatus.COMPLETED,
        errors: [],
        data: { filesWritten, outputDir }
      }
      
    } catch (error) {
      errors.push({
        severity: ErrorSeverity.FATAL,
        message: `Failed to write files: ${error instanceof Error ? error.message : String(error)}`,
        phase: this.name,
        error: error as Error
      })
      
      return {
        success: false,
        status: PhaseStatus.FAILED,
        errors
      }
    }
  }
  
  /**
   * Get output directory from context
   */
  private getOutputDir(context: IGenerationContext): string {
    // Try to get from context metadata or config
    // Default to './generated' if not specified
    return './generated'
  }
}

