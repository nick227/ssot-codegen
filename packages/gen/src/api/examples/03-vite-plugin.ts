/**
 * Example 3: Vite Plugin Integration
 * 
 * Shows how to integrate SSOT Codegen into Vite build process
 */

import { generate } from '../index.js'
import type { Plugin } from 'vite'

export interface SSOTCodegenPluginOptions {
  /** Path to Prisma schema */
  schema: string
  
  /** Output directory for generated code */
  output?: string
  
  /** Framework to generate for */
  framework?: 'express' | 'fastify'
  
  /** Generate on every build or only first time */
  watchMode?: boolean
}

/**
 * Vite plugin for SSOT Codegen
 * 
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite'
 * import { ssotCodegen } from './ssot-codegen-plugin'
 * 
 * export default defineConfig({
 *   plugins: [
 *     ssotCodegen({
 *       schema: './prisma/schema.prisma',
 *       output: './src/api',
 *       framework: 'express'
 *     })
 *   ]
 * })
 * ```
 */
export function ssotCodegen(options: SSOTCodegenPluginOptions): Plugin {
  let hasGenerated = false
  
  return {
    name: 'ssot-codegen',
    
    async buildStart() {
      // Skip if already generated (unless in watch mode)
      if (hasGenerated && !options.watchMode) {
        return
      }
      
      console.log('\n🔧 [SSOT] Generating API code...\n')
      
      try {
        const result = await generate({
          schema: options.schema,
          output: options.output || './src/api',
          framework: options.framework || 'express',
          standalone: false,  // Don't generate package.json, etc.
          verbosity: 'minimal',
          
          onProgress: (event) => {
            if (event.type === 'phase:end') {
              console.log(`  ✅ ${event.message}`)
            }
          }
        })
        
        if (!result.success) {
          throw new Error('Code generation failed')
        }
        
        console.log(`\n✅ [SSOT] Generated ${result.filesCreated} files\n`)
        hasGenerated = true
        
      } catch (error) {
        console.error('\n❌ [SSOT] Generation failed:', error)
        throw error
      }
    }
  }
}

