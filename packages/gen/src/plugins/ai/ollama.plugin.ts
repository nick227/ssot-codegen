/**
 * Ollama Provider Plugin
 * Local open-source AI models
 */

import type { FeaturePlugin, PluginContext, PluginOutput, PluginRequirements, ValidationResult, HealthCheckSection } from '../plugin.interface.js'

export class OllamaPlugin implements FeaturePlugin {
  name = 'ollama'
  version = '1.0.0'
  description = 'Ollama local AI (Llama, Mistral, etc.)'
  enabled = true
  
  requirements: PluginRequirements = {
    models: { required: [], optional: [] },
    envVars: { required: [], optional: ['OLLAMA_URL'] },
    dependencies: { runtime: {}, dev: {} }
  }
  
  validate(context: PluginContext): ValidationResult {
    return { valid: true, errors: [], warnings: [] }
  }
  
  generate(context: PluginContext): PluginOutput {
    const files = new Map<string, string>()
    
    files.set('ai/providers/ollama.provider.ts', `// @generated
import type { ChatMessage, ChatOptions, ChatResponse } from '../types/ai.types.js'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

export const ollamaProvider = {
  name: 'ollama',
  type: 'local' as const,
  
  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const startTime = Date.now()
    
    const response = await fetch(\`\${OLLAMA_URL}/api/chat\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || 'llama3',
        messages,
        stream: false,
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens
        }
      })
    })
    
    const data = await response.json()
    
    return {
      content: data.message.content,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      },
      model: data.model,
      finishReason: 'stop',
      provider: 'ollama',
      latency: Date.now() - startTime
    }
  },
  
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(\`\${OLLAMA_URL}/api/tags\`)
      const data = await response.json()
      return data.models.map((m: any) => m.name)
    } catch {
      return []
    }
  },
  
  getInfo() {
    return {
      name: 'Ollama',
      type: 'local' as const,
      endpoint: OLLAMA_URL,
      modelsAvailable: 0,
      features: { chat: true, completions: true, embeddings: true, vision: false, functions: false, streaming: true }
    }
  }
}
`)
    
    files.set('ai/ollama.ts', `// @generated
export { ollamaProvider } from './providers/ollama.provider.js'
`)
    
    return {
      files,
      routes: [],
      middleware: [],
      envVars: { OLLAMA_URL: 'http://localhost:11434' },
      packageJson: { dependencies: {}, devDependencies: {} }
    }
  }
  
  healthCheck(context: PluginContext): HealthCheckSection {
    return {
      id: 'ollama',
      title: '🦙 Ollama',
      icon: '🦙',
      checks: [{
        id: 'ollama-connection',
        name: 'Local Server',
        description: 'Tests Ollama connection',
        testFunction: `
          try {
            const url = process.env.OLLAMA_URL || 'http://localhost:11434'
            const res = await fetch(\`\${url}/api/tags\`)
            const data = await res.json()
            return { success: res.ok, message: \`\${data.models?.length || 0} models available\` }
          } catch {
            return { success: false, message: 'Ollama not running' }
          }
        `,
        skipForStatic: true
      }]
    }
  }
}

