/**
 * DetailPageRenderer
 * 
 * Renders detail pages with:
 * - Single record display
 * - Relation loading
 * - Formatted fields
 * - Loading/error states
 * - Breadcrumbs (optional)
 */

import { useState, useEffect } from 'react'
import type { DataAdapter, UIAdapter, FormatAdapter } from '@ssot-ui/adapters'
import type { ExecutionPlan, RouteDefinition } from '@ssot-ui/loader'

export interface DetailPageRendererProps {
  page: RouteDefinition
  plan: ExecutionPlan
  adapters: {
    data: DataAdapter
    ui: UIAdapter
    router?: any
    format?: FormatAdapter
  }
  locale?: string
}

export function DetailPageRenderer(props: DetailPageRendererProps) {
  const { page, plan, adapters } = props
  
  // Extract ID from route params
  const id = '123' // TODO: Get from RouterAdapter
  
  // Find data requirements
  const dataReq = plan.data.find(d => d.model === page.model)
  
  // State
  const [item, setItem] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch data
  useEffect(() => {
    let cancelled = false
    
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      const result = await adapters.data.detail(page.model, id, {
        include: dataReq?.relations
      })
      
      if (cancelled) return
      
      if (result.ok) {
        setItem(result.data)
        setLoading(false)
      } else {
        setError(result.error.message)
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => {
      cancelled = true
    }
  }, [page.model, id, adapters.data, dataReq])
  
  const { Card, Spinner } = adapters.ui
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-error-500 mb-2">Error Loading Data</h2>
        <p className="text-neutral-600">{error}</p>
      </div>
    )
  }
  
  // Not found
  if (!item) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Not Found</h2>
        <p className="text-neutral-600">{page.model} with ID {id} not found.</p>
      </div>
    )
  }
  
  // Render detail
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">{page.model} Detail</h1>
      
      <Card>
        <pre className="p-4 overflow-auto">
          {JSON.stringify(item, null, 2)}
        </pre>
      </Card>
    </div>
  )
}

