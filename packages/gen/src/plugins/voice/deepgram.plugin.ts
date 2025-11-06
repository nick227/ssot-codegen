/**
 * Deepgram Provider Plugin
 * 
 * Speech-to-Text API integration
 * 
 * Features:
 * - Real-time transcription
 * - Pre-recorded audio transcription
 * - Multiple language support
 * - Diarization (speaker detection)
 * - Punctuation & formatting
 * - Word-level timestamps
 * - Confidence scores
 * 
 * Use Cases:
 * - Voice commands
 * - Meeting transcription
 * - Podcast transcription
 * - Call center analytics
 * - Accessibility (captions)
 */

import type {
  FeaturePlugin,
  PluginContext,
  PluginOutput,
  PluginRequirements,
  ValidationResult,
  HealthCheckSection
} from '../plugin.interface.js'

export interface DeepgramPluginConfig {
  /** Default model (default: 'nova-2') */
  defaultModel?: string
  
  /** Enable usage tracking (default: true) */
  enableUsageTracking?: boolean
  
  /** Request timeout in ms (default: 30000) */
  timeout?: number
}

export class DeepgramPlugin implements FeaturePlugin {
  name = 'deepgram'
  version = '1.0.0'
  description = 'Deepgram Speech-to-Text API integration'
  enabled = true
  
  private config: Required<DeepgramPluginConfig>
  
  constructor(config: DeepgramPluginConfig = {}) {
    this.config = {
      defaultModel: 'nova-2',
      enableUsageTracking: true,
      timeout: 30000,
      ...config
    }
  }
  
  requirements: PluginRequirements = {
    models: {
      required: [],
      optional: ['Transcription']
    },
    envVars: {
      required: ['DEEPGRAM_API_KEY'],
      optional: []
    },
    dependencies: {
      runtime: {
        '@deepgram/sdk': '^3.8.0'
      },
      dev: {}
    }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [], suggestions: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('voice/providers/deepgram.provider.ts', this.generateDeepgramProvider())
    files.set('voice/services/deepgram.service.ts', this.generateDeepgramService())
    files.set('voice/types/deepgram.types.ts', this.generateDeepgramTypes())
    files.set('voice/deepgram.ts', this.generateBarrelExport())
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: {
        DEEPGRAM_API_KEY: 'your-deepgram-api-key'
      },
      packageJson: {
        dependencies: this.requirements.dependencies!.runtime,
        devDependencies: {}
      }
    }
  }
  
  private generateDeepgramProvider(): string {
    return `// @generated
// Deepgram Provider - Speech-to-Text

import { createClient } from '@deepgram/sdk'
import type { TranscriptionOptions, TranscriptionResult } from '../types/deepgram.types.js'
import { logger } from '@/logger'

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

export const deepgramProvider = {
  name: 'deepgram',
  type: 'commercial' as const,
  
  /**
   * Transcribe audio file
   */
  async transcribe(audioBuffer: Buffer, options: TranscriptionOptions = {}): Promise<TranscriptionResult> {
    const startTime = Date.now()
    
    try {
      const { result } = await deepgram.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model: options.model || '${this.config.defaultModel}',
          language: options.language || 'en',
          punctuate: options.punctuate !== false,
          diarize: options.diarize || false,
          smart_format: options.smartFormat !== false,
          utterances: options.utterances || false,
          detect_language: options.detectLanguage || false
        }
      )
      
      const latency = Date.now() - startTime
      const transcript = result.results.channels[0].alternatives[0].transcript
      const confidence = result.results.channels[0].alternatives[0].confidence
      const words = result.results.channels[0].alternatives[0].words || []
      
      ${this.config.enableUsageTracking ? `
      logger.info({
        model: options.model || '${this.config.defaultModel}',
        duration: result.metadata.duration,
        confidence,
        latency
      }, 'Deepgram transcription complete')
      ` : ''}
      
      return {
        transcript,
        confidence,
        words: words.map(w => ({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: w.confidence,
          speaker: w.speaker
        })),
        language: result.results.channels[0].detected_language,
        duration: result.metadata.duration,
        latency
      }
    } catch (error) {
      logger.error({ error }, 'Deepgram transcription failed')
      throw error
    }
  },
  
  /**
   * Transcribe from URL
   */
  async transcribeUrl(url: string, options: TranscriptionOptions = {}): Promise<TranscriptionResult> {
    const startTime = Date.now()
    
    try {
      const { result } = await deepgram.listen.prerecorded.transcribeUrl(
        { url },
        {
          model: options.model || '${this.config.defaultModel}',
          language: options.language || 'en',
          punctuate: options.punctuate !== false,
          diarize: options.diarize || false
        }
      )
      
      const latency = Date.now() - startTime
      const transcript = result.results.channels[0].alternatives[0].transcript
      
      return {
        transcript,
        confidence: result.results.channels[0].alternatives[0].confidence,
        words: [],
        duration: result.metadata.duration,
        latency
      }
    } catch (error) {
      logger.error({ error }, 'Deepgram URL transcription failed')
      throw error
    }
  },
  
  /**
   * Get available models
   */
  listModels(): string[] {
    return ['nova-2', 'nova', 'enhanced', 'base', 'whisper']
  },
  
  /**
   * Get provider info
   */
  getInfo() {
    return {
      name: 'Deepgram',
      type: 'commercial' as const,
      features: {
        realtimeTranscription: true,
        prerecordedTranscription: true,
        diarization: true,
        languageDetection: true,
        punctuation: true,
        timestamps: true
      }
    }
  }
}

export { deepgram }
`
  }
  
  private generateDeepgramService(): string {
    return `// @generated
// Deepgram Service - High-level API

import { deepgramProvider } from '../providers/deepgram.provider.js'
import type { TranscriptionOptions } from '../types/deepgram.types.js'
import fs from 'node:fs/promises'

export const deepgramService = {
  /**
   * Transcribe audio file from path
   */
  async transcribeFile(filePath: string, options: TranscriptionOptions = {}): Promise<string> {
    const buffer = await fs.readFile(filePath)
    const result = await deepgramProvider.transcribe(buffer, options)
    return result.transcript
  },
  
  /**
   * Transcribe from URL
   */
  async transcribeUrl(url: string, options: TranscriptionOptions = {}): Promise<string> {
    const result = await deepgramProvider.transcribeUrl(url, options)
    return result.transcript
  },
  
  /**
   * Transcribe with full details
   */
  async transcribeDetailed(buffer: Buffer, options: TranscriptionOptions = {}) {
    return deepgramProvider.transcribe(buffer, options)
  }
}

export { deepgramProvider }
`
  }
  
  private generateDeepgramTypes(): string {
    return `// @generated
// Deepgram Type Definitions

export interface TranscriptionOptions {
  model?: string
  language?: string
  punctuate?: boolean
  diarize?: boolean
  smartFormat?: boolean
  utterances?: boolean
  detectLanguage?: boolean
}

export interface TranscriptionWord {
  word: string
  start: number
  end: number
  confidence: number
  speaker?: number
}

export interface TranscriptionResult {
  transcript: string
  confidence: number
  words: TranscriptionWord[]
  language?: string
  duration: number
  latency: number
}
`
  }
  
  private generateBarrelExport(): string {
    return `// @generated
export { deepgramProvider, deepgram } from './providers/deepgram.provider.js'
export { deepgramService } from './services/deepgram.service.js'
export type { TranscriptionOptions, TranscriptionResult, TranscriptionWord } from './types/deepgram.types.js'
`
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'deepgram',
      title: '🎤 Deepgram (Speech-to-Text)',
      icon: '🎤',
      checks: [
        {
          id: 'deepgram-key',
          name: 'API Key',
          description: 'Validates DEEPGRAM_API_KEY',
          testFunction: `return { success: !!process.env.DEEPGRAM_API_KEY, message: process.env.DEEPGRAM_API_KEY ? 'Configured' : 'Not set' }`
        },
        {
          id: 'deepgram-sdk',
          name: 'SDK Available',
          description: 'Validates Deepgram SDK is available',
          testFunction: `
            try {
              const { deepgramProvider } = await import('@/voice/deepgram.js')
              return { success: !!deepgramProvider, message: 'Deepgram SDK available' }
            } catch (error) {
              return { success: false, message: error instanceof Error ? error.message : 'SDK not found' }
            }
          `
        }
      ]
    }
  }
}

