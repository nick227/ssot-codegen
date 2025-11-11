'use client'

/**
 * V3 Runtime Mount Point
 * 
 * This is the ONLY page file needed!
 * Entire application defined in JSON at /templates
 */

import { TemplateRuntime } from '@ssot-ui/runtime'
import { adapters } from '@/lib/adapters'

// Load all JSON configuration
import template from '@/templates/template.json'
import dataContract from '@/templates/data-contract.json'
import capabilities from '@/templates/capabilities.json'
import mappings from '@/templates/mappings.json'
import models from '@/templates/models.json'
import theme from '@/templates/theme.json'
import i18n from '@/templates/i18n.json'

export default function Page({ params }: { params: { slug: string[] } }) {
  return (
    <TemplateRuntime
      config={{
        template,
        dataContract,
        capabilities,
        mappings,
        models,
        theme,
        i18n
      }}
      route={params.slug}
      adapters={adapters}
      options={{
        strictMode: true,
        showDevOverlay: process.env.NODE_ENV === 'development'
      }}
    />
  )
}
