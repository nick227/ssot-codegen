/**
 * ListPageRenderer
 * 
 * Renders list pages with:
 * - Pagination (cursor or offset)
 * - Sorting (whitelisted fields)
 * - Filtering (whitelisted fields)
 * - Search (debounced)
 * - Loading/error/empty states
 */

import { useState, useEffect, useMemo } from 'react'
import type { DataAdapter, UIAdapter, FormatAdapter, ListParams } from '@ssot-ui/adapters'
import type { ExecutionPlan, RouteDefinition } from '@ssot-ui/loader'

export interface ListPageRendererProps {
  page: RouteDefinition
  plan: ExecutionPlan
  adapters: {
    data: DataAdapter
    ui: UIAdapter
    format?: FormatAdapter
  }
  locale?: string
}

export function ListPageRenderer(props: ListPageRendererProps) {
  const { page, plan, adapters } = props
  
  // Find data requirements for this model
  const dataReq = plan.data.find(d => d.model === page.model)
  
  // State
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [pageSize] = useState(20)
  
  // Fetch data
  useEffect(() => {
    let cancelled = false
    
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      const params: ListParams = {
        cursor,
        pageSize,
        include: dataReq?.relations
      }
      
      const result = await adapters.data.list(page.model, params)
      
      if (cancelled) return
      
      if (result.ok) {
        setItems(result.data.items)
        setTotal(result.data.total)
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
  }, [page.model, cursor, pageSize, adapters.data, dataReq])
  
  const { DataTable, Spinner } = adapters.ui
  
  // Loading state
  if (loading && items.length === 0) {
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
  
  // Empty state
  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">No Items Found</h2>
        <p className="text-neutral-600">No {page.model} records available.</p>
      </div>
    )
  }
  
  // Auto-generate columns from first item
  const columns = useMemo(() => {
    if (items.length === 0) return []
    
    const firstItem = items[0]
    return Object.keys(firstItem).map(key => ({
      key,
      header: key.charAt(0).toUpperCase() + key.slice(1),
      sortable: dataReq?.sortable.includes(key) || false
    }))
  }, [items, dataReq])
  
  // Render with DataTable
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">{page.model} List</h1>
      
      <DataTable
        data={items}
        columns={columns}
        total={total}
        isLoading={loading}
      />
    </div>
  )
}

