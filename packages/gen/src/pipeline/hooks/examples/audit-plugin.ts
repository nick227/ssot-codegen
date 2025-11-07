/**
 * Example: Audit Plugin using Phase Hooks
 * 
 * Tracks all generation activity for compliance/auditing
 */

import { beforePhase, afterPhase, onError } from '../phase-hooks.js'
import { writeFile } from 'fs/promises'
import type { BaseContext } from '@/pipeline/typed-context.js'

interface AuditLog {
  timestamp: Date
  phase: string
  type: 'start' | 'success' | 'error'
  filesGenerated?: number
  duration?: number
  error?: string
}

class AuditTracker {
  private logs: AuditLog[] = []
  private phaseStarts = new Map<string, Date>()
  
  logPhaseStart(phaseName: string) {
    const timestamp = new Date()
    this.phaseStarts.set(phaseName, timestamp)
    this.logs.push({
      timestamp,
      phase: phaseName,
      type: 'start'
    })
  }
  
  logPhaseSuccess(phaseName: string, filesGenerated?: number) {
    const startTime = this.phaseStarts.get(phaseName)
    const duration = startTime ? Date.now() - startTime.getTime() : undefined
    
    this.logs.push({
      timestamp: new Date(),
      phase: phaseName,
      type: 'success',
      filesGenerated,
      duration
    })
  }
  
  logPhaseError(phaseName: string, error: Error) {
    const startTime = this.phaseStarts.get(phaseName)
    const duration = startTime ? Date.now() - startTime.getTime() : undefined
    
    this.logs.push({
      timestamp: new Date(),
      phase: phaseName,
      type: 'error',
      error: error.message,
      duration
    })
  }
  
  async exportToFile(outputPath: string) {
    const report = {
      generatedAt: new Date().toISOString(),
      logs: this.logs,
      summary: {
        totalPhases: new Set(this.logs.map(l => l.phase)).size,
        successfulPhases: this.logs.filter(l => l.type === 'success').length,
        failedPhases: this.logs.filter(l => l.type === 'error').length,
        totalFilesGenerated: this.logs
          .filter(l => l.filesGenerated)
          .reduce((sum, l) => sum + (l.filesGenerated || 0), 0)
      }
    }
    
    await writeFile(outputPath, JSON.stringify(report, null, 2))
  }
}

const auditTracker = new AuditTracker()

/**
 * Register audit hooks for compliance tracking
 */
export function registerAuditHooks(outputPath = './generation-audit.json') {
  // Track all phase starts
  const phases = [
    'setupOutputDir',
    'parseSchema',
    'validateSchema',
    'analyzeRelationships',
    'generateCode',
    'writeFiles',
    'writeInfrastructure',
    'generateBarrels',
    'generateOpenAPI',
    'writeManifest',
    'generateTsConfig',
    'writeStandalone',
    'writeTests',
    'formatCode'
  ]
  
  for (const phaseName of phases) {
    beforePhase(phaseName, async () => {
      auditTracker.logPhaseStart(phaseName)
    })
    
    afterPhase(phaseName, async (context: BaseContext, result) => {
      auditTracker.logPhaseSuccess(phaseName, result.filesGenerated)
    })
  }
  
  // Track errors
  onError(async (phaseName, error) => {
    auditTracker.logPhaseError(phaseName, error)
  })
  
  // Export audit log after all phases complete
  afterPhase('formatCode', async () => {
    await auditTracker.exportToFile(outputPath)
    console.log(`\n📄 Audit log exported to: ${outputPath}`)
  })
}

export { auditTracker }

