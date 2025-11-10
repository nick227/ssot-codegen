/**
 * Type definitions for @ssot-ui/data-table
 * Based on SDK Hook Contract v1.0.0
 */

import type { ReactNode } from 'react'

/**
 * SDK Hook Contract (LOCKED v1.0.0)
 */
export interface UseListResult<T> {
  data: T[]
  total: number
  isLoading: boolean
  isFetching: boolean
  error: ErrorShape | null
  refetch: () => void
}

export interface ListParams {
  page?: number
  pageSize?: number
  sort?: SortParam[]
  filters?: FilterParam[]
  search?: SearchParam
  include?: Record<string, boolean | NestedInclude>
}

export interface SortParam {
  field: string
  dir: 'asc' | 'desc'
}

export interface FilterParam {
  field: string
  op: FilterOperator
  value: any
}

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'in'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'between'

export interface SearchParam {
  query: string
  fields?: string[]
}

export interface ErrorShape {
  code: string
  message: string
  details?: unknown
}

export type NestedInclude = boolean | { include?: Record<string, NestedInclude> }

/**
 * DataTable Component Props
 */
export interface DataTableProps<T = any> {
  // Data source (hook mode)
  resource?: string
  hook?: (params?: ListParams) => UseListResult<T> | ((resource: string, params?: ListParams) => UseListResult<T>)
  hookParams?: Omit<ListParams, 'page' | 'pageSize' | 'sort' | 'filters' | 'search'>
  
  // OR explicit data mode
  data?: T[]
  total?: number
  isLoading?: boolean
  error?: ErrorShape | null
  onParamsChange?: (params: ListParams) => void
  
  // Columns (REQUIRED)
  columns: ColumnDef<T>[]
  
  // Search
  searchable?: boolean | string[]
  searchPlaceholder?: string
  
  // Filters
  filterable?: FilterDef<T>[]
  
  // Sorting
  defaultSort?: SortParam[]
  
  // Pagination
  pagination?: 'pages' | 'infinite' | false
  defaultPageSize?: number
  pageSizeOptions?: number[]
  
  // Row actions
  rowActions?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  
  // Export
  exportable?: boolean | 'client' | 'server'
  exportFilename?: string
  onExportServer?: (params: ListParams) => Promise<Blob>
  
  // Customization
  emptyState?: ReactNode
  loadingState?: ReactNode
  errorState?: (error: ErrorShape) => ReactNode
  
  // Virtualization
  virtualize?: boolean | { threshold: number }
  rowHeight?: number
  
  // Messages (i18n)
  messages?: Messages
  
  // Styling
  className?: string
  tableClassName?: string
  compact?: boolean
}

export interface ColumnDef<T> {
  key: string
  header: string
  sortable?: boolean
  filterType?: FilterType
  width?: number | string
  align?: 'left' | 'center' | 'right'
  cellRender?: (value: any, row: T, index: number) => ReactNode
  headerRender?: (column: ColumnDef<T>) => ReactNode
  visible?: boolean | ((row: T) => boolean)
  exportable?: boolean
  exportFormat?: (value: any) => string
}

export type FilterType =
  | 'text'
  | 'enum'
  | 'boolean'
  | 'date-range'
  | 'number-range'

export interface FilterDef<T> {
  field: string
  type: FilterType
  label?: string
  options?: Array<{ label: string; value: any }>
  min?: number | Date
  max?: number | Date
  filterFn?: (row: T, value: any) => boolean
}

export interface Messages {
  search?: string
  noResults?: string
  loading?: string
  error?: string
  showing?: string
  rowsPerPage?: string
  export?: string
  exportSuccess?: string
  filters?: string
  clearFilters?: string
  applyFilters?: string
}

/**
 * Internal state management
 */
export interface TableState {
  page: number
  pageSize: number
  sort: SortParam[]
  filters: FilterParam[]
  search: SearchParam | null
}

