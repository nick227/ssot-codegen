/**
 * Page Stub Generator
 * 
 * Generates minimal page stubs that use smart components
 * Pages are ~20-30 lines each (declarative, not imperative)
 */

import type { ParsedModel } from '../../dmmf-parser.js'

export function generatePageStubs(model: ParsedModel, outputDir: string): Map<string, string> {
  const files = new Map<string, string>()
  const modelName = model.name
  const modelLower = modelName.toLowerCase()
  
  // List page
  files.set(`${outputDir}/${modelLower}/page.tsx`, generateListPage(model))
  
  // Detail page
  files.set(`${outputDir}/${modelLower}/[id]/page.tsx`, generateDetailPage(model))
  
  // Create page
  files.set(`${outputDir}/${modelLower}/new/page.tsx`, generateCreatePage(model))
  
  // Edit page
  files.set(`${outputDir}/${modelLower}/[id]/edit/page.tsx`, generateEditPage(model))
  
  return files
}

function generateListPage(model: ParsedModel): string {
  const modelName = model.name
  const modelLower = modelName.toLowerCase()
  
  // Get display fields (first 5 non-relation fields)
  const displayFields = model.fields
    .filter(f => f.kind !== 'object' && f.name !== 'id')
    .slice(0, 5)
  
  return `/**
 * ${modelName} List Page
 * 
 * Generated page stub using smart components
 */

'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/ssot'

export default function ${modelName}ListPage() {
  const router = useRouter()
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          ${modelName}s
        </h1>
        <button
          onClick={() => router.push('/${modelLower}/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create ${modelName}
        </button>
      </div>
      
      {/* Table with smart component */}
      <DataTable
        model="${modelLower}"
        columns={[
${displayFields.map(f => `          { key: '${f.name}', label: '${formatLabel(f.name)}' }`).join(',\n')}
        ]}
        actions={[
          {
            label: 'Delete',
            action: 'delete',
            variant: 'danger',
            confirm: 'Delete this ${modelLower}?'
          }
        ]}
        onRowClick={(row) => router.push(\`/${modelLower}/\${row.id}\`)}
      />
    </div>
  )
}
`
}

function generateDetailPage(model: ParsedModel): string {
  const modelName = model.name
  const modelLower = modelName.toLowerCase()
  
  // Get all non-relation fields
  const displayFields = model.fields.filter(f => f.kind !== 'object')
  
  return `/**
 * ${modelName} Detail Page
 * 
 * Generated page stub using smart components
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSdk, Button } from '@/components/ssot'

export default function ${modelName}DetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const sdk = getSdk()
    sdk.${modelLower}.findOne({ where: { id: params.id } })
      .then(setData)
      .finally(() => setLoading(false))
  }, [params.id])
  
  if (loading) return <div className="p-6">Loading...</div>
  if (!data) return <div className="p-6">Not found</div>
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          ${modelName} Details
        </h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => router.push(\`/${modelLower}/\${params.id}/edit\`)}
          >
            Edit
          </Button>
          <Button
            action="delete"
            model="${modelLower}"
            id={params.id}
            variant="danger"
            confirmMessage="Delete this ${modelLower}?"
            successMessage="${modelName} deleted"
            onSuccess={() => router.push('/${modelLower}')}
          >
            Delete
          </Button>
        </div>
      </div>
      
      {/* Details */}
      <div className="bg-white rounded-lg border border-gray-300 p-6">
        <dl className="space-y-4">
${displayFields.map(f => `          <div className="flex border-b border-gray-100 pb-4">
            <dt className="w-1/3 font-medium text-gray-700">${formatLabel(f.name)}:</dt>
            <dd className="w-2/3 text-gray-900">{String(data.${f.name} ?? '-')}</dd>
          </div>`).join('\n')}
        </dl>
      </div>
      
      {/* Back button */}
      <div className="mt-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          ← Back
        </Button>
      </div>
    </div>
  )
}
`
}

function generateCreatePage(model: ParsedModel): string {
  const modelName = model.name
  const modelLower = modelName.toLowerCase()
  
  // Get editable fields (exclude id, createdAt, updatedAt)
  const editableFields = model.fields.filter(f => 
    f.kind !== 'object' && 
    f.name !== 'id' && 
    !f.name.match(/^(createdAt|updatedAt)$/i)
  )
  
  return `/**
 * ${modelName} Create Page
 * 
 * Generated page stub using smart components
 */

'use client'

import { useRouter } from 'next/navigation'
import { Form } from '@/components/ssot'

export default function ${modelName}CreatePage() {
  const router = useRouter()
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Create ${modelName}
      </h1>
      
      <div className="bg-white rounded-lg border border-gray-300 p-6">
        <Form
          model="${modelLower}"
          fields={[
${editableFields.map(f => `            { 
              name: '${f.name}', 
              label: '${formatLabel(f.name)}', 
              type: '${mapFieldType(f.type)}',
              required: ${f.isRequired}
            }`).join(',\n')}
          ]}
          onSuccess={(result) => router.push(\`/${modelLower}/\${result.id}\`)}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  )
}
`
}

function generateEditPage(model: ParsedModel): string {
  const modelName = model.name
  const modelLower = modelName.toLowerCase()
  
  // Get editable fields
  const editableFields = model.fields.filter(f => 
    f.kind !== 'object' && 
    f.name !== 'id' && 
    !f.name.match(/^(createdAt|updatedAt)$/i)
  )
  
  return `/**
 * ${modelName} Edit Page
 * 
 * Generated page stub using smart components
 */

'use client'

import { useRouter } from 'next/navigation'
import { Form } from '@/components/ssot'

export default function ${modelName}EditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Edit ${modelName}
      </h1>
      
      <div className="bg-white rounded-lg border border-gray-300 p-6">
        <Form
          model="${modelLower}"
          id={params.id}
          fields={[
${editableFields.map(f => `            { 
              name: '${f.name}', 
              label: '${formatLabel(f.name)}', 
              type: '${mapFieldType(f.type)}',
              required: ${f.isRequired}
            }`).join(',\n')}
          ]}
          onSuccess={(result) => router.push(\`/${modelLower}/\${result.id}\`)}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  )
}
`
}

// Helper functions
function formatLabel(fieldName: string): string {
  // Convert camelCase to Title Case
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

function mapFieldType(prismaType: string): string {
  const typeMap: Record<string, string> = {
    'String': 'text',
    'Int': 'number',
    'Float': 'number',
    'Boolean': 'checkbox',
    'DateTime': 'text',  // TODO: Use date picker
    'Json': 'textarea'
  }
  
  return typeMap[prismaType] || 'text'
}

