/**
 * FormPageRenderer
 * 
 * Renders form pages with:
 * - react-hook-form + Zod validation
 * - Field widgets
 * - Mutation handling
 * - Success/error states
 * 
 * RUNTIME: Always client (enforced by schema)
 */

'use client'

import type { DataAdapter, UIAdapter } from '@ssot-ui/adapters'
import type { ExecutionPlan, RouteDefinition } from '@ssot-ui/loader'

export interface FormPageRendererProps {
  page: RouteDefinition
  plan: ExecutionPlan
  adapters: {
    data: DataAdapter
    ui: UIAdapter
  }
  locale?: string
}

export function FormPageRenderer(props: FormPageRendererProps) {
  const { page, adapters } = props
  
  const { Form } = adapters.ui
  
  // TODO: Implement form rendering
  // For now, placeholder
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Form Page (Coming in Week 5)</h1>
      <p className="text-neutral-600">Model: {page.model}</p>
    </div>
  )
}

