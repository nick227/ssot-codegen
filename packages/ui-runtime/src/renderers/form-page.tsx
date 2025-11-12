/**
 * FormRenderer
 * 
 * Create/edit form for records.
 * M0: Basic functionality with simple validation.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface FormPageConfig {
  model: string
  fields?: string[]
  createPath?: string
  editPath?: string
}

export interface FormPageRendererProps {
  config: FormPageConfig
  id?: string  // If editing existing record
  apiEndpoint?: string
}

export function FormPageRenderer({ config, id, apiEndpoint = '/api/data' }: FormPageRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  const isEdit = !!id
  
  // Fetch existing record for edit
  useEffect(() => {
    if (!id) return
    
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
          throw new Error(`HTTP ${response.status}`)
        }
        
        const result = await response.json()
        setFormData(result || {})
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load record')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id, config.model, apiEndpoint])
  
  // Handle field change
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEdit ? `${config.model}.update` : `${config.model}.create`,
          params: isEdit
            ? { where: { id }, data: formData }
            : { data: formData }
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      
      // Navigate to detail page
      router.push(`/${config.model.toLowerCase()}/${result.id || id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }
  
  // Get fields to show (from config or all fields in data)
  const fields = config.fields || Object.keys(formData)
  
  // Format field name
  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
  }
  
  // Infer field type from value
  const getFieldType = (field: string, value: any): string => {
    if (field.toLowerCase().includes('email')) return 'email'
    if (field.toLowerCase().includes('url')) return 'url'
    if (field.toLowerCase().includes('password')) return 'password'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'checkbox'
    if (field.toLowerCase().includes('description') || field.toLowerCase().includes('bio')) return 'textarea'
    return 'text'
  }
  
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {isEdit ? `Edit ${config.model}` : `New ${config.model}`}
        </h1>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          {fields.map(field => {
            const fieldType = getFieldType(field, formData[field])
            const value = formData[field] ?? ''
            
            // Skip id and system fields
            if (field === 'id' || field === 'createdAt' || field === 'updatedAt') {
              return null
            }
            
            return (
              <div key={field}>
                <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
                  {formatFieldName(field)}
                </label>
                
                {fieldType === 'textarea' ? (
                  <textarea
                    id={field}
                    value={value}
                    onChange={e => handleChange(field, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                ) : fieldType === 'checkbox' ? (
                  <input
                    id={field}
                    type="checkbox"
                    checked={value}
                    onChange={e => handleChange(field, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                ) : (
                  <input
                    id={field}
                    type={fieldType}
                    value={value}
                    onChange={e => handleChange(field, fieldType === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            )
          })}
        </div>
        
        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

