/**
 * Example: Validation Plugin using Phase Hooks
 * 
 * Adds custom validation rules after schema parsing
 */

import { afterPhase } from '../phase-hooks.js'
import type { ContextAfterPhase1 } from '../../typed-context.js'

/**
 * Register custom validation hooks
 */
export function registerValidationHooks() {
  // Validate after schema parsing
  afterPhase('parseSchema', async (context: ContextAfterPhase1) => {
    const { schema, logger } = context
    
    // Custom rule: Require @unique on email fields
    for (const model of schema.models) {
      const emailField = model.fields.find(f => 
        f.name.toLowerCase() === 'email'  &&
        f.kind === 'scalar'
      )
      
      if (emailField && !emailField.isUnique) {
        logger.error(
          `Model ${model.name} has email field but it's not @unique. ` +
          `Add @unique to prevent duplicate emails.`
        )
      }
    }
    
    // Custom rule: Require slug fields to be unique
    for (const model of schema.models) {
      const slugField = model.fields.find(f => 
        f.name.toLowerCase() === 'slug' &&
        f.kind === 'scalar'
      )
      
      if (slugField && !slugField.isUnique) {
        logger.error(
          `Model ${model.name} has slug field but it's not @unique. ` +
          `Add @unique or @@unique([slug]) to enable SEO-friendly URLs.`
        )
      }
    }
    
    // Custom rule: Warn about missing timestamps
    for (const model of schema.models) {
      const hasCreatedAt = model.fields.some(f => f.name === 'createdAt')
      const hasUpdatedAt = model.fields.some(f => f.name === 'updatedAt')
      
      if (!hasCreatedAt || !hasUpdatedAt) {
        logger.debug(
          `Model ${model.name} missing timestamp fields. ` +
          `Consider adding createdAt and updatedAt for audit trails.`
        )
      }
    }
  })
}

