/**
 * Phase 13: Format Code
 * 
 * Optional phase that formats all generated code with Prettier
 * Only runs if SSOT_FORMAT_CODE=true
 */

import path from 'node:path'
import { readFile, writeFile as fsWriteFile } from 'node:fs/promises'
import { GenerationPhase, type PhaseContext, type PhaseResult } from '../phase-runner.js'
import { formatCode, isFormattingEnabled } from '@/utils/formatter.js'
import { getTrackedPaths } from '../phase-utilities.js'
import pLimit from 'p-limit'

const CONCURRENT_FORMATS = parseInt(process.env.SSOT_FORMAT_CONCURRENCY || '10', 10)

export class FormatCodePhase extends GenerationPhase {
  readonly name = 'formatCode'
  readonly order = 13
  
  shouldRun(): boolean {
    return isFormattingEnabled()
  }
  
  getDescription(): string {
    return 'Formatting generated code with Prettier'
  }
  
  async execute(context: PhaseContext): Promise<PhaseResult> {
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
      return { success: true, filesGenerated: 0 }
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
          context.logger?.debug(`Failed to format ${filePath}: ${(error as Error).message}`)
        }
      })
    )
    
    await Promise.all(formats)
    
    if (formatted > 0 && context.logger) {
      context.logger.debug(`Formatted ${formatted} files`)
    }
    
    return {
      success: true,
      filesGenerated: 0, // Don't count as "generated" files, just formatted existing ones
      data: { formattedCount: formatted, totalChecked: codeFiles.length }
    }
  }
}

