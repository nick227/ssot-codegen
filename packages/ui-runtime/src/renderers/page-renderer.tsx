/**
 * PageRenderer
 * 
 * Renders individual pages based on type (list, detail, form, custom).
 * Automatically handles RSC/client boundaries.
 */

import type { DataAdapter, UIAdapter, AuthAdapter, RouterAdapter, FormatAdapter } from '@ssot-ui/adapters'
import type { ExecutionPlan, RouteDefinition } from '@ssot-ui/loader'
import { ListPageRenderer } from './list-page-renderer.js'
import { DetailPageRenderer } from './detail-page-renderer.js'
import { FormPageRenderer } from './form-page-renderer.js'

export interface PageRendererProps {
  page: RouteDefinition
  plan: ExecutionPlan
  adapters: {
    data: DataAdapter
    ui: UIAdapter
    auth?: AuthAdapter
    router?: RouterAdapter
    format?: FormatAdapter
  }
  strictMode: boolean
  locale?: string
}

export function PageRenderer(props: PageRendererProps) {
  const { page, plan, adapters, strictMode, locale } = props
  
  // Check guards first (GUARD FIRST, FETCH SECOND)
  if (page.guard && adapters.auth) {
    // TODO: Implement async guard check
    // For now, render guard placeholder
  }
  
  // Render based on page type
  switch (page.type) {
    case 'list':
      return <ListPageRenderer page={page} plan={plan} adapters={adapters} locale={locale} />
    
    case 'detail':
      return <DetailPageRenderer page={page} plan={plan} adapters={adapters} locale={locale} />
    
    case 'form':
      return <FormPageRenderer page={page} plan={plan} adapters={adapters} locale={locale} />
    
    case 'custom':
      // TODO: Load custom component
      return <div>Custom page: {page.path}</div>
    
    default:
      if (strictMode) {
        throw new Error(`Unknown page type: ${(page as any).type}`)
      }
      return <div>Unknown page type</div>
  }
}

