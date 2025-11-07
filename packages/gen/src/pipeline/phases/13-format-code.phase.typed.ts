/**
 * Phase 13: Format Code (Strongly-Typed)
 * 
 * Optional phase that formats all generated code with Prettier.
 * Only runs if SSOT_FORMAT_CODE=true or --format flag.
 * 
 * MIGRATION STATUS: ✅ Migrated to typed context
 */

import { readFile, writeFile as fsWriteFile } from 'node:fs/promises'
import { TypedPhaseAdapter } from '../typed-phase-adapter.js'
import { formatCode, isFormattingEnabled } from '../../utils/formatter.js'
import { getTrackedPaths } from '../phase-utilities.js'
import pLimit from 'p-limit'
import type { 
  ContextAfterPhase12, 
  FormatCodeOutput 
} from '../typed-context.js'

const CONCURRENT_FORMATS = parseInt(process.env.SSOT_FORMAT_CONCURRENCY || '10', 10)

export class FormatCodePhaseTyped extends TypedPhaseAdapter<
  ContextAfterPhase12,    // Requires: Phase 0-12 outputs (complete context)
  FormatCodeOutput        // Provides: (code formatted)
> {
  readonly name = 'formatCode'
  readonly order = 13
  
  shouldRunTyped(): boolean {
    return isFormattingEnabled()
  }
  
  getDescription(): string {
    return 'Formatting generated code with Prettier'
  }
  
  /**
   * Strongly-typed execution
   * 
   * TypeScript guarantees:
   * - All previous phase outputs exist
   * - context.logger exists (from BaseContext)
   * 
   * NO RUNTIME CHECKS NEEDED!
   */
  async executeTyped(context: ContextAfterPhase12): Promise<FormatCodeOutput> {
    const { logger } = context
    
    const pathMap = getTrackedPaths()
    const filePaths = Object.values(pathMap).map(p => p.fs)
    
    // Filter to only TypeScript/JavaScript files
    const codeFiles = filePaths.filter(fp => 
      fp.endsWith('.ts') || 
      fp.endsWith('.js') || 
      fp.endsWith('.tsx') || 
      fp.endsWith('.jsx')
    )
    
    if (codeFiles.length === 0) {
      return {}
    }
    
    // Format files with concurrency limit to avoid overwhelming the system
    const limit = pLimit(CONCURRENT_FORMATS)
    let formatted = 0
    
    const formats = codeFiles.map(filePath => 
      limit(async () => {
        try {
          const content = await readFile(filePath, 'utf8')
          const formattedContent = await formatCode(content, filePath)
          
          // Only write if content changed
          if (formattedContent !== content) {
            await fsWriteFile(filePath, formattedContent, 'utf8')
            formatted++
          }
        } catch (error) {
          // Log but don't fail - formatting errors shouldn't break generation
          logger.debug(`Failed to format ${filePath}: ${(error as Error).message}`)
        }
      })
    )
    
    await Promise.all(formats)
    
    if (formatted > 0) {
      logger.debug(`Formatted ${formatted} files`)
    }
    
    // Return empty object (phase doesn't add data to context)
    return {}
  }
}

