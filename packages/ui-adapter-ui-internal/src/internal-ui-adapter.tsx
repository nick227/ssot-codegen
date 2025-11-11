/**
 * InternalUIAdapter
 * 
 * Wraps existing @ssot-ui components to match UIAdapter interface.
 * Reuses: @ssot-ui/shared (Avatar, Badge, Button, Card)
 *         @ssot-ui/data-table (DataTable)
 */

import type { UIAdapter } from '@ssot-ui/adapters'
import {
  Avatar as SSAvatar,
  Badge as SSBadge,
  Button as SSButton,
  Card as SSCard
} from '@ssot-ui/shared'
import { DataTable as SSDataTable } from '@ssot-ui/data-table'

// Adapter wrappers to match UIAdapter interface
const AvatarWrapper: UIAdapter['Avatar'] = ({ src, alt, size, className }) => (
  <SSAvatar
    src={src}
    alt={alt}
    size={size === 'xs' ? 'sm' : size as any}
    className={className}
  />
)

const BadgeWrapper: UIAdapter['Badge'] = ({ children, variant, className }) => {
  const mappedVariant = variant === 'secondary' ? 'neutral' : 
                        variant === 'destructive' ? 'error' : 
                        variant as any
  return <SSBadge variant={mappedVariant} className={className}>{children}</SSBadge>
}

const ButtonWrapper: UIAdapter['Button'] = ({ children, variant, size, disabled, type, onClick, className }) => {
  const mappedVariant = variant === 'destructive' ? 'danger' : 
                        variant === 'default' ? 'primary' : 
                        variant as any
  return (
    <SSButton
      variant={mappedVariant}
      size={size as any}
      disabled={disabled}
      onClick={onClick}
      className={className}
      type={type}
    >
      {children}
    </SSButton>
  )
}

const CardWrapper: UIAdapter['Card'] = ({ children, className }) => (
  <SSCard className={className}>{children}</SSCard>
)

// Wrapper components to match interface
const Input: UIAdapter['Input'] = ({ value, onChange, ...props }) => (
  <input
    {...props}
    value={value || ''}
    onChange={(e) => onChange?.(e.target.value)}
    className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${props.className || ''}`}
  />
)

const Select: UIAdapter['Select'] = ({ options, value, onChange, ...props }) => (
  <select
    {...props}
    value={value || ''}
    onChange={(e) => onChange?.(e.target.value)}
    className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${props.className || ''}`}
  >
    {props.placeholder && <option value="">{props.placeholder}</option>}
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
)

const Checkbox: UIAdapter['Checkbox'] = ({ checked, onChange, label, ...props }) => (
  <label className={`flex items-center gap-2 ${props.className || ''}`}>
    <input
      type="checkbox"
      checked={checked || false}
      onChange={(e) => onChange?.(e.target.checked)}
      disabled={props.disabled}
      className="w-4 h-4"
    />
    {label && <span>{label}</span>}
  </label>
)

const Textarea: UIAdapter['Textarea'] = ({ value, onChange, ...props }) => (
  <textarea
    {...props}
    value={value || ''}
    onChange={(e) => onChange?.(e.target.value)}
    className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${props.className || ''}`}
  />
)

// Wrap DataTable
const DataTableWrapper: UIAdapter['DataTable'] = (props) => {
  // Convert UIAdapter props to SSDataTable props
  const hook = () => ({
    data: props.data || [],
    total: props.total || 0,
    isLoading: props.isLoading || false,
    isFetching: false,
    error: props.error ? { code: 'ERROR', message: props.error } : null,
    refetch: () => {} // No-op for now
  })
  
  const columns = props.columns.map(col => ({
    key: col.key,
    header: col.header,
    sortable: col.sortable,
    render: col.render
  }))
  
  return (
    <SSDataTable
      hook={hook}
      columns={columns}
      onRowClick={props.onRowClick}
    />
  )
}

// Simple Form component
const Form: UIAdapter['Form'] = ({ fields, values, errors, isSubmitting, onSubmit, onChange }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(values || {})
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-2">
            {field.label}{field.required && ' *'}
          </label>
          {field.helpText && (
            <p className="text-sm text-neutral-600 mb-2">{field.helpText}</p>
          )}
          
          {field.type === 'textarea' ? (
            <Textarea
              value={String(values?.[field.name] || '')}
              onChange={(v) => onChange?.(field.name, v)}
              placeholder={field.placeholder}
            />
          ) : field.type === 'checkbox' ? (
            <Checkbox
              checked={Boolean(values?.[field.name])}
              onChange={(v) => onChange?.(field.name, v)}
            />
          ) : field.type === 'select' ? (
            <Select
              options={field.options || []}
              value={String(values?.[field.name] || '')}
              onChange={(v) => onChange?.(field.name, v)}
              placeholder={field.placeholder}
            />
          ) : (
            <Input
              type={field.type === 'number' ? 'number' : 'text'}
              value={String(values?.[field.name] || '')}
              onChange={(v) => onChange?.(field.name, v)}
              placeholder={field.placeholder}
            />
          )}
          
          {errors?.[field.name] && (
            <p className="text-error-500 text-sm mt-1">{errors[field.name]}</p>
          )}
        </div>
      ))}
      
      <ButtonWrapper type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </ButtonWrapper>
    </form>
  )
}

// Simple Modal
const Modal: UIAdapter['Modal'] = ({ open, title, onClose, children }) => {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
        {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
        {children}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 border rounded hover:bg-neutral-50"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// Simple Toast
const Toast: UIAdapter['Toast'] = ({ variant, message, onClose }) => (
  <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
    variant === 'success' ? 'bg-success-50 text-success-900 border-success-200' :
    variant === 'error' ? 'bg-error-50 text-error-900 border-error-200' :
    'bg-neutral-50 text-neutral-900 border-neutral-200'
  } border`}>
    {message}
    {onClose && (
      <button onClick={onClose} className="ml-4 text-sm underline">
        Dismiss
      </button>
    )}
  </div>
)

// Simple Skeleton
const Skeleton: UIAdapter['Skeleton'] = ({ width, height, circle }) => (
  <div
    className={`bg-neutral-200 animate-pulse ${circle ? 'rounded-full' : 'rounded'}`}
    style={{ width, height }}
  />
)

// Simple Spinner
const Spinner: UIAdapter['Spinner'] = ({ size = 'md' }) => {
  const sizeClass = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }[size]
  
  return (
    <div className={`${sizeClass} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
  )
}

// ============================================================================
// Export Adapter
// ============================================================================

export const InternalUIAdapter: UIAdapter = {
  // Wrapped components
  Avatar: AvatarWrapper,
  Badge: BadgeWrapper,
  Button: ButtonWrapper,
  Card: CardWrapper,
  
  // Simple wrappers
  Input,
  Select,
  Checkbox,
  Textarea,
  
  // Complex components
  DataTable: DataTableWrapper,
  Form,
  Modal,
  Toast,
  Skeleton,
  Spinner
}

