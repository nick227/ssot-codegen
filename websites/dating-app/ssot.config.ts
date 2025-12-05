/**
 * SSOT Codegen Configuration for Dating App
 * 
 * This configuration file tells the SSOT generator how to generate code
 * from the Prisma schema at prisma/schema.prisma
 */

import { defineConfig } from '@ssot/gen'

export default defineConfig({
  // ============================================================================
  // CORE CONFIGURATION
  // ============================================================================
  
  schema: './prisma/schema.prisma',
  output: './src',
  framework: 'express',
  
  // ============================================================================
  // GENERATION MODES
  // ============================================================================
  
  useRegistry: true,              // Unified CRUD registry (78% less code)
  generateUI: true,               // Generate Vite + React frontend
  generateSDK: true,              // Generate SDK for frontend integration
  generateOpenAPI: true,          // Generate OpenAPI spec for API docs
  generateTests: false,           // No tests for MVP (add later)
  
  // ============================================================================
  // UI CONFIGURATION
  // ============================================================================
  
  ui: {
    framework: 'vite',            // Vite + React Router
    template: 'data-browser',     // Admin/data browser template
    mode: 'v2-codegen',           // Generate TypeScript files for customization
    mobileFirst: true,             // Mobile-first responsive design
    components: {
      generateDataTable: true,
      generateForms: true,
      generateLayouts: true,
      generateMobileComponents: true  // Mobile-optimized components
    }
  },
  
  // ============================================================================
  // SERVICE INTEGRATIONS
  // ============================================================================
  
  // Service annotations from schema will be automatically detected:
  // - @service discovery-service on Swipe model
  // - @service admin-config-service on DimensionMappingRule model
  // - @service compatibility-service on CompatibilityScore model
  // - @service dimension-update-service on BehaviorEvent model
  // - @service quiz-scoring-service on QuizAnswer model
  
  includeServiceIntegrations: true,
  
  // ============================================================================
  // FEATURES
  // ============================================================================
  
  features: {
    // Authentication
    jwtService: {
      enabled: true
    },
    
    // Storage (for photos)
    s3: {
      enabled: false  // Configure when ready
    },
    
    // Email (for notifications)
    sendgrid: {
      enabled: false  // Configure when ready
    },
    
    // Usage tracking
    usageTracker: {
      enabled: true
    }
  }
})

