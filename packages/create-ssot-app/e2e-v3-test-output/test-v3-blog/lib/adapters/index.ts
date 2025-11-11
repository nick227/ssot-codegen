/**
 * Adapter Configuration
 * 
 * Configures all adapters for the V3 runtime.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaDataAdapter } from '@ssot-ui/adapter-data-prisma'
import { InternalUIAdapter } from '@ssot-ui/adapter-ui-internal'
import { NextAuthAdapter } from '@ssot-ui/adapter-auth-nextauth'
import { NextRouterAdapter } from '@ssot-ui/adapter-router-next'
import { IntlFormatAdapter } from '@ssot-ui/adapter-format-intl'
import dataContract from '@/templates/data-contract.json'

const prisma = new PrismaClient()

export const adapters = {
  data: new PrismaDataAdapter(prisma, dataContract as any),
  ui: InternalUIAdapter,
  auth: NextAuthAdapter,
  router: NextRouterAdapter,
  format: new IntlFormatAdapter('en-US')
}

// NOTE: Configure NextAuth in app/api/auth/[...nextauth]/route.ts
// See: https://next-auth.js.org/configuration/initialization
