/**
 * Lightweight Component Generator
 * 
 * Generates minimal, flexible components that use hook adapters.
 * Components are lightweight and DX-friendly.
 */

import type { ParsedModel, ParsedSchema } from '../../dmmf-parser.js'

/**
 * Generate lightweight list component
 * 
 * Minimal component that uses hook adapter for data fetching.
 */
export function generateLightweightListComponent(model: ParsedModel): string {
  const modelName = model.name
  const modelLower = model.name.toLowerCase()
  
  return `/**
 * ${modelName} List Component
 * 
 * Lightweight component using hook adapter pattern.
 * Automatically connects to generated hooks.
 */

'use client'

import { use${modelName}Model } from '@/hooks/${modelLower}-adapter'

export interface ${modelName}ListProps {
  /** Query parameters */
  query?: {
    take?: number
    skip?: number
    where?: any
    orderBy?: any
  }
  /** Custom render function */
  children?: (item: any) => React.ReactNode
  /** Loading state */
  loading?: React.ReactNode
  /** Empty state */
  empty?: React.ReactNode
  /** Error state */
  error?: (error: Error) => React.ReactNode
}

export function ${modelName}List({
  query,
  children,
  loading = <div>Loading...</div>,
  empty = <div>No ${modelLower}s found</div>,
  error: errorRender
}: ${modelName}ListProps) {
  const { data, isLoading, error, refetch } = use${modelName}Model(query)
  
  if (isLoading) return <>{loading}</>
  
  if (error) {
    return errorRender ? <>{errorRender(error)}</> : <div>Error: {error.message}</div>
  }
  
  if (!data || data.length === 0) return <>{empty}</>
  
  return (
    <div>
      {data.map((item: any) => 
        children ? children(item) : <div key={item.id}>{JSON.stringify(item)}</div>
      )}
    </div>
  )
}
`
}

/**
 * Generate lightweight detail component
 */
export function generateLightweightDetailComponent(model: ParsedModel): string {
  const modelName = model.name
  const modelLower = model.name.toLowerCase()
  const idType = model.idField?.type === 'String' ? 'string' : 'number'
  
  return `/**
 * ${modelName} Detail Component
 * 
 * Lightweight component using hook adapter pattern.
 */

'use client'

import { ${modelLower}Hooks } from '@/hooks/${modelLower}-adapter'

export interface ${modelName}DetailProps {
  id: ${idType}
  children?: (data: any) => React.ReactNode
  loading?: React.ReactNode
  error?: (error: Error) => React.ReactNode
}

export function ${modelName}Detail({
  id,
  children,
  loading = <div>Loading...</div>,
  error: errorRender
}: ${modelName}DetailProps) {
  const { data, isPending, error } = ${modelLower}Hooks.get(id)
  
  if (isPending) return <>{loading}</>
  
  if (error) {
    return errorRender ? <>{errorRender(error)}</> : <div>Error: {error.message}</div>
  }
  
  if (!data) return <div>Not found</div>
  
  return <>{children ? children(data) : <pre>{JSON.stringify(data, null, 2)}</pre>}</>
}
`
}

/**
 * Generate lightweight form component
 */
export function generateLightweightFormComponent(model: ParsedModel): string {
  const modelName = model.name
  const modelLower = model.name.toLowerCase()
  const idType = model.idField?.type === 'String' ? 'string' : 'number'
  
  return `/**
 * ${modelName} Form Component
 * 
 * Lightweight form component using hook adapters.
 */

'use client'

import { useState } from 'react'
import { ${modelLower}Hooks } from '@/hooks/${modelLower}-adapter'

export interface ${modelName}FormProps {
  id?: ${idType}  // If provided, edit mode
  initialData?: Partial<any>
  onSubmit?: (data: any) => void | Promise<void>
  children?: (props: FormProps) => React.ReactNode
}

interface FormProps {
  data: any
  onChange: (field: string, value: any) => void
  onSubmit: () => Promise<void>
  isSubmitting: boolean
}

export function ${modelName}Form({
  id,
  initialData,
  onSubmit: onSubmitCallback,
  children
}: ${modelName}FormProps) {
  const [formData, setFormData] = useState(initialData || {})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Load existing data if editing
  const { data: existingData } = id ? ${modelLower}Hooks.get(id) : { data: null }
  
  // Merge existing data
  const currentData = existingData ? { ...existingData, ...formData } : formData
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (id) {
        // Update
        await ${modelLower}Hooks.update.mutateAsync({ id, data: formData })
      } else {
        // Create
        await ${modelLower}Hooks.create.mutateAsync(formData)
      }
      onSubmitCallback?.(currentData)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (children) {
    return (
      <>
        {children({
          data: currentData,
          onChange: handleChange,
          onSubmit: handleSubmit,
          isSubmitting
        })}
      </>
    )
  }
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      {/* Auto-generate form fields from model */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : id ? 'Update' : 'Create'}
      </button>
    </form>
  )
}
`
}

/**
 * Generate lightweight components for all models
 */
export function generateLightweightComponents(
  schema: ParsedSchema,
  outputDir: string = 'components/lightweight'
): Map<string, string> {
  const files = new Map<string, string>()
  
  for (const model of schema.models) {
    const modelLower = model.name.toLowerCase()
    
    files.set(
      `${outputDir}/${modelLower}-list.tsx`,
      generateLightweightListComponent(model)
    )
    
    files.set(
      `${outputDir}/${modelLower}-detail.tsx`,
      generateLightweightDetailComponent(model)
    )
    
    files.set(
      `${outputDir}/${modelLower}-form.tsx`,
      generateLightweightFormComponent(model)
    )
  }
  
  // Generate index
  const indexExports = schema.models.map(m => {
    const modelLower = m.name.toLowerCase()
    return `export { ${m.name}List } from './${modelLower}-list.js'
export { ${m.name}Detail } from './${modelLower}-detail.js'
export { ${m.name}Form } from './${modelLower}-form.js'`
  }).join('\n')
  
  files.set(
    `${outputDir}/index.ts`,
    `/**
 * Lightweight Components
 * 
 * Minimal, flexible components using hook adapter pattern.
 */

${indexExports}
`
  )
  
  return files
}

