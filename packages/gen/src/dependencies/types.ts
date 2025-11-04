/**
 * Type definitions for dependency management system
 */

export interface DependencySet {
  runtime: Record<string, string>
  dev: Record<string, string>
}

export interface DependencyProfile {
  name: string
  description: string
  runtime: Record<string, string>
  dev: Record<string, string>
}

export interface Feature {
  name: string
  description: string
  dependencies: DependencySet
}

export type FeatureSet = Record<string, Feature>

export interface DependencyConfig {
  // Base profile
  profile?: 'minimal' | 'standard' | 'production' | 'full'
  
  // Additional features to enable
  features?: string[]
  
  // Custom version overrides
  versions?: Record<string, string>
  
  // Framework-specific deps
  framework?: {
    name: 'express' | 'fastify'
    version?: string
    plugins?: string[]
  }
  
  // Database-specific deps
  database?: {
    provider: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb'
    includeDriver?: boolean
  }
}

export interface ResolvedDependencies {
  runtime: Record<string, string>
  dev: Record<string, string>
  scripts: Record<string, string>
  metadata: {
    profile: string
    features: string[]
    framework: string
  }
}

