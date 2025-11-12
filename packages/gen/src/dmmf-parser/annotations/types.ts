/**
 * Schema Annotation Types
 * Defines supported Prisma schema annotations
 */

/**
 * Service integration annotation
 * 
 * @example
 * ```prisma
 * model Image {
 *   id String @id
 *   url String
 *   
 *   @@service("Cloudinary", config: { folder: "uploads" })
 * }
 * ```
 */
export interface ServiceAnnotation {
  type: 'service'
  provider: string
  config?: Record<string, unknown>
}

/**
 * Authentication requirement annotation
 * 
 * @example
 * ```prisma
 * model User {
 *   id String @id
 *   email String
 *   
 *   @@auth("JWT", strategy: "Bearer")
 * }
 * ```
 */
export interface AuthAnnotation {
  type: 'auth'
  strategy: string
  config?: Record<string, unknown>
}

/**
 * Row-level security policy annotation
 * 
 * @example
 * ```prisma
 * model Post {
 *   id String @id
 *   authorId String
 *   
 *   @@policy("read", rule: "isOwner || isPublic")
 *   @@policy("write", rule: "isOwner")
 * }
 * ```
 */
export interface PolicyAnnotation {
  type: 'policy'
  operation: 'read' | 'write' | 'delete' | '*'
  rule: string
  fields?: string[]  // Specific fields this policy applies to
}

/**
 * Real-time WebSocket annotation
 * 
 * @example
 * ```prisma
 * model Message {
 *   id String @id
 *   text String
 *   
 *   @@realtime(subscribe: ["list", "item"], broadcast: ["created", "updated"])
 * }
 * ```
 */
export interface RealtimeAnnotation {
  type: 'realtime'
  subscribe?: Array<'list' | 'item'>
  broadcast?: Array<'created' | 'updated' | 'deleted'>
  permissions?: {
    list?: string
    item?: string
  }
}

/**
 * Search configuration annotation
 * 
 * @example
 * ```prisma
 * model Article {
 *   id String @id
 *   title String
 *   content String
 *   
 *   @@search(fields: ["title", "content"], weights: [2, 1])
 * }
 * ```
 */
export interface SearchAnnotation {
  type: 'search'
  fields: string[]
  weights?: number[]
  engine?: 'native' | 'elasticsearch' | 'typesense'
}

/**
 * Union of all annotation types
 */
export type ModelAnnotation = 
  | ServiceAnnotation
  | AuthAnnotation
  | PolicyAnnotation
  | RealtimeAnnotation
  | SearchAnnotation

/**
 * Parsed model with annotations
 */
export interface AnnotatedModel {
  name: string
  annotations: ModelAnnotation[]
}

/**
 * Validation result
 */
export interface AnnotationValidationResult {
  valid: boolean
  errors: string[]
}

