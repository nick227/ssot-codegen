/**
 * Component Library Generator
 * 
 * Generates reusable component library (static, interactive, data)
 */

import type { ComponentLibraryConfig } from './types.js'

export function generateComponentLibrary(config: ComponentLibraryConfig): Map<string, string> {
  const files = new Map<string, string>()
  const { outputDir, library } = config
  
  // Static components
  files.set(`${outputDir}/static/DataTable.tsx`, generateDataTable(library))
  files.set(`${outputDir}/static/DataGrid.tsx`, generateDataGrid(library))
  files.set(`${outputDir}/static/Badge.tsx`, generateBadge(library))
  files.set(`${outputDir}/static/Stat.tsx`, generateStat(library))
  files.set(`${outputDir}/static/index.ts`, generateStaticIndex())
  
  // Interactive components
  files.set(`${outputDir}/interactive/Button.tsx`, generateButton(library))
  files.set(`${outputDir}/interactive/SearchBox.tsx`, generateSearchBox(library))
  files.set(`${outputDir}/interactive/FilterBar.tsx`, generateFilterBar(library))
  files.set(`${outputDir}/interactive/index.ts`, generateInteractiveIndex())
  
  // Data components
  files.set(`${outputDir}/data/ListPage.tsx`, generateListPage(library))
  files.set(`${outputDir}/data/DetailPage.tsx`, generateDetailPage(library))
  files.set(`${outputDir}/data/FormPage.tsx`, generateFormPage(library))
  files.set(`${outputDir}/data/index.ts`, generateDataIndex())
  
  // Main index
  files.set(`${outputDir}/index.ts`, generateMainIndex())
  
  return files
}

function generateDataTable(library: string): string {
  return `/**
 * DataTable Component
 * 
 * STATIC: Display-only table component
 * Library: ${library}
 */

'use client'

import { useExpression } from '@ssot-ui/expressions'

export interface ColumnDef<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  visibleWhen?: any  // Expression
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  loading,
  emptyMessage = 'No data available'
}: DataTableProps<T>) {
  const evaluateExpression = useExpression()
  
  // Filter visible columns based on expressions
  const visibleColumns = columns.filter(col => {
    if (!col.visibleWhen) return true
    return evaluateExpression(col.visibleWhen, {})
  })
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-2"></div>
        <div className="h-32 bg-gray-100 rounded"></div>
      </div>
    )
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    )
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {visibleColumns.map(col => (
              <th 
                key={col.key} 
                className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={\`border-t border-gray-300 hover:bg-gray-50 \${
                onRowClick ? 'cursor-pointer' : ''
              }\`}
            >
              {visibleColumns.map(col => (
                <td key={col.key} className="border border-gray-300 px-4 py-3">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
`
}

function generateDataGrid(library: string): string {
  return `/**
 * DataGrid Component
 * 
 * STATIC: Card-based grid layout
 * Library: ${library}
 */

'use client'

export interface DataGridProps<T> {
  data: T[]
  renderCard: (item: T) => React.ReactNode
  columns?: number
  gap?: number
  loading?: boolean
}

export function DataGrid<T>({
  data,
  renderCard,
  columns = 3,
  gap = 4,
  loading
}: DataGridProps<T>) {
  if (loading) {
    return (
      <div className={\`grid grid-cols-\${columns} gap-\${gap}\`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className={\`grid grid-cols-1 md:grid-cols-\${columns} gap-\${gap}\`}>
      {data.map((item, idx) => (
        <div key={idx}>
          {renderCard(item)}
        </div>
      ))}
    </div>
  )
}
`
}

function generateBadge(library: string): string {
  return `/**
 * Badge Component
 * 
 * STATIC: Status/label display
 * Library: ${library}
 */

'use client'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  }
  
  return (
    <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${variantClasses[variant]}\`}>
      {children}
    </span>
  )
}
`
}

function generateStat(library: string): string {
  return `/**
 * Stat Component
 * 
 * STATIC: Numeric stat display
 * Library: ${library}
 */

'use client'

export interface StatProps {
  label: string
  value: string | number
  change?: number  // Percentage change
  icon?: React.ReactNode
}

export function Stat({ label, value, change, icon }: StatProps) {
  const changeColor = change && change > 0 ? 'text-green-600' : 'text-red-600'
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change !== undefined && (
            <p className={\`text-sm mt-2 \${changeColor}\`}>
              {change > 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
`
}

function generateButton(library: string): string {
  return `/**
 * Button Component
 * 
 * INTERACTIVE: Action button with centralized handlers
 * Library: ${library}
 */

'use client'

import { useActionHandlers } from '../handlers'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  onClick?: () => void | Promise<void>
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  variant = 'primary',
  size = 'md',
  onClick,
  loading,
  disabled,
  children,
  type = 'button'
}: ButtonProps) {
  const { isExecuting, handleAction } = useActionHandlers()
  
  const handleClick = async () => {
    if (onClick) {
      await handleAction('custom', onClick)
    }
  }
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  const isLoading = loading || isExecuting
  
  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={\`
        rounded font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        \${variantClasses[variant]}
        \${sizeClasses[size]}
      \`}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  )
}
`
}

function generateSearchBox(library: string): string {
  return `/**
 * SearchBox Component
 * 
 * INTERACTIVE: Search input with debounce
 * Library: ${library}
 */

'use client'

import { useState, useEffect } from 'react'

export interface SearchBoxProps {
  onSearch: (query: string) => void
  placeholder?: string
  debounceMs?: number
}

export function SearchBox({ 
  onSearch, 
  placeholder = 'Search...', 
  debounceMs = 300 
}: SearchBoxProps) {
  const [query, setQuery] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [query, debounceMs, onSearch])
  
  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <svg 
        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  )
}
`
}

function generateFilterBar(library: string): string {
  return `/**
 * FilterBar Component
 * 
 * INTERACTIVE: Filter controls
 * Library: ${library}
 */

'use client'

import { useState } from 'react'

export interface FilterDef {
  field: string
  label: string
  type: 'select' | 'text' | 'date'
  options?: string[]
}

export interface FilterBarProps {
  filters: FilterDef[]
  onFilterChange: (filters: Record<string, any>) => void
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  
  const handleChange = (field: string, value: any) => {
    const newFilters = { ...filterValues, [field]: value }
    setFilterValues(newFilters)
    onFilterChange(newFilters)
  }
  
  return (
    <div className="flex gap-4 flex-wrap">
      {filters.map(filter => (
        <div key={filter.field} className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {filter.label}
          </label>
          {filter.type === 'select' ? (
            <select
              value={filterValues[filter.field] || ''}
              onChange={(e) => handleChange(filter.field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {filter.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type={filter.type}
              value={filterValues[filter.field] || ''}
              onChange={(e) => handleChange(filter.field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      ))}
    </div>
  )
}
`
}

function generateListPage(library: string): string {
  return `/**
 * ListPage Component
 * 
 * DATA: Complete list page with table/grid, search, filters
 * Library: ${library}
 */

'use client'

import { useDataHandlers, useNavigationHandlers } from '../handlers'
import { DataTable, type ColumnDef } from '../static/DataTable'
import { Button } from '../interactive/Button'
import { SearchBox } from '../interactive/SearchBox'
import { FilterBar, type FilterDef } from '../interactive/FilterBar'

export interface ListPageProps<T> {
  model: string
  title?: string
  columns: ColumnDef<T>[]
  filters?: FilterDef[]
  enableSearch?: boolean
  enableCreate?: boolean
  onRowClick?: (row: T) => void
}

export function ListPage<T extends Record<string, any>>({
  model,
  title,
  columns,
  filters,
  enableSearch = true,
  enableCreate = true,
  onRowClick
}: ListPageProps<T>) {
  const { data, loading, execute } = useDataHandlers<T[]>(model, 'list', { autoLoad: true })
  const { navigateTo } = useNavigationHandlers()
  
  const handleSearch = (query: string) => {
    // TODO: Implement search
    console.log('Search:', query)
  }
  
  const handleFilterChange = (filters: Record<string, any>) => {
    // TODO: Implement filtering
    console.log('Filters:', filters)
  }
  
  const handleRowClick = (row: T) => {
    if (onRowClick) {
      onRowClick(row)
    } else {
      navigateTo(\`/\${model.toLowerCase()}/\${row.id}\`)
    }
  }
  
  const handleCreate = () => {
    navigateTo(\`/\${model.toLowerCase()}/new\`)
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {title || \`\${model}s\`}
        </h1>
        {enableCreate && (
          <Button variant="primary" onClick={handleCreate}>
            Create New
          </Button>
        )}
      </div>
      
      {/* Search & Filters */}
      {(enableSearch || filters) && (
        <div className="mb-6 space-y-4">
          {enableSearch && (
            <SearchBox onSearch={handleSearch} />
          )}
          {filters && (
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />
          )}
        </div>
      )}
      
      {/* Table */}
      <DataTable
        data={data || []}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
      />
    </div>
  )
}
`
}

function generateDetailPage(library: string): string {
  return `/**
 * DetailPage Component
 * 
 * DATA: Record detail view
 * Library: ${library}
 */

'use client'

import { useDataHandlers, useNavigationHandlers, useActionHandlers } from '../handlers'
import { Button } from '../interactive/Button'

export interface DetailPageProps {
  model: string
  id: string
  fields: string[]
}

export function DetailPage({ model, id, fields }: DetailPageProps) {
  const { data, loading } = useDataHandlers(model, 'detail', { autoLoad: true })
  const { navigateTo, navigateBack } = useNavigationHandlers()
  const { handleDelete } = useActionHandlers()
  
  const handleEdit = () => {
    navigateTo(\`/\${model.toLowerCase()}/\${id}/edit\`)
  }
  
  const handleDeleteClick = async () => {
    await handleDelete(async () => {
      // TODO: Implement delete
      navigateBack(\`/\${model.toLowerCase()}\`)
    })
  }
  
  if (loading) {
    return <div className="p-6">Loading...</div>
  }
  
  if (!data) {
    return <div className="p-6">Not found</div>
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{model} Details</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleEdit}>Edit</Button>
          <Button variant="danger" onClick={handleDeleteClick}>Delete</Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <dl className="space-y-4">
          {fields.map(field => (
            <div key={field} className="flex border-b border-gray-100 pb-4">
              <dt className="w-1/3 font-medium text-gray-700">{field}:</dt>
              <dd className="w-2/3 text-gray-900">{String(data[field] || '-')}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
`
}

function generateFormPage(library: string): string {
  return `/**
 * FormPage Component
 * 
 * DATA: Create/Edit form
 * Library: ${library}
 */

'use client'

import { useFormHandlers, useDataHandlers, useNavigationHandlers } from '../handlers'
import { Button } from '../interactive/Button'

export interface FormPageProps {
  model: string
  id?: string  // If editing
  fields: string[]
}

export function FormPage({ model, id, fields }: FormPageProps) {
  const isEdit = !!id
  const { data: existingData } = useDataHandlers(model, 'detail', { autoLoad: isEdit })
  const { navigateBack } = useNavigationHandlers()
  
  const { formData, errors, isDirty, handleChange, handleSubmit } = useFormHandlers({
    initialData: existingData || {},
    onSubmit: async (data) => {
      // TODO: Implement save
      console.log('Save:', data)
      navigateBack(\`/\${model.toLowerCase()}\`)
    }
  })
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? \`Edit \${model}\` : \`Create \${model}\`}
      </h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field}
              </label>
              <input
                type="text"
                value={formData[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors[field] && (
                <p className="mt-1 text-sm text-red-600">{errors[field]}</p>
              )}
            </div>
          ))}
        </div>
        
        {errors.submit && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {errors.submit}
          </div>
        )}
        
        <div className="mt-6 flex justify-end gap-2">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => navigateBack()}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {isEdit ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
`
}

// Index generators
function generateStaticIndex(): string {
  return `export { DataTable, type ColumnDef, type DataTableProps } from './DataTable.js'
export { DataGrid, type DataGridProps } from './DataGrid.js'
export { Badge, type BadgeVariant, type BadgeProps } from './Badge.js'
export { Stat, type StatProps } from './Stat.js'
`
}

function generateInteractiveIndex(): string {
  return `export { Button, type ButtonVariant, type ButtonSize, type ButtonProps } from './Button.js'
export { SearchBox, type SearchBoxProps } from './SearchBox.js'
export { FilterBar, type FilterDef, type FilterBarProps } from './FilterBar.js'
`
}

function generateDataIndex(): string {
  return `export { ListPage, type ListPageProps } from './ListPage.js'
export { DetailPage, type DetailPageProps } from './DetailPage.js'
export { FormPage, type FormPageProps } from './FormPage.js'
`
}

function generateMainIndex(): string {
  return `/**
 * SSOT Component Library
 * 
 * Reusable, transformable component library for generated UIs
 */

// Handlers
export * from './handlers/index.js'

// Static components
export * from './static/index.js'

// Interactive components
export * from './interactive/index.js'

// Data components
export * from './data/index.js'
`
}

