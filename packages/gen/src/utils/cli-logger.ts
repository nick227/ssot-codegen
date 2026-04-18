/**
 * CLI Logger - Enhanced feedback for code generation
 * 
 * Provides colorized, structured output with progress tracking
 */

import { performance } from 'node:perf_hooks'

export type LogLevel = 'silent' | 'minimal' | 'normal' | 'verbose' | 'debug'

interface LoggerConfig {
  level: LogLevel
  useColors: boolean
  showTimestamps: boolean
}

interface GenerationPhase {
  name: string
  startTime: number
  endTime?: number
  filesGenerated?: number
  warnings?: string[]
}

interface ModelProgress {
  modelName: string
  phase: 'parsing' | 'generating' | 'writing' | 'complete'
  filesGenerated: number
  startTime: number
  endTime?: number
}

export class CLILogger {
  private config: LoggerConfig
  private phases: Map<string, GenerationPhase> = new Map()
  private modelProgress: Map<string, ModelProgress> = new Map()
  private startTime: number = 0
  private warnings: string[] = []
  
  constructor(config: {
    level?: LogLevel
    useColors?: boolean
    showTimestamps?: boolean
  } = {}) {
    this.config = {
      level: config.level || 'normal',
      useColors: config.useColors ?? true,
      showTimestamps: config.showTimestamps ?? false
    }
  }
  
  // Color helpers (using ANSI codes)
  private colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    
    // Foreground colors
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    
    // Background colors
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
  }
  
  private colorize(text: string, color: keyof typeof this.colors): string {
    if (!this.config.useColors) return text
    return `${this.colors[color]}${text}${this.colors.reset}`
  }
  
  private timestamp(): string {
    if (!this.config.showTimestamps) return ''
    const now = new Date()
    return this.colorize(`[${now.toLocaleTimeString()}]`, 'gray') + ' '
  }
  
  /**
   * Start generation process
   */
  startGeneration(): void {
    this.startTime = performance.now()
    
    if (this.config.level === 'silent') return
    
    console.log(this.colorize('\n╭─────────────────────────────────────────────╮', 'cyan'))
    console.log(this.colorize('│', 'cyan') + this.colorize('   🚀 SSOT Code Generator                 ', 'bold') + this.colorize('│', 'cyan'))
    console.log(this.colorize('╰─────────────────────────────────────────────╯\n', 'cyan'))
  }
  
  /**
   * Log schema parsing
   */
  logSchemaParsed(modelCount: number, enumCount: number, relationCount: number): void {
    if (this.config.level === 'silent') return
    
    console.log(this.colorize('📊 Schema Analysis', 'bold'))
    console.log(this.colorize(`   ├─ ${modelCount} models`, 'cyan'))
    console.log(this.colorize(`   ├─ ${enumCount} enums`, 'cyan'))
    console.log(this.colorize(`   └─ ${relationCount} relationships`, 'cyan'))
    console.log('')
  }
  
  /**
   * Start a generation phase
   */
  startPhase(name: string): void {
    const phase: GenerationPhase = {
      name,
      startTime: performance.now()
    }
    this.phases.set(name, phase)
    
    if (this.config.level === 'verbose' || this.config.level === 'debug') {
      console.log(this.timestamp() + this.colorize(`⏳ ${name}...`, 'blue'))
    }
  }
  
  /**
   * End a generation phase
   */
  endPhase(name: string, filesGenerated?: number, warnings?: string[]): void {
    const phase = this.phases.get(name)
    if (!phase) return
    
    phase.endTime = performance.now()
    phase.filesGenerated = filesGenerated
    phase.warnings = warnings
    
    const duration = phase.endTime - phase.startTime
    
    if (this.config.level === 'verbose' || this.config.level === 'debug') {
      const fileInfo = filesGenerated ? ` (${filesGenerated} files)` : ''
      const timeInfo = this.colorize(`${duration.toFixed(0)}ms`, 'gray')
      console.log(this.timestamp() + this.colorize(`✓ ${name}`, 'green') + fileInfo + ` ${timeInfo}`)
      
      if (warnings && warnings.length > 0) {
        warnings.forEach(w => this.warn(w))
      }
    }
  }
  
  /**
   * Log model generation start
   */
  startModel(modelName: string): void {
    const progress: ModelProgress = {
      modelName,
      phase: 'generating',
      filesGenerated: 0,
      startTime: performance.now()
    }
    this.modelProgress.set(modelName, progress)
    
    if (this.config.level === 'verbose' || this.config.level === 'debug') {
      console.log(this.timestamp() + this.colorize(`  📦 Generating ${modelName}...`, 'blue'))
    }
  }
  
  /**
   * Log model generation complete
   */
  completeModel(modelName: string, filesGenerated: number): void {
    const progress = this.modelProgress.get(modelName)
    if (!progress) return
    
    progress.phase = 'complete'
    progress.filesGenerated = filesGenerated
    progress.endTime = performance.now()
    
    if (this.config.level === 'verbose' || this.config.level === 'debug') {
      const duration = progress.endTime - progress.startTime
      console.log(
        this.timestamp() + 
        this.colorize(`  ✓ ${modelName}`, 'green') + 
        this.colorize(` (${filesGenerated} files, ${duration.toFixed(0)}ms)`, 'gray')
      )
    }
  }
  
  /**
   * Log normal progress in normal mode
   */
  logProgress(message: string): void {
    if (this.config.level === 'silent' || this.config.level === 'minimal') return
    
    console.log(this.timestamp() + this.colorize(`▸ ${message}`, 'cyan'))
  }
  
  /**
   * Log warning
   */
  warn(message: string): void {
    if (this.config.level === 'silent') return
    
    this.warnings.push(message)
    console.log(this.timestamp() + this.colorize(`⚠ ${message}`, 'yellow'))
  }
  
  /**
   * Log error
   */
  error(message: string, error?: Error): void {
    console.error(this.timestamp() + this.colorize(`✗ ${message}`, 'red'))
    if (error && (this.config.level === 'verbose' || this.config.level === 'debug')) {
      console.error(this.colorize(error.stack || error.message, 'red'))
    }
  }
  
  /**
   * Log debug info
   */
  debug(message: string, data?: unknown): void {
    if (this.config.level !== 'debug') return
    
    console.log(this.timestamp() + this.colorize(`🔍 ${message}`, 'gray'))
    if (data) {
      console.log(this.colorize(JSON.stringify(data, null, 2), 'gray'))
    }
  }
  
  /**
   * Log junction table detection
   */
  logJunctionTable(modelName: string): void {
    this.warn(`Junction table detected: ${modelName} - generating DTOs/validators only`)
  }
  
  /**
   * Complete generation with summary
   */
  completeGeneration(totalFiles: number): void {
    if (this.config.level === 'silent') return
    
    const totalTime = performance.now() - this.startTime
    const seconds = (totalTime / 1000).toFixed(2)
    
    console.log('')
    console.log(this.colorize('╭─────────────────────────────────────────────╮', 'green'))
    console.log(this.colorize('│', 'green') + this.colorize('   ✅ Generation Complete                  ', 'bold') + this.colorize('│', 'green'))
    console.log(this.colorize('╰─────────────────────────────────────────────╯', 'green'))
    console.log('')
    
    // Summary stats
    console.log(this.colorize('📈 Summary', 'bold'))
    console.log(this.colorize(`   ├─ Files generated: ${totalFiles}`, 'green'))
    console.log(this.colorize(`   ├─ Models processed: ${this.modelProgress.size}`, 'green'))
    console.log(this.colorize(`   ├─ Total time: ${seconds}s`, 'green'))
    
    if (this.warnings.length > 0) {
      console.log(this.colorize(`   ├─ Warnings: ${this.warnings.length}`, 'yellow'))
    }
    
    // Performance breakdown (verbose only)
    if (this.config.level === 'verbose' || this.config.level === 'debug') {
      console.log(this.colorize(`   └─ Avg: ${(totalFiles / (totalTime / 1000)).toFixed(0)} files/sec`, 'gray'))
      console.log('')
      this.printPhaseBreakdown()
    } else {
      console.log(this.colorize(`   └─ Performance: ${(totalFiles / (totalTime / 1000)).toFixed(0)} files/sec`, 'gray'))
    }
    
    console.log('')
  }
  
  /**
   * Print detailed phase breakdown
   */
  private printPhaseBreakdown(): void {
    if (this.phases.size === 0) return
    
    console.log(this.colorize('⏱  Phase Breakdown', 'bold'))
    
    const sortedPhases = Array.from(this.phases.values())
      .filter(p => p.endTime)
      .sort((a, b) => (b.endTime! - b.startTime) - (a.endTime! - a.startTime))
    
    sortedPhases.forEach(phase => {
      const duration = phase.endTime! - phase.startTime
      const percentage = ((duration / (performance.now() - this.startTime)) * 100).toFixed(1)
      console.log(
        this.colorize(`   ├─ ${phase.name.padEnd(25)}`, 'gray') +
        this.colorize(`${duration.toFixed(0)}ms`, 'cyan') +
        this.colorize(` (${percentage}%)`, 'gray')
      )
    })
    console.log('')
  }
  
  /**
   * Print generation table (for normal mode)
   */
  printGenerationTable(breakdown: { layer: string; count: number }[]): void {
    if (this.config.level === 'silent' || this.config.level === 'minimal') return
    if (this.config.level === 'verbose' || this.config.level === 'debug') return
    
    console.log(this.colorize('📁 Generated Files', 'bold'))
    
    breakdown.forEach(({ layer, count }) => {
      const bar = this.createProgressBar(count, 50, 10)
      console.log(`   ├─ ${layer.padEnd(15)} ${this.colorize(String(count).padStart(3), 'cyan')} ${bar}`)
    })
    console.log('')
  }
  
  /**
   * Create a simple progress bar
   */
  private createProgressBar(value: number, maxValue: number, width: number = 20): string {
    const percentage = Math.min(value / maxValue, 1)
    const filled = Math.floor(percentage * width)
    const empty = width - filled
    
    const bar = this.colorize('█'.repeat(filled), 'green') + 
                this.colorize('░'.repeat(empty), 'gray')
    
    return bar
  }
}

/**
 * Create logger instance
 */
export function createLogger(config?: {
  level?: LogLevel
  useColors?: boolean
  showTimestamps?: boolean
}): CLILogger {
  return new CLILogger(config)
}

