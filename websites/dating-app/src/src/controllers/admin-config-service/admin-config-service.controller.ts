// @generated
// Service Integration Controller for admin-config-service
// Using BaseServiceController to eliminate boilerplate

import { BaseServiceController } from '@/base'
import { adminConfigServiceService } from '@/services/admin-config-service/admin-config-service.service.scaffold.js'

const controller = new BaseServiceController({ serviceName: 'admin-config-service' })

/**
 * createRule
 * @generated from @service admin-config-service
 */
export const createRule = controller.wrap(
  'createRule',
  adminConfigServiceService.createRule
)

/**
 * updateRule
 * @generated from @service admin-config-service
 */
export const updateRule = controller.wrap(
  'updateRule',
  adminConfigServiceService.updateRule
)

/**
 * deleteRule
 * @generated from @service admin-config-service
 */
export const deleteRule = controller.wrap(
  'deleteRule',
  adminConfigServiceService.deleteRule
)

/**
 * bulkUpdateRules
 * @generated from @service admin-config-service
 */
export const bulkUpdateRules = controller.wrap(
  'bulkUpdateRules',
  adminConfigServiceService.bulkUpdateRules
)

/**
 * getRuleHistory
 * @generated from @service admin-config-service
 */
export const getRuleHistory = controller.wrap(
  'getRuleHistory',
  adminConfigServiceService.getRuleHistory,
  { statusCode: 200 }
)

/**
 * createEventWeight
 * @generated from @service admin-config-service
 */
export const createEventWeight = controller.wrap(
  'createEventWeight',
  adminConfigServiceService.createEventWeight
)

/**
 * updateEventWeight
 * @generated from @service admin-config-service
 */
export const updateEventWeight = controller.wrap(
  'updateEventWeight',
  adminConfigServiceService.updateEventWeight
)

/**
 * getConfigStatus
 * @generated from @service admin-config-service
 */
export const getConfigStatus = controller.wrap(
  'getConfigStatus',
  adminConfigServiceService.getConfigStatus,
  { statusCode: 200 }
)
