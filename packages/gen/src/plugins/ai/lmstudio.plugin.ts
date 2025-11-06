/**
 * LM Studio Provider Plugin
 * Local AI models with OpenAI-compatible API
 */

import type { FeaturePlugin, PluginContext, PluginOutput, PluginRequirements, ValidationResult, HealthCheckSection } from '../plugin.interface.js'

export class LMStudioPlugin implements FeaturePlugin {
  name = 'lmstudio'
  version = '1.0.0'
  description = 'LM Studio local AI (OpenAI-compatible)'
  enabled = true
  
  requirements: PluginRequirements = {
    models: { required: [], optional: [] },
    envVars: { required: [], optional: ['LMSTUDIO_URL'] },
    dependencies: { runtime: {}, dev: {} }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('ai/providers/lmstudio.provider.ts', `// @generated
import type { ChatMessage, ChatOptions, ChatResponse } from '../types/ai.types.js'

const LMSTUDIO_URL = process.env.LMSTUDIO_URL || 'http://localhost:1234/v1'

export const lmstudioProvider = {
  name: 'lmstudio',
  type: 'local' as const,
  
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const startTime = Date.now()
    
    const response = await fetch(\`\${LMSTUDIO_URL}/chat/completions\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || 'local-model',
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens
      })
    })
    
    const data = await response.json()
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      model: data.model,
      finishReason: 'stop',
      provider: 'lmstudio',
      latency: Date.now() - startTime
    }
  },
  
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(\`\${LMSTUDIO_URL}/models\`)
      const data = await response.json()
      return data.data.map((m: { id: string }) => m.id)
    } catch {
      return []
    }
  },
  
  getInfo() {
    return {
      name: 'LM Studio',
      type: 'local' as const,
      endpoint: LMSTUDIO_URL,
      modelsAvailable: 0,
      features: { chat: true, completions: true, embeddings: true, vision: false, functions: false, streaming: true }
    }
  }
}
`)
    
    files.set('ai/lmstudio.ts', `// @generated
export { lmstudioProvider } from './providers/lmstudio.provider.js'
`)
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: { LMSTUDIO_URL: 'http://localhost:1234/v1' },
      packageJson: { dependencies: {}, devDependencies: {} }
    }
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'lmstudio',
      title: '💻 LM Studio',
      icon: '💻',
      checks: [{
        id: 'lmstudio-connection',
        name: 'Local Server',
        description: 'Tests LM Studio connection',
        testFunction: `
          try {
            const url = process.env.LMSTUDIO_URL || 'http://localhost:1234/v1'
            const res = await fetch(\`\${url}/models\`)
            return { success: res.ok, message: res.ok ? 'Connected' : 'Not running' }
          } catch {
            return { success: false, message: 'LM Studio not running' }
          }
        `,
        skipForStatic: true
      }]
    }
  }
}

