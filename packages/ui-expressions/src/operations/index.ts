/**
 * Operations Registry
 * 
 * DRY: Single registry of ALL operations
 * SRP: Only combines operations, no logic
 */

import type { OperationRegistry } from '../types.js'
import { mathOperations } from './math.js'
import { stringOperations } from './string.js'
import { dateOperations } from './date.js'
import { logicalOperations } from './logical.js'
import { comparisonOperations } from './comparison.js'
import { arrayOperations } from './array.js'
import { permissionOperations } from './permission.js'

/**
 * Complete operation registry
 * DRY: All operations defined once and used everywhere
 */
export const OPERATIONS: OperationRegistry = {
  ...mathOperations,
  ...stringOperations,
  ...dateOperations,
  ...logicalOperations,
  ...comparisonOperations,
  ...arrayOperations,
  ...permissionOperations
}

// Re-export individual operation sets for testing
export {
  mathOperations,
  stringOperations,
  dateOperations,
  logicalOperations,
  comparisonOperations,
  arrayOperations,
  permissionOperations
}

