/**
 * Smart Component Generator
 * 
 * Generates self-contained components that:
 * - Talk directly to SDK
 * - Fetch their own data
 * - Handle common actions (delete, save, etc.)
 * - Show loading/error states
 * 
 * NO handler abstraction layer - components are smart!
 */

export function generateSmartComponents(outputDir: string): Map<string, string> {
  const files = new Map<string, string>()
  
  // Core smart components
  files.set(`${outputDir}/Button.tsx`, generateSmartButton())
  files.set(`${outputDir}/DataTable.tsx`, generateSmartDataTable())
  files.set(`${outputDir}/Form.tsx`, generateSmartForm())
  
  // Helper utilities
  files.set(`${outputDir}/sdk-client.ts`, generateSdkClient())
  files.set(`${outputDir}/toast.ts`, generateToast())
  
  // Index
  files.set(`${outputDir}/index.ts`, generateComponentsIndex())
  
  return files
}

function generateSmartButton(): string {
  return `/**
 * Smart Button Component
 * 
 * Built-in behaviors:
 * - delete: Confirms, calls SDK, shows toast, triggers callback
 * - save: Calls SDK (create/update), shows toast
 * - custom: Your own onClick logic
 * 
 * Expression support:
 * - enabledWhen: Show/hide based on expression
 * - visibleWhen: Enable/disable based on expression
 */

'use client'

import { useState } from 'react'
import { getSdk } from './sdk-client'
import { toast } from './toast'
import { useExpression } from '@ssot-ui/expressions'

export type ButtonAction = 'delete' | 'save' | 'custom'
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  // Expression support
  visibleWhen?: any  // Expression
  enabledWhen?: any  // Expression
  data?: any  // Context data for expressions
  
  // Built-in action (delete, save)
  action?: ButtonAction
  model?: string
  id?: string
  data?: any
  
  // Custom action
  onClick?: () => void | Promise<void>
  
  // Messages
  confirmMessage?: string
  successMessage?: string
  errorMessage?: string
  
  // Callbacks
  onSuccess?: (result?: any) => void
  onError?: (error: Error) => void
  
  // Styling
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  action,
  model,
  id,
  data,
  onClick,
  confirmMessage,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  type = 'button',
  visibleWhen,
  enabledWhen
}: ButtonProps) {
  const [loading, setLoading] = useState(false)
  const evaluateExpression = useExpression()
  
  // Check visibility
  if (visibleWhen && !evaluateExpression(visibleWhen, data || {})) {
    return null
  }
  
  // Check enabled state
  const isExpressionEnabled = enabledWhen 
    ? evaluateExpression(enabledWhen, data || {})
    : true
  
  const handleClick = async () => {
    // Custom onClick
    if (onClick) {
      setLoading(true)
      try {
        await onClick()
        if (successMessage) toast.success(successMessage)
        onSuccess?.()
      } catch (err) {
        const error = err as Error
        toast.error(errorMessage || error.message)
        onError?.(error)
      } finally {
        setLoading(false)
      }
      return
    }
    
    // Built-in action
    if (action && model) {
      await handleBuiltInAction(action, model, id, data)
    }
  }
  
  const handleBuiltInAction = async (
    action: ButtonAction,
    model: string,
    id?: string,
    data?: any
  ) => {
    // Confirmation for delete
    if (action === 'delete') {
      const message = confirmMessage || \`Delete this \${model}?\`
      if (!confirm(message)) return
    }
    
    setLoading(true)
    
    try {
      const sdk = getSdk()
      let result
      
      switch (action) {
        case 'delete':
          if (!id) throw new Error('ID required for delete')
          result = await sdk[model].delete({ where: { id } })
          toast.success(successMessage || \`\${model} deleted\`)
          break
          
        case 'save':
          if (id) {
            // Update
            result = await sdk[model].update({ where: { id }, data })
            toast.success(successMessage || \`\${model} updated\`)
          } else {
            // Create
            result = await sdk[model].create({ data })
            toast.success(successMessage || \`\${model} created\`)
          }
          break
      }
      
      onSuccess?.(result)
      
    } catch (err) {
      const error = err as Error
      toast.error(errorMessage || \`\${action} failed: \${error.message}\`)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }
  
  // Variant classes
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent hover:bg-gray-100'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading || !isExpressionEnabled}
      className={\`
        rounded font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        \${variants[variant]}
        \${sizes[size]}
      \`.trim()}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}
`
}

function generateSmartDataTable(): string {
  return `/**
 * Smart DataTable Component
 * 
 * Self-contained table that:
 * - Fetches its own data from SDK
 * - Shows loading state
 * - Handles row clicks
 * - Supports inline actions
 */

'use client'

import { useState, useEffect } from 'react'
import { getSdk } from './sdk-client'
import { Button } from './Button'

export interface ColumnDef<T = any> {
  key: string
  label: string
  render?: (value: any, row: T) => React.ReactNode
}

export interface ActionDef {
  label: string
  action: 'delete' | 'custom'
  variant?: 'primary' | 'secondary' | 'danger'
  onClick?: (row: any) => void | Promise<void>
  confirm?: string
}

export interface DataTableProps<T = any> {
  model: string
  columns: ColumnDef<T>[]
  actions?: ActionDef[]
  onRowClick?: (row: T) => void
  where?: any
  orderBy?: any
  take?: number
}

export function DataTable<T extends { id: string }>({
  model,
  columns,
  actions,
  onRowClick,
  where,
  orderBy,
  take = 50
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const sdk = getSdk()
      const result = await sdk[model].findMany({
        where,
        orderBy,
        take
      })
      setData(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchData()
  }, [model, JSON.stringify(where), JSON.stringify(orderBy)])
  
  const handleActionSuccess = () => {
    // Refetch data after action
    fetchData()
  }
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
        Error: {error}
      </div>
    )
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No {model}s found
      </div>
    )
  }
  
  return (
    <div className="overflow-x-auto border border-gray-300 rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-300">
          <tr>
            {columns.map(col => (
              <th 
                key={col.key}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
              >
                {col.label}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={\`
                border-b border-gray-200
                \${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              \`.trim()}
            >
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {col.render 
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '-')
                  }
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {actions.map((action, actionIdx) => (
                      <Button
                        key={actionIdx}
                        action={action.action}
                        model={model}
                        id={row.id}
                        onClick={action.onClick ? () => action.onClick!(row) : undefined}
                        variant={action.variant || 'secondary'}
                        size="sm"
                        confirmMessage={action.confirm}
                        onSuccess={handleActionSuccess}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
`
}

function generateSmartForm(): string {
  return `/**
 * Smart Form Component
 * 
 * Self-contained form that:
 * - Manages form state
 * - Validates on submit
 * - Calls SDK (create/update)
 * - Shows errors inline
 */

'use client'

import { useState, useEffect } from 'react'
import { getSdk } from './sdk-client'
import { Button } from './Button'

export interface FieldDef {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox'
  required?: boolean
  options?: string[]  // For select
  placeholder?: string
}

export interface FormProps {
  model: string
  fields: FieldDef[]
  id?: string  // If editing
  onSuccess?: (result: any) => void
  onCancel?: () => void
}

export function Form({ model, fields, id, onSuccess, onCancel }: FormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  
  // Fetch existing data if editing
  useEffect(() => {
    if (id) {
      const sdk = getSdk()
      sdk[model].findOne({ where: { id } })
        .then(setFormData)
        .finally(() => setLoading(false))
    }
  }, [model, id])
  
  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = \`\${field.label} is required\`
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setSaving(true)
    setErrors({})
    
    try {
      const sdk = getSdk()
      let result
      
      if (id) {
        // Update
        result = await sdk[model].update({
          where: { id },
          data: formData
        })
      } else {
        // Create
        result = await sdk[model].create({
          data: formData
        })
      }
      
      onSuccess?.(result)
      
    } catch (err) {
      setErrors({ submit: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return <div className="p-6">Loading...</div>
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {field.type === 'textarea' ? (
            <textarea
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : field.type === 'select' ? (
            <select
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === 'checkbox' ? (
            <input
              type="checkbox"
              checked={formData[field.name] || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          ) : (
            <input
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
          
          {errors[field.name] && (
            <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
          )}
        </div>
      ))}
      
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {errors.submit}
        </div>
      )}
      
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : id ? 'Save Changes' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
`
}

function generateSdkClient(): string {
  return `/**
 * SDK Client
 * 
 * Simple wrapper around generated SDK
 * Components use this to talk to the API
 */

export interface SdkMethod {
  findMany: (params?: any) => Promise<any[]>
  findOne: (params: { where: { id: string } }) => Promise<any>
  create: (params: { data: any }) => Promise<any>
  update: (params: { where: { id: string }, data: any }) => Promise<any>
  delete: (params: { where: { id: string } }) => Promise<any>
}

export type Sdk = Record<string, SdkMethod>

// Global SDK instance (set by generated code)
let sdkInstance: Sdk | null = null

export function setSdk(sdk: Sdk) {
  sdkInstance = sdk
}

export function getSdk(): Sdk {
  if (!sdkInstance) {
    // Fallback to fetch-based implementation
    return createFetchSdk()
  }
  return sdkInstance
}

// Fetch-based SDK (fallback if no generated SDK)
function createFetchSdk(): Sdk {
  return new Proxy({} as Sdk, {
    get: (target, model: string) => ({
      findMany: async (params?: any) => {
        const response = await fetch(\`/api/\${model}\`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`)
        return response.json()
      },
      
      findOne: async (params: { where: { id: string } }) => {
        const response = await fetch(\`/api/\${model}/\${params.where.id}\`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`)
        return response.json()
      },
      
      create: async (params: { data: any }) => {
        const response = await fetch(\`/api/\${model}\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params.data)
        })
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`)
        return response.json()
      },
      
      update: async (params: { where: { id: string }, data: any }) => {
        const response = await fetch(\`/api/\${model}/\${params.where.id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params.data)
        })
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`)
        return response.json()
      },
      
      delete: async (params: { where: { id: string } }) => {
        const response = await fetch(\`/api/\${model}/\${params.where.id}\`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`)
        return response.json()
      }
    })
  })
}
`
}

function generateToast(): string {
  return `/**
 * Toast Notifications
 * 
 * Simple toast system (can be replaced with react-hot-toast, sonner, etc.)
 */

export const toast = {
  success: (message: string) => {
    console.log('✓', message)
    // TODO: Replace with actual toast library
    if (typeof window !== 'undefined') {
      alert('✓ ' + message)
    }
  },
  
  error: (message: string) => {
    console.error('✗', message)
    // TODO: Replace with actual toast library
    if (typeof window !== 'undefined') {
      alert('✗ ' + message)
    }
  },
  
  info: (message: string) => {
    console.log('ℹ', message)
    // TODO: Replace with actual toast library
    if (typeof window !== 'undefined') {
      alert('ℹ ' + message)
    }
  }
}
`
}

function generateComponentsIndex(): string {
  return `/**
 * Smart Components
 * 
 * Self-contained components that integrate directly with SDK
 */

export { Button, type ButtonProps, type ButtonAction, type ButtonVariant, type ButtonSize } from './Button.js'
export { DataTable, type DataTableProps, type ColumnDef, type ActionDef } from './DataTable.js'
export { Form, type FormProps, type FieldDef } from './Form.js'
export { getSdk, setSdk, type Sdk, type SdkMethod } from './sdk-client.js'
export { toast } from './toast.js'
`
}

