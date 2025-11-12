/**
 * Annotation Validator
 * Validates parsed annotations for correctness
 */

import type { ModelAnnotation, AnnotationValidationResult, PolicyAnnotation, RealtimeAnnotation, ServiceAnnotation } from './types.js'

const KNOWN_AUTH_STRATEGIES = ['JWT', 'Bearer', 'Basic', 'OAuth2', 'NextAuth']
const KNOWN_SERVICE_PROVIDERS = [
  'Cloudinary', 'S3', 'R2',
  'Stripe', 'PayPal',
  'SendGrid', 'Mailgun',
  'OpenAI', 'Claude', 'Gemini',
  'Deepgram', 'ElevenLabs'
]

/**
 * Validate all annotations for a model
 */
export function validateAnnotations(
  modelName: string,
  annotations: ModelAnnotation[],
  modelFields: string[]
): AnnotationValidationResult {
  const errors: string[] = []
  
  for (const annotation of annotations) {
    switch (annotation.type) {
      case 'service':
        errors.push(...validateServiceAnnotation(modelName, annotation))
        break
      case 'auth':
        errors.push(...validateAuthAnnotation(modelName, annotation))
        break
      case 'policy':
        errors.push(...validatePolicyAnnotation(modelName, annotation, modelFields))
        break
      case 'realtime':
        errors.push(...validateRealtimeAnnotation(modelName, annotation))
        break
      case 'search':
        errors.push(...validateSearchAnnotation(modelName, annotation, modelFields))
        break
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

function validateServiceAnnotation(modelName: string, annotation: ServiceAnnotation): string[] {
  const errors: string[] = []
  
  if (!annotation.provider) {
    errors.push(`[${modelName}] @@service missing provider`)
  } else if (!KNOWN_SERVICE_PROVIDERS.includes(annotation.provider)) {
    // Warning, not error (allow custom providers)
    console.warn(`[SSOT] Unknown service provider: ${annotation.provider} (proceeding anyway)`)
  }
  
  return errors
}

function validateAuthAnnotation(modelName: string, annotation: { strategy: string }): string[] {
  const errors: string[] = []
  
  if (!annotation.strategy) {
    errors.push(`[${modelName}] @@auth missing strategy`)
  } else if (!KNOWN_AUTH_STRATEGIES.includes(annotation.strategy)) {
    // Warning, not error (allow custom strategies)
    console.warn(`[SSOT] Unknown auth strategy: ${annotation.strategy} (proceeding anyway)`)
  }
  
  return errors
}

function validatePolicyAnnotation(modelName: string, annotation: PolicyAnnotation, modelFields: string[]): string[] {
  const errors: string[] = []
  
  if (!annotation.rule || annotation.rule.trim() === '') {
    errors.push(`[${modelName}] @@policy missing rule`)
  }
  
  if (annotation.fields) {
    for (const field of annotation.fields) {
      if (!modelFields.includes(field)) {
        errors.push(`[${modelName}] @@policy references unknown field: ${field}`)
      }
    }
  }
  
  return errors
}

function validateRealtimeAnnotation(modelName: string, annotation: RealtimeAnnotation): string[] {
  const errors: string[] = []
  
  if (!annotation.subscribe && !annotation.broadcast) {
    errors.push(`[${modelName}] @@realtime requires at least subscribe or broadcast`)
  }
  
  if (annotation.subscribe) {
    for (const op of annotation.subscribe) {
      if (op !== 'list' && op !== 'item') {
        errors.push(`[${modelName}] @@realtime invalid subscribe operation: ${op}`)
      }
    }
  }
  
  if (annotation.broadcast) {
    for (const op of annotation.broadcast) {
      if (op !== 'created' && op !== 'updated' && op !== 'deleted') {
        errors.push(`[${modelName}] @@realtime invalid broadcast operation: ${op}`)
      }
    }
  }
  
  return errors
}

function validateSearchAnnotation(modelName: string, annotation: { fields: string[] }, modelFields: string[]): string[] {
  const errors: string[] = []
  
  if (!annotation.fields || annotation.fields.length === 0) {
    errors.push(`[${modelName}] @@search requires at least one field`)
  } else {
    for (const field of annotation.fields) {
      if (!modelFields.includes(field)) {
        errors.push(`[${modelName}] @@search references unknown field: ${field}`)
      }
    }
  }
  
  return errors
}

