// @generated
// Service Integration Routes for admin-config-service
// Admin service for managing dimension mapping rules and event weight configurations

import { Router, type Router as RouterType } from 'express'
import * as adminConfigServiceController from '@/controllers/admin-config-service'
import { authenticate } from '@/auth/jwt.js'


export const adminConfigServiceRouter: RouterType = Router()



// createRule - POST /rule
adminConfigServiceRouter.post('/rule', authenticate, adminConfigServiceController.createRule)

// updateRule - PUT /rule
adminConfigServiceRouter.put('/rule', authenticate, adminConfigServiceController.updateRule)

// deleteRule - DELETE /rule
adminConfigServiceRouter.delete('/rule', authenticate, adminConfigServiceController.deleteRule)

// bulkUpdateRules - POST /bulk-update-rules
adminConfigServiceRouter.post('/bulk-update-rules', authenticate, adminConfigServiceController.bulkUpdateRules)

// getRuleHistory - GET /rule-history
adminConfigServiceRouter.get('/rule-history', authenticate, adminConfigServiceController.getRuleHistory)

// createEventWeight - POST /event-weight
adminConfigServiceRouter.post('/event-weight', authenticate, adminConfigServiceController.createEventWeight)

// updateEventWeight - PUT /event-weight
adminConfigServiceRouter.put('/event-weight', authenticate, adminConfigServiceController.updateEventWeight)

// getConfigStatus - GET /config-status
adminConfigServiceRouter.get('/config-status', authenticate, adminConfigServiceController.getConfigStatus)
