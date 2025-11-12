/**
 * DetailPageRenderer
 * 
 * Display a single record with all fields.
 * M0: Basic functionality only.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface DetailPageConfig {
  model: string
  fields?: string[]
  sections?: Array<{
    title: string
    fields: string[]
  }>
}

export interface DetailPageRendererProps {
  config: DetailPageConfig
  id: string
  apiEndpoint?: string
}

export function DetailPageRenderer({ config, id, apiEndpoint = '/api/data' }: DetailPageRendererProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Fetch record
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: `${config.model}.findOne`,
            params: {
              where: { id }
            }
          })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load record')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [config.model, id, apiEndpoint])
  
  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this record?')) return
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: `${config.model}.delete`,
          params: {
            where: { id }
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete')
      }
      
      // Navigate back to list
      router.push(`/${config.model.toLowerCase()}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }
  
  // Get fields to display
  const fields = config.fields || (data ? Object.keys(data) : [])
  
  // Get nested field value
  const getFieldValue = (obj: any, field: string): any => {
    const parts = field.split('.')
    let value = obj
    
    for (const part of parts) {
      if (value == null) return null
      value = value[part]
    }
    
    return value
  }
  
  // Format value for display
  const formatValue = (value: any): string => {
    if (value == null) return '—'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (value instanceof Date) return value.toLocaleDateString()
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }
  
  // Format field name (camelCase → Title Case)
  const formatFieldName = (field: string): string => {
    return field
      .split('.')
      .pop()!
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
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
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded"
        >
          Back
        </button>
      </div>
    )
  }
  
  if (!data) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Record not found</div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded"
        >
          Back
        </button>
      </div>
    )
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{config.model} Details</h1>
        <div className="space-x-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back
          </button>
          <button
            onClick={() => router.push(`/${config.model.toLowerCase()}/${id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      
      {/* Fields */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <dl className="divide-y divide-gray-200">
          {fields.map(field => (
            <div key={field} className="px-6 py-4 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">
                {formatFieldName(field)}
              </dt>
              <dd className="text-sm text-gray-900 col-span-2">
                {formatValue(getFieldValue(data, field))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

