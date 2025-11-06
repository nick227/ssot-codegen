/**
 * ElevenLabs Provider Plugin
 * 
 * Text-to-Speech API integration
 * 
 * Features:
 * - High-quality voice synthesis
 * - Multiple voices (29+ premium voices)
 * - Voice cloning
 * - Emotion & style control
 * - Multiple languages
 * - Streaming audio
 * 
 * Use Cases:
 * - Voice assistants
 * - Audiobook generation
 * - Video narration
 * - Accessibility (TTS)
 * - Voice notifications
 */

import type {
  FeaturePlugin,
  PluginContext,
  PluginOutput,
  PluginRequirements,
  ValidationResult,
  HealthCheckSection
} from '../plugin.interface.js'

export interface ElevenLabsPluginConfig {
  /** Default voice ID (default: 'Rachel' - EXAVITQu4vr4xnSDxMaL) */
  defaultVoice?: string
  
  /** Default model (default: 'eleven_multilingual_v2') */
  defaultModel?: string
  
  /** Enable usage tracking (default: true) */
  enableUsageTracking?: boolean
  
  /** Request timeout in ms (default: 30000) */
  timeout?: number
}

export class ElevenLabsPlugin implements FeaturePlugin {
  name = 'elevenlabs'
  version = '1.0.0'
  description = 'ElevenLabs Text-to-Speech API integration'
  enabled = true
  
  private config: Required<ElevenLabsPluginConfig>
  
  constructor(config: ElevenLabsPluginConfig = {}) {
    this.config = {
      defaultVoice: 'EXAVITQu4vr4xnSDxMaL',  // Rachel
      defaultModel: 'eleven_multilingual_v2',
      enableUsageTracking: true,
      timeout: 30000,
      ...config
    }
  }
  
  requirements: PluginRequirements = {
    models: {
      required: [],
      optional: ['AudioGeneration']
    },
    envVars: {
      required: ['ELEVENLABS_API_KEY'],
      optional: []
    },
    dependencies: {
      runtime: {
        'elevenlabs': '^0.16.0'
      },
      dev: {}
    }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [], suggestions: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('voice/providers/elevenlabs.provider.ts', this.generateElevenLabsProvider())
    files.set('voice/services/elevenlabs.service.ts', this.generateElevenLabsService())
    files.set('voice/types/elevenlabs.types.ts', this.generateElevenLabsTypes())
    files.set('voice/elevenlabs.ts', this.generateBarrelExport())
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: {
        ELEVENLABS_API_KEY: 'your-elevenlabs-api-key'
      },
      packageJson: {
        dependencies: this.requirements.dependencies!.runtime,
        devDependencies: {}
      }
    }
  }
  
  private generateElevenLabsProvider(): string {
    return `// @generated
// ElevenLabs Provider - Text-to-Speech

import { ElevenLabsClient } from 'elevenlabs'
import type { TTSOptions, AudioResult } from '../types/elevenlabs.types.js'
import { logger } from '@/logger'

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!
})

export const elevenlabsProvider = {
  name: 'elevenlabs',
  type: 'commercial' as const,
  
  /**
   * Convert text to speech
   */
  async textToSpeech(text: string, options: TTSOptions = {}): Promise<AudioResult> {
    const startTime = Date.now()
    
    try {
      const audio = await elevenlabs.generate({
        voice: options.voiceId || '${this.config.defaultVoice}',
        text,
        model_id: options.model || '${this.config.defaultModel}',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarityBoost || 0.75,
          style: options.style || 0,
          use_speaker_boost: options.useSpeakerBoost !== false
        }
      })
      
      const latency = Date.now() - startTime
      
      // Convert async iterator to buffer
      const chunks: Buffer[] = []
      for await (const chunk of audio) {
        chunks.push(chunk)
      }
      const audioBuffer = Buffer.concat(chunks)
      
      ${this.config.enableUsageTracking ? `
      logger.info({
        voice: options.voiceId || '${this.config.defaultVoice}',
        textLength: text.length,
        audioSize: audioBuffer.length,
        latency
      }, 'ElevenLabs TTS complete')
      ` : ''}
      
      return {
        audio: audioBuffer,
        format: 'mp3',
        size: audioBuffer.length,
        duration: estimateDuration(text),
        latency
      }
    } catch (error) {
      logger.error({ error }, 'ElevenLabs TTS failed')
      throw error
    }
  },
  
  /**
   * List available voices
   */
  async listVoices(): Promise<Array<{ id: string; name: string }>> {
    try {
      const voices = await elevenlabs.voices.getAll()
      return voices.voices.map(v => ({
        id: v.voice_id,
        name: v.name
      }))
    } catch (error) {
      logger.error({ error }, 'Failed to list voices')
      return []
    }
  },
  
  /**
   * Get voice details
   */
  async getVoice(voiceId: string) {
    try {
      return await elevenlabs.voices.get(voiceId)
    } catch (error) {
      logger.error({ error, voiceId }, 'Failed to get voice')
      return null
    }
  },
  
  /**
   * Get provider info
   */
  getInfo() {
    return {
      name: 'ElevenLabs',
      type: 'commercial' as const,
      features: {
        textToSpeech: true,
        voiceCloning: true,
        multiLanguage: true,
        emotionControl: true,
        streaming: true
      }
    }
  }
}

/**
 * Estimate audio duration from text (rough)
 */
function estimateDuration(text: string): number {
  // Average speaking rate: ~150 words per minute
  const words = text.split(/\\s+/).length
  return (words / 150) * 60  // seconds
}

export { elevenlabs }
`
  }
  
  private generateElevenLabsService(): string {
    return `// @generated
// ElevenLabs Service - High-level API

import { elevenlabsProvider } from '../providers/elevenlabs.provider.js'
import type { TTSOptions } from '../types/elevenlabs.types.js'
import fs from 'node:fs/promises'

export const elevenlabsService = {
  /**
   * Convert text to speech and return buffer
   */
  async speak(text: string, options: TTSOptions = {}): Promise<Buffer> {
    const result = await elevenlabsProvider.textToSpeech(text, options)
    return result.audio
  },
  
  /**
   * Convert text to speech and save to file
   */
  async speakToFile(text: string, outputPath: string, options: TTSOptions = {}): Promise<void> {
    const result = await elevenlabsProvider.textToSpeech(text, options)
    await fs.writeFile(outputPath, result.audio)
  },
  
  /**
   * List available voices
   */
  async getVoices() {
    return elevenlabsProvider.listVoices()
  }
}

export { elevenlabsProvider }
`
  }
  
  private generateElevenLabsTypes(): string {
    return `// @generated
// ElevenLabs Type Definitions

export interface TTSOptions {
  voiceId?: string
  model?: string
  stability?: number  // 0-1
  similarityBoost?: number  // 0-1
  style?: number  // 0-1
  useSpeakerBoost?: boolean
}

export interface AudioResult {
  audio: Buffer
  format: string
  size: number
  duration: number  // seconds
  latency: number  // milliseconds
}
`
  }
  
  private generateBarrelExport(): string {
    return `// @generated
export { elevenlabsProvider, elevenlabs } from './providers/elevenlabs.provider.js'
export { elevenlabsService } from './services/elevenlabs.service.js'
export type { TTSOptions, AudioResult } from './types/elevenlabs.types.js'
`
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'elevenlabs',
      title: '🔊 ElevenLabs (Text-to-Speech)',
      icon: '🔊',
      checks: [
        {
          id: 'elevenlabs-key',
          name: 'API Key',
          description: 'Validates ELEVENLABS_API_KEY',
          testFunction: `return { success: !!process.env.ELEVENLABS_API_KEY, message: process.env.ELEVENLABS_API_KEY ? 'Configured' : 'Not set' }`
        },
        {
          id: 'elevenlabs-voices',
          name: 'Voice Library',
          description: 'Tests voice library access',
          testFunction: `
            try {
              const { elevenlabsProvider } = await import('@/voice/elevenlabs.js')
              const voices = await elevenlabsProvider.listVoices()
              return { success: voices.length > 0, message: \`\${voices.length} voices available\` }
            } catch (error) {
              return { success: false, message: error instanceof Error ? error.message : 'Failed' }
            }
          `,
          skipForStatic: true
        }
      ]
    }
  }
}

