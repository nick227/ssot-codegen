/**
 * ListPageRenderer
 * 
 * Simple table view for listing records.
 * M0: Basic functionality only (no advanced features).
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface ListPageConfig {
  model: string
  columns?: string[]
  filters?: string[]
  sort?: string
}

export interface ListPageRendererProps {
  config: ListPageConfig
  apiEndpoint?: string
}

export function ListPageRenderer({ config, apiEndpoint = '/api/data' }: ListPageRendererProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const router = useRouter()
  
  const pageSize = 50
  
  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: `${config.model}.findMany`,
            params: {
              take: pageSize,
              skip: page * pageSize,
              orderBy: config.sort ? { [config.sort]: 'desc' } : { createdAt: 'desc' }
            }
          })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        setData(Array.isArray(result) ? result : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [config.model, page, config.sort, apiEndpoint])
  
  // Get columns to display (from config or infer from data)
  const columns = config.columns || (data.length > 0 ? Object.keys(data[0]) : [])
  
  // Handle row click (navigate to detail)
  const handleRowClick = (item: any) => {
    router.push(`/${config.model.toLowerCase()}/${item.id}`)
  }
  
  // Handle new button
  const handleNew = () => {
    router.push(`/${config.model.toLowerCase()}/new`)
  }
  
  // Get nested field value (e.g., "uploader.name")
  const getFieldValue = (item: any, field: string): any => {
    const parts = field.split('.')
    let value = item
    
    for (const part of parts) {
      if (value == null) return null
      value = value[part]
    }
    
    return value
  }
  
  // Format value for display
  const formatValue = (value: any): string => {
    if (value == null) return ''
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (value instanceof Date) return value.toLocaleDateString()
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }
  
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{config.model}s</h1>
        <button
          onClick={handleNew}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New {config.model}
        </button>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                >
                  {col}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            ) : (
              data.map(item => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(item)}
                >
                  {columns.map(col => (
                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatValue(getFieldValue(item, col))}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/${config.model.toLowerCase()}/${item.id}`)
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/${config.model.toLowerCase()}/${item.id}/edit`)
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {page + 1}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={data.length < pageSize}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

