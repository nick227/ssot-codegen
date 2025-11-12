/**
 * UIAdapter Interface
 * 
 * REDLINE: Pure presentational API, no router/auth/data imports.
 * 
 * CONTRACT:
 * - Receives tokenized styles from theme.json
 * - Components are pure (no side effects)
 * - Variants map to underlying library API
 * - Must not import framework-specific code
 */

import type { ComponentType, ReactNode } from 'react'

// ============================================================================
// Common Props
// ============================================================================

export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type Variant = 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive'
export type Color = 'primary' | 'neutral' | 'success' | 'warning' | 'error' | 'info'

// ============================================================================
// Avatar
// ============================================================================

export interface AvatarProps extends BaseComponentProps {
  src?: string
  alt: string
  size?: Size
  fallback?: string
}

// ============================================================================
// Badge
// ============================================================================

export interface BadgeProps extends BaseComponentProps {
  variant?: Variant
  color?: Color
  children: ReactNode
}

// ============================================================================
// Button
// ============================================================================

export interface ButtonProps extends BaseComponentProps {
  variant?: Variant
  size?: Size
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  children: ReactNode
}

// ============================================================================
// Card
// ============================================================================

export interface CardProps extends BaseComponentProps {
  children: ReactNode
}

// ============================================================================
// Input
// ============================================================================

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  value?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  onChange?: (value: string) => void
}

// ============================================================================
// Select
// ============================================================================

export interface SelectOption {
  label: string
  value: string
}

export interface SelectProps extends BaseComponentProps {
  options: SelectOption[]
  value?: string
  placeholder?: string
  disabled?: boolean
  onChange?: (value: string) => void
}

// ============================================================================
// Checkbox
// ============================================================================

export interface CheckboxProps extends BaseComponentProps {
  checked?: boolean
  disabled?: boolean
  label?: string
  onChange?: (checked: boolean) => void
}

// ============================================================================
// Textarea
// ============================================================================

export interface TextareaProps extends BaseComponentProps {
  value?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  onChange?: (value: string) => void
}

// ============================================================================
// DataTable (Complex)
// ============================================================================

export interface ColumnDef<T = unknown> {
  key: string
  header: string
  sortable?: boolean
  render?: (row: T) => ReactNode
}

export interface DataTableProps<T = unknown> extends BaseComponentProps {
  data: T[]
  columns: ColumnDef<T>[]
  total?: number
  isLoading?: boolean
  error?: string
  
  // Pagination
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  
  // Sorting
  sortBy?: { field: string; dir: 'asc' | 'desc' }
  onSortChange?: (sort: { field: string; dir: 'asc' | 'desc' }) => void
  
  // Row actions
  onRowClick?: (row: T) => void
}

// ============================================================================
// Form (Complex)
// ============================================================================

export interface FormFieldDef {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'date'
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: SelectOption[] // For select fields
}

export interface FormProps extends BaseComponentProps {
  fields: FormFieldDef[]
  values?: Record<string, unknown>
  errors?: Record<string, string>
  isSubmitting?: boolean
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>
  onChange?: (field: string, value: unknown) => void
}

// ============================================================================
// Modal
// ============================================================================

export interface ModalProps extends BaseComponentProps {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
}

// ============================================================================
// Toast
// ============================================================================

export interface ToastProps {
  id?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
  onClose?: () => void
}

// ============================================================================
// Skeleton
// ============================================================================

export interface SkeletonProps extends BaseComponentProps {
  width?: string | number
  height?: string | number
  circle?: boolean
}

// ============================================================================
// Spinner
// ============================================================================

export interface SpinnerProps extends BaseComponentProps {
  size?: Size
}

// ============================================================================
// UIAdapter Interface
// ============================================================================

export interface UIAdapter {
  // Basic components
  Avatar: ComponentType<AvatarProps>
  Badge: ComponentType<BadgeProps>
  Button: ComponentType<ButtonProps>
  Card: ComponentType<CardProps>
  
  // Form controls
  Input: ComponentType<InputProps>
  Select: ComponentType<SelectProps>
  Checkbox: ComponentType<CheckboxProps>
  Textarea: ComponentType<TextareaProps>
  
  // Complex components
  DataTable: ComponentType<DataTableProps>
  Form: ComponentType<FormProps>
  Modal: ComponentType<ModalProps>
  Toast: ComponentType<ToastProps>
  
  // Loading states
  Skeleton: ComponentType<SkeletonProps>
  Spinner: ComponentType<SpinnerProps>
}

